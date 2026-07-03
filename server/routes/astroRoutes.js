const express = require('express');
const ctrl = require('../controllers/astroController');
const { astroProtect } = require('../middleware/astroAuth');

const router = express.Router();

router.post('/login', ctrl.login);
router.get('/me', astroProtect, ctrl.getMe);
router.put('/me', astroProtect, ctrl.updateProfile);
router.put('/online', astroProtect, ctrl.toggleOnline);
router.get('/dashboard', astroProtect, ctrl.getDashboard);
router.get('/chats', astroProtect, ctrl.getChats);
router.get('/chats/:id', astroProtect, ctrl.getChatById);
router.post('/chats/:id/messages', astroProtect, ctrl.sendMessage);
router.put('/chats/:id/close', astroProtect, ctrl.closeChat);

module.exports = router;