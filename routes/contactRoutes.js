const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { contactFormLimiter } = require('../middlewares/rateLimiter');

router.post('/submit', contactFormLimiter, contactController.submitContactForm);

module.exports = router;