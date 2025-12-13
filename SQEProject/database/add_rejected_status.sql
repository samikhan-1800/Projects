-- =====================================================
-- Add 'Rejected' status to Events table
-- Created: December 13, 2025
-- Description: Updates the Status constraint to include 'Rejected' 
--              so admins can reject pending events
-- =====================================================

USE EventHubDB;
GO

-- Drop the existing constraint
ALTER TABLE [Events].[Events]
DROP CONSTRAINT IF EXISTS CK__Events__Status;
GO

-- Add the new constraint with 'Rejected' included
ALTER TABLE [Events].[Events]
ADD CONSTRAINT CK__Events__Status 
CHECK ([Status] IN ('Draft', 'Pending', 'Approved', 'Published', 'Cancelled', 'Completed', 'Rejected'));
GO

PRINT 'Successfully added Rejected status to Events table constraint';
GO
