const Astrologer = require('../models/Astrologer');

const getAstrologers = async (req, res) => {
  try {
    const filter = {};
    if (req.query.type === 'chat') filter.chatEnabled = true;
    if (req.query.type === 'call') filter.callEnabled = true;
    if (req.query.filter === 'new') filter.isNew = true;
    if (req.query.search) {
      filter.name = { $regex: req.query.search, $options: 'i' };
    }

    const astrologers = await Astrologer.find(filter).sort({ rating: -1 });
    res.json(astrologers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getChatList = async (req, res) => {
  try {
    const astrologers = await Astrologer.find({ chatEnabled: true }).sort({ rating: -1 });
    res.json(astrologers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCallList = async (req, res) => {
  try {
    const astrologers = await Astrologer.find({ callEnabled: true }).sort({ rating: -1 });
    res.json(astrologers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAstrologerById = async (req, res) => {
  try {
    const astrologer = await Astrologer.findById(req.params.id);
    if (!astrologer) return res.status(404).json({ message: 'Astrologer not found' });
    res.json(astrologer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const bookAstrologer = async (req, res) => {
  try {
    const { astrologerId, type, duration } = req.body;
    const astrologer = await Astrologer.findById(astrologerId);
    if (!astrologer) return res.status(404).json({ message: 'Astrologer not found' });

    res.json({
      message: 'Booking created successfully',
      booking: {
        astrologerId,
        astrologerName: astrologer.name,
        type,
        duration: duration || 5,
        pricePerMin: astrologer.pricePerMin,
        estimatedCost: (duration || 5) * astrologer.pricePerMin,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAstrologers,
  getChatList,
  getCallList,
  getAstrologerById,
  bookAstrologer,
};