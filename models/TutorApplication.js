// models/TutorApplication.js
const mongoose = require('mongoose');

const tutorApplicationSchema = new mongoose.Schema({
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
  tutorSubjects: {
    type: [String],
    required: true,
    validate: {
      validator: function(v) {
        // The validator function receives the value 'v' for the field.
        // It should return 'true' for a valid value, 'false' for an invalid one.
        return v && v.length > 0;
      },
      message: 'Please select at least one subject.'
    }
  },
  experience: { // Corresponds to 'tutorExperience' textarea
    type: String,
    trim: true,
    default: ''
  },
  tutorAvailability: { // Corresponds to 'tutorAvailability' textarea
    type: String,
    trim: true,
    default: ''
  },
  message: { // Corresponds to 'tutorMessage'
    type: String,
    trim: true,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('TutorApplication', tutorApplicationSchema);