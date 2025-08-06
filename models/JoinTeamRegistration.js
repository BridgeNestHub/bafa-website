// models/JoinTeamRegistration.js
const mongoose = require('mongoose');

const joinTeamRegistrationSchema = new mongoose.Schema({
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
  age: {
    type: Number,
    required: true,
    min: 12, // Based on Sports program's age range
    max: 80
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
  teamSportInterest: {
    type: String,
    required: true,
    trim: true
  },
  teamExperienceLevel: {
    type: String,
    trim: true,
    default: ''
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

module.exports = mongoose.model('JoinTeamRegistration', joinTeamRegistrationSchema);