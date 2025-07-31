// models/BootcampRegistration.js
const mongoose = require('mongoose');

const bootcampRegistrationSchema = new mongoose.Schema({
  name: { // Assuming a simple name field from a future bootcamp registration form
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
  program: { // e.g., 'Web Development Fundamentals', 'Advanced Programming'
    type: String,
    trim: true,
    default: ''
  },
  experienceLevel: { // e.g., 'Beginner', 'Intermediate', 'Advanced'
    type: String,
    enum: [
      'No Experience',
      'Basic Concepts',
      'Intermediate',
      'Advanced'
  ],    
  default: 'Beginner'
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

module.exports = mongoose.model('BootcampRegistration', bootcampRegistrationSchema);