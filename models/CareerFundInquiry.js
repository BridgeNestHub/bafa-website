// models/CareerFundInquiry.js
const mongoose = require('mongoose');

const careerFundInquirySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true }, // Your Name / Organization Name
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    match: [/.+@.+\..+/, 'Please fill a valid email address']
  },
  phone: { type: String, trim: true, default: '' },
  sponsorshipLevel: { type: String, required: true, trim: true }, // Corresponds to 'fundLevel'
  message: { type: String, trim: true, default: '' }, // Corresponds to 'fundMessage'
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CareerFundInquiry', careerFundInquirySchema);