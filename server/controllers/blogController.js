const Blog = require('../models/Blog');

const authorPopulate = {
  path: 'authorAstrologer',
  select: 'name image specialty isPublished isBlocked',
};

const formatBlog = (blog) => {
  const o = blog.toObject ? blog.toObject() : { ...blog };
  const linked = o.authorAstrologer;
  if (linked && typeof linked === 'object') {
    o.author = o.author || linked.name;
    o.authorImage = o.authorImage || linked.image || '';
    o.authorAstrologerId = linked._id;
    // Keep a light author card for user app (hide blocked details as empty)
    if (!linked.isBlocked) {
      o.authorProfile = {
        _id: linked._id,
        name: linked.name,
        image: linked.image,
        specialty: linked.specialty,
      };
    }
  }
  return o;
};

const getBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({ isPublished: true })
      .populate(authorPopulate)
      .sort({ createdAt: -1 });
    // Hide posts from blocked astrologers; admin-authored (no link) always show
    const visible = blogs.filter((b) => {
      const a = b.authorAstrologer;
      if (!a) return true;
      if (typeof a === 'object' && a.isBlocked) return false;
      return true;
    });
    res.json(visible.map(formatBlog));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id).populate(authorPopulate);
    if (!blog) return res.status(404).json({ message: 'Blog not found' });
    res.json(formatBlog(blog));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** Astrologer: list own blogs (published + drafts) */
const listMyBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({ authorAstrologer: req.astrologer._id })
      .sort({ createdAt: -1 });
    res.json(blogs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** Astrologer: create blog post */
const createMyBlog = async (req, res) => {
  try {
    if (req.astrologer.isBlocked) {
      return res.status(403).json({ message: 'Account blocked — cannot post blogs' });
    }
    const { title, excerpt, content, image, category, isPublished } = req.body || {};
    if (!title?.trim() || !content?.trim()) {
      return res.status(400).json({ message: 'Title and content are required' });
    }
    const blog = await Blog.create({
      title: title.trim(),
      excerpt: (excerpt || '').trim(),
      content: content.trim(),
      image: image || '',
      category: (category || 'Astrology').trim(),
      isPublished: isPublished !== false,
      author: req.astrologer.name,
      authorAstrologer: req.astrologer._id,
      authorImage: req.astrologer.image || '',
      views: '0',
    });
    res.status(201).json(blog);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** Astrologer: update own blog */
const updateMyBlog = async (req, res) => {
  try {
    const blog = await Blog.findOne({
      _id: req.params.id,
      authorAstrologer: req.astrologer._id,
    });
    if (!blog) return res.status(404).json({ message: 'Blog not found' });

    const { title, excerpt, content, image, category, isPublished } = req.body || {};
    if (title != null) blog.title = String(title).trim();
    if (excerpt != null) blog.excerpt = String(excerpt).trim();
    if (content != null) blog.content = String(content).trim();
    if (image != null) blog.image = image;
    if (category != null) blog.category = String(category).trim();
    if (isPublished != null) blog.isPublished = !!isPublished;
    // Keep author snapshot in sync with current profile
    blog.author = req.astrologer.name;
    blog.authorImage = req.astrologer.image || blog.authorImage || '';

    await blog.save();
    res.json(blog);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** Astrologer: delete own blog */
const deleteMyBlog = async (req, res) => {
  try {
    const blog = await Blog.findOneAndDelete({
      _id: req.params.id,
      authorAstrologer: req.astrologer._id,
    });
    if (!blog) return res.status(404).json({ message: 'Blog not found' });
    res.json({ message: 'Blog deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getBlogs,
  getBlogById,
  listMyBlogs,
  createMyBlog,
  updateMyBlog,
  deleteMyBlog,
};
