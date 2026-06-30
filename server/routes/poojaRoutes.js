const express = require('express');
const { getPoojas, bookPooja } = require('../controllers/poojaController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', getPoojas);
router.post('/:id/book', protect, bookPooja);

module.exports = router;