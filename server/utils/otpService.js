const Otp = require('../models/Otp');
const { isEmailConfigured, sendOtpEmail } = require('./emailService');

const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES || '10', 10);
const MAX_ATTEMPTS = 5;
const DEV_OTP = process.env.DEV_OTP || '123456';

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

const useDevOtp = (type) => {
  if (process.env.NODE_ENV === 'production') return false;
  if (type === 'email' && isEmailConfigured()) return false;
  return true;
};

const createAndStoreOtp = async (identifier, type) => {
  const otp = useDevOtp(type) ? DEV_OTP : generateOtp();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await Otp.deleteMany({ identifier, type });
  await Otp.create({ identifier, type, otp, expiresAt });

  return otp;
};

const sendEmailOtp = async (email) => {
  const normalized = email.trim().toLowerCase();
  const otp = await createAndStoreOtp(normalized, 'email');

  if (isEmailConfigured()) {
    await sendOtpEmail(normalized, otp);
    console.log(`OTP email sent to ${normalized}`);
    return { sent: true, viaEmail: true, devOtp: undefined };
  }

  console.log(`[DEV] OTP for ${normalized}: ${otp} (Gmail SMTP not configured)`);
  return {
    sent: true,
    viaEmail: false,
    devOtp: process.env.NODE_ENV !== 'production' ? otp : undefined,
  };
};

const sendPhoneOtp = async (phone) => {
  const otp = await createAndStoreOtp(phone, 'phone');
  console.log(`[DEV] OTP for +91${phone}: ${otp}`);
  return {
    sent: true,
    viaSms: false,
    devOtp: process.env.NODE_ENV !== 'production' ? otp : undefined,
  };
};

const verifyStoredOtp = async (identifier, type, inputOtp) => {
  if (useDevOtp(type) && inputOtp === DEV_OTP) {
    await Otp.deleteMany({ identifier, type });
    return { valid: true };
  }

  const record = await Otp.findOne({ identifier, type }).sort({ createdAt: -1 });
  if (!record) {
    return { valid: false, message: 'OTP expired or not found. Please request a new one.' };
  }

  if (record.expiresAt < new Date()) {
    await Otp.deleteOne({ _id: record._id });
    return { valid: false, message: 'OTP has expired. Please request a new one.' };
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    await Otp.deleteOne({ _id: record._id });
    return { valid: false, message: 'Too many attempts. Please request a new OTP.' };
  }

  if (record.otp !== inputOtp) {
    record.attempts += 1;
    await record.save();
    return { valid: false, message: `Invalid OTP. ${MAX_ATTEMPTS - record.attempts} attempts left.` };
  }

  await Otp.deleteOne({ _id: record._id });
  return { valid: true };
};

module.exports = {
  sendEmailOtp,
  sendPhoneOtp,
  verifyStoredOtp,
  isEmailConfigured: require('./emailService').isEmailConfigured,
};