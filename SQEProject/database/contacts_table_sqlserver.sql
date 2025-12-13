-- Contact Form Submissions Table for SQL Server
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ContactSubmissions')
BEGIN
    CREATE TABLE ContactSubmissions (
        contactId INT PRIMARY KEY IDENTITY(1,1),
        name NVARCHAR(100) NOT NULL,
        email NVARCHAR(100) NOT NULL,
        phone NVARCHAR(20),
        subject NVARCHAR(50) NOT NULL,
        message NVARCHAR(MAX) NOT NULL,
        newsletter BIT DEFAULT 0,
        status NVARCHAR(20) DEFAULT 'New' CHECK (status IN ('New', 'Read', 'Replied', 'Resolved')),
        adminNotes NVARCHAR(MAX),
        createdAt DATETIME2 DEFAULT GETDATE(),
        updatedAt DATETIME2 DEFAULT GETDATE()
    );

    -- Create indexes
    CREATE INDEX idx_status ON ContactSubmissions(status);
    CREATE INDEX idx_created ON ContactSubmissions(createdAt);
END;
GO

-- Create trigger to update updatedAt timestamp
IF OBJECT_ID('trg_ContactSubmissions_Update', 'TR') IS NOT NULL
    DROP TRIGGER trg_ContactSubmissions_Update;
GO

CREATE TRIGGER trg_ContactSubmissions_Update
ON ContactSubmissions
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE ContactSubmissions
    SET updatedAt = GETDATE()
    FROM ContactSubmissions cs
    INNER JOIN inserted i ON cs.contactId = i.contactId;
END;
GO
