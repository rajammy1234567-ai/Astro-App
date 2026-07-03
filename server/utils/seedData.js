const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const Astrologer = require('../models/Astrologer');
const AstrologerApplication = require('../models/AstrologerApplication');
const Blog = require('../models/Blog');
const News = require('../models/News');
const Product = require('../models/Product');
const Pooja = require('../models/Pooja');
const SupportFaq = require('../models/SupportFaq');
const Testimonial = require('../models/Testimonial');
const FreeService = require('../models/FreeService');
const GiftCard = require('../models/GiftCard');
const Admin = require('../models/Admin');
const Chat = require('../models/Chat');

const PANEL_URL = process.env.ASTRO_PANEL_URL || 'astro-app://login';
const SEED_MARKER = path.join(__dirname, '..', '.data', '.seed-complete');

const APPROVED_DUMMY_ASTROLOGERS = [
  {
    userPhone: '9000000001', userName: 'Sunaina Sharma', userEmail: 'sunaina@demo.com',
    name: 'Nilanjik', phone: '9876543210', password: 'astro123',
    image: 'https://i.pravatar.cc/150?img=11',
    specialty: 'Vedic', languages: ['Hindi', 'English'], experience: 12, orders: 5000,
    rating: 4.9, pricePerMin: 50, isOnline: true, isVerified: true, badge: 'Celebrity',
    chatEnabled: true, callEnabled: true, isPublished: true,
  },
  {
    userPhone: '9000000002', userName: 'Rahul Verma', userEmail: 'rahul@demo.com',
    name: 'Himant', phone: '9876543211', password: 'astro123',
    image: 'https://i.pravatar.cc/150?img=12',
    specialty: 'Vedic, Tarot', languages: ['Hindi', 'English'], experience: 8, orders: 3200,
    rating: 4.8, pricePerMin: 31, isOnline: true, isVerified: true, badge: 'Celebrity',
    chatEnabled: true, callEnabled: true, isPublished: true,
  },
  {
    userPhone: '9000000003', userName: 'Priya Patel', userEmail: 'priya@demo.com',
    name: 'Vishvesh', phone: '9876543212', password: 'astro123',
    image: 'https://i.pravatar.cc/150?img=15',
    specialty: 'Vedic', languages: ['Hindi'], experience: 15, orders: 8900,
    rating: 4.9, pricePerMin: 23, isOnline: true, isVerified: true, badge: 'Top Choice',
    chatEnabled: true, callEnabled: true, isPublished: true,
  },
  {
    userPhone: '9000000004', userName: 'Anjali Singh', userEmail: 'anjali@demo.com',
    name: 'Richal', phone: '9876543213', password: 'astro123',
    image: 'https://i.pravatar.cc/150?img=5',
    specialty: 'Tarot', languages: ['English', 'Hindi'], experience: 3, orders: 1100,
    rating: 5, pricePerMin: 17, isOnline: true, isVerified: true,
    chatEnabled: true, callEnabled: true, isPublished: true,
  },
  {
    userPhone: '9000000005', userName: 'Amit Kumar', userEmail: 'amit@demo.com',
    name: 'Nipun', phone: '9876543214', password: 'astro123',
    image: 'https://i.pravatar.cc/150?img=18',
    specialty: 'Tarot', languages: ['English', 'Hindi'], experience: 7, orders: 10500,
    rating: 5, pricePerMin: 18, isOnline: false, isVerified: true, waitTime: '8m',
    chatEnabled: true, callEnabled: true, isPublished: false,
  },
];

const PRODUCTS = [
  {
    name: 'Bracelets', price: 499,
    description: 'Authentic energized bracelets for daily protection and positivity.',
    image: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=200&h=200&fit=crop',
    category: 'jewelry', stock: 50, isFeatured: true, isNewLaunch: false,
  },
  {
    name: 'Rudraksha', price: 899,
    description: 'Certified Rudraksha beads blessed by expert pandits.',
    image: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=200&h=200&fit=crop',
    category: 'rudraksha', stock: 30, isFeatured: true, isNewLaunch: false,
  },
  {
    name: 'Gemstones', price: 1999,
    description: 'Natural gemstones recommended by Vedic astrologers.',
    image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=200&h=200&fit=crop',
    category: 'gemstones', stock: 20, isFeatured: true, isNewLaunch: true,
  },
  {
    name: 'Gemstone Consultation', price: 299,
    description: '1-on-1 consultation to find your perfect gemstone remedy.',
    image: 'https://i.pravatar.cc/150?img=11',
    category: 'consultation', stock: 100, isFeatured: false, isNewLaunch: true,
  },
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

const seedApprovedAstrologers = async () => {
  const approvedCount = await Astrologer.countDocuments({ approvedViaApplication: true });
  if (approvedCount > 0) return;

  for (const data of APPROVED_DUMMY_ASTROLOGERS) {
    let user = await User.findOne({ phone: data.userPhone });
    if (!user) {
      user = await User.create({
        phone: data.userPhone,
        name: data.userName,
        email: data.userEmail,
        isVerified: true,
      });
      const walletExists = await Wallet.findOne({ user: user._id });
      if (!walletExists) await Wallet.create({ user: user._id, balance: 100 });
    }

    const existingAstro = await Astrologer.findOne({ phone: data.phone });
    if (existingAstro) continue;

    const astrologer = await Astrologer.create({
      name: data.name,
      phone: data.phone,
      password: data.password,
      email: data.userEmail,
      image: data.image,
      specialty: data.specialty,
      languages: data.languages,
      experience: data.experience,
      orders: data.orders,
      rating: data.rating,
      pricePerMin: data.pricePerMin,
      isOnline: data.isOnline,
      isVerified: data.isVerified,
      badge: data.badge,
      waitTime: data.waitTime,
      chatEnabled: data.chatEnabled,
      callEnabled: data.callEnabled,
      isPublished: data.isPublished,
      approvedViaApplication: true,
      user: user._id,
    });

    const appExists = await AstrologerApplication.findOne({ user: user._id, astrologer: astrologer._id });
    if (!appExists) {
      await AstrologerApplication.create({
        user: user._id,
        name: data.name,
        phone: data.phone,
        email: data.userEmail,
        specialty: data.specialty,
        experience: data.experience,
        languages: data.languages,
        bio: `Experienced ${data.specialty} astrologer`,
        status: 'selected',
        astrologer: astrologer._id,
        panelCredentials: { loginId: data.phone, password: data.password },
        interview: {
          date: '2026-07-01',
          day: 'Wednesday',
          time: '11:00 AM',
          googleMeetLink: 'https://meet.google.com/demo-astro-interview',
        },
      });
    }
  }

  console.log(`  - ${APPROVED_DUMMY_ASTROLOGERS.length} demo astrologers (first install only)`);
};

const seedDemoChats = async () => {
  const astro = await Astrologer.findOne({ phone: '9876543210' });
  if (!astro) return;

  const existing = await Chat.countDocuments({ astrologer: astro._id });
  if (existing > 0) return;

  const customers = [
    { phone: '9111111111', name: 'Riya Kapoor', email: 'riya.chat@demo.com' },
    { phone: '9222222222', name: 'Amit Singh', email: 'amit.chat@demo.com' },
  ];

  for (const c of customers) {
    let user = await User.findOne({ phone: c.phone });
    if (!user) {
      user = await User.findOne({ email: c.email });
    }
    if (!user) {
      user = await User.create({ phone: c.phone, name: c.name, email: c.email, isVerified: true });
    }
  }

  const riya = await User.findOne({ phone: '9111111111' });
  const amit = await User.findOne({ phone: '9222222222' });

  await Chat.insertMany([
    {
      user: riya._id,
      astrologer: astro._id,
      type: 'chat',
      status: 'active',
      isActive: true,
      pricePerMin: astro.pricePerMin,
      startedAt: new Date(),
      lastTickAt: new Date(),
      freeSecondsRemaining: 0,
      paidSecondsRemaining: 600,
      messages: [
        { sender: 'user', content: 'Namaste! Mujhe career guidance chahiye.' },
        { sender: 'astrologer', content: 'Namaste Riya! Apni date of birth aur time bataiye.' },
        { sender: 'user', content: '15 Aug 1995, 10:30 AM, Delhi' },
      ],
    },
    {
      user: amit._id,
      astrologer: astro._id,
      type: 'chat',
      status: 'active',
      isActive: true,
      pricePerMin: astro.pricePerMin,
      startedAt: new Date(),
      lastTickAt: new Date(),
      freeSecondsRemaining: 45,
      paidSecondsRemaining: 0,
      messages: [
        { sender: 'user', content: 'Meri shaadi kab hogi?' },
        { sender: 'astrologer', content: 'Amit ji, aapka kundli dekh kar batata hoon.' },
      ],
    },
  ]);
  console.log('  - 2 demo chats (first install only)');
};

const hasSavedContent = async () => {
  const [products, blogs, news, poojas] = await Promise.all([
    Product.countDocuments(),
    Blog.countDocuments(),
    News.countDocuments(),
    Pooja.countDocuments(),
  ]);
  return products > 0 || blogs > 0 || news > 0 || poojas > 0;
};

const seedDatabase = async () => {
  await seedAdmin();

  if (fs.existsSync(SEED_MARKER) || await hasSavedContent()) {
    console.log('✅ Saved data found — admin uploads safe (no demo overwrite)');
    return;
  }

  if (process.env.SEED_DEMO_DATA === 'false') {
    fs.mkdirSync(path.dirname(SEED_MARKER), { recursive: true });
    fs.writeFileSync(SEED_MARKER, new Date().toISOString());
    console.log('✅ Fresh database — demo seed skipped (SEED_DEMO_DATA=false)');
    return;
  }

  await seedApprovedAstrologers();
  await seedDemoChats();

  await Product.insertMany(PRODUCTS);
  await Blog.insertMany(BLOGS);
  await News.insertMany(NEWS);
  await Pooja.insertMany(POOJAS);
  await SupportFaq.insertMany(SUPPORT_FAQS);
  await Testimonial.insertMany(TESTIMONIALS);
  await FreeService.insertMany(FREE_SERVICES);
  await GiftCard.insertMany(GIFT_CARDS);

  fs.mkdirSync(path.dirname(SEED_MARKER), { recursive: true });
  fs.writeFileSync(SEED_MARKER, new Date().toISOString());

  console.log('Database seeded (first install only):');
  console.log(`  - ${PRODUCTS.length} demo products`);
  console.log(`  - ${BLOGS.length} demo blogs`);
  console.log(`  - ${NEWS.length} demo news items`);
};

module.exports = seedDatabase;