export const SECTION_GROUPS = [
  {
    title: 'Management',
    items: [
      { id: 'users', title: 'Users', icon: '👥', endpoint: '/users', mode: 'users' },
      { id: 'astrologers', title: 'Astrologers', icon: '🔮', endpoint: '/astrologers', mode: 'crud', allowCreate: false },
      { id: 'astrologer-applications', title: 'Applications', icon: '📋', endpoint: '/astrologer-applications', mode: 'applications' },
      { id: 'products', title: 'Products', icon: '🛍️', endpoint: '/products', mode: 'crud' },
      { id: 'orders', title: 'Orders', icon: '📦', endpoint: '/orders', mode: 'orders' },
      { id: 'transactions', title: 'Transactions', icon: '💳', endpoint: '/transactions', mode: 'readonly' },
    ],
  },
  {
    title: 'Content',
    items: [
      { id: 'blogs', title: 'Blogs', icon: '📝', endpoint: '/blogs', mode: 'crud' },
      { id: 'news', title: 'News', icon: '📰', endpoint: '/news', mode: 'crud' },
      { id: 'poojas', title: 'Pooja Services', icon: '🪔', endpoint: '/poojas', mode: 'crud' },
      { id: 'testimonials', title: 'Testimonials', icon: '⭐', endpoint: '/testimonials', mode: 'crud' },
      { id: 'support-faqs', title: 'Support FAQs', icon: '❓', endpoint: '/support-faqs', mode: 'crud' },
      { id: 'free-services', title: 'Free Services', icon: '🎁', endpoint: '/free-services', mode: 'crud' },
    ],
  },
  {
    title: 'Marketing',
    items: [
      { id: 'gift-cards', title: 'Gift Cards', icon: '🎫', endpoint: '/gift-cards', mode: 'crud' },
    ],
  },
];

export const ADMIN_SECTIONS = SECTION_GROUPS.flatMap((g) => g.items);

export function getSectionById(id) {
  return ADMIN_SECTIONS.find((s) => s.id === id) || null;
}