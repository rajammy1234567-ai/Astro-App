const User = require('../models/User');
const { sendNotificationEmail } = require('./emailService');

const pushNotification = async (userId, { type, title, message, data = {} }) => {
  const notification = {
    type,
    title,
    message,
    data,
    read: false,
    createdAt: new Date(),
  };

  await User.findByIdAndUpdate(userId, {
    $push: { notifications: { $each: [notification], $position: 0 } },
  });

  const user = await User.findById(userId).select('email');
  if (user?.email) {
    try {
      await sendNotificationEmail(user.email, title, message);
    } catch (err) {
      console.warn('Notification email failed:', err.message);
    }
  }

  return notification;
};

module.exports = { pushNotification };