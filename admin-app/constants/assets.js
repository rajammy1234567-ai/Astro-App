export const IMAGES = {
  defaultAvatar: 'https://i.pravatar.cc/150?img=47',
  defaultBlog: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop',
  defaultNews: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=300&fit=crop',
  defaultProduct: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=200&h=200&fit=crop',
  defaultAstrologer: 'https://i.pravatar.cc/150?img=11',
  profile: 'https://i.pravatar.cc/150?img=47',
  blog1: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop',
  blog2: 'https://images.unsplash.com/photo-1614728894747-a83421e2d0f9?w=400&h=300&fit=crop',
  news1: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=300&fit=crop',
  news2: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&h=300&fit=crop',
  remedyRectification: 'https://images.unsplash.com/photo-1502134529125-ada3a4e19fbb?w=400&h=400&fit=crop',
  remedyRegression: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f83?w=400&h=400&fit=crop',
  remedyName: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&h=400&fit=crop',
  remedyRudraksha: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=600&h=300&fit=crop',
  remedyPooja: 'https://images.unsplash.com/photo-1564414029828-fac63c12d0b8?w=400&h=300&fit=crop',
  remedyCombo: 'https://images.unsplash.com/photo-1583391734529-41e9444d8d3d?w=400&h=300&fit=crop',
  remedyLake: 'https://images.unsplash.com/photo-1548013146-72479768bada?w=400&h=300&fit=crop',
  remedyCosmic: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=400&h=300&fit=crop',
  storeBracelet: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=200&h=200&fit=crop',
  storeRudraksha: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=200&h=200&fit=crop',
  storeGemstone: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=200&h=200&fit=crop',
  storeConsult: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
};

const DEFAULT_MAP = {
  avatar: IMAGES.defaultAvatar,
  astrologer: IMAGES.defaultAstrologer,
  blog: IMAGES.defaultBlog,
  news: IMAGES.defaultNews,
  product: IMAGES.defaultProduct,
  general: IMAGES.defaultProduct,
};

export const getDefaultImage = (type = 'general') => DEFAULT_MAP[type] || DEFAULT_MAP.general;