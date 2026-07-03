const User = require('../models/User');
const Astrologer = require('../models/Astrologer');

const getFollowing = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('following');
    res.json(user?.following || []);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const toggleFollow = async (req, res) => {
  try {
    const { astrologerId } = req.params;
    const astrologer = await Astrologer.findOne({
      _id: astrologerId,
      isPublished: true,
      approvedViaApplication: true,
    });
    if (!astrologer) {
      return res.status(404).json({ message: 'Astrologer not found' });
    }

    const user = await User.findById(req.user._id);
    const index = user.following.findIndex((id) => id.toString() === astrologerId);
    let following = false;

    if (index > -1) {
      user.following.splice(index, 1);
    } else {
      user.following.push(astrologer._id);
      following = true;
    }
    await user.save();

    res.json({ following, message: following ? 'Now following' : 'Unfollowed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getFollowing, toggleFollow };