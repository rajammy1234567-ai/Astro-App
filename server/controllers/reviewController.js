const AstrologerReview = require('../models/AstrologerReview');
const Astrologer = require('../models/Astrologer');
const { recalcRating } = require('../utils/astrologerHelpers');

const publicFilter = { isPublished: true, isBlocked: { $ne: true } };

const getReviewsForAstrologer = async (req, res) => {
  try {
    const astro = await Astrologer.findOne({ _id: req.params.id, ...publicFilter });
    if (!astro) return res.status(404).json({ message: 'Astrologer not found' });

    const reviews = await AstrologerReview.find({
      astrologer: astro._id,
      isVisible: true,
    }).sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addUserReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating 1-5 required' });
    }
    if (!comment?.trim()) {
      return res.status(400).json({ message: 'Comment required' });
    }

    const astro = await Astrologer.findOne({ _id: req.params.id, ...publicFilter });
    if (!astro) return res.status(404).json({ message: 'Astrologer not found' });

    const review = await AstrologerReview.create({
      astrologer: astro._id,
      user: req.user._id,
      userName: req.user.name || 'User',
      rating: Number(rating),
      comment: comment.trim(),
      source: 'user',
    });

    await recalcRating(astro._id);
    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMyReviews = async (req, res) => {
  try {
    const reviews = await AstrologerReview.find({ astrologer: req.astrologer._id })
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createAstroReview = async (req, res) => {
  try {
    const { userName, rating, comment } = req.body;
    if (!userName?.trim()) return res.status(400).json({ message: 'Name required' });
    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ message: 'Rating 1-5 required' });
    if (!comment?.trim()) return res.status(400).json({ message: 'Comment required' });

    const review = await AstrologerReview.create({
      astrologer: req.astrologer._id,
      userName: userName.trim(),
      rating: Number(rating),
      comment: comment.trim(),
      source: 'astrologer',
    });

    await recalcRating(req.astrologer._id);
    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateAstroReview = async (req, res) => {
  try {
    const { userName, rating, comment, isVisible } = req.body;
    const review = await AstrologerReview.findOne({
      _id: req.params.id,
      astrologer: req.astrologer._id,
    });
    if (!review) return res.status(404).json({ message: 'Review not found' });

    if (userName !== undefined) review.userName = userName.trim();
    if (rating !== undefined) review.rating = Number(rating);
    if (comment !== undefined) review.comment = comment.trim();
    if (isVisible !== undefined) review.isVisible = !!isVisible;

    await review.save();
    await recalcRating(req.astrologer._id);
    res.json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteAstroReview = async (req, res) => {
  try {
    const review = await AstrologerReview.findOneAndDelete({
      _id: req.params.id,
      astrologer: req.astrologer._id,
    });
    if (!review) return res.status(404).json({ message: 'Review not found' });

    await recalcRating(req.astrologer._id);
    res.json({ message: 'Review deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getReviewsForAstrologer,
  addUserReview,
  getMyReviews,
  createAstroReview,
  updateAstroReview,
  deleteAstroReview,
};