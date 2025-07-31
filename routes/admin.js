/**
 * Admin Routes
 * Handles all admin functionality including:
 * - Authentication
 * - Content management (Blog, Events, Programs)
 * - Application/Inquiry management
 * - Image uploads
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs/promises'); // IMPORTANT: Use fs/promises for async/await with file system operations
const multer = require('multer');

// --- Mongoose Models ---
// Ensure you only import the models you actually use and prefer consistent naming
const Post = require('../models/Post');
const Program = require('../models/Program'); 
const ContactSubmission = require('../models/ContactSubmission');
const VolunteerApplication = require('../models/VolunteerApplication');
const EnrollmentApplication = require('../models/EnrollmentApplication');
const TutorApplication = require('../models/TutorApplication');
const CareerApplyNowApplication = require('../models/CareerApplyNowApplication');

// Standardized names for these two models
const FundInternshipInquiry = require('../models/FundInternshipInquiry'); 
const BecomePartnerInquiry = require('../models/BecomePartnerInquiry');

const JoinTeamRegistration = require('../models/JoinTeamRegistration');
const BootcampRegistration = require('../models/BootcampRegistration');
const NewsletterSubscription = require('../models/NewsletterSubscription');

const { isAuthenticated } = require('../utils/auth');

// --- Helper function for deleting image files ---
// This function can be reused across different models that have images
const deleteImage = async (imageRelativePath) => {
    // Check if the path is a local upload path, not an external URL or undefined
    if (imageRelativePath && imageRelativePath.startsWith('/images/uploads/')) {
        const fullPath = path.join(__dirname, '../public', imageRelativePath);
        try {
            await fs.unlink(fullPath);
            console.log(`Successfully deleted old image: ${fullPath}`);
        } catch (error) {
            // If the file doesn't exist, it's not a critical error, just log a warning
            if (error.code === 'ENOENT') {
                console.warn(`Attempted to delete non-existent image: ${fullPath}`);
            } else {
                console.error(`Error deleting image file ${fullPath}:`, error);
                // For other errors (e.g., permissions), you might want to throw them
                // or handle them based on your application's error strategy.
            }
        }
    }
};

// --- Multer Configuration for File Uploads ---
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../public/images/uploads');
        try {
            // Ensure the upload directory exists asynchronously
            await fs.mkdir(uploadPath, { recursive: true });
            cb(null, uploadPath);
        } catch (err) {
            console.error('Error creating upload directory:', err);
            cb(err);
        }
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|gif/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Error: Only image files (jpeg, jpg, png, gif) are allowed!'));
        }
    },
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// --- Middleware for authentication and Multer error handling ---
router.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        console.error("Multer error:", err.message);
        return res.status(400).json({ success: false, message: `File upload error: ${err.message}` });
    } else if (err) {
        console.error("General file upload error:", err.message);
        return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
    }
    next();
});

// --- Admin Authentication Routes ---
router.get('/login', (req, res) => {
    if (req.session.authenticated) {
        return res.redirect('/admin/dashboard');
    }
    res.render('admin/login', {
        title: 'Admin Login',
        error: req.query.error
    });
});

router.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === process.env.ADMIN_USERNAME &&
        password === process.env.ADMIN_PASSWORD) {
        req.session.authenticated = true;
        return res.redirect('/admin/dashboard');
    }
    res.redirect('/admin/login?error=1');
});

router.get('/dashboard', isAuthenticated, async (req, res, next) => {
    try {
        res.render('admin/dashboard', {
            title: 'Admin Dashboard',
            success: req.query.success,
            error: req.query.error
        });
    } catch (err) {
        console.error('Dashboard error:', err);
        next(err);
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Logout error:', err);
        }
        res.redirect('/admin/login');
    });
});

// --- API Routes for Newsletter Subscriptions ---

// GET all subscribers
router.get('/api/subscribers', async (req, res) => {
  try {
      const subscribers = await NewsletterSubscription.find().sort({ subscribedAt: -1 });
      res.status(200).json(subscribers);
  } catch (err) {
      console.error('Error fetching subscribers:', err);
      res.status(500).json({ message: 'Internal server error' });
  }
});

// GET a single subscriber by ID
router.get('/api/subscribers/:id', async (req, res) => {
  try {
      const subscriber = await NewsletterSubscription.findById(req.params.id);
      if (!subscriber) {
          return res.status(404).json({ message: 'Subscriber not found' });
      }
      res.status(200).json(subscriber);
  } catch (err) {
      console.error('Error fetching single subscriber:', err);
      res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE a subscriber by ID
router.delete('/api/subscribers/:id', async (req, res) => {
  try {
      const subscriber = await NewsletterSubscription.findByIdAndDelete(req.params.id);
      if (!subscriber) {
          return res.status(404).json({ message: 'Subscriber not found' });
      }
      res.status(200).json({ message: 'Subscriber deleted successfully' });
  } catch (err) {
      console.error('Error deleting subscriber:', err);
      res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all blog posts
router.get('/api/posts', isAuthenticated, async (req, res) => {
    try {
        // Assuming 'Post' model has a 'type' field to differentiate blog from events
        const posts = await Post.find({ type: 'blog' }).sort({ createdAt: -1 });
        res.json(posts);
    } catch (err) {
        console.error('API Error fetching blog posts:', err);
        res.status(500).json({ message: 'Error fetching blog posts.' });
    }
});

// GET a single blog post by ID (Crucial for View & Edit Modals)
router.get('/api/posts/:id', isAuthenticated, async (req, res) => {
    try {
        // Ensure we're fetching a post of type 'blog'
        const post = await Post.findOne({ _id: req.params.id, type: 'blog' });
        if (!post) {
            return res.status(404).json({ message: 'Blog post not found.' });
        }
        res.json(post);
    } catch (err) {
        console.error('API Error fetching single blog post:', err);
        // Handle CastError for invalid Mongoose IDs
        if (err.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid Post ID format.' });
        }
        res.status(500).json({ message: 'Error fetching blog post.' });
    }
});

// POST to create a new blog post
router.post('/api/posts', isAuthenticated, upload.single('image'), async (req, res) => {
    try {
        const { title, content, slug } = req.body; // Added slug here, important for uniqueness
        if (!title || !content || !slug) {
            // Delete uploaded file if validation fails
            if (req.file) { await deleteImage(`/images/uploads/${req.file.filename}`); }
            return res.status(400).json({ success: false, message: 'Title, slug, and content are required for a blog post.' });
        }

        // Check for duplicate slug
        const existingPost = await Post.findOne({ slug, type: 'blog' });
        if (existingPost) {
            if (req.file) { await deleteImage(`/images/uploads/${req.file.filename}`); }
            return res.status(400).json({ success: false, message: 'Blog URL (slug) already exists. Please choose a different one.' });
        }

        const blogPostData = {
            title,
            slug, // Add slug to data
            content,
            type: 'blog',
            image: req.file ? `/images/uploads/${req.file.filename}` : undefined
        };

        const newPost = await Post.create(blogPostData);
        res.status(201).json({ success: true, message: 'Blog post created successfully!', post: newPost });
    } catch (err) {
        console.error('Create blog post error:', err);
        if (req.file) {
            await deleteImage(`/images/uploads/${req.file.filename}`);
        }
        res.status(500).json({ success: false, message: err.message || 'Failed to create blog post.' });
    }
});

// PUT to update an existing blog post by ID
router.put('/api/posts/:id', isAuthenticated, upload.single('image'), async (req, res) => {
    try {
        const { title, content, slug } = req.body;
        const postId = req.params.id;

        // Find the post and ensure it's a 'blog' type
        const post = await Post.findOne({ _id: postId, type: 'blog' });
        if (!post) {
            if (req.file) { await deleteImage(`/images/uploads/${req.file.filename}`); }
            return res.status(404).json({ message: 'Blog post not found.' });
        }

        // Check for duplicate slug, excluding the current post itself
        if (slug && slug !== post.slug) {
            const existingPostWithSlug = await Post.findOne({ slug, type: 'blog' });
            if (existingPostWithSlug) {
                if (req.file) { await deleteImage(`/images/uploads/${req.file.filename}`); }
                return res.status(400).json({ success: false, message: 'Blog URL (slug) already exists. Please choose a different one.' });
            }
        }

        // Update fields
        post.title = title || post.title;
        post.content = content || post.content;
        post.slug = slug || post.slug; // Update slug

        // Handle image update
        if (req.file) {
            await deleteImage(post.image); // Delete old image first
            post.image = `/images/uploads/${req.file.filename}`; // Set new image path
        } else if (req.body.deleteExistingImage === 'true') { // Frontend sends this if user explicitly removes image
            await deleteImage(post.image);
            post.image = undefined; // Or set to a default placeholder path if applicable
        }

        await post.save();
        res.json({ success: true, message: 'Blog post updated successfully!', post });
    } catch (err) {
        console.error('API Error updating blog post:', err);
        if (req.file) {
            await deleteImage(`/images/uploads/${req.file.filename}`);
        }
        if (err.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid Post ID format.' });
        }
        res.status(500).json({ message: 'Error updating blog post.', error: err.message });
    }
});

// DELETE a blog post by ID
router.delete('/api/posts/:id', isAuthenticated, async (req, res) => {
    try {
        const post = await Post.findByIdAndDelete(req.params.id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found.' });
        }
        await deleteImage(post.image); // Use the new helper function
        res.json({ message: 'Blog post deleted successfully!' });
    } catch (err) {
        console.error('API Error deleting blog post:', err);
        res.status(500).json({ message: 'Error deleting blog post.' });
    }
});


// Events API - Get all
router.get('/api/events', isAuthenticated, async (req, res) => {
    try {
        const events = await Post.find({ type: 'event' }).sort({ eventDate: 1 });
        res.json(events);
    } catch (err) {
        console.error('API Error fetching events:', err);
        res.status(500).json({ message: 'Error fetching events.' });
    }
});

// GET a single event by ID
router.get('/api/events/:id', isAuthenticated, async (req, res) => {
    try {
        const event = await Post.findOne({ _id: req.params.id, type: 'event' });
        if (!event) {
            return res.status(404).json({ message: 'Event not found.' });
        }
        res.json(event);
    } catch (err) {
        console.error('API Error fetching single event:', err);
        if (err.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid Event ID format.' });
        }
        res.status(500).json({ message: 'Error fetching event.' });
    }
});

// POST to create an event
router.post('/api/events', isAuthenticated, upload.single('image'), async (req, res) => {
    try {
        const { title, content, eventDate, location, slug } = req.body; // Added slug for events too
        if (!title || !eventDate || !slug) {
            if (req.file) { await deleteImage(`/images/uploads/${req.file.filename}`); }
            return res.status(400).json({ success: false, message: 'Title, slug, and event date are required for an event.' });
        }

        // Check for duplicate slug
        const existingEvent = await Post.findOne({ slug, type: 'event' });
        if (existingEvent) {
            if (req.file) { await deleteImage(`/images/uploads/${req.file.filename}`); }
            return res.status(400).json({ success: false, message: 'Event URL (slug) already exists. Please choose a different one.' });
        }

        const eventData = {
            title,
            slug, // Add slug to event data
            content,
            type: 'event',
            eventDate: new Date(eventDate),
            location,
            image: req.file ? `/images/uploads/${req.file.filename}` : undefined
        };

        const newEvent = await Post.create(eventData);
        res.status(201).json({ success: true, message: 'Event created successfully!', event: newEvent });
    } catch (err) {
        console.error('Create event error:', err);
        if (req.file) {
            await deleteImage(`/images/uploads/${req.file.filename}`);
        }
        res.status(500).json({ success: false, message: err.message || 'Failed to create event.' });
    }
});

// PUT to update an existing event by ID
router.put('/api/events/:id', isAuthenticated, upload.single('image'), async (req, res) => {
    try {
        const { title, content, eventDate, location, slug } = req.body;
        const eventId = req.params.id;

        const event = await Post.findOne({ _id: eventId, type: 'event' });
        if (!event) {
            if (req.file) { await deleteImage(`/images/uploads/${req.file.filename}`); }
            return res.status(404).json({ message: 'Event not found.' });
        }

        // Check for duplicate slug, excluding the current event itself
        if (slug && slug !== event.slug) {
            const existingEventWithSlug = await Post.findOne({ slug, type: 'event' });
            if (existingEventWithSlug) {
                if (req.file) { await deleteImage(`/images/uploads/${req.file.filename}`); }
                return res.status(400).json({ success: false, message: 'Event URL (slug) already exists. Please choose a different one.' });
            }
        }

        event.title = title || event.title;
        event.content = content || event.content;
        event.eventDate = eventDate ? new Date(eventDate) : event.eventDate;
        event.location = location || event.location;
        event.slug = slug || event.slug; // Update slug for events

        // Handle image update
        if (req.file) {
            await deleteImage(event.image);
            event.image = `/images/uploads/${req.file.filename}`;
        } else if (req.body.deleteExistingImage === 'true') {
            await deleteImage(event.image);
            event.image = undefined;
        }

        await event.save();
        res.json({ success: true, message: 'Event updated successfully!', event });
    } catch (err) {
        console.error('API Error updating event:', err);
        if (req.file) {
            await deleteImage(`/images/uploads/${req.file.filename}`);
        }
        if (err.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid Event ID format.' });
        }
        res.status(500).json({ message: 'Error updating event.', error: err.message });
    }
});

// DELETE an event by ID
router.delete('/api/events/:id', isAuthenticated, async (req, res) => {
    try {
        const event = await Post.findByIdAndDelete(req.params.id);
        if (!event) {
            return res.status(404).json({ message: 'Event not found.' });
        }
        await deleteImage(event.image); // Use the new helper function
        res.json({ message: 'Event deleted successfully!' });
    } catch (err) {
        console.error('API Error deleting event:', err);
        res.status(500).json({ message: 'Error deleting event.' });
    }
});

// Programs API - Get all
router.get('/api/programs', isAuthenticated, async (req, res) => {
    try {
        const programs = await Program.find({}).sort({ createdAt: -1 });
        res.json(programs);
    } catch (err) {
        console.error('API Error fetching programs:', err);
        res.status(500).json({ message: 'Error fetching programs.' });
    }
});

// GET a single program by ID
router.get('/api/programs/:id', isAuthenticated, async (req, res) => {
    try {
        const program = await Program.findById(req.params.id);
        if (!program) {
            return res.status(404).json({ message: 'Program not found.' });
        }
        res.json(program);
    } catch (err) {
        console.error('API Error fetching single program:', err);
        if (err.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid Program ID format.' });
        }
        res.status(500).json({ message: 'Error fetching program.' });
    }
});

// POST to create a new program
router.post('/api/programs', isAuthenticated, upload.single('image'), async (req, res) => {
    try {
        const { title, content, slug } = req.body; // Assuming programs also have content and slug
        if (!title || !content || !slug) {
            if (req.file) { await deleteImage(`/images/uploads/${req.file.filename}`); }
            return res.status(400).json({ success: false, message: 'Title, slug, and content are required for a program.' });
        }

        // Check for duplicate slug
        const existingProgram = await Program.findOne({ slug });
        if (existingProgram) {
            if (req.file) { await deleteImage(`/images/uploads/${req.file.filename}`); }
            return res.status(400).json({ success: false, message: 'Program URL (slug) already exists. Please choose a different one.' });
        }

        const programData = {
            title,
            slug,
            content,
            image: req.file ? `/images/uploads/${req.file.filename}` : undefined
        };

        const newProgram = await Program.create(programData);
        res.status(201).json({ success: true, message: 'Program created successfully!', program: newProgram });
    } catch (err) {
        console.error('Create program error:', err);
        if (req.file) {
            await deleteImage(`/images/uploads/${req.file.filename}`);
        }
        res.status(500).json({ success: false, message: err.message || 'Failed to create program.' });
    }
});

// PUT to update an existing program by ID
router.put('/api/programs/:id', isAuthenticated, upload.single('image'), async (req, res) => {
    try {
        const { title, content, slug } = req.body; // Adjust fields as per your Program model
        const programId = req.params.id;

        const program = await Program.findById(programId);
        if (!program) {
            if (req.file) { await deleteImage(`/images/uploads/${req.file.filename}`); }
            return res.status(404).json({ message: 'Program not found.' });
        }

        // Check for duplicate slug, excluding the current program itself
        if (slug && slug !== program.slug) {
            const existingProgramWithSlug = await Program.findOne({ slug });
            if (existingProgramWithSlug) {
                if (req.file) { await deleteImage(`/images/uploads/${req.file.filename}`); }
                return res.status(400).json({ success: false, message: 'Program URL (slug) already exists. Please choose a different one.' });
            }
        }

        // Update program fields
        program.title = title || program.title;
        program.content = content || program.content;
        program.slug = slug || program.slug;

        // Handle image update
        if (req.file) {
            await deleteImage(program.image);
            program.image = `/images/uploads/${req.file.filename}`;
        } else if (req.body.deleteExistingImage === 'true') {
            await deleteImage(program.image);
            program.image = undefined;
        }

        await program.save();
        res.json({ success: true, message: 'Program updated successfully!', program });
    } catch (err) {
        console.error('API Error updating program:', err);
        if (req.file) {
            await deleteImage(`/images/uploads/${req.file.filename}`);
        }
        if (err.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid Program ID format.' });
        }
        res.status(500).json({ message: 'Error updating program.', error: err.message });
    }
});

// DELETE a program by ID
router.delete('/api/programs/:id', isAuthenticated, async (req, res) => {
    try {
        const program = await Program.findByIdAndDelete(req.params.id);
        if (!program) {
            return res.status(404).json({ message: 'Program not found.' });
        }
        await deleteImage(program.image); // Use the new helper function
        res.json({ message: 'Program deleted successfully!' });
    } catch (err) {
        console.error('API Error deleting program:', err);
        res.status(500).json({ message: 'Error deleting program.' });
    }
});

// Contact Forms API
router.get('/api/contact-forms', isAuthenticated, async (req, res) => {
  try {
    const submissions = await ContactSubmission.find({}).sort({ createdAt: -1 });
    res.json(submissions);
  } catch (err) {
    console.error('API Error fetching contact submissions:', err);
    res.status(500).json({ message: 'Error fetching contact submissions.' });
  }
});

router.get('/api/contact-forms/:id', isAuthenticated, async (req, res) => {
  try {
      const submissionId = req.params.id;
      const submission = await ContactSubmission.findById(submissionId);

      if (!submission) {
          return res.status(404).json({ message: 'Contact submission not found.' });
      }
      res.json(submission);
  } catch (err) {
      console.error(`Error fetching contact submission with ID ${req.params.id}:`, err);
      if (err.name === 'CastError') {
          return res.status(400).json({ message: 'Invalid submission ID format.' });
      }
      res.status(500).json({ message: 'Failed to fetch contact submission due to server error.' });
  }
});

router.delete('/api/contact-forms/:id', isAuthenticated, async (req, res) => {
  try {
    const submission = await ContactSubmission.findByIdAndDelete(req.params.id);
    if (!submission) {
      return res.status(404).json({ message: 'Contact submission not found.' });
    }
    res.json({ message: 'Contact submission deleted successfully!' });
  } catch (err) {
    console.error('API Error deleting contact submission:', err);
    res.status(500).json({ message: 'Error deleting contact submission.' });
  }
});

// Volunteer Applications API
router.get('/api/applications/volunteer', isAuthenticated, async (req, res) => {
  try {
    const applications = await VolunteerApplication.find({}).sort({ createdAt: -1 });
    res.json(applications);
  } catch (err) {
    console.error('API Error fetching volunteer applications:', err);
    res.status(500).json({ message: 'Error fetching volunteer applications.' });
  }
});

// --- Single Volunteer Application ---
router.get('/api/applications/volunteer/:id', isAuthenticated, async (req, res) => {
  try {
      const application = await VolunteerApplication.findById(req.params.id);
      if (!application) {
          return res.status(404).json({ message: 'Volunteer application not found.' });
      }
      res.json(application);
  } catch (err) {
      console.error('API Error fetching single volunteer application:', err);
      if (err.name === 'CastError') {
          return res.status(400).json({ message: 'Invalid Application ID format.' });
      }
      res.status(500).json({ message: 'Error fetching volunteer application.' });
  }
});

router.delete('/api/applications/volunteer/:id', isAuthenticated, async (req, res) => {
  try {
    const application = await VolunteerApplication.findByIdAndDelete(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Volunteer application not found.' });
    }
    res.json({ message: 'Volunteer application deleted successfully!' });
  } catch (err) {
    console.error('API Error deleting volunteer application:', err);
    res.status(500).json({ message: 'Error deleting volunteer application.' });
  }
});

// Education Enrollment Applications API
router.get('/api/applications/enrollment', isAuthenticated, async (req, res) => {
  try {
    const applications = await EnrollmentApplication.find({}).sort({ createdAt: -1 });
    res.json(applications);
  } catch (err) {
    console.error('API Error fetching enrollment applications:', err);
    res.status(500).json({ message: 'Error fetching enrollment applications.' });
  }
});

router.get('/api/applications/enrollment/:id', isAuthenticated, async (req, res) => {
  try {
    const application = await EnrollmentApplication.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Enrollment application not found.' });
    }
    res.json(application);
  } catch (err) {
    console.error('API Error fetching single enrollment application:', err);
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid Application ID format.' });
    }
    res.status(500).json({ message: 'Error fetching enrollment application.' });
  }
});
router.delete('/api/applications/enrollment/:id', isAuthenticated, async (req, res) => {
  try {
    const application = await EnrollmentApplication.findByIdAndDelete(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Enrollment application not found.' });
    }
    res.json({ message: 'Enrollment application deleted successfully!' });
  } catch (err) {
    console.error('API Error deleting enrollment application:', err);
    res.status(500).json({ message: 'Error deleting enrollment application.' });
  }
});

// Tutor Applications API
router.get('/api/applications/tutor', isAuthenticated, async (req, res) => {
  try {
    const applications = await TutorApplication.find({}).sort({ createdAt: -1 });
    res.json(applications);
  } catch (err) {
    console.error('API Error fetching tutor applications:', err);
    res.status(500).json({ message: 'Error fetching tutor applications.' });
  }
});

// --- Single Tutor Application ---
router.get('/api/applications/tutor/:id', isAuthenticated, async (req, res) => {
  try {
      const application = await TutorApplication.findById(req.params.id); // Assuming TutorApplication model
      if (!application) {
          return res.status(404).json({ message: 'Tutor application not found.' });
      }
      res.json(application);
  } catch (err) {
      console.error('API Error fetching single tutor application:', err);
      if (err.name === 'CastError') {
          return res.status(400).json({ message: 'Invalid Application ID format.' });
      }
      res.status(500).json({ message: 'Error fetching tutor application.' });
  }
});

router.delete('/api/applications/tutor/:id', isAuthenticated, async (req, res) => {
  try {
    const application = await TutorApplication.findByIdAndDelete(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Tutor application not found.' });
    }
    res.json({ message: 'Tutor application deleted successfully!' });
  } catch (err) {
    console.error('API Error deleting tutor application:', err);
    res.status(500).json({ message: 'Error deleting tutor application.' });
  }
});

// Career Apply Now Applications API
router.get('/api/applications/career/apply', isAuthenticated, async (req, res) => {
  try {
    const applications = await CareerApplyNowApplication.find({}).sort({ createdAt: -1 });
    res.json(applications);
  } catch (err) {
    console.error('API Error fetching career apply now applications:', err);
    res.status(500).json({ message: 'Error fetching career apply now applications.' });
  }
});

router.get('/api/applications/career/apply/:id', isAuthenticated, async (req, res) => {
  try {
      const application = await CareerApplyNowApplication.findById(req.params.id);
      if (!application) {
          return res.status(404).json({ message: 'Career internship application not found.' });
      }
      res.json(application);
  } catch (err) {
      console.error('API Error fetching single career internship application:', err);
      if (err.name === 'CastError') {
          return res.status(400).json({ message: 'Invalid Application ID format.' });
      }
      res.status(500).json({ message: 'Error fetching career internship application.' });
  }
});

router.delete('/api/applications/career/apply/:id', isAuthenticated, async (req, res) => {
  try {
    const application = await CareerApplyNowApplication.findByIdAndDelete(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Career apply now application not found.' });
    }
    res.json({ message: 'Career apply now application deleted successfully!' });
  } catch (err) {
    console.error('API Error deleting career apply now application:', err);
    res.status(500).json({ message: 'Error deleting career apply now application.' });
  }
});

// Fund Internships Inquiries API
router.get('/api/applications/career/fund-internships', isAuthenticated, async (req, res) => {
  try {
    // MODIFIED: Using FundInternshipInquiry for consistency
    const inquiries = await FundInternshipInquiry.find({}).sort({ createdAt: -1 });
    res.json(inquiries);
  } catch (err) {
    console.error('API Error fetching fund internship inquiries:', err);
    res.status(500).json({ message: 'Error fetching fund internship inquiries.' });
  }
});

router.get('/api/applications/career/fund-internships/:id', isAuthenticated, async (req, res) => {
  try {
      // MODIFIED: Using FundInternshipInquiry for consistency
      const inquiry = await FundInternshipInquiry.findById(req.params.id);
      if (!inquiry) {
          return res.status(404).json({ message: 'Fund internship inquiry not found.' });
      }
      res.json(inquiry);
  } catch (err) {
      console.error('API Error fetching single fund internship inquiry:', err);
      if (err.name === 'CastError') {
          return res.status(400).json({ message: 'Invalid Inquiry ID format.' });
      }
      res.status(500).json({ message: 'Error fetching fund internship inquiry.' });
  }
});

router.delete('/api/applications/career/fund-internships/:id', isAuthenticated, async (req, res) => {
  try {
    // MODIFIED: Using FundInternshipInquiry for consistency
    const inquiry = await FundInternshipInquiry.findByIdAndDelete(req.params.id);
    if (!inquiry) {
      return res.status(404).json({ message: 'Fund internship inquiry not found.' });
    }
    res.json({ message: 'Fund internship inquiry deleted successfully!' });
  } catch (err) {
    console.error('API Error deleting fund internship inquiry:', err);
    res.status(500).json({ message: 'Error deleting fund internship inquiry.' });
  }
});

// Become Partner Inquiries API
router.get('/api/applications/career/partner', isAuthenticated, async (req, res) => {
  try {
    // MODIFIED: Using BecomePartnerInquiry for consistency
    const inquiries = await BecomePartnerInquiry.find({}).sort({ createdAt: -1 });
    res.json(inquiries);
  } catch (err) {
    console.error('API Error fetching become partner inquiries:', err);
    res.status(500).json({ message: 'Error fetching become partner inquiries.' });
  }
});

router.get('/api/applications/career/partner/:id', isAuthenticated, async (req, res) => {
  try {
      // MODIFIED: Using BecomePartnerInquiry for consistency
      const inquiry = await BecomePartnerInquiry.findById(req.params.id);
      if (!inquiry) {
          return res.status(404).json({ message: 'Become partner inquiry not found.' });
      }
      res.json(inquiry);
  } catch (err) {
      console.error('API Error fetching single partner inquiry:', err);
      if (err.name === 'CastError') {
          return res.status(400).json({ message: 'Invalid Inquiry ID format.' });
      }
      res.status(500).json({ message: 'Error fetching partner inquiry.' });
  }
});

router.delete('/api/applications/career/partner/:id', isAuthenticated, async (req, res) => {
  try {
    // MODIFIED: Using BecomePartnerInquiry for consistency
    const inquiry = await BecomePartnerInquiry.findByIdAndDelete(req.params.id);
    if (!inquiry) {
      return res.status(404).json({ message: 'Become partner inquiry not found.' });
    }
    res.json({ message: 'Become partner inquiry deleted successfully!' });
  } catch (err) {
    console.error('API Error deleting become partner inquiry:', err);
    res.status(500).json({ message: 'Error deleting become partner inquiry.' });
  }
});

// Join Team Registrations API
router.get('/api/applications/sports/join-team', isAuthenticated, async (req, res) => {
  try {
    const registrations = await JoinTeamRegistration.find({}).sort({ createdAt: -1 });
    res.json(registrations);
  } catch (err) {
    console.error('API Error fetching join team registrations:', err);
    res.status(500).json({ message: 'Error fetching join team registrations.' });
  }
});

router.get('/api/applications/sports/join-team/:id', isAuthenticated, async (req, res) => {
  try {
      const registration = await JoinTeamRegistration.findById(req.params.id); // Assuming JoinTeamRegistration model
      if (!registration) {
          return res.status(404).json({ message: 'Team registration not found.' });
      }
      res.json(registration);
  } catch (err) {
      console.error('API Error fetching single team registration:', err);
      if (err.name === 'CastError') {
          return res.status(400).json({ message: 'Invalid Registration ID format.' });
      }
      res.status(500).json({ message: 'Error fetching team registration.' });
  }
});

router.delete('/api/applications/sports/join-team/:id', isAuthenticated, async (req, res) => {
  try {
    const registration = await JoinTeamRegistration.findByIdAndDelete(req.params.id);
    if (!registration) {
      return res.status(404).json({ message: 'Join team registration not found.' });
    }
    res.json({ message: 'Join team registration deleted successfully!' });
  } catch (err) {
    console.error('API Error deleting join team registration:', err);
    res.status(500).json({ message: 'Error deleting join team registration.' });
  }
});

// POST route for bootcamp registration form submission (FROM PUBLIC FRONTEND)
router.post('/applications/bootcamp', async (req, res) => {
  // Destructure all expected fields
  const { firstName, lastName, age, email, phone, program, experienceLevel, message } = req.body;

  // --- Input Validation ---
  if (!firstName || !lastName || !age || !email || !program || !experienceLevel) {
      return res.status(400).json({ message: 'First name, last name, age, email, desired bootcamp track, and experience level are required.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address.' });
  }

  if (Number(age) < 16 || Number(age) > 50) { // Ensure age is treated as a number for validation
      return res.status(400).json({ message: 'Age must be between 16 and 50.' });
  }

  try {
      const newRegistration = new BootcampRegistration({
          firstName,
          lastName,
          age: Number(age), // Ensure age is stored as a number
          email,
          phone: phone || '',
          program,
          experienceLevel,
          message: message || ''
      });

      await newRegistration.save();

      console.log('✅ New Bootcamp Registration saved to MongoDB:', newRegistration); // This log confirms the save
      res.status(200).json({ success: true, message: 'Bootcamp registration submitted successfully!' });
  } catch (err) {
      console.error('❌ Error saving bootcamp registration:', err); // THIS IS WHERE SAVE ERRORS WOULD APPEAR
      if (err.name === 'ValidationError') {
          const messages = Object.values(err.errors).map(val => val.message);
          return res.status(400).json({ success: false, message: messages.join(', ') });
      }
      res.status(500).json({ success: false, message: 'Failed to submit bootcamp registration.' });
  }
});


// GET route to fetch all bootcamp registrations (for dashboard)
router.get('/api/applications/bootcamp', isAuthenticated, async (req, res) => {
try {
  const registrations = await BootcampRegistration.find({}).sort({ createdAt: -1 });
  res.json(registrations);
} catch (err) {
  console.error('API Error fetching bootcamp registrations:', err);
  res.status(500).json({ message: 'Error fetching bootcamp registrations.' });
}
});

// GET route to fetch a single bootcamp registration by ID
router.get('/api/applications/bootcamp/:id', isAuthenticated, async (req, res) => {
try {
    const registration = await BootcampRegistration.findById(req.params.id);
    if (!registration) {
        return res.status(404).json({ message: 'Bootcamp registration not found.' });
    }
    res.json(registration);
} catch (err) {
    console.error('API Error fetching single bootcamp registration:', err);
    if (err.name === 'CastError') {
        return res.status(400).json({ message: 'Invalid Registration ID format.' });
    }
    res.status(500).json({ message: 'Error fetching bootcamp registration.' });
}
});

// DELETE route to delete a bootcamp registration by ID
router.delete('/api/applications/bootcamp/:id', isAuthenticated, async (req, res) => {
try {
  const registration = await BootcampRegistration.findByIdAndDelete(req.params.id);
  if (!registration) {
    return res.status(404).json({ message: 'Bootcamp registration not found.' });
  }
  res.json({ message: 'Bootcamp registration deleted successfully!' });
} catch (err) {
  console.error('API Error deleting bootcamp registration:', err);
  res.status(500).json({ message: 'Error deleting bootcamp registration.' });
}
});

// --- POST Endpoints for Frontend Modal Submissions (from public-facing forms) ---
// These will receive data from the public forms and save them to the database.
// No isAuthenticated middleware here as these are public forms.

router.post('/applications/enrollment', async (req, res) => {
  try {
    const newApplication = new EnrollmentApplication(req.body);
    await newApplication.save();
    res.status(200).json({ success: true, message: 'Enrollment application submitted successfully!' });
  } catch (err) {
    console.error('Error submitting enrollment application:', err);
    res.status(400).json({ success: false, message: err.message || 'Failed to submit enrollment application.' });
  }
});

router.post('/applications/tutor', async (req, res) => {
  try {
    const newApplication = new TutorApplication(req.body);
    await newApplication.save();
    res.status(200).json({ success: true, message: 'Tutor application submitted successfully!' });
  } catch (err) {
    console.error('Error submitting tutor application:', err);
    res.status(400).json({ success: false, message: err.message || 'Failed to submit tutor application.' });
  }
});

router.post('/applications/career/apply', async (req, res) => {
  try {
    const newApplication = new CareerApplyNowApplication(req.body);
    await newApplication.save();
    res.status(200).json({ success: true, message: 'Career internship application submitted successfully!' });
  } catch (err) {
    console.error('Error submitting career internship application:', err);
    res.status(400).json({ success: false, message: err.message || 'Failed to submit career internship application.' });
  }
});

router.post('/applications/career/fund-internships', async (req, res) => {
  try {
    const newInquiry = new FundInternshipInquiry(req.body);
    await newInquiry.save();
    res.status(200).json({ success: true, message: 'Internship funding inquiry submitted successfully!' });
  } catch (err) {
    console.error('Error submitting fund internship inquiry:', err);
    res.status(400).json({ success: false, message: err.message || 'Failed to submit fund internship inquiry.' });
  }
});

router.post('/applications/career/partner', async (req, res) => {
  try {
    const newInquiry = new BecomePartnerInquiry(req.body);
    await newInquiry.save();
    res.status(200).json({ success: true, message: 'Partner inquiry submitted successfully!' });
  } catch (err) {
    console.error('Error submitting partner inquiry:', err);
    res.status(400).json({ success: false, message: err.message || 'Failed to submit partner inquiry.' });
  }
});

router.post('/applications/sports/join-team', async (req, res) => {
  try {
    const newRegistration = new JoinTeamRegistration(req.body);
    await newRegistration.save();
    res.status(200).json({ success: true, message: 'Sports team registration submitted successfully!' });
  } catch (err) {
    console.error('Error submitting join team registration:', err);
    res.status(400).json({ success: false, message: err.message || 'Failed to submit join team registration.' });
  }
});

router.post('/applications/volunteer', async (req, res) => {
  try {
    const newApplication = new VolunteerApplication(req.body);
    await newApplication.save();
    res.status(200).json({ success: true, message: 'Volunteer application submitted successfully!' });
  } catch (err) {
    console.error('Error submitting volunteer application:', err);
    res.status(400).json({ success: false, message: err.message || 'Failed to submit volunteer application.' });
  }
});

router.post('/applications/bootcamp', async (req, res) => {
  try {
    const newRegistration = new BootcampRegistration(req.body);
    await newRegistration.save();
    console.log('Received bootcamp registration (from under construction modal):', req.body);
    res.status(200).json({ success: true, message: 'Bootcamp registration inquiry received. We will contact you soon!' });
  } catch (err) {
    console.error('Error submitting bootcamp registration:', err);
    res.status(400).json({ success: false, message: err.message || 'Failed to submit bootcamp registration.' });
  }
});


module.exports = router;