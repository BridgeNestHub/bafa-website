// models/VolunteerApplication.js
const mongoose = require('mongoose');

const volunteerApplicationSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
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
  address: { // Corresponds to 'volunteerAddress' textarea
    type: String,
    trim: true,
    default: ''
  },
  volunteerInterests: { // Corresponds to 'volunteerInterests' select in modal
    type: [String], // Array of strings
    default: []
  },
  availability: { // Corresponds to 'volunteerAvailability' textarea
    type: String,
    trim: true,
    default: ''
  },
  message: { // Corresponds to 'volunteerMessage' textarea
    type: String,
    trim: true,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('VolunteerApplication', volunteerApplicationSchema);