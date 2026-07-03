const express = require('express');
const ctrl = require('../controllers/liveController');
const { protect } = require('../middleware/auth');
const { astroProtect } = require('../middleware/astroAuth');

const router = express.Router();

router.get('/astro/mine', astroProtect, ctrl.getMyLive);
router.post('/astro/start', astroProtect, ctrl.startLive);
router.put('/astro/:id/end', astroProtect, ctrl.endLive);
router.put('/astro/:id/controls', astroProtect, ctrl.updateControls);
router.post('/astro/:id/comments', astroProtect, ctrl.postAstroReply);
router.get('/astro/:id/token', astroProtect, ctrl.getLiveToken);

router.get('/', ctrl.getActiveLives);
router.get('/:id/comments', ctrl.getComments);
router.get('/:id/token', protect, ctrl.getLiveToken);
router.post('/:id/join', ctrl.joinLive);
router.post('/:id/leave', ctrl.leaveLive);
router.post('/:id/comments', protect, ctrl.postUserComment);
router.get('/:id', ctrl.getLiveById);

module.exports = router;