const express = require('express');
const {
  getAstrologers,
  getChatList,
  getCallList,
  getAstrologerById,
  bookAstrologer,
} = require('../controllers/astrologerController');
const { protect } = require('../middleware/auth');
const reviewCtrl = require('../controllers/reviewController');

const router = express.Router();

router.get('/', getAstrologers);
router.get('/chat-list', getChatList);
router.get('/call-list', getCallList);
router.get('/:id/reviews', reviewCtrl.getReviewsForAstrologer);
router.post('/:id/reviews', protect, reviewCtrl.addUserReview);
router.get('/:id', getAstrologerById);
router.post('/book', protect, bookAstrologer);

module.exports = router;