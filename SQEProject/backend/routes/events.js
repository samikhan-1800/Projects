const express = require('express');
const database = require('../config/database');

const router = express.Router();

// Get all published events
router.get('/', async (req, res) => {
    try {
        const { category, search, limit = 50, offset = 0 } = req.query;
        
        let whereClause = "WHERE e.Status = 'Published'";
        const params = {};

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

// Get single event by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

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
            WHERE e.EventId = @eventId
        `, { eventId: id });

        if (result.recordset.length === 0) {
            return res.status(404).json({
                error: 'Event not found'
            });
        }

        const event = result.recordset[0];

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
            WHERE EventId = @eventId AND IsActive = 1
            ORDER BY SortOrder
        `, { eventId: id });

        // Increment view count
        await database.query(`
            UPDATE [Events].[Events] 
            SET ViewCount = ISNULL(ViewCount, 0) + 1 
            WHERE EventId = @eventId
        `, { eventId: id });

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

module.exports = router;