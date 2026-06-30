const express = require('express');
const { getFollowing, toggleFollow } = require('../controllers/followingController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, getFollowing);
router.post('/:astrologerId', protect, toggleFollow);

module.exports = router;