const express = require('express');
const ctrl = require('../controllers/agoraController');
const { protect } = require('../middleware/auth');
const { astroProtect } = require('../middleware/astroAuth');

const router = express.Router();

router.get('/status', ctrl.getStatus);
router.get('/token/user/:sessionId', protect, ctrl.getTokenForUser);
router.get('/token/astro/:sessionId', astroProtect, ctrl.getTokenForAstro);

module.exports = router;