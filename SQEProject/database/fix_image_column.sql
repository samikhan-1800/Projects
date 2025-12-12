-- Fix FeaturedImageUrl column size to support base64 images or longer URLs
USE EventHubDB;
GO

-- Increase column size to NVARCHAR(MAX) to support base64 encoded images
ALTER TABLE [Events].[Events]
ALTER COLUMN [FeaturedImageUrl] NVARCHAR(MAX);
GO

PRINT 'FeaturedImageUrl column updated to NVARCHAR(MAX)';
GO
