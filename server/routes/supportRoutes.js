const express = require('express');
const { getFaqs } = require('../controllers/supportController');

const router = express.Router();

router.get('/faqs', getFaqs);

module.exports = router;