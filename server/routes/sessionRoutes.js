const express = require('express');
const ctrl = require('../controllers/sessionController');
const uploadCtrl = require('../controllers/uploadController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/book', protect, ctrl.createSession);
router.get('/my', protect, ctrl.getMySessions);
router.post('/upload', protect, uploadCtrl.uploadImage);
router.get('/:id', protect, ctrl.getSession);
router.post('/:id/messages', protect, ctrl.sendMessage);
router.post('/:id/pay', protect, ctrl.paySession);
router.put('/:id/end', protect, ctrl.endSession);

module.exports = router;