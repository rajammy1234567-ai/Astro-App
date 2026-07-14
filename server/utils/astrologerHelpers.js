const AstrologerReview = require('../models/AstrologerReview');

const DEFAULT_PACKAGES = (pricePerMin) => [
  { minutes: 1, price: pricePerMin },
  { minutes: 10, price: pricePerMin * 10 },
  { minutes: 20, price: pricePerMin * 20 },
  { minutes: 30, price: pricePerMin * 30 },
];

const normalizePackages = (packages, pricePerMin = 20) => {
  if (!Array.isArray(packages) || packages.length === 0) {
    return DEFAULT_PACKAGES(pricePerMin);
  }
  return packages
    .filter((p) => p.minutes && p.price)
    .map((p) => ({ minutes: Number(p.minutes), price: Number(p.price) }))
    .sort((a, b) => a.minutes - b.minutes);
};

const recalcRating = async (astrologerId) => {
  const reviews = await AstrologerReview.find({ astrologer: astrologerId, isVisible: true });
  const Astrologer = require('../models/Astrologer');
  if (!reviews.length) return;
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  await Astrologer.findByIdAndUpdate(astrologerId, {
    rating: Math.round(avg * 10) / 10,
    orders: reviews.length,
  });
};

const formatPublicAstrologer = (astro, reviews = []) => {
  const obj = astro.toObject ? astro.toObject() : { ...astro };
  delete obj.password;
  const chatOnline = obj.chatOnline === true;
  const callOnline = obj.callOnline === true;
  const isOnline = chatOnline || callOnline || !!obj.isOnline;
  return {
    ...obj,
    chatOnline,
    callOnline,
    isOnline,
    pricingPackages: normalizePackages(obj.pricingPackages, obj.pricePerMin),
    gallery: (obj.gallery || []).slice(0, 12),
    reviews: reviews.filter((r) => r.isVisible !== false),
    reviewCount: reviews.filter((r) => r.isVisible !== false).length,
  };
};

module.exports = { DEFAULT_PACKAGES, normalizePackages, recalcRating, formatPublicAstrologer };