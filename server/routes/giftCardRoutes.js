const express = require('express');
const { redeemGiftCard } = require('../controllers/giftCardController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/redeem', protect, redeemGiftCard);

module.exports = router;