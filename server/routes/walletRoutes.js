const express = require('express');
const { getWallet, addMoney, verifyPayment, getTransactions } = require('../controllers/walletController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, getWallet);
router.post('/add', protect, addMoney);
router.post('/verify', protect, verifyPayment);
router.get('/transactions', protect, getTransactions);

module.exports = router;