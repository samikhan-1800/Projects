-- Fix Organizer Event Ownership
-- This script checks and fixes the OrganizerId for events

-- Step 1: Check current organizer
SELECT 
    u.Email,
    o.OrganizerId,
    o.OrganizationName
FROM [Users].[Organizers] o
INNER JOIN [Users].[Users] u ON o.UserId = u.UserId
WHERE u.Email = 'organizer@eventhub.com';

-- Step 2: Check which organizer owns the events
SELECT 
    e.EventId,
    e.Title,
    e.OrganizerId,
    o.OrganizationName,
    u.Email as OrganizerEmail
FROM [Events].[Events] e
LEFT JOIN [Users].[Organizers] o ON e.OrganizerId = o.OrganizerId
LEFT JOIN [Users].[Users] u ON o.UserId = u.UserId
ORDER BY e.CreatedAt DESC;

-- Step 3: Count events per organizer
SELECT 
    e.OrganizerId,
    o.OrganizationName,
    u.Email,
    COUNT(*) as EventCount
FROM [Events].[Events] e
LEFT JOIN [Users].[Organizers] o ON e.OrganizerId = o.OrganizerId
LEFT JOIN [Users].[Users] u ON o.UserId = u.UserId
GROUP BY e.OrganizerId, o.OrganizationName, u.Email;

-- Step 4: UPDATE - Assign all events to the organizer@eventhub.com account
-- Run this ONLY if you want to reassign all events to organizer@eventhub.com
/*
UPDATE [Events].[Events]
SET OrganizerId = (
    SELECT OrganizerId 
    FROM [Users].[Organizers] o
    INNER JOIN [Users].[Users] u ON o.UserId = u.UserId
    WHERE u.Email = 'organizer@eventhub.com'
)
WHERE OrganizerId IS NOT NULL;

-- Verify the update
SELECT 
    e.EventId,
    e.Title,
    e.OrganizerId,
    o.OrganizationName
FROM [Events].[Events] e
INNER JOIN [Users].[Organizers] o ON e.OrganizerId = o.OrganizerId;
*/
