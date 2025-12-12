const jwt = require('jsonwebtoken');

// Middleware to authenticate JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({
            error: 'Access token required'
        });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({
                error: 'Invalid or expired token'
            });
        }
        req.user = user;
        next();
    });
};

// Middleware to check if user has required role
const requireRole = (role) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'Authentication required'
            });
        }

        if (req.user.userType !== role) {
            return res.status(403).json({
                error: `Access denied. ${role} role required.`
            });
        }

        next();
    };
};

// Middleware to check if user has any of the required roles
const requireRoles = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'Authentication required'
            });
        }

        const userRole = req.user.userType;
        const allowedRoles = Array.isArray(roles) ? roles : [roles];

        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({
                error: `Access denied. One of these roles required: ${allowedRoles.join(', ')}`
            });
        }

        next();
    };
};

// Middleware to check if user is admin
const requireAdmin = requireRole('Admin');

// Middleware to check if user is organizer or admin
const requireOrganizerOrAdmin = requireRoles(['Organizer', 'Admin']);

module.exports = {
    authenticateToken,
    requireRole,
    requireRoles,
    requireAdmin,
    requireOrganizerOrAdmin
};