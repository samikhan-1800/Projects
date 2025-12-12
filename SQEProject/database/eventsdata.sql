-- =====================================================
-- EventHub Database Schema for Microsoft SQL Server
-- Version: 2.0.0
-- Created: November 15, 2025
-- Description: Complete database schema for EventHub event management platform
-- =====================================================

-- Create Database
USE master;
GO

IF EXISTS (SELECT name FROM sys.databases WHERE name = 'eventsdata')
BEGIN
    ALTER DATABASE eventsdata SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE eventsdata;
END
GO

CREATE DATABASE eventsdata
ON (
    NAME = 'eventsdata_Data',
    FILENAME = 'C:\Database\eventsdata.mdf',
    SIZE = 100MB,
    MAXSIZE = 10GB,
    FILEGROWTH = 10MB
)
LOG ON (
    NAME = 'eventsdata_Log',
    FILENAME = 'C:\Database\eventsdata.ldf',
    SIZE = 10MB,
    MAXSIZE = 1GB,
    FILEGROWTH = 10%
);
GO

USE eventsdata;
GO

-- =====================================================
-- Create Custom Data Types and Schemas
-- =====================================================

-- Create schemas
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
-- Create Tables
-- =====================================================

-- Users table
CREATE TABLE [Users].[Users] (
    [UserId] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [Email] NVARCHAR(255) NOT NULL UNIQUE,
    [PasswordHash] NVARCHAR(255) NOT NULL,
    [Salt] NVARCHAR(255) NOT NULL,
    [FirstName] NVARCHAR(100) NOT NULL,
    [LastName] NVARCHAR(100) NOT NULL,
    [Role] NVARCHAR(50) NOT NULL DEFAULT 'User' CHECK ([Role] IN ('User', 'Organizer', 'Admin', 'SuperAdmin')),
    [Status] NVARCHAR(50) NOT NULL DEFAULT 'Pending' CHECK ([Status] IN ('Active', 'Inactive', 'Suspended', 'Banned', 'Pending')),
    [EmailVerified] BIT NOT NULL DEFAULT 0,
    [Phone] NVARCHAR(20),
    [AvatarUrl] NVARCHAR(500),
    [Bio] NVARCHAR(MAX),
    [Website] NVARCHAR(255),
    [SocialLinks] NVARCHAR(MAX), -- JSON string
    [Preferences] NVARCHAR(MAX), -- JSON string
    [TwoFactorEnabled] BIT NOT NULL DEFAULT 0,
    [TwoFactorSecret] NVARCHAR(255),
    [EmailVerificationToken] NVARCHAR(255),
    [PasswordResetToken] NVARCHAR(255),
    [PasswordResetExpires] DATETIME2,
    [LastLoginAt] DATETIME2,
    [LoginAttempts] INT NOT NULL DEFAULT 0,
    [LockedUntil] DATETIME2,
    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    -- Indexes
    INDEX [IX_Users_Email] ([Email]),
    INDEX [IX_Users_Role] ([Role]),
    INDEX [IX_Users_Status] ([Status]),
    INDEX [IX_Users_CreatedAt] ([CreatedAt])
);
GO

-- User Sessions table
CREATE TABLE [Users].[UserSessions] (
    [SessionId] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [UserId] UNIQUEIDENTIFIER NOT NULL,
    [RefreshToken] NVARCHAR(500) NOT NULL,
    [DeviceInfo] NVARCHAR(MAX), -- JSON string
    [IpAddress] NVARCHAR(45),
    [UserAgent] NVARCHAR(MAX),
    [IsActive] BIT NOT NULL DEFAULT 1,
    [ExpiresAt] DATETIME2 NOT NULL,
    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    FOREIGN KEY ([UserId]) REFERENCES [Users].[Users]([UserId]) ON DELETE CASCADE,
    INDEX [IX_UserSessions_UserId] ([UserId]),
    INDEX [IX_UserSessions_RefreshToken] ([RefreshToken]),
    INDEX [IX_UserSessions_ExpiresAt] ([ExpiresAt])
);
GO

-- Organizers table (extends users)
CREATE TABLE [Users].[Organizers] (
    [OrganizerId] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [UserId] UNIQUEIDENTIFIER NOT NULL UNIQUE,
    [OrganizationName] NVARCHAR(255) NOT NULL,
    [OrganizationType] NVARCHAR(100),
    [BusinessLicense] NVARCHAR(100),
    [TaxId] NVARCHAR(50),
    [VerificationStatus] NVARCHAR(50) NOT NULL DEFAULT 'Pending' CHECK ([VerificationStatus] IN ('Pending', 'UnderReview', 'Verified', 'Rejected')),
    [VerificationDocuments] NVARCHAR(MAX), -- JSON string
    [VerificationNotes] NVARCHAR(MAX),
    [CommissionRate] DECIMAL(5,2) NOT NULL DEFAULT 12.80,
    [PayoutSettings] NVARCHAR(MAX), -- JSON string
    [TotalRevenue] DECIMAL(15,2) NOT NULL DEFAULT 0,
    [TotalEvents] INT NOT NULL DEFAULT 0,
    [AverageRating] DECIMAL(3,2) DEFAULT NULL,
    [ReviewCount] INT NOT NULL DEFAULT 0,
    [IsVerified] BIT NOT NULL DEFAULT 0,
    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    FOREIGN KEY ([UserId]) REFERENCES [Users].[Users]([UserId]) ON DELETE CASCADE,
    INDEX [IX_Organizers_UserId] ([UserId]),
    INDEX [IX_Organizers_VerificationStatus] ([VerificationStatus]),
    INDEX [IX_Organizers_IsVerified] ([IsVerified])
);
GO

-- Categories table
CREATE TABLE [Events].[Categories] (
    [CategoryId] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [Name] NVARCHAR(100) NOT NULL UNIQUE,
    [Description] NVARCHAR(500),
    [IconClass] NVARCHAR(100), -- Font Awesome class
    [Color] NVARCHAR(7), -- Hex color code
    [IsActive] BIT NOT NULL DEFAULT 1,
    [SortOrder] INT NOT NULL DEFAULT 0,
    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    INDEX [IX_Categories_Name] ([Name]),
    INDEX [IX_Categories_IsActive] ([IsActive])
);
GO

-- Events table
CREATE TABLE [Events].[Events] (
    [EventId] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [OrganizerId] UNIQUEIDENTIFIER NOT NULL,
    [CategoryId] UNIQUEIDENTIFIER NOT NULL,
    [Title] NVARCHAR(255) NOT NULL,
    [Slug] NVARCHAR(255) NOT NULL UNIQUE,
    [Description] NVARCHAR(MAX),
    [ShortDescription] NVARCHAR(500),
    [Status] NVARCHAR(50) NOT NULL DEFAULT 'Draft' CHECK ([Status] IN ('Draft', 'Pending', 'Approved', 'Published', 'Cancelled', 'Completed', 'Rejected')),
    
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
    [Latitude] DECIMAL(10, 8),
    [Longitude] DECIMAL(11, 8),
    [OnlineMeetingUrl] NVARCHAR(500),
    [OnlineMeetingPassword] NVARCHAR(100),
    
    -- Capacity and pricing
    [Capacity] INT,
    [Price] DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    [Currency] NVARCHAR(3) NOT NULL DEFAULT 'USD',
    [IsFree] BIT NOT NULL DEFAULT 0,
    [AllowWaitlist] BIT NOT NULL DEFAULT 1,
    [MaxTicketsPerUser] INT DEFAULT 10,
    
    -- Media
    [FeaturedImageUrl] NVARCHAR(500),
    [GalleryImages] NVARCHAR(MAX), -- JSON array of image URLs
    [VideoUrl] NVARCHAR(500),
    
    -- Additional info
    [Tags] NVARCHAR(MAX), -- JSON array of tags
    [Requirements] NVARCHAR(MAX),
    [CancellationPolicy] NVARCHAR(MAX),
    [RefundPolicy] NVARCHAR(MAX),
    [ContactEmail] NVARCHAR(255),
    [ContactPhone] NVARCHAR(20),
    [ExternalUrl] NVARCHAR(500),
    
    -- SEO
    [MetaTitle] NVARCHAR(255),
    [MetaDescription] NVARCHAR(500),
    [MetaKeywords] NVARCHAR(500),
    
    -- Stats
    [ViewCount] INT NOT NULL DEFAULT 0,
    [BookingCount] INT NOT NULL DEFAULT 0,
    [WaitlistCount] INT NOT NULL DEFAULT 0,
    [TotalRevenue] DECIMAL(15,2) NOT NULL DEFAULT 0,
    [AverageRating] DECIMAL(3,2) DEFAULT NULL,
    [ReviewCount] INT NOT NULL DEFAULT 0,
    
    -- Features
    [IsFeatured] BIT NOT NULL DEFAULT 0,
    [IsPrivate] BIT NOT NULL DEFAULT 0,
    [RequiresApproval] BIT NOT NULL DEFAULT 0,
    [AllowGuestCheckout] BIT NOT NULL DEFAULT 1,
    
    -- Admin fields
    [ApprovedBy] UNIQUEIDENTIFIER,
    [ApprovedAt] DATETIME2,
    [RejectionReason] NVARCHAR(MAX),
    
    -- Timestamps
    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    [PublishedAt] DATETIME2,
    
    FOREIGN KEY ([OrganizerId]) REFERENCES [Users].[Organizers]([OrganizerId]) ON DELETE CASCADE,
    FOREIGN KEY ([CategoryId]) REFERENCES [Events].[Categories]([CategoryId]),
    FOREIGN KEY ([ApprovedBy]) REFERENCES [Users].[Users]([UserId]),
    
    -- Indexes
    INDEX [IX_Events_OrganizerId] ([OrganizerId]),
    INDEX [IX_Events_CategoryId] ([CategoryId]),
    INDEX [IX_Events_Status] ([Status]),
    INDEX [IX_Events_StartDate] ([StartDate]),
    INDEX [IX_Events_IsFeatured] ([IsFeatured]),
    INDEX [IX_Events_IsPrivate] ([IsPrivate]),
    INDEX [IX_Events_PublishedAt] ([PublishedAt]),
    INDEX [IX_Events_Slug] ([Slug]),
    INDEX [IX_Events_City_Country] ([VenueCity], [VenueCountry])
);
GO

-- Event Tickets/Pricing tiers
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
    
    FOREIGN KEY ([EventId]) REFERENCES [Events].[Events]([EventId]) ON DELETE CASCADE,
    INDEX [IX_EventTickets_EventId] ([EventId]),
    INDEX [IX_EventTickets_IsActive] ([IsActive])
);
GO

-- Bookings table
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
    [ProcessingFee] DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    [TaxAmount] DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    [DiscountAmount] DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    [FinalAmount] DECIMAL(10,2) NOT NULL,
    [Currency] NVARCHAR(3) NOT NULL DEFAULT 'USD',
    
    -- Status
    [Status] NVARCHAR(50) NOT NULL DEFAULT 'Pending' CHECK ([Status] IN ('Pending', 'Confirmed', 'Cancelled', 'Refunded', 'CheckedIn', 'NoShow')),
    [PaymentStatus] NVARCHAR(50) NOT NULL DEFAULT 'Pending' CHECK ([PaymentStatus] IN ('Pending', 'Processing', 'Completed', 'Failed', 'Refunded', 'PartiallyRefunded')),
    
    -- Attendee information (JSON)
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
    [CancelledAt] DATETIME2,
    [RefundedAt] DATETIME2,
    
    FOREIGN KEY ([EventId]) REFERENCES [Events].[Events]([EventId]) ON DELETE CASCADE,
    FOREIGN KEY ([TicketId]) REFERENCES [Events].[EventTickets]([TicketId]) ON DELETE SET NULL,
    FOREIGN KEY ([UserId]) REFERENCES [Users].[Users]([UserId]) ON DELETE SET NULL,
    FOREIGN KEY ([CheckedInBy]) REFERENCES [Users].[Users]([UserId]) ON DELETE NO ACTION,
    
    -- Indexes
    INDEX [IX_Bookings_EventId] ([EventId]),
    INDEX [IX_Bookings_UserId] ([UserId]),
    INDEX [IX_Bookings_BookingReference] ([BookingReference]),
    INDEX [IX_Bookings_Status] ([Status]),
    INDEX [IX_Bookings_PaymentStatus] ([PaymentStatus]),
    INDEX [IX_Bookings_QrCode] ([QrCode]),
    INDEX [IX_Bookings_CreatedAt] ([CreatedAt])
);
GO

-- Reviews and ratings
CREATE TABLE [Events].[Reviews] (
    [ReviewId] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [EventId] UNIQUEIDENTIFIER NOT NULL,
    [UserId] UNIQUEIDENTIFIER,
    [BookingId] UNIQUEIDENTIFIER,
    [Rating] INT NOT NULL CHECK ([Rating] >= 1 AND [Rating] <= 5),
    [Title] NVARCHAR(255),
    [Content] NVARCHAR(MAX),
    [Pros] NVARCHAR(MAX),
    [Cons] NVARCHAR(MAX),
    [HelpfulCount] INT NOT NULL DEFAULT 0,
    [Status] NVARCHAR(50) NOT NULL DEFAULT 'Published' CHECK ([Status] IN ('Published', 'Hidden', 'Flagged', 'Pending')),
    [IsVerifiedPurchase] BIT NOT NULL DEFAULT 0,
    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    FOREIGN KEY ([EventId]) REFERENCES [Events].[Events]([EventId]) ON DELETE CASCADE,
    FOREIGN KEY ([UserId]) REFERENCES [Users].[Users]([UserId]) ON DELETE NO ACTION,
    FOREIGN KEY ([BookingId]) REFERENCES [Events].[Bookings]([BookingId]) ON DELETE NO ACTION,
    
    -- Indexes
    INDEX [IX_Reviews_EventId] ([EventId]),
    INDEX [IX_Reviews_UserId] ([UserId]),
    INDEX [IX_Reviews_Rating] ([Rating]),
    INDEX [IX_Reviews_Status] ([Status]),
    INDEX [IX_Reviews_CreatedAt] ([CreatedAt])
);
GO

-- Notifications table
CREATE TABLE [System].[Notifications] (
    [NotificationId] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [UserId] UNIQUEIDENTIFIER NOT NULL,
    [Type] NVARCHAR(100) NOT NULL,
    [Title] NVARCHAR(255) NOT NULL,
    [Message] NVARCHAR(MAX) NOT NULL,
    [Data] NVARCHAR(MAX), -- JSON data
    [IsRead] BIT NOT NULL DEFAULT 0,
    [EmailSent] BIT NOT NULL DEFAULT 0,
    [PushSent] BIT NOT NULL DEFAULT 0,
    [SmsSent] BIT NOT NULL DEFAULT 0,
    [Priority] NVARCHAR(20) NOT NULL DEFAULT 'Normal' CHECK ([Priority] IN ('Low', 'Normal', 'High', 'Urgent')),
    [ExpiresAt] DATETIME2,
    [ActionUrl] NVARCHAR(500),
    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    FOREIGN KEY ([UserId]) REFERENCES [Users].[Users]([UserId]) ON DELETE CASCADE,
    INDEX [IX_Notifications_UserId] ([UserId]),
    INDEX [IX_Notifications_Type] ([Type]),
    INDEX [IX_Notifications_IsRead] ([IsRead]),
    INDEX [IX_Notifications_CreatedAt] ([CreatedAt])
);
GO

-- Payment transactions
CREATE TABLE [Payments].[Transactions] (
    [TransactionId] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [BookingId] UNIQUEIDENTIFIER,
    [OrganizerId] UNIQUEIDENTIFIER,
    [UserId] UNIQUEIDENTIFIER,
    [Type] NVARCHAR(50) NOT NULL CHECK ([Type] IN ('Payment', 'Refund', 'Payout', 'Fee', 'Commission')),
    [Status] NVARCHAR(50) NOT NULL DEFAULT 'Pending' CHECK ([Status] IN ('Pending', 'Processing', 'Completed', 'Failed', 'Cancelled', 'Disputed')),
    [Amount] DECIMAL(15,2) NOT NULL,
    [Currency] NVARCHAR(3) NOT NULL DEFAULT 'USD',
    [PlatformFee] DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    [ProcessingFee] DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    [NetAmount] DECIMAL(15,2) NOT NULL,
    
    -- Payment gateway info
    [PaymentGateway] NVARCHAR(50),
    [GatewayTransactionId] NVARCHAR(255),
    [GatewayFee] DECIMAL(10,2) DEFAULT 0.00,
    [GatewayResponse] NVARCHAR(MAX), -- JSON response
    
    -- Additional info
    [Description] NVARCHAR(500),
    [Metadata] NVARCHAR(MAX), -- JSON metadata
    [FailureReason] NVARCHAR(500),
    [ParentTransactionId] UNIQUEIDENTIFIER, -- For refunds/chargebacks
    
    -- Timestamps
    [ProcessedAt] DATETIME2,
    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    FOREIGN KEY ([BookingId]) REFERENCES [Events].[Bookings]([BookingId]) ON DELETE SET NULL,
    FOREIGN KEY ([OrganizerId]) REFERENCES [Users].[Organizers]([OrganizerId]) ON DELETE SET NULL,
    FOREIGN KEY ([UserId]) REFERENCES [Users].[Users]([UserId]) ON DELETE SET NULL,
    FOREIGN KEY ([ParentTransactionId]) REFERENCES [Payments].[Transactions]([TransactionId]) ON DELETE NO ACTION,
    
    -- Indexes
    INDEX [IX_Transactions_BookingId] ([BookingId]),
    INDEX [IX_Transactions_OrganizerId] ([OrganizerId]),
    INDEX [IX_Transactions_UserId] ([UserId]),
    INDEX [IX_Transactions_Type] ([Type]),
    INDEX [IX_Transactions_Status] ([Status]),
    INDEX [IX_Transactions_CreatedAt] ([CreatedAt]),
    INDEX [IX_Transactions_GatewayTransactionId] ([GatewayTransactionId])
);
GO

-- Promo Codes
CREATE TABLE [Events].[PromoCodes] (
    [PromoCodeId] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [EventId] UNIQUEIDENTIFIER,
    [OrganizerId] UNIQUEIDENTIFIER,
    [Code] NVARCHAR(50) NOT NULL,
    [Name] NVARCHAR(100) NOT NULL,
    [Description] NVARCHAR(500),
    [Type] NVARCHAR(20) NOT NULL CHECK ([Type] IN ('Percentage', 'FixedAmount')),
    [Value] DECIMAL(10,2) NOT NULL,
    [MinimumAmount] DECIMAL(10,2),
    [MaximumDiscount] DECIMAL(10,2),
    [UsageLimit] INT,
    [UsedCount] INT NOT NULL DEFAULT 0,
    [UserUsageLimit] INT DEFAULT 1,
    [IsActive] BIT NOT NULL DEFAULT 1,
    [ValidFrom] DATETIME2,
    [ValidTo] DATETIME2,
    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    FOREIGN KEY ([EventId]) REFERENCES [Events].[Events]([EventId]) ON DELETE CASCADE,
    FOREIGN KEY ([OrganizerId]) REFERENCES [Users].[Organizers]([OrganizerId]) ON DELETE NO ACTION,
    
    -- Indexes
    INDEX [IX_PromoCodes_Code] ([Code]),
    INDEX [IX_PromoCodes_EventId] ([EventId]),
    INDEX [IX_PromoCodes_IsActive] ([IsActive]),
    
    -- Unique constraint on event-specific codes
    UNIQUE ([EventId], [Code])
);
GO

-- Promo Code Usage tracking
CREATE TABLE [Events].[PromoCodeUsage] (
    [UsageId] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [PromoCodeId] UNIQUEIDENTIFIER NOT NULL,
    [BookingId] UNIQUEIDENTIFIER NOT NULL,
    [UserId] UNIQUEIDENTIFIER,
    [DiscountAmount] DECIMAL(10,2) NOT NULL,
    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    FOREIGN KEY ([PromoCodeId]) REFERENCES [Events].[PromoCodes]([PromoCodeId]) ON DELETE NO ACTION,
    FOREIGN KEY ([BookingId]) REFERENCES [Events].[Bookings]([BookingId]) ON DELETE NO ACTION,
    FOREIGN KEY ([UserId]) REFERENCES [Users].[Users]([UserId]) ON DELETE SET NULL,
    
    INDEX [IX_PromoCodeUsage_PromoCodeId] ([PromoCodeId]),
    INDEX [IX_PromoCodeUsage_UserId] ([UserId])
);
GO

-- Waitlist
CREATE TABLE [Events].[Waitlist] (
    [WaitlistId] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [EventId] UNIQUEIDENTIFIER NOT NULL,
    [UserId] UNIQUEIDENTIFIER NOT NULL,
    [TicketId] UNIQUEIDENTIFIER,
    [Quantity] INT NOT NULL DEFAULT 1,
    [Priority] INT NOT NULL DEFAULT 0,
    [NotifiedAt] DATETIME2,
    [ExpiresAt] DATETIME2,
    [Status] NVARCHAR(20) NOT NULL DEFAULT 'Waiting' CHECK ([Status] IN ('Waiting', 'Notified', 'Expired', 'Converted')),
    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    FOREIGN KEY ([EventId]) REFERENCES [Events].[Events]([EventId]) ON DELETE CASCADE,
    FOREIGN KEY ([UserId]) REFERENCES [Users].[Users]([UserId]) ON DELETE NO ACTION,
    FOREIGN KEY ([TicketId]) REFERENCES [Events].[EventTickets]([TicketId]) ON DELETE SET NULL,
    
    INDEX [IX_Waitlist_EventId] ([EventId]),
    INDEX [IX_Waitlist_UserId] ([UserId]),
    INDEX [IX_Waitlist_Status] ([Status]),
    
    -- Unique constraint to prevent duplicate waitlist entries
    UNIQUE ([EventId], [UserId], [TicketId])
);
GO

-- Event Favorites/Wishlist
CREATE TABLE [Events].[EventFavorites] (
    [FavoriteId] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [EventId] UNIQUEIDENTIFIER NOT NULL,
    [UserId] UNIQUEIDENTIFIER NOT NULL,
    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    FOREIGN KEY ([EventId]) REFERENCES [Events].[Events]([EventId]) ON DELETE CASCADE,
    FOREIGN KEY ([UserId]) REFERENCES [Users].[Users]([UserId]) ON DELETE NO ACTION,
    
    INDEX [IX_EventFavorites_EventId] ([EventId]),
    INDEX [IX_EventFavorites_UserId] ([UserId]),
    
    -- Unique constraint to prevent duplicate favorites
    UNIQUE ([EventId], [UserId])
);
GO

-- Support Tickets
CREATE TABLE [System].[SupportTickets] (
    [TicketId] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [UserId] UNIQUEIDENTIFIER,
    [Subject] NVARCHAR(255) NOT NULL,
    [Description] NVARCHAR(MAX) NOT NULL,
    [Category] NVARCHAR(50) NOT NULL CHECK ([Category] IN ('General', 'Technical', 'Billing', 'Refund', 'Account', 'Event', 'Other')),
    [Priority] NVARCHAR(20) NOT NULL DEFAULT 'Medium' CHECK ([Priority] IN ('Low', 'Medium', 'High', 'Urgent')),
    [Status] NVARCHAR(20) NOT NULL DEFAULT 'Open' CHECK ([Status] IN ('Open', 'InProgress', 'Resolved', 'Closed', 'Reopened')),
    [AssignedTo] UNIQUEIDENTIFIER,
    [ContactEmail] NVARCHAR(255) NOT NULL,
    [Attachments] NVARCHAR(MAX), -- JSON array of file URLs
    [InternalNotes] NVARCHAR(MAX),
    [Resolution] NVARCHAR(MAX),
    [SatisfactionRating] INT CHECK ([SatisfactionRating] >= 1 AND [SatisfactionRating] <= 5),
    [SatisfactionComment] NVARCHAR(500),
    [ResolvedAt] DATETIME2,
    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    FOREIGN KEY ([UserId]) REFERENCES [Users].[Users]([UserId]) ON DELETE SET NULL,
    FOREIGN KEY ([AssignedTo]) REFERENCES [Users].[Users]([UserId]),
    
    INDEX [IX_SupportTickets_UserId] ([UserId]),
    INDEX [IX_SupportTickets_Status] ([Status]),
    INDEX [IX_SupportTickets_Priority] ([Priority]),
    INDEX [IX_SupportTickets_AssignedTo] ([AssignedTo]),
    INDEX [IX_SupportTickets_CreatedAt] ([CreatedAt])
);
GO

-- Support Ticket Messages
CREATE TABLE [System].[SupportTicketMessages] (
    [MessageId] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [TicketId] UNIQUEIDENTIFIER NOT NULL,
    [UserId] UNIQUEIDENTIFIER,
    [Message] NVARCHAR(MAX) NOT NULL,
    [IsInternal] BIT NOT NULL DEFAULT 0,
    [Attachments] NVARCHAR(MAX), -- JSON array
    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    FOREIGN KEY ([TicketId]) REFERENCES [System].[SupportTickets]([TicketId]) ON DELETE CASCADE,
    FOREIGN KEY ([UserId]) REFERENCES [Users].[Users]([UserId]) ON DELETE SET NULL,
    
    INDEX [IX_SupportTicketMessages_TicketId] ([TicketId]),
    INDEX [IX_SupportTicketMessages_CreatedAt] ([CreatedAt])
);
GO

-- System Settings
CREATE TABLE [System].[Settings] (
    [SettingId] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [Category] NVARCHAR(50) NOT NULL,
    [Key] NVARCHAR(100) NOT NULL,
    [Value] NVARCHAR(MAX),
    [DataType] NVARCHAR(20) NOT NULL DEFAULT 'String' CHECK ([DataType] IN ('String', 'Number', 'Boolean', 'JSON')),
    [Description] NVARCHAR(500),
    [IsPublic] BIT NOT NULL DEFAULT 0,
    [UpdatedBy] UNIQUEIDENTIFIER,
    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    FOREIGN KEY ([UpdatedBy]) REFERENCES [Users].[Users]([UserId]),
    
    INDEX [IX_Settings_Category] ([Category]),
    INDEX [IX_Settings_Key] ([Key]),
    
    -- Unique constraint on category + key
    UNIQUE ([Category], [Key])
);
GO

-- Audit Log
CREATE TABLE [System].[AuditLog] (
    [LogId] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [UserId] UNIQUEIDENTIFIER,
    [Action] NVARCHAR(100) NOT NULL,
    [TableName] NVARCHAR(100),
    [RecordId] UNIQUEIDENTIFIER,
    [OldValues] NVARCHAR(MAX), -- JSON
    [NewValues] NVARCHAR(MAX), -- JSON
    [IpAddress] NVARCHAR(45),
    [UserAgent] NVARCHAR(MAX),
    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    FOREIGN KEY ([UserId]) REFERENCES [Users].[Users]([UserId]) ON DELETE SET NULL,
    
    INDEX [IX_AuditLog_UserId] ([UserId]),
    INDEX [IX_AuditLog_Action] ([Action]),
    INDEX [IX_AuditLog_TableName] ([TableName]),
    INDEX [IX_AuditLog_CreatedAt] ([CreatedAt])
);
GO

-- Analytics Views for reporting
CREATE TABLE [Analytics].[EventViews] (
    [ViewId] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [EventId] UNIQUEIDENTIFIER NOT NULL,
    [UserId] UNIQUEIDENTIFIER,
    [SessionId] NVARCHAR(255),
    [IpAddress] NVARCHAR(45),
    [UserAgent] NVARCHAR(MAX),
    [Referrer] NVARCHAR(500),
    [ViewDuration] INT, -- in seconds
    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    FOREIGN KEY ([EventId]) REFERENCES [Events].[Events]([EventId]) ON DELETE CASCADE,
    FOREIGN KEY ([UserId]) REFERENCES [Users].[Users]([UserId]) ON DELETE NO ACTION,
    
    INDEX [IX_EventViews_EventId] ([EventId]),
    INDEX [IX_EventViews_UserId] ([UserId]),
    INDEX [IX_EventViews_CreatedAt] ([CreatedAt])
);
GO

-- =====================================================
-- Insert Default Data
-- =====================================================

-- Insert default categories
INSERT INTO [Events].[Categories] ([CategoryId], [Name], [Description], [IconClass], [Color], [SortOrder]) VALUES
(NEWID(), 'Technology', 'Tech conferences, workshops, and meetups', 'fas fa-laptop-code', '#0ea5a4', 1),
(NEWID(), 'Music', 'Concerts, festivals, and music events', 'fas fa-music', '#7c3aed', 2),
(NEWID(), 'Business', 'Networking, seminars, and business events', 'fas fa-briefcase', '#16a34a', 3),
(NEWID(), 'Art', 'Exhibitions, galleries, and art events', 'fas fa-palette', '#f59e0b', 4),
(NEWID(), 'Sports', 'Sports events, tournaments, and activities', 'fas fa-football-ball', '#dc2626', 5),
(NEWID(), 'Food', 'Food festivals, cooking classes, and culinary events', 'fas fa-utensils', '#8b5cf6', 6),
(NEWID(), 'Education', 'Workshops, courses, and educational events', 'fas fa-graduation-cap', '#0284c7', 7),
(NEWID(), 'Health', 'Fitness, wellness, and health events', 'fas fa-heartbeat', '#059669', 8),
(NEWID(), 'Other', 'Miscellaneous events', 'fas fa-star', '#6b7280', 9);
GO

-- Insert default system settings
INSERT INTO [System].[Settings] ([Category], [Key], [Value], [DataType], [Description], [IsPublic]) VALUES
('General', 'SiteName', 'EventHub', 'String', 'Name of the platform', 1),
('General', 'SiteUrl', 'https://eventhub.com', 'String', 'Base URL of the platform', 1),
('General', 'SupportEmail', 'support@eventhub.com', 'String', 'Support email address', 1),
('General', 'DefaultTimezone', 'UTC', 'String', 'Default timezone for events', 1),
('General', 'DefaultCurrency', 'USD', 'String', 'Default currency for transactions', 1),
('General', 'MaxUploadSize', '10485760', 'Number', 'Maximum file upload size in bytes (10MB)', 0),
('General', 'AllowRegistrations', 'true', 'Boolean', 'Allow new user registrations', 0),
('General', 'RequireEmailVerification', 'true', 'Boolean', 'Require email verification for new users', 0),
('Payment', 'DefaultCommissionRate', '12.80', 'Number', 'Default commission rate percentage', 0),
('Payment', 'MinPayoutAmount', '25.00', 'Number', 'Minimum payout amount', 0),
('Email', 'SmtpHost', '', 'String', 'SMTP server host', 0),
('Email', 'SmtpPort', '587', 'Number', 'SMTP server port', 0),
('Email', 'SmtpUsername', '', 'String', 'SMTP username', 0),
('Email', 'FromEmail', 'noreply@eventhub.com', 'String', 'Default from email address', 0),
('Email', 'FromName', 'EventHub', 'String', 'Default from name', 0),
('Security', 'PasswordMinLength', '8', 'Number', 'Minimum password length', 0),
('Security', 'MaxLoginAttempts', '5', 'Number', 'Maximum login attempts before lockout', 0),
('Security', 'LockoutDuration', '900', 'Number', 'Account lockout duration in seconds (15 minutes)', 0),
('Security', 'JwtSecretKey', 'your-super-secret-jwt-key-change-in-production', 'String', 'JWT secret key', 0),
('Security', 'JwtExpiresIn', '900', 'Number', 'JWT token expiration in seconds (15 minutes)', 0),
('Security', 'RefreshTokenExpiresIn', '604800', 'Number', 'Refresh token expiration in seconds (7 days)', 0);
GO

-- Create default admin user
DECLARE @AdminUserId UNIQUEIDENTIFIER = NEWID();
DECLARE @AdminPassword NVARCHAR(255) = 'Admin123!'; -- Change this in production
DECLARE @AdminSalt NVARCHAR(255) = CAST(NEWID() AS NVARCHAR(255));

INSERT INTO [Users].[Users] ([UserId], [Email], [PasswordHash], [Salt], [FirstName], [LastName], [Role], [Status], [EmailVerified]) 
VALUES (
    @AdminUserId, 
    'admin@eventhub.com', 
    HASHBYTES('SHA2_512', @AdminPassword + @AdminSalt),
    @AdminSalt,
    'System', 
    'Administrator', 
    'SuperAdmin', 
    'Active', 
    1
);
GO

-- =====================================================
-- Create Views for Reporting
-- =====================================================

-- Event summary view
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

-- Booking summary view
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

-- Revenue summary view
CREATE VIEW [Analytics].[RevenueSummaryView] AS
SELECT 
    t.[TransactionId],
    t.[Type],
    t.[Status],
    t.[Amount],
    t.[NetAmount],
    t.[PlatformFee],
    t.[ProcessingFee],
    t.[Currency],
    t.[PaymentGateway],
    t.[ProcessedAt],
    t.[CreatedAt],
    o.[OrganizationName],
    e.[Title] AS EventTitle
FROM [Payments].[Transactions] t
LEFT JOIN [Users].[Organizers] o ON t.[OrganizerId] = o.[OrganizerId]
LEFT JOIN [Events].[Bookings] b ON t.[BookingId] = b.[BookingId]
LEFT JOIN [Events].[Events] e ON b.[EventId] = e.[EventId];
GO

-- =====================================================
-- Create Stored Procedures
-- =====================================================

-- Procedure to create a new booking
CREATE PROCEDURE [Events].[CreateBooking]
    @EventId UNIQUEIDENTIFIER,
    @TicketId UNIQUEIDENTIFIER = NULL,
    @UserId UNIQUEIDENTIFIER = NULL,
    @Quantity INT,
    @AttendeeInfo NVARCHAR(MAX),
    @PromoCode NVARCHAR(50) = NULL
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
        DECLARE @DiscountAmount DECIMAL(10,2) = 0;
        DECLARE @FinalAmount DECIMAL(10,2);
        DECLARE @QrCode NVARCHAR(255);
        
        -- Generate booking reference
        DECLARE @RandomNum INT = ABS(CHECKSUM(NEWID())) % 999999 + 1;
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
        
        -- Apply promo code if provided
        IF @PromoCode IS NOT NULL
        BEGIN
            -- Promo code logic here
            -- This is a simplified version
            SET @DiscountAmount = 0; -- Calculate based on promo code
        END
        
        SET @FinalAmount = @TotalPrice + @PlatformFee - @DiscountAmount;
        
        -- Generate QR code
        SET @QrCode = 'QR_' + CAST(@BookingId AS NVARCHAR(36));
        
        -- Insert booking
        INSERT INTO [Events].[Bookings] (
            [BookingId], [EventId], [TicketId], [UserId], [BookingReference],
            [Quantity], [UnitPrice], [TotalPrice], [PlatformFee], [DiscountAmount],
            [FinalAmount], [AttendeeInfo], [PromoCode], [QrCode]
        )
        VALUES (
            @BookingId, @EventId, @TicketId, @UserId, @BookingReference,
            @Quantity, @UnitPrice, @TotalPrice, @PlatformFee, @DiscountAmount,
            @FinalAmount, @AttendeeInfo, @PromoCode, @QrCode
        );
        
        -- Update event booking count
        UPDATE [Events].[Events] 
        SET [BookingCount] = [BookingCount] + @Quantity
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
    DECLARE @EventId UNIQUEIDENTIFIER;
    
    -- Find booking by QR code
    SELECT @BookingId = [BookingId], @EventId = [EventId]
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

-- Procedure to get event analytics
CREATE PROCEDURE [Analytics].[GetEventAnalytics]
    @EventId UNIQUEIDENTIFIER,
    @DateFrom DATE = NULL,
    @DateTo DATE = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    IF @DateFrom IS NULL SET @DateFrom = DATEADD(MONTH, -1, GETDATE());
    IF @DateTo IS NULL SET @DateTo = GETDATE();
    
    -- Event overview
    SELECT 
        e.[EventId],
        e.[Title],
        e.[Status],
        e.[StartDate],
        e.[EndDate],
        e.[Price],
        e.[Capacity],
        e.[BookingCount],
        e.[TotalRevenue],
        e.[ViewCount],
        e.[AverageRating],
        e.[ReviewCount],
        c.[Name] AS CategoryName,
        o.[OrganizationName] AS OrganizerName
    FROM [Events].[Events] e
    INNER JOIN [Events].[Categories] c ON e.[CategoryId] = c.[CategoryId]
    INNER JOIN [Users].[Organizers] o ON e.[OrganizerId] = o.[OrganizerId]
    WHERE e.[EventId] = @EventId;
    
    -- Booking statistics
    SELECT 
        COUNT(*) AS TotalBookings,
        SUM([Quantity]) AS TotalTickets,
        SUM([FinalAmount]) AS TotalRevenue,
        AVG([FinalAmount]) AS AverageOrderValue,
        COUNT(CASE WHEN [Status] = 'CheckedIn' THEN 1 END) AS CheckedInCount,
        COUNT(CASE WHEN [Status] = 'Cancelled' THEN 1 END) AS CancelledCount,
        COUNT(CASE WHEN [Status] = 'Refunded' THEN 1 END) AS RefundedCount
    FROM [Events].[Bookings]
    WHERE [EventId] = @EventId
        AND [CreatedAt] BETWEEN @DateFrom AND DATEADD(DAY, 1, @DateTo);
    
    -- Daily booking trends
    SELECT 
        CAST([CreatedAt] AS DATE) AS BookingDate,
        COUNT(*) AS BookingsCount,
        SUM([Quantity]) AS TicketsCount,
        SUM([FinalAmount]) AS Revenue
    FROM [Events].[Bookings]
    WHERE [EventId] = @EventId
        AND [CreatedAt] BETWEEN @DateFrom AND DATEADD(DAY, 1, @DateTo)
        AND [Status] NOT IN ('Cancelled', 'Refunded')
    GROUP BY CAST([CreatedAt] AS DATE)
    ORDER BY BookingDate;
    
    -- Traffic sources (from event views)
    SELECT 
        ISNULL([Referrer], 'Direct') AS Source,
        COUNT(*) AS Views,
        COUNT(DISTINCT [UserId]) AS UniqueVisitors
    FROM [Analytics].[EventViews]
    WHERE [EventId] = @EventId
        AND [CreatedAt] BETWEEN @DateFrom AND DATEADD(DAY, 1, @DateTo)
    GROUP BY [Referrer]
    ORDER BY Views DESC;
END;
GO

-- =====================================================
-- Create Sequences (Removed - using random generation instead)
-- =====================================================

-- Note: Sequences removed due to function compatibility issues
-- Using random number generation for booking references instead

-- =====================================================
-- Create Triggers for Audit Logging
-- =====================================================

-- Audit trigger for Users table
CREATE TRIGGER [Users].[TR_Users_Audit]
ON [Users].[Users]
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @Action NVARCHAR(50);
    
    IF EXISTS (SELECT * FROM inserted) AND EXISTS (SELECT * FROM deleted)
        SET @Action = 'UPDATE';
    ELSE IF EXISTS (SELECT * FROM inserted)
        SET @Action = 'INSERT';
    ELSE
        SET @Action = 'DELETE';
    
    INSERT INTO [System].[AuditLog] ([UserId], [Action], [TableName], [RecordId], [OldValues], [NewValues])
    SELECT 
        COALESCE(i.[UserId], d.[UserId]),
        @Action,
        'Users.Users',
        COALESCE(i.[UserId], d.[UserId]),
        CASE WHEN @Action IN ('UPDATE', 'DELETE') 
             THEN (SELECT d.* FOR JSON PATH, WITHOUT_ARRAY_WRAPPER) 
             ELSE NULL END,
        CASE WHEN @Action IN ('INSERT', 'UPDATE') 
             THEN (SELECT i.* FOR JSON PATH, WITHOUT_ARRAY_WRAPPER) 
             ELSE NULL END
    FROM inserted i
    FULL OUTER JOIN deleted d ON i.[UserId] = d.[UserId];
END;
GO

-- Audit trigger for Events table
CREATE TRIGGER [Events].[TR_Events_Audit]
ON [Events].[Events]
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @Action NVARCHAR(50);
    
    IF EXISTS (SELECT * FROM inserted) AND EXISTS (SELECT * FROM deleted)
        SET @Action = 'UPDATE';
    ELSE IF EXISTS (SELECT * FROM inserted)
        SET @Action = 'INSERT';
    ELSE
        SET @Action = 'DELETE';
    
    INSERT INTO [System].[AuditLog] ([Action], [TableName], [RecordId], [OldValues], [NewValues])
    SELECT 
        @Action,
        'Events.Events',
        COALESCE(i.[EventId], d.[EventId]),
        CASE WHEN @Action IN ('UPDATE', 'DELETE') 
             THEN (SELECT d.* FOR JSON PATH, WITHOUT_ARRAY_WRAPPER) 
             ELSE NULL END,
        CASE WHEN @Action IN ('INSERT', 'UPDATE') 
             THEN (SELECT i.* FOR JSON PATH, WITHOUT_ARRAY_WRAPPER) 
             ELSE NULL END
    FROM inserted i
    FULL OUTER JOIN deleted d ON i.[EventId] = d.[EventId];
END;
GO

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

-- =====================================================
-- Create Functions
-- =====================================================

-- Function to calculate platform fee
CREATE FUNCTION [dbo].[CalculatePlatformFee](@Amount DECIMAL(10,2), @CommissionRate DECIMAL(5,2))
RETURNS DECIMAL(10,2)
AS
BEGIN
    RETURN ROUND(@Amount * @CommissionRate / 100, 2);
END;
GO

-- Function to generate booking reference (simplified without SEQUENCE)
CREATE FUNCTION [dbo].[GenerateBookingReference]()
RETURNS NVARCHAR(20)
AS
BEGIN
    DECLARE @Reference NVARCHAR(20);
    DECLARE @Random INT = ABS(CHECKSUM(NEWID())) % 999999 + 1;
    SET @Reference = 'EH' + FORMAT(@Random, '000000');
    RETURN @Reference;
END;
GO

-- =====================================================
-- Create Indexes for Performance
-- =====================================================

-- Additional performance indexes (moved after table creation)
-- These will be created after all tables are created
-- CREATE INDEX [IX_Events_StartDate_Status] ON [Events].[Events] ([StartDate], [Status]) 
-- INCLUDE ([EventId], [Title], [Price], [Capacity]);

-- CREATE INDEX [IX_Bookings_EventId_Status] ON [Events].[Bookings] ([EventId], [Status]) 
-- INCLUDE ([UserId], [Quantity], [FinalAmount], [CreatedAt]);

-- CREATE INDEX [IX_Transactions_Type_Status] ON [Payments].[Transactions] ([Type], [Status]) 
-- INCLUDE ([Amount], [CreatedAt]);

-- Full-text search index for events (commented out - enable manually if needed)
-- CREATE FULLTEXT CATALOG [EventSearchCatalog];
-- GO

-- CREATE FULLTEXT INDEX ON [Events].[Events] ([Title], [Description], [ShortDescription])
-- KEY INDEX [PK__Events__7944C810] ON [EventSearchCatalog];
-- GO

-- =====================================================
-- Grant Permissions (Basic roles)
-- =====================================================

-- Create database roles
CREATE ROLE [EventHubUser];
CREATE ROLE [EventHubOrganizer];
CREATE ROLE [EventHubAdmin];

-- Grant permissions to roles (Fixed syntax)
-- EventHubUser role permissions
GRANT SELECT ON [Events].[Events] TO [EventHubUser];
GRANT SELECT ON [Events].[Categories] TO [EventHubUser];
GRANT SELECT ON [Events].[EventTickets] TO [EventHubUser];
GRANT SELECT, INSERT, UPDATE ON [Events].[Bookings] TO [EventHubUser];
GRANT SELECT, INSERT ON [Events].[Reviews] TO [EventHubUser];
GRANT SELECT ON [Users].[Users] TO [EventHubUser];
GRANT EXECUTE ON [Events].[CreateBooking] TO [EventHubUser];
GO

-- EventHubOrganizer role permissions (inherits from User)
ALTER ROLE [EventHubOrganizer] ADD MEMBER [EventHubUser];
GRANT SELECT, INSERT, UPDATE ON [Events].[Events] TO [EventHubOrganizer];
GRANT SELECT, INSERT, UPDATE ON [Events].[EventTickets] TO [EventHubOrganizer];
GRANT SELECT ON [Analytics].[EventSummaryView] TO [EventHubOrganizer];
GRANT EXECUTE ON [Analytics].[GetEventAnalytics] TO [EventHubOrganizer];
GO

-- EventHubAdmin role permissions (full access)
ALTER ROLE [EventHubAdmin] ADD MEMBER [EventHubOrganizer];
GRANT SELECT, INSERT, UPDATE, DELETE ON SCHEMA::[Users] TO [EventHubAdmin];
GRANT SELECT, INSERT, UPDATE, DELETE ON SCHEMA::[Events] TO [EventHubAdmin];
GRANT SELECT, INSERT, UPDATE, DELETE ON SCHEMA::[Payments] TO [EventHubAdmin];
GRANT SELECT, INSERT, UPDATE, DELETE ON SCHEMA::[System] TO [EventHubAdmin];
GRANT SELECT ON SCHEMA::[Analytics] TO [EventHubAdmin];
GO

-- =====================================================
-- Database Maintenance
-- =====================================================

-- Create maintenance jobs (run these as separate scripts)
/*
-- Cleanup old sessions (run daily)
DELETE FROM [Users].[UserSessions] 
WHERE [ExpiresAt] < DATEADD(DAY, -7, GETUTCDATE()) OR [IsActive] = 0;

-- Cleanup old notifications (run weekly)
DELETE FROM [System].[Notifications] 
WHERE [CreatedAt] < DATEADD(DAY, -30, GETUTCDATE()) AND [IsRead] = 1;

-- Cleanup old audit logs (run monthly)
DELETE FROM [System].[AuditLog] 
WHERE [CreatedAt] < DATEADD(DAY, -365, GETUTCDATE());

-- Update statistics (run weekly)
UPDATE STATISTICS [Events].[Events];
UPDATE STATISTICS [Events].[Bookings];
UPDATE STATISTICS [Payments].[Transactions];
*/

-- =====================================================
-- Sample Data for Testing
-- =====================================================

-- Insert sample organizer
DECLARE @SampleUserId UNIQUEIDENTIFIER = NEWID();
DECLARE @SampleOrganizerId UNIQUEIDENTIFIER = NEWID();

INSERT INTO [Users].[Users] ([UserId], [Email], [PasswordHash], [Salt], [FirstName], [LastName], [Role], [Status], [EmailVerified]) 
VALUES (@SampleUserId, 'organizer@example.com', HASHBYTES('SHA2_512', 'Password123!' + CAST(NEWID() AS NVARCHAR(255))), CAST(NEWID() AS NVARCHAR(255)), 'John', 'Organizer', 'Organizer', 'Active', 1);

INSERT INTO [Users].[Organizers] ([OrganizerId], [UserId], [OrganizationName], [OrganizationType], [VerificationStatus], [IsVerified])
VALUES (@SampleOrganizerId, @SampleUserId, 'TechEvents Inc.', 'Company', 'Verified', 1);

-- Insert sample event
DECLARE @SampleCategoryId UNIQUEIDENTIFIER = (SELECT TOP 1 [CategoryId] FROM [Events].[Categories] WHERE [Name] = 'Technology');
DECLARE @SampleEventId UNIQUEIDENTIFIER = NEWID();

INSERT INTO [Events].[Events] (
    [EventId], [OrganizerId], [CategoryId], [Title], [Slug], [Description], [ShortDescription],
    [Status], [StartDate], [EndDate], [VenueName], [VenueCity], [VenueCountry], 
    [Capacity], [Price], [IsFree], [PublishedAt]
)
VALUES (
    @SampleEventId, @SampleOrganizerId, @SampleCategoryId,
    'Tech Conference 2025', 'tech-conference-2025',
    'Join industry leaders for the biggest tech conference of the year. Featuring keynotes, workshops, and networking opportunities.',
    'The biggest tech conference of 2025 with industry leaders.',
    'Published', '2025-11-15 09:00:00', '2025-11-15 18:00:00',
    'Tech Center Downtown', 'New York', 'USA',
    500, 299.00, 0, GETUTCDATE()
);
GO

-- =====================================================
-- Create Additional Performance Indexes
-- =====================================================

-- Additional performance indexes (created after tables exist)
CREATE INDEX [IX_Events_StartDate_Status] ON [Events].[Events] ([StartDate], [Status]) 
INCLUDE ([EventId], [Title], [Price], [Capacity]);
GO

CREATE INDEX [IX_Bookings_EventId_Status] ON [Events].[Bookings] ([EventId], [Status]) 
INCLUDE ([UserId], [Quantity], [FinalAmount], [CreatedAt]);
GO

CREATE INDEX [IX_Transactions_Type_Status] ON [Payments].[Transactions] ([Type], [Status]) 
INCLUDE ([Amount], [CreatedAt]);
GO

PRINT 'EventHub database schema created successfully!';
PRINT 'Default admin user: admin@eventhub.com / Admin123!';
PRINT 'Remember to:';
PRINT '1. Change the default admin password';
PRINT '2. Update file paths for database files';
PRINT '3. Configure backup and maintenance jobs';
PRINT '4. Set up proper security and user permissions';
PRINT '5. Update connection strings in your application';
GO