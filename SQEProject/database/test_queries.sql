-- =====================================================
-- EventHub Database Test Queries
-- Run these queries in SSMS to verify your database setup
-- =====================================================

USE EventHubDB;
GO

-- =====================================================
-- 1. VERIFY DATABASE STRUCTURE
-- =====================================================

-- Check if all schemas exist
SELECT SCHEMA_NAME 
FROM INFORMATION_SCHEMA.SCHEMATA 
WHERE SCHEMA_NAME IN ('Users', 'Events', 'Payments', 'Analytics', 'System')
ORDER BY SCHEMA_NAME;

-- Check if all tables exist
SELECT 
    TABLE_SCHEMA,
    TABLE_NAME,
    TABLE_TYPE
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA IN ('Users', 'Events', 'Payments', 'Analytics', 'System')
ORDER BY TABLE_SCHEMA, TABLE_NAME;

-- =====================================================
-- 2. VERIFY SAMPLE DATA
-- =====================================================

-- Check users
SELECT 
    [Email],
    [FirstName],
    [LastName],
    [Role],
    [Status],
    [EmailVerified],
    [CreatedAt]
FROM [Users].[Users]
ORDER BY [Role] DESC;

-- Check event categories
SELECT 
    [Name],
    [Description],
    [Color],
    [SortOrder]
FROM [Events].[Categories]
ORDER BY [SortOrder];

-- Check events with organizer info
SELECT 
    e.[Title],
    e.[Slug],
    e.[Status],
    e.[StartDate],
    e.[Price],
    e.[IsFree],
    c.[Name] as CategoryName,
    u.[FirstName] + ' ' + u.[LastName] as OrganizerName
FROM [Events].[Events] e
INNER JOIN [Events].[Categories] c ON e.[CategoryId] = c.[CategoryId]
INNER JOIN [Users].[Organizers] o ON e.[OrganizerId] = o.[OrganizerId]
INNER JOIN [Users].[Users] u ON o.[UserId] = u.[UserId]
ORDER BY e.[CreatedAt];

-- =====================================================
-- 3. TEST USER AUTHENTICATION
-- =====================================================

-- Test Admin Login (Password: Admin123!)
DECLARE @AdminEmail NVARCHAR(255) = 'admin@eventhub.com';
DECLARE @AdminPassword NVARCHAR(255) = 'Admin123!';

SELECT 
    u.[Email],
    u.[Role],
    u.[Status],
    -- Verify password hash matches
    CASE 
        WHEN u.[PasswordHash] = CONVERT(NVARCHAR(255), HASHBYTES('SHA2_256', @AdminPassword + u.[Salt]), 2)
        THEN 'PASSWORD CORRECT ✓'
        ELSE 'PASSWORD INCORRECT ✗'
    END as PasswordTest
FROM [Users].[Users] u
WHERE u.[Email] = @AdminEmail;

-- Test Organizer Login (Password: Organizer123!)
DECLARE @OrganizerEmail NVARCHAR(255) = 'organizer@eventhub.com';
DECLARE @OrganizerPassword NVARCHAR(255) = 'Organizer123!';

SELECT 
    u.[Email],
    u.[Role],
    u.[Status],
    -- Verify password hash matches
    CASE 
        WHEN u.[PasswordHash] = CONVERT(NVARCHAR(255), HASHBYTES('SHA2_256', @OrganizerPassword + u.[Salt]), 2)
        THEN 'PASSWORD CORRECT ✓'
        ELSE 'PASSWORD INCORRECT ✗'
    END as PasswordTest
FROM [Users].[Users] u
WHERE u.[Email] = @OrganizerEmail;

-- Test Regular User Login (Password: User123!)
DECLARE @UserEmail NVARCHAR(255) = 'user@eventhub.com';
DECLARE @UserPassword NVARCHAR(255) = 'User123!';

SELECT 
    u.[Email],
    u.[Role],
    u.[Status],
    -- Verify password hash matches
    CASE 
        WHEN u.[PasswordHash] = CONVERT(NVARCHAR(255), HASHBYTES('SHA2_256', @UserPassword + u.[Salt]), 2)
        THEN 'PASSWORD CORRECT ✓'
        ELSE 'PASSWORD INCORRECT ✗'
    END as PasswordTest
FROM [Users].[Users] u
WHERE u.[Email] = @UserEmail;

-- =====================================================
-- 4. TEST BOOKINGS AND TRANSACTIONS
-- =====================================================

-- Check bookings with event details
SELECT 
    b.[BookingReference],
    e.[Title] as EventTitle,
    u.[Email] as UserEmail,
    b.[Quantity],
    b.[TotalPrice],
    b.[FinalAmount],
    b.[Status],
    b.[PaymentStatus],
    b.[CreatedAt]
FROM [Events].[Bookings] b
INNER JOIN [Events].[Events] e ON b.[EventId] = e.[EventId]
INNER JOIN [Users].[Users] u ON b.[UserId] = u.[UserId]
ORDER BY b.[CreatedAt];

-- Check transactions
SELECT 
    t.[Type],
    t.[Status],
    t.[Amount],
    t.[PlatformFee],
    t.[NetAmount],
    t.[PaymentGateway],
    t.[Description],
    u.[Email] as UserEmail
FROM [Payments].[Transactions] t
INNER JOIN [Users].[Users] u ON t.[UserId] = u.[UserId]
ORDER BY t.[CreatedAt];

-- =====================================================
-- 5. TEST SYSTEM SETTINGS
-- =====================================================

-- Check system settings
SELECT 
    [Category],
    [Key],
    [Value],
    [DataType],
    [Description],
    [IsPublic]
FROM [System].[Settings]
ORDER BY [Category], [Key];

-- =====================================================
-- 6. TEST RELATIONSHIPS AND FOREIGN KEYS
-- =====================================================

-- Check organizer profile linkage
SELECT 
    u.[Email],
    u.[FirstName] + ' ' + u.[LastName] as FullName,
    o.[OrganizationName],
    o.[IsVerified],
    o.[TotalEvents],
    o.[TotalRevenue]
FROM [Users].[Users] u
INNER JOIN [Users].[Organizers] o ON u.[UserId] = o.[UserId]
WHERE u.[Role] = 'Organizer';

-- Check event tickets
SELECT 
    e.[Title] as EventTitle,
    t.[Name] as TicketName,
    t.[Price],
    t.[Quantity],
    t.[QuantitySold],
    t.[IsActive]
FROM [Events].[Events] e
INNER JOIN [Events].[EventTickets] t ON e.[EventId] = t.[EventId]
ORDER BY e.[Title], t.[SortOrder];

-- Check reviews
SELECT 
    e.[Title] as EventTitle,
    u.[Email] as ReviewerEmail,
    r.[Rating],
    r.[Title] as ReviewTitle,
    r.[Content],
    r.[IsVerifiedPurchase]
FROM [Events].[Reviews] r
INNER JOIN [Events].[Events] e ON r.[EventId] = e.[EventId]
INNER JOIN [Users].[Users] u ON r.[UserId] = u.[UserId]
ORDER BY r.[CreatedAt];

-- =====================================================
-- 7. TEST STORED PROCEDURES
-- =====================================================

-- Test GetEventsByCategory procedure
EXEC [Events].[GetEventsByCategory] @CategoryName = 'Technology';

-- Test GetUserBookings procedure  
EXEC [Events].[GetUserBookings] @UserEmail = 'user@eventhub.com';

-- =====================================================
-- 8. TEST VIEWS
-- =====================================================

-- Test EventSummaryView
SELECT TOP 5 * FROM [Analytics].[EventSummaryView]
ORDER BY [TotalRevenue] DESC;

-- Test UserActivityView
SELECT TOP 5 * FROM [Analytics].[UserActivityView]
ORDER BY [TotalBookings] DESC;

-- =====================================================
-- 9. FINAL VALIDATION
-- =====================================================

PRINT '=== DATABASE VALIDATION RESULTS ===';

-- Count all records
SELECT 'Users' as TableName, COUNT(*) as RecordCount FROM [Users].[Users]
UNION ALL
SELECT 'Organizers', COUNT(*) FROM [Users].[Organizers] 
UNION ALL
SELECT 'Categories', COUNT(*) FROM [Events].[Categories]
UNION ALL
SELECT 'Events', COUNT(*) FROM [Events].[Events]
UNION ALL
SELECT 'EventTickets', COUNT(*) FROM [Events].[EventTickets]
UNION ALL
SELECT 'Bookings', COUNT(*) FROM [Events].[Bookings]
UNION ALL
SELECT 'Reviews', COUNT(*) FROM [Events].[Reviews]
UNION ALL
SELECT 'Transactions', COUNT(*) FROM [Payments].[Transactions]
UNION ALL
SELECT 'Notifications', COUNT(*) FROM [System].[Notifications]
UNION ALL
SELECT 'Settings', COUNT(*) FROM [System].[Settings];

PRINT '';
PRINT 'Database testing complete!';
PRINT 'If all queries executed successfully, your EventHub database is ready!';