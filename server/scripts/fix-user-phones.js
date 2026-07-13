require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);

  // Sparse unique index treats multiple `null` phones as duplicates — remove null/empty
  const r = await User.updateMany(
    { $or: [{ phone: null }, { phone: '' }] },
    { $unset: { phone: 1 } }
  );
  console.log('unset phone on users:', r.modifiedCount);

  const email = `app${Date.now()}@gmail.com`;
  try {
    const u = await User.create({
      email,
      name: 'App Test',
      password: 'test123',
      isVerified: true,
    });
    console.log('create ok', u._id.toString(), email);
  } catch (e) {
    console.log('create fail', e.code, e.message);
  }

  await mongoose.disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
