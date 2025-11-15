const express = require('express');
const Joi = require('joi');
const { authenticateToken } = require('../middleware/auth');
const database = require('../config/database');

const router = express.Router();

// Validation schema for user profile update
const profileUpdateSchema = Joi.object({
    firstName: Joi.string().min(2).max(50).optional(),
    lastName: Joi.string().min(2).max(50).optional(),
    phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).optional(),
    dateOfBirth: Joi.date().max('now').optional(),
    profilePicture: Joi.string().uri().optional(),
    preferences: Joi.object({
        emailNotifications: Joi.boolean().optional(),
        smsNotifications: Joi.boolean().optional(),
        marketingEmails: Joi.boolean().optional(),
        eventReminders: Joi.boolean().optional()
    }).optional()
});

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;

        const result = await database.query(`
            SELECT 
                UserId as userId,
                FirstName as firstName,
                LastName as lastName,
                Email as email,
                Phone as phone,
                UserType as userType,
                DateOfBirth as dateOfBirth,
                ProfilePicture as profilePicture,
                IsActive as isActive,
                EmailVerified as emailVerified,
                CreatedAt as createdAt,
                LastLoginAt as lastLoginAt,
                EmailNotifications as emailNotifications,
                SmsNotifications as smsNotifications,
                MarketingEmails as marketingEmails,
                EventReminders as eventReminders
            FROM [Users].[Users]
            WHERE UserId = @userId
        `, { userId });

        if (result.recordset.length === 0) {
            return res.status(404).json({
                error: 'User not found'
            });
        }

        const user = result.recordset[0];

        res.json({
            ...user,
            isActive: Boolean(user.isActive),
            emailVerified: Boolean(user.emailVerified),
            emailNotifications: Boolean(user.emailNotifications),
            smsNotifications: Boolean(user.smsNotifications),
            marketingEmails: Boolean(user.marketingEmails),
            eventReminders: Boolean(user.eventReminders)
        });
    } catch (error) {
        console.error('Failed to fetch user profile:', error);
        res.status(500).json({
            error: 'Failed to fetch profile'
        });
    }
});

// Update user profile
router.patch('/profile', authenticateToken, async (req, res) => {
    try {
        const { error, value } = profileUpdateSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                error: 'Validation failed',
                details: error.details[0].message
            });
        }

        const userId = req.user.userId;
        const { firstName, lastName, phone, dateOfBirth, profilePicture, preferences } = value;

        let updateFields = [];
        let params = { userId };

        if (firstName !== undefined) {
            updateFields.push('FirstName = @firstName');
            params.firstName = firstName;
        }

        if (lastName !== undefined) {
            updateFields.push('LastName = @lastName');
            params.lastName = lastName;
        }

        if (phone !== undefined) {
            updateFields.push('Phone = @phone');
            params.phone = phone;
        }

        if (dateOfBirth !== undefined) {
            updateFields.push('DateOfBirth = @dateOfBirth');
            params.dateOfBirth = dateOfBirth;
        }

        if (profilePicture !== undefined) {
            updateFields.push('ProfilePicture = @profilePicture');
            params.profilePicture = profilePicture;
        }

        if (preferences) {
            if (preferences.emailNotifications !== undefined) {
                updateFields.push('EmailNotifications = @emailNotifications');
                params.emailNotifications = preferences.emailNotifications;
            }

            if (preferences.smsNotifications !== undefined) {
                updateFields.push('SmsNotifications = @smsNotifications');
                params.smsNotifications = preferences.smsNotifications;
            }

            if (preferences.marketingEmails !== undefined) {
                updateFields.push('MarketingEmails = @marketingEmails');
                params.marketingEmails = preferences.marketingEmails;
            }

            if (preferences.eventReminders !== undefined) {
                updateFields.push('EventReminders = @eventReminders');
                params.eventReminders = preferences.eventReminders;
            }
        }

        if (updateFields.length === 0) {
            return res.status(400).json({
                error: 'No fields to update'
            });
        }

        updateFields.push('ModifiedAt = GETUTCDATE()');

        await database.query(`
            UPDATE [Users].[Users]
            SET ${updateFields.join(', ')}
            WHERE UserId = @userId
        `, params);

        res.json({
            message: 'Profile updated successfully'
        });
    } catch (error) {
        console.error('Failed to update profile:', error);
        res.status(500).json({
            error: 'Failed to update profile'
        });
    }
});

// Get user's activity stats
router.get('/stats', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;

        const result = await database.query(`
            SELECT 
                (SELECT COUNT(*) FROM [Events].[Bookings] WHERE UserId = @userId) as totalBookings,
                (SELECT COUNT(*) FROM [Events].[Bookings] WHERE UserId = @userId AND Status = 'Confirmed') as confirmedBookings,
                (SELECT COUNT(*) FROM [Events].[Bookings] WHERE UserId = @userId AND PaymentStatus = 'Completed') as paidBookings,
                (SELECT ISNULL(SUM(FinalAmount), 0) FROM [Events].[Bookings] WHERE UserId = @userId AND PaymentStatus = 'Completed') as totalSpent,
                (SELECT COUNT(*) FROM [Events].[Events] WHERE OrganizerId = @userId) as eventsCreated,
                (SELECT COUNT(*) FROM [Events].[Events] WHERE OrganizerId = @userId AND Status = 'Published') as publishedEvents,
                (SELECT COUNT(*) FROM [Events].[Reviews] WHERE UserId = @userId) as reviewsGiven,
                (SELECT AVG(CAST(Rating as FLOAT)) FROM [Events].[Reviews] WHERE UserId = @userId) as averageRatingGiven
        `, { userId });

        const upcomingEvents = await database.query(`
            SELECT COUNT(*) as count
            FROM [Events].[Bookings] b
            INNER JOIN [Events].[Events] e ON b.EventId = e.EventId
            WHERE b.UserId = @userId 
            AND e.StartDate > GETUTCDATE()
            AND b.Status = 'Confirmed'
        `, { userId });

        const pastEvents = await database.query(`
            SELECT COUNT(*) as count
            FROM [Events].[Bookings] b
            INNER JOIN [Events].[Events] e ON b.EventId = e.EventId
            WHERE b.UserId = @userId 
            AND e.EndDate < GETUTCDATE()
            AND b.Status = 'Confirmed'
        `, { userId });

        const stats = result.recordset[0];

        res.json({
            totalBookings: stats.totalBookings || 0,
            confirmedBookings: stats.confirmedBookings || 0,
            paidBookings: stats.paidBookings || 0,
            totalSpent: stats.totalSpent || 0,
            eventsCreated: stats.eventsCreated || 0,
            publishedEvents: stats.publishedEvents || 0,
            reviewsGiven: stats.reviewsGiven || 0,
            averageRatingGiven: stats.averageRatingGiven || 0,
            upcomingEvents: upcomingEvents.recordset[0].count || 0,
            pastEvents: pastEvents.recordset[0].count || 0
        });
    } catch (error) {
        console.error('Failed to fetch user stats:', error);
        res.status(500).json({
            error: 'Failed to fetch statistics'
        });
    }
});

// Get user's favorite events (wishlist)
router.get('/favorites', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;

        const result = await database.query(`
            SELECT 
                e.EventId as eventId,
                e.Title as title,
                e.Description as description,
                e.StartDate as startDate,
                e.EndDate as endDate,
                e.VenueName as venueName,
                e.VenueAddress as venueAddress,
                e.IsOnline as isOnline,
                e.Price as price,
                e.IsFree as isFree,
                e.Capacity as capacity,
                e.BookingCount as bookingCount,
                e.ImageUrl as imageUrl,
                c.Name as categoryName,
                u.FirstName + ' ' + u.LastName as organizerName,
                w.CreatedAt as favoriteDate
            FROM [Events].[EventWishlist] w
            INNER JOIN [Events].[Events] e ON w.EventId = e.EventId
            LEFT JOIN [Categories].[Categories] c ON e.CategoryId = c.CategoryId
            LEFT JOIN [Users].[Users] u ON e.OrganizerId = u.UserId
            WHERE w.UserId = @userId
            ORDER BY w.CreatedAt DESC
        `, { userId });

        const favorites = result.recordset.map(event => ({
            ...event,
            isOnline: Boolean(event.isOnline),
            isFree: Boolean(event.isFree),
            bookingCount: event.bookingCount || 0
        }));

        res.json(favorites);
    } catch (error) {
        console.error('Failed to fetch favorites:', error);
        res.status(500).json({
            error: 'Failed to fetch favorites'
        });
    }
});

// Add event to favorites
router.post('/favorites/:eventId', authenticateToken, async (req, res) => {
    try {
        const { eventId } = req.params;
        const userId = req.user.userId;

        // Check if event exists
        const eventResult = await database.query(`
            SELECT EventId FROM [Events].[Events] WHERE EventId = @eventId
        `, { eventId });

        if (eventResult.recordset.length === 0) {
            return res.status(404).json({
                error: 'Event not found'
            });
        }

        // Check if already in favorites
        const existingResult = await database.query(`
            SELECT WishlistId FROM [Events].[EventWishlist] 
            WHERE UserId = @userId AND EventId = @eventId
        `, { userId, eventId });

        if (existingResult.recordset.length > 0) {
            return res.status(400).json({
                error: 'Event already in favorites'
            });
        }

        // Add to favorites
        await database.query(`
            INSERT INTO [Events].[EventWishlist] (WishlistId, UserId, EventId)
            VALUES (NEWID(), @userId, @eventId)
        `, { userId, eventId });

        res.status(201).json({
            message: 'Event added to favorites'
        });
    } catch (error) {
        console.error('Failed to add to favorites:', error);
        res.status(500).json({
            error: 'Failed to add to favorites'
        });
    }
});

// Remove event from favorites
router.delete('/favorites/:eventId', authenticateToken, async (req, res) => {
    try {
        const { eventId } = req.params;
        const userId = req.user.userId;

        const result = await database.query(`
            DELETE FROM [Events].[EventWishlist] 
            WHERE UserId = @userId AND EventId = @eventId
        `, { userId, eventId });

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                error: 'Event not found in favorites'
            });
        }

        res.json({
            message: 'Event removed from favorites'
        });
    } catch (error) {
        console.error('Failed to remove from favorites:', error);
        res.status(500).json({
            error: 'Failed to remove from favorites'
        });
    }
});

// Get user's event reviews
router.get('/reviews', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;

        const result = await database.query(`
            SELECT 
                r.ReviewId as reviewId,
                r.Rating as rating,
                r.Comment as comment,
                r.CreatedAt as createdAt,
                e.EventId as eventId,
                e.Title as eventTitle,
                e.StartDate as eventStartDate
            FROM [Events].[Reviews] r
            INNER JOIN [Events].[Events] e ON r.EventId = e.EventId
            WHERE r.UserId = @userId
            ORDER BY r.CreatedAt DESC
        `, { userId });

        res.json(result.recordset);
    } catch (error) {
        console.error('Failed to fetch user reviews:', error);
        res.status(500).json({
            error: 'Failed to fetch reviews'
        });
    }
});

// Delete user account (soft delete)
router.delete('/account', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;

        // Soft delete by deactivating account
        await database.query(`
            UPDATE [Users].[Users]
            SET IsActive = 0, ModifiedAt = GETUTCDATE()
            WHERE UserId = @userId
        `, { userId });

        res.json({
            message: 'Account deactivated successfully'
        });
    } catch (error) {
        console.error('Failed to delete account:', error);
        res.status(500).json({
            error: 'Failed to delete account'
        });
    }
});

module.exports = router;