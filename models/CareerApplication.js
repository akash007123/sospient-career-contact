const mongoose = require('mongoose');

const careerApplicationSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  mobile: {
    type: String,
    required: true,
    trim: true,
  },
  areaOfInterest: {
    type: String,
    required: true,
    enum: ['engineering', 'design', 'product', 'marketing', 'hr'],
  },
  message: {
    type: String,
    trim: true,
  },
  resumePath: {
    type: String,
    required: true,
  },
  consent: {
    type: Boolean,
    required: true,
    default: false,
  },
  jobId: {
    type: Number,
    required: false,
  },
  jobTitle: {
    type: String,
    required: false,
    trim: true,
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'contacted', 'rejected'],
    default: 'pending',
  },
  appliedAt: {
    type: Date,
    default: Date.now,
  },
});

const CareerApplication = mongoose.model('CareerApplication', careerApplicationSchema);

module.exports = CareerApplication;