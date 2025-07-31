/**
 * Authentication Utilities
 * Handles admin authentication and session management
 */

const bcrypt = require('bcryptjs');

// Configuration
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD 
    ? bcrypt.hashSync(process.env.ADMIN_PASSWORD, 10) 
    : bcrypt.hashSync('bafa2023', 10); // Default fallback password

/**
 * Authenticate admin user
 * @param {string} username - Submitted username
 * @param {string} password - Submitted password
 * @returns {Promise<boolean>} - True if authentication succeeds
 */
const authenticate = async (username, password) => {
    try {
        // Verify username matches
        if (username !== ADMIN_USERNAME) {
            console.log('Authentication failed: Invalid username');
            return false;
        }

        // Verify password matches
        const passwordMatch = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
        if (!passwordMatch) {
            console.log('Authentication failed: Invalid password');
            return false;
        }

        return true;
    } catch (err) {
        console.error('Authentication error:', err);
        return false;
    }
};

/**
 * Middleware to check if user is authenticated
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Next middleware function
 */
const isAuthenticated = (req, res, next) => {
    if (req.session.authenticated) {
        return next();
    }
    
    // Store original URL to redirect after login
    req.session.returnTo = req.originalUrl;
    res.redirect('/admin/login');
};

/**
 * Middleware to prevent caching of authenticated pages
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Next middleware function
 */
const noCache = (req, res, next) => {
    res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
    });
    next();
};

module.exports = {
    authenticate,
    isAuthenticated,
    noCache
};