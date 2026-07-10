export const SECTION_DEFAULTS = {
  astrologers: {
    name: '', specialty: '', pricePerMin: 20, experience: 1, rating: 5,
    image: '', badge: '', bio: '', isPublished: false, isOnline: true,
    isVerified: true, chatEnabled: true, callEnabled: true,
  },
  products: {
    name: '', description: '', price: 499, category: 'gemstones', image: '',
    stock: 10, isActive: true, isFeatured: false, isNewLaunch: false,
  },
  blogs: {
    title: '', excerpt: '', content: '', author: 'Astrologer Anshika',
    category: 'Astrology', image: '', views: '0', isPublished: true,
  },
  news: { title: '', source: '', image: '', isPublished: true },
  poojas: {
    name: '', description: '', duration: '2 hours', price: 1500,
    icon: 'flame-outline', isActive: true,
  },
  testimonials: {
    name: '', location: '', quote: '', rating: 5,
    thumbnail: '', videoUrl: '', isActive: true,
  },
  'support-faqs': {
    question: '', answer: '', category: 'general', order: 0,
  },
  'free-services': {
    title: '', description: '', icon: 'gift-outline', route: '/kundli',
    order: 0, isActive: true,
  },
  'gift-cards': { code: '', amount: 100 },
};

export const SECTION_FIELDS = {
  astrologers: [
    { key: 'name', label: 'Name', required: true },
    { key: 'specialty', label: 'Specialty' },
    { key: 'pricePerMin', label: 'Price per min (₹)', type: 'number', required: true },
    { key: 'experience', label: 'Experience (years)', type: 'number' },
    { key: 'rating', label: 'Rating', type: 'number' },
    { key: 'image', label: 'Image', type: 'image' },
    { key: 'badge', label: 'Badge (Celebrity, Top Choice)' },
    { key: 'bio', label: 'Bio', type: 'textarea' },
    { key: 'isPublished', label: 'Publish', type: 'checkbox', checkboxLabel: 'Show on User App (auto-approves)' },
    { key: 'isOnline', label: 'Online', type: 'checkbox', checkboxLabel: 'Show as online' },
    { key: 'isVerified', label: 'Verified', type: 'checkbox', checkboxLabel: 'Verified astrologer' },
    { key: 'chatEnabled', label: 'Chat', type: 'checkbox', checkboxLabel: 'Chat enabled' },
    { key: 'callEnabled', label: 'Call', type: 'checkbox', checkboxLabel: 'Call enabled' },
  ],
  products: [
    { key: 'name', label: 'Product Name', required: true },
    { key: 'price', label: 'Price (₹)', type: 'number', required: true },
    { key: 'stock', label: 'Stock Qty', type: 'number', required: true },
    { key: 'category', label: 'Category', type: 'select', options: [
      { value: 'jewelry', label: 'Jewelry' },
      { value: 'rudraksha', label: 'Rudraksha' },
      { value: 'gemstones', label: 'Gemstones' },
      { value: 'consultation', label: 'Consultation' },
      { value: 'yantra', label: 'Yantra' },
      { value: 'pooja-items', label: 'Pooja Items' },
    ]},
    { key: 'image', label: 'Image', type: 'image' },
    { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'isActive', label: 'Published', type: 'checkbox', checkboxLabel: 'Show in store (user app shop mein dikhega)' },
    { key: 'isFeatured', label: 'Top Selling', type: 'checkbox', checkboxLabel: 'Top Selling section' },
    { key: 'isNewLaunch', label: 'New Launch', type: 'checkbox', checkboxLabel: 'Newly Launched section' },
  ],
  blogs: [
    { key: 'title', label: 'Title', required: true },
    { key: 'excerpt', label: 'Excerpt', type: 'textarea' },
    { key: 'content', label: 'Content', type: 'textarea', rows: 5 },
    { key: 'author', label: 'Author' },
    { key: 'category', label: 'Category' },
    { key: 'views', label: 'Views' },
    { key: 'image', label: 'Image', type: 'image' },
    { key: 'isPublished', label: 'Published', type: 'checkbox', checkboxLabel: 'Show on User App' },
  ],
  news: [
    { key: 'title', label: 'Title', required: true },
    { key: 'source', label: 'Source' },
    { key: 'image', label: 'Image', type: 'image' },
    { key: 'isPublished', label: 'Published', type: 'checkbox', checkboxLabel: 'Show on User App' },
  ],
  poojas: [
    { key: 'name', label: 'Name', required: true },
    { key: 'duration', label: 'Duration' },
    { key: 'price', label: 'Price (₹)', type: 'number', required: true },
    { key: 'icon', label: 'Icon (Ionicons)' },
    { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'isActive', label: 'Active', type: 'checkbox', checkboxLabel: 'Available for booking' },
  ],
  testimonials: [
    { key: 'name', label: 'Name', required: true },
    { key: 'location', label: 'Location' },
    { key: 'rating', label: 'Rating', type: 'number' },
    { key: 'quote', label: 'Quote', type: 'textarea' },
    { key: 'thumbnail', label: 'Thumbnail', type: 'image' },
    { key: 'videoUrl', label: 'Video URL' },
    { key: 'isActive', label: 'Active', type: 'checkbox', checkboxLabel: 'Show on app' },
  ],
  'support-faqs': [
    { key: 'question', label: 'Question', required: true },
    { key: 'answer', label: 'Answer', type: 'textarea', rows: 4 },
    { key: 'category', label: 'Category', type: 'select', options: [
      { value: 'general', label: 'General' },
      { value: 'wallet', label: 'Wallet' },
      { value: 'chat', label: 'Chat' },
      { value: 'pooja', label: 'Pooja' },
      { value: 'refund', label: 'Refund' },
    ]},
    { key: 'order', label: 'Display Order', type: 'number' },
  ],
  'free-services': [
    { key: 'title', label: 'Title', required: true },
    { key: 'description', label: 'Description' },
    { key: 'icon', label: 'Icon (Ionicons)' },
    { key: 'route', label: 'App Route' },
    { key: 'order', label: 'Display Order', type: 'number' },
    { key: 'isActive', label: 'Active', type: 'checkbox', checkboxLabel: 'Show in app' },
  ],
  'gift-cards': [
    { key: 'code', label: 'Gift Card Code', required: true, placeholder: 'ASTRO100' },
    { key: 'amount', label: 'Amount (₹)', type: 'number', required: true },
  ],
};

export function buildFormFromItem(sectionId, item) {
  const defaults = SECTION_DEFAULTS[sectionId] || {};
  const fields = SECTION_FIELDS[sectionId] || [];
  const form = { ...defaults };
  if (!item || typeof item !== 'object') return form;
  fields.forEach((f) => {
    const val = item[f.key];
    if (f.type === 'number') form[f.key] = val != null ? String(val) : String(defaults[f.key] ?? '');
    else if (f.type === 'checkbox') form[f.key] = !!val;
    else form[f.key] = val ?? defaults[f.key] ?? '';
  });
  return form;
}

export function buildPayload(sectionId, form) {
  const fields = SECTION_FIELDS[sectionId] || [];
  const payload = { ...form };
  fields.forEach((f) => {
    if (f.type === 'number') payload[f.key] = Number(payload[f.key]) || 0;
    if (f.type === 'checkbox') payload[f.key] = !!payload[f.key];
  });
  // Publishing an astrologer also marks them approved for the user app
  if (sectionId === 'astrologers' && payload.isPublished === true) {
    payload.approvedViaApplication = true;
  }
  return payload;
}