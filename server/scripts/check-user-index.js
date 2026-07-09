require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const indexes = await User.collection.indexes();
  console.log('indexes', JSON.stringify(indexes, null, 2));

  const total = await User.countDocuments();
  const nullPhone = await User.countDocuments({ phone: null });
  const emptyPhone = await User.countDocuments({ phone: '' });
  const noPhone = await User.countDocuments({ phone: { $exists: false } });
  console.log({ total, nullPhone, emptyPhone, noPhone });

  try {
    const email = `fix_${Date.now()}@test.com`;
    const u = await User.create({
      email,
      name: 'Fix Test',
      password: 'test123',
      isVerified: true,
    });
    console.log('CREATE_OK', u._id.toString());
    await User.deleteOne({ _id: u._id });
  } catch (e) {
    console.log('CREATE_ERR', e.code, e.message);
  }

  await mongoose.disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
