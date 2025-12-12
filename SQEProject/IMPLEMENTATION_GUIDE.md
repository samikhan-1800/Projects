# CRITICAL FIXES IMPLEMENTATION GUIDE

## Priority Issues & Quick Fixes

### 1. HOME PAGE - Shows Only One Event ❌ CRITICAL

**File:** `js/main.js`  
**Function:** `loadFeaturedEvents()`  
**Current Issue:** Only displays `events[0]` (first event)
**Fix:** Change to display ALL published events

**Location:** Search for `loadFeaturedEvents` in main.js
**Change:**
```javascript
// OLD (showing only first event):
const eventCards = events.slice(0, 1).map(event => ...).join('');

// NEW (show all events):
const eventCards = events.map(event => EventCardGenerator.create(event, {
    showBookButton: true,
    isFromPagesFolder: false
})).join('');
```

### 2. PAYMENT SYSTEM - Manual Verification ⚠️ HIGH PRIORITY

**Current Flow:** Assumes Stripe/automated payment  
**New Flow:** User uploads proof → Organizer confirms manually

#### Backend Changes Required:

**File:** `backend/routes/bookings.js`

**A. Modify POST /bookings (Line ~130):**
```javascript
// Add these fields to booking creation:
TransactionId, PaymentReceiptUrl, PaymentNotes

// Change status logic:
Status: 'Pending',  // Was 'Confirmed' 
PaymentStatus: event.IsFree ? 'Completed' : 'Pending'
```

**B. Add New Endpoints:**
```javascript
// Confirm payment (organizers only)
router.put('/:id/confirm-payment', authenticateToken, async (req, res) => {
    const { notes } = req.body;
    const bookingId = req.params.id;
    
    await database.query(`
        UPDATE [Events].[Bookings] 
        SET Status = 'Confirmed',
            PaymentStatus = 'Completed',
            PaymentConfirmedAt = GETUTCDATE(),
            PaymentConfirmedBy = @userId,
            PaymentNotes = @notes,
            UpdatedAt = GETUTCDATE()
        WHERE BookingId = @bookingId
    `, { bookingId, userId: req.user.userId, notes });
    
    res.json({ message: 'Payment confirmed' });
});

// Reject payment
router.put('/:id/reject-payment', authenticateToken, async (req, res) => {
    const { notes } = req.body;
    const bookingId = req.params.id;
    
    await database.query(`
        UPDATE [Events].[Bookings]
        SET Status = 'Cancelled',
            PaymentStatus = 'Failed',
            PaymentNotes = @notes,
            UpdatedAt = GETUTCDATE()
        WHERE BookingId = @bookingId
    `, { bookingId, notes });
    
    res.json({ message: 'Payment rejected', notes });
});
```

#### Frontend Changes Required:

**File:** `js/organizer-dashboard.js`  
**Function:** `renderAttendees()`

**Add to table columns:**
```javascript
<td>${attendee.transactionId || 'N/A'}</td>
<td>
    ${attendee.paymentReceiptUrl ? 
        `<a href="${attendee.paymentReceiptUrl}" target="_blank">View Receipt</a>` : 
        'No receipt'}
</td>
<td>
    ${attendee.paymentStatus === 'Pending' ?
        `<button onclick="confirmPayment('${attendee.bookingId}')">Confirm</button>
         <button onclick="rejectPayment('${attendee.bookingId}')">Reject</button>` :
        `<span class="badge badge-${attendee.paymentStatus === 'Completed' ? 'success' : 'danger'}">${attendee.paymentStatus}</span>`
    }
</td>
```

**Add functions:**
```javascript
async function confirmPayment(bookingId) {
    const notes = prompt('Add confirmation notes (optional):');
    await apiRequest(`/bookings/${bookingId}/confirm-payment`, {
        method: 'PUT',
        body: JSON.stringify({ notes })
    });
    await loadAttendees();
    showAlert('Payment confirmed successfully', 'success');
}

async function rejectPayment(bookingId) {
    const notes = prompt('Reason for rejection:');
    if (!notes) return;
    await apiRequest(`/bookings/${bookingId}/reject-payment`, {
        method: 'PUT',
        body: JSON.stringify({ notes })
    });
    await loadAttendees();
    showAlert('Payment rejected', 'warning');
}
```

### 3. PROFILE SECTIONS - Wrong Fields ⚠️ MEDIUM

**Issue:** Forms use non-existent database columns

**Files to Update:**
- `pages/user-dashboard.html`
- `pages/organizer-dashboard.html`  
- `pages/admin-dashboard.html`

**Correct Schema (Users table):**
- ✅ FirstName
- ✅ LastName  
- ✅ Email
- ✅ Phone (NOT PhoneNumber)
- ✅ Bio
- ✅ Website
- ✅ AvatarUrl
- ❌ Remove: Address, City, State, Zip (not in Users table)

**Search & Replace in all dashboards:**
```html
<!-- OLD -->
<input name="phoneNumber">

<!-- NEW -->
<input name="phone">
```

### 4. HARDCODED ANALYTICS ⚠️ MEDIUM

**File:** `js/organizer-dashboard.js`
**Functions:** `loadAnalytics()`, `loadAttendees()`

**Current Issues:**
- Fake numbers: views (1,245), clicks (856)
- Hardcoded graph data

**Fixes:**
- Use `event.viewCount` from database
- Use real `bookingCount`, `totalRevenue` from Events table
- Remove all placeholder numbers

**Backend Addition:**
```javascript
// Track event views
router.put('/:id/increment-view', async (req, res) => {
    await database.query(`
        UPDATE [Events].[Events]
        SET ViewCount = ISNULL(ViewCount, 0) + 1
        WHERE EventId = @eventId
    `, { eventId: req.params.id });
    res.json({ success: true });
});
```

**Frontend (event-detail page):**
```javascript
// Add to loadEventDetails():
await apiRequest(`/events/${eventId}/increment-view`, { method: 'PUT' });
```

### 5. ORGANIZERS BOOKING OWN EVENTS ⚠️ LOW

**Issue:** Role-based restrictions prevent organizers from booking

**File:** `backend/routes/bookings.js`
**Line:** Remove any checks like:
```javascript
// REMOVE THIS:
if (req.user.role === 'Organizer' && event.OrganizerId === req.user.organizerId) {
    return res.status(403).json({ error: 'Cannot book your own events' });
}
```

### 6. REPORT EXPORTS ℹ️ NICE-TO-HAVE

**Add to organizer dashboard:**

```javascript
function exportAttendeesCSV() {
    const csv = [
        ['Name', 'Email', 'Event', 'Quantity', 'Date', 'Status', 'Transaction ID'].join(','),
        ...allAttendees.map(a => [
            a.userName,
            a.userEmail,
            a.eventTitle,
            a.quantity,
            new Date(a.createdAt).toLocaleDateString(),
            a.status,
            a.transactionId || 'N/A'
        ].join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendees_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
}
```

## IMPLEMENTATION ORDER

1. **NOW:** Fix home page (shows only 1 event) - 5 min fix
2. **NEXT:** Add payment confirmation endpoints (backend) - 20 min
3. **THEN:** Update attendees table UI (frontend) - 15 min
4. **AFTER:** Fix profile forms - 10 min per dashboard
5. **FINALLY:** Analytics real data - 30 min

## TESTING CHECKLIST

- [ ] Home page shows all published events
- [ ] User can book event with transaction ID + receipt
- [ ] Booking status = Pending after creation
- [ ] Organizer sees pending payments in attendees
- [ ] Organizer can confirm/reject payments
- [ ] Confirmed booking shows as "Confirmed" 
- [ ] Profile forms save correctly
- [ ] Organizers can book their own events
- [ ] Analytics show real numbers (no hardcode)

## FILES TO MODIFY (Summary)

**Backend:**
1. `/backend/routes/bookings.js` - Payment confirmation endpoints + modify POST
2. `/backend/routes/events.js` - Add view tracking endpoint

**Frontend:**
3. `/js/main.js` - Fix home page event display  
4. `/js/organizer-dashboard.js` - Payment review UI + real analytics
5. `/pages/user-dashboard.html` - Fix profile form fields
6. `/pages/organizer-dashboard.html` - Fix profile form fields
7. `/pages/admin-dashboard.html` - Fix profile form fields

---

**Would you like me to implement these changes one by one, starting with the critical home page fix?**
