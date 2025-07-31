// models/FundInternshipInquiry.js
const mongoose = require('mongoose');

const fundInternshipInquirySchema = new mongoose.Schema({
  name: { // Your Name / Organization Name
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    match: [/.+@.+\..+/, 'Please fill a valid email address']
  },
  phone: {
    type: String,
    trim: true,
    default: ''
  },
  sponsorshipLevel: { // Sponsorship Level
    type: String,
    required: true,
    enum: ['Full', 'Half', 'Quarter', 'Custom']
  },
  message: {
    type: String,
    trim: true,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('FundInternshipInquiry', fundInternshipInquirySchema);