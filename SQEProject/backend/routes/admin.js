const express = require('express');
const { authenticateToken, requireRole, requireRoles } = require('../middleware/auth');
const database = require('../config/database');

const router = express.Router();

// Dashboard statistics for admin
router.get('/dashboard/stats', authenticateToken, requireRole('Admin'), async (req, res) => {
    try {
        const statsResult = await database.query(`
            -- Total users count
            SELECT 
                (SELECT COUNT(*) FROM [Users].[Users]) as totalUsers,
                (SELECT COUNT(*) FROM [Users].[Users] WHERE UserType = 'User') as regularUsers,
                (SELECT COUNT(*) FROM [Users].[Users] WHERE UserType = 'Organizer') as organizers,
                (SELECT COUNT(*) FROM [Users].[Users] WHERE UserType = 'Admin') as admins,
                
                -- Events statistics
                (SELECT COUNT(*) FROM [Events].[Events]) as totalEvents,
                (SELECT COUNT(*) FROM [Events].[Events] WHERE Status = 'Published') as publishedEvents,
                (SELECT COUNT(*) FROM [Events].[Events] WHERE Status = 'Draft') as draftEvents,
                (SELECT COUNT(*) FROM [Events].[Events] WHERE Status = 'Cancelled') as cancelledEvents,
                
                -- Bookings statistics
                (SELECT COUNT(*) FROM [Events].[Bookings]) as totalBookings,
                (SELECT ISNULL(SUM(TotalPrice), 0) FROM [Events].[Bookings]) as totalRevenue,
                (SELECT COUNT(*) FROM [Events].[Bookings] WHERE PaymentStatus = 'Completed') as paidBookings,
                (SELECT COUNT(*) FROM [Events].[Bookings] WHERE PaymentStatus = 'Pending') as pendingPayments,
                
                -- Categories count
                (SELECT COUNT(*) FROM [Categories].[Categories] WHERE IsActive = 1) as activeCategories
        `);

        const monthlyStats = await database.query(`
            SELECT 
                YEAR(CreatedAt) as year,
                MONTH(CreatedAt) as month,
                COUNT(*) as count,
                'users' as type
            FROM [Users].[Users]
            WHERE CreatedAt >= DATEADD(month, -6, GETUTCDATE())
            GROUP BY YEAR(CreatedAt), MONTH(CreatedAt)
            
            UNION ALL
            
            SELECT 
                YEAR(CreatedAt) as year,
                MONTH(CreatedAt) as month,
                COUNT(*) as count,
                'events' as type
            FROM [Events].[Events]
            WHERE CreatedAt >= DATEADD(month, -6, GETUTCDATE())
            GROUP BY YEAR(CreatedAt), MONTH(CreatedAt)
            
            UNION ALL
            
            SELECT 
                YEAR(CreatedAt) as year,
                MONTH(CreatedAt) as month,
                COUNT(*) as count,
                'bookings' as type
            FROM [Events].[Bookings]
            WHERE CreatedAt >= DATEADD(month, -6, GETUTCDATE())
            GROUP BY YEAR(CreatedAt), MONTH(CreatedAt)
            
            ORDER BY year DESC, month DESC, type
        `);

        res.json({
            stats: statsResult.recordset[0],
            monthlyStats: monthlyStats.recordset
        });
    } catch (error) {
        console.error('Failed to fetch admin dashboard stats:', error);
        res.status(500).json({
            error: 'Failed to fetch dashboard statistics'
        });
    }
});

// Manage users
router.get('/users', authenticateToken, requireRole('Admin'), async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', userType = '', status = '' } = req.query;
        const offset = (page - 1) * limit;

        let whereClause = 'WHERE 1=1';
        const params = {};

        if (search) {
            whereClause += ` AND (u.FirstName LIKE '%' + @search + '%' OR u.LastName LIKE '%' + @search + '%' OR u.Email LIKE '%' + @search + '%')`;
            params.search = search;
        }

        if (userType) {
            whereClause += ' AND u.UserType = @userType';
            params.userType = userType;
        }

        if (status) {
            whereClause += ' AND u.IsActive = @isActive';
            params.isActive = status === 'active' ? 1 : 0;
        }

        const result = await database.query(`
            SELECT 
                u.UserId as userId,
                u.FirstName as firstName,
                u.LastName as lastName,
                u.Email as email,
                u.UserType as userType,
                u.IsActive as isActive,
                u.EmailVerified as emailVerified,
                u.CreatedAt as createdAt,
                u.LastLoginAt as lastLoginAt,
                COALESCE(eventCount.count, 0) as eventsCreated,
                COALESCE(bookingCount.count, 0) as bookingsMade
            FROM [Users].[Users] u
            LEFT JOIN (
                SELECT OrganizerId, COUNT(*) as count
                FROM [Events].[Events]
                GROUP BY OrganizerId
            ) eventCount ON u.UserId = eventCount.OrganizerId
            LEFT JOIN (
                SELECT UserId, COUNT(*) as count
                FROM [Events].[Bookings]
                GROUP BY UserId
            ) bookingCount ON u.UserId = bookingCount.UserId
            ${whereClause}
            ORDER BY u.CreatedAt DESC
            OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
        `, { ...params, offset, limit: parseInt(limit) });

        const countResult = await database.query(`
            SELECT COUNT(*) as total
            FROM [Users].[Users] u
            ${whereClause}
        `, params);

        res.json({
            users: result.recordset.map(user => ({
                ...user,
                isActive: Boolean(user.isActive),
                emailVerified: Boolean(user.emailVerified)
            })),
            totalPages: Math.ceil(countResult.recordset[0].total / limit),
            currentPage: parseInt(page),
            totalUsers: countResult.recordset[0].total
        });
    } catch (error) {
        console.error('Failed to fetch users:', error);
        res.status(500).json({
            error: 'Failed to fetch users'
        });
    }
});

// Update user status
router.patch('/users/:id/status', authenticateToken, requireRole('Admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;

        await database.query(`
            UPDATE [Users].[Users]
            SET IsActive = @isActive, ModifiedAt = GETUTCDATE()
            WHERE UserId = @userId
        `, { userId: id, isActive });

        res.json({
            message: 'User status updated successfully'
        });
    } catch (error) {
        console.error('Failed to update user status:', error);
        res.status(500).json({
            error: 'Failed to update user status'
        });
    }
});

// Manage events
router.get('/events', authenticateToken, requireRole('Admin'), async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', status = '', category = '' } = req.query;
        const offset = (page - 1) * limit;

        let whereClause = 'WHERE 1=1';
        const params = {};

        if (search) {
            whereClause += ` AND e.Title LIKE '%' + @search + '%'`;
            params.search = search;
        }

        if (status) {
            whereClause += ' AND e.Status = @status';
            params.status = status;
        }

        if (category) {
            whereClause += ' AND e.CategoryId = @categoryId';
            params.categoryId = category;
        }

        const result = await database.query(`
            SELECT 
                e.EventId as eventId,
                e.Title as title,
                e.Status as status,
                e.StartDate as startDate,
                e.EndDate as endDate,
                e.VenueName as venueName,
                e.Capacity as capacity,
                e.BookingCount as bookingCount,
                e.TotalRevenue as totalRevenue,
                e.Price as price,
                e.IsFree as isFree,
                e.IsOnline as isOnline,
                e.CreatedAt as createdAt,
                c.Name as categoryName,
                u.FirstName + ' ' + u.LastName as organizerName,
                u.Email as organizerEmail
            FROM [Events].[Events] e
            LEFT JOIN [Categories].[Categories] c ON e.CategoryId = c.CategoryId
            LEFT JOIN [Users].[Users] u ON e.OrganizerId = u.UserId
            ${whereClause}
            ORDER BY e.CreatedAt DESC
            OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
        `, { ...params, offset, limit: parseInt(limit) });

        const countResult = await database.query(`
            SELECT COUNT(*) as total
            FROM [Events].[Events] e
            ${whereClause}
        `, params);

        res.json({
            events: result.recordset.map(event => ({
                ...event,
                isFree: Boolean(event.isFree),
                isOnline: Boolean(event.isOnline),
                bookingCount: event.bookingCount || 0,
                totalRevenue: event.totalRevenue || 0
            })),
            totalPages: Math.ceil(countResult.recordset[0].total / limit),
            currentPage: parseInt(page),
            totalEvents: countResult.recordset[0].total
        });
    } catch (error) {
        console.error('Failed to fetch admin events:', error);
        res.status(500).json({
            error: 'Failed to fetch events'
        });
    }
});

// Update event status
router.patch('/events/:id/status', authenticateToken, requireRole('Admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['Draft', 'Published', 'Cancelled'].includes(status)) {
            return res.status(400).json({
                error: 'Invalid status. Must be Draft, Published, or Cancelled'
            });
        }

        await database.query(`
            UPDATE [Events].[Events]
            SET Status = @status, ModifiedAt = GETUTCDATE()
            WHERE EventId = @eventId
        `, { eventId: id, status });

        res.json({
            message: 'Event status updated successfully'
        });
    } catch (error) {
        console.error('Failed to update event status:', error);
        res.status(500).json({
            error: 'Failed to update event status'
        });
    }
});

// Manage categories
router.get('/categories', authenticateToken, requireRole('Admin'), async (req, res) => {
    try {
        const result = await database.query(`
            SELECT 
                c.CategoryId as categoryId,
                c.Name as name,
                c.Description as description,
                c.IconUrl as iconUrl,
                c.IsActive as isActive,
                c.CreatedAt as createdAt,
                COUNT(e.EventId) as eventCount
            FROM [Categories].[Categories] c
            LEFT JOIN [Events].[Events] e ON c.CategoryId = e.CategoryId
            GROUP BY c.CategoryId, c.Name, c.Description, c.IconUrl, c.IsActive, c.CreatedAt
            ORDER BY c.Name
        `);

        res.json(
            result.recordset.map(category => ({
                ...category,
                isActive: Boolean(category.isActive),
                eventCount: category.eventCount || 0
            }))
        );
    } catch (error) {
        console.error('Failed to fetch categories:', error);
        res.status(500).json({
            error: 'Failed to fetch categories'
        });
    }
});

// Create new category
router.post('/categories', authenticateToken, requireRole('Admin'), async (req, res) => {
    try {
        const { name, description, iconUrl } = req.body;

        if (!name) {
            return res.status(400).json({
                error: 'Category name is required'
            });
        }

        const result = await database.query(`
            INSERT INTO [Categories].[Categories] (CategoryId, Name, Description, IconUrl, IsActive)
            OUTPUT INSERTED.CategoryId, INSERTED.Name, INSERTED.CreatedAt
            VALUES (NEWID(), @name, @description, @iconUrl, 1)
        `, { name, description: description || null, iconUrl: iconUrl || null });

        res.status(201).json({
            message: 'Category created successfully',
            category: result.recordset[0]
        });
    } catch (error) {
        console.error('Failed to create category:', error);
        res.status(500).json({
            error: 'Failed to create category'
        });
    }
});

// Update category
router.patch('/categories/:id', authenticateToken, requireRole('Admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, iconUrl, isActive } = req.body;

        await database.query(`
            UPDATE [Categories].[Categories]
            SET 
                Name = COALESCE(@name, Name),
                Description = COALESCE(@description, Description),
                IconUrl = COALESCE(@iconUrl, IconUrl),
                IsActive = COALESCE(@isActive, IsActive),
                ModifiedAt = GETUTCDATE()
            WHERE CategoryId = @categoryId
        `, { 
            categoryId: id, 
            name: name || null, 
            description: description || null, 
            iconUrl: iconUrl || null,
            isActive: isActive !== undefined ? isActive : null
        });

        res.json({
            message: 'Category updated successfully'
        });
    } catch (error) {
        console.error('Failed to update category:', error);
        res.status(500).json({
            error: 'Failed to update category'
        });
    }
});

// Get all bookings for admin
router.get('/bookings', authenticateToken, requireRole('Admin'), async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', status = '', paymentStatus = '' } = req.query;
        const offset = (page - 1) * limit;

        let whereClause = 'WHERE 1=1';
        const params = {};

        if (search) {
            whereClause += ` AND (e.Title LIKE '%' + @search + '%' OR b.BookingReference LIKE '%' + @search + '%' OR u.Email LIKE '%' + @search + '%')`;
            params.search = search;
        }

        if (status) {
            whereClause += ' AND b.Status = @status';
            params.status = status;
        }

        if (paymentStatus) {
            whereClause += ' AND b.PaymentStatus = @paymentStatus';
            params.paymentStatus = paymentStatus;
        }

        const result = await database.query(`
            SELECT 
                b.BookingId as bookingId,
                b.BookingReference as bookingReference,
                b.Quantity as quantity,
                b.FinalAmount as finalAmount,
                b.Currency as currency,
                b.Status as status,
                b.PaymentStatus as paymentStatus,
                b.CreatedAt as createdAt,
                e.Title as eventTitle,
                e.StartDate as eventStartDate,
                u.FirstName + ' ' + u.LastName as customerName,
                u.Email as customerEmail
            FROM [Events].[Bookings] b
            INNER JOIN [Events].[Events] e ON b.EventId = e.EventId
            INNER JOIN [Users].[Users] u ON b.UserId = u.UserId
            ${whereClause}
            ORDER BY b.CreatedAt DESC
            OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
        `, { ...params, offset, limit: parseInt(limit) });

        const countResult = await database.query(`
            SELECT COUNT(*) as total
            FROM [Events].[Bookings] b
            INNER JOIN [Events].[Events] e ON b.EventId = e.EventId
            INNER JOIN [Users].[Users] u ON b.UserId = u.UserId
            ${whereClause}
        `, params);

        res.json({
            bookings: result.recordset,
            totalPages: Math.ceil(countResult.recordset[0].total / limit),
            currentPage: parseInt(page),
            totalBookings: countResult.recordset[0].total
        });
    } catch (error) {
        console.error('Failed to fetch admin bookings:', error);
        res.status(500).json({
            error: 'Failed to fetch bookings'
        });
    }
});

module.exports = router;