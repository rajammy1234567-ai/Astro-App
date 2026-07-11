const express = require('express');
const ctrl = require('../controllers/astroController');
const reviewCtrl = require('../controllers/reviewController');
const uploadCtrl = require('../controllers/uploadController');
const kundliCtrl = require('../controllers/kundliController');
const { astroProtect } = require('../middleware/astroAuth');

const router = express.Router();

router.post('/login', ctrl.login);
router.get('/me', astroProtect, ctrl.getMe);
router.put('/me', astroProtect, ctrl.updateProfile);
router.delete('/me', astroProtect, ctrl.deleteAccount);
router.post('/upload', astroProtect, uploadCtrl.uploadImage);
router.get('/reviews', astroProtect, reviewCtrl.getMyReviews);
router.post('/reviews', astroProtect, reviewCtrl.createAstroReview);
router.put('/reviews/:id', astroProtect, reviewCtrl.updateAstroReview);
router.delete('/reviews/:id', astroProtect, reviewCtrl.deleteAstroReview);
router.put('/online', astroProtect, ctrl.toggleOnline);
router.get('/dashboard', astroProtect, ctrl.getDashboard);
router.get('/requests', astroProtect, ctrl.getPendingRequests);
router.get('/chats', astroProtect, ctrl.getChats);
router.get('/chats/:id', astroProtect, ctrl.getChatById);
router.put('/chats/:id/accept', astroProtect, ctrl.acceptChat);
router.put('/chats/:id/reject', astroProtect, ctrl.rejectChat);
router.post('/chats/:id/messages', astroProtect, ctrl.sendMessage);
router.put('/chats/:id/close', astroProtect, ctrl.closeChat);
// Generate Janam Kundli for client and send in chat
router.get('/chats/:id/kundli-preview', astroProtect, kundliCtrl.previewKundliForChat);
router.post('/chats/:id/send-kundli', astroProtect, kundliCtrl.sendKundliToChat);
// Agora RTC token (same handler as /api/agora/token/astro/:sessionId)
router.get('/chats/:id/call-token', astroProtect, require('../controllers/agoraController').getTokenForAstro);
router.get('/agora/status', astroProtect, require('../controllers/agoraController').getStatus);

module.exports = router;