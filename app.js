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
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');
const path = require('path');

// Initialize Express app
const app = express();

const isProduction = process.env.NODE_ENV === 'production';


// Connect to MongoDB and start the app only if successful
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/melba')
.then(() => {
  console.log('✅ Connected to MongoDB');

  // 🔧 Middleware
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  
  // Session configuration with MongoDB store for production
  const sessionConfig = {
    secret: process.env.SESSION_SECRET || 'melba-secret-key',
    resave: false,
    saveUninitialized: false,
    name: 'melba.sid', // Custom session name for security
    cookie: { 
      maxAge: 1000 * 60 * 60 * 24, // 1 day
      secure: isProduction, // True in production (HTTPS), false in development (HTTP)
      httpOnly: true, // Prevents XSS attacks
      sameSite: isProduction ? 'strict' : 'lax' // Stricter in production
    }
  };

  // Use MongoDB store for sessions in production
  if (isProduction) {
    sessionConfig.store = MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      touchAfter: 24 * 3600, // lazy session update
      ttl: 24 * 60 * 60 // 1 day TTL for session cleanup
    });
    
    console.log('🔒 Production mode: Secure cookies enabled');
  } else {
    console.log('🔧 Development mode: Secure cookies disabled');
  }

  app.use(session(sessionConfig));

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