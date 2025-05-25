const ContactMessage = require('../models/ContactMessage');
const sendEmail = require('../config/email');
const logger = require('../config/logger'); // Add this line

// Submit contact form
const submitContactForm = async (req, res) => {
  try {
    const { name, email, mobile, subject, message, consent } = req.body;

    const newMessage = new ContactMessage({
      name,
      email,
      mobile,
      subject,
      message,
      consent,
    });

    await newMessage.save();

    // Log the new contact message
    logger.info(`New contact message from ${name} about ${subject}`);

    // Send confirmation email to user
    await sendEmail({
      to: email,
      subject: 'Thank you for contacting TechNova',
      html: `
        <h1>Thank you for reaching out, ${name}!</h1>
        <p>We've received your message regarding "${subject}" and our team will get back to you soon.</p>
        <p>Here's a copy of your message:</p>
        <blockquote>${message}</blockquote>
        <p>Best regards,<br/>TechNova Team</p>
      `,
    });

    // Send notification to support team
    await sendEmail({
      to: process.env.TO_EMAIL,
      subject: `New Contact Message: ${subject}`,
      html: `
        <h1>New Contact Message Received</h1>
        <p><strong>From:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Mobile:</strong> ${mobile}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <blockquote>${message}</blockquote>
      `,
    });

    res.status(201).json({
      message: 'Message sent successfully!',
      messageId: newMessage._id,
    });
  } catch (error) {
    console.error('Error submitting contact form:', error);
    res.status(500).json({ 
      error: 'Failed to send message',
      details: error.message 
    });
  }
};

module.exports = {
  submitContactForm,
};