const GiftCard = require('../models/GiftCard');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');

const getOrCreateWallet = async (userId) => {
  let wallet = await Wallet.findOne({ user: userId });
  if (!wallet) {
    wallet = await Wallet.create({ user: userId, balance: 0 });
  }
  return wallet;
};

const redeemGiftCard = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code?.trim()) {
      return res.status(400).json({ message: 'Gift card code is required' });
    }

    const giftCard = await GiftCard.findOne({ code: code.trim().toUpperCase() });
    if (!giftCard) {
      return res.status(404).json({ message: 'Invalid gift card code' });
    }
    if (giftCard.isRedeemed) {
      return res.status(400).json({ message: 'This gift card has already been redeemed' });
    }
    if (giftCard.expiresAt && giftCard.expiresAt < new Date()) {
      return res.status(400).json({ message: 'This gift card has expired' });
    }

    const wallet = await getOrCreateWallet(req.user._id);
    wallet.balance += giftCard.amount;
    await wallet.save();

    giftCard.isRedeemed = true;
    giftCard.redeemedBy = req.user._id;
    giftCard.redeemedAt = new Date();
    await giftCard.save();

    await Transaction.create({
      user: req.user._id,
      amount: giftCard.amount,
      type: 'credit',
      description: `Gift card redeemed (${giftCard.code})`,
      status: 'completed',
    });

    res.json({
      message: `₹${giftCard.amount} added to your wallet`,
      amount: giftCard.amount,
      balance: wallet.balance,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { redeemGiftCard };