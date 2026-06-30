const Chat = require('../models/Chat');

const getChats = async (req, res) => {
  try {
    const chats = await Chat.find({ user: req.user._id }).populate('astrologer');
    res.json(chats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getChatById = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id).populate('astrologer');
    if (!chat) return res.status(404).json({ message: 'Chat not found' });
    res.json(chat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { chatId, content } = req.body;
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });
    chat.messages.push({ sender: 'user', content });
    await chat.save();
    res.json(chat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getChats, getChatById, sendMessage };