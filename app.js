/**
 * MELBA - Main Application File
 * Sets up Express server, middleware, routes, and database connection
 */

// We are running on Railway, so we don't need to load dotenv locally.
// Railway automatically injects environment variables for us.
// The presence of a local .env file can override the Railway-provided PORT.
// require('dotenv').config();

const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const path = require('path');

// Initialize Express app
const app = express();

// 🔧 Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'melba-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { 
    maxAge: 1000 * 60 * 60 * 24, // 1 day
    secure: process.env.NODE_ENV === 'production'
  }
}));

// 🧠 View engine setup (EJS)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Add a health check route that works even without DB
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// 🚏 Routes
app.use('/', require('./routes/index'));
app.use('/admin', require('./routes/admin'));

// 🛠️ Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('pages/error', { 
    title: 'Error',
    message: 'Something went wrong!' 
  });
});

// 🚀 Start server IMMEDIATELY (don't wait for MongoDB)
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌐 MELBA website running on http://0.0.0.0:${PORT}`);
});

// Connect to MongoDB separately (async, non-blocking)
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/melba', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('✅ Connected to MongoDB');
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  // Don't exit the process - let the app run without DB if needed
});