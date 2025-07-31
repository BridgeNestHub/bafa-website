/**
 * Validation Utilities
 * Provides input validation and sanitization
 */

const { body, validationResult } = require('express-validator');

/**
 * Common validation rules for blog posts and events
 */
const contentValidationRules = [
    // Title validation
    body('title')
        .trim()
        .notEmpty().withMessage('Title is required')
        .isLength({ max: 100 }).withMessage('Title cannot exceed 100 characters'),
    
    // Content validation
    body('content')
        .trim()
        .notEmpty().withMessage('Content is required')
        .isLength({ min: 50 }).withMessage('Content must be at least 50 characters'),
    
    // Image validation (optional)
    body('image')
        .optional()
        .custom((value, { req }) => {
            if (!req.file) return true; // No file uploaded is acceptable
            
            const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
            if (!allowedTypes.includes(req.file.mimetype)) {
                throw new Error('Only image files are allowed (JPEG, PNG, GIF, WEBP)');
            }
            
            if (req.file.size > 5 * 1024 * 1024) {
                throw new Error('Image size cannot exceed 5MB');
            }
            
            return true;
        })
];

/**
 * Event-specific validation rules
 */
const eventValidationRules = [
    // Event date validation
    body('eventDate')
        .notEmpty().withMessage('Event date is required')
        .isISO8601().withMessage('Invalid date format')
        .custom(value => {
            const eventDate = new Date(value);
            if (eventDate < new Date()) {
                throw new Error('Event date must be in the future');
            }
            return true;
        }),
    
    // Location validation
    body('location')
        .trim()
        .notEmpty().withMessage('Location is required')
        .isLength({ max: 100 }).withMessage('Location cannot exceed 100 characters')
];

/**
 * Middleware to handle validation errors
 */
const validate = (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(err => err.msg);
        return res.status(400).json({ 
            success: false,
            errors: errorMessages 
        });
    }
    
    next();
};

module.exports = {
    contentValidationRules,
    eventValidationRules,
    validate
};