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

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
      return res.status(400).json({ message: 'Valid email address required' });
    }
    if (!name?.trim() || name.trim().length < 2) {
      return res.status(400).json({ message: 'Name is required (min 2 characters)' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing?.password) {
      return res.status(400).json({ message: 'Email already registered. Please login.' });
    }

    let user;
    let isNewUser = false;

    if (existing) {
      existing.name = name.trim();
      existing.password = password;
      existing.isVerified = true;
      // clear empty phone so unique sparse index never blocks
      if (!existing.phone) existing.phone = undefined;
      await existing.save();
      user = existing;
    } else {
      isNewUser = true;
      user = await User.create({
        email: normalizedEmail,
        name: name.trim(),
        password,
        isVerified: true,
      });
      const walletExists = await Wallet.findOne({ user: user._id });
      if (!walletExists) {
        await Wallet.create({ user: user._id, balance: 100 });
      }
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: 'Server JWT_SECRET missing — check server/.env' });
    }

    const token = generateToken(user._id);
    res.status(201).json({
      token,
      user: formatUser(user),
      isNewUser,
    });
  } catch (error) {
    console.error('register error:', error.code || '', error.message);
    // Duplicate key (email/phone unique)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || 'email';
      return res.status(400).json({
        message: field === 'email'
          ? 'Email already registered. Please login.'
          : `Could not create account (${field} already in use). Please try a different email.`,
      });
    }
    res.status(500).json({ message: error.message || 'Registration failed' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();

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
      return res.status(403).json({ message: user.blockReason || 'Your account has been blocked by admin.' });
    }

    const token = generateToken(user._id);
    res.json({
      token,
      user: formatUser(user),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const sendOtp = async (req, res) => {
  try {
    const { phone, email, loginType } = req.body;

    if (loginType === 'email' || email) {
      const normalizedEmail = email?.trim().toLowerCase();
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

    if (!phone || phone.length !== 10) {
      return res.status(400).json({ message: 'Valid 10-digit phone required' });
    }

    const result = await sendPhoneOtp(phone);
    res.json({
      message: 'OTP sent successfully',
      loginType: 'phone',
      phone,
      devOtp: result.devOtp,
    });
  } catch (error) {
    console.error('sendOtp error:', error.message);
    res.status(500).json({ message: error.message || 'Failed to send OTP' });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { phone, email, otp, loginType, name } = req.body;
    if (!otp) {
      return res.status(400).json({ message: 'OTP required' });
    }

    let identifier;
    let type;

    if (loginType === 'email' || email) {
      const normalizedEmail = email?.trim().toLowerCase();
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
        user = await User.create({
          email: identifier,
          name: name?.trim() || identifier.split('@')[0],
          isVerified: true,
        });
        await Wallet.create({ user: user._id, balance: 100 });
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
        await Wallet.create({ user: user._id, balance: 100 });
      }
    }

    const token = generateToken(user._id);
    res.json({
      token,
      user: formatUser(user),
      isNewUser,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const logout = async (req, res) => {
  res.json({ message: 'Logged out successfully' });
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-following');
    const wallet = await Wallet.findOne({ user: req.user._id });
    const orderCount = await require('../models/Order').countDocuments({ user: req.user._id });
    res.json({
      ...formatUser(user),
      balance: wallet?.balance ?? 0,
      orderCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, email, dateOfBirth, timeOfBirth, placeOfBirth, gender, avatar } = req.body;
    const user = await User.findById(req.user._id);
    if (name !== undefined) {
      const trimmed = String(name || '').trim();
      if (trimmed.length < 2) {
        return res.status(400).json({ message: 'Name min 2 characters' });
      }
      user.name = trimmed;
    }
    if (email !== undefined) {
      const normalizedEmail = email?.trim().toLowerCase();
      if (normalizedEmail && !isValidEmail(normalizedEmail)) {
        return res.status(400).json({ message: 'Valid email required' });
      }
      user.email = normalizedEmail || undefined;
    }
    if (dateOfBirth !== undefined) user.dateOfBirth = String(dateOfBirth || '').trim();
    if (timeOfBirth !== undefined) user.timeOfBirth = String(timeOfBirth || '').trim();
    if (placeOfBirth !== undefined) user.placeOfBirth = String(placeOfBirth || '').trim();
    if (gender !== undefined) {
      const g = String(gender || '').trim().toLowerCase();
      user.gender = ['male', 'female', 'other', ''].includes(g) ? g : '';
    }
    if (avatar !== undefined) user.avatar = avatar;
    await user.save();
    res.json(formatUser(user));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { register, login, sendOtp, verifyOtp, logout, getMe, updateProfile };