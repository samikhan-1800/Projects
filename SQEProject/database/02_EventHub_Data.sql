-- =====================================================
-- EventHub Database Data Insertion Script
-- Version: 2.0.0
-- Created: November 15, 2025
-- Description: Initial data and sample records for EventHub platform
-- Instructions: Run this file AFTER running 01_EventHub_Schema.sql
-- =====================================================

USE EventHubDB;
GO

-- =====================================================
-- Insert System Settings
-- =====================================================

INSERT INTO [System].[Settings] ([Category], [Key], [Value], [DataType], [Description], [IsPublic]) VALUES
-- General Settings
('General', 'SiteName', 'EventHub', 'String', 'Name of the platform', 1),
('General', 'SiteUrl', 'https://eventhub.com', 'String', 'Base URL of the platform', 1),
('General', 'SupportEmail', 'support@eventhub.com', 'String', 'Support email address', 1),
('General', 'DefaultTimezone', 'UTC', 'String', 'Default timezone for events', 1),
('General', 'DefaultCurrency', 'USD', 'String', 'Default currency for transactions', 1),
('General', 'MaxUploadSize', '10485760', 'Number', 'Maximum file upload size in bytes (10MB)', 0),
('General', 'AllowRegistrations', 'true', 'Boolean', 'Allow new user registrations', 0),
('General', 'RequireEmailVerification', 'true', 'Boolean', 'Require email verification for new users', 0),

-- Payment Settings
('Payment', 'DefaultCommissionRate', '12.80', 'Number', 'Default commission rate percentage', 0),
('Payment', 'MinPayoutAmount', '25.00', 'Number', 'Minimum payout amount', 0),
('Payment', 'PaymentGateways', '["stripe", "paypal"]', 'JSON', 'Enabled payment gateways', 0),

-- Email Settings
('Email', 'SmtpHost', 'smtp.gmail.com', 'String', 'SMTP server host', 0),
('Email', 'SmtpPort', '587', 'Number', 'SMTP server port', 0),
('Email', 'SmtpUsername', 'your-email@gmail.com', 'String', 'SMTP username', 0),
('Email', 'FromEmail', 'noreply@eventhub.com', 'String', 'Default from email address', 0),
('Email', 'FromName', 'EventHub', 'String', 'Default from name', 0),

-- Security Settings
('Security', 'PasswordMinLength', '8', 'Number', 'Minimum password length', 0),
('Security', 'MaxLoginAttempts', '5', 'Number', 'Maximum login attempts before lockout', 0),
('Security', 'LockoutDuration', '900', 'Number', 'Account lockout duration in seconds (15 minutes)', 0),
('Security', 'JwtSecretKey', 'your-super-secret-jwt-key-change-in-production-2025', 'String', 'JWT secret key', 0),
('Security', 'JwtExpiresIn', '900', 'Number', 'JWT token expiration in seconds (15 minutes)', 0),
('Security', 'RefreshTokenExpiresIn', '604800', 'Number', 'Refresh token expiration in seconds (7 days)', 0);
GO

-- =====================================================
-- Insert Event Categories
-- =====================================================

INSERT INTO [Events].[Categories] ([CategoryId], [Name], [Description], [IconClass], [Color], [SortOrder]) VALUES
(NEWID(), 'Technology', 'Tech conferences, workshops, and meetups', 'fas fa-laptop-code', '#0ea5a4', 1),
(NEWID(), 'Music', 'Concerts, festivals, and music events', 'fas fa-music', '#7c3aed', 2),
(NEWID(), 'Business', 'Networking, seminars, and business events', 'fas fa-briefcase', '#16a34a', 3),
(NEWID(), 'Art & Culture', 'Exhibitions, galleries, and cultural events', 'fas fa-palette', '#f59e0b', 4),
(NEWID(), 'Sports & Fitness', 'Sports events, tournaments, and fitness activities', 'fas fa-football-ball', '#dc2626', 5),
(NEWID(), 'Food & Drink', 'Food festivals, cooking classes, and culinary events', 'fas fa-utensils', '#8b5cf6', 6),
(NEWID(), 'Education', 'Workshops, courses, and educational events', 'fas fa-graduation-cap', '#0284c7', 7),
(NEWID(), 'Health & Wellness', 'Fitness, wellness, and health events', 'fas fa-heartbeat', '#059669', 8),
(NEWID(), 'Travel & Adventure', 'Travel experiences and adventure activities', 'fas fa-plane', '#0891b2', 9),
(NEWID(), 'Other', 'Miscellaneous events', 'fas fa-star', '#6b7280', 10);
GO

-- =====================================================
-- Create Default Users (Admin, Organizer, User)
-- =====================================================

-- Create Admin User
DECLARE @AdminUserId UNIQUEIDENTIFIER = NEWID();
DECLARE @AdminSalt NVARCHAR(255) = CAST(NEWID() AS NVARCHAR(255));
DECLARE @AdminPasswordHash NVARCHAR(255) = CONVERT(NVARCHAR(255), HASHBYTES('SHA2_256', 'Admin123!' + @AdminSalt), 2);

INSERT INTO [Users].[Users] (
    [UserId], [Email], [PasswordHash], [Salt], [FirstName], [LastName], 
    [Role], [Status], [EmailVerified], [Phone], [Bio]
) VALUES (
    @AdminUserId, 
    'admin@eventhub.com', 
    @AdminPasswordHash,
    @AdminSalt,
    'System', 
    'Administrator', 
    'Admin', 
    'Active', 
    1,
    '+1-555-0100',
    'System Administrator for EventHub platform'
);

-- Create Sample Organizer User
DECLARE @OrganizerUserId UNIQUEIDENTIFIER = NEWID();
DECLARE @OrganizerSalt NVARCHAR(255) = CAST(NEWID() AS NVARCHAR(255));
DECLARE @OrganizerPasswordHash NVARCHAR(255) = CONVERT(NVARCHAR(255), HASHBYTES('SHA2_256', 'Organizer123!' + @OrganizerSalt), 2);

INSERT INTO [Users].[Users] (
    [UserId], [Email], [PasswordHash], [Salt], [FirstName], [LastName], 
    [Role], [Status], [EmailVerified], [Phone], [Bio], [Website]
) VALUES (
    @OrganizerUserId, 
    'organizer@eventhub.com', 
    @OrganizerPasswordHash,
    @OrganizerSalt,
    'John', 
    'EventMaster', 
    'Organizer', 
    'Active', 
    1,
    '+1-555-0200',
    'Professional event organizer specializing in technology conferences and workshops.',
    'https://www.johneventmaster.com'
);

-- Create Organizer Profile
DECLARE @OrganizerId UNIQUEIDENTIFIER = NEWID();
INSERT INTO [Users].[Organizers] (
    [OrganizerId], [UserId], [OrganizationName], [OrganizationType], 
    [BusinessLicense], [TaxId], [VerificationStatus], [IsVerified],
    [CommissionRate], [TotalRevenue], [TotalEvents]
) VALUES (
    @OrganizerId,
    @OrganizerUserId,
    'TechEvents Pro', 
    'Company',
    'BL-2025-001234', 
    'TX-987654321',
    'Verified', 
    1,
    10.50, 
    15750.00, 
    12
);

-- Create Sample Regular User
DECLARE @RegularUserId UNIQUEIDENTIFIER = NEWID();
DECLARE @RegularUserSalt NVARCHAR(255) = CAST(NEWID() AS NVARCHAR(255));
DECLARE @RegularUserPasswordHash NVARCHAR(255) = CONVERT(NVARCHAR(255), HASHBYTES('SHA2_256', 'User123!' + @RegularUserSalt), 2);

INSERT INTO [Users].[Users] (
    [UserId], [Email], [PasswordHash], [Salt], [FirstName], [LastName], 
    [Role], [Status], [EmailVerified], [Phone], [Bio]
) VALUES (
    @RegularUserId, 
    'user@eventhub.com', 
    @RegularUserPasswordHash,
    @RegularUserSalt,
    'Sarah', 
    'Johnson', 
    'User', 
    'Active', 
    1,
    '+1-555-0300',
    'Tech enthusiast and frequent event attendee'
);
GO

-- =====================================================
-- Create Sample Events
-- =====================================================

-- Get category IDs for sample events
DECLARE @TechCategoryId UNIQUEIDENTIFIER = (SELECT TOP 1 [CategoryId] FROM [Events].[Categories] WHERE [Name] = 'Technology');
DECLARE @BusinessCategoryId UNIQUEIDENTIFIER = (SELECT TOP 1 [CategoryId] FROM [Events].[Categories] WHERE [Name] = 'Business');
DECLARE @MusicCategoryId UNIQUEIDENTIFIER = (SELECT TOP 1 [CategoryId] FROM [Events].[Categories] WHERE [Name] = 'Music');

-- Get organizer ID
DECLARE @SampleOrganizerId UNIQUEIDENTIFIER = (SELECT TOP 1 [OrganizerId] FROM [Users].[Organizers]);

-- Sample Event 1: Tech Conference
DECLARE @Event1Id UNIQUEIDENTIFIER = NEWID();
INSERT INTO [Events].[Events] (
    [EventId], [OrganizerId], [CategoryId], [Title], [Slug], 
    [Description], [ShortDescription], [Status], [StartDate], [EndDate],
    [VenueName], [VenueAddress], [VenueCity], [VenueState], [VenueCountry], [VenuePostalCode],
    [Capacity], [Price], [Currency], [IsFree], [ContactEmail], [ContactPhone],
    [FeaturedImageUrl], [Tags], [Requirements], [IsFeatured], [PublishedAt]
)
VALUES (
    @Event1Id, @SampleOrganizerId, @TechCategoryId,
    'Tech Innovation Summit 2025', 'tech-innovation-summit-2025',
    'Join industry leaders, entrepreneurs, and tech enthusiasts for the biggest technology conference of 2025. Featuring keynote speakers from major tech companies, interactive workshops, networking sessions, and product demonstrations. Discover the latest trends in AI, blockchain, cloud computing, and emerging technologies.',
    'The premier technology conference featuring industry leaders and emerging tech trends.',
    'Published', '2025-12-15 09:00:00', '2025-12-15 18:00:00',
    'San Francisco Convention Center', '747 Howard St', 'San Francisco', 'CA', 'USA', '94103',
    500, 299.00, 'USD', 0, 'info@techinnovationsummit.com', '+1-555-TECH-001',
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
    '["technology", "AI", "blockchain", "innovation", "networking"]',
    'Laptop recommended for workshops. Business casual attire.',
    1, GETUTCDATE()
);

-- Sample Event 2: Business Networking
DECLARE @Event2Id UNIQUEIDENTIFIER = NEWID();
INSERT INTO [Events].[Events] (
    [EventId], [OrganizerId], [CategoryId], [Title], [Slug], 
    [Description], [ShortDescription], [Status], [StartDate], [EndDate],
    [VenueName], [VenueAddress], [VenueCity], [VenueState], [VenueCountry], [VenuePostalCode],
    [Capacity], [Price], [Currency], [IsFree], [ContactEmail], [ContactPhone],
    [FeaturedImageUrl], [Tags], [Requirements], [PublishedAt]
)
VALUES (
    @Event2Id, @SampleOrganizerId, @BusinessCategoryId,
    'Entrepreneurs Networking Mixer', 'entrepreneurs-networking-mixer',
    'Connect with fellow entrepreneurs, investors, and business professionals in a relaxed evening setting. Share ideas, explore partnerships, and expand your professional network. Light refreshments and cocktails will be served.',
    'Evening networking event for entrepreneurs and business professionals.',
    'Published', '2025-11-30 18:00:00', '2025-11-30 21:00:00',
    'The Business Hub', '123 Business Ave', 'New York', 'NY', 'USA', '10001',
    150, 75.00, 'USD', 0, 'events@businesshub.com', '+1-555-BIZ-002',
    'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800',
    '["networking", "business", "entrepreneurs", "startups"]',
    'Business cards recommended. Business attire preferred.',
    GETUTCDATE()
);

-- Sample Event 3: Free Music Festival
DECLARE @Event3Id UNIQUEIDENTIFIER = NEWID();
INSERT INTO [Events].[Events] (
    [EventId], [OrganizerId], [CategoryId], [Title], [Slug], 
    [Description], [ShortDescription], [Status], [StartDate], [EndDate],
    [VenueName], [VenueAddress], [VenueCity], [VenueState], [VenueCountry], [VenuePostalCode],
    [Capacity], [Price], [Currency], [IsFree], [ContactEmail], [ContactPhone],
    [FeaturedImageUrl], [Tags], [Requirements], [PublishedAt]
)
VALUES (
    @Event3Id, @SampleOrganizerId, @MusicCategoryId,
    'Summer Music Festival 2025', 'summer-music-festival-2025',
    'Free outdoor music festival featuring local and regional artists across multiple genres. Family-friendly event with food trucks, art vendors, and activities for children. Bring your blankets and lawn chairs for a perfect day in the park.',
    'Free outdoor music festival with local artists and family activities.',
    'Published', '2025-07-20 12:00:00', '2025-07-20 22:00:00',
    'Central Park Amphitheater', 'Central Park West', 'New York', 'NY', 'USA', '10024',
    2000, 0.00, 'USD', 1, 'info@summermusicfest.org', '+1-555-MUSIC-003',
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
    '["music", "festival", "free", "family", "outdoor"]',
    'Bring blankets and chairs. No outside food or drinks allowed.',
    GETUTCDATE()
);

-- Sample Event 4: Online Workshop
DECLARE @Event4Id UNIQUEIDENTIFIER = NEWID();
INSERT INTO [Events].[Events] (
    [EventId], [OrganizerId], [CategoryId], [Title], [Slug], 
    [Description], [ShortDescription], [Status], [StartDate], [EndDate],
    [IsOnline], [OnlineMeetingUrl], [Capacity], [Price], [Currency], [IsFree], 
    [ContactEmail], [ContactPhone], [FeaturedImageUrl], [Tags], [Requirements], [PublishedAt]
)
VALUES (
    @Event4Id, @SampleOrganizerId, @TechCategoryId,
    'Web Development Masterclass', 'web-development-masterclass',
    'Comprehensive online workshop covering modern web development techniques including React, Node.js, and MongoDB. Perfect for beginners and intermediate developers looking to enhance their skills. Includes hands-on coding exercises and Q&A sessions.',
    'Online web development workshop for beginners and intermediate developers.',
    'Published', '2025-12-01 14:00:00', '2025-12-01 17:00:00',
    1, 'https://zoom.us/j/meeting-link-here', 100, 49.99, 'USD', 0,
    'workshop@eventhub.com', '+1-555-DEV-004',
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800',
    '["web development", "online", "coding", "react", "nodejs"]',
    'Computer with internet connection required. Basic programming knowledge helpful.',
    GETUTCDATE()
);
GO

-- =====================================================
-- Create Event Tickets for Multi-Tier Events
-- =====================================================

-- Tickets for Tech Innovation Summit
INSERT INTO [Events].[EventTickets] ([EventId], [Name], [Description], [Price], [Quantity], [MaxPerUser], [IsActive], [SortOrder])
SELECT e.[EventId], 'Early Bird', 'Early bird special pricing', 199.00, 100, 5, 1, 1
FROM [Events].[Events] e WHERE e.[Slug] = 'tech-innovation-summit-2025'
UNION ALL
SELECT e.[EventId], 'Regular', 'Standard admission ticket', 299.00, 300, 5, 1, 2
FROM [Events].[Events] e WHERE e.[Slug] = 'tech-innovation-summit-2025'
UNION ALL
SELECT e.[EventId], 'VIP', 'VIP access with premium perks', 499.00, 50, 2, 1, 3
FROM [Events].[Events] e WHERE e.[Slug] = 'tech-innovation-summit-2025';

-- Tickets for Business Networking Mixer
INSERT INTO [Events].[EventTickets] ([EventId], [Name], [Description], [Price], [Quantity], [MaxPerUser], [IsActive], [SortOrder])
SELECT e.[EventId], 'Standard', 'Standard networking access', 75.00, 150, 3, 1, 1
FROM [Events].[Events] e WHERE e.[Slug] = 'entrepreneurs-networking-mixer';

-- No tickets needed for free events (Event 3 and 4 use main event pricing)
GO

-- =====================================================
-- Create Sample Bookings
-- =====================================================

-- Sample Booking 1: Admin booking Early Bird ticket for Tech Summit
INSERT INTO [Events].[Bookings] (
    [BookingId], [EventId], [TicketId], [UserId], [BookingReference],
    [Quantity], [UnitPrice], [TotalPrice], [PlatformFee], [FinalAmount],
    [Currency], [Status], [PaymentStatus], [AttendeeInfo], [QrCode]
)
SELECT 
    NEWID(), 
    e.[EventId], 
    t.[TicketId], 
    u.[UserId], 
    'EH' + FORMAT(ABS(CHECKSUM(NEWID())) % 999999 + 1, '000000'),
    1, 199.00, 199.00, 25.47, 224.47,
    'USD', 'Confirmed', 'Completed', 
    '{"name": "System Administrator", "email": "admin@eventhub.com", "phone": "+1-555-0100"}',
    'QR_' + CAST(NEWID() AS NVARCHAR(36))
FROM [Events].[Events] e
INNER JOIN [Events].[EventTickets] t ON e.[EventId] = t.[EventId] AND t.[Name] = 'Early Bird'
CROSS JOIN [Users].[Users] u
WHERE e.[Slug] = 'tech-innovation-summit-2025' AND u.[Email] = 'admin@eventhub.com';

-- Sample Booking 2: Regular user booking Business event
INSERT INTO [Events].[Bookings] (
    [BookingId], [EventId], [TicketId], [UserId], [BookingReference],
    [Quantity], [UnitPrice], [TotalPrice], [PlatformFee], [FinalAmount],
    [Currency], [Status], [PaymentStatus], [AttendeeInfo], [QrCode]
)
SELECT 
    NEWID(), 
    e.[EventId], 
    t.[TicketId], 
    u.[UserId], 
    'EH' + FORMAT(ABS(CHECKSUM(NEWID())) % 999999 + 1, '000000'),
    1, 75.00, 75.00, 9.60, 84.60,
    'USD', 'Confirmed', 'Completed',
    '{"name": "Sarah Johnson", "email": "user@eventhub.com", "phone": "+1-555-0300"}',
    'QR_' + CAST(NEWID() AS NVARCHAR(36))
FROM [Events].[Events] e
INNER JOIN [Events].[EventTickets] t ON e.[EventId] = t.[EventId] AND t.[Name] = 'Standard'
CROSS JOIN [Users].[Users] u
WHERE e.[Slug] = 'entrepreneurs-networking-mixer' AND u.[Email] = 'user@eventhub.com';

-- Sample Booking 3: Free event booking
INSERT INTO [Events].[Bookings] (
    [BookingId], [EventId], [UserId], [BookingReference],
    [Quantity], [UnitPrice], [TotalPrice], [PlatformFee], [FinalAmount],
    [Currency], [Status], [PaymentStatus], [AttendeeInfo], [QrCode]
)
SELECT 
    NEWID(), 
    e.[EventId], 
    u.[UserId], 
    'EH' + FORMAT(ABS(CHECKSUM(NEWID())) % 999999 + 1, '000000'),
    2, 0.00, 0.00, 0.00, 0.00,
    'USD', 'Confirmed', 'Completed',
    '{"name": "Sarah Johnson", "email": "user@eventhub.com", "phone": "+1-555-0300", "guests": ["John Doe"]}',
    'QR_' + CAST(NEWID() AS NVARCHAR(36))
FROM [Events].[Events] e
CROSS JOIN [Users].[Users] u
WHERE e.[Slug] = 'summer-music-festival-2025' AND u.[Email] = 'user@eventhub.com';
GO

-- =====================================================
-- Create Sample Reviews
-- =====================================================

-- Review for Tech Summit (from regular user)
INSERT INTO [Events].[Reviews] (
    [EventId], [UserId], [BookingId], [Rating], [Title], [Content], [Status], [IsVerifiedPurchase]
)
SELECT 
    e.[EventId], 
    u.[UserId], 
    b.[BookingId], 
    5,
    'Outstanding Tech Conference!',
    'This was an incredible event with amazing speakers and great networking opportunities. The organization was flawless and I learned so much about the latest tech trends. Definitely worth every penny!',
    'Published', 1
FROM [Events].[Events] e
CROSS JOIN [Users].[Users] u
INNER JOIN [Events].[Bookings] b ON b.[EventId] = e.[EventId] AND b.[UserId] = u.[UserId]
WHERE e.[Slug] = 'tech-innovation-summit-2025' AND u.[Email] = 'admin@eventhub.com';

-- Review for Business Event (from regular user)
INSERT INTO [Events].[Reviews] (
    [EventId], [UserId], [BookingId], [Rating], [Title], [Content], [Status], [IsVerifiedPurchase]
)
SELECT 
    e.[EventId], 
    u.[UserId], 
    b.[BookingId], 
    4,
    'Great Networking Opportunity',
    'Well organized networking event with quality attendees. The venue was perfect and refreshments were good. Made several valuable connections. Would attend again!',
    'Published', 1
FROM [Events].[Events] e
CROSS JOIN [Users].[Users] u
INNER JOIN [Events].[Bookings] b ON b.[EventId] = e.[EventId] AND b.[UserId] = u.[UserId]
WHERE e.[Slug] = 'entrepreneurs-networking-mixer' AND u.[Email] = 'user@eventhub.com';
GO

-- =====================================================
-- Create Sample Transactions
-- =====================================================

-- Transaction for Tech Summit booking
INSERT INTO [Payments].[Transactions] (
    [BookingId], [OrganizerId], [UserId], [Type], [Status], 
    [Amount], [Currency], [PlatformFee], [NetAmount],
    [PaymentGateway], [GatewayTransactionId], [Description], [ProcessedAt]
)
SELECT 
    b.[BookingId], 
    o.[OrganizerId], 
    u.[UserId], 
    'Payment', 'Completed',
    224.47, 'USD', 25.47, 199.00,
    'Stripe', 'pi_1234567890abcdef', 'Payment for Tech Innovation Summit 2025', GETUTCDATE()
FROM [Events].[Events] e
INNER JOIN [Events].[Bookings] b ON e.[EventId] = b.[EventId]
INNER JOIN [Users].[Users] u ON b.[UserId] = u.[UserId]
INNER JOIN [Users].[Organizers] o ON e.[OrganizerId] = o.[OrganizerId]
WHERE e.[Slug] = 'tech-innovation-summit-2025' AND u.[Email] = 'admin@eventhub.com';

-- Transaction for Business event booking
INSERT INTO [Payments].[Transactions] (
    [BookingId], [OrganizerId], [UserId], [Type], [Status],
    [Amount], [Currency], [PlatformFee], [NetAmount],
    [PaymentGateway], [GatewayTransactionId], [Description], [ProcessedAt]
)
SELECT 
    b.[BookingId], 
    o.[OrganizerId], 
    u.[UserId], 
    'Payment', 'Completed',
    84.60, 'USD', 9.60, 75.00,
    'PayPal', 'PAYID-ABCD1234', 'Payment for Entrepreneurs Networking Mixer', GETUTCDATE()
FROM [Events].[Events] e
INNER JOIN [Events].[Bookings] b ON e.[EventId] = b.[EventId]
INNER JOIN [Users].[Users] u ON b.[UserId] = u.[UserId]
INNER JOIN [Users].[Organizers] o ON e.[OrganizerId] = o.[OrganizerId]
WHERE e.[Slug] = 'entrepreneurs-networking-mixer' AND u.[Email] = 'user@eventhub.com';
GO

-- =====================================================
-- Create Sample Notifications
-- =====================================================

-- Welcome notification for new user
INSERT INTO [System].[Notifications] (
    [UserId], [Type], [Title], [Message], [Priority], [ActionUrl]
)
SELECT 
    [UserId], 'Welcome', 'Welcome to EventHub!',
    'Thank you for joining EventHub. Discover amazing events in your area and connect with like-minded people.',
    'Normal', '/dashboard'
FROM [Users].[Users] WHERE [Email] = 'user@eventhub.com';

-- Booking confirmation notification
INSERT INTO [System].[Notifications] (
    [UserId], [Type], [Title], [Message], [Priority], [ActionUrl]
)
SELECT 
    [UserId], 'BookingConfirmed', 'Booking Confirmed',
    'Your booking for "Tech Innovation Summit 2025" has been confirmed. Check your email for details.',
    'High', '/bookings'
FROM [Users].[Users] WHERE [Email] = 'user@eventhub.com';

-- Event reminder notification
INSERT INTO [System].[Notifications] (
    [UserId], [Type], [Title], [Message], [Priority], [ActionUrl]
)
SELECT 
    [UserId], 'EventReminder', 'Event Reminder',
    'Your event "Entrepreneurs Networking Mixer" is starting in 24 hours. Make sure everything is ready!',
    'High', '/events/manage'
FROM [Users].[Users] WHERE [Email] = 'admin@eventhub.com';
GO

-- =====================================================
-- Update Event Statistics
-- =====================================================

-- Update booking counts and revenue for events based on sample bookings
UPDATE [Events].[Events] 
SET [BookingCount] = 1, [TotalRevenue] = 224.47, [ViewCount] = 156
WHERE [Slug] = 'tech-innovation-summit-2025';

UPDATE [Events].[Events] 
SET [BookingCount] = 1, [TotalRevenue] = 84.60, [ViewCount] = 89
WHERE [Slug] = 'entrepreneurs-networking-mixer';

UPDATE [Events].[Events] 
SET [BookingCount] = 1, [TotalRevenue] = 0.00, [ViewCount] = 234
WHERE [Slug] = 'summer-music-festival-2025';

-- Update ticket quantities sold
UPDATE [Events].[EventTickets] 
SET [QuantitySold] = 1 
WHERE [EventId] IN (SELECT [EventId] FROM [Events].[Events] WHERE [Slug] = 'tech-innovation-summit-2025')
  AND [Name] = 'Early Bird';

UPDATE [Events].[EventTickets] 
SET [QuantitySold] = 1 
WHERE [EventId] IN (SELECT [EventId] FROM [Events].[Events] WHERE [Slug] = 'entrepreneurs-networking-mixer')
  AND [Name] = 'Standard';
GO

-- =====================================================
-- Final Summary
-- =====================================================

PRINT '=== EventHub Database Data Insertion Complete ===';
PRINT '';
PRINT 'Database: EventHubDB';
PRINT 'Users Created: 3 (Admin, Organizer, Regular User)';
PRINT 'Categories: 10 event categories';
PRINT 'Events: 4 sample events';
PRINT 'Bookings: 3 sample bookings';
PRINT 'Reviews: 2 sample reviews';
PRINT 'Transactions: 2 sample transactions';
PRINT '';
PRINT '=== Login Credentials ===';
PRINT 'Admin: admin@eventhub.com / Admin123!';
PRINT 'Organizer: organizer@eventhub.com / Organizer123!';
PRINT 'User: user@eventhub.com / User123!';
PRINT '';
PRINT '=== Next Steps ===';
PRINT '1. Update SMTP settings in System.Settings';
PRINT '2. Configure payment gateways';
PRINT '3. Update JWT secret key in production';
PRINT '4. Set up file upload directory';
PRINT '5. Configure backup jobs';
PRINT '';
PRINT 'EventHub is ready for development and testing!';
GO