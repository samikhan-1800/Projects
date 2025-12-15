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
    }).required(),
    transactionId: Joi.string().optional().allow('', null),
    paymentReceiptUrl: Joi.string().optional().allow('', null)
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

        const { eventId, ticketId, quantity, attendeeInfo, transactionId, paymentReceiptUrl } = value;
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

        // Prevent admins from booking events - admins should manage, not book
        const userRole = req.user.role || req.user.userType;
        
        if (userRole === 'Admin') {
            return res.status(403).json({
                error: 'Admins cannot book events. Admin accounts are for management purposes only.'
            });
        }

        // Prevent organizers from booking their own events
        const organizerCheck = await database.query(`
            SELECT OrganizerId FROM [Users].[Organizers] WHERE UserId = @userId
        `, { userId });
        
        if (organizerCheck.recordset.length > 0 && organizerCheck.recordset[0].OrganizerId === event.OrganizerId) {
            return res.status(403).json({
                error: 'You cannot book your own event as an organizer'
            });
        }

        // Check for duplicate bookings - prevent user from booking same event twice
        const existingBooking = await database.query(`
            SELECT BookingId, Status FROM [Events].[Bookings]
            WHERE UserId = @userId AND EventId = @eventId AND Status != 'Cancelled'
        `, { userId, eventId });
        
        if (existingBooking.recordset.length > 0) {
            return res.status(400).json({
                error: 'You have already booked this event',
                existingBookingId: existingBooking.recordset[0].BookingId
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
                Currency, Status, PaymentStatus, AttendeeInfo, QrCode,
                TransactionId, PaymentReceiptUrl
            )
            OUTPUT INSERTED.BookingId, INSERTED.BookingReference, INSERTED.CreatedAt
            VALUES (
                NEWID(), @eventId, @ticketId, @userId, @bookingReference,
                @quantity, @unitPrice, @totalPrice, @platformFee, @finalAmount,
                'PKR', @bookingStatus, @paymentStatus, @attendeeInfo, @qrCode,
                @transactionId, @paymentReceiptUrl
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
            bookingStatus: event.IsFree ? 'Confirmed' : 'Pending',
            paymentStatus: event.IsFree ? 'Completed' : 'Pending',
            attendeeInfo: JSON.stringify(attendeeInfo),
            qrCode: 'QR_' + bookingReference,
            transactionId: transactionId || null,
            paymentReceiptUrl: paymentReceiptUrl || null
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
                @finalAmount, 'PKR', @platformFee, @totalPrice,
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
        
        console.log('=== USER BOOKINGS REQUEST ===');
        console.log('UserId:', userId);

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
                b.TransactionId as transactionId,
                b.PaymentReceiptUrl as paymentReceiptUrl,
                b.PaymentNotes as paymentNotes,
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

        console.log(`Found ${result.recordset.length} bookings for user`);
        if (result.recordset.length > 0) {
            result.recordset.forEach((b, idx) => {
                if (b.transactionId || b.paymentReceiptUrl) {
                    console.log(`  [${idx}] Booking ${b.bookingId}:`);
                    console.log(`      TransactionId: ${b.transactionId || 'NULL'}`);
                    console.log(`      PaymentStatus: ${b.paymentStatus}`);
                    console.log(`      Has Receipt: ${!!b.paymentReceiptUrl}`);
                }
            });
        }

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

// Update booking with payment proof (users)
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const bookingId = req.params.id;
        const userId = req.user.userId;
        const { transactionId, paymentReceiptUrl, paymentStatus } = req.body;

        console.log('=== PAYMENT UPLOAD REQUEST ===');
        console.log('Booking ID:', bookingId);
        console.log('User ID:', userId);
        console.log('Transaction ID:', transactionId);
        console.log('Has Receipt:', !!paymentReceiptUrl);
        console.log('Receipt length:', paymentReceiptUrl ? paymentReceiptUrl.length : 0);
        console.log('Payment Status:', paymentStatus);

        // Verify user owns this booking
        const checkResult = await database.query(`
            SELECT BookingId, UserId, Status, PaymentStatus FROM [Events].[Bookings]
            WHERE BookingId = @bookingId
        `, { bookingId });

        console.log('Booking check result:', checkResult.recordset);

        if (checkResult.recordset.length === 0) {
            console.log('ERROR: Booking not found:', bookingId);
            return res.status(404).json({ error: 'Booking not found' });
        }

        const booking = checkResult.recordset[0];
        if (booking.UserId !== userId) {
            console.log('ERROR: User mismatch. Booking User:', booking.UserId, 'Request User:', userId);
            return res.status(403).json({ error: 'Unauthorized to update this booking' });
        }

        const currentPaymentStatus = (booking.PaymentStatus || '').toString().trim().toLowerCase();
        const userType = (req.user.userType || '').toString();

        // Prevent users from modifying payments after confirmation
        if ((transactionId || paymentReceiptUrl) && currentPaymentStatus === 'completed') {
            return res.status(400).json({ error: 'Payment is already confirmed for this booking' });
        }

        // Users are only allowed to submit proof; they cannot set final payment states
        let safePaymentStatus = paymentStatus;
        if (userType === 'User') {
            if (paymentReceiptUrl || transactionId) {
                safePaymentStatus = 'Pending';
            } else {
                safePaymentStatus = booking.PaymentStatus || 'Pending';
            }
        }

        console.log('Updating booking with payment proof...');
        
        const updateResult = await database.query(`
            UPDATE [Events].[Bookings]
            SET TransactionId = @transactionId,
                PaymentReceiptUrl = @paymentReceiptUrl,
                PaymentStatus = @paymentStatus,
                UpdatedAt = GETUTCDATE()
            WHERE BookingId = @bookingId
        `, {
            bookingId,
            transactionId: transactionId || null,
            paymentReceiptUrl: paymentReceiptUrl || null,
            paymentStatus: safePaymentStatus || 'Pending'
        });

        console.log('Update result - rows affected:', updateResult.rowsAffected);

        // Keep transaction ledger in sync (manual payment proof)
        try {
            const txUpdate = await database.query(`
                UPDATE [Payments].[Transactions]
                SET Status = 'Pending',
                    PaymentGateway = COALESCE(NULLIF(PaymentGateway, ''), 'Manual'),
                    GatewayTransactionId = @gatewayTransactionId,
                    ProcessedAt = NULL,
                    UpdatedAt = GETUTCDATE()
                WHERE BookingId = @bookingId AND Type = 'Payment'
            `, {
                bookingId,
                gatewayTransactionId: (transactionId || '').toString().trim() || null
            });

            const affected = Array.isArray(txUpdate.rowsAffected) ? txUpdate.rowsAffected[0] : 0;
            console.log('Transaction sync (Pending) rows affected:', affected);
        } catch (txError) {
            console.error('Transaction sync failed (upload):', txError);
        }

        // Verify the update
        const verifyResult = await database.query(`
            SELECT TransactionId, PaymentReceiptUrl, PaymentStatus 
            FROM [Events].[Bookings]
            WHERE BookingId = @bookingId
        `, { bookingId });

        console.log('Verification after update:', verifyResult.recordset[0]);

        res.json({ 
            message: 'Payment proof uploaded successfully',
            booking: verifyResult.recordset[0]
        });
    } catch (error) {
        console.error('ERROR in payment upload:', error);
        res.status(500).json({ error: 'Failed to update booking', details: error.message });
    }
});

// Get organizer's bookings/attendees
router.get('/organizer/attendees', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { eventId, status } = req.query;
        
        console.log('=== ORGANIZER ATTENDEES REQUEST ===');
        console.log('UserId from token:', userId);
        
        // First, check if this user is an organizer
        const organizerCheck = await database.query(`
            SELECT OrganizerId, OrganizationName FROM [Users].[Organizers] WHERE UserId = @userId
        `, { userId });
        
        console.log('Organizer check result:', organizerCheck.recordset);
        
        if (organizerCheck.recordset.length === 0) {
            console.log('ERROR: User is not an organizer');
            return res.json([]);
        }
        
        const organizerId = organizerCheck.recordset[0].OrganizerId;
        console.log('Found OrganizerId:', organizerId);
        
        // Check how many events this organizer has
        const eventsCheck = await database.query(`
            SELECT EventId, Title FROM [Events].[Events] WHERE OrganizerId = @organizerId
        `, { organizerId });
        
        console.log('Organizer has', eventsCheck.recordset.length, 'events');
        
        // Check total bookings for organizer's events
        const bookingsCheck = await database.query(`
            SELECT COUNT(*) as total FROM [Events].[Bookings] b
            INNER JOIN [Events].[Events] e ON b.EventId = e.EventId
            WHERE e.OrganizerId = @organizerId
        `, { organizerId });
        
        console.log('Total bookings for organizer events:', bookingsCheck.recordset[0].total);

        let query = `
            SELECT 
                b.BookingId as bookingId,
                b.BookingReference as bookingReference,
                b.Quantity as quantity,
                b.UnitPrice as unitPrice,
                b.FinalAmount as finalAmount,
                b.Status as status,
                b.PaymentStatus as paymentStatus,
                b.AttendeeInfo as attendeeInfo,
                b.CreatedAt as createdAt,
                b.TransactionId as transactionId,
                b.PaymentReceiptUrl as paymentReceiptUrl,
                b.PaymentNotes as paymentNotes,
                b.PaymentConfirmedAt as paymentConfirmedAt,
                e.EventId as eventId,
                e.Title as eventTitle,
                u.FirstName as userFirstName,
                u.LastName as userLastName,
                u.Email as userEmail,
                u.Phone as userPhone
            FROM [Events].[Bookings] b
            INNER JOIN [Events].[Events] e ON b.EventId = e.EventId
            LEFT JOIN [Users].[Users] u ON b.UserId = u.UserId
            WHERE e.OrganizerId = @organizerId`;

        const params = { organizerId };

        if (eventId) {
            query += ` AND b.EventId = @eventId`;
            params.eventId = eventId;
        }

        if (status) {
            query += ` AND b.Status = @status`;
            params.status = status;
        }

        query += ` ORDER BY b.CreatedAt DESC`;
        
        console.log('Executing query with params:', params);

        const result = await database.query(query, params);

        console.log(`Found ${result.recordset.length} attendees`);
        if (result.recordset.length > 0) {
            console.log('First 3 attendees with payment info:');
            result.recordset.slice(0, 3).forEach((att, idx) => {
                console.log(`  [${idx}] BookingId: ${att.bookingId}`);
                console.log(`      TransactionId: ${att.transactionId || 'NULL'}`);
                console.log(`      PaymentStatus: ${att.paymentStatus}`);
                console.log(`      Has Receipt: ${!!att.paymentReceiptUrl}`);
                console.log(`      Receipt Length: ${att.paymentReceiptUrl ? att.paymentReceiptUrl.length : 0} chars`);
            });
        }

        const bookings = result.recordset.map(booking => {
            const mapped = {
                ...booking,
                userName: `${booking.userFirstName || ''} ${booking.userLastName || ''}`.trim() || 'Guest',
                attendeeInfo: booking.attendeeInfo ? JSON.parse(booking.attendeeInfo) : null
            };
            
            // Log if receipt exists
            if (booking.paymentReceiptUrl) {
                console.log(`Booking ${booking.bookingId} has receipt (${booking.paymentReceiptUrl.length} chars)`);
            }
            
            return mapped;
        });

        // Set no-cache headers to prevent stale data
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');
        
        console.log(`Returning ${bookings.length} bookings to organizer`);
        res.json(bookings);
    } catch (error) {
        console.error('Failed to fetch organizer attendees:', error);
        res.status(500).json({
            error: 'Failed to fetch attendees'
        });
    }
});

// Get organizer analytics
router.get('/organizer/analytics', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        
        console.log('=== ANALYTICS REQUEST ===');
        console.log('UserId:', userId);

        // First get the organizer ID
        const organizerCheck = await database.query(`
            SELECT OrganizerId FROM [Users].[Organizers] WHERE UserId = @userId
        `, { userId });
        
        if (organizerCheck.recordset.length === 0) {
            console.log('User is not an organizer');
            return res.json({
                summary: {
                    totalBookings: 0,
                    totalTicketsSold: 0,
                    totalRevenue: 0,
                    totalFees: 0,
                    netRevenue: 0,
                    eventsWithBookings: 0,
                    confirmedBookings: 0,
                    cancelledBookings: 0,
                    avgBookingValue: 0
                },
                monthlyTrend: [],
                categoryDistribution: []
            });
        }
        
        const organizerId = organizerCheck.recordset[0].OrganizerId;
        console.log('OrganizerId:', organizerId);

        const result = await database.query(`
            SELECT 
                COUNT(DISTINCT b.BookingId) as totalBookings,
                ISNULL(SUM(b.Quantity), 0) as totalTicketsSold,
                ISNULL(SUM(b.FinalAmount), 0) as totalRevenue,
                ISNULL(SUM(b.PlatformFee), 0) as totalFees,
                ISNULL(SUM(b.FinalAmount - b.PlatformFee), 0) as netRevenue,
                COUNT(DISTINCT b.EventId) as eventsWithBookings,
                COUNT(DISTINCT CASE WHEN b.Status = 'Confirmed' THEN b.BookingId END) as confirmedBookings,
                COUNT(DISTINCT CASE WHEN b.Status = 'Cancelled' THEN b.BookingId END) as cancelledBookings,
                ISNULL(AVG(b.FinalAmount), 0) as avgBookingValue
            FROM [Events].[Bookings] b
            INNER JOIN [Events].[Events] e ON e.EventId = b.EventId
            WHERE e.OrganizerId = @organizerId
        `, { organizerId });

        const stats = result.recordset[0];
        console.log('Analytics stats:', stats);

        // Get monthly revenue trend (last 6 months)
        const trendResult = await database.query(`
            SELECT 
                FORMAT(b.CreatedAt, 'yyyy-MM') as month,
                ISNULL(SUM(b.FinalAmount), 0) as revenue,
                COUNT(b.BookingId) as bookings
            FROM [Events].[Bookings] b
            INNER JOIN [Events].[Events] e ON e.EventId = b.EventId
            WHERE e.OrganizerId = @organizerId
            AND b.CreatedAt >= DATEADD(MONTH, -6, GETDATE())
            GROUP BY FORMAT(b.CreatedAt, 'yyyy-MM')
            ORDER BY month
        `, { organizerId });

        // Get category distribution
        const categoryResult = await database.query(`
            SELECT 
                c.Name as category,
                COUNT(DISTINCT e.EventId) as eventCount,
                ISNULL(SUM(b.Quantity), 0) as ticketsSold,
                ISNULL(SUM(b.FinalAmount), 0) as revenue
            FROM [Events].[Events] e
            LEFT JOIN [Events].[Categories] c ON e.CategoryId = c.CategoryId
            LEFT JOIN [Events].[Bookings] b ON e.EventId = b.EventId
            WHERE e.OrganizerId = @organizerId
            GROUP BY c.Name
            ORDER BY ticketsSold DESC
        `, { organizerId });

        res.json({
            summary: stats,
            monthlyTrend: trendResult.recordset,
            categoryDistribution: categoryResult.recordset
        });
    } catch (error) {
        console.error('Failed to fetch organizer analytics:', error);
        res.status(500).json({
            error: 'Failed to fetch analytics'
        });
    }
});

// Confirm payment (organizers only)
router.put('/:id/confirm-payment', authenticateToken, async (req, res) => {
    try {
        const { notes } = req.body;
        const bookingId = req.params.id;
        const userId = req.user.userId;

        // Verify organizer owns this event
        const checkResult = await database.query(`
            SELECT b.BookingId, e.OrganizerId 
            FROM [Events].[Bookings] b
            INNER JOIN [Events].[Events] e ON b.EventId = e.EventId
            INNER JOIN [Users].[Organizers] o ON e.OrganizerId = o.OrganizerId
            WHERE b.BookingId = @bookingId AND o.UserId = @userId
        `, { bookingId, userId });

        if (checkResult.recordset.length === 0) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        await database.query(`
            UPDATE [Events].[Bookings] 
            SET Status = 'Confirmed',
                PaymentStatus = 'Completed',
                PaymentConfirmedAt = GETUTCDATE(),
                PaymentConfirmedBy = @userId,
                PaymentNotes = @notes,
                UpdatedAt = GETUTCDATE()
            WHERE BookingId = @bookingId
        `, { bookingId, userId, notes: notes || null });

        // Keep transaction ledger in sync
        await database.query(`
            UPDATE t
            SET t.Status = 'Completed',
                t.PaymentGateway = COALESCE(NULLIF(t.PaymentGateway, ''), 'Manual'),
                t.GatewayTransactionId = COALESCE(NULLIF(t.GatewayTransactionId, ''), b.TransactionId),
                t.ProcessedAt = GETUTCDATE(),
                t.UpdatedAt = GETUTCDATE(),
                t.GatewayResponse = NULL,
                t.FailureReason = NULL
            FROM [Payments].[Transactions] t
            LEFT JOIN [Events].[Bookings] b ON t.BookingId = b.BookingId
            WHERE t.BookingId = @bookingId AND t.Type = 'Payment'
        `, { bookingId });

        res.json({ message: 'Payment confirmed successfully' });
    } catch (error) {
        console.error('Failed to confirm payment:', error);
        res.status(500).json({ error: 'Failed to confirm payment' });
    }
});

// Reject payment (organizers only)
router.put('/:id/reject-payment', authenticateToken, async (req, res) => {
    try {
        const { notes } = req.body;
        const bookingId = req.params.id;
        const userId = req.user.userId;

        if (!notes) {
            return res.status(400).json({ error: 'Rejection reason is required' });
        }

        // Verify organizer owns this event
        const checkResult = await database.query(`
            SELECT b.BookingId, e.OrganizerId 
            FROM [Events].[Bookings] b
            INNER JOIN [Events].[Events] e ON b.EventId = e.EventId
            INNER JOIN [Users].[Organizers] o ON e.OrganizerId = o.OrganizerId
            WHERE b.BookingId = @bookingId AND o.UserId = @userId
        `, { bookingId, userId });

        if (checkResult.recordset.length === 0) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        await database.query(`
            UPDATE [Events].[Bookings]
            SET Status = 'Cancelled',
                PaymentStatus = 'Failed',
                PaymentNotes = @notes,
                UpdatedAt = GETUTCDATE()
            WHERE BookingId = @bookingId
        `, { bookingId, notes });

        // Keep transaction ledger in sync
        await database.query(`
            UPDATE [Payments].[Transactions]
            SET Status = 'Failed',
                PaymentGateway = COALESCE(NULLIF(PaymentGateway, ''), 'Manual'),
                FailureReason = @notes,
                UpdatedAt = GETUTCDATE()
            WHERE BookingId = @bookingId AND Type = 'Payment'
        `, { bookingId, notes });

        res.json({ message: 'Payment rejected', notes });
    } catch (error) {
        console.error('Failed to reject payment:', error);
        res.status(500).json({ error: 'Failed to reject payment' });
    }
});

module.exports = router;