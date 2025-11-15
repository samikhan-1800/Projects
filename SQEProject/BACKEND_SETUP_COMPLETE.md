# EventHub Backend API - Complete Setup Guide

## 🚀 Your EventHub backend API is now complete!

The EventHub backend provides a comprehensive REST API that connects your frontend to the SQL Server database.

## 📁 What was created:

### Core Server Files:
- **`server.js`** - Main Express server with security middleware
- **`package.json`** - Dependencies and scripts
- **`.env.example`** - Environment configuration template

### Database Connection:
- **`config/database.js`** - SQL Server connection with pooling

### Authentication & Security:
- **`routes/auth.js`** - User registration, login, JWT tokens
- **`middleware/auth.js`** - JWT authentication & role-based access

### API Routes:
- **`routes/events.js`** - Event management (CRUD operations)
- **`routes/bookings.js`** - Booking system with payment processing
- **`routes/admin.js`** - Admin dashboard and management
- **`routes/users.js`** - User profile and preferences

## 🔧 Next Steps to Get Started:

### 1. Install Dependencies
```powershell
cd backend
npm install
```

### 2. Configure Environment
```powershell
copy .env.example .env
```

Then edit `.env` with your SQL Server details:
```env
DB_SERVER=localhost
DB_DATABASE=EventHubDB
DB_USERNAME=your_sql_username
DB_PASSWORD=your_sql_password
JWT_SECRET=your-super-secure-secret-key-here
```

### 3. Start the Server
```powershell
# Development mode (auto-restart)
npm run dev

# Or production mode
npm start
```

## 🎯 Key Features Included:

### ✅ **Authentication System**
- JWT tokens with refresh capability
- Secure password hashing (bcrypt)
- Role-based access (User/Organizer/Admin)

### ✅ **Event Management**
- Complete CRUD operations
- Category filtering and search
- Organizer-specific event management
- Admin approval workflow

### ✅ **Booking System**
- Event booking with availability checking
- Ticket type support
- Payment tracking (ready for payment gateway)
- Booking history and status management

### ✅ **Admin Dashboard**
- User management
- Event oversight
- Category management
- System statistics
- Booking monitoring

### ✅ **User Features**
- Profile management
- Favorites/Wishlist system
- Booking history
- Activity statistics
- Notification preferences

### ✅ **Security & Performance**
- Rate limiting
- CORS protection
- Input validation (Joi)
- SQL injection prevention
- Database connection pooling
- Error handling & logging

## 🧪 Test the API:

### Using the Frontend:
1. Start backend: `npm run dev` (port 3000)
2. Open `index.html` in your browser
3. Frontend will connect to the API automatically

### Test Accounts (from your database):
- **Admin:** `admin@eventhub.com` / `Admin123!`
- **Organizer:** `organizer@eventhub.com` / `Organizer123!`
- **User:** `user@eventhub.com` / `User123!`

### API Testing Tools:
- Postman, Insomnia, or Thunder Client
- Health check: `GET http://localhost:3000/health`

## 📊 API Endpoints Overview:

### 🔐 Auth: `/api/auth/`
- POST `/register` - User signup
- POST `/login` - User signin
- POST `/refresh` - Refresh tokens
- POST `/logout` - User signout

### 🎪 Events: `/api/events/`
- GET `/` - List events (with filters)
- GET `/:id` - Event details
- POST `/` - Create event
- PUT `/:id` - Update event
- DELETE `/:id` - Delete event
- GET `/categories` - Event categories

### 🎫 Bookings: `/api/bookings/`
- POST `/` - Create booking
- GET `/my` - User's bookings
- GET `/:id` - Booking details

### 👤 Users: `/api/users/`
- GET `/profile` - User profile
- PATCH `/profile` - Update profile
- GET `/stats` - User statistics
- GET `/favorites` - Favorite events
- POST `/favorites/:eventId` - Add favorite
- DELETE `/favorites/:eventId` - Remove favorite

### 👑 Admin: `/api/admin/`
- GET `/dashboard/stats` - Dashboard data
- GET `/users` - Manage users
- GET `/events` - Manage events
- GET `/categories` - Manage categories
- GET `/bookings` - View all bookings

## 🔗 Database Integration:

Your API connects to the EventHub database you created with:
- **Schema:** `database/01_EventHub_Schema.sql` ✅
- **Data:** `database/02_EventHub_Data.sql` ✅
- **Tests:** `database/test_queries.sql` ✅

## 🎉 You're All Set!

Your EventHub platform now has:
1. ✅ Complete SQL Server database
2. ✅ Production-ready backend API
3. ✅ Clean frontend code (API-integrated)
4. ✅ Full authentication system
5. ✅ Role-based access control
6. ✅ Comprehensive booking system
7. ✅ Admin management interface

Start the backend server and your EventHub platform is ready to use!