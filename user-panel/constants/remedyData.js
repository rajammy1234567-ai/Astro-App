import { IMAGES } from './assets';

export const REMEDY_CATEGORIES = [
  { id: 'rudraksha', label: 'Rudraksha', icon: 'ellipse', color: '#5D4037', bg: '#EFEBE9' },
  { id: 'gemstone', label: 'Gemstones', icon: 'diamond', color: '#6A1B9A', bg: '#F3E5F5' },
  { id: 'yantra', label: 'Yantra', icon: 'grid', color: '#1565C0', bg: '#E3F2FD' },
  { id: 'pooja', label: 'Pooja', icon: 'flame', color: '#E65100', bg: '#FFF3E0' },
  { id: 'bracelet', label: 'Bracelets', icon: 'infinite', color: '#2E7D32', bg: '#E8F5E9' },
  { id: 'mala', label: 'Mala', icon: 'radio-button-on', color: '#C62828', bg: '#FFEBEE' },
  { id: 'crystal', label: 'Crystals', icon: 'sparkles', color: '#00838F', bg: '#E0F7FA' },
  { id: 'combo', label: 'Combos', icon: 'gift', color: '#AD1457', bg: '#FCE4EC' },
];

export const REMEDY_PROBLEMS = [
  { id: 'love', label: 'Love & Marriage', icon: 'heart', color: '#E91E63', bg: '#FCE4EC' },
  { id: 'career', label: 'Career', icon: 'briefcase', color: '#1565C0', bg: '#E3F2FD' },
  { id: 'wealth', label: 'Wealth', icon: 'cash', color: '#2E7D32', bg: '#E8F5E9' },
  { id: 'health', label: 'Health', icon: 'fitness', color: '#00897B', bg: '#E0F2F1' },
  { id: 'education', label: 'Education', icon: 'school', color: '#6A1B9A', bg: '#F3E5F5' },
  { id: 'family', label: 'Family', icon: 'people', color: '#EF6C00', bg: '#FFF3E0' },
];

export const REMEDY_SERVICES = [
  {
    id: 'rectification',
    title: 'Birth Time Rectification',
    subtitle: 'Get accurate Kundli',
    price: '₹999',
    image: IMAGES.remedyRectification,
    tag: 'Popular',
    tagColor: '#E91E63',
  },
  {
    id: 'regression',
    title: 'Past Life Regression',
    subtitle: 'Heal karmic patterns',
    price: '₹1,499',
    image: IMAGES.remedyRegression,
    tag: 'New',
    tagColor: '#1976D2',
  },
  {
    id: 'name',
    title: 'Name Correction',
    subtitle: 'Numerology guidance',
    price: '₹499',
    image: IMAGES.remedyName,
    tag: 'Starts ₹499',
    tagColor: '#E53935',
  },
  {
    id: 'vastu',
    title: 'Vastu Consultation',
    subtitle: 'Home & office energy',
    price: '₹799',
    image: IMAGES.remedyLake,
    tag: 'Trending',
    tagColor: '#F57C00',
  },
];

export const REMEDY_PRODUCTS = [
  {
    id: 'd1',
    name: '5 Mukhi Rudraksha',
    price: 499,
    mrp: 999,
    rating: 4.8,
    reviews: 1240,
    image: IMAGES.storeRudraksha,
    tag: 'Bestseller',
  },
  {
    id: 'd2',
    name: 'Yellow Sapphire Ring',
    price: 2499,
    mrp: 3999,
    rating: 4.9,
    reviews: 856,
    image: IMAGES.storeGemstone,
    tag: 'Premium',
  },
  {
    id: 'd3',
    name: 'Sphatik Mala 108 Beads',
    price: 699,
    mrp: 1199,
    rating: 4.7,
    reviews: 2103,
    image: IMAGES.remedyCosmic,
    tag: '40% OFF',
  },
  {
    id: 'd4',
    name: 'Money Magnet Bracelet',
    price: 399,
    mrp: 799,
    rating: 4.6,
    reviews: 3421,
    image: IMAGES.storeBracelet,
    tag: 'Hot',
  },
  {
    id: 'd5',
    name: 'Shree Yantra Copper',
    price: 899,
    mrp: 1499,
    rating: 4.8,
    reviews: 967,
    image: IMAGES.remedyCombo,
    tag: 'Verified',
  },
  {
    id: 'd6',
    name: 'Gemstone Consultation',
    price: 199,
    mrp: 499,
    rating: 4.9,
    reviews: 5400,
    image: IMAGES.storeConsult,
    tag: '1-on-1',
  },
];

export const REMEDY_POOJAS = [
  {
    id: 'p1',
    title: 'Satyanarayan Pooja',
    location: 'Online / Temple',
    price: '₹2,100',
    image: IMAGES.remedyPooja,
    badge: 'TRENDING',
  },
  {
    id: 'p2',
    title: 'Mahamrityunjaya Jaap',
    location: 'Performed by Pandits',
    price: '₹4,500',
    image: IMAGES.remedyLake,
    badge: 'POWERFUL',
  },
  {
    id: 'p3',
    title: 'Griha Pravesh Pooja',
    location: 'At your home',
    price: '₹3,500',
    image: IMAGES.remedyRegression,
    badge: 'NEW',
  },
];

export const REMEDY_STATS = [
  { num: '4.3L+', label: 'Orders' },
  { num: '4.8 ★', label: 'Rating' },
  { num: '7,600+', label: 'Experts' },
  { num: '100%', label: 'Authentic' },
];

export const REMEDY_OFFERS = [
  {
    id: 'o1',
    title: 'Rudraksha Expert Session',
    subtitle: 'Find your perfect Rudraksha in 1-on-1 call',
    price: '₹199 only',
    cta: 'Book Now',
    image: IMAGES.remedyRudraksha,
    accent: '#5D4037',
  },
  {
    id: 'o2',
    title: 'Remedy Combo Pack',
    subtitle: 'Get 2 powerful remedies @ special price',
    price: '₹1,100',
    cta: 'Grab Offer',
    image: IMAGES.remedyCombo,
    accent: '#C62828',
  },
];

export const REMEDY_TRUST = [
  { icon: 'shield-checkmark', label: 'Lab Certified' },
  { icon: 'refresh', label: '7-Day Return' },
  { icon: 'lock-closed', label: 'Secure Pay' },
  { icon: 'planet', label: 'Energized' },
];