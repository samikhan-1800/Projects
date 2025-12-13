const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const database = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
});

const registerSchema = Joi.object({
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    phone: Joi.string().optional(),
    bio: Joi.string().max(500).optional(),
    userType: Joi.string().valid('User', 'Organizer').default('User')
});

// Register endpoint
router.post('/register', async (req, res) => {
    try {
        const { error, value } = registerSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                error: 'Validation failed',
                details: error.details[0].message
            });
        }

        const { firstName, lastName, email, password, phone, bio, userType } = value;

        // Check if user already exists
        const existingUser = await database.query(
            'SELECT UserId FROM [Users].[Users] WHERE Email = @email',
            { email }
        );

        if (existingUser.recordset.length > 0) {
            return res.status(409).json({
                error: 'User already exists with this email'
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const result = await database.query(`
            INSERT INTO [Users].[Users] (
                UserId, Email, PasswordHash, Salt, FirstName, LastName, 
                Role, Status, EmailVerified, Phone, Bio
            )
            OUTPUT INSERTED.UserId, INSERTED.Email, INSERTED.FirstName, INSERTED.LastName, INSERTED.Role
            VALUES (
                NEWID(), @email, @hashedPassword, @salt, @firstName, @lastName,
                @userType, 'Active', 0, @phone, @bio
            )
        `, {
            email,
            hashedPassword,
            salt,
            firstName,
            lastName,
            userType: userType || 'User',
            phone: phone || null,
            bio: bio || null
        });

        const newUser = result.recordset[0];

        // If user is an organizer, create organizer profile
        if (userType === 'Organizer') {
            await database.query(`
                INSERT INTO [Users].[Organizers] (
                    OrganizerId, UserId, OrganizationName, IsVerified, TotalEvents, TotalRevenue
                )
                VALUES (
                    NEWID(), @userId, @organizationName, 0, 0, 0
                )
            `, {
                userId: newUser.UserId,
                organizationName: `${firstName} ${lastName}` // Default organization name
            });
        }

        res.status(201).json({
            message: 'User registered successfully',
            user: {
                userId: newUser.UserId,
                email: newUser.Email,
                firstName: newUser.FirstName,
                lastName: newUser.LastName,
                userType: newUser.Role
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            error: 'Registration failed'
        });
    }
});

// Login endpoint
router.post('/login', async (req, res) => {
    try {
        const { error, value } = loginSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                error: 'Validation failed',
                details: error.details[0].message
            });
        }

        const { email, password } = value;

        // Find user
        const result = await database.query(`
            SELECT 
                UserId, Email, PasswordHash, Salt, FirstName, LastName, 
                Role, Status, EmailVerified
            FROM [Users].[Users] 
            WHERE Email = @email
        `, { email });

        if (result.recordset.length === 0) {
            return res.status(401).json({
                error: 'Invalid credentials'
            });
        }

        const user = result.recordset[0];

        // Check if user is banned
        if (user.Status === 'Banned') {
            return res.status(403).json({
                error: 'Your account has been permanently banned. Please contact support for more information.'
            });
        }

        // Check if user is active
        if (user.Status !== 'Active') {
            return res.status(401).json({
                error: 'Account is suspended or inactive. Please contact support.'
            });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.PasswordHash);
        if (!isValidPassword) {
            return res.status(401).json({
                error: 'Invalid credentials'
            });
        }

        // Generate JWT token - default to 24 hours (86400 seconds) for better UX
        const token = jwt.sign(
            { 
                userId: user.UserId, 
                email: user.Email, 
                userType: user.Role 
            },
            process.env.JWT_SECRET,
            { expiresIn: `${process.env.JWT_EXPIRES_IN || 86400}s` }
        );

        // Update last login
        await database.query(
            'UPDATE [Users].[Users] SET LastLoginAt = GETUTCDATE() WHERE UserId = @userId',
            { userId: user.UserId }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                userId: user.UserId,
                email: user.Email,
                firstName: user.FirstName,
                lastName: user.LastName,
                userType: user.Role,
                emailVerified: user.EmailVerified
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            error: 'Login failed'
        });
    }
});

// Get current user (protected route)
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const result = await database.query(`
            SELECT 
                UserId, Email, FirstName, LastName, Role, Status, 
                EmailVerified, Phone, Bio, Website, AvatarUrl, CreatedAt, LastLoginAt
            FROM [Users].[Users] 
            WHERE UserId = @userId
        `, { userId: req.user.userId });

        if (result.recordset.length === 0) {
            return res.status(404).json({
                error: 'User not found'
            });
        }

        const user = result.recordset[0];
        
        res.json({
            userId: user.UserId,
            email: user.Email,
            firstName: user.FirstName,
            lastName: user.LastName,
            role: user.Role,
            status: user.Status,
            emailVerified: user.EmailVerified,
            phone: user.Phone,
            bio: user.Bio,
            website: user.Website,
            avatar: user.AvatarUrl,
            createdAt: user.CreatedAt,
            lastLoginAt: user.LastLoginAt
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            error: 'Failed to get user information'
        });
    }
});

// Logout endpoint (optional - mainly for clearing client-side token)
router.post('/logout', authenticateToken, (req, res) => {
    // In a production app, you might want to blacklist the token
    res.json({
        message: 'Logout successful'
    });
});

module.exports = router;