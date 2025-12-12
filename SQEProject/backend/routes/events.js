const express = require('express');
const database = require('../config/database');

const router = express.Router();

// Get all published events (or organizer's events)
router.get('/', async (req, res) => {
    try {
        const { category, search, limit = 50, offset = 0, organizerId, status } = req.query;
        
        // If organizerId is provided, show all events for that organizer (any status)
        // Otherwise, show only published events
        let whereClause = organizerId ? "WHERE 1=1" : "WHERE e.Status = 'Published'";
        const params = {};

        if (organizerId) {
            // For organizer dashboard - show all their events
            if (organizerId === 'current') {
                // Get first organizer for demo purposes
                const orgResult = await database.query(`SELECT TOP 1 OrganizerId FROM [Users].[Organizers]`);
                if (orgResult.recordset.length > 0) {
                    whereClause += " AND e.OrganizerId = @organizerId";
                    params.organizerId = orgResult.recordset[0].OrganizerId;
                }
            } else {
                whereClause += " AND e.OrganizerId = @organizerId";
                params.organizerId = organizerId;
            }
        }

        if (status) {
            whereClause += " AND e.Status = @status";
            params.status = status;
        }

        if (category) {
            whereClause += " AND c.Name = @category";
            params.category = category;
        }

        if (search) {
            whereClause += " AND (e.Title LIKE @search OR e.Description LIKE @search OR e.VenueName LIKE @search)";
            params.search = `%${search}%`;
        }

        const result = await database.query(`
            SELECT 
                e.EventId as eventId,
                e.Title as title,
                e.Slug as slug,
                e.Description as description,
                e.ShortDescription as shortDescription,
                e.StartDate as startDate,
                e.EndDate as endDate,
                e.VenueName as venueName,
                e.VenueAddress as venueAddress,
                e.VenueCity as venueCity,
                e.VenueState as venueState,
                e.VenueCountry as venueCountry,
                e.IsOnline as isOnline,
                e.OnlineMeetingUrl as onlineMeetingUrl,
                e.Capacity as capacity,
                e.Price as price,
                e.Currency as currency,
                e.IsFree as isFree,
                e.IsFeatured as isFeatured,
                e.ContactEmail as contactEmail,
                e.ContactPhone as contactPhone,
                e.FeaturedImageUrl as featuredImageUrl,
                e.Tags as tags,
                e.Requirements as requirements,
                e.BookingCount as bookingCount,
                e.ViewCount as viewCount,
                e.TotalRevenue as totalRevenue,
                e.CreatedAt as createdAt,
                c.Name as categoryName,
                c.Color as categoryColor,
                u.FirstName + ' ' + u.LastName as organizerName,
                o.OrganizationName as organizationName
            FROM [Events].[Events] e
            LEFT JOIN [Events].[Categories] c ON e.CategoryId = c.CategoryId
            LEFT JOIN [Users].[Organizers] o ON e.OrganizerId = o.OrganizerId
            LEFT JOIN [Users].[Users] u ON o.UserId = u.UserId
            ${whereClause}
            ORDER BY e.CreatedAt DESC
            OFFSET @offset ROWS
            FETCH NEXT @limit ROWS ONLY
        `, {
            ...params,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        // Parse JSON fields
        const events = result.recordset.map(event => ({
            ...event,
            tags: event.tags ? JSON.parse(event.tags) : [],
            isFree: Boolean(event.isFree),
            isOnline: Boolean(event.isOnline),
            isFeatured: Boolean(event.isFeatured)
        }));

        res.json(events);
    } catch (error) {
        console.error('Failed to fetch events:', error);
        res.status(500).json({
            error: 'Failed to fetch events'
        });
    }
});

// Get categories endpoint
router.get('/categories', async (req, res) => {
    try {
        const result = await database.query(`
            SELECT 
                CategoryId as categoryId,
                Name as name,
                Description as description,
                IconClass as iconClass,
                Color as color,
                SortOrder as sortOrder
            FROM [Events].[Categories]
            ORDER BY SortOrder
        `);
        
        res.json(result.recordset);
    } catch (error) {
        console.error('Failed to fetch categories:', error);
        res.status(500).json({
            error: 'Failed to fetch categories'
        });
    }
});

// Get single event by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Validate GUID format
        const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!guidRegex.test(id)) {
            return res.status(400).json({
                error: 'Invalid event ID format'
            });
        }

        const result = await database.query(`
            SELECT 
                e.EventId as eventId,
                e.Title as title,
                e.Slug as slug,
                e.Description as description,
                e.ShortDescription as shortDescription,
                e.StartDate as startDate,
                e.EndDate as endDate,
                e.VenueName as venueName,
                e.VenueAddress as venueAddress,
                e.VenueCity as venueCity,
                e.VenueState as venueState,
                e.VenueCountry as venueCountry,
                e.VenuePostalCode as venuePostalCode,
                e.IsOnline as isOnline,
                e.OnlineMeetingUrl as onlineMeetingUrl,
                e.Capacity as capacity,
                e.Price as price,
                e.Currency as currency,
                e.IsFree as isFree,
                e.IsFeatured as isFeatured,
                e.ContactEmail as contactEmail,
                e.ContactPhone as contactPhone,
                e.FeaturedImageUrl as featuredImageUrl,
                e.Tags as tags,
                e.Requirements as requirements,
                e.BookingCount as bookingCount,
                e.ViewCount as viewCount,
                e.TotalRevenue as totalRevenue,
                e.Status as status,
                e.CreatedAt as createdAt,
                c.Name as categoryName,
                c.Color as categoryColor,
                u.FirstName + ' ' + u.LastName as organizerName,
                o.OrganizationName as organizationName,
                o.OrganizerId as organizerId
            FROM [Events].[Events] e
            LEFT JOIN [Events].[Categories] c ON e.CategoryId = c.CategoryId
            LEFT JOIN [Users].[Organizers] o ON e.OrganizerId = o.OrganizerId
            LEFT JOIN [Users].[Users] u ON o.UserId = u.UserId
            WHERE e.EventId = @id
        `, { id });

        if (result.recordset.length === 0) {
            return res.status(404).json({
                error: 'Event not found'
            });
        }

        const event = result.recordset[0];

        // Update view count
        await database.query(`
            UPDATE [Events].[Events]
            SET ViewCount = ISNULL(ViewCount, 0) + 1
            WHERE EventId = @id
        `, { id }).catch(err => console.error('Failed to update view count:', err));
        
        // Get event tickets if any
        const ticketsResult = await database.query(`
            SELECT 
                TicketId as ticketId,
                Name as name,
                Description as description,
                Price as price,
                Quantity as quantity,
                QuantitySold as quantitySold,
                MaxPerUser as maxPerUser,
                SaleStartDate as saleStartDate,
                SaleEndDate as saleEndDate,
                IsActive as isActive,
                SortOrder as sortOrder
            FROM [Events].[EventTickets]
            WHERE EventId = @id AND IsActive = 1
            ORDER BY SortOrder
        `, { id });

        // Format response
        const eventResponse = {
            ...event,
            tags: event.tags ? JSON.parse(event.tags) : [],
            isFree: Boolean(event.isFree),
            isOnline: Boolean(event.isOnline),
            isFeatured: Boolean(event.isFeatured),
            tickets: ticketsResult.recordset.map(ticket => ({
                ...ticket,
                isActive: Boolean(ticket.isActive)
            }))
        };

        res.json(eventResponse);
    } catch (error) {
        console.error('Failed to fetch event:', error);
        res.status(500).json({
            error: 'Failed to fetch event'
        });
    }
});

// Create new event (requires authentication)
router.post('/', async (req, res) => {
    try {
        // In production, you'd get organizerId from authenticated user
        // For now, we'll use a default organizer
        const {
            title,
            categoryId,
            description,
            shortDescription,
            startDate,
            endDate,
            venueName,
            venueAddress,
            venueCity,
            venueState,
            venueCountry,
            isOnline,
            onlineMeetingUrl,
            capacity,
            price,
            currency = 'USD',
            isFree,
            contactEmail,
            contactPhone,
            featuredImageUrl,
            tags,
            requirements,
            status = 'Published'
        } = req.body;

        // Validate required fields
        if (!title || !categoryId || !startDate || !capacity) {
            return res.status(400).json({
                error: 'Missing required fields: title, categoryId, startDate, capacity'
            });
        }

        // Generate slug from title with timestamp to ensure uniqueness
        const baseSlug = title.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
        const slug = `${baseSlug}-${Date.now()}`;

        // Get organizer ID (using first organizer for demo)
        const organizerResult = await database.query(`
            SELECT TOP 1 OrganizerId FROM [Users].[Organizers]
        `);
        
        const organizerId = organizerResult.recordset[0]?.OrganizerId;
        
        if (!organizerId) {
            return res.status(400).json({
                error: 'No organizer found'
            });
        }

        // Insert event
        const result = await database.query(`
            INSERT INTO [Events].[Events] (
                OrganizerId,
                CategoryId,
                Title,
                Slug,
                Description,
                ShortDescription,
                StartDate,
                EndDate,
                VenueName,
                VenueAddress,
                VenueCity,
                VenueState,
                VenueCountry,
                IsOnline,
                OnlineMeetingUrl,
                Capacity,
                Price,
                Currency,
                IsFree,
                ContactEmail,
                ContactPhone,
                FeaturedImageUrl,
                Tags,
                Requirements,
                Status,
                IsFeatured,
                BookingCount,
                ViewCount,
                TotalRevenue
            )
            OUTPUT INSERTED.EventId, INSERTED.Title, INSERTED.CreatedAt
            VALUES (
                @organizerId,
                @categoryId,
                @title,
                @slug,
                @description,
                @shortDescription,
                @startDate,
                @endDate,
                @venueName,
                @venueAddress,
                @venueCity,
                @venueState,
                @venueCountry,
                @isOnline,
                @onlineMeetingUrl,
                @capacity,
                @price,
                @currency,
                @isFree,
                @contactEmail,
                @contactPhone,
                @featuredImageUrl,
                @tags,
                @requirements,
                @status,
                0,
                0,
                0,
                0
            )
        `, {
            organizerId,
            categoryId,
            title,
            slug,
            description: description || shortDescription,
            shortDescription: shortDescription || description?.substring(0, 150),
            startDate,
            endDate: endDate || startDate,
            venueName: venueName || null,
            venueAddress: venueAddress || null,
            venueCity: venueCity || null,
            venueState: venueState || null,
            venueCountry: venueCountry || 'USA',
            isOnline: isOnline || false,
            onlineMeetingUrl: onlineMeetingUrl || null,
            capacity: parseInt(capacity),
            price: parseFloat(price) || 0,
            currency,
            isFree: isFree || (parseFloat(price) === 0),
            contactEmail: contactEmail || null,
            contactPhone: contactPhone || null,
            featuredImageUrl: featuredImageUrl || null,
            tags: Array.isArray(tags) ? JSON.stringify(tags) : null,
            requirements: requirements || null,
            status
        });

        const newEvent = result.recordset[0];
        
        res.status(201).json({
            message: 'Event created successfully',
            eventId: newEvent.EventId,
            title: newEvent.Title,
            createdAt: newEvent.CreatedAt
        });
    } catch (error) {
        console.error('Failed to create event:', error);
        res.status(500).json({
            error: 'Failed to create event',
            details: error.message
        });
    }
});

// Update event (requires authentication)
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Validate GUID format
        const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!guidRegex.test(id)) {
            return res.status(400).json({
                error: 'Invalid event ID format'
            });
        }

        const {
            title,
            categoryId,
            description,
            shortDescription,
            startDate,
            endDate,
            venueName,
            venueAddress,
            venueCity,
            venueState,
            venueCountry,
            isOnline,
            onlineMeetingUrl,
            capacity,
            price,
            currency,
            isFree,
            contactEmail,
            contactPhone,
            featuredImageUrl,
            tags,
            requirements,
            status
        } = req.body;

        // Check if event exists
        const checkResult = await database.query(`
            SELECT EventId FROM [Events].[Events] WHERE EventId = @id
        `, { id });

        if (checkResult.recordset.length === 0) {
            return res.status(404).json({
                error: 'Event not found'
            });
        }

        // Build update query dynamically
        const updates = [];
        const params = { id };

        if (title !== undefined) {
            updates.push('Title = @title');
            params.title = title;
            // Update slug
            const slug = title.toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '');
            updates.push('Slug = @slug');
            params.slug = slug;
        }
        if (categoryId !== undefined) {
            updates.push('CategoryId = @categoryId');
            params.categoryId = categoryId;
        }
        if (description !== undefined) {
            updates.push('Description = @description');
            params.description = description;
        }
        if (shortDescription !== undefined) {
            updates.push('ShortDescription = @shortDescription');
            params.shortDescription = shortDescription;
        }
        if (startDate !== undefined) {
            updates.push('StartDate = @startDate');
            params.startDate = startDate;
        }
        if (endDate !== undefined) {
            updates.push('EndDate = @endDate');
            params.endDate = endDate;
        }
        if (venueName !== undefined) {
            updates.push('VenueName = @venueName');
            params.venueName = venueName;
        }
        if (venueAddress !== undefined) {
            updates.push('VenueAddress = @venueAddress');
            params.venueAddress = venueAddress;
        }
        if (venueCity !== undefined) {
            updates.push('VenueCity = @venueCity');
            params.venueCity = venueCity;
        }
        if (venueState !== undefined) {
            updates.push('VenueState = @venueState');
            params.venueState = venueState;
        }
        if (venueCountry !== undefined) {
            updates.push('VenueCountry = @venueCountry');
            params.venueCountry = venueCountry;
        }
        if (isOnline !== undefined) {
            updates.push('IsOnline = @isOnline');
            params.isOnline = isOnline;
        }
        if (onlineMeetingUrl !== undefined) {
            updates.push('OnlineMeetingUrl = @onlineMeetingUrl');
            params.onlineMeetingUrl = onlineMeetingUrl;
        }
        if (capacity !== undefined) {
            updates.push('Capacity = @capacity');
            params.capacity = parseInt(capacity);
        }
        if (price !== undefined) {
            updates.push('Price = @price');
            params.price = parseFloat(price);
        }
        if (currency !== undefined) {
            updates.push('Currency = @currency');
            params.currency = currency;
        }
        if (isFree !== undefined) {
            updates.push('IsFree = @isFree');
            params.isFree = isFree;
        }
        if (contactEmail !== undefined) {
            updates.push('ContactEmail = @contactEmail');
            params.contactEmail = contactEmail;
        }
        if (contactPhone !== undefined) {
            updates.push('ContactPhone = @contactPhone');
            params.contactPhone = contactPhone;
        }
        if (featuredImageUrl !== undefined) {
            updates.push('FeaturedImageUrl = @featuredImageUrl');
            params.featuredImageUrl = featuredImageUrl;
        }
        if (tags !== undefined) {
            updates.push('Tags = @tags');
            params.tags = Array.isArray(tags) ? JSON.stringify(tags) : tags;
        }
        if (requirements !== undefined) {
            updates.push('Requirements = @requirements');
            params.requirements = requirements;
        }
        if (status !== undefined) {
            updates.push('Status = @status');
            params.status = status;
        }

        if (updates.length === 0) {
            return res.status(400).json({
                error: 'No fields to update'
            });
        }

        updates.push('UpdatedAt = GETDATE()');

        await database.query(`
            UPDATE [Events].[Events]
            SET ${updates.join(', ')}
            WHERE EventId = @id
        `, params);

        res.json({
            message: 'Event updated successfully',
            eventId: id
        });
    } catch (error) {
        console.error('Failed to update event:', error);
        res.status(500).json({
            error: 'Failed to update event',
            details: error.message
        });
    }
});

// Delete event (requires authentication)
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Validate GUID format
        const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!guidRegex.test(id)) {
            return res.status(400).json({
                error: 'Invalid event ID format'
            });
        }

        // Check if event exists
        const checkResult = await database.query(`
            SELECT EventId, Title FROM [Events].[Events] WHERE EventId = @id
        `, { id });

        if (checkResult.recordset.length === 0) {
            return res.status(404).json({
                error: 'Event not found'
            });
        }

        const eventTitle = checkResult.recordset[0].Title;

        // Soft delete - update status to Cancelled
        await database.query(`
            UPDATE [Events].[Events]
            SET Status = 'Cancelled', UpdatedAt = GETDATE()
            WHERE EventId = @id
        `, { id });

        res.json({
            message: 'Event deleted successfully',
            eventId: id,
            title: eventTitle
        });
    } catch (error) {
        console.error('Failed to delete event:', error);
        res.status(500).json({
            error: 'Failed to delete event',
            details: error.message
        });
    }
});

// Increment event view count
router.put('/:id/increment-view', async (req, res) => {
    try {
        const { id } = req.params;

        await database.query(`
            UPDATE [Events].[Events]
            SET ViewCount = ISNULL(ViewCount, 0) + 1
            WHERE EventId = @eventId
        `, { eventId: id });

        res.json({ success: true });
    } catch (error) {
        console.error('Failed to increment view count:', error);
        res.status(500).json({ error: 'Failed to increment view count' });
    }
});

module.exports = router;