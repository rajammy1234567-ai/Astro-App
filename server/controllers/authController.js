const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const { sendEmailOtp, sendPhoneOtp, verifyStoredOtp } = require('../utils/otpService');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const { ageFromDob, hasCompleteBirthDetails } = require('../utils/birthDetails');

const formatUser = (user) => {
  const dateOfBirth = user.dateOfBirth || '';
  const age = ageFromDob(dateOfBirth);
  return {
    _id: user._id,
    name: user.name,
    phone: user.phone,
    email: user.email,
    avatar: user.avatar,
    isVerified: user.isVerified,
    dateOfBirth,
    timeOfBirth: user.timeOfBirth || '',
    placeOfBirth: user.placeOfBirth || '',
    gender: user.gender || '',
    age: age != null ? age : null,
    hasBirthDetails: hasCompleteBirthDetails(user),
  };
};

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());

const ensureWallet = async (userId) => {
  let wallet = await Wallet.findOne({ user: userId });
  if (!wallet) {
    wallet = await Wallet.create({ user: userId, balance: 100 });
  }
  return wallet;
};

/**
 * Create or complete email account.
 * Does NOT set phone (avoids sparse unique index collisions on null).
 */
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    const normalizedEmail = String(email || '')
      .trim()
      .toLowerCase();

    if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
      return res.status(400).json({ message: 'Valid email address required' });
    }
    if (!name || String(name).trim().length < 2) {
      return res.status(400).json({ message: 'Name is required (min 2 characters)' });
    }
    if (!password || String(password).length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: 'Server JWT_SECRET missing — check server/.env' });
    }

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing?.password) {
      return res.status(400).json({ message: 'Email already registered. Please login.' });
    }

    let user;
    let isNewUser = false;

    if (existing) {
      existing.name = String(name).trim();
      existing.password = String(password);
      existing.isVerified = true;
      // Never keep null phone — breaks unique sparse index
      if (existing.phone == null || existing.phone === '') {
        existing.phone = undefined;
        existing.set('phone', undefined);
      }
      await existing.save();
      user = existing;
      await ensureWallet(user._id);
    } else {
      isNewUser = true;
      user = new User({
        email: normalizedEmail,
        name: String(name).trim(),
        password: String(password),
        isVerified: true,
      });
      // Explicitly do not set phone field
      user.phone = undefined;
      await user.save();
      await ensureWallet(user._id);
    }

    // Re-fetch clean document
    user = await User.findById(user._id);
    if (!user) {
      return res.status(500).json({ message: 'Account created but could not load user. Please login.' });
    }

    const token = generateToken(user._id);
    return res.status(201).json({
      token,
      user: formatUser(user),
      isNewUser,
      message: isNewUser ? 'Account created successfully' : 'Account ready',
    });
  } catch (error) {
    console.error('register error:', error.code || '', error.message, error.stack);
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || 'email';
      if (field === 'phone') {
        // Self-heal null-phone index pollution and ask to retry
        try {
          await User.updateMany(
            { $or: [{ phone: null }, { phone: '' }] },
            { $unset: { phone: 1 } }
          );
        } catch {
          /* ignore */
        }
        return res.status(400).json({
          message: 'Could not create account due to a data conflict. Please try again once.',
        });
      }
      return res.status(400).json({
        message:
          field === 'email'
            ? 'Email already registered. Please login.'
            : `Could not create account (${field} already in use).`,
      });
    }
    return res.status(500).json({
      message: error.message || 'Registration failed. Please try again.',
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const normalizedEmail = String(email || '')
      .trim()
      .toLowerCase();

    if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
      return res.status(400).json({ message: 'Valid email address required' });
    }
    if (!password) {
      return res.status(400).json({ message: 'Password required' });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    if (user.isBlocked) {
      return res
        .status(403)
        .json({ message: user.blockReason || 'Your account has been blocked by admin.' });
    }
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: 'Server JWT_SECRET missing' });
    }

    const token = generateToken(user._id);
    return res.json({
      token,
      user: formatUser(user),
    });
  } catch (error) {
    console.error('login error:', error.message);
    return res.status(500).json({ message: error.message || 'Login failed' });
  }
};

const sendOtp = async (req, res) => {
  try {
    const { phone, email, loginType } = req.body || {};

    if (loginType === 'email' || email) {
      const normalizedEmail = String(email || '')
        .trim()
        .toLowerCase();
      if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
        return res.status(400).json({ message: 'Valid email address required' });
      }

      const result = await sendEmailOtp(normalizedEmail);
      return res.json({
        message: result.viaEmail
          ? 'OTP sent to your Gmail. Check inbox & spam folder.'
          : 'OTP generated (dev mode — Gmail SMTP not configured)',
        loginType: 'email',
        email: normalizedEmail,
        viaEmail: result.viaEmail,
        devOtp: result.devOtp,
      });
    }

    if (!phone || String(phone).length !== 10) {
      return res.status(400).json({ message: 'Valid 10-digit phone required' });
    }

    const result = await sendPhoneOtp(phone);
    return res.json({
      message: 'OTP sent successfully',
      loginType: 'phone',
      phone,
      devOtp: result.devOtp,
    });
  } catch (error) {
    console.error('sendOtp error:', error.message);
    return res.status(500).json({ message: error.message || 'Failed to send OTP' });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { phone, email, otp, loginType, name } = req.body || {};
    if (!otp) {
      return res.status(400).json({ message: 'OTP required' });
    }

    let identifier;
    let type;

    if (loginType === 'email' || email) {
      const normalizedEmail = String(email || '')
        .trim()
        .toLowerCase();
      if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
        return res.status(400).json({ message: 'Valid email required' });
      }
      identifier = normalizedEmail;
      type = 'email';
    } else {
      if (!phone) {
        return res.status(400).json({ message: 'Phone required' });
      }
      identifier = phone;
      type = 'phone';
    }

    const verification = await verifyStoredOtp(identifier, type, otp);
    if (!verification.valid) {
      return res.status(400).json({ message: verification.message || 'Invalid OTP' });
    }

    let user;
    let isNewUser = false;

    if (type === 'email') {
      user = await User.findOne({ email: identifier });
      if (!user) {
        isNewUser = true;
        user = new User({
          email: identifier,
          name: name?.trim() || 'User',
          isVerified: true,
        });
        user.phone = undefined;
        await user.save();
        await ensureWallet(user._id);
      } else {
        user.isVerified = true;
        if (name?.trim()) user.name = name.trim();
        if (user.phone == null || user.phone === '') {
          user.phone = undefined;
        }
        await user.save();
      }
    } else {
      user = await User.findOne({ phone: identifier });
      if (!user) {
        isNewUser = true;
        user = await User.create({
          phone: identifier,
          name: name?.trim() || 'User',
          isVerified: true,
        });
        await ensureWallet(user._id);
      } else {
        user.isVerified = true;
        if (name?.trim()) user.name = name.trim();
        await user.save();
      }
    }

    if (user.isBlocked) {
      return res
        .status(403)
        .json({ message: user.blockReason || 'Your account has been blocked by admin.' });
    }

    const token = generateToken(user._id);
    return res.json({
      token,
      user: formatUser(user),
      isNewUser,
    });
  } catch (error) {
    console.error('verifyOtp error:', error.code || '', error.message);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Account already exists. Please login.' });
    }
    return res.status(500).json({ message: error.message || 'OTP verification failed' });
  }
};

const logout = async (req, res) => {
  res.json({ message: 'Logged out' });
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(formatUser(user));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { name, avatar, dateOfBirth, timeOfBirth, placeOfBirth, gender, phone, email } =
      req.body || {};

    if (name != null) user.name = String(name).trim();
    if (avatar != null) user.avatar = avatar;
    if (dateOfBirth != null) user.dateOfBirth = String(dateOfBirth).trim();
    if (timeOfBirth != null) user.timeOfBirth = String(timeOfBirth).trim();
    if (placeOfBirth != null) user.placeOfBirth = String(placeOfBirth).trim();
    if (gender != null) {
      const g = String(gender).trim().toLowerCase();
      if (['male', 'female', 'other', ''].includes(g)) user.gender = g;
    }
    if (phone != null && String(phone).trim()) {
      user.phone = String(phone).trim();
    }
    if (email != null && String(email).trim()) {
      user.email = String(email).trim().toLowerCase();
    }

    // Avoid null phone pollution
    if (user.phone == null || user.phone === '') {
      user.phone = undefined;
      user.set('phone', undefined);
    }

    await user.save();
    res.json(formatUser(user));
  } catch (error) {
    console.error('updateProfile error:', error.code || '', error.message);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email or phone already in use' });
    }
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  register,
  login,
  sendOtp,
  verifyOtp,
  logout,
  getMe,
  updateProfile,
};
