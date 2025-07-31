//models/NewsletterSubscription.js
const mongoose = require('mongoose');

const newsletterSubscriptionSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address']
  },
  subscribedAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  unsubscribedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for faster queries
newsletterSubscriptionSchema.index({ email: 1 });
newsletterSubscriptionSchema.index({ isActive: 1 });

module.exports = mongoose.model('NewsletterSubscription', newsletterSubscriptionSchema);