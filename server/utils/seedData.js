const Astrologer = require('../models/Astrologer');
const Blog = require('../models/Blog');
const News = require('../models/News');
const Product = require('../models/Product');
const Pooja = require('../models/Pooja');
const SupportFaq = require('../models/SupportFaq');
const Testimonial = require('../models/Testimonial');
const FreeService = require('../models/FreeService');
const GiftCard = require('../models/GiftCard');
const Admin = require('../models/Admin');

const ASTROLOGERS = [
  {
    name: 'Nilanjik', image: 'https://i.pravatar.cc/150?img=11',
    specialty: 'Vedic', languages: ['Hindi', 'English'], experience: 12, orders: 5000,
    rating: 4.9, pricePerMin: 50, isOnline: true, isVerified: true, badge: 'Celebrity',
    chatEnabled: true, callEnabled: true,
  },
  {
    name: 'Himant', image: 'https://i.pravatar.cc/150?img=12',
    specialty: 'Vedic, Tarot', languages: ['Hindi', 'English'], experience: 8, orders: 3200,
    rating: 4.8, pricePerMin: 31, isOnline: true, isVerified: true, badge: 'Celebrity',
    chatEnabled: true, callEnabled: true,
  },
  {
    name: 'Vishvesh', image: 'https://i.pravatar.cc/150?img=15',
    specialty: 'Vedic', languages: ['Hindi'], experience: 15, orders: 8900,
    rating: 4.9, pricePerMin: 23, isOnline: true, isVerified: true, badge: 'Top Choice',
    chatEnabled: true, callEnabled: true,
  },
  {
    name: 'Bibhushan', image: 'https://i.pravatar.cc/150?img=13',
    specialty: 'Vedic, AI Astrologer', languages: ['English', 'Hindi'], experience: 14, orders: 1200,
    rating: 5, pricePerMin: 19, originalPrice: 24, isOnline: true, isVerified: true,
    specialOffer: true, chatEnabled: true, callEnabled: true,
  },
  {
    name: 'Richal', image: 'https://i.pravatar.cc/150?img=5',
    specialty: 'Tarot', languages: ['English', 'Hindi', 'Assamese'], experience: 3, orders: 1100,
    rating: 5, pricePerMin: 17, isOnline: true, isVerified: true,
    chatEnabled: true, callEnabled: true,
  },
  {
    name: 'Kuchit', image: 'https://i.pravatar.cc/150?img=8',
    specialty: 'Vedic, Life Coach', languages: ['Hindi'], experience: 1, orders: 800,
    rating: 5, pricePerMin: 13, originalPrice: 16, isNew: true, isOnline: true, isVerified: true,
    specialOffer: true, chatEnabled: true, callEnabled: true,
  },
  {
    name: 'Rupansh', image: 'https://i.pravatar.cc/150?img=14',
    specialty: 'Vedic, Life Coach', languages: ['English', 'Hindi'], experience: 2, orders: 50,
    rating: 5, pricePerMin: 14, isNew: true, isOnline: true, isVerified: true,
    chatEnabled: true, callEnabled: true,
  },
  {
    name: 'Mithilesh', image: 'https://i.pravatar.cc/150?img=16',
    specialty: 'Vedic', languages: ['English', 'Hindi'], experience: 2, orders: 5200,
    rating: 5, pricePerMin: 19, originalPrice: 24, isOnline: true, isVerified: true,
    specialOffer: true, chatEnabled: true, callEnabled: true,
  },
  {
    name: 'Nipun', image: 'https://i.pravatar.cc/150?img=18',
    specialty: 'Tarot', languages: ['English', 'Hindi'], experience: 7, orders: 10500,
    rating: 5, pricePerMin: 18, isOnline: true, isVerified: true, waitTime: '8m',
    chatEnabled: true, callEnabled: true,
  },
];

const PRODUCTS = [
  { name: 'Bracelets', price: 499, image: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=200&h=200&fit=crop', category: 'jewelry' },
  { name: 'Rudraksha', price: 899, image: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=200&h=200&fit=crop', category: 'rudraksha' },
  { name: 'Gemstones', price: 1999, image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=200&h=200&fit=crop', category: 'gemstones' },
  { name: 'Gemstone Consultation', price: 299, image: 'https://i.pravatar.cc/150?img=11', category: 'consultation' },
];

const BLOGS = [
  {
    title: 'How Astrotalk Is Using AI to Become a Smarter, More Trusted Platform',
    excerpt: 'Artificial intelligence is transforming astrology consultations for millions of users.',
    content: 'Artificial intelligence is transforming astrology consultations...',
    category: 'Technology',
    author: 'Astrologer Anshika', views: '96754',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop',
  },
  {
    title: 'Mars in Scorpio: Why Does Winning Seem to Be All You Want?',
    excerpt: 'Mars transit effects on ambition, relationships and personal growth.',
    content: 'Mars transit effects on ambition and relationships...',
    category: 'Planets',
    author: 'Astrologer Anshika', views: '24500',
    image: 'https://images.unsplash.com/photo-1614728894747-a83421e2d0f9?w=400&h=300&fit=crop',
  },
];

const NEWS = [
  {
    title: "Astrotalk's E-commerce Venture Crosses ₹140 Crore in First Full Year",
    source: 'Opportunity India',
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=300&fit=crop',
  },
  {
    title: 'Astrotalk Distributes Support for Underprivileged Communities',
    source: 'The CSR Universe',
    image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&h=300&fit=crop',
  },
];

const POOJAS = [
  { name: 'Grahan Dosh Shanti Pooja', duration: '2 hours', price: 2100, icon: 'flame-outline', description: 'Performed at sacred temple with live streaming' },
  { name: 'Guru Chandal Dosh Nivaran', duration: '1.5 hours', price: 1500, icon: 'planet-outline', description: 'Removes Guru Chandal dosha from your chart' },
  { name: 'Loan (Karz) Mukti Pooja', duration: '2 hours', price: 2500, icon: 'cash-outline', description: 'For financial freedom and debt relief' },
  { name: 'Pitra Dosh Shanti', duration: '3 hours', price: 3100, icon: 'flower-outline', description: 'Ancestral peace and family harmony' },
  { name: 'Satyanarayan Katha', duration: '4 hours', price: 1800, icon: 'book-outline', description: 'Prosperity and well-being pooja' },
  { name: 'Mangal Dosh Nivaran', duration: '2 hours', price: 2200, icon: 'heart-outline', description: 'For marriage and relationship harmony' },
];

const SUPPORT_FAQS = [
  { question: 'How do I recharge my wallet?', answer: 'Go to Wallet from the home screen, tap Add Money, and choose an amount. Payment is instant in dev mode.', category: 'wallet', order: 1 },
  { question: 'How do I chat with an astrologer?', answer: 'Browse astrologers on the Chat tab, select one, and start a consultation. Charges are deducted per minute from your wallet.', category: 'chat', order: 2 },
  { question: 'Can I get a refund?', answer: 'Refunds for failed consultations are credited back to your wallet within 24 hours. Contact support for store order refunds.', category: 'refund', order: 3 },
  { question: 'How do I book an online pooja?', answer: 'Open Book a Pooja from the menu, select a pooja service, and tap Book. Amount is deducted from your wallet.', category: 'pooja', order: 4 },
  { question: 'What is the dev OTP?', answer: 'In development mode, use OTP 123456 to login with any 10-digit phone number.', category: 'account', order: 5 },
];

const TESTIMONIALS = [
  { name: 'Priya Sharma', location: 'Delhi', quote: 'The pooja was performed beautifully. I felt positive energy within days.', rating: 5, thumbnail: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
  { name: 'Rahul Verma', location: 'Mumbai', quote: 'Astrologer consultation was accurate and helpful for my career decisions.', rating: 5, thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
  { name: 'Anjali Patel', location: 'Ahmedabad', quote: 'Gemstone recommendation changed my life. Highly recommend AstroTalk!', rating: 4, thumbnail: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
];

const FREE_SERVICES = [
  { title: 'Free Kundli', description: 'Generate your birth chart instantly', icon: 'planet-outline', route: '/kundli', order: 1 },
  { title: 'Daily Horoscope', description: "Today's predictions for your rashi", icon: 'sunny-outline', route: '/kundli', order: 2 },
  { title: 'Panchang', description: 'Today\'s tithi, nakshatra and muhurat', icon: 'calendar-outline', route: '/kundli', order: 3 },
  { title: 'Numerology', description: 'Lucky numbers and name analysis', icon: 'calculator-outline', route: '/kundli', order: 4 },
  { title: 'Astrology Blog', description: 'Read free articles and insights', icon: 'newspaper-outline', route: '/blog', order: 5 },
  { title: 'Free Chat (1 min)', description: 'First minute free with select astrologers', icon: 'chatbubbles-outline', route: '/(tabs)/chat', order: 6 },
];

const GIFT_CARDS = [
  { code: 'ASTRO100', amount: 100 },
  { code: 'ASTRO500', amount: 500 },
  { code: 'WELCOME250', amount: 250 },
];

const seedAdmin = async () => {
  const adminCount = await Admin.countDocuments();
  if (adminCount > 0) return;
  await Admin.create({
    name: 'Super Admin',
    email: process.env.ADMIN_EMAIL || 'admin@astrotalk.com',
    password: process.env.ADMIN_PASSWORD || 'admin123',
    role: 'superadmin',
  });
  console.log('  - 1 admin account (admin@astrotalk.com / admin123)');
};

const seedDatabase = async () => {
  await seedAdmin();

  const astroCount = await Astrologer.countDocuments();
  if (astroCount > 0) {
    console.log('Database already seeded, skipping content seed...');
    return;
  }

  await Astrologer.insertMany(ASTROLOGERS);
  await Product.insertMany(PRODUCTS);
  await Blog.insertMany(BLOGS);
  await News.insertMany(NEWS);
  await Pooja.insertMany(POOJAS);
  await SupportFaq.insertMany(SUPPORT_FAQS);
  await Testimonial.insertMany(TESTIMONIALS);
  await FreeService.insertMany(FREE_SERVICES);
  await GiftCard.insertMany(GIFT_CARDS);

  console.log('Database seeded successfully!');
  console.log(`  - ${ASTROLOGERS.length} astrologers`);
  console.log(`  - ${PRODUCTS.length} products`);
  console.log(`  - ${BLOGS.length} blogs`);
  console.log(`  - ${NEWS.length} news items`);
  console.log(`  - ${POOJAS.length} pooja services`);
  console.log(`  - ${SUPPORT_FAQS.length} support FAQs`);
  console.log(`  - ${TESTIMONIALS.length} testimonials`);
  console.log(`  - ${FREE_SERVICES.length} free services`);
  console.log(`  - ${GIFT_CARDS.length} gift cards`);
};

module.exports = seedDatabase;