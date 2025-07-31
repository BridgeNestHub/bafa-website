# Melba Community Center Website - System Design Document

## 1. System Overview

The Melba Community Center website is a full-stack web application designed to serve dual purposes: a public-facing community portal and an administrative content management system. The architecture follows a traditional MVC pattern with clear separation of concerns.

### 1.1 Core Objectives
- **Public Engagement**: Provide community members with program information, events, and application portals
- **Content Management**: Enable administrators to manage content, applications, and communications
- **Data Collection**: Capture and organize community member applications and inquiries
- **Scalability**: Support growing community needs with maintainable architecture

## 2. Architecture Overview

### 2.1 High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client Layer  │    │  Server Layer   │    │   Data Layer    │
│                 │    │                 │    │                 │
│ • Web Browser   │◄──►│ • Express.js    │◄──►│ • MongoDB       │
│ • Bootstrap UI  │    │ • EJS Templates │    │ • File System   │
│ • JavaScript    │    │ • Session Mgmt  │    │ • Email Service │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 2.2 Technology Stack Rationale

| Component | Technology | Justification |
|-----------|------------|---------------|
| **Runtime** | Node.js | JavaScript ecosystem, async I/O, community support |
| **Framework** | Express.js | Minimal, flexible, extensive middleware ecosystem |
| **Database** | MongoDB | Document-based storage suits varied application forms |
| **ODM** | Mongoose | Schema validation, middleware, query building |
| **Templates** | EJS | Server-side rendering, simple syntax, performance |
| **Frontend** | Bootstrap 5 | Responsive design, accessibility, rapid development |
| **Authentication** | Express Sessions | Simple, secure, server-side session management |

## 3. System Architecture

### 3.1 Layered Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                        │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │  Public Views   │  │  Admin Views    │                  │
│  │  (EJS Pages)    │  │  (Dashboard)    │                  │
│  └─────────────────┘  └─────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                     Application Layer                       │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │  Public Routes  │  │  Admin Routes   │                  │
│  │  (index.js)     │  │  (admin.js)     │                  │
│  └─────────────────┘  └─────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                      Business Layer                         │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │  Utilities      │  │  Middleware     │                  │
│  │  (auth, email)  │  │  (validation)   │                  │
│  └─────────────────┘  └─────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                       Data Layer                            │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │  Models         │  │  Database       │                  │
│  │  (Mongoose)     │  │  (MongoDB)      │                  │
│  └─────────────────┘  └─────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Request Flow

```
User Request → Express Router → Authentication Check → Controller Logic → 
Model Interaction → Database Query → Response Rendering → Client Response
```

## 4. Data Architecture

### 4.1 Database Design Philosophy

The system uses MongoDB's document-based approach to handle diverse application forms with varying field requirements. This provides flexibility for future form modifications without schema migrations.

### 4.2 Data Models Hierarchy

```
Core Content Models
├── Post (Blog/Events)
│   ├── type: 'blog' | 'event'
│   ├── title, content, image
│   └── eventDate, location (events only)
└── Program
    ├── title, description
    └── category, status

Application Models
├── VolunteerApplication
├── EnrollmentApplication  
├── TutorApplication
├── CareerApplyNowApplication
├── BootcampRegistration
└── JoinTeamRegistration

Communication Models
├── ContactSubmission
├── NewsletterSubscription
├── BecomePartnerInquiry
└── FundInternshipInquiry
```

### 4.3 Data Relationships

- **Polymorphic Design**: Post model handles both blogs and events using type discrimination
- **Loose Coupling**: Application models are independent to allow form evolution
- **Audit Trail**: All models include timestamps for tracking and analytics

## 5. Security Architecture

### 5.1 Security Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Security                     │
│  • Input Validation    • File Upload Restrictions          │
│  • SQL Injection Prevention    • XSS Protection            │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                  Authentication & Authorization             │
│  • Session-based Auth    • Admin Role Verification         │
│  • Password Hashing      • Session Timeout                 │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                     Transport Security                      │
│  • HTTPS Enforcement    • Secure Headers                   │
│  • CSRF Protection      • Environment Variables            │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Authentication Flow

```
Login Request → Credential Validation → bcrypt Password Check → 
Session Creation → Admin Dashboard Access → Session Validation (per request)
```

## 6. API Design

### 6.1 RESTful API Structure

```
Public API
├── GET  /                    # Homepage
├── GET  /programs            # Programs listing
├── POST /contact             # Contact form
├── POST /subscribe           # Newsletter
└── POST /api/{application}   # Form submissions

Admin API
├── GET    /admin/api/{resource}     # List resources
├── GET    /admin/api/{resource}/:id # Get single resource
├── POST   /admin/api/{resource}     # Create resource
├── PUT    /admin/api/{resource}/:id # Update resource
└── DELETE /admin/api/{resource}/:id # Delete resource
```

### 6.2 Response Patterns

```javascript
// Success Response
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { /* resource data */ }
}

// Error Response
{
  "success": false,
  "message": "Error description",
  "errors": { /* validation errors */ }
}
```

## 7. File Management Architecture

### 7.1 Upload Strategy

```
File Upload → Multer Middleware → Validation → Disk Storage → 
Database Path Reference → Cleanup on Delete
```

### 7.2 File Organization

```
public/images/
├── logos/          # Partner and organization logos
├── successStories/ # Community member photos
└── uploads/        # Dynamic content images
    └── {timestamp}-{random}.{ext}
```

## 8. Performance Considerations

### 8.1 Optimization Strategies

- **Database Indexing**: Text indexes on searchable fields
- **Image Optimization**: File size limits and type restrictions
- **Session Management**: Configurable session timeouts
- **Static Asset Serving**: Express static middleware for public files

### 8.2 Scalability Patterns

- **Stateless Design**: Session data stored server-side for horizontal scaling
- **Database Connection Pooling**: Mongoose connection management
- **Modular Architecture**: Clear separation allows microservice migration

## 9. Error Handling Strategy

### 9.1 Error Hierarchy

```
Application Errors
├── Validation Errors (400)
├── Authentication Errors (401)
├── Authorization Errors (403)
├── Not Found Errors (404)
└── Server Errors (500)
```

### 9.2 Error Flow

```
Error Occurrence → Error Middleware → Logging → User-Friendly Response → 
Client Error Display
```

## 10. Development Patterns

### 10.1 Code Organization Principles

- **Single Responsibility**: Each module handles one concern
- **DRY (Don't Repeat Yourself)**: Shared utilities and middleware
- **Configuration Management**: Environment-based settings
- **Consistent Naming**: Clear, descriptive function and variable names

### 10.2 Middleware Pipeline

```
Request → Body Parser → Session Management → Static Files → 
Authentication (admin routes) → Route Handler → Error Handler → Response
```

## 11. Deployment Architecture

### 11.1 Production Environment

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Load Balancer │    │   Web Server    │    │    Database     │
│   (nginx)       │◄──►│   (Node.js)     │◄──►│   (MongoDB)     │
│                 │    │   (PM2)         │    │   (Atlas)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 11.2 Deployment Considerations

- **Process Management**: PM2 for application lifecycle
- **Reverse Proxy**: nginx for SSL termination and static files
- **Database**: MongoDB Atlas for managed database service
- **Environment Variables**: Secure configuration management

## 12. Future Enhancements

### 12.1 Potential Improvements

- **API Rate Limiting**: Prevent abuse and ensure fair usage
- **Caching Layer**: Redis for session storage and content caching
- **Search Functionality**: Full-text search across content
- **Analytics Integration**: User behavior tracking and insights
- **Mobile App API**: RESTful API for mobile application
- **Multi-language Support**: Internationalization for diverse community

### 12.2 Migration Paths

- **Microservices**: Split application and content management services
- **Cloud Storage**: Move file uploads to AWS S3 or similar
- **CDN Integration**: Content delivery network for static assets
- **Container Deployment**: Docker containerization for consistent deployments

---

**Document Version**: 1.0  
**Last Updated**: January 2025  
**Maintained By**: Development Team