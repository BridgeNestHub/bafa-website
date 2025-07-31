/**
 * File Upload Utilities
 * Handles file uploads and storage
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../public/uploads');
        
        // Create uploads directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

// File filter configuration
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only images are allowed.'), false);
    }
};

// Configure multer instance
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

/**
 * Delete file from uploads directory
 * @param {string} filePath - Relative path to file (e.g., '/uploads/filename.jpg')
 * @returns {Promise<void>}
 */
const deleteFile = async (filePath) => {
    try {
        const fullPath = path.join(__dirname, '../public', filePath);
        
        if (fs.existsSync(fullPath)) {
            await fs.promises.unlink(fullPath);
            console.log(`File deleted: ${filePath}`);
        }
    } catch (err) {
        console.error(`Error deleting file ${filePath}:`, err);
        throw err;
    }
};

module.exports = {
    upload,
    deleteFile
};