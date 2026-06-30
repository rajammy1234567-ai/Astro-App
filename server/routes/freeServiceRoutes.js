const express = require('express');
const { getFreeServices } = require('../controllers/freeServiceController');

const router = express.Router();

router.get('/', getFreeServices);

module.exports = router;