const express = require('express');
const ctrl = require('../controllers/kundliController');

const router = express.Router();

// Free astrology features (API key stays on server)
router.get('/status', ctrl.status);
router.post('/generate', ctrl.generateKundli);
router.post('/planets', ctrl.planets);
router.post('/panchang', ctrl.panchang);
router.post('/match', ctrl.match);
router.post('/dasha', ctrl.dasha);
router.post('/doshas', ctrl.doshas);
router.post('/ai-reading', ctrl.aiReading);
router.post('/pdf', ctrl.pdfKundli);
router.post('/geo', ctrl.searchPlace);
router.get('/geo', ctrl.searchPlace);

module.exports = router;
