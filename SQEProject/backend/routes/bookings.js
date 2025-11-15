const express = require('express');
const Joi = require('joi');
const database = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Validation schema for booking
const bookingSchema = Joi.object({
    eventId: Joi.string().guid().required(),
    ticketId: Joi.string().guid().optional(),
    quantity: Joi.number().integer().min(1).max(10).required(),
    attendeeInfo: Joi.object({
        name: Joi.string().required(),
        email: Joi.string().email().required(),
        phone: Joi.string().optional(),
        guests: Joi.array().items(Joi.string()).optional()
    }).required()
});

// Create new booking
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { error, value } = bookingSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                error: 'Validation failed',
                details: error.details[0].message
            });
        }

        const { eventId, ticketId, quantity, attendeeInfo } = value;
        const userId = req.user.userId;

        // Get event details and check availability
        const eventResult = await database.query(`
            SELECT 
                EventId, Title, Capacity, BookingCount, Price, IsFree, 
                StartDate, Status, OrganizerId
            FROM [Events].[Events]
            WHERE EventId = @eventId
        `, { eventId });

        if (eventResult.recordset.length === 0) {
            return res.status(404).json({
                error: 'Event not found'
            });
        }

        const event = eventResult.recordset[0];
        
        if (event.Status !== 'Published') {
            return res.status(400).json({
                error: 'Event is not available for booking'
            });
        }

        const availableSeats = event.Capacity - (event.BookingCount || 0);
        if (quantity > availableSeats) {
            return res.status(400).json({
                error: `Only ${availableSeats} seats available`
            });
        }

        // Check if event is in the past
        if (new Date(event.StartDate) < new Date()) {
            return res.status(400).json({
                error: 'Cannot book past events'
            });
        }

        let ticketPrice = event.Price || 0;
        let ticketDetails = null;

        // If specific ticket type is selected
        if (ticketId) {
            const ticketResult = await database.query(`
                SELECT TicketId, Name, Price, Quantity, QuantitySold, MaxPerUser, IsActive
                FROM [Events].[EventTickets]
                WHERE TicketId = @ticketId AND EventId = @eventId
            `, { ticketId, eventId });

            if (ticketResult.recordset.length === 0) {
                return res.status(404).json({
                    error: 'Ticket type not found'
                });
            }

            ticketDetails = ticketResult.recordset[0];
            
            if (!ticketDetails.IsActive) {
                return res.status(400).json({
                    error: 'Ticket type is not available'
                });
            }

            const availableTickets = ticketDetails.Quantity - (ticketDetails.QuantitySold || 0);
            if (quantity > availableTickets) {
                return res.status(400).json({
                    error: `Only ${availableTickets} tickets available for ${ticketDetails.Name}`
                });
            }

            ticketPrice = ticketDetails.Price;
        }

        // Calculate pricing
        const unitPrice = ticketPrice;
        const totalPrice = unitPrice * quantity;
        const platformFeeRate = 0.128; // 12.8% platform fee
        const platformFee = event.IsFree ? 0 : totalPrice * platformFeeRate;
        const finalAmount = totalPrice + platformFee;

        // Generate booking reference
        const bookingReference = 'EH' + String(Math.floor(Math.random() * 999999) + 1).padStart(6, '0');

        // Create booking
        const bookingResult = await database.query(`
            INSERT INTO [Events].[Bookings] (
                BookingId, EventId, TicketId, UserId, BookingReference,
                Quantity, UnitPrice, TotalPrice, PlatformFee, FinalAmount,
                Currency, Status, PaymentStatus, AttendeeInfo, QrCode
            )
            OUTPUT INSERTED.BookingId, INSERTED.BookingReference, INSERTED.CreatedAt
            VALUES (
                NEWID(), @eventId, @ticketId, @userId, @bookingReference,
                @quantity, @unitPrice, @totalPrice, @platformFee, @finalAmount,
                'USD', 'Confirmed', @paymentStatus, @attendeeInfo, @qrCode
            )
        `, {
            eventId,
            ticketId: ticketId || null,
            userId,
            bookingReference,
            quantity,
            unitPrice,
            totalPrice,
            platformFee,
            finalAmount,
            paymentStatus: event.IsFree ? 'Completed' : 'Pending',
            attendeeInfo: JSON.stringify(attendeeInfo),
            qrCode: 'QR_' + bookingReference
        });

        const booking = bookingResult.recordset[0];

        // Update event booking count
        await database.query(`
            UPDATE [Events].[Events] 
            SET BookingCount = ISNULL(BookingCount, 0) + @quantity,
                TotalRevenue = ISNULL(TotalRevenue, 0) + @totalPrice
            WHERE EventId = @eventId
        `, { eventId, quantity, totalPrice });

        // Update ticket quantity sold if specific ticket
        if (ticketId) {
            await database.query(`
                UPDATE [Events].[EventTickets]
                SET QuantitySold = ISNULL(QuantitySold, 0) + @quantity
                WHERE TicketId = @ticketId
            `, { ticketId, quantity });
        }

        // Create transaction record (for free events too)
        await database.query(`
            INSERT INTO [Payments].[Transactions] (
                BookingId, OrganizerId, UserId, Type, Status,
                Amount, Currency, PlatformFee, NetAmount,
                PaymentGateway, Description, ProcessedAt
            )
            VALUES (
                @bookingId, @organizerId, @userId, 'Payment', @status,
                @finalAmount, 'USD', @platformFee, @totalPrice,
                @gateway, @description, GETUTCDATE()
            )
        `, {
            bookingId: booking.BookingId,
            organizerId: event.OrganizerId,
            userId,
            status: event.IsFree ? 'Completed' : 'Pending',
            finalAmount,
            platformFee,
            totalPrice,
            gateway: event.IsFree ? 'Free' : 'Pending',
            description: `Payment for ${event.Title}`
        });

        res.status(201).json({
            message: 'Booking created successfully',
            booking: {
                bookingId: booking.BookingId,
                bookingReference: booking.BookingReference,
                eventTitle: event.Title,
                quantity,
                totalPrice,
                platformFee,
                finalAmount,
                status: 'Confirmed',
                paymentStatus: event.IsFree ? 'Completed' : 'Pending',
                createdAt: booking.CreatedAt
            }
        });
    } catch (error) {
        console.error('Booking creation error:', error);
        res.status(500).json({
            error: 'Failed to create booking'
        });
    }
});

// Get user's bookings
router.get('/my', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;

        const result = await database.query(`
            SELECT 
                b.BookingId as bookingId,
                b.BookingReference as bookingReference,
                b.Quantity as quantity,
                b.UnitPrice as unitPrice,
                b.TotalPrice as totalPrice,
                b.PlatformFee as platformFee,
                b.FinalAmount as finalAmount,
                b.Currency as currency,
                b.Status as status,
                b.PaymentStatus as paymentStatus,
                b.AttendeeInfo as attendeeInfo,
                b.QrCode as qrCode,
                b.CreatedAt as createdAt,
                e.EventId as eventId,
                e.Title as eventTitle,
                e.StartDate as eventStartDate,
                e.EndDate as eventEndDate,
                e.VenueName as venueName,
                e.IsOnline as isOnline,
                t.Name as ticketName
            FROM [Events].[Bookings] b
            INNER JOIN [Events].[Events] e ON b.EventId = e.EventId
            LEFT JOIN [Events].[EventTickets] t ON b.TicketId = t.TicketId
            WHERE b.UserId = @userId
            ORDER BY b.CreatedAt DESC
        `, { userId });

        const bookings = result.recordset.map(booking => ({
            ...booking,
            attendeeInfo: booking.attendeeInfo ? JSON.parse(booking.attendeeInfo) : null,
            isOnline: Boolean(booking.isOnline)
        }));

        res.json(bookings);
    } catch (error) {
        console.error('Failed to fetch user bookings:', error);
        res.status(500).json({
            error: 'Failed to fetch bookings'
        });
    }
});

// Get specific booking details
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const result = await database.query(`
            SELECT 
                b.BookingId as bookingId,
                b.BookingReference as bookingReference,
                b.Quantity as quantity,
                b.UnitPrice as unitPrice,
                b.TotalPrice as totalPrice,
                b.PlatformFee as platformFee,
                b.FinalAmount as finalAmount,
                b.Currency as currency,
                b.Status as status,
                b.PaymentStatus as paymentStatus,
                b.AttendeeInfo as attendeeInfo,
                b.QrCode as qrCode,
                b.CreatedAt as createdAt,
                e.EventId as eventId,
                e.Title as eventTitle,
                e.Description as eventDescription,
                e.StartDate as eventStartDate,
                e.EndDate as eventEndDate,
                e.VenueName as venueName,
                e.VenueAddress as venueAddress,
                e.IsOnline as isOnline,
                e.OnlineMeetingUrl as onlineMeetingUrl,
                t.Name as ticketName,
                t.Description as ticketDescription
            FROM [Events].[Bookings] b
            INNER JOIN [Events].[Events] e ON b.EventId = e.EventId
            LEFT JOIN [Events].[EventTickets] t ON b.TicketId = t.TicketId
            WHERE b.BookingId = @bookingId AND b.UserId = @userId
        `, { bookingId: id, userId });

        if (result.recordset.length === 0) {
            return res.status(404).json({
                error: 'Booking not found'
            });
        }

        const booking = result.recordset[0];

        res.json({
            ...booking,
            attendeeInfo: booking.attendeeInfo ? JSON.parse(booking.attendeeInfo) : null,
            isOnline: Boolean(booking.isOnline)
        });
    } catch (error) {
        console.error('Failed to fetch booking:', error);
        res.status(500).json({
            error: 'Failed to fetch booking'
        });
    }
});

module.exports = router;