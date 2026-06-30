const FreeService = require('../models/FreeService');

const getFreeServices = async (req, res) => {
  try {
    const services = await FreeService.find({ isActive: true }).sort({ order: 1 });
    res.json(services);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getFreeServices };