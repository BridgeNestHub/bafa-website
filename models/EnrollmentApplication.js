// models/EnrollmentApplication.js
const mongoose = require('mongoose');

const enrollmentApplicationSchema = new mongoose.Schema({
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
  school: { // Corresponds to 'enrollSchool'
    type: String,
    trim: true,
    default: ''
  },
  gradeLevel: { // Corresponds to 'enrollGrade' select
    type: String,
    default: '',
  },
  programInterest: { // Corresponds to 'enrollProgramInterest' select
    type: String,
    required: true,
    trim: true
  },
  message: { // Corresponds to 'enrollMessage'
    type: String,
    trim: true,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('EnrollmentApplication', enrollmentApplicationSchema);