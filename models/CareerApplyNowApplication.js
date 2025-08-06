// models/CareerApplyNowApplication.js
const mongoose = require('mongoose');

const careerApplyNowApplicationSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  age: { type: Number, required: true, min: 16, max: 80 },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    match: [/.+@.+\..+/, 'Please fill a valid email address']
  },
  phone: { type: String, trim: true, default: '' },
  interest: { type: String, required: true, trim: true }, // Corresponds to 'applyInterest'
  resumePath: { type: String, default: '' }, // For uploaded resume file path (future functionality)
  coverLetter: { type: String, trim: true, default: '' }, // Corresponds to 'applyCoverLetter'
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CareerApplyNowApplication', careerApplyNowApplicationSchema);