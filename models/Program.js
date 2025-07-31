// models/Program.js
const mongoose = require('mongoose');

const programSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  slug: { // For clean URLs, e.g., 'career-development'
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  ageRange: {
    type: String, // e.g., "Ages 12-18", "Ages 16-30"
    trim: true
  },
  status: {
    type: String,
    enum: ['Active', 'Upcoming', 'Closed'],
    default: 'Active'
  },
  shortDescription: { // Lead paragraph
    type: String,
    trim: true,
    required: true
  },
  fullDescription: { // Can store HTML for rich content like components, impact, etc.
    type: String,
    trim: true,
    default: ''
  },
  image: { // Path to the program's featured image
    type: String,
    trim: true,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update 'updatedAt' field on save
programSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Program', programSchema);