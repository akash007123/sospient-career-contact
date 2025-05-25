const Career = require('../models/Career');
const sendEmail = require('../config/email');
const path = require('path');
const fs = require('fs');
const logger = require('../config/logger');
const mongoose = require('mongoose');

// Get all job listings (could be connected to a database in the future)
const getJobListings = async (req, res) => {
  try {
    // In a real app, you might fetch these from a database
    const jobListings = [
      {
        id: 1,
        title: 'Senior Frontend Developer',
        location: 'San Francisco, CA (Hybrid)',
        type: 'Full-Time',
        department: 'Engineering',
        description: 'We are looking for a Senior Frontend Developer to join our team and help build beautiful, responsive web applications.',
        requirements: [
          'Minimum 5 years of experience with JavaScript, HTML, and CSS',
          'Strong experience with React and its ecosystem',
          'Experience with TypeScript, Redux, and modern CSS frameworks',
          'Knowledge of responsive design and cross-browser compatibility',
          'Experience with testing frameworks like Jest, React Testing Library',
          'Familiarity with GraphQL and RESTful APIs'
        ],
        responsibilities: [
          'Develop high-quality, responsive web applications',
          'Collaborate with designers, backend developers, and product managers',
          'Optimize applications for maximum speed and scalability',
          'Contribute to architecture decisions and technical roadmap',
          'Mentor junior developers and lead by example'
        ]
      },
      {
        id: 2,
        title: 'Backend Engineer',
        location: 'Remote',
        type: 'Full-Time',
        department: 'Engineering',
        description: 'Join our backend team to design and implement robust, scalable APIs and services that power our applications.',
        requirements: [
          'Minimum 3 years of experience in backend development',
          'Proficiency in Node.js, Python, or Java',
          'Experience with database design and optimization (SQL and NoSQL)',
          'Knowledge of API design and RESTful services',
          'Understanding of containerization and cloud infrastructure',
          'Experience with CI/CD pipelines'
        ],
        responsibilities: [
          'Design and develop scalable, high-performance APIs',
          'Implement robust error handling and logging',
          'Optimize database queries and data processing',
          'Collaborate with frontend developers to integrate APIs',
          'Ensure high availability and reliability of services'
        ]
      },
      {
        id: 3,
        title: 'UI/UX Designer',
        location: 'New York, NY (On-site)',
        type: 'Full-Time',
        department: 'Design',
        description: 'We are seeking a talented UI/UX Designer to create beautiful, intuitive interfaces for our products and clients.',
        requirements: [
          'Bachelor\'s degree in Design, HCI, or related field',
          'Minimum 3 years of experience in UI/UX design',
          'Proficiency in design tools like Figma, Adobe XD, or Sketch',
          'Strong portfolio demonstrating design thinking and problem-solving',
          'Experience with user research and usability testing',
          'Understanding of accessibility standards'
        ],
        responsibilities: [
          'Create wireframes, prototypes, and high-fidelity designs',
          'Conduct user research and usability testing',
          'Collaborate with product managers and engineers',
          'Develop and maintain design systems',
          'Ensure designs meet accessibility standards'
        ]
      }
    ];
    res.json(jobListings);
  } catch (error) {
    logger.error('Error fetching job listings:', error);
    res.status(500).json({ error: 'Failed to fetch job listings' });
  }
};

// Submit career application
const submitApplication = async (req, res) => {
  try {
    const { firstName, lastName, email, mobile, areaOfInterest, message, consent, jobId, jobTitle } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'Resume file is required' });
    }

    const newApplication = new Career({
      firstName,
      lastName,
      email,
      mobile,
      areaOfInterest,
      message,
      resumePath: req.file.path,
      jobId,
      jobTitle,
      status: 'New'
    });

    await newApplication.save();

    // Log the new application
    logger.info(`New application submitted by ${firstName} ${lastName} for ${jobTitle || 'general position'}`);

    // Send confirmation email to applicant
    await sendEmail({
      to: email,
      subject: 'Application Received - TechNova',
      html: `
        <h1>Thank you for your application, ${firstName}!</h1>
        <p>We've received your application for ${jobTitle || 'a position'} at TechNova.</p>
        <p>Our HR team will review your application and get back to you soon.</p>
        <p>Best regards,<br/>TechNova Team</p>
      `,
    });

    // Send notification to HR
    await sendEmail({
      to: process.env.TO_EMAIL,
      subject: `New Application: ${firstName} ${lastName} - ${jobTitle || 'General Application'}`,
      html: `
        <h1>New Job Application Received</h1>
        <p><strong>Name:</strong> ${firstName} ${lastName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Mobile:</strong> ${mobile}</p>
        <p><strong>Position:</strong> ${jobTitle || 'General Application'}</p>
        <p><strong>Area of Interest:</strong> ${areaOfInterest}</p>
        <p><strong>Message:</strong> ${message || 'No additional message'}</p>
        <p>Resume is attached to this email.</p>
      `,
      attachments: [
        {
          filename: req.file.originalname,
          path: req.file.path,
        },
      ],
    });

    res.status(201).json({
      message: 'Application submitted successfully',
      application: newApplication
    });
  } catch (error) {
    logger.error('Error submitting application:', error);
    res.status(500).json({ error: 'Failed to submit application' });
  }
};

// Get all career applications
const getAllApplications = async (req, res) => {
  try {
    logger.info('Fetching all career applications');
    const applications = await Career.find().sort({ createdAt: -1 });
    logger.info(`Found ${applications.length} applications`);
    res.json(applications);
  } catch (error) {
    logger.error('Error fetching career applications:', error);
    res.status(500).json({ 
      error: 'Failed to fetch applications',
      details: error.message 
    });
  }
};

// Get application by ID
const getApplicationById = async (req, res) => {
  try {
    const application = await Career.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }
    res.json(application);
  } catch (error) {
    logger.error('Error fetching application:', error);
    res.status(500).json({ 
      error: 'Failed to fetch application',
      details: error.message 
    });
  }
};

// Update application status
const updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    // Validate status
    if (!status || !['New', 'Pending', 'Interview', 'Hired'].includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status value',
        details: 'Status must be one of: New, Pending, Interview, Hired'
      });
    }

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        error: 'Invalid application ID',
        details: 'The provided ID is not a valid MongoDB ObjectId'
      });
    }

    const application = await Career.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    if (!application) {
      return res.status(404).json({ 
        error: 'Application not found',
        details: 'No application found with the provided ID'
      });
    }

    logger.info(`Application status updated: ${id} -> ${status}`);
    res.json(application);
  } catch (error) {
    logger.error('Error updating application status:', error);
    res.status(500).json({ 
      error: 'Failed to update application status',
      details: error.message 
    });
  }
};

// Delete application
const deleteApplication = async (req, res) => {
  try {
    const { id } = req.params;
    logger.info(`Attempting to delete application with ID: ${id}`);

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      logger.warn(`Invalid ObjectId format: ${id}`);
      return res.status(400).json({ 
        error: 'Invalid application ID',
        details: 'The provided ID is not a valid MongoDB ObjectId'
      });
    }

    const application = await Career.findById(id);
    if (!application) {
      logger.warn(`Application not found with ID: ${id}`);
      return res.status(404).json({ 
        error: 'Application not found',
        details: 'No application found with the provided ID'
      });
    }

    // Log application details before deletion
    logger.info(`Deleting application: ${JSON.stringify({
      id: application._id,
      name: `${application.firstName} ${application.lastName}`,
      position: application.jobTitle || 'General Application',
      status: application.status
    })}`);

    await Career.findByIdAndDelete(id);
    logger.info(`Successfully deleted application: ${id}`);
    
    res.json({ 
      message: 'Application deleted successfully',
      deletedApplication: {
        id: application._id,
        name: `${application.firstName} ${application.lastName}`,
        position: application.jobTitle || 'General Application'
      }
    });
  } catch (error) {
    logger.error('Error deleting application:', {
      error: error.message,
      stack: error.stack,
      id: req.params.id
    });
    res.status(500).json({ 
      error: 'Failed to delete application',
      details: error.message 
    });
  }
};

module.exports = {
  getJobListings,
  submitApplication,
  getAllApplications,
  getApplicationById,
  updateApplicationStatus,
  deleteApplication
};