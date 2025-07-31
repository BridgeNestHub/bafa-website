/**
 * Main Website Routes
 * Handles all public-facing routes for the Melba website
 */

const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const ContactSubmission = require('../models/ContactSubmission');
const { sendContactEmail } = require('../utils/email');

const VolunteerApplication = require('../models/VolunteerApplication');
const EnrollmentApplication = require('../models/EnrollmentApplication');
const TutorApplication = require('../models/TutorApplication');
const CareerApplyNowApplication = require('../models/CareerApplyNowApplication');
const CareerFundInquiry = require('../models/CareerFundInquiry');
const CareerPartnerInquiry = require('../models/CareerPartnerInquiry');
const BootcampRegistration = require('../models/BootcampRegistration'); 
const NewsletterSubscription = require('../models/NewsletterSubscription');


/**
 * GET Homepage
 * Displays featured content and introduction
 */
router.get('/', async (req, res, next) => {
  try {
    const [featuredPosts, upcomingEvents] = await Promise.all([
      Post.find({ type: 'blog' })
        .sort({ createdAt: -1 })
        .limit(3),
      Post.find({ 
        type: 'event',
        eventDate: { $gte: new Date() }
      })
      .sort({ eventDate: 1 })
      .limit(3)
    ]);

    res.render('pages/index', {
      title: 'Home',
      featuredPosts,
      upcomingEvents,
      success: req.query.success
    });
  } catch (err) {
    console.error('Homepage error:', err);
    next(err);
  }
});

/**
 * GET About Page
 * Displays organization information
 */
router.get('/about', (req, res) => {
  res.render('pages/about', {
    title: 'About Melba'
  });
});

/**
 * GET Programs Page
 * Shows all available programs
 */
router.get('/programs', (req, res) => {
  const programs = [
    {
      id: 'education',
      title: 'Education Support',
      description: 'Tutoring, college prep, and academic guidance',
      icon: 'fa-graduation-cap'
    },
    {
      id: 'career',
      title: 'Career Development',
      description: 'Job training and professional skills',
      icon: 'fa-briefcase'
    },
    {
      id: 'mental-health',
      title: 'Mental Health',
      description: 'Counseling and wellness programs',
      icon: 'fa-heart'
    },
    {
      id: 'sports',
      title: 'Sports Programs',
      description: 'Team sports and physical activities',
      icon: 'fa-running'
    },
    {
      id: 'community',
      title: 'Community Engagement',
      description: 'Volunteering and leadership opportunities',
      icon: 'fa-hands-helping'
    }
  ];

  res.render('pages/programs', {
    title: 'Our Programs',
    programs
  });
});

/**
 * GET Events Page
 * Lists upcoming events
 */
router.get('/events', async (req, res, next) => {
  try {
    const events = await Post.find({ 
      type: 'event',
      eventDate: { $gte: new Date() }
    }).sort({ eventDate: 1 });

    res.render('pages/events', {
      title: 'Upcoming Events',
      events
    });
  } catch (err) {
    console.error('Events error:', err);
    next(err);
  }
});

/**
 * GET Blog Page
 * Shows all blog posts
 */
router.get('/blog', async (req, res, next) => {
  try {
    const posts = await Post.find({ type: 'blog' })
      .sort({ createdAt: -1 });

    res.render('pages/blog', {
      title: 'Blog',
      posts
    });
  } catch (err) {
    console.error('Blog error:', err);
    next(err);
  }
});

/**
 * GET Contact Page
 * Displays contact form
 */
router.get('/contact', (req, res) => {
  res.render('pages/contact', {
    title: 'Contact Us',
    error: req.query.error,
    success: req.query.success
  });
});

/**
 * POST Contact Form
 * Handles form submission
 */
router.post('/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body;

    // Validate basic fields
    if (!name || !email || !message) {
      return res.redirect('/contact?error=1'); // Or render with an error message
    }

    // 1. Save to MongoDB
    const newSubmission = new ContactSubmission({
      name,
      email,
      message,
      // You can add other fields like IP address, timestamp, etc. if needed
    });
    await newSubmission.save();
    console.log('Contact submission saved to DB:', newSubmission); // Log for confirmation

    // 2. Send Email (optional, keep or remove as per your requirement)
    // Note: ensure your sendContactEmail function actually uses these parameters
    // and your email service is configured (e.g., Nodemailer with API keys)
    await sendContactEmail({
      name,
      email,
      message
    });
    console.log('Contact email sent successfully.');

    res.redirect('/contact?success=1');
  } catch (err) {
    console.error('Contact form submission error:', err);
    res.redirect('/contact?error=1');
  }
});

// NEW ROUTE: Handle volunteer applications API endpoint
router.post('/api/volunteer', async (req, res) => {
  // Destructure req.body - now including address
  const { firstName, lastName, email, phone, volunteerInterests, availability, message, address } = req.body;

  // --- Input Validation ---
  if (!firstName || !lastName || !email) {
    return res.status(400).json({ message: 'First name, last name, and email are required.' });
  }

  // Check if volunteerInterests exists and is an array with at least one item
  if (!volunteerInterests || !Array.isArray(volunteerInterests) || volunteerInterests.length === 0) {
    return res.status(400).json({ message: 'Please select at least one area of interest.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Please enter a valid email address.' });
  }

  try {
    const newApplication = new VolunteerApplication({
      firstName,
      lastName,
      email,
      phone: phone || '', // Optional field
      address: address || '', 
      volunteerInterests,
      availability: availability || '',
      message: message || '',
    });

    await newApplication.save();
    console.log('✅ New volunteer application saved to MongoDB:', newApplication);
    res.status(200).json({ message: 'Volunteer application submitted successfully!' });

  } catch (error) {
    console.error('❌ Error processing volunteer application:', error);
    if (error.name === 'ValidationError') {
      let errors = {};
      Object.keys(error.errors).forEach((key) => {
        errors[key] = error.errors[key].message;
      });
      return res.status(400).json({ message: 'Validation failed', errors: errors });
    }
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});

router.post('/api/enrollment', async (req, res) => {
  const {
    firstName,
    lastName,
    age,
    email,
    phone,
    school,
    programInterest,
    message
  } = req.body;

  // --- Input Validation ---
  if (!firstName || !lastName || !email || !age || !programInterest) {
    return res.status(400).json({
      message: 'First name, last name, age, email, and program interest are required.'
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Please enter a valid email address.' });
  }

  if (age < 12 || age > 80) {
    return res.status(400).json({ message: 'Age must be above 12.' });
  }

  try {
    const newApplication = new EnrollmentApplication({
      firstName,
      lastName,
      age,
      email,
      phone: phone || '',
      school: school || '',
      gradeLevel: gradeLevel || '',
      programInterest,
      message: message || ''
    });

    await newApplication.save();

    console.log('✅ New enrollment application saved to MongoDB:', newApplication);
    res.status(200).json({ message: 'Enrollment application submitted successfully!' });

  } catch (error) {
    console.error('❌ Error processing enrollment application:', error);
    if (error.name === 'ValidationError') {
      let errors = {};
      Object.keys(error.errors).forEach((key) => {
        errors[key] = error.errors[key].message;
      });
      return res.status(400).json({ message: 'Validation failed', errors: errors });
    }
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});

router.post('/api/tutor', async (req, res) => {
  const { firstName, lastName, email, phone, tutorSubjects, experience, tutorAvailability } = req.body;

  // Validation
  if (!firstName || !lastName || !email || !tutorSubjects || tutorSubjects.length === 0) {
    return res.status(400).json({ message: 'First name, last name, email, and at least one subject are required.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Please enter a valid email address.' });
  }

  try {
    const newApplication = new TutorApplication({
      firstName,
      lastName,
      email,
      phone: phone || '',
      tutorSubjects: Array.isArray(tutorSubjects) ? tutorSubjects : [tutorSubjects],
      experience: experience || '',
      tutorAvailability: tutorAvailability || '',
    });

    await newApplication.save();

    console.log('✅ New tutor application saved to MongoDB:', newApplication);
    res.status(200).json({ message: 'Tutor application submitted successfully!' });

  } catch (error) {
    console.error('❌ Error processing tutor application:', error);
    if (error.name === 'ValidationError') {
      let errors = {};
      Object.keys(error.errors).forEach((key) => {
        errors[key] = error.errors[key].message;
      });
      return res.status(400).json({ message: 'Validation failed', errors: errors });
    }
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});

router.post('/api/career/apply', async (req, res) => {
  const { firstName, lastName, age, email, phone, interest, coverLetter } = req.body;
  // Note: resumeFile is not handled here; it requires multer for file uploads

  // --- Input Validation ---
  if (!firstName || !lastName || !age || !email || !interest) {
    return res.status(400).json({ message: 'First name, last name, age, email, and area of interest are required.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Please enter a valid email address.' });
  }

  if (age < 16 || age > 80) {
    return res.status(400).json({ message: 'Age must be above 16.' });
  }

  try {
    const newApplication = new CareerApplyNowApplication({
      firstName,
      lastName,
      age,
      email,
      phone: phone || '',
      interest,
      coverLetter: coverLetter || ''
      // resumePath will be empty if file upload isn't implemented yet
    });

    await newApplication.save();

    console.log('✅ New Career Internship Application saved to MongoDB:', newApplication);
    res.status(200).json({ message: 'Internship application submitted successfully!' });

  } catch (error) {
    console.error('❌ Error processing Career Internship Application:', error);
    if (error.name === 'ValidationError') {
      let errors = {};
      Object.keys(error.errors).forEach((key) => {
        errors[key] = error.errors[key].message;
      });
      return res.status(400).json({ message: 'Validation failed', errors: errors });
    }
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});

// NEW ROUTE: Handle Career Fund Internships inquiries API endpoint
router.post('/api/career/fund', async (req, res) => {
  const { name, email, phone, sponsorshipLevel, message } = req.body;

  // --- Input Validation ---
  if (!name || !email || !sponsorshipLevel) {
    return res.status(400).json({ message: 'Name/Organization, email, and sponsorship level are required.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Please enter a valid email address.' });
  }

  try {
    const newInquiry = new CareerFundInquiry({
      name,
      email,
      phone: phone || '',
      sponsorshipLevel,
      message: message || ''
    });

    await newInquiry.save();

    console.log('✅ New Career Fund Internships Inquiry saved to MongoDB:', newInquiry);
    res.status(200).json({ message: 'Internship funding inquiry submitted successfully!' });

  } catch (error) {
    console.error('❌ Error processing Career Fund Internships Inquiry:', error);
    if (error.name === 'ValidationError') {
      let errors = {};
      Object.keys(error.errors).forEach((key) => {
        errors[key] = error.errors[key].message;
      });
      return res.status(400).json({ message: 'Validation failed', errors: errors });
    }
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});

// NEW ROUTE: Handle Career Become a Partner inquiries API endpoint
router.post('/api/career/partner', async (req, res) => {
  const { organizationName, contactName, email, phone, partnershipType, message } = req.body;

  // --- Input Validation ---
  if (!organizationName || !contactName || !email || !partnershipType) {
    return res.status(400).json({ message: 'Organization name, contact name, email, and partnership type are required.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Please enter a valid email address.' });
  }

  try {
    const newInquiry = new CareerPartnerInquiry({
      organizationName,
      contactName,
      email,
      phone: phone || '',
      partnershipType,
      message: message || ''
    });

    await newInquiry.save();

    console.log('✅ New Career Become a Partner Inquiry saved to MongoDB:', newInquiry);
    res.status(200).json({ message: 'Partnership inquiry submitted successfully!' });

  } catch (error) {
    console.error('❌ Error processing Career Become a Partner Inquiry:', error);
    if (error.name === 'ValidationError') {
      let errors = {};
      Object.keys(error.errors).forEach((key) => {
        errors[key] = error.errors[key].message;
      });
      return res.status(400).json({ message: 'Validation failed', errors: errors });
    }
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});

router.post('/applications/bootcamp', async (req, res) => {
  try {
      const newRegistration = new BootcampRegistration(req.body);
      await newRegistration.save();
      console.log('✅ New Bootcamp Registration saved to MongoDB:', newRegistration);
      res.status(200).json({ success: true, message: 'Bootcamp registration submitted successfully!' });
  } catch (err) {
      console.error('❌ Error saving bootcamp registration:', err);
      if (err.name === 'ValidationError') {
          const messages = Object.values(err.errors).map(val => val.message);
          return res.status(400).json({ success: false, message: messages.join(', ') });
      }
      res.status(500).json({ success: false, message: 'Failed to submit bootcamp registration.' });
  }
});

/**
 * POST Newsletter Subscription
 * Handles newsletter subscription form submission
 */
router.post('/subscribe', async (req, res) => {
  const { email } = req.body;

  // Simple validation to ensure email is provided
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required.' });
  }

  try {
    // Check if the email is already subscribed
    let existingSubscriber = await NewsletterSubscription.findOne({ email });

    if (existingSubscriber) {
      // Return a success message even if already subscribed to avoid exposing
      // whether an email is in the database.
      return res.status(200).json({ success: true, message: 'This email is already subscribed.' });
    }

    // Create a new subscriber entry
    const newSubscriber = new NewsletterSubscription({ email });
    await newSubscriber.save();

    // Respond with a success message
    res.status(201).json({ success: true, message: "Thanks for subscribing! You'll now receive the latest stories and updates from Melba Community Center." });

  } catch (error) {
    console.error('Subscription error:', error);
    res.status(500).json({ success: false, message: 'An error occurred. Please try again.' });
  }
});

/**
 * GET Donate Page
 * Shows donation options
 */
router.get('/donate', (req, res) => {
  res.render('pages/donate', {
    title: 'Support Melba'
  });
});

module.exports = router;
