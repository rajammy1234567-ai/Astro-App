const SupportFaq = require('../models/SupportFaq');

const getFaqs = async (req, res) => {
  try {
    const faqs = await SupportFaq.find().sort({ order: 1, createdAt: 1 });
    res.json(faqs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getFaqs };