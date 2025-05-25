const CareerApplication = require('../models/CareerApplication');
const sendEmail = require('../config/email');
const path = require('path');
const fs = require('fs');
const logger = require('../config/logger'); // <-- Add this line

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

    res.status(200).json(jobListings);
  } catch (error) {
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

    const newApplication = new CareerApplication({
      firstName,
      lastName,
      email,
      mobile,
      areaOfInterest,
      message,
      resumePath: req.file.path,
      consent,
      jobId,
      jobTitle,
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
      message: 'Application submitted successfully!',
      applicationId: newApplication._id,
    });
  } catch (error) {
    console.error('Error submitting application:', error);
    
    // Clean up uploaded file if there was an error
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }

    res.status(500).json({ 
      error: 'Failed to submit application',
      details: error.message 
    });
  }
};

module.exports = {
  getJobListings,
  submitApplication,
};