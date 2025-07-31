// models/CareerPartnerInquiry.js
const mongoose = require('mongoose');

const careerPartnerInquirySchema = new mongoose.Schema({
  organizationName: { type: String, required: true, trim: true }, // Corresponds to 'partnerOrgName'
  contactName: { type: String, required: true, trim: true }, // Corresponds to 'partnerContactName'
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    match: [/.+@.+\..+/, 'Please fill a valid email address']
  },
  phone: { type: String, trim: true, default: '' },
  partnershipType: { type: String, required: true, trim: true }, // Corresponds to 'partnerType'
  message: { type: String, trim: true, default: '' }, // Corresponds to 'partnerMessage'
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CareerPartnerInquiry', careerPartnerInquirySchema);