/**
 * MELBA - Main Application File - DEBUG VERSION
 * This version will load routes carefully to identify the problematic route
 */

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

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`📞 ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Add a simple health check route
app.get('/health', (req, res) => {
  console.log('🏥 Health check requested');
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    port: process.env.PORT || 8080
  });
});

// Add a simple test route
app.get('/test', (req, res) => {
  console.log('🧪 Test route accessed');
  res.send('Test route working!');
});

// 🚏 Routes - TEMPORARILY SKIP ALL ROUTES FOR TESTING
console.log('📋 Skipping all routes for debugging...');

// STEP 1: Test with NO routes - uncomment this and deploy first
// If this works, then the issue is definitely in one of your route files

// STEP 2: If step 1 works, uncomment ONLY the index routes:
// try {
//   console.log('📋 Loading ONLY index routes...');
//   app.use('/', require('./routes/index'));
//   console.log('✅ Index routes loaded successfully');
// } catch (error) {
//   console.error('❌ Error loading INDEX routes:', error.message);
//   console.error('Full error:', error);
// }

// STEP 3: If step 2 works, then uncomment the admin routes:
// try {
//   console.log('📋 Loading ONLY admin routes...');
//   app.use('/admin', require('./routes/admin'));
//   console.log('✅ Admin routes loaded successfully');
// } catch (error) {
//   console.error('❌ Error loading ADMIN routes:', error.message);
//   console.error('Full error:', error);
// }

// Add a catch-all route for debugging - FIXED SYNTAX
app.get('/*', (req, res) => {
  console.log(`🔍 Catch-all route hit: ${req.path}`);
  res.status(404).send(`Route ${req.path} not found. Server is running without main routes for debugging.`);
});

// 🛠️ Error handling middleware
app.use((err, req, res, next) => {
  console.error('💥 Error middleware triggered:', err.stack);
  res.status(500).send('Something went wrong! Check the logs.');
});

// 🚀 Start server IMMEDIATELY
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌐 MELBA website running on http://0.0.0.0:${PORT}`);
  console.log(`🔗 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('🔍 DEBUG MODE: All routes disabled for testing');
});

// Connect to MongoDB separately
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