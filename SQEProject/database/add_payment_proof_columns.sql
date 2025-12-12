-- Add columns for manual payment verification
-- Transaction ID and receipt URL for offline payment proof

USE EventHubDB;
GO

-- Check if columns already exist before adding
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[Events].[Bookings]') AND name = 'TransactionId')
BEGIN
    ALTER TABLE [Events].[Bookings]
    ADD [TransactionId] NVARCHAR(255) NULL;
    PRINT 'Added TransactionId column to Bookings table';
END
ELSE
BEGIN
    PRINT 'TransactionId column already exists';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[Events].[Bookings]') AND name = 'PaymentReceiptUrl')
BEGIN
    ALTER TABLE [Events].[Bookings]
    ADD [PaymentReceiptUrl] NVARCHAR(MAX) NULL;
    PRINT 'Added PaymentReceiptUrl column to Bookings table';
END
ELSE
BEGIN
    PRINT 'PaymentReceiptUrl column already exists';
END
GO

-- Add payment verification notes column for organizer comments
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[Events].[Bookings]') AND name = 'PaymentNotes')
BEGIN
    ALTER TABLE [Events].[Bookings]
    ADD [PaymentNotes] NVARCHAR(MAX) NULL;
    PRINT 'Added PaymentNotes column to Bookings table';
END
ELSE
BEGIN
    PRINT 'PaymentNotes column already exists';
END
GO

-- Add payment confirmed timestamp
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[Events].[Bookings]') AND name = 'PaymentConfirmedAt')
BEGIN
    ALTER TABLE [Events].[Bookings]
    ADD [PaymentConfirmedAt] DATETIME2 NULL;
    PRINT 'Added PaymentConfirmedAt column to Bookings table';
END
ELSE
BEGIN
    PRINT 'PaymentConfirmedAt column already exists';
END
GO

-- Add payment confirmed by (organizer user ID)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[Events].[Bookings]') AND name = 'PaymentConfirmedBy')
BEGIN
    ALTER TABLE [Events].[Bookings]
    ADD [PaymentConfirmedBy] UNIQUEIDENTIFIER NULL;
    
    ALTER TABLE [Events].[Bookings]
    ADD CONSTRAINT [FK_Bookings_PaymentConfirmedBy] FOREIGN KEY ([PaymentConfirmedBy]) 
        REFERENCES [Users].[Users]([UserId]);
    
    PRINT 'Added PaymentConfirmedBy column to Bookings table';
END
ELSE
BEGIN
    PRINT 'PaymentConfirmedBy column already exists';
END
GO

PRINT 'Payment proof columns added successfully!';
