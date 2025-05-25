const express = require('express');
const router = express.Router();
const careerController = require('../controllers/careerController');
const upload = require('../utils/fileUpload');
const { validateCareerApplication } = require('../middlewares/validation');
const { contactFormLimiter } = require('../middlewares/rateLimiter');

router.get('/jobs', careerController.getJobListings);
router.post('/apply', contactFormLimiter, upload.single('resume'), validateCareerApplication, careerController.submitApplication);

module.exports = router;