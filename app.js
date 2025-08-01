//app.js
/**
 * MELBA - Main Application File
 * Sets up Express server, middleware, routes, and database connection
 */

// Load environment variables from .env file in development
// Railway automatically injects environment variables in production
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const path = require('path');

// Initialize Express app
const app = express();

// Connect to MongoDB and start the app only if successful
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/melba', {
  // Remove these deprecated options
  // useNewUrlParser: true,
  // useUnifiedTopology: true
})
.then(() => {
  console.log('✅ Connected to MongoDB');

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

  // 🚀 Start server
  const PORT = process.env.PORT || 8080;
  // Use 0.0.0.0 to bind to all network interfaces, which is required on Railway
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌐 MELBA website running on http://0.0.0.0:${PORT}`);
  });
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
});