/**
 * Ensure published astrologers + blogs are visible for the user app.
 * Run: node scripts/fix-demo-visibility.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Astrologer = require('../models/Astrologer');
const Blog = require('../models/Blog');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);

  const demoPhones = ['9876543210', '9876543211', '9876543212', '9876543213', '9876543214'];

  const a1 = await Astrologer.updateMany(
    { phone: { $in: demoPhones } },
    { $set: { isPublished: true, isOnline: true, isBlocked: false } }
  );

  // Any published but offline → still keep published; set demo ones online
  const a2 = await Astrologer.updateMany(
    { isPublished: true, isBlocked: true },
    { $set: { isBlocked: false } }
  );

  let blogCount = await Blog.countDocuments({ isPublished: true });
  if (blogCount === 0) {
    await Blog.insertMany([
      {
        title: 'How Astrology Guides Your Daily Life',
        excerpt: 'Simple tips from Vedic astrology for everyday decisions.',
        content:
          'Astrology helps you understand timing, relationships and career. Talk to verified astrologers on AstroTalk for personal guidance.',
        category: 'Astrology',
        author: 'Astrologer Anshika',
        views: '1200',
        image:
          'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=400&h=300&fit=crop',
        isPublished: true,
      },
      {
        title: 'Understanding Your Birth Chart',
        excerpt: 'What Lagna, Moon and Dasha mean for you.',
        content:
          'Your Janam Kundli maps planets at birth. Lagna shows personality, Moon shows mind, and Dasha shows life periods.',
        category: 'Kundli',
        author: 'AstroTalk',
        views: '890',
        image:
          'https://images.unsplash.com/photo-1502134529125-ada3a4e19fbb?w=400&h=300&fit=crop',
        isPublished: true,
      },
      {
        title: 'Remedies That Actually Help',
        excerpt: 'Mantra, pooja and gemstone basics.',
        content:
          'Remedies work best when matched to your chart. Book a consultation or pooja with our partners.',
        category: 'Remedies',
        author: 'AstroTalk',
        views: '640',
        image:
          'https://images.unsplash.com/photo-1564414029828-fac63c12d0b8?w=400&h=300&fit=crop',
        isPublished: true,
      },
    ]);
  } else {
    await Blog.updateMany({}, { $set: { isPublished: true } });
  }

  blogCount = await Blog.countDocuments({ isPublished: true });
  const aCount = await Astrologer.countDocuments({ isPublished: true, isBlocked: { $ne: true } });

  console.log(
    JSON.stringify(
      {
        demoAstrosUpdated: a1.modifiedCount,
        unblocked: a2.modifiedCount,
        publishedAstrologers: aCount,
        publishedBlogs: blogCount,
      },
      null,
      2
    )
  );

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
