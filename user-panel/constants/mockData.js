export const USER = {
  name: 'Sunaina',
  fullName: 'Sunaina Sharma',
  phone: '628xxx684',
  image: 'https://i.pravatar.cc/150?img=47',
};

export const BANNERS = [
  { id: '1', title: '100% CASHBACK!', subtitle: 'on your first recharge', button: 'RECHARGE NOW' },
];

export const CATEGORIES = [
  { id: 'horoscope', label: 'Daily Horoscope', icon: 'sunny-outline', route: '/kundli' },
  { id: 'kundli', label: 'Free Kundli', icon: 'grid-outline', route: '/kundli' },
  { id: 'gemstones', label: 'Gemstones', icon: 'diamond-outline', route: '/store' },
  { id: 'matching', label: 'Kundli Matching', icon: 'heart-outline', route: '/kundli' },
  { id: 'blog', label: 'Astrology Blog', icon: 'book-outline', route: '/blog' },
];

export const FILTERS = [
  { id: 'all', label: 'All', icon: 'grid' },
  { id: 'new', label: 'NEW!', icon: 'time', color: '#E0F7FA' },
  { id: 'love', label: 'Love', icon: 'heart', color: '#FFF' },
  { id: 'career', label: 'Career', icon: 'briefcase', color: '#FFF' },
];

export const ASTROLOGERS = [
  {
    _id: '1', name: 'Nilanjik', image: 'https://i.pravatar.cc/150?img=11',
    specialty: 'Vedic', languages: ['Hindi', 'English'], experience: 12, orders: 5000,
    rating: 4.9, pricePerMin: 50, isOnline: true, isVerified: true, badge: 'Celebrity',
    chatEnabled: true, callEnabled: true,
  },
  {
    _id: '2', name: 'Himant', image: 'https://i.pravatar.cc/150?img=12',
    specialty: 'Vedic, Tarot', languages: ['Hindi', 'English'], experience: 8, orders: 3200,
    rating: 4.8, pricePerMin: 31, isOnline: true, isVerified: true, badge: 'Celebrity',
    chatEnabled: true, callEnabled: true,
  },
  {
    _id: '3', name: 'Vishvesh', image: 'https://i.pravatar.cc/150?img=15',
    specialty: 'Vedic', languages: ['Hindi'], experience: 15, orders: 8900,
    rating: 4.9, pricePerMin: 23, isOnline: true, isVerified: true, badge: 'Top Choice',
    chatEnabled: true, callEnabled: true,
  },
  {
    _id: '4', name: 'Bibhushan', image: 'https://i.pravatar.cc/150?img=13',
    specialty: 'Vedic, AI Astrologer', languages: ['English', 'Hindi'], experience: 14, orders: 1200,
    rating: 5, pricePerMin: 19, originalPrice: 24, isOnline: true, isVerified: true,
    specialOffer: true, chatEnabled: true, callEnabled: true,
  },
  {
    _id: '5', name: 'Richal', image: 'https://i.pravatar.cc/150?img=5',
    specialty: 'Tarot', languages: ['English', 'Hindi', 'Assamese'], experience: 3, orders: 1100,
    rating: 5, pricePerMin: 17, isOnline: true, isVerified: true,
    chatEnabled: true, callEnabled: true,
  },
  {
    _id: '6', name: 'Kuchit', image: 'https://i.pravatar.cc/150?img=8',
    specialty: 'Vedic, Life Coach', languages: ['Hindi'], experience: 1, orders: 800,
    rating: 5, pricePerMin: 13, originalPrice: 16, isNew: true, isOnline: true, isVerified: true,
    specialOffer: true, chatEnabled: true, callEnabled: true,
  },
  {
    _id: '7', name: 'Rupansh', image: 'https://i.pravatar.cc/150?img=14',
    specialty: 'Vedic, Life Coach', languages: ['English', 'Hindi'], experience: 2, orders: 50,
    rating: 5, pricePerMin: 14, isNew: true, isOnline: true, isVerified: true,
    chatEnabled: true, callEnabled: true,
  },
  {
    _id: '8', name: 'Mithilesh', image: 'https://i.pravatar.cc/150?img=16',
    specialty: 'Vedic', languages: ['English', 'Hindi'], experience: 2, orders: 5200,
    rating: 5, pricePerMin: 19, originalPrice: 24, isOnline: true, isVerified: true,
    specialOffer: true, chatEnabled: true, callEnabled: true,
  },
  {
    _id: '9', name: 'Nipun', image: 'https://i.pravatar.cc/150?img=18',
    specialty: 'Tarot', languages: ['English', 'Hindi'], experience: 7, orders: 10500,
    rating: 5, pricePerMin: 18, isOnline: true, isVerified: true, waitTime: '8m',
    chatEnabled: true, callEnabled: true,
  },
];

export const PRODUCTS = [
  { _id: '1', name: 'Bracelets', price: 499, category: 'jewelry', image: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=200&h=200&fit=crop' },
  { _id: '2', name: 'Rudraksha', price: 899, category: 'rudraksha', image: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=200&h=200&fit=crop' },
  { _id: '3', name: 'Gemstones', price: 1999, category: 'gemstones', image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=200&h=200&fit=crop' },
  { _id: '4', name: 'Gemstone Consultation', price: 299, category: 'consultation', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop' },
];

export const BLOGS = [
  {
    _id: '1',
    title: 'How Astrotalk Is Using AI to Become a Smarter, More Trusted Platform',
    excerpt: 'Artificial intelligence is transforming astrology consultations for millions of users.',
    category: 'Technology',
    author: 'Astrologer Anshika', date: 'Nov 14, 2025', views: '96754',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop',
  },
  {
    _id: '2',
    title: 'Mars in Scorpio: Why Does Winning Seem to Be All You Want?',
    excerpt: 'Mars transit effects on ambition, relationships and personal growth.',
    category: 'Planets',
    author: 'Astrologer Anshika', date: 'Nov 06', views: '24500',
    image: 'https://images.unsplash.com/photo-1614728894747-a83421e2d0f9?w=400&h=300&fit=crop',
  },
];

export const NEWS = [
  {
    id: '1',
    title: "Astrotalk's E-commerce Venture Crosses ₹140 Crore in First Full Year ...",
    source: 'Opportunity India', date: '19 Jan 2026',
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=300&fit=crop',
  },
  {
    id: '2',
    title: 'Astrotalk Distribu Support Underpr',
    source: 'The CSR Universe', date: 'Jan 2026',
    image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&h=300&fit=crop',
  },
];

export const DRAWER_MENU = [
  { label: 'Home', icon: 'home-outline', route: '/(tabs)/home' },
  { label: 'Become an Astrologer', icon: 'star-outline', route: '/become-astrologer', badge: 'New' },
  { label: 'Book a Pooja', icon: 'flame-outline', route: '/pooja', badge: 'New' },
  { label: 'Customer Support Chat', icon: 'headset-outline', route: '/support' },
  { label: 'Wallet Transactions', icon: 'wallet-outline', route: '/wallet/transactions' },
  { label: 'Redeem Gift Card', icon: 'gift-outline', route: '/wallet/gift-card' },
  { label: 'Order History', icon: 'time-outline', route: '/orders' },
  { label: 'Chat & Call History', icon: 'chatbox-ellipses-outline', route: '/sessions' },
  { label: 'Gemstones', icon: 'diamond-outline', route: '/store' },
  { label: 'AstroRemedy', icon: 'medical-outline', route: '/(tabs)/remedies' },
  { label: 'Astrology Blog', icon: 'newspaper-outline', route: '/blog' },
  { label: 'Chat with Astrologers', icon: 'chatbubbles-outline', route: '/(tabs)/chat' },
  { label: 'My Active Chats', icon: 'chatbubble-ellipses-outline', route: '/sessions' },
  { label: 'Video Testimonials', icon: 'play-circle-outline', route: '/testimonials' },
  { label: 'My Following', icon: 'people-outline', route: '/following' },
  { label: 'My Kundli', icon: 'planet-outline', route: '/kundli' },
  { label: 'Free Services', icon: 'sparkles-outline', route: '/free-services' },
  { label: 'About Us', icon: 'information-circle-outline', route: '/about' },
  { label: 'Privacy Policy', icon: 'shield-checkmark-outline', route: '/privacy' },
  { label: 'Settings', icon: 'settings-outline', route: '/settings' },
];

export const POOJA_SERVICES = [
  { _id: '1', name: 'Grahan Dosh Shanti Pooja', duration: '2 hours', price: 2100, icon: 'flame-outline' },
  { _id: '2', name: 'Guru Chandal Dosh Nivaran', duration: '1.5 hours', price: 1500, icon: 'planet-outline' },
  { _id: '3', name: 'Loan (Karz) Mukti Pooja', duration: '2 hours', price: 2500, icon: 'cash-outline' },
  { _id: '4', name: 'Pitra Dosh Shanti', duration: '3 hours', price: 3100, icon: 'flower-outline' },
];

export const TRANSACTIONS = [];

export const SUPPORT_FAQS = [
  { _id: '1', question: 'How do I recharge my wallet?', answer: 'Go to Wallet, tap Add Money, and choose an amount.' },
  { _id: '2', question: 'How do I chat with an astrologer?', answer: 'Browse astrologers on the Chat tab and start a consultation.' },
];

export const TOP_SELLING = [
  { id: '1', label: 'Relationship Healing', image: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=200&h=200&fit=crop' },
  { id: '2', label: 'Evil Eye (Nazar Lagna)', image: 'https://images.unsplash.com/photo-1611080626919-7a1aa6a212ac?w=200&h=200&fit=crop' },
  { id: '3', label: 'Attract Your Love Spell', image: 'https://images.unsplash.com/photo-1522673606300-984118ff64ca?w=200&h=200&fit=crop' },
  { id: '4', label: 'Career Success', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop' },
];

export const NEWLY_LAUNCHED = [
  { id: '1', label: 'Grahan Dosh Shanti Pooja', image: 'https://images.unsplash.com/photo-1564414029828-fac63c12d0b8?w=200&h=200&fit=crop' },
  { id: '2', label: 'Guru Chandal Dosh Nivaran', image: 'https://images.unsplash.com/photo-1548013146-72479768bada?w=200&h=200&fit=crop' },
  { id: '3', label: 'Loan(Karz) Mukti Pooja', image: 'https://images.unsplash.com/photo-1583391734529-41e9444d8d3d?w=200&h=200&fit=crop' },
  { id: '4', label: 'Pitra Dosh Shanti', image: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=200&h=200&fit=crop' },
];

export const WALLET_AMOUNTS = [100, 200, 500, 1000, 2000, 5000];