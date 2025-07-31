// models/BecomePartnerInquiry.js
const mongoose = require('mongoose');

const becomePartnerInquirySchema = new mongoose.Schema({
  organizationName: {
    type: String,
    required: true,
    trim: true
  },
  contactName: {
    type: String,
    required: true,
    trim: true
  },
  email: { // Corresponds to 'partnerEmail'
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    match: [/.+@.+\..+/, 'Please fill a valid email address']
  },
  phone: { // Corresponds to 'partnerPhone'
    type: String,
    trim: true,
    default: ''
  },
  partnershipType: {
    type: String,
    required: true,
    trim: true
  },
  message: { // Corresponds to 'partnerMessage'
    type: String,
    trim: true,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('BecomePartnerInquiry', becomePartnerInquirySchema);