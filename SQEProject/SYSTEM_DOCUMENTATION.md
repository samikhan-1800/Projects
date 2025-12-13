# EventHub - Complete System Documentation

**Version:** 2.0.0  
**Last Updated:** December 13, 2025  
**Currency:** Pakistani Rupee (PKR/Rs.)

---

## Table of Contents
1. [System Overview](#system-overview)
2. [System Functionalities](#system-functionalities)
3. [Role-Based Access Control](#role-based-access-control)
4. [Error Handling Measures](#error-handling-measures)
5. [System Requirements](#system-requirements)
6. [Database Architecture](#database-architecture)
7. [API Endpoints](#api-endpoints)
8. [Security Measures](#security-measures)

---

## System Overview

**EventHub** is a comprehensive event management platform built with:
- **Backend:** Node.js + Express.js
- **Frontend:** Vanilla JavaScript (ES6+), HTML5, CSS3
- **Database:** Microsoft SQL Server Express
- **Authentication:** JWT (JSON Web Tokens)
- **Architecture:** RESTful API with role-based access control

### Core Purpose
EventHub enables users to discover events, organizers to manage events, and administrators to oversee the entire platform with advanced analytics and payment management.

---

## System Functionalities

### 1. User Management
- **User Registration & Authentication**
  - Secure registration with email validation
  - Password hashing using bcrypt (10 salt rounds)
  - JWT-based authentication with configurable expiration
  - Session management with refresh tokens
  - Account status tracking (Active, Inactive, Suspended, Banned, Pending)
  - Login attempt tracking and account lockout mechanism
  - Two-factor authentication support (structure in place)

- **Profile Management**
  - Update personal information (name, phone, bio, website)
  - Avatar/profile picture upload
  - User preferences (email notifications, SMS, marketing)
  - Password reset functionality
  - Email verification system

- **User Statistics**
  - Total events attended
  - Total bookings made
  - Favorite events tracking
  - User reviews and ratings

### 2. Event Discovery & Browsing
- **Public Event Listing**
  - Browse all published events without authentication
  - Featured events showcase on landing page
  - Event cards with image, title, date, venue, price
  - Real-time availability display

- **Search & Filtering**
  - Search by event title/description
  - Filter by category (Technology, Music, Sports, Business, Art, Food, Health, Education, Community, Entertainment)
  - Filter by price range (Rs. 5,000 - Rs. 20,000+)
  - Filter by date range
  - Filter by location (online/venue)
  - Sort by date, popularity, price

- **Event Details**
  - Comprehensive event information
  - Gallery images and featured image
  - Venue/location details with maps integration
  - Organizer profile and contact
  - Event requirements and prerequisites
  - Attendee count and capacity
  - Reviews and ratings
  - Similar event recommendations

### 3. Booking & Ticketing
- **Ticket Booking**
  - Multiple ticket types support
  - Quantity selection (1-10 tickets per user, configurable)
  - Dynamic price calculation with platform fees (12.8%)
  - Guest information collection
  - Special requests handling
  - Promo code/discount support

- **Booking Management**
  - View booking history with filters
  - Booking status tracking (Pending, Confirmed, Cancelled, Refunded, CheckedIn, NoShow)
  - Payment status tracking (Pending, Processing, Completed, Failed, Refunded)
  - Digital ticket generation with QR codes
  - Ticket download (PDF format via html2pdf.js)
  - Booking cancellation and refund requests
  - Payment receipt upload functionality

- **Payment Processing**
  - Support for free and paid events
  - Platform fee calculation
  - Payment proof/receipt upload
  - Transaction ID tracking
  - Multiple currency support (currently PKR)
  - Payment status confirmation by organizers

### 4. Event Creation & Management (Organizers)
- **Event Creation**
  - Multi-step event creation wizard
  - Event details: title, description, category
  - Date/time configuration with timezone support
  - Venue details (physical or online)
  - Capacity and pricing settings
  - Featured image and gallery upload
  - Tags and requirements specification
  - Contact information (email, phone)
  - Draft/publish workflow

- **Event Administration**
  - Edit existing events
  - Update event status (Draft, Pending, Published, Cancelled, Completed)
  - Duplicate events for easy recreation
  - Delete events (with cascade handling)
  - View event analytics and statistics
  - Manage event visibility (public/private)
  - Set registration periods

- **Attendee Management**
  - View all attendees/bookings
  - Filter by event, status, payment status
  - Export attendee list
  - Contact individual attendees
  - Confirm/reject payment manually
  - View payment receipts
  - Mark attendees as checked-in
  - Handle refunds and cancellations
  - Send bulk communications

- **Analytics Dashboard**
  - Revenue tracking and trends
  - Ticket sales analytics
  - Booking count by event
  - Average booking value
  - Revenue charts (daily, weekly, monthly)
  - Event performance metrics
  - Conversion rates (views to bookings)
  - Top performing events
  - Payment transaction history

- **Financial Management**
  - Total earnings calculation
  - Net revenue after platform fees
  - Platform fee breakdown
  - Transaction history
  - Payment status tracking
  - Revenue per event
  - Monthly revenue reports

### 5. Administrative Functions
- **Dashboard Overview**
  - Total users count
  - Total events count
  - Total bookings count
  - Total platform revenue
  - Recent activity feed
  - System health monitoring

- **User Management**
  - View all users with filters
  - User role management (User, Organizer, Admin)
  - User status control (Active, Suspended, Banned)
  - Search users by name/email
  - View user details and statistics
  - Promote users to admin
  - Suspend/activate accounts

- **Event Moderation**
  - Review pending events
  - Approve/reject events
  - Change event status
  - Feature events on homepage
  - View event analytics
  - Suspend problematic events

- **Category Management**
  - Create/edit/delete categories
  - Set category icons and colors
  - Manage category sort order
  - Activate/deactivate categories

- **Booking Oversight**
  - View all platform bookings
  - Filter by status, event, user
  - Transaction monitoring
  - Refund processing
  - Revenue analytics

- **Organizer Verification**
  - Review organizer applications
  - Verify business licenses
  - Set custom commission rates
  - Monitor organizer performance
  - Handle verification documents

- **System Analytics**
  - Platform-wide revenue tracking
  - User growth metrics
  - Event creation trends
  - Booking patterns
  - Top performing categories
  - Financial reports by period

### 6. Notification System
- **Email Notifications**
  - Booking confirmations
  - Payment status updates
  - Event reminders (24h, 1h before)
  - Event cancellation alerts
  - New message notifications
  - Marketing emails (opt-in)

- **In-App Notifications**
  - Real-time notification feed
  - Unread notification counter
  - Mark as read/unread
  - Notification history
  - Notification preferences

### 7. Social & Community Features
- **Event Reviews**
  - Rate events (1-5 stars)
  - Write detailed reviews
  - Verified purchase badges
  - Helpful voting system
  - Review moderation (pending/published/hidden/flagged)

- **Event Sharing**
  - Share to Facebook, Twitter, LinkedIn, WhatsApp
  - Generate shareable links
  - Copy event URL
  - Email sharing

- **Calendar Integration**
  - Add to Google Calendar
  - Add to Outlook Calendar
  - Download .ics file
  - Set event reminders

- **Favorites/Wishlist**
  - Save events to favorites
  - View saved events
  - Remove from favorites
  - Favorite notifications

### 8. Content Management
- **About Page**
  - Mission and vision
  - Team information
  - Company history

- **Contact System**
  - Contact form submission
  - FAQs section
  - Support ticket system (structure in place)

### 9. Security Features
- **Authentication Security**
  - Secure password hashing (bcrypt)
  - JWT token-based authentication
  - Token expiration and refresh
  - Session management
  - Device tracking

- **Authorization**
  - Role-based access control (RBAC)
  - Route-level protection
  - Resource ownership verification
  - Admin-only endpoints

- **Input Validation**
  - Joi schema validation on backend
  - Frontend form validation
  - SQL injection prevention (parameterized queries)
  - XSS protection (input sanitization)

- **Rate Limiting**
  - API rate limiting (100 requests per 15 minutes per IP)
  - Brute force protection
  - Login attempt tracking

- **Security Headers**
  - Helmet.js middleware
  - CORS configuration
  - Content Security Policy

### 10. Developer Features
- **Health Check Endpoint**
  - Server status monitoring
  - Database connectivity check
  - System uptime tracking
  - Environment information

- **Logging**
  - Morgan HTTP request logging
  - Error logging to console
  - Transaction tracking
  - Audit trails

- **Database Management**
  - Connection pooling
  - Health check queries
  - Automatic reconnection
  - Database info retrieval

---

## Role-Based Access Control

### Role Hierarchy
1. **Admin** - Full system access
2. **Organizer** - Event management and attendee access
3. **User** - Basic browsing and booking

### User Role Capabilities

#### 1. Guest (Not Authenticated)
**Can Access:**
- ✅ Landing page
- ✅ Browse all public events
- ✅ View event details
- ✅ Search and filter events
- ✅ View event categories
- ✅ About page
- ✅ Contact page
- ✅ Register for account
- ✅ Login

**Cannot Access:**
- ❌ Book events
- ❌ Save favorites
- ❌ Write reviews
- ❌ Access dashboards
- ❌ Create events
- ❌ View booking history

#### 2. User Role
**Can Access:**
- ✅ All Guest capabilities
- ✅ Book event tickets
- ✅ View booking history
- ✅ Download tickets/receipts
- ✅ Cancel bookings
- ✅ Request refunds
- ✅ Upload payment receipts
- ✅ Update profile
- ✅ Manage preferences
- ✅ Save favorite events
- ✅ Write event reviews
- ✅ Rate events
- ✅ Access user dashboard
- ✅ View notifications
- ✅ Share events
- ✅ Add events to calendar

**Cannot Access:**
- ❌ Create events
- ❌ View organizer dashboard
- ❌ Access attendee lists
- ❌ View revenue analytics
- ❌ Confirm payments
- ❌ Administrative functions

**API Endpoints Available:**
- `GET /api/auth/me` - Get current user
- `GET /api/users/profile` - Get profile
- `PATCH /api/users/profile` - Update profile
- `GET /api/users/stats` - Get user statistics
- `GET /api/users/favorites` - Get favorite events
- `POST /api/users/favorites/:eventId` - Add to favorites
- `DELETE /api/users/favorites/:eventId` - Remove from favorites
- `GET /api/users/reviews` - Get user reviews
- `GET /api/events` - Browse events
- `GET /api/events/:id` - View event details
- `POST /api/bookings` - Create booking
- `GET /api/bookings/my` - Get user bookings
- `GET /api/bookings/:id` - Get booking details
- `PATCH /api/bookings/:id/cancel` - Cancel booking
- `PATCH /api/bookings/:id/upload-receipt` - Upload payment receipt
- `GET /api/notifications` - Get notifications
- `PATCH /api/notifications/:id/read` - Mark notification as read

#### 3. Organizer Role
**Can Access:**
- ✅ All User capabilities
- ✅ Create new events
- ✅ Edit own events
- ✅ Delete own events
- ✅ Duplicate events
- ✅ View organizer dashboard
- ✅ View event analytics
- ✅ Track event revenue
- ✅ View attendee lists
- ✅ Export attendee data
- ✅ Confirm/reject payments
- ✅ View payment receipts
- ✅ Check-in attendees
- ✅ Contact attendees
- ✅ Process refunds
- ✅ View transaction history
- ✅ Access revenue reports
- ✅ Update organization profile

**Cannot Access:**
- ❌ Approve other organizers' events
- ❌ Access admin dashboard
- ❌ Manage users
- ❌ Manage categories
- ❌ View platform-wide analytics
- ❌ Change user roles
- ❌ Access other organizers' events
- ❌ Modify platform settings

**Additional API Endpoints:**
- `POST /api/events` - Create event
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event
- `GET /api/events/my` - Get organizer's events
- `GET /api/bookings/organizer/attendees` - Get attendees
- `GET /api/bookings/organizer/analytics` - Get analytics
- `POST /api/bookings/:id/confirm-payment` - Confirm payment
- `POST /api/bookings/:id/reject-payment` - Reject payment
- `PATCH /api/bookings/:id/check-in` - Check-in attendee

**Business Rules:**
- Can only manage own events
- Cannot modify events created by other organizers
- Revenue calculated with platform commission (12.8% default)
- Must have verified organizer account
- Subject to event approval workflow

#### 4. Admin Role
**Can Access:**
- ✅ All Organizer capabilities
- ✅ Admin dashboard
- ✅ Manage all users
- ✅ Suspend/ban users
- ✅ Promote users to admin
- ✅ Approve/reject events
- ✅ Feature events
- ✅ Manage all categories
- ✅ View platform-wide analytics
- ✅ Access all bookings
- ✅ Process all refunds
- ✅ Verify organizers
- ✅ Set commission rates
- ✅ View system health
- ✅ Access audit logs
- ✅ Manage system settings
- ✅ Override event status
- ✅ View all transactions

**Full Access - No Restrictions**

**Additional API Endpoints:**
- `GET /api/admin/dashboard/stats` - Platform statistics
- `GET /api/admin/users` - Get all users
- `PATCH /api/admin/users/:id/role` - Change user role
- `PATCH /api/admin/users/:id/status` - Change user status
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/events` - Get all events
- `PATCH /api/admin/events/:id/status` - Change event status
- `PATCH /api/admin/events/:id/feature` - Feature/unfeature event
- `GET /api/admin/categories` - Manage categories
- `POST /api/admin/categories` - Create category
- `PATCH /api/admin/categories/:id` - Update category
- `DELETE /api/admin/categories/:id` - Delete category
- `GET /api/admin/bookings` - Get all bookings
- `GET /api/admin/transactions` - Get all transactions
- `GET /api/admin/organizers` - Get all organizers
- `PATCH /api/admin/organizers/:id/verify` - Verify organizer
- `PATCH /api/admin/organizers/:id/commission` - Set commission rate

---

## Error Handling Measures

### 1. Backend Error Handling

#### A. Authentication Errors
```javascript
// Token validation errors
- 401 Unauthorized: "Access token required"
- 403 Forbidden: "Invalid or expired token"
- 403 Forbidden: "Access denied. [Role] role required"
- 401 Unauthorized: "Authentication required"
```

#### B. Validation Errors
```javascript
// Using Joi validation schemas
- 400 Bad Request: "Validation failed" (with details)
- 400 Bad Request: "Missing required fields"
- 400 Bad Request: "Invalid email format"
- 400 Bad Request: "Invalid GUID format"
- 400 Bad Request: "Invalid event ID format"
```

#### C. Business Logic Errors
```javascript
// User registration
- 409 Conflict: "User already exists with this email"

// Login
- 401 Unauthorized: "Invalid credentials"
- 401 Unauthorized: "Account is suspended or inactive"

// Event operations
- 404 Not Found: "Event not found"
- 400 Bad Request: "Event is full"
- 400 Bad Request: "Booking period has ended"

// Booking operations
- 400 Bad Request: "Insufficient tickets available"
- 403 Forbidden: "Cannot book own event"
- 400 Bad Request: "Cannot cancel confirmed booking"
```

#### D. Database Errors
```javascript
// Database connection
- 503 Service Unavailable: "Database connection failed"
- 500 Internal Server Error: "Query execution failed"

// Transaction errors
try {
    await database.query(...);
} catch (error) {
    console.error('Database error:', error);
    res.status(500).json({
        error: 'Database operation failed'
    });
}
```

#### E. Global Error Handler
```javascript
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    
    if (res.headersSent) {
        return next(error);
    }
    
    const statusCode = error.statusCode || error.status || 500;
    
    res.status(statusCode).json({
        error: process.env.NODE_ENV === 'production' 
            ? (statusCode === 500 ? 'Internal server error' : error.message)
            : error.message,
        stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
    });
});
```

#### F. Rate Limiting Protection
```javascript
// Rate limiter configuration
- Window: 15 minutes
- Max requests: 100 per IP
- Response: 429 Too Many Requests
- Message: "Too many requests from this IP, please try again later"
```

### 2. Frontend Error Handling

#### A. API Request Error Handling
```javascript
async function apiRequest(endpoint, options = {}) {
    try {
        const response = await fetch(...);
        
        // Handle specific status codes
        if (response.status === 401) {
            // Redirect to login
            showAlert('Session expired. Please log in again.', 'warning');
            setTimeout(() => window.location.href = 'login.html', 2000);
            throw new Error('Unauthorized');
        }
        
        if (response.status === 403) {
            throw new Error('Access forbidden. You do not have permission.');
        }
        
        if (response.status === 404) {
            throw new Error('Resource not found.');
        }
        
        if (response.status === 500) {
            throw new Error('Server error occurred.');
        }
        
        // Parse error response
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Request failed');
        }
        
        return await response.json();
    } catch (error) {
        // Network errors
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            showAlert('Cannot connect to server. Please ensure backend is running.', 'danger');
        }
        throw error;
    }
}
```

#### B. Form Validation
```javascript
function validateForm(formId) {
    const form = document.getElementById(formId);
    let isValid = true;
    
    // Required field validation
    const requiredFields = form.querySelectorAll('[required]');
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            isValid = false;
            field.classList.add('error');
            showFieldError(field, 'This field is required');
        }
    });
    
    // Email validation
    const emailFields = form.querySelectorAll('input[type="email"]');
    emailFields.forEach(field => {
        if (field.value && !isValidEmail(field.value)) {
            isValid = false;
            showFieldError(field, 'Invalid email format');
        }
    });
    
    // Password strength validation
    // Date validation
    // Number range validation
    
    return isValid;
}
```

#### C. User-Friendly Error Messages
```javascript
// Alert system with types
showAlert(message, type) {
    // Types: 'success', 'danger', 'warning', 'info'
    // Auto-dismiss after 5 seconds
    // Visual feedback with icons and colors
}

// Specific error scenarios
- "Please log in to book events"
- "Event is fully booked"
- "Payment confirmation required"
- "Session expired, please log in again"
- "Cannot connect to server"
- "Invalid file format. Please upload an image"
```

#### D. File Upload Validation
```javascript
// Image validation
- Max file size: 10MB
- Allowed formats: .jpg, .jpeg, .png, .gif
- Dimension validation
- File type verification

if (file.size > 10 * 1024 * 1024) {
    showAlert('File too large. Maximum size is 10MB', 'danger');
    return false;
}
```

#### E. Try-Catch Blocks
```javascript
// All async operations wrapped in try-catch
async function loadDashboard() {
    try {
        const data = await apiRequest('/api/dashboard');
        renderDashboard(data);
    } catch (error) {
        console.error('Dashboard load failed:', error);
        showAlert('Failed to load dashboard. Please refresh.', 'danger');
    }
}
```

### 3. Database Error Handling

#### A. Connection Management
```javascript
// Automatic reconnection
// Connection pool management
// Health check queries
// Timeout handling

async healthCheck() {
    try {
        await sql.query('SELECT 1');
        return true;
    } catch (error) {
        console.error('Health check failed:', error);
        return false;
    }
}
```

#### B. Query Error Handling
```javascript
// Parameterized queries to prevent SQL injection
await database.query(`
    SELECT * FROM Users WHERE UserId = @userId
`, { userId });

// Transaction rollback on error
// Constraint violation handling
// Deadlock retry logic
```

#### C. Data Integrity
```javascript
// Foreign key constraint errors
- Cascade delete rules
- Referential integrity checks
- Unique constraint validation
- Check constraint validation
```

### 4. Security Error Handling

#### A. Input Sanitization
```javascript
// XSS prevention
- HTML escaping
- SQL parameterization
- JSON sanitization
- Path traversal prevention
```

#### B. CORS Errors
```javascript
// CORS configuration
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://yourdomain.com'] 
        : true,
    credentials: true
}));
```

#### C. Helmet Security Headers
```javascript
// Security headers middleware
app.use(helmet());
// - X-Content-Type-Options
// - X-Frame-Options
// - X-XSS-Protection
// - Strict-Transport-Security
```

### 5. Logging and Monitoring

#### A. Request Logging
```javascript
// Morgan HTTP logger
app.use(morgan('combined'));
// Logs: IP, method, URL, status, response time
```

#### B. Error Logging
```javascript
// Console error logging
console.error('Operation failed:', error);
console.error('Full error:', error.stack);

// Includes:
- Error message
- Stack trace
- Request context
- User information
- Timestamp
```

#### C. Transaction Tracking
```javascript
// Booking reference generation
// Transaction ID tracking
// Audit trail maintenance
// Activity logging
```

### 6. Graceful Degradation

#### A. Offline Handling
```javascript
// Network error detection
// Cached data display
// Retry mechanisms
// User notification
```

#### B. Fallback Content
```javascript
// Default images for events
// Placeholder text
// Empty state messages
// Loading indicators
```

#### C. Progressive Enhancement
```javascript
// Core functionality works without JS
// Enhanced features with JS enabled
// Mobile responsive fallbacks
// Browser compatibility checks
```

---

## System Requirements

### 1. Server Requirements

#### A. Hardware Requirements
**Minimum:**
- CPU: 2 cores @ 2.0 GHz
- RAM: 4 GB
- Storage: 20 GB SSD
- Network: 10 Mbps

**Recommended:**
- CPU: 4 cores @ 2.5 GHz or higher
- RAM: 8 GB or higher
- Storage: 50 GB SSD
- Network: 100 Mbps or higher

#### B. Operating System
- **Windows:** Windows Server 2016 or later, Windows 10/11
- **Linux:** Ubuntu 20.04 LTS or later, CentOS 8 or later
- **macOS:** macOS 10.15 (Catalina) or later

### 2. Software Requirements

#### A. Runtime Environment
```json
{
  "node": ">=16.0.0",
  "npm": ">=8.0.0"
}
```

**Node.js 16.x or higher** (LTS version recommended)
- Required for ES6+ features
- Async/await support
- Modern JavaScript features

#### B. Database
**Microsoft SQL Server**
- SQL Server Express 2019 or later (Free)
- SQL Server Standard/Enterprise (Paid versions)
- Minimum version: SQL Server 2016

**Database Configuration:**
- Database name: `EventHubDB`
- Authentication: SQL Server or Windows Authentication
- Collation: SQL_Latin1_General_CP1_CI_AS
- Initial size: 100 MB
- Max size: 10 GB (configurable)

#### C. Backend Dependencies
```json
{
  "express": "^4.18.2",           // Web framework
  "cors": "^2.8.5",                // CORS middleware
  "helmet": "^7.1.0",              // Security headers
  "morgan": "^1.10.0",             // HTTP request logger
  "dotenv": "^16.3.1",             // Environment variables
  "mssql": "^10.0.1",              // SQL Server driver
  "bcryptjs": "^2.4.3",            // Password hashing
  "jsonwebtoken": "^9.0.2",        // JWT authentication
  "joi": "^17.11.0",               // Validation
  "multer": "^1.4.5-lts.1",        // File upload
  "nodemailer": "^6.9.7",          // Email service
  "express-rate-limit": "^7.1.5"   // Rate limiting
}
```

#### D. Development Dependencies
```json
{
  "nodemon": "^3.0.1"              // Auto-restart on changes
}
```

### 3. Frontend Requirements

#### A. Browser Compatibility
**Supported Browsers:**
- Google Chrome 90+ ✅
- Mozilla Firefox 88+ ✅
- Microsoft Edge 90+ ✅
- Safari 14+ ✅
- Opera 76+ ✅

**Mobile Browsers:**
- Chrome Mobile (Android)
- Safari Mobile (iOS)
- Samsung Internet

**Minimum Requirements:**
- ES6 JavaScript support
- Fetch API support
- LocalStorage support
- CSS Grid and Flexbox
- HTML5 features

#### B. Frontend Libraries
```html
<!-- CDN Dependencies -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
```

**Font Awesome 6.0.0** - Icons
**html2pdf.js 0.10.1** - PDF generation

#### C. Screen Resolution
**Minimum:** 320px (Mobile)
**Recommended:** 1024px or higher (Desktop)

**Responsive Breakpoints:**
- Mobile: 320px - 767px
- Tablet: 768px - 1023px
- Desktop: 1024px+
- Large Desktop: 1440px+

### 4. Network Requirements

#### A. Ports
- **Backend API:** Port 3000 (configurable)
- **Database:** Port 1433 (SQL Server default)

#### B. Connectivity
- Stable internet connection for API calls
- Minimum bandwidth: 1 Mbps
- Recommended: 5 Mbps or higher

#### C. Protocols
- HTTP/HTTPS
- WebSocket (for real-time features - future)

### 5. Environment Configuration

#### A. Required Environment Variables
```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_SERVER=localhost
DB_DATABASE=EventHubDB
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_PORT=1433
DB_ENCRYPT=true
DB_TRUST_SERVER_CERTIFICATE=true

# JWT Configuration
JWT_SECRET=your_very_secure_random_string_here
JWT_EXPIRES_IN=86400  # 24 hours in seconds

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000    # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100     # Max requests per window

# File Upload
MAX_FILE_SIZE=10485760          # 10MB in bytes
UPLOAD_PATH=./uploads

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_FROM=noreply@eventhub.com

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5500
```

### 6. Storage Requirements

#### A. Database Storage
**Initial:** 100 MB
**Growth rate:** ~10-20 MB per 1000 events
**Recommended:** 10 GB allocated

**Breakdown:**
- Users table: ~1 KB per user
- Events table: ~5 KB per event
- Bookings table: ~2 KB per booking
- Images (if stored in DB): ~500 KB per event
- Logs and analytics: ~1 MB per month

#### B. File Storage
**Upload Directory:** `./uploads/`
- Event images: ~500 KB - 2 MB per event
- Payment receipts: ~100-500 KB per receipt
- User avatars: ~50-200 KB per user

**Estimated:** 5-10 GB per 1000 events with images

### 7. Security Requirements

#### A. SSL/TLS
- HTTPS required for production
- Valid SSL certificate
- TLS 1.2 or higher

#### B. Firewall Rules
- Allow inbound: Port 3000 (API)
- Allow outbound: Port 1433 (Database)
- Allow outbound: Port 443 (HTTPS)
- Allow outbound: Port 587 (SMTP)

#### C. Authentication
- Strong password policy (min 6 chars)
- Password hashing with bcrypt
- JWT token expiration
- Session management

### 8. Performance Requirements

#### A. Response Time
- API endpoints: < 500ms (average)
- Database queries: < 200ms
- Page load: < 3 seconds
- Image load: < 2 seconds

#### B. Concurrency
- Support: 100 concurrent users (minimum)
- Recommended: 500+ concurrent users
- Database connections: 10-50 pool size

#### C. Scalability
- Horizontal scaling capable
- Load balancer compatible
- Stateless API design
- Database clustering support

### 9. Backup & Recovery

#### A. Database Backup
- Daily full backups recommended
- Transaction log backups every 4 hours
- Retention: 30 days minimum

#### B. File Backup
- Backup upload directory daily
- Version control for code
- Configuration file backups

#### C. Disaster Recovery
- RTO (Recovery Time Objective): < 4 hours
- RPO (Recovery Point Objective): < 1 hour
- Backup testing: Monthly

### 10. Monitoring & Maintenance

#### A. Health Checks
- `/health` endpoint monitoring
- Database connectivity checks
- Disk space monitoring
- Memory usage tracking

#### B. Log Management
- Log rotation: Daily
- Log retention: 30 days
- Error log monitoring
- Access log analysis

#### C. Updates
- Security patches: As needed
- Dependency updates: Monthly
- Database maintenance: Weekly
- Performance optimization: Quarterly

---

## Database Architecture

### Schema Organization
The database is organized into 5 schemas:

1. **[Users]** - User management
   - Users (base table for all users)
   - UserSessions (JWT session management)
   - Organizers (organizer-specific data)
   - UserPreferences
   - UserNotificationSettings

2. **[Events]** - Event management
   - Events (main event data)
   - EventTickets (ticket types)
   - Bookings (ticket bookings)
   - Categories (event categories)
   - Reviews (event reviews)
   - Favorites (user favorites)

3. **[Payments]** - Financial transactions
   - Transactions (all financial transactions)
   - Refunds
   - Payouts

4. **[Analytics]** - Tracking and analytics
   - EventViews (page view tracking)
   - UserActivity (user action tracking)

5. **[System]** - System management
   - ActivityLogs (audit trails)
   - Notifications (in-app notifications)

### Key Tables

#### Users.Users
- Primary user table
- Roles: User, Organizer, Admin
- Status: Active, Inactive, Suspended, Banned, Pending
- Password hashing with salt
- Email verification
- Two-factor authentication support
- Login attempt tracking
- Account lockout mechanism

#### Users.Organizers
- Extends Users table
- Organization details
- Verification workflow
- Commission rate (default 12.8%)
- Revenue tracking
- Rating system

#### Events.Events
- Comprehensive event details
- Status workflow: Draft → Pending → Approved → Published
- Supports online and venue events
- Pricing: Free and paid events
- Capacity management
- Media support (images, videos)
- Analytics tracking (views, bookings, revenue)
- Featured events capability

#### Events.Bookings
- Booking reference system
- Multi-ticket support
- Status: Pending, Confirmed, Cancelled, Refunded, CheckedIn, NoShow
- Payment status tracking
- QR code generation
- Platform fee calculation (12.8%)
- Attendee information storage
- Check-in mechanism

#### Payments.Transactions
- All financial transactions
- Types: Payment, Refund, Payout, Fee
- Gateway integration support
- Platform fee tracking
- Net amount calculation

### Relationships
- One-to-Many: User → Bookings
- One-to-Many: Event → Bookings
- One-to-Many: Organizer → Events
- One-to-Many: Category → Events
- Many-to-One: Booking → Event
- One-to-Many: Event → Reviews
- Foreign key constraints with CASCADE rules

### Indexes
Strategic indexes on:
- Email lookups (Users.Email)
- Event queries (CategoryId, Status, StartDate)
- Booking searches (EventId, UserId, Status)
- Authentication (Session tokens, QR codes)

---

## API Endpoints

### Public Endpoints (No Authentication Required)

#### Events
- `GET /api/events` - List all events (with filters)
- `GET /api/events/:id` - Get event details
- `GET /api/events/categories` - Get all categories

#### Contact
- `POST /api/contact` - Submit contact form

#### Health
- `GET /health` - System health check
- `GET /` - API information

### Authentication Endpoints

#### Auth
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user (requires token)
- `POST /api/auth/logout` - Logout (requires token)

### User Endpoints (Requires Authentication)

#### Profile
- `GET /api/users/profile` - Get user profile
- `PATCH /api/users/profile` - Update profile
- `GET /api/users/stats` - Get user statistics

#### Favorites
- `GET /api/users/favorites` - Get favorite events
- `POST /api/users/favorites/:eventId` - Add to favorites
- `DELETE /api/users/favorites/:eventId` - Remove from favorites

#### Reviews
- `GET /api/users/reviews` - Get user reviews
- `POST /api/events/:eventId/reviews` - Create review
- `PATCH /api/reviews/:id` - Update review
- `DELETE /api/reviews/:id` - Delete review

### Booking Endpoints (Requires Authentication)

#### User Bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings/my` - Get user bookings
- `GET /api/bookings/:id` - Get booking details
- `PATCH /api/bookings/:id/cancel` - Cancel booking
- `PATCH /api/bookings/:id/upload-receipt` - Upload payment receipt

#### Organizer Bookings (Organizer/Admin only)
- `GET /api/bookings/organizer/attendees` - Get event attendees
- `GET /api/bookings/organizer/analytics` - Get booking analytics
- `POST /api/bookings/:id/confirm-payment` - Confirm payment
- `POST /api/bookings/:id/reject-payment` - Reject payment
- `PATCH /api/bookings/:id/check-in` - Check-in attendee

### Event Management (Organizer/Admin)

#### Event CRUD
- `POST /api/events` - Create event
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event
- `GET /api/events/my` - Get organizer's events

### Admin Endpoints (Admin only)

#### Dashboard
- `GET /api/admin/dashboard/stats` - Platform statistics

#### User Management
- `GET /api/admin/users` - Get all users
- `GET /api/admin/users/:id` - Get user details
- `PATCH /api/admin/users/:id/role` - Change user role
- `PATCH /api/admin/users/:id/status` - Change user status
- `DELETE /api/admin/users/:id` - Delete user

#### Event Management
- `GET /api/admin/events` - Get all events
- `PATCH /api/admin/events/:id/status` - Change event status
- `PATCH /api/admin/events/:id/feature` - Feature/unfeature event

#### Category Management
- `GET /api/admin/categories` - Get all categories
- `POST /api/admin/categories` - Create category
- `PATCH /api/admin/categories/:id` - Update category
- `DELETE /api/admin/categories/:id` - Delete category

#### Booking Management
- `GET /api/admin/bookings` - Get all bookings
- `GET /api/admin/transactions` - Get all transactions

#### Organizer Management
- `GET /api/admin/organizers` - Get all organizers
- `PATCH /api/admin/organizers/:id/verify` - Verify organizer
- `PATCH /api/admin/organizers/:id/commission` - Set commission rate

### Notification Endpoints
- `GET /api/notifications` - Get user notifications
- `GET /api/notifications/unread` - Get unread count
- `PATCH /api/notifications/:id/read` - Mark as read
- `PATCH /api/notifications/read-all` - Mark all as read

---

## Security Measures

### 1. Authentication & Authorization
- JWT-based authentication
- Role-based access control (RBAC)
- Token expiration (24 hours default)
- Secure password hashing (bcrypt, 10 rounds)
- Session management

### 2. Input Validation
- Joi schema validation
- SQL injection prevention (parameterized queries)
- XSS protection
- CSRF protection
- File upload validation

### 3. Rate Limiting
- 100 requests per 15 minutes per IP
- Brute force protection
- DDoS mitigation

### 4. Security Headers
- Helmet.js middleware
- CORS configuration
- Content Security Policy
- X-Frame-Options
- X-Content-Type-Options

### 5. Data Protection
- Password encryption at rest
- Sensitive data hashing
- Secure password reset flow
- Email verification
- Account lockout after failed attempts

### 6. Audit & Logging
- Activity logging
- Transaction tracking
- Error logging
- Access logging (Morgan)
- Audit trails

---

## Deployment Notes

### Development Setup
1. Install Node.js 16+ and SQL Server
2. Create database using `01_EventHub_Schema.sql`
3. Populate test data using `02_EventHub_Data.sql`
4. Copy `.env.example` to `.env` and configure
5. Run `npm install` in backend directory
6. Start backend: `npm start` or `npm run dev`
7. Open frontend in browser (port 5500 recommended)

### Production Deployment
1. Set `NODE_ENV=production`
2. Configure production database
3. Set strong JWT_SECRET
4. Enable HTTPS/SSL
5. Configure CORS with specific origins
6. Set up database backups
7. Configure email service
8. Set up monitoring and logging
9. Use process manager (PM2)
10. Configure firewall rules

---

## Maintenance & Support

### Regular Maintenance
- **Daily:** Monitor logs, check health endpoint
- **Weekly:** Database maintenance, backup verification
- **Monthly:** Security updates, dependency updates
- **Quarterly:** Performance optimization, capacity planning

### Known Limitations
- Single database server (no clustering in current version)
- File uploads stored locally (no cloud storage)
- Email service requires external SMTP
- No real-time notifications (polling-based)

### Future Enhancements
- WebSocket for real-time updates
- Cloud file storage integration
- Payment gateway integration
- Multi-language support
- Mobile app (React Native)
- Advanced analytics dashboard
- Social authentication (OAuth)
- SMS notifications

---

**Document End**

For technical support or questions, please contact the development team.
