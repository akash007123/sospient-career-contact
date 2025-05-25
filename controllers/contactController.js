const ContactMessage = require('../models/ContactMessage');
const sendEmail = require('../config/email');
const logger = require('../config/logger');
const mongoose = require('mongoose');

// Get all contacts
const getAllContacts = async (req, res) => {
  try {
    const contacts = await ContactMessage.find().sort({ createdAt: -1 });
    res.json(contacts);
  } catch (error) {
    logger.error('Error fetching contacts:', error);
    res.status(500).json({ 
      error: 'Failed to fetch contacts',
      details: error.message 
    });
  }
};

// Get contact by ID
const getContactById = async (req, res) => {
  try {
    const contact = await ContactMessage.findById(req.params.id);
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    res.json(contact);
  } catch (error) {
    logger.error('Error fetching contact:', error);
    res.status(500).json({ 
      error: 'Failed to fetch contact',
      details: error.message 
    });
  }
};

// Update contact status
const updateContactStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    // Validate status
    if (!status || !['New', 'Working', 'Complete'].includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status value',
        details: 'Status must be one of: New, Working, Complete'
      });
    }

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        error: 'Invalid contact ID',
        details: 'The provided ID is not a valid MongoDB ObjectId'
      });
    }

    const contact = await ContactMessage.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    if (!contact) {
      return res.status(404).json({ 
        error: 'Contact not found',
        details: 'No contact found with the provided ID'
      });
    }

    logger.info(`Contact status updated: ${id} -> ${status}`);
    res.json(contact);
  } catch (error) {
    logger.error('Error updating contact status:', error);
    res.status(500).json({ 
      error: 'Failed to update contact status',
      details: error.message 
    });
  }
};

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
    logger.error('Error submitting contact form:', error);
    res.status(500).json({ 
      error: 'Failed to send message',
      details: error.message 
    });
  }
};

// Delete contact
const deleteContact = async (req, res) => {
  try {
    const { id } = req.params;
    logger.info(`Attempting to delete contact with ID: ${id}`);

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      logger.warn(`Invalid ObjectId format: ${id}`);
      return res.status(400).json({ 
        error: 'Invalid contact ID',
        details: 'The provided ID is not a valid MongoDB ObjectId'
      });
    }

    const contact = await ContactMessage.findById(id);
    if (!contact) {
      logger.warn(`Contact not found with ID: ${id}`);
      return res.status(404).json({ 
        error: 'Contact not found',
        details: 'No contact found with the provided ID'
      });
    }

    // Log contact details before deletion
    logger.info(`Deleting contact: ${JSON.stringify({
      id: contact._id,
      name: contact.name,
      email: contact.email,
      status: contact.status
    })}`);

    await ContactMessage.findByIdAndDelete(id);
    logger.info(`Successfully deleted contact: ${id}`);
    
    res.json({ 
      message: 'Contact deleted successfully',
      deletedContact: {
        id: contact._id,
        name: contact.name,
        email: contact.email
      }
    });
  } catch (error) {
    logger.error('Error deleting contact:', {
      error: error.message,
      stack: error.stack,
      id: req.params.id
    });
    res.status(500).json({ 
      error: 'Failed to delete contact',
      details: error.message 
    });
  }
};

module.exports = {
  submitContactForm,
  getAllContacts,
  getContactById,
  updateContactStatus,
  deleteContact,
};