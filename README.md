# EventHub Backend API

This is the Node.js backend API for the EventHub project that connects to your SQL Server database.

## Prerequisites

1. Node.js (v16 or higher)
2. SQL Server with EventHub database created
3. SQL Server authentication credentials

## Installation

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure your database connection in `.env` file:
```env
DB_SERVER=localhost
DB_DATABASE=EventHubDB
DB_USERNAME=your_username
DB_PASSWORD=your_password
DB_PORT=1433
JWT_SECRET=your-super-secret-jwt-key-change-in-production-2025
PORT=3000
```

4. Start the server:
```bash
npm start
```

For development with auto-restart:
```bash
npm run dev
```

## API Endpoints

### Public Endpoints
- `GET /api/events` - List all published events
- `GET /api/events/:id` - Get event details
- `GET /api/categories` - Get event categories
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/contact` - Contact form submission

### Authenticated Endpoints
- `GET /api/auth/me` - Get current user
- `GET /api/bookings/my` - Get user's bookings
- `POST /api/bookings` - Create new booking
- `GET /api/notifications/unread` - Get unread notifications

### Admin Endpoints
- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/users` - List all users
- `GET /api/admin/events` - List all events
- `PUT /api/admin/events/:id/approve` - Approve event
- `PUT /api/admin/events/:id/reject` - Reject event

## Database Connection

The API connects to your EventHub SQL Server database using the schema and data you created with:
- `01_EventHub_Schema.sql`
- `02_EventHub_Data.sql`

## Test Users

Use these credentials to test the system:
- **Admin**: admin@eventhub.com / Admin123!
- **Organizer**: organizer@eventhub.com / Organizer123!
- **User**: user@eventhub.com / User123!