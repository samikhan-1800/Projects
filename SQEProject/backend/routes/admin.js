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
                (SELECT COUNT(*) FROM [Users].[Users] WHERE Role = 'User') as regularUsers,
                (SELECT COUNT(*) FROM [Users].[Users] WHERE Role = 'Organizer') as organizers,
                (SELECT COUNT(*) FROM [Users].[Users] WHERE Role = 'Admin') as admins,
                
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
                (SELECT COUNT(*) FROM [Events].[Categories] WHERE IsActive = 1) as activeCategories
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
            whereClause += ' AND u.Role = @userType';
            params.userType = userType;
        }

        if (status) {
            whereClause += ' AND u.Status = @status';
            params.status = status;
        }

        const result = await database.query(`
            SELECT 
                u.UserId as userId,
                u.FirstName as firstName,
                u.LastName as lastName,
                u.Email as email,
                u.Role as userType,
                u.Status as status,
                u.EmailVerified as emailVerified,
                u.CreatedAt as createdAt,
                u.LastLoginAt as lastLoginAt,
                o.VerificationStatus as verificationStatus,
                o.OrganizationName as organizationName,
                COALESCE(eventCount.count, 0) as eventsCreated,
                COALESCE(bookingCount.count, 0) as bookingsMade
            FROM [Users].[Users] u
            LEFT JOIN [Users].[Organizers] o ON u.UserId = o.UserId
            LEFT JOIN (
                SELECT OrganizerId, COUNT(*) as count
                FROM [Events].[Events]
                GROUP BY OrganizerId
            ) eventCount ON o.OrganizerId = eventCount.OrganizerId
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
        const { isActive, status } = req.body;

        // Map isActive boolean to Status string, or use status directly
        const newStatus = status || (isActive ? 'Active' : 'Inactive');

        await database.query(`
            UPDATE [Users].[Users]
            SET Status = @status, UpdatedAt = GETUTCDATE()
            WHERE UserId = @userId
        `, { userId: id, status: newStatus });

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

// Ban user permanently
router.patch('/users/:id/ban', authenticateToken, requireRole('Admin'), async (req, res) => {
    try {
        const { id } = req.params;

        // Check if user exists and is not an admin
        const userCheck = await database.query(`
            SELECT UserId, Role, FirstName, LastName, Status FROM [Users].[Users] WHERE UserId = @userId
        `, { userId: id });

        if (userCheck.recordset.length === 0) {
            return res.status(404).json({
                error: 'User not found'
            });
        }

        if (userCheck.recordset[0].Role === 'Admin') {
            return res.status(403).json({
                error: 'Cannot ban admin users'
            });
        }

        // Update user status to Banned
        await database.query(`
            UPDATE [Users].[Users]
            SET Status = 'Banned', UpdatedAt = GETUTCDATE()
            WHERE UserId = @userId
        `, { userId: id });

        // Also cancel all their active events if they're an organizer
        const organizerResult = await database.query(`
            SELECT OrganizerId FROM [Users].[Organizers] WHERE UserId = @userId
        `, { userId: id });

        if (organizerResult.recordset.length > 0) {
            const organizerId = organizerResult.recordset[0].OrganizerId;
            
            // Set all their pending/published events to cancelled
            await database.query(`
                UPDATE [Events].[Events]
                SET Status = 'Cancelled', UpdatedAt = GETUTCDATE()
                WHERE OrganizerId = @organizerId 
                AND Status IN ('Published', 'Pending', 'Draft')
            `, { organizerId });
        }

        res.json({
            message: 'User banned successfully',
            bannedUser: `${userCheck.recordset[0].FirstName} ${userCheck.recordset[0].LastName}`
        });
    } catch (error) {
        console.error('Failed to ban user:', error);
        console.error('Error details:', error.message);
        res.status(500).json({
            error: 'Failed to ban user',
            details: error.message
        });
    }
});

// Update user role
router.patch('/users/:id/role', authenticateToken, requireRole('Admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (!['User', 'Organizer'].includes(role)) {
            return res.status(400).json({
                error: 'Invalid role. Must be User or Organizer'
            });
        }

        // Check if user is an admin
        const userCheck = await database.query(`
            SELECT Role FROM [Users].[Users] WHERE UserId = @userId
        `, { userId: id });

        if (userCheck.recordset.length > 0 && userCheck.recordset[0].Role === 'Admin') {
            return res.status(403).json({
                error: 'Cannot change admin role'
            });
        }

        await database.query(`
            UPDATE [Users].[Users]
            SET Role = @role, UpdatedAt = GETUTCDATE()
            WHERE UserId = @userId
        `, { userId: id, role });

        res.json({
            message: 'User role updated successfully'
        });
    } catch (error) {
        console.error('Failed to update user role:', error);
        res.status(500).json({
            error: 'Failed to update user role'
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
                COALESCE(o.OrganizationName, u.FirstName + ' ' + u.LastName) as organizerName,
                u.Email as organizerEmail
            FROM [Events].[Events] e
            LEFT JOIN [Events].[Categories] c ON e.CategoryId = c.CategoryId
            LEFT JOIN [Users].[Organizers] o ON e.OrganizerId = o.OrganizerId
            LEFT JOIN [Users].[Users] u ON o.UserId = u.UserId
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
// Approve event - changes status to Published
router.patch('/events/:id/approve', authenticateToken, requireRole('Admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.user.userId;

        await database.query(`
            UPDATE [Events].[Events]
            SET Status = 'Published', 
                ApprovedBy = @adminId,
                PublishedAt = GETUTCDATE(),
                UpdatedAt = GETUTCDATE()
            WHERE EventId = @eventId
        `, { eventId: id, adminId });

        res.json({
            message: 'Event approved and published successfully'
        });
    } catch (error) {
        console.error('Failed to approve event:', error);
        res.status(500).json({
            error: 'Failed to approve event'
        });
    }
});

// Reject event
router.patch('/events/:id/reject', authenticateToken, requireRole('Admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        await database.query(`
            UPDATE [Events].[Events]
            SET Status = 'Rejected',
                UpdatedAt = GETUTCDATE()
            WHERE EventId = @eventId
        `, { eventId: id });

        res.json({
            message: 'Event rejected successfully',
            reason: reason || 'No reason provided'
        });
    } catch (error) {
        console.error('Failed to reject event:', error);
        res.status(500).json({
            error: 'Failed to reject event'
        });
    }
});

// Update event status (general status changes)
router.patch('/events/:id/status', authenticateToken, requireRole('Admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['Draft', 'Published', 'Pending', 'Cancelled', 'Rejected'].includes(status)) {
            return res.status(400).json({
                error: 'Invalid status'
            });
        }

        await database.query(`
            UPDATE [Events].[Events]
            SET Status = @status, UpdatedAt = GETUTCDATE()
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
                c.IconClass as iconClass,
                c.IsActive as isActive,
                c.CreatedAt as createdAt,
                COUNT(e.EventId) as eventCount
            FROM [Events].[Categories] c
            LEFT JOIN [Events].[Events] e ON c.CategoryId = e.CategoryId
            GROUP BY c.CategoryId, c.Name, c.Description, c.IconClass, c.IsActive, c.CreatedAt
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
            INSERT INTO [Events].[Categories] (CategoryId, Name, Description, IconClass, IsActive)
            OUTPUT INSERTED.CategoryId, INSERTED.Name, INSERTED.CreatedAt
            VALUES (NEWID(), @name, @description, @iconClass, 1)
        `, { name, description: description || null, iconClass: iconUrl || null });

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
            UPDATE [Events].[Categories]
            SET 
                Name = COALESCE(@name, Name),
                Description = COALESCE(@description, Description),
                IconClass = COALESCE(@iconClass, IconClass),
                IsActive = COALESCE(@isActive, IsActive)
            WHERE CategoryId = @categoryId
        `, { 
            categoryId: id, 
            name: name || null, 
            description: description || null, 
            iconClass: iconUrl || null,
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

// Get top categories by event count
router.get('/reports/top-categories', authenticateToken, requireRole('Admin'), async (req, res) => {
    try {
        const result = await database.query(`
            SELECT TOP 5
                c.CategoryId as categoryId,
                c.Name as name,
                c.IconClass as iconClass,
                COUNT(e.EventId) as eventCount,
                ISNULL(SUM(b.TotalPrice), 0) as totalRevenue
            FROM [Events].[Categories] c
            LEFT JOIN [Events].[Events] e ON c.CategoryId = e.CategoryId
            LEFT JOIN [Events].[Bookings] b ON e.EventId = b.EventId AND b.PaymentStatus = 'Completed'
            WHERE c.IsActive = 1
            GROUP BY c.CategoryId, c.Name, c.IconClass
            HAVING COUNT(e.EventId) > 0
            ORDER BY eventCount DESC, totalRevenue DESC
        `);

        res.json(result.recordset);
    } catch (error) {
        console.error('Failed to fetch top categories:', error);
        res.status(500).json({
            error: 'Failed to fetch top categories'
        });
    }
});

// Get top organizers by event count and revenue
router.get('/reports/top-organizers', authenticateToken, requireRole('Admin'), async (req, res) => {
    try {
        const result = await database.query(`
            SELECT TOP 5
                u.UserId as userId,
                u.FirstName + ' ' + u.LastName as name,
                u.Email as email,
                COUNT(DISTINCT e.EventId) as eventCount,
                ISNULL(SUM(b.TotalPrice), 0) as totalRevenue,
                COUNT(DISTINCT b.BookingId) as totalBookings
            FROM [Users].[Users] u
            INNER JOIN [Events].[Events] e ON u.UserId = e.OrganizerId
            LEFT JOIN [Events].[Bookings] b ON e.EventId = b.EventId AND b.PaymentStatus = 'Completed'
            WHERE u.Role = 'Organizer' AND u.Status = 'Active'
            GROUP BY u.UserId, u.FirstName, u.LastName, u.Email
            HAVING COUNT(DISTINCT e.EventId) > 0
            ORDER BY totalRevenue DESC, eventCount DESC
        `);

        res.json(result.recordset);
    } catch (error) {
        console.error('Failed to fetch top organizers:', error);
        res.status(500).json({
            error: 'Failed to fetch top organizers'
        });
    }
});

// Bulk approve all pending events
router.post('/events/bulk-approve', authenticateToken, requireRole('Admin'), async (req, res) => {
    try {
        const adminId = req.user.userId;

        // Get all pending events
        const pendingEvents = await database.query(`
            SELECT EventId FROM [Events].[Events]
            WHERE Status = 'Pending'
        `);

        if (pendingEvents.recordset.length === 0) {
            return res.json({
                message: 'No pending events to approve',
                approvedCount: 0
            });
        }

        // Approve all pending events
        await database.query(`
            UPDATE [Events].[Events]
            SET Status = 'Published',
                ApprovedBy = @adminId,
                PublishedAt = GETUTCDATE(),
                UpdatedAt = GETUTCDATE()
            WHERE Status = 'Pending'
        `, { adminId });

        res.json({
            message: 'All pending events approved successfully',
            approvedCount: pendingEvents.recordset.length
        });
    } catch (error) {
        console.error('Failed to bulk approve events:', error);
        res.status(500).json({
            error: 'Failed to bulk approve events'
        });
    }
});

module.exports = router;