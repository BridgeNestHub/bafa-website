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
    const { name, email, phone, subject, message } = req.body;

    // Validate basic fields
    if (!name || !email || !message) {
      return res.redirect('/contact?error=1');
    }

    // 1. Save to MongoDB (This is the critical step)
    const newSubmission = new ContactSubmission({
      name,
      email,
      phone,
      subject,
      message,
    });
    await newSubmission.save();
    console.log('✅ Contact submission saved to DB:', newSubmission);

    // 2. Send Email (This is the non-critical step)
    try {
      // Send notification email to the admin
      const adminEmailData = {
        name,
        email: 'contact@melbacommunityservice.org', 
        subject: 'New Contact Form Submission',
        message: `
        New Contact Form Submission:
      
        Name: ${name}
        Email: ${email}
        Phone: ${phone || 'N/A'}
        Subject: ${subject || 'No subject'}
        Message: ${message}
      
        Submitted on: ${new Date().toLocaleString()}
        `
      };
      
      await sendContactEmail(adminEmailData);
      console.log('✅ Admin email notification sent for contact form submission');
      
      // Send confirmation email to the user
      const userEmailData = {
        name,
        email,
        subject: 'Thank You for Contacting Us',
        message: `
        Dear ${name},
        
        Thank you for your message. We have successfully received your submission and appreciate you reaching out.
        
        Here is a copy of your message:
        
        Subject: ${subject || 'No subject'}
        Message: ${message}
        
        Our team will review your message and get back to you as soon as possible.
        
        Sincerely,
        The Melba Community Center Team
        `
      };
      
      await sendContactEmail(userEmailData);
      console.log('✅ User confirmation email sent for contact form submission');
      
    } catch (emailError) {
      // Log the email error but don't halt the user's request
      console.error('❌ Error sending one or both email notifications for contact form:', emailError);
    }

    // 3. Respond with a success message regardless of email status
    res.redirect('/contact?success=1');
  } catch (err) {
    console.error('❌ Contact form submission error:', err);
    res.redirect('/contact?error=1');
  }
});

//Handle volunteer applications API endpoint
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
    // 1. Save the application to the database (this is the critical step)
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

    // 2. Handle the email notification as a non-critical process
    try {
      // Prepare and send the email notification to the admin
      const adminEmailData = {
        name: `${firstName} ${lastName}`,
        email: 'contact@melbacommunityservice.org',
        subject: 'New Volunteer Application Received',
        message: `
        New Volunteer Application:
      
        Name: ${firstName} ${lastName}
        Email: ${email}
        Phone: ${phone || 'N/A'}
        Address: ${address || 'N/A'}
        Volunteer Interests: ${Array.isArray(volunteerInterests) ? volunteerInterests.join(', ') : volunteerInterests}
        Availability: ${availability || 'N/A'}
        Message: ${message || 'No additional message'}
      
        Submitted on: ${new Date().toLocaleString()}
        `
      };
      
      await sendContactEmail(adminEmailData);
      console.log('✅ Admin email notification sent for volunteer application');

      // Prepare and send the confirmation email to the user
      const userEmailData = {
          name: `${firstName} ${lastName}`,
          email: email, // Use the user's email address
          subject: 'Confirmation of Your Volunteer Application',
          message: `
          Dear ${firstName},
          
          Thank you for your interest in volunteering with us! We have successfully received your application.
          
          Here is a summary of the information you submitted for your records:
          
          Name: ${firstName} ${lastName}
          Email: ${email}
          Phone: ${phone || 'N/A'}
          Address: ${address || 'N/A'}
          Volunteer Interests: ${Array.isArray(volunteerInterests) ? volunteerInterests.join(', ') : volunteerInterests}
          Availability: ${availability || 'N/A'}
          Message: ${message || 'No additional message'}
          
          What to expect next: Our team will review your application and be in touch within 5-7 business days regarding the next steps.
          
          Thank you for your interest in helping our community!
          
          Sincerely,
          The Melba Community Center Team
          `
      };

      await sendContactEmail(userEmailData);
      console.log('✅ User confirmation email sent for volunteer application');

    } catch (emailError) {
      // Log the email error, but don't halt the main process
      console.error('❌ Error sending one or both email notifications:', emailError);
    }
    
    // 3. Send the success response to the user
    res.status(200).json({ message: 'Volunteer application submitted successfully! A confirmation email has been sent to you.' });

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

//Enrollment
router.post('/api/enrollment', async (req, res) => {
  const {
    firstName,
    lastName,
    age,
    email,
    phone,
    school,
    gradeLevel,
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
    // 1. Save the application to the database (this is the critical step)
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

    // 2. Handle the email notification as a non-critical process
    try {
      // Prepare and send the email notification to the admin
      const adminEmailData = {
        name: `${firstName} ${lastName}`,
        email: 'contact@melbacommunityservice.org', 
        subject: 'New Enrollment Application Received',
        message: `
        New Enrollment Application:
      
        Name: ${firstName} ${lastName}
        Age: ${age}
        Email: ${email}
        Phone: ${phone || 'N/A'}
        School: ${school || 'N/A'}
        Grade Level: ${gradeLevel || 'N/A'}
        Program Interest: ${programInterest}
        Message: ${message || 'No additional message'}
      
        Submitted on: ${new Date().toLocaleString()}
        `
      };
      
      await sendContactEmail(adminEmailData);
      console.log('✅ Admin email notification sent for enrollment application');

      // Prepare and send the confirmation email to the user
      const userEmailData = {
          name: `${firstName} ${lastName}`,
          email: email, // Use the user's email address
          subject: 'Confirmation of Your Enrollment Application',
          message: `
          Dear ${firstName},
          
          Thank you for applying for a program at Melba Community Center! We have received your application.
          
          Here is a summary of the information you submitted for your records:
          
          Name: ${firstName} ${lastName}
          Age: ${age}
          Email: ${email}
          Phone: ${phone || 'N/A'}
          School: ${school || 'N/A'}
          Grade Level: ${gradeLevel || 'N/A'}
          Program Interest: ${programInterest}
          Message: ${message || 'No additional message'}
          
          What to expect next: Our team will review your application and be in touch within 5-7 business days with more information.
          
          Thank you for your interest!
          
          Sincerely,
          The Melba Community Center Team
          `
      };

      await sendContactEmail(userEmailData);
      console.log('✅ User confirmation email sent for enrollment application');

    } catch (emailError) {
      // Log the email error, but don't halt the main process
      console.error('❌ Error sending one or both email notifications:', emailError);
    }
    
    // 3. Send the success response to the user
    res.status(200).json({ message: 'Enrollment application submitted successfully! A confirmation email has been sent to you.' });

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

//Tutor
router.post('/api/tutor', async (req, res) => {
  const { firstName, lastName, email, phone, tutorSubjects, experience, tutorAvailability, message } = req.body;
  
    // --- Input Validation ---
    if (!firstName || !lastName || !email) {
      return res.status(400).json({ message: 'First name, last name, and email are required.' });
    }
  
  // Check if tutorSubjects exists and is an array with at least one item
  if (!tutorSubjects || !Array.isArray(tutorSubjects) || tutorSubjects.length === 0) {
    return res.status(400).json({ message: 'Please select at least one area of interest.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Please enter a valid email address.' });
  }

  try {
    // 1. Save the application to the database (this is the critical step)
    const newApplication = new TutorApplication({
      firstName,
      lastName,
      email,
      phone: phone || '',
      tutorSubjects,
      experience: experience || '',
      tutorAvailability: tutorAvailability || '',
      message: message || ''
    });

    await newApplication.save();

    console.log('✅ New tutor application saved to MongoDB:', newApplication);

    // 2. Handle the email notification as a non-critical process
    try {
      // Prepare and send the email notification to the admin
      const adminEmailData = {
        name: `${firstName} ${lastName}`,
        email: 'contact@melbacommunityservice.org',
        subject: 'New Tutor Application Received',
        message: `
        New Tutor Application:
      
        Name: ${firstName} ${lastName}
        Email: ${email}
        Phone: ${phone || 'N/A'}
        Subjects: ${Array.isArray(tutorSubjects) ? tutorSubjects.join(', ') : tutorSubjects}
        Experience: ${experience || 'N/A'}
        Availability: ${tutorAvailability || 'N/A'}
        Message: ${message || 'No additional message'}
      
        Submitted on: ${new Date().toLocaleString()}
        `
      };
      
      await sendContactEmail(adminEmailData);
      console.log('✅ Admin email notification sent for tutor application');

      // Prepare and send the confirmation email to the user
      const userEmailData = {
          name: `${firstName} ${lastName}`,
          email: email, // Use the user's email address
          subject: 'Confirmation of Your Tutor Application',
          message: `
          Dear ${firstName},
          
          Thank you for your interest in becoming a tutor with us! We have successfully received your application.
          
          Here is a summary of the information you submitted for your records:
          
          Name: ${firstName} ${lastName}
          Email: ${email}
          Phone: ${phone || 'N/A'}
          Subjects: ${Array.isArray(tutorSubjects) ? tutorSubjects.join(', ') : tutorSubjects}
          Experience: ${experience || 'N/A'}
          Availability: ${tutorAvailability || 'N/A'}
          Message: ${message || 'No additional message'}
          
          What to expect next: Our team will review your application and be in touch within 5-7 business days regarding the next steps.
          
          Thank you for your interest in helping our community!
          
          Sincerely,
          The Melba Community Center Team
          `
      };

      await sendContactEmail(userEmailData);
      console.log('✅ User confirmation email sent for tutor application');

    } catch (emailError) {
      // Log the email error but don't halt the main process
      console.error('❌ Error sending one or both email notifications:', emailError);
    }
    
    // 3. Send the success response to the user regardless of email status
    res.status(200).json({ message: 'Tutor application submitted successfully! A confirmation email has been sent to you.' });

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

//Internship application
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
    // 1. Save the application to the database (this is the critical step)
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

    // 2. Handle the email notification as a non-critical process
    try {
      // Prepare and send the email notification to the admin
      const adminEmailData = {
        name: `${firstName} ${lastName}`,
        email: 'contact@melbacommunityservice.org',
        subject: 'New Career - Internship Application',
        message: `
        New Career - Internship Application:
      
        Name: ${firstName} ${lastName}
        Age: ${age}
        Email: ${email}
        Phone: ${phone || 'N/A'}
        Area of Interest: ${interest}
        Cover Letter: ${coverLetter || 'No cover letter submitted'}
      
        Submitted on: ${new Date().toLocaleString()}
        `
      };
      
      await sendContactEmail(adminEmailData);
      console.log('✅ Admin email notification sent for career internship application');

      // Prepare and send the confirmation email to the user
      const userEmailData = {
          name: `${firstName} ${lastName}`,
          email: email, // Use the user's email address
          subject: 'Confirmation of Your Career Internship Application',
          message: `
          Dear ${firstName},
          
          Thank you for applying for a career internship at Melba Community Center! We have successfully received your application.
          
          Here is a summary of the information you submitted for your records:
          
          Name: ${firstName} ${lastName}
          Age: ${age}
          Email: ${email}
          Phone: ${phone || 'N/A'}
          Area of Interest: ${interest}
          Cover Letter: ${coverLetter || 'No cover letter submitted'}
          
          What to expect next: Our team will review your application and be in touch within 5-7 business days regarding the next steps.
          
          Thank you,
          The Melba Community Center Team
          `
      };

      await sendContactEmail(userEmailData);
      console.log('✅ User confirmation email sent for career internship application');

    } catch (emailError) {
      // Log the email error, but don't halt the main process
      console.error('❌ Error sending career internship application email notification:', emailError);
    }
    
    // 3. Send the success response to the user
    res.status(200).json({ message: 'Internship application submitted successfully! A confirmation email has been sent to you.' });

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

//Handle Career Fund Internships inquiries API endpoint
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
    // 1. Save the inquiry to the database (this is the critical step)
    const newInquiry = new CareerFundInquiry({
      name,
      email,
      phone: phone || '',
      sponsorshipLevel,
      message: message || ''
    });

    await newInquiry.save();

    console.log('✅ New Career Fund Internships Inquiry saved to MongoDB:', newInquiry);

    // 2. Handle the email notification as a non-critical process
    try {
      // Send notification email to the admin
      const adminEmailData = {
        name: name,
        email: 'contact@melbacommunityservice.org',
        subject: 'New Career - Fund Internships Inquiry',
        message: `
        New Career - Fund Internships Inquiry:
      
        Name/Organization: ${name}
        Email: ${email}
        Phone: ${phone || 'N/A'}
        Sponsorship Level: ${sponsorshipLevel}
        Message: ${message || 'No additional message'}
      
        Submitted on: ${new Date().toLocaleString()}
        `
      };
      
      await sendContactEmail(adminEmailData);
      console.log('✅ Admin email notification sent for career fund internships inquiry');

      // Send confirmation email to the user
      const userEmailData = {
        name: name,
        email: email, // Use the user's email address
        subject: 'Confirmation of Your Internship Funding Inquiry',
        message: `
        Dear ${name || 'Supporter'},
        
        Thank you for reaching out to us about funding our internships! We have successfully received your inquiry.
        
        Here is a summary of the information you submitted:
        
        Name/Organization: ${name}
        Email: ${email}
        Phone: ${phone || 'N/A'}
        Sponsorship Level: ${sponsorshipLevel}
        Message: ${message || 'No additional message'}
        
        What to expect next: A member of our team will review your inquiry and contact you within 5-7 business days.
        
        Thank you for your support!
        
        Sincerely,
        The Melba Community Center Team
        `
      };

      await sendContactEmail(userEmailData);
      console.log('✅ User confirmation email sent for career fund internships inquiry');

    } catch (emailError) {
      // Log the email error but don't halt the main process
      console.error('❌ Error sending one or both email notifications:', emailError);
    }
    
    // 3. Send the success response to the user
    res.status(200).json({ message: 'Internship funding inquiry submitted successfully! A confirmation email has been sent to you.' });

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


//Handle Career Become a Partner inquiries API endpoint
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
    // 1. Save the inquiry to the database (critical step)
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

    // 2. Handle the email notification as a non-critical process
    try {
      // Send notification email to the admin
      const adminEmailData = {
        name: contactName,
        email: 'contact@melbacommunityservice.org',
        subject: 'New Career - Become a Partner Inquiry',
        message: `
        New Career - Become a Partner Inquiry:
      
        Organization Name: ${organizationName}
        Contact Name: ${contactName}
        Email: ${email}
        Phone: ${phone || 'N/A'}
        Partnership Type: ${partnershipType}
        Message: ${message || 'No additional message'}
      
        Submitted on: ${new Date().toLocaleString()}
        `
      };
      
      await sendContactEmail(adminEmailData);
      console.log('✅ Admin email notification sent for career partner inquiry');

      // Send confirmation email to the user
      const userEmailData = {
        name: contactName,
        email: email, // Use the user's email address
        subject: 'Confirmation of Your Partnership Inquiry',
        message: `
        Dear ${contactName},
        
        Thank you for your interest in partnering with Melba Community Center! We have successfully received your inquiry.
        
        Here is a summary of the information you submitted:
        
        Organization Name: ${organizationName}
        Contact Name: ${contactName}
        Email: ${email}
        Phone: ${phone || 'N/A'}
        Partnership Type: ${partnershipType}
        Message: ${message || 'No additional message'}
        
        What to expect next: A member of our team will review your inquiry and be in touch within 5-7 business days.
        
        Sincerely,
        The Melba Community Center Team
        `
      };

      await sendContactEmail(userEmailData);
      console.log('✅ User confirmation email sent for career partner inquiry');

    } catch (emailError) {
      // Log the email error but don't halt the main process
      console.error('❌ Error sending career partner inquiry email notification:', emailError);
    }
    
    // 3. Send the success response to the user
    res.status(200).json({ message: 'Partnership inquiry submitted successfully! A confirmation email has been sent to you.' });

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
  // It's good practice to validate and destructure the body
  const { firstName, lastName, email, program, experienceLevel, message } = req.body;

  try {
      // 1. Save the registration to the database (this is the critical step)
      const newRegistration = new BootcampRegistration(req.body);
      await newRegistration.save();
      console.log('✅ New Bootcamp Registration saved to MongoDB:', newRegistration);

      // Get the full name from the saved registration, as it's confirmed to be correct.
      const fullName = newRegistration.name;
      // Extract the first name for the greeting, using the full name.
      const userFirstName = fullName.split(' ')[0] || 'Registrant';
      
      // 2. Handle the email notification as a non-critical process
      try {
          // Send notification email to the admin
          const adminEmailData = {
              name: fullName,
              email: 'contact@melbacommunityservice.org',
              subject: 'New Bootcamp Registration',
              message: `
              New Bootcamp Registration:
              
              Name: ${fullName || ''}
              Email: ${email || 'N/A'}
              Program: ${program || 'N/A'}
              Experience Level: ${experienceLevel || 'N/A'}
              Message: ${message || 'No additional message'}
              
              Submitted on: ${new Date().toLocaleString()}
              `
          };
          
          await sendContactEmail(adminEmailData);
          console.log('✅ Admin email notification sent for bootcamp registration');

          // Send confirmation email to the user
          const userEmailData = {
              name: fullName,
              email: email, // Use the user's email address
              subject: 'Confirmation of Your Bootcamp Registration',
              message: `
              Dear ${userFirstName || 'Registrant'},
              
              Thank you for registering for our bootcamp! We have successfully received your submission.
              
              Here is a summary of the information you submitted:
              
              Name: ${fullName || ''}
              Email: ${email || 'N/A'}
              Program: ${program || 'N/A'}
              Experience Level: ${experienceLevel || 'N/A'}
              Message: ${message || 'No additional message'}
              
              What to expect next: Our team will review your registration and be in touch soon with more information.
              
              Sincerely,
              The Melba Community Center Team
              `
          };

          await sendContactEmail(userEmailData);
          console.log('✅ User confirmation email sent for bootcamp registration');

      } catch (emailError) {
          // Log the email error but do not throw it, allowing the main process to continue
          console.error('❌ Error sending one or both email notifications:', emailError);
      }
      
      // 3. Send the success response to the user regardless of email status
      res.status(200).json({ success: true, message: 'Bootcamp registration submitted successfully! A confirmation email has been sent to you.' });

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

    console.log('✅ New newsletter subscriber saved:', newSubscriber);

    // --- NON-CRITICAL EMAIL NOTIFICATION BLOCK ---
    // This block handles sending emails to both the admin and the user.
    // It will not prevent the submission from being saved.
    try {
      // 1. Prepare and send the email notification to the admin
      const adminEmailData = {
        name: 'Newsletter Subscriber',
        email: 'contact@melbacommunityservice.org', 
        subject: 'New Newsletter Subscription',
        message: `
        New Newsletter Subscription:

        Email: ${email}

        Subscribed on: ${new Date().toLocaleString()}
        `
      };

      await sendContactEmail(adminEmailData);
      console.log('✅ Admin email notification sent for newsletter subscription');

      // 2. Prepare and send the confirmation email to the user
      const userEmailData = {
          name: 'Subscriber', // You might not have a name for newsletter subscribers
          email: email, // Send to the user's provided email
          subject: 'Welcome to Our Newsletter!',
          message: `
          Dear Subscriber,
          
          Thank you for subscribing to our newsletter! You'll now receive the latest stories and updates from Melba Community Center directly in your inbox.
          
          We're excited to share our news with you!
          
          Sincerely,
          The Melba Community Center Team
          `
      };

      await sendContactEmail(userEmailData);
      console.log('✅ User confirmation email sent for newsletter subscription');

    } catch (emailError) {
      // Log the email sending error but do not halt the user's request
      console.error('❌ Error sending one or both email notifications:', emailError);
      // The application will continue from here, and the user will still get a success response.
    }
    // --- END OF NON-CRITICAL EMAIL NOTIFICATION BLOCK ---

    // Respond with a success message
    res.status(201).json({ success: true, message: "Thanks for subscribing! You'll now receive the latest stories and updates from Melba Community Center. A confirmation email has been sent to you." });

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
