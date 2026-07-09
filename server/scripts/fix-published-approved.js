require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Astrologer = require('../models/Astrologer');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const r = await Astrologer.updateMany(
    { isPublished: true, approvedViaApplication: { $ne: true } },
    { $set: { approvedViaApplication: true } }
  );
  const online = await Astrologer.countDocuments({
    isPublished: true,
    isOnline: true,
    isBlocked: { $ne: true },
  });
  console.log('approved update modified:', r.modifiedCount);
  console.log('online published count:', online);
  await mongoose.disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
