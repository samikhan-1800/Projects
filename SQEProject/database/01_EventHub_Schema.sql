-- =====================================================
-- EventHub Database Schema Creation Script
-- Version: 2.0.0
-- Created: November 15, 2025
-- Description: Complete database schema for EventHub event management platform
-- Instructions: Run this file first to create the database structure
-- =====================================================

-- Create Database
USE master;
GO

IF EXISTS (SELECT name FROM sys.databases WHERE name = 'EventHubDB')
BEGIN
    ALTER DATABASE EventHubDB SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE EventHubDB;
END
GO

-- Option 1: Use default SQL Server data directory (recommended)
CREATE DATABASE EventHubDB;

-- Option 2: If you want to specify custom paths, create the directory first
-- and uncomment the lines below, replacing with your actual paths:
/*
CREATE DATABASE EventHubDB
ON (
    NAME = 'EventHubDB_Data',
    FILENAME = 'C:\Program Files\Microsoft SQL Server\MSSQL15.MSSQLSERVER\MSSQL\DATA\EventHubDB.mdf',
    SIZE = 100MB,
    MAXSIZE = 10GB,
    FILEGROWTH = 10MB
)
LOG ON (
    NAME = 'EventHubDB_Log',
    FILENAME = 'C:\Program Files\Microsoft SQL Server\MSSQL15.MSSQLSERVER\MSSQL\DATA\EventHubDB.ldf',
    SIZE = 10MB,
    MAXSIZE = 1GB,
    FILEGROWTH = 10%
);
*/
GO

USE EventHubDB;
GO

-- =====================================================
-- Create Schemas for Organization
-- =====================================================

CREATE SCHEMA [Users];
GO
CREATE SCHEMA [Events];
GO
CREATE SCHEMA [Payments];
GO
CREATE SCHEMA [Analytics];
GO
CREATE SCHEMA [System];
GO

-- =====================================================
-- Create Core Tables
-- =====================================================

-- 1. Users Table (Base table for all user types)
CREATE TABLE [Users].[Users] (
    [UserId] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [Email] NVARCHAR(255) NOT NULL UNIQUE,
    [PasswordHash] NVARCHAR(255) NOT NULL,
    [Salt] NVARCHAR(255) NOT NULL,
    [FirstName] NVARCHAR(100) NOT NULL,
    [LastName] NVARCHAR(100) NOT NULL,
    [Role] NVARCHAR(50) NOT NULL DEFAULT 'User' CHECK ([Role] IN ('User', 'Organizer', 'Admin')),
    [Status] NVARCHAR(50) NOT NULL DEFAULT 'Active' CHECK ([Status] IN ('Active', 'Inactive', 'Suspended', 'Banned', 'Pending')),
    [EmailVerified] BIT NOT NULL DEFAULT 0,
    [Phone] NVARCHAR(20),
    [AvatarUrl] NVARCHAR(500),
    [Bio] NVARCHAR(MAX),
    [Website] NVARCHAR(255),
    [TwoFactorEnabled] BIT NOT NULL DEFAULT 0,
    [EmailVerificationToken] NVARCHAR(255),
    [PasswordResetToken] NVARCHAR(255),
    [PasswordResetExpires] DATETIME2,
    [LastLoginAt] DATETIME2,
    [LoginAttempts] INT NOT NULL DEFAULT 0,
    [LockedUntil] DATETIME2,
    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);
GO

-- Create indexes for Users table
CREATE INDEX [IX_Users_Email] ON [Users].[Users] ([Email]);
CREATE INDEX [IX_Users_Role] ON [Users].[Users] ([Role]);
CREATE INDEX [IX_Users_Status] ON [Users].[Users] ([Status]);
GO

-- 2. User Sessions Table
CREATE TABLE [Users].[UserSessions] (
    [SessionId] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [UserId] UNIQUEIDENTIFIER NOT NULL,
    [RefreshToken] NVARCHAR(500) NOT NULL,
    [DeviceInfo] NVARCHAR(MAX),
    [IpAddress] NVARCHAR(45),
    [UserAgent] NVARCHAR(MAX),
    [IsActive] BIT NOT NULL DEFAULT 1,
    [ExpiresAt] DATETIME2 NOT NULL,
    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    CONSTRAINT [FK_UserSessions_Users] FOREIGN KEY ([UserId]) 
        REFERENCES [Users].[Users]([UserId]) ON DELETE CASCADE
);
GO

CREATE INDEX [IX_UserSessions_UserId] ON [Users].[UserSessions] ([UserId]);
CREATE INDEX [IX_UserSessions_ExpiresAt] ON [Users].[UserSessions] ([ExpiresAt]);
GO

-- 3. Organizers Table (Extends Users)
CREATE TABLE [Users].[Organizers] (
    [OrganizerId] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [UserId] UNIQUEIDENTIFIER NOT NULL UNIQUE,
    [OrganizationName] NVARCHAR(255) NOT NULL,
    [OrganizationType] NVARCHAR(100),
    [BusinessLicense] NVARCHAR(100),
    [TaxId] NVARCHAR(50),
    [VerificationStatus] NVARCHAR(50) NOT NULL DEFAULT 'Pending' 
        CHECK ([VerificationStatus] IN ('Pending', 'UnderReview', 'Verified', 'Rejected')),
    [VerificationDocuments] NVARCHAR(MAX),
    [VerificationNotes] NVARCHAR(MAX),
    [CommissionRate] DECIMAL(5,2) NOT NULL DEFAULT 12.80,
    [TotalRevenue] DECIMAL(15,2) NOT NULL DEFAULT 0,
    [TotalEvents] INT NOT NULL DEFAULT 0,
    [AverageRating] DECIMAL(3,2) DEFAULT NULL,
    [ReviewCount] INT NOT NULL DEFAULT 0,
    [IsVerified] BIT NOT NULL DEFAULT 0,
    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    CONSTRAINT [FK_Organizers_Users] FOREIGN KEY ([UserId]) 
        REFERENCES [Users].[Users]([UserId]) ON DELETE CASCADE
);
GO

CREATE INDEX [IX_Organizers_UserId] ON [Users].[Organizers] ([UserId]);
CREATE INDEX [IX_Organizers_VerificationStatus] ON [Users].[Organizers] ([VerificationStatus]);
GO

-- 4. Categories Table
CREATE TABLE [Events].[Categories] (
    [CategoryId] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [Name] NVARCHAR(100) NOT NULL UNIQUE,
    [Description] NVARCHAR(500),
    [IconClass] NVARCHAR(100),
    [Color] NVARCHAR(7),
    [IsActive] BIT NOT NULL DEFAULT 1,
    [SortOrder] INT NOT NULL DEFAULT 0,
    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);
GO

CREATE INDEX [IX_Categories_Name] ON [Events].[Categories] ([Name]);
CREATE INDEX [IX_Categories_IsActive] ON [Events].[Categories] ([IsActive]);
GO

-- 5. Events Table
CREATE TABLE [Events].[Events] (
    [EventId] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [OrganizerId] UNIQUEIDENTIFIER NOT NULL,
    [CategoryId] UNIQUEIDENTIFIER NOT NULL,
    [Title] NVARCHAR(255) NOT NULL,
    [Slug] NVARCHAR(255) NOT NULL UNIQUE,
    [Description] NVARCHAR(MAX),
    [ShortDescription] NVARCHAR(500),
    [Status] NVARCHAR(50) NOT NULL DEFAULT 'Draft' 
        CHECK ([Status] IN ('Draft', 'Pending', 'Approved', 'Published', 'Cancelled', 'Completed', 'Rejected')),
    
    -- Date/Time fields
    [StartDate] DATETIME2 NOT NULL,
    [EndDate] DATETIME2,
    [Timezone] NVARCHAR(50) NOT NULL DEFAULT 'UTC',
    [RegistrationStartDate] DATETIME2,
    [RegistrationEndDate] DATETIME2,
    
    -- Location fields
    [IsOnline] BIT NOT NULL DEFAULT 0,
    [VenueName] NVARCHAR(255),
    [VenueAddress] NVARCHAR(MAX),
    [VenueCity] NVARCHAR(100),
    [VenueState] NVARCHAR(100),
    [VenueCountry] NVARCHAR(100),
    [VenuePostalCode] NVARCHAR(20),
    [OnlineMeetingUrl] NVARCHAR(500),
    
    -- Pricing and capacity
    [Capacity] INT,
    [Price] DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    [Currency] NVARCHAR(3) NOT NULL DEFAULT 'USD',
    [IsFree] BIT NOT NULL DEFAULT 0,
    [AllowWaitlist] BIT NOT NULL DEFAULT 1,
    [MaxTicketsPerUser] INT DEFAULT 10,
    
    -- Media
    [FeaturedImageUrl] NVARCHAR(500),
    [GalleryImages] NVARCHAR(MAX),
    [VideoUrl] NVARCHAR(500),
    
    -- Additional info
    [Tags] NVARCHAR(MAX),
    [Requirements] NVARCHAR(MAX),
    [ContactEmail] NVARCHAR(255),
    [ContactPhone] NVARCHAR(20),
    
    -- Stats
    [ViewCount] INT NOT NULL DEFAULT 0,
    [BookingCount] INT NOT NULL DEFAULT 0,
    [TotalRevenue] DECIMAL(15,2) NOT NULL DEFAULT 0,
    [AverageRating] DECIMAL(3,2) DEFAULT NULL,
    [ReviewCount] INT NOT NULL DEFAULT 0,
    
    -- Features
    [IsFeatured] BIT NOT NULL DEFAULT 0,
    [IsPrivate] BIT NOT NULL DEFAULT 0,
    [RequiresApproval] BIT NOT NULL DEFAULT 0,
    
    -- Admin fields
    [ApprovedBy] UNIQUEIDENTIFIER,
    [ApprovedAt] DATETIME2,
    
    -- Timestamps
    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    [PublishedAt] DATETIME2,
    
    CONSTRAINT [FK_Events_Organizers] FOREIGN KEY ([OrganizerId]) 
        REFERENCES [Users].[Organizers]([OrganizerId]) ON DELETE CASCADE,
    CONSTRAINT [FK_Events_Categories] FOREIGN KEY ([CategoryId]) 
        REFERENCES [Events].[Categories]([CategoryId]),
    CONSTRAINT [FK_Events_ApprovedBy] FOREIGN KEY ([ApprovedBy]) 
        REFERENCES [Users].[Users]([UserId])
);
GO

CREATE INDEX [IX_Events_OrganizerId] ON [Events].[Events] ([OrganizerId]);
CREATE INDEX [IX_Events_CategoryId] ON [Events].[Events] ([CategoryId]);
CREATE INDEX [IX_Events_Status] ON [Events].[Events] ([Status]);
CREATE INDEX [IX_Events_StartDate] ON [Events].[Events] ([StartDate]);
CREATE INDEX [IX_Events_IsFeatured] ON [Events].[Events] ([IsFeatured]);
GO

-- 6. Event Tickets Table
CREATE TABLE [Events].[EventTickets] (
    [TicketId] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [EventId] UNIQUEIDENTIFIER NOT NULL,
    [Name] NVARCHAR(100) NOT NULL,
    [Description] NVARCHAR(500),
    [Price] DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    [Quantity] INT NOT NULL,
    [QuantitySold] INT NOT NULL DEFAULT 0,
    [MaxPerUser] INT DEFAULT 10,
    [SaleStartDate] DATETIME2,
    [SaleEndDate] DATETIME2,
    [IsActive] BIT NOT NULL DEFAULT 1,
    [SortOrder] INT NOT NULL DEFAULT 0,
    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    CONSTRAINT [FK_EventTickets_Events] FOREIGN KEY ([EventId]) 
        REFERENCES [Events].[Events]([EventId]) ON DELETE CASCADE
);
GO

CREATE INDEX [IX_EventTickets_EventId] ON [Events].[EventTickets] ([EventId]);
CREATE INDEX [IX_EventTickets_IsActive] ON [Events].[EventTickets] ([IsActive]);
GO

-- 7. Bookings Table
CREATE TABLE [Events].[Bookings] (
    [BookingId] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [EventId] UNIQUEIDENTIFIER NOT NULL,
    [TicketId] UNIQUEIDENTIFIER,
    [UserId] UNIQUEIDENTIFIER,
    [BookingReference] NVARCHAR(20) NOT NULL UNIQUE,
    
    -- Booking details
    [Quantity] INT NOT NULL DEFAULT 1,
    [UnitPrice] DECIMAL(10,2) NOT NULL,
    [TotalPrice] DECIMAL(10,2) NOT NULL,
    [PlatformFee] DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    [TaxAmount] DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    [DiscountAmount] DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    [FinalAmount] DECIMAL(10,2) NOT NULL,
    [Currency] NVARCHAR(3) NOT NULL DEFAULT 'USD',
    
    -- Status
    [Status] NVARCHAR(50) NOT NULL DEFAULT 'Pending' 
        CHECK ([Status] IN ('Pending', 'Confirmed', 'Cancelled', 'Refunded', 'CheckedIn', 'NoShow')),
    [PaymentStatus] NVARCHAR(50) NOT NULL DEFAULT 'Pending' 
        CHECK ([PaymentStatus] IN ('Pending', 'Processing', 'Completed', 'Failed', 'Refunded')),
    
    -- Attendee information
    [AttendeeInfo] NVARCHAR(MAX) NOT NULL,
    [SpecialRequests] NVARCHAR(MAX),
    [PromoCode] NVARCHAR(50),
    
    -- Check-in
    [QrCode] NVARCHAR(255) UNIQUE,
    [CheckedInAt] DATETIME2,
    [CheckedInBy] UNIQUEIDENTIFIER,
    
    -- Payment details
    [PaymentIntentId] NVARCHAR(255),
    [PaymentMethod] NVARCHAR(50),
    [PaymentGateway] NVARCHAR(50),
    
    -- Timestamps
    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    [ExpiresAt] DATETIME2,
    
    CONSTRAINT [FK_Bookings_Events] FOREIGN KEY ([EventId]) 
        REFERENCES [Events].[Events]([EventId]) ON DELETE CASCADE,
    CONSTRAINT [FK_Bookings_Tickets] FOREIGN KEY ([TicketId]) 
        REFERENCES [Events].[EventTickets]([TicketId]),
    CONSTRAINT [FK_Bookings_Users] FOREIGN KEY ([UserId]) 
        REFERENCES [Users].[Users]([UserId]),
    CONSTRAINT [FK_Bookings_CheckedInBy] FOREIGN KEY ([CheckedInBy]) 
        REFERENCES [Users].[Users]([UserId])
);
GO

CREATE INDEX [IX_Bookings_EventId] ON [Events].[Bookings] ([EventId]);
CREATE INDEX [IX_Bookings_UserId] ON [Events].[Bookings] ([UserId]);
CREATE INDEX [IX_Bookings_Status] ON [Events].[Bookings] ([Status]);
CREATE INDEX [IX_Bookings_QrCode] ON [Events].[Bookings] ([QrCode]);
GO

-- 8. Reviews Table
CREATE TABLE [Events].[Reviews] (
    [ReviewId] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [EventId] UNIQUEIDENTIFIER NOT NULL,
    [UserId] UNIQUEIDENTIFIER,
    [BookingId] UNIQUEIDENTIFIER,
    [Rating] INT NOT NULL CHECK ([Rating] >= 1 AND [Rating] <= 5),
    [Title] NVARCHAR(255),
    [Content] NVARCHAR(MAX),
    [HelpfulCount] INT NOT NULL DEFAULT 0,
    [Status] NVARCHAR(50) NOT NULL DEFAULT 'Published' 
        CHECK ([Status] IN ('Published', 'Hidden', 'Flagged', 'Pending')),
    [IsVerifiedPurchase] BIT NOT NULL DEFAULT 0,
    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    CONSTRAINT [FK_Reviews_Events] FOREIGN KEY ([EventId]) 
        REFERENCES [Events].[Events]([EventId]) ON DELETE CASCADE,
    CONSTRAINT [FK_Reviews_Users] FOREIGN KEY ([UserId]) 
        REFERENCES [Users].[Users]([UserId]),
    CONSTRAINT [FK_Reviews_Bookings] FOREIGN KEY ([BookingId]) 
        REFERENCES [Events].[Bookings]([BookingId])
);
GO

CREATE INDEX [IX_Reviews_EventId] ON [Events].[Reviews] ([EventId]);
CREATE INDEX [IX_Reviews_UserId] ON [Events].[Reviews] ([UserId]);
CREATE INDEX [IX_Reviews_Rating] ON [Events].[Reviews] ([Rating]);
GO

-- 9. Transactions Table
CREATE TABLE [Payments].[Transactions] (
    [TransactionId] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [BookingId] UNIQUEIDENTIFIER,
    [OrganizerId] UNIQUEIDENTIFIER,
    [UserId] UNIQUEIDENTIFIER,
    [Type] NVARCHAR(50) NOT NULL CHECK ([Type] IN ('Payment', 'Refund', 'Payout', 'Fee')),
    [Status] NVARCHAR(50) NOT NULL DEFAULT 'Pending' 
        CHECK ([Status] IN ('Pending', 'Processing', 'Completed', 'Failed', 'Cancelled')),
    [Amount] DECIMAL(15,2) NOT NULL,
    [Currency] NVARCHAR(3) NOT NULL DEFAULT 'USD',
    [PlatformFee] DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    [NetAmount] DECIMAL(15,2) NOT NULL,
    
    -- Payment gateway info
    [PaymentGateway] NVARCHAR(50),
    [GatewayTransactionId] NVARCHAR(255),
    [GatewayResponse] NVARCHAR(MAX),
    
    -- Additional info
    [Description] NVARCHAR(500),
    [FailureReason] NVARCHAR(500),
    
    -- Timestamps
    [ProcessedAt] DATETIME2,
    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    CONSTRAINT [FK_Transactions_Bookings] FOREIGN KEY ([BookingId]) 
        REFERENCES [Events].[Bookings]([BookingId]),
    CONSTRAINT [FK_Transactions_Organizers] FOREIGN KEY ([OrganizerId]) 
        REFERENCES [Users].[Organizers]([OrganizerId]),
    CONSTRAINT [FK_Transactions_Users] FOREIGN KEY ([UserId]) 
        REFERENCES [Users].[Users]([UserId])
);
GO

CREATE INDEX [IX_Transactions_BookingId] ON [Payments].[Transactions] ([BookingId]);
CREATE INDEX [IX_Transactions_Type] ON [Payments].[Transactions] ([Type]);
CREATE INDEX [IX_Transactions_Status] ON [Payments].[Transactions] ([Status]);
GO

-- 10. Notifications Table
CREATE TABLE [System].[Notifications] (
    [NotificationId] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [UserId] UNIQUEIDENTIFIER NOT NULL,
    [Type] NVARCHAR(100) NOT NULL,
    [Title] NVARCHAR(255) NOT NULL,
    [Message] NVARCHAR(MAX) NOT NULL,
    [Data] NVARCHAR(MAX),
    [IsRead] BIT NOT NULL DEFAULT 0,
    [EmailSent] BIT NOT NULL DEFAULT 0,
    [Priority] NVARCHAR(20) NOT NULL DEFAULT 'Normal' 
        CHECK ([Priority] IN ('Low', 'Normal', 'High', 'Urgent')),
    [ExpiresAt] DATETIME2,
    [ActionUrl] NVARCHAR(500),
    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    CONSTRAINT [FK_Notifications_Users] FOREIGN KEY ([UserId]) 
        REFERENCES [Users].[Users]([UserId]) ON DELETE CASCADE
);
GO

CREATE INDEX [IX_Notifications_UserId] ON [System].[Notifications] ([UserId]);
CREATE INDEX [IX_Notifications_Type] ON [System].[Notifications] ([Type]);
CREATE INDEX [IX_Notifications_IsRead] ON [System].[Notifications] ([IsRead]);
GO

-- 11. Settings Table
CREATE TABLE [System].[Settings] (
    [SettingId] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [Category] NVARCHAR(50) NOT NULL,
    [Key] NVARCHAR(100) NOT NULL,
    [Value] NVARCHAR(MAX),
    [DataType] NVARCHAR(20) NOT NULL DEFAULT 'String' 
        CHECK ([DataType] IN ('String', 'Number', 'Boolean', 'JSON')),
    [Description] NVARCHAR(500),
    [IsPublic] BIT NOT NULL DEFAULT 0,
    [UpdatedBy] UNIQUEIDENTIFIER,
    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    CONSTRAINT [FK_Settings_Users] FOREIGN KEY ([UpdatedBy]) 
        REFERENCES [Users].[Users]([UserId]),
    CONSTRAINT [UC_Settings_Category_Key] UNIQUE ([Category], [Key])
);
GO

CREATE INDEX [IX_Settings_Category] ON [System].[Settings] ([Category]);
GO

-- 12. Audit Log Table
CREATE TABLE [System].[AuditLog] (
    [LogId] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [UserId] UNIQUEIDENTIFIER,
    [Action] NVARCHAR(100) NOT NULL,
    [TableName] NVARCHAR(100),
    [RecordId] UNIQUEIDENTIFIER,
    [OldValues] NVARCHAR(MAX),
    [NewValues] NVARCHAR(MAX),
    [IpAddress] NVARCHAR(45),
    [UserAgent] NVARCHAR(MAX),
    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    CONSTRAINT [FK_AuditLog_Users] FOREIGN KEY ([UserId]) 
        REFERENCES [Users].[Users]([UserId])
);
GO

CREATE INDEX [IX_AuditLog_UserId] ON [System].[AuditLog] ([UserId]);
CREATE INDEX [IX_AuditLog_Action] ON [System].[AuditLog] ([Action]);
CREATE INDEX [IX_AuditLog_CreatedAt] ON [System].[AuditLog] ([CreatedAt]);
GO

-- =====================================================
-- Create Views for Reporting
-- =====================================================

-- Event Summary View
CREATE VIEW [Analytics].[EventSummaryView] AS
SELECT 
    e.[EventId],
    e.[Title],
    e.[Status],
    e.[StartDate],
    e.[EndDate],
    e.[Price],
    e.[Capacity],
    c.[Name] AS CategoryName,
    o.[OrganizationName],
    u.[FirstName] + ' ' + u.[LastName] AS OrganizerName,
    e.[BookingCount],
    e.[TotalRevenue],
    e.[ViewCount],
    e.[AverageRating],
    e.[ReviewCount],
    e.[CreatedAt],
    e.[PublishedAt]
FROM [Events].[Events] e
INNER JOIN [Events].[Categories] c ON e.[CategoryId] = c.[CategoryId]
INNER JOIN [Users].[Organizers] o ON e.[OrganizerId] = o.[OrganizerId]
INNER JOIN [Users].[Users] u ON o.[UserId] = u.[UserId];
GO

-- Booking Summary View
CREATE VIEW [Analytics].[BookingSummaryView] AS
SELECT 
    b.[BookingId],
    b.[BookingReference],
    b.[Status],
    b.[PaymentStatus],
    b.[Quantity],
    b.[FinalAmount],
    b.[Currency],
    b.[CreatedAt],
    e.[Title] AS EventTitle,
    e.[StartDate] AS EventStartDate,
    u.[FirstName] + ' ' + u.[LastName] AS CustomerName,
    u.[Email] AS CustomerEmail
FROM [Events].[Bookings] b
INNER JOIN [Events].[Events] e ON b.[EventId] = e.[EventId]
LEFT JOIN [Users].[Users] u ON b.[UserId] = u.[UserId];
GO

-- =====================================================
-- Create Stored Procedures
-- =====================================================

-- Procedure to create a booking
CREATE PROCEDURE [Events].[CreateBooking]
    @EventId UNIQUEIDENTIFIER,
    @TicketId UNIQUEIDENTIFIER = NULL,
    @UserId UNIQUEIDENTIFIER = NULL,
    @Quantity INT,
    @AttendeeInfo NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        DECLARE @BookingId UNIQUEIDENTIFIER = NEWID();
        DECLARE @BookingReference NVARCHAR(20);
        DECLARE @UnitPrice DECIMAL(10,2);
        DECLARE @TotalPrice DECIMAL(10,2);
        DECLARE @PlatformFee DECIMAL(10,2);
        DECLARE @FinalAmount DECIMAL(10,2);
        DECLARE @QrCode NVARCHAR(255);
        DECLARE @RandomNum INT = ABS(CHECKSUM(NEWID())) % 999999 + 1;
        
        -- Generate booking reference
        SET @BookingReference = 'EH' + FORMAT(@RandomNum, '000000');
        
        -- Get event price
        IF @TicketId IS NOT NULL
        BEGIN
            SELECT @UnitPrice = [Price] FROM [Events].[EventTickets] WHERE [TicketId] = @TicketId;
        END
        ELSE
        BEGIN
            SELECT @UnitPrice = [Price] FROM [Events].[Events] WHERE [EventId] = @EventId;
        END
        
        SET @TotalPrice = @UnitPrice * @Quantity;
        SET @PlatformFee = @TotalPrice * 0.128; -- 12.8% platform fee
        SET @FinalAmount = @TotalPrice + @PlatformFee;
        
        -- Generate QR code
        SET @QrCode = 'QR_' + CAST(@BookingId AS NVARCHAR(36));
        
        -- Insert booking
        INSERT INTO [Events].[Bookings] (
            [BookingId], [EventId], [TicketId], [UserId], [BookingReference],
            [Quantity], [UnitPrice], [TotalPrice], [PlatformFee], 
            [FinalAmount], [AttendeeInfo], [QrCode]
        )
        VALUES (
            @BookingId, @EventId, @TicketId, @UserId, @BookingReference,
            @Quantity, @UnitPrice, @TotalPrice, @PlatformFee, 
            @FinalAmount, @AttendeeInfo, @QrCode
        );
        
        -- Update event booking count
        UPDATE [Events].[Events] 
        SET [BookingCount] = [BookingCount] + @Quantity,
            [TotalRevenue] = [TotalRevenue] + @FinalAmount
        WHERE [EventId] = @EventId;
        
        -- Update ticket quantity sold
        IF @TicketId IS NOT NULL
        BEGIN
            UPDATE [Events].[EventTickets]
            SET [QuantitySold] = [QuantitySold] + @Quantity
            WHERE [TicketId] = @TicketId;
        END
        
        COMMIT TRANSACTION;
        
        SELECT @BookingId AS BookingId, @BookingReference AS BookingReference;
        
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- Procedure to check-in attendee
CREATE PROCEDURE [Events].[CheckInAttendee]
    @QrCode NVARCHAR(255),
    @CheckedInBy UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @BookingId UNIQUEIDENTIFIER;
    
    -- Find booking by QR code
    SELECT @BookingId = [BookingId]
    FROM [Events].[Bookings]
    WHERE [QrCode] = @QrCode AND [Status] = 'Confirmed';
    
    IF @BookingId IS NULL
    BEGIN
        THROW 50001, 'Invalid QR code or booking not confirmed', 1;
        RETURN;
    END
    
    -- Check if already checked in
    IF EXISTS (SELECT 1 FROM [Events].[Bookings] WHERE [BookingId] = @BookingId AND [CheckedInAt] IS NOT NULL)
    BEGIN
        THROW 50002, 'Attendee already checked in', 1;
        RETURN;
    END
    
    -- Update booking status
    UPDATE [Events].[Bookings]
    SET [Status] = 'CheckedIn',
        [CheckedInAt] = GETUTCDATE(),
        [CheckedInBy] = @CheckedInBy,
        [UpdatedAt] = GETUTCDATE()
    WHERE [BookingId] = @BookingId;
    
    SELECT 'Check-in successful' AS Message, @BookingId AS BookingId;
END;
GO

-- =====================================================
-- Create Database Roles and Security
-- =====================================================

-- Create application roles for three user types
CREATE ROLE [EventHub_User];
CREATE ROLE [EventHub_Organizer];  
CREATE ROLE [EventHub_Admin];
GO

-- User role permissions (basic access)
GRANT SELECT ON [Events].[Events] TO [EventHub_User];
GRANT SELECT ON [Events].[Categories] TO [EventHub_User];
GRANT SELECT ON [Events].[EventTickets] TO [EventHub_User];
GRANT SELECT, INSERT, UPDATE ON [Events].[Bookings] TO [EventHub_User];
GRANT SELECT, INSERT ON [Events].[Reviews] TO [EventHub_User];
GRANT SELECT ON [Users].[Users] TO [EventHub_User];
GRANT EXECUTE ON [Events].[CreateBooking] TO [EventHub_User];
GO

-- Organizer role permissions (inherits User + can manage events)
ALTER ROLE [EventHub_Organizer] ADD MEMBER [EventHub_User];
GRANT SELECT, INSERT, UPDATE ON [Events].[Events] TO [EventHub_Organizer];
GRANT SELECT, INSERT, UPDATE ON [Events].[EventTickets] TO [EventHub_Organizer];
GRANT SELECT ON [Analytics].[EventSummaryView] TO [EventHub_Organizer];
GRANT SELECT ON [Analytics].[BookingSummaryView] TO [EventHub_Organizer];
GRANT EXECUTE ON [Events].[CheckInAttendee] TO [EventHub_Organizer];
GO

-- Admin role permissions (full access)
ALTER ROLE [EventHub_Admin] ADD MEMBER [EventHub_Organizer];
GRANT SELECT, INSERT, UPDATE, DELETE ON SCHEMA::[Users] TO [EventHub_Admin];
GRANT SELECT, INSERT, UPDATE, DELETE ON SCHEMA::[Events] TO [EventHub_Admin];
GRANT SELECT, INSERT, UPDATE, DELETE ON SCHEMA::[Payments] TO [EventHub_Admin];
GRANT SELECT, INSERT, UPDATE, DELETE ON SCHEMA::[System] TO [EventHub_Admin];
GRANT SELECT ON SCHEMA::[Analytics] TO [EventHub_Admin];
GO

-- =====================================================
-- Create Triggers for Automatic Updates
-- =====================================================

-- Update trigger for Users to set UpdatedAt
CREATE TRIGGER [Users].[TR_Users_UpdatedAt]
ON [Users].[Users]
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE [Users].[Users]
    SET [UpdatedAt] = GETUTCDATE()
    FROM [Users].[Users] u
    INNER JOIN inserted i ON u.[UserId] = i.[UserId];
END;
GO

-- Update trigger for Events to set UpdatedAt
CREATE TRIGGER [Events].[TR_Events_UpdatedAt]
ON [Events].[Events]
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE [Events].[Events]
    SET [UpdatedAt] = GETUTCDATE()
    FROM [Events].[Events] e
    INNER JOIN inserted i ON e.[EventId] = i.[EventId];
END;
GO

PRINT 'EventHub Database Schema Created Successfully!';
PRINT 'Database Name: EventHubDB';
PRINT 'Next Step: Run 02_EventHub_Data.sql to insert initial data';
GO