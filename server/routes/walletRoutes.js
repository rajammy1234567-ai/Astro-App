const express = require('express');
const { getWallet, addMoney, getTransactions } = require('../controllers/walletController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, getWallet);
router.post('/add', protect, addMoney);
router.get('/transactions', protect, getTransactions);

module.exports = router;