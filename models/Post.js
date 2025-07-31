/**
 * Post Model
 * Defines the schema for both blog posts and events
 * Uses a 'type' discriminator to differentiate content types
 */

const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  content: {
    type: String,
    required: [true, 'Content is required']
  },
  image: {
    type: String,
    default: '/images/default-post.jpg'
  },
  type: {
    type: String,
    enum: ['blog', 'event'],
    required: true
  },
  // Event-specific fields
  eventDate: {
    type: Date,
    required: function() { return this.type === 'event'; }
  },
  location: {
    type: String,
    required: function() { return this.type === 'event'; },
    trim: true
  },
  // System fields
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp before saving
postSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create text index for search functionality
postSchema.index({ title: 'text', content: 'text' });

module.exports = mongoose.model('Post', postSchema);