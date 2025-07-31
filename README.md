# Melba Community Center Website

A comprehensive web platform for the Melba Community Center, built with Node.js, Express, and MongoDB. This application serves as both a public-facing website and an administrative dashboard for managing community programs, events, and applications.

## 🚀 Features

### Public Website
- **Homepage**: Featured content, upcoming events, and community highlights
- **About**: Organization information and mission
- **Programs**: Education, career development, mental health, sports, and community engagement
- **Events**: Upcoming community events and activities
- **Blog**: Latest news and stories from the community
- **Contact**: Contact form and organization details
- **Donations**: Support the community center

### Application Forms
- **Volunteer Applications**: Community volunteer opportunities
- **Education Enrollment**: Program enrollment for students
- **Tutor Applications**: Apply to become a tutor
- **Career Programs**: Internship and career development applications
- **Bootcamp Registration**: Technology bootcamp enrollment
- **Sports Team Registration**: Join community sports teams
- **Newsletter Subscription**: Stay updated with community news

### Admin Dashboard
- **Content Management**: Create, edit, and delete blog posts and events
- **Application Management**: View and manage all submitted applications
- **Contact Form Management**: Handle contact submissions
- **Newsletter Management**: Manage subscriber list
- **Image Upload**: Upload and manage images for content
- **Secure Authentication**: Protected admin access

## 🛠️ Technology Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Template Engine**: EJS
- **Authentication**: Express Sessions
- **File Upload**: Multer
- **Email**: Nodemailer
- **Frontend**: Bootstrap 5, Font Awesome, Vanilla JavaScript
- **Environment**: dotenv for configuration

## 📁 Project Structure

```
bafa-website/
├── app.js                 # Main application entry point
├── package.json           # Dependencies and scripts
├── .env                   # Environment variables (not in repo)
├── models/                # MongoDB schemas
│   ├── Post.js           # Blog posts and events
│   ├── Program.js        # Community programs
│   ├── ContactSubmission.js
│   ├── VolunteerApplication.js
│   ├── EnrollmentApplication.js
│   ├── TutorApplication.js
│   ├── CareerApplyNowApplication.js
│   ├── BootcampRegistration.js
│   ├── JoinTeamRegistration.js
│   ├── NewsletterSubscription.js
│   ├── BecomePartnerInquiry.js
│   └── FundInternshipInquiry.js
├── routes/
│   ├── index.js          # Public routes
│   └── admin.js          # Admin routes and API
├── utils/
│   ├── auth.js           # Authentication utilities
│   ├── email.js          # Email functionality
│   ├── fileUpload.js     # File upload handling
│   └── validation.js     # Input validation
├── views/
│   ├── partials/         # Reusable EJS components
│   ├── admin/            # Admin interface templates
│   └── pages/            # Public page templates
└── public/
    ├── css/              # Stylesheets
    ├── js/               # Client-side JavaScript
    └── images/           # Static images and uploads
```

## 🚦 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd bafa-website
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/bafa
   # or for MongoDB Atlas:
   # MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/bafa

   # Admin Authentication
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=your_secure_password

   # Session Security
   SESSION_SECRET=your_session_secret_key

   # Email Configuration (optional)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password

   # Environment
   NODE_ENV=development
   PORT=3000
   ```

4. **Start the application**
   ```bash
   npm start
   # or for development with auto-restart:
   npm run dev
   ```

5. **Access the application**
   - Public website: http://localhost:3000
   - Admin dashboard: http://localhost:3000/admin/login

## 🔐 Admin Access

Default admin credentials (change in production):
- **Username**: admin
- **Password**: Set via `ADMIN_PASSWORD` environment variable

### Admin Features
- **Dashboard**: Overview of all applications and content
- **Content Management**: CRUD operations for blog posts and events
- **Application Review**: View and manage all submitted forms
- **Image Management**: Upload and organize media files
- **Newsletter Management**: Handle subscriber list

## 📊 Database Models

### Core Models
- **Post**: Blog posts and events with type discrimination
- **Program**: Community program information
- **ContactSubmission**: Contact form submissions

### Application Models
- **VolunteerApplication**: Volunteer program applications
- **EnrollmentApplication**: Education program enrollment
- **TutorApplication**: Tutor position applications
- **CareerApplyNowApplication**: Career program applications
- **BootcampRegistration**: Technology bootcamp registration
- **JoinTeamRegistration**: Sports team registration
- **NewsletterSubscription**: Email newsletter subscriptions

### Inquiry Models
- **BecomePartnerInquiry**: Partnership inquiries
- **FundInternshipInquiry**: Internship funding requests

## 🔧 API Endpoints

### Public Endpoints
- `GET /` - Homepage
- `GET /about` - About page
- `GET /programs` - Programs listing
- `GET /events` - Events listing
- `GET /blog` - Blog posts
- `GET /contact` - Contact page
- `POST /contact` - Submit contact form
- `POST /subscribe` - Newsletter subscription
- `POST /api/*` - Various application submissions

### Admin API Endpoints
- `GET /admin/api/posts` - Get all blog posts
- `POST /admin/api/posts` - Create new blog post
- `PUT /admin/api/posts/:id` - Update blog post
- `DELETE /admin/api/posts/:id` - Delete blog post
- `GET /admin/api/events` - Get all events
- `GET /admin/api/applications/*` - Get applications by type
- `DELETE /admin/api/applications/*/:id` - Delete applications

## 🎨 Frontend Features

### Responsive Design
- Bootstrap 5 framework
- Mobile-first approach
- Accessible components

### Interactive Elements
- Dynamic form submissions
- Modal dialogs for applications
- Image upload with preview
- Real-time form validation

### Admin Interface
- Modern dashboard design
- CRUD operations with modals
- File upload functionality
- Data tables with sorting/filtering

## 🔒 Security Features

- **Session-based Authentication**: Secure admin access
- **Input Validation**: Server-side validation for all forms
- **File Upload Security**: Restricted file types and sizes
- **CSRF Protection**: Session-based security
- **Environment Variables**: Sensitive data protection

## 📧 Email Integration

The application includes email functionality for:
- Contact form notifications
- Application confirmations
- Newsletter management

Configure email settings in the `.env` file using your preferred SMTP provider.

## 🚀 Deployment

### Production Considerations
1. **Environment Variables**: Set all required environment variables
2. **Database**: Use MongoDB Atlas or dedicated MongoDB instance
3. **File Storage**: Consider cloud storage for uploaded images
4. **SSL/HTTPS**: Enable HTTPS in production
5. **Process Management**: Use PM2 or similar for process management

### Deployment Steps
1. Set `NODE_ENV=production`
2. Configure production database URI
3. Set secure session secrets
4. Configure email service
5. Set up reverse proxy (nginx recommended)
6. Enable SSL certificates

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License - see the package.json file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation in the `/docs` folder (if available)

## 🔄 Version History

- **v1.0.0**: Initial release with core functionality
  - Public website with all pages
  - Admin dashboard
  - Application management system
  - Email integration
  - File upload capabilities

---

**Built with ❤️ for the Melba Community Center**