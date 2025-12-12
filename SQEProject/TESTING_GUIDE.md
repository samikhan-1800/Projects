# EventHub Testing Guide

## Recent Fixes - Testing Instructions

### Test 1: Organizer Cannot Book Own Events ✅

**Steps to Test:**
1. Login as organizer: `organizer@eventhub.com` / `Demo@123`
2. Navigate to Events page or view an event you created
3. Try to click "Book Now" on your own event
4. **Expected Result:** Error message: "As an organizer, you cannot book your own events."

**Technical Details:**
- Backend validation in `backend/routes/bookings.js` (lines 73-80)
- Frontend error handling in `js/main.js` (lines 425-435)

---

### Test 2: Payment Uploads Show in Organizer Dashboard ✅

**Steps to Test:**
1. **As User:**
   - Login as user: `user@eventhub.com` / `Demo@123`
   - Book an event created by organizer
   - Go to User Dashboard → Booking History
   - Click "Upload Payment" button
   - Enter transaction ID: `EP123456789`
   - Upload payment receipt screenshot
   - Submit

2. **As Organizer:**
   - Login as organizer: `organizer@eventhub.com` / `Demo@123`
   - Go to Organizer Dashboard → Attendees section
   - **Expected Result:** 
     - See the booking in attendees list
     - Transaction ID visible: `EP123456789`
     - "View Receipt" link available
     - "Confirm" and "Reject" buttons visible

**Technical Details:**
- Payment upload: `pages/user-dashboard.html` (lines 850-915)
- Backend update: `backend/routes/bookings.js` PUT /:id endpoint
- Organizer display: `backend/routes/bookings.js` GET /organizer/attendees (lines 394-397)
- Frontend display: `js/organizer-dashboard.js` renderAttendees() (lines 678-692)

---

### Test 3: View Details Works in My Events ✅

**Steps to Test:**
1. Login as user: `user@eventhub.com` / `Demo@123`
2. Go to User Dashboard → My Events
3. Click "View Details" on any event card
4. **Expected Result:** 
   - Redirects to event detail page
   - No JavaScript errors in console
   - Event details display correctly

**Technical Details:**
- Fixed in `pages/user-dashboard.html` loadMyEvents() function (lines 612-650)
- Replaced missing `createEventCard()` with inline HTML generation
- Each event card now has proper "View Details" button with correct href

---

## Additional Testing Scenarios

### Payment Workflow (End-to-End)

**Complete Flow:**
1. User books event → Status: "Pending"
2. User uploads payment proof → Status: "Pending" (with transaction ID)
3. Organizer confirms payment → Status: "Completed"
4. User sees "View Ticket" button

**Test Each Step:**
- [ ] Booking creation works
- [ ] Payment upload modal opens correctly
- [ ] Transaction ID and receipt are saved
- [ ] Organizer sees payment data
- [ ] Confirm button updates status
- [ ] User sees updated status
- [ ] Reject button sends payment back to pending

---

## Known Limitations

1. **EasyPaisa Account**: Currently shows placeholder `03XX-XXXXXXX` in payment modal
2. **Ticket Download**: "View Ticket" shows "coming soon" alert
3. **Email Notifications**: Not implemented yet for payment confirmations

---

## Quick Error Checking

Run these checks to verify everything is working:

```powershell
# Check if backend is running
curl http://localhost:3000/api/health

# Check organizer bookings endpoint
curl http://localhost:3000/api/bookings/organizer/attendees -H "Authorization: Bearer YOUR_TOKEN"

# Check user bookings endpoint
curl http://localhost:3000/api/bookings/my -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Browser Console Tests

Open browser console (F12) and check:

```javascript
// Test if apiRequest is defined
console.log(typeof apiRequest); // Should return "function"

// Test if fetchEvents works
fetchEvents().then(events => console.log(events.length + " events loaded"));

// Check currentUser
console.log(currentUser); // Should show user object when logged in
```

---

## SQL Queries for Database Verification

```sql
-- Check organizer bookings
SELECT 
    b.BookingReference,
    b.TransactionId,
    b.PaymentStatus,
    e.Title AS EventTitle,
    u.Email AS UserEmail
FROM [Events].[Bookings] b
INNER JOIN [Events].[Events] e ON b.EventId = e.EventId
LEFT JOIN [Users].[Users] u ON b.UserId = u.UserId
WHERE e.OrganizerId = (SELECT OrganizerId FROM [Users].[Organizers] WHERE Email = 'organizer@eventhub.com')
ORDER BY b.CreatedAt DESC;

-- Check payment proof uploads
SELECT 
    BookingReference,
    TransactionId,
    PaymentStatus,
    CASE WHEN PaymentReceiptUrl IS NOT NULL THEN 'Yes' ELSE 'No' END AS HasReceipt
FROM [Events].[Bookings]
WHERE TransactionId IS NOT NULL;
```

---

## Success Criteria

All fixes are successful if:

- ✅ Organizers see appropriate error when trying to book own events
- ✅ Payment uploads appear in organizer dashboard with all details
- ✅ "My Events" section loads without errors and shows proper event cards
- ✅ No console errors during normal operation
- ✅ All buttons and links work as expected
