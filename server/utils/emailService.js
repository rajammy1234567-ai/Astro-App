const nodemailer = require('nodemailer');

const isEmailConfigured = () => !!(process.env.SMTP_USER && process.env.SMTP_PASS);

let transporter = null;

const getTransporter = () => {
  if (!isEmailConfigured()) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
};

const sendOtpEmail = async (to, otp) => {
  const transport = getTransporter();
  if (!transport) {
    throw new Error('Gmail SMTP not configured. Add SMTP_USER and SMTP_PASS in .env');
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const appName = process.env.APP_NAME || 'Astrotalk';
  const expiry = process.env.OTP_EXPIRY_MINUTES || '10';

  await transport.sendMail({
    from: `"${appName}" <${from}>`,
    to,
    subject: `${appName} — Your Login OTP`,
    text: `Your OTP is ${otp}. Valid for ${expiry} minutes. Do not share with anyone.`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;">
        <div style="background:#FDB913;border-radius:12px;padding:20px;text-align:center;margin-bottom:20px;">
          <h1 style="margin:0;color:#1A1A1A;font-size:22px;">${appName}</h1>
        </div>
        <p style="color:#333;font-size:15px;">Your one-time password for login:</p>
        <div style="background:#f8fafc;border:2px dashed #FDB913;border-radius:10px;padding:20px;text-align:center;margin:20px 0;">
          <span style="font-size:32px;font-weight:800;letter-spacing:8px;color:#1A1A1A;">${otp}</span>
        </div>
        <p style="color:#666;font-size:13px;">This OTP is valid for <strong>${expiry} minutes</strong>. Never share it with anyone.</p>
        <p style="color:#999;font-size:11px;margin-top:24px;">If you didn't request this, ignore this email.</p>
      </div>
    `,
  });

  return true;
};

const sendNotificationEmail = async (to, subject, body) => {
  const transport = getTransporter();
  if (!transport) return false;

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const appName = process.env.APP_NAME || 'Astrotalk';

  await transport.sendMail({
    from: `"${appName}" <${from}>`,
    to,
    subject: `${appName} — ${subject}`,
    text: body,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;">
        <div style="background:#FDB913;border-radius:12px;padding:16px;text-align:center;margin-bottom:20px;">
          <h2 style="margin:0;color:#1A1A1A;">${appName}</h2>
        </div>
        <h3 style="color:#1A1A1A;">${subject}</h3>
        <p style="color:#444;font-size:15px;line-height:1.6;white-space:pre-line;">${body}</p>
      </div>
    `,
  });

  return true;
};

module.exports = { isEmailConfigured, sendOtpEmail, sendNotificationEmail };