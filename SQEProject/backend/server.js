const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const database = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const bookingRoutes = require('./routes/bookings');
const adminRoutes = require('./routes/admin');
const userRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// CORS configuration - Allow all origins in development
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://yourdomain.com'] 
        : true, // Allow all origins in development
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many requests from this IP, please try again later.'
    }
});
app.use('/api', limiter);

// Logging
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static files (for uploaded images)
app.use('/uploads', express.static('uploads'));

// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        const dbHealth = await database.healthCheck();
        const dbInfo = await database.getDatabaseInfo();
        
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            database: {
                connected: dbHealth,
                info: dbInfo
            },
            server: {
                uptime: process.uptime(),
                version: process.version,
                environment: process.env.NODE_ENV || 'development'
            }
        });
    } catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', require('./routes/notifications'));

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'EventHub API Server',
        version: '1.0.0',
        documentation: '/api/docs',
        health: '/health'
    });
});

// Contact form endpoint
app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;
        
        // Here you would typically save to database or send email
        console.log('Contact form submission:', { name, email, subject, message });
        
        res.json({
            message: 'Contact form submitted successfully',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Contact form error:', error);
        res.status(500).json({
            error: 'Failed to submit contact form'
        });
    }
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Route not found',
        path: req.originalUrl
    });
});

// Global error handler
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    
    // Check if headers were already sent
    if (res.headersSent) {
        return next(error);
    }
    
    // Determine status code
    const statusCode = error.statusCode || error.status || 500;
    
    // Send error response
    res.status(statusCode).json({
        error: process.env.NODE_ENV === 'production' 
            ? (statusCode === 500 ? 'Internal server error' : error.message)
            : error.message,
        ...(process.env.NODE_ENV !== 'production' && statusCode === 500 && { 
            stack: error.stack,
            details: error.toString()
        })
    });
});

// Start server
async function startServer() {
    try {
        // Test database connection
        await database.connect();
        console.log('🔄 Testing database connection...');
        
        const dbInfo = await database.getDatabaseInfo();
        if (dbInfo) {
            console.log(`📊 Connected to database: ${dbInfo.DatabaseName}`);
        }

        app.listen(PORT, () => {
            console.log(`🚀 EventHub API Server running on port ${PORT}`);
            console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🏥 Health check: http://localhost:${PORT}/health`);
            console.log(`📱 API Base URL: http://localhost:${PORT}/api`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        process.exit(1);
    }
}

startServer();