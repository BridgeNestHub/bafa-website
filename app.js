/**
 * MELBA - Minimal Debug Version
 * Absolutely minimal setup to identify the path-to-regexp issue
 */

const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const path = require('path');

// Initialize Express app
const app = express();

// Minimal middleware only
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'melba-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { 
    maxAge: 1000 * 60 * 60 * 24,
    secure: process.env.NODE_ENV === 'production'
  }
}));

// View engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

console.log('🔍 Setting up minimal routes...');

// Only the most basic routes
app.get('/', (req, res) => {
  res.send('Hello from Railway! Server is working.');
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

console.log('✅ Basic routes set up');

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌐 Minimal server running on http://0.0.0.0:${PORT}`);
});

// MongoDB connection (non-blocking)
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/melba', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('✅ Connected to MongoDB');
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
});