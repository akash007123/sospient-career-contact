const express = require('express');
const router = express.Router();
const careerController = require('../controllers/careerController');
const upload = require('../utils/fileUpload');
const { validateCareerApplication } = require('../middlewares/validation');
const { contactFormLimiter } = require('../middlewares/rateLimiter');

// GET routes
router.get('/jobs', careerController.getJobListings);
router.get('/applications', careerController.getAllApplications);
router.get('/applications/:id', careerController.getApplicationById);

// POST route for new applications
router.post('/apply', contactFormLimiter, upload.single('resume'), validateCareerApplication, careerController.submitApplication);

// PATCH route for updating status
router.patch('/applications/:id', careerController.updateApplicationStatus);

// DELETE route
router.delete('/applications/:id', careerController.deleteApplication);

module.exports = router;