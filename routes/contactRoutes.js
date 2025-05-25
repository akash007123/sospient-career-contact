const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { contactFormLimiter } = require('../middlewares/rateLimiter');

// GET routes
router.get('/', contactController.getAllContacts);
router.get('/list', contactController.getAllContacts);

// POST route
router.post('/submit', contactFormLimiter, contactController.submitContactForm);

// PATCH route for updating status
router.patch('/:id', contactController.updateContactStatus);

// DELETE route
router.delete('/:id', contactController.deleteContact);

// GET route for specific contact (moved to end to avoid conflicts)
router.get('/:id', contactController.getContactById);

module.exports = router;