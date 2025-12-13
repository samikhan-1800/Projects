# EventHub - Class Diagram Entities & Attributes

## Complete List of Entities and Their Attributes

---

## 1. User
**Schema:** Users.Users

### Attributes:
- `UserId`: UNIQUEIDENTIFIER (PK)
- `Email`: NVARCHAR(255) (Unique, Not Null)
- `PasswordHash`: NVARCHAR(255) (Not Null)
- `Salt`: NVARCHAR(255) (Not Null)
- `FirstName`: NVARCHAR(100) (Not Null)
- `LastName`: NVARCHAR(100) (Not Null)
- `Role`: NVARCHAR(50) (Not Null, Default: 'User')
  - Values: 'User', 'Organizer', 'Admin'
- `Status`: NVARCHAR(50) (Not Null, Default: 'Active')
  - Values: 'Active', 'Inactive', 'Suspended', 'Banned', 'Pending'
- `EmailVerified`: BIT (Not Null, Default: 0)
- `Phone`: NVARCHAR(20)
- `AvatarUrl`: NVARCHAR(500)
- `Bio`: NVARCHAR(MAX)
- `Website`: NVARCHAR(255)
- `TwoFactorEnabled`: BIT (Not Null, Default: 0)
- `EmailVerificationToken`: NVARCHAR(255)
- `PasswordResetToken`: NVARCHAR(255)
- `PasswordResetExpires`: DATETIME2
- `LastLoginAt`: DATETIME2
- `LoginAttempts`: INT (Not Null, Default: 0)
- `LockedUntil`: DATETIME2
- `CreatedAt`: DATETIME2 (Not Null, Default: GETUTCDATE())
- `UpdatedAt`: DATETIME2 (Not Null, Default: GETUTCDATE())

### Methods:
- `register(email, password, firstName, lastName, role)`: User
- `login(email, password)`: Token
- `logout()`: Boolean
- `verifyEmail(token)`: Boolean
- `resetPassword(token, newPassword)`: Boolean
- `requestPasswordReset(email)`: Boolean
- `updateProfile(firstName, lastName, phone, bio, website)`: User
- `changePassword(oldPassword, newPassword)`: Boolean
- `getProfile()`: User
- `getStats()`: Statistics
- `getFavorites()`: Event[]
- `getReviews()`: Review[]
- `addToFavorites(eventId)`: Boolean
- `removeFromFavorites(eventId)`: Boolean
- `uploadAvatar(file)`: String (URL)
- `lockAccount()`: Boolean
- `unlockAccount()`: Boolean
- `incrementLoginAttempts()`: Integer
- `resetLoginAttempts()`: Boolean

### Relationships:
- Has Many: UserSessions
- Has Many: Bookings
- Has Many: Reviews
- Has Many: Notifications
- Has One: Organizer (if Role = 'Organizer')
- Has Many: AuditLogs

---

## 2. UserSession
**Schema:** Users.UserSessions

### Attributes:
- `SessionId`: UNIQUEIDENTIFIER (PK)
- `UserId`: UNIQUEIDENTIFIER (FK → Users.UserId, Not Null)
- `RefreshToken`: NVARCHAR(500) (Not Null)
- `DeviceInfo`: NVARCHAR(MAX)
- `IpAddress`: NVARCHAR(45)
- `UserAgent`: NVARCHAR(MAX)
- `IsActive`: BIT (Not Null, Default: 1)
- `ExpiresAt`: DATETIME2 (Not Null)
- `CreatedAt`: DATETIME2 (Not Null, Default: GETUTCDATE())

### Methods:
- `create(userId, refreshToken, deviceInfo)`: UserSession
- `validate(token)`: Boolean
- `refresh(refreshToken)`: Token
- `revoke(sessionId)`: Boolean
- `revokeAll(userId)`: Boolean
- `cleanup()`: Integer (deleted count)
- `isExpired()`: Boolean
- `extend(duration)`: Boolean

### Relationships:
- Belongs To: User (CASCADE DELETE)

---

## 3. Organizer
**Schema:** Users.Organizers

### Attributes:
- `OrganizerId`: UNIQUEIDENTIFIER (PK)
- `UserId`: UNIQUEIDENTIFIER (FK → Users.UserId, Unique, Not Null)
- `OrganizationName`: NVARCHAR(255) (Not Null)
- `OrganizationType`: NVARCHAR(100)
- `BusinessLicense`: NVARCHAR(100)
- `TaxId`: NVARCHAR(50)
- `VerificationStatus`: NVARCHAR(50) (Not Null, Default: 'Pending')
  - Values: 'Pending', 'UnderReview', 'Verified', 'Rejected'
- `VerificationDocuments`: NVARCHAR(MAX)
- `VMethods:
- `create(userId, organizationName)`: Organizer
- `updateProfile(organizationName, organizationType, businessLicense)`: Organizer
- `submitForVerification(documents)`: Boolean
- `verify()`: Boolean
- `reject(notes)`: Boolean
- `getEvents()`: Event[]
- `getAnalytics()`: AnalyticsData
- `getRevenue()`: RevenueData
- `getAttendees(eventId)`: Booking[]
- `getTransactions()`: Transaction[]
- `updateCommissionRate(rate)`: Boolean
- `calculateRevenue()`: Decimal
- `updateAverageRating()`: Decimal

### erificationNotes`: NVARCHAR(MAX)
- `CommissionRate`: DECIMAL(5,2) (Not Null, Default: 12.80)
- `TotalRevenue`: DECIMAL(15,2) (Not Null, Default: 0)
- `TotalEvents`: INT (Not Null, Default: 0)
- `AverageRating`: DECIMAL(3,2)
- `ReviewCount`: INT (Not Null, Default: 0)
- `IsVerified`: BIT (Not Null, Default: 0)
- `CreatedAt`: DATETIME2 (Not Null, Default: GETUTCDATE())
- `UpdatedAt`: DATETIME2 (Not Null, Default: GETUTCDATE())

### Relationships:
- Belongs To: User (CASCADE DELETE)
- Has Many: Events
- Has Many: Transactions

---Methods:
- `create(name, description, iconClass, color)`: Category
- `update(description, iconClass, color, isActive)`: Category
- `delete()`: Boolean
- `getAll()`: Category[]
- `getActive()`: Category[]
- `getById(categoryId)`: Category
- `activate()`: Boolean
- `deactivate()`: Boolean
- `updateSortOrder(sortOrder)`: Boolean
- `getEventCount()`: Integer

### 

## 4. Category
**Schema:** Events.Categories

### Attributes:
- `CategoryId`: UNIQUEIDENTIFIER (PK)
- `Name`: NVARCHAR(100) (Unique, Not Null)
- `Description`: NVARCHAR(500)
- `IconClass`: NVARCHAR(100)
- `Color`: NVARCHAR(7)
- `IsActive`: BIT (Not Null, Default: 1)
- `SortOrder`: INT (Not Null, Default: 0)
- `CreatedAt`: DATETIME2 (Not Null, Default: GETUTCDATE())

### Relationships:
- Has Many: Events

---

## 5. Event
**Schema:** Events.Events

### Attributes:
- `EventId`: UNIQUEIDENTIFIER (PK)
- `OrganizerId`: UNIQUEIDENTIFIER (FK → Organizers.OrganizerId, Not Null)
- `CategoryId`: UNIQUEIDENTIFIER (FK → Categories.CategoryId, Not Null)
- `Title`: NVARCHAR(255) (Not Null)
- `Slug`: NVARCHAR(255) (Unique, Not Null)
- `Description`: NVARCHAR(MAX)
- `ShortDescription`: NVARCHAR(500)
- `Status`: NVARCHAR(50) (Not Null, Default: 'Draft')
  - Values: 'Draft', 'Pending', 'Approved', 'Published', 'Cancelled', 'Completed', 'Rejected'

#### Date/Time Fields:
- `StartDate`: DATETIME2 (Not Null)
- `EndDate`: DATETIME2
- `Timezone`: NVARCHAR(50) (Not Null, Default: 'UTC')
- `RegistrationStartDate`: DATETIME2
- `RegistrationEndDate`: DATETIME2

#### Location Fields:
- `IsOnline`: BIT (Not Null, Default: 0)
- `VenueName`: NVARCHAR(255)
- `VenueAddress`: NVARCHAR(MAX)
- `VenueCity`: NVARCHAR(100)
- `VenueState`: NVARCHAR(100)
- `VenueCountry`: NVARCHAR(100)
- `VenuePostalCode`: NVARCHAR(20)
- `OnlineMeetingUrl`: NVARCHAR(500)

#### Pricing and Capacity:
- `Capacity`: INT
- `Price`: DECIMAL(10,2) (Not Null, Default: 0.00)
- `Currency`: NVARCHAR(3) (Not Null, Default: 'PKR')
- `IsFree`: BIT (Not Null, Default: 0)
- `AllowWaitlist`: BIT (Not Null, Default: 1)
- `MaxTicketsPerUser`: INT (Default: 10)

#### Media:
- `FeaturedImageUrl`: NVARCHAR(500)
- `GalleryImages`: NVARCHAR(MAX)
- `VideoUrl`: NVARCHAR(500)

####Methods:
- `create(organizerId, categoryId, title, description, startDate)`: Event
- `update(title, description, startDate, endDate, venue, price)`: Event
- `delete()`: Boolean
- `publish()`: Boolean
- `approve(adminId)`: Boolean
- `reject(adminId, reason)`: Boolean
- `cancel()`: Boolean
- `complete()`: Boolean
- `getById(eventId)`: Event
- `getAll(filters)`: Event[]
- `search(query)`: Event[]
- `filterByCategory(categoryId)`: Event[]
- `filterByPrice(min, max)`: Event[]
- `filterByDate(startDate, endDate)`: Event[]
- `incrementViewCount()`: Boolean
- `incrementBookingCount(quantity)`: Boolean
- `addRevenue(amount)`: Boolean
- `checkAvailability()`: Integer
- `isFull()`: Boolean
- `isExpired()`: Boolean
- `canBook()`: Boolean
- `feature()`: Boolean
- `unfeature()`: Boolean
- `getReviews()`: Review[]
- `getBookings()`: Booking[]
- `getTickets()`: EventTicket[]
- `calculateAverageRating()`: Decimal
- `generateSlug(title)`: String

###  Additional Info:
- `Tags`: NVARCHAR(MAX)
- `Requirements`: NVARCHAR(MAX)
- `ContactEmail`: NVARCHAR(255)
- `ContactPhone`: NVARCHAR(20)

#### Statistics:
- `ViewCount`: INT (Not Null, Default: 0)
- `BookingCount`: INT (Not Null, Default: 0)
- `TotalRevenue`: DECIMAL(15,2) (Not Null, Default: 0)
- `AverageRating`: DECIMAL(3,2)
- `ReviewCount`: INT (Not Null, Default: 0)

####Methods:
- `create(eventId, name, description, price, quantity)`: EventTicket
- `update(name, description, price, quantity)`: EventTicket
- `delete()`: Boolean
- `activate()`: Boolean
- `deactivate()`: Boolean
- `incrementQuantitySold(quantity)`: Boolean
- `checkAvailability()`: Integer
- `isAvailable()`: Boolean
- `isSaleActive()`: Boolean
- `getById(ticketId)`: EventTicket
- `getByEvent(eventId)`: EventTicket[]

###  Features:
- `IsFeatured`: BIT (Not Null, Default: 0)
- `IsPrivate`: BIT (Not Null, Default: 0)
- `RequiresApproval`: BIT (Not Null, Default: 0)

#### Admin Fields:
- `ApprovedBy`: UNIQUEIDENTIFIER (FK → Users.UserId)
- `ApprovedAt`: DATETIME2

#### Timestamps:
- `CreatedAt`: DATETIME2 (Not Null, Default: GETUTCDATE())
- `UpdatedAt`: DATETIME2 (Not Null, Default: GETUTCDATE())
- `PublishedAt`: DATETIME2

### Relationships:
- Belongs To: Organizer (CASCADE DELETE)
- Belongs To: Category
- Belongs To: User (ApprovedBy)
- Has Many: EventTickets
- Has Many: Bookings
- Has Many: Reviews

---

## 6. EventTicket
**Schema:** Events.EventTickets

### Attributes:
- `TicketId`: UNIQUEIDENTIFIER (PK)
- `EventId`: UNIQUEIDENTIFIER (FK → Events.EventId, Not Null)
- `Name`: NVARCHAR(100) (Not Null)
- `Description`: NVARCHAR(500)
- `Price`: DECIMAL(10,2) (Not Null, Default: 0.00)
- `Quantity`: INT (Not Null)
- `QuantitySold`: INT (Not Null, Default: 0)
- `MaxPerUser`: INT (Default: 10)
- `SaleStartDate`: DATETIME2
- `SaleEndDate`: DATETIME2
- `IsActive`: BIT (Not Null, Default: 1)
- `SortOrder`: INT (Not Null, Default: 0)
- `CreatedAt`: DATETIME2 (Not Null, Default: GETUTCDATE())

### Relationships:
- Belongs To: Event (CASCADE DELETE)
- Has Many: Bookings

---

## 7. Booking
**Schema:** Events.Bookings

### Methods:
- `create(eventId, userId, quantity, attendeeInfo)`: Booking
- `confirm()`: Boolean
- `cancel()`: Boolean
- `refund()`: Boolean
- `checkIn(userId)`: Boolean
- `getById(bookingId)`: Booking
- `getByReference(reference)`: Booking
- `getByUser(userId)`: Booking[]
- `getByEvent(eventId)`: Booking[]
- `getByOrganizer(organizerId)`: Booking[]
- `uploadReceipt(receiptUrl, transactionId)`: Boolean
- `confirmPayment()`: Boolean
- `rejectPayment(reason)`: Boolean
- `calculateTotal()`: Decimal
- `calculatePlatformFee()`: Decimal
- `calculateFinalAmount()`: Decimal
- `generateReference()`: String
- `generateQrCode()`: String
- `isExpired()`: Boolean
- `canCancel()`: Boolean
- `canCheckIn()`: Boolean
- `applyPromoCode(code)`: Boolean

### Attributes:
- `BookingId`: UNIQUEIDENTIFIER (PK)
- `EventId`: UNIQUEIDENTIFIER (FK → Events.EventId, Not Null)
- `TicketId`: UNIQUEIDENTIFIER (FK → EventTickets.TicketId)
- `UserId`: UNIQUEIDENTIFIER (FK → Users.UserId)
- `BookingReference`: NVARCHAR(20) (Unique, Not Null)

#### Booking Details:
- `Quantity`: INT (Not Null, Default: 1)
- `UnitPrice`: DECIMAL(10,2) (Not Null)
- `TotalPrice`: DECIMAL(10,2) (Not Null)
- `PlatformFee`: DECIMAL(10,2) (Not Null, Default: 0.00)
- `TaxAmount`: DECIMAL(10,2) (Not Null, Default: 0.00)
- `DiscountAmount`: DECIMAL(10,2) (Not Null, Default: 0.00)
- `FinalAmount`: DECIMAL(10,2) (Not Null)
- `Currency`: NVARCHAR(3) (Not Null, Default: 'PKR')

#### Status:
- `Status`: NVARCHAR(50) (Not Null, Default: 'Pending')
  - Values: 'Pending', 'Confirmed', 'Cancelled', 'Refunded', 'CheckedIn', 'NoShow'
- `PaymentStatus`: NVARCHAR(50) (Not Null, Default: 'Pending')
  - Values: 'Pending', 'Processing', 'Completed', 'Failed', 'Refunded'

#### Attendee Information:
- `AttendeeInfo`: NVARCHAR(MAX) (Not Null)
- `SpecialRequests`: NVARCHAR(MAX)
- `PromoCode`: NVARCHAR(50)

#### Check-in:
- `QrCode`: NVARCHAR(255) (Unique)
- `CheckedInAt`: DATETIME2
- `CheckedInBy`: UNIQUEIDENTIFIER (FK → Users.UserId)

#### Payment Details:
- `PMethods:
- `create(eventId, userId, rating, title, content)`: Review
- `update(rating, title, content)`: Review
- `delete()`: Boolean
- `publish()`: Boolean
- `hide()`: Boolean
- `flag(reason)`: Boolean
- `markHelpful()`: Boolean
- `getById(reviewId)`: Review
- `getByEvent(eventId)`: Review[]
- `getByUser(userId)`: Review[]
- `getByRating(rating)`: Review[]
- `isVerifiedPurchase()`: Boolean
- `canEdit(userId)`: Boolean
- `canDelete(userId)`: Boolean

### aymentIntentId`: NVARCHAR(255)
- `PaymentMethod`: NVARCHAR(50)
- `PaymentGateway`: NVARCHAR(50)

#### Timestamps:
- `CreatedAt`: DATETIME2 (Not Null, Default: GETUTCDATE())
- `UpdatedAt`: DATETIME2 (Not Null, Default: GETUTCDATE())
- `ExpiresAt`: DATETIME2

### Relationships:
- Belongs To: Event (CASCADE DELETE)
- Belongs To: EventTicket
- Belongs To: User
- Belongs To: User (CheckedInBy)
- Has Many: Transactions
- Has Many: Reviews

---

## 8. Review
**Schema:** Events.Reviews

### Attributes:
- `ReviewId`: UNIQUEIDENTIFIER (PK)
- `EventId`: UNIQUEIDENTIFIER (FK → Events.EventId, Not Null)
- `UserId`: UNIQUEIDENTIFIER (FK → Users.UserId)
- `BookingId`: UNIQUEIDENTIFIER (FK → Bookings.BookingId)
- `Rating`: INT (Not Null, CHECK: 1-5)
- `Title`: NVARCHAR(255)
- `Content`: NVARCHAR(MAX)
- `HelpfulCount`: INT (Not Null, Default: 0)
- `Status`: NVARCHAR(50) (Not Null, Default: 'Published')
  - Values: 'Published', 'Hidden', 'Flagged', 'Pending'
- `IsVerifiedPurchase`: BIT (Not Null, Default: 0)
- `CreatedAt`: DATETIME2 (Not Null, Default: GETUTCDATE())
- `UMethods:
- `create(bookingId, organizerId, userId, type, amount)`: Transaction
- `process()`: Boolean
- `complete()`: Boolean
- `fail(reason)`: Boolean
- `cancel()`: Boolean
- `refund()`: Transaction
- `getById(transactionId)`: Transaction
- `getByBooking(bookingId)`: Transaction[]
- `getByOrganizer(organizerId)`: Transaction[]
- `getByUser(userId)`: Transaction[]
- `getByType(type)`: Transaction[]
- `getByStatus(status)`: Transaction[]
- `calculatePlatformFee()`: Decimal
- `calculateNetAmount()`: Decimal

### pdatedAt`: DATETIME2 (Not Null, Default: GETUTCDATE())

### Relationships:
- Belongs To: Event (CASCADE DELETE)
- Belongs To: User
- Belongs To: Booking

---

## 9. Transaction
**Schema:** Payments.Transactions

### Attributes:
- `TransactionId`: UNIQUEIDENTIFIER (PK)
- `BookingId`: UNIQUEIDENTIFIER (FK → Bookings.BookingId)
- `OrganizerId`: UNIQUEIDENTIFIER (FK → Organizers.OrganizerId)
- `UserId`: UNIQUEIDENTIFIER (FK → Users.UserId)
- `Type`: NVARCHAR(50) (Not Null)
  - Values: 'Payment', 'Refund', 'Payout', 'Fee'
- `Status`: NVARCHAR(50) (Not Null, Default: 'Pending')
  - Values: 'Pending', 'Processing', 'Completed', 'Failed', 'Cancelled'
- `Amount`: DECIMAL(15,2) (Not Null)
- `Currency`: NVARCHAR(3) (Not Null, Default: 'PKR')
- `PlatformFee`: DECIMAL(15,2) (Not Null, Default: 0.00)
- `NetAmount`: DECIMAL(15,2) (Not Null)

#### Payment Gateway Info:
- `PaymentGateway`: NVARCHAR(50)
- `GatewayTransactionId`: NVARCHAR(255)
- `GatewayResponse`: NVARCHAR(MAX)

#### Additional Info:
- `Description`: NVARCHAR(500)
- `FMethods:
- `create(userId, type, title, message, priority)`: Notification
- `markAsRead()`: Boolean
- `markAllAsRead(userId)`: Boolean
- `delete()`: Boolean
- `send()`: Boolean
- `getById(notificationId)`: Notification
- `getByUser(userId)`: Notification[]
- `getUnread(userId)`: Notification[]
- `getByType(type)`: Notification[]
- `getByPriority(priority)`: Notification[]
- `isExpired()`: Boolean
- `cleanup()`: Integer

### ailureReason`: NVARCHAR(500)

#### Timestamps:
- `ProcessedAt`: DATETIME2
- `CreatedAt`: DATETIME2 (Not Null, Default: GETUTCDATE())
- `UpdatedAt`: DATETIME2 (Not Null, Default: GETUTCDATE())

### Methods:
- `create(category, key, value, dataType)`: Setting
- `update(value)`: Setting
- `get(category, key)`: Setting
- `getByCategory(category)`: Setting[]
- `getPublic()`: Setting[]
- `delete()`: Boolean
- `parseValue()`: Any
- `validateDataType()`: Boolean

### Relationships:
- Belongs To: Booking
- Belongs To: Organizer
- Belongs To: User

---

## 10. Notification
**Schema:** System.Notifications

### Attributes:
- `NotificationId`: UNIQUEIDENTIFIER (PK)
- `UserId`: UNIQUEIDENTIFIER (FK → Users.UserId, Not Null)
- `Type`: NVARCHAR(100) (Not Null)
- `Title`: NVARCHAR(255) (Not Null)
- `Message`: NVARCHAR(MAX) (Not Null)
- `Data`: NVARCHAR(MAX)
- `IsRead`: BIT (Not Null, Default: 0)
- `EmailSent`: BIT (Not Null, Default: 0)
- `Priority`: NVARCHAR(20) (Not Null, Default: 'Normal')
  - Values: 'Low', 'Normal', 'High', 'Urgent'
- `ExpiresAt`: DATETIME2
- `ActionUrl`: NVARCHAR(500)
- `CreatedAt`: DATETIME2 (Not Null, Default: GETUTCDATE())

### Relationships:
- BeMethods:
- `create(userId, action, tableName, recordId, oldValues, newValues)`: AuditLog
- `getById(logId)`: AuditLog
- `getByUser(userId)`: AuditLog[]
- `getByAction(action)`: AuditLog[]
- `getByTable(tableName)`: AuditLog[]
- `getByRecord(tableName, recordId)`: AuditLog[]
- `getByDateRange(startDate, endDate)`: AuditLog[]
- `cleanup(retentionDays)`: Integer

### longs To: User (CASCADE DELETE)

---

## 11. Setting
**Schema:** System.Settings

### Attributes:
- `SettingId`: UNIQUEIDENTIFIER (PK)
- `Category`: NVARCHAR(50) (Not Null)
- `Key`: NVARCHAR(100) (Not Null)
- `Value`: NVARCHAR(MAX)
- `DataType`: NVARCHAR(20) (Not Null, Default: 'String')
  - Values: 'String', 'Number', 'Boolean', 'JSON'
- `Description`: NVARCHAR(500)
- `IsPublic`: BIT (Not Null, Default: 0)
- `UpdatedBy`: UNIQUEIDENTIFIER (FK → Users.UserId)
- `CreatedAt`: DATETIME2 (Not Null, Default: GETUTCDATE())
- `UpdatedAt`: DATETIME2 (Not Null, Default: GETUTCDATE())

### Relationships:
- Belongs To: User (UpdatedBy)

---

## 12. AuditLog
**Schema:** System.AuditLog

### Attributes:
- `LogId`: UNIQUEIDENTIFIER (PK)
- `UserId`: UNIQUEIDENTIFIER (FK → Users.UserId)
- `Action`: NVARCHAR(100) (Not Null)
- `TableName`: NVARCHAR(100)
- `RecordId`: UNIQUEIDENTIFIER
- `OldValues`: NVARCHAR(MAX)
- `NewValues`: NVARCHAR(MAX)
- `IpAddress`: NVARCHAR(45)
- `UserAgent`: NVARCHAR(MAX)
- `CreatedAt`: DATETIME2 (Not Null, Default: GETUTCDATE())

### Relationships:
- Belongs To: User

---

## Relationship Summary

### One-to-Many Relationships:
1. **User → UserSessions** (1:N)
2. **User → Bookings** (1:N)
3. **User → Reviews** (1:N)
4. **User → Notifications** (1:N)
5. **User → AuditLogs** (1:N)
6. **Organizer → Events** (1:N)
7. **Organizer → Transactions** (1:N)
8. **Category → Events** (1:N)
9. **Event → EventTickets** (1:N)
10. **Event → Bookings** (1:N)
11. **Event → Reviews** (1:N)
12. **EventTicket → Bookings** (1:N)
13. **Booking → Transactions** (1:N)

### One-to-One Relationships:
1. **User → Organizer** (1:1, Optional)

### Many-to-One Relationships:
1. **UserSessions → User** (N:1)
2. **Organizer → User** (1:1)
3. **Events → Organizer** (N:1)
4. **Events → Category** (N:1)
5. **Events → User** (ApprovedBy, N:1)
6. **EventTickets → Event** (N:1)
7. **Bookings → Event** (N:1)
8. **Bookings → EventTicket** (N:1)
9. **Bookings → User** (N:1)
10. **Reviews → Event** (N:1)
11. **Reviews → User** (N:1)
12. **Reviews → Booking** (N:1)
13. **Transactions → Booking** (N:1)
14. **Transactions → Organizer** (N:1)
15. **Transactions → User** (N:1)
16. **Notifications → User** (N:1)
17. **Settings → User** (UpdatedBy, N:1)
18. **AuditLogs → User** (N:1)

---

## Cascade Rules

### DELETE CASCADE:
- **User** deleted → UserSessions, Bookings (user), Reviews (user), Notifications, Organizer all deleted
- **Organizer** deleted → Events all deleted
- **Event** deleted → EventTickets, Bookings (event), Reviews (event) all deleted
- **EventTicket** deleted → Bookings (ticket) set NULL

### SET NULL:
- **EventTicket** deleted → Bookings.TicketId set to NULL
- **User** (CheckedInBy) deleted → Bookings.CheckedInBy set to NULL

---

## Enumerations (Constrained Values)

### User.Role:
- User
- Organizer
- Admin

### User.Status:
- Active
- Inactive
- Suspended
- Banned
- Pending

### Organizer.VerificationStatus:
- Pending
- UnderReview
- Verified
- Rejected

### Event.Status:
- Draft
- Pending
- Approved
- Published
- Cancelled
- Completed
- Rejected

### Booking.Status:
- Pending
- Confirmed
- Cancelled
- Refunded
- CheckedIn
- NoShow

### Booking.PaymentStatus:
- Pending
- Processing
- Completed
- Failed
- Refunded

### Review.Status:
- Published
- Hidden
- Flagged
- Pending

### Transaction.Type:
- Payment
- Refund
- Payout
- Fee

### Transaction.Status:
- Pending
- Processing
- Completed
- Failed
- Cancelled

### Notification.Priority:
- Low
- Normal
- High
- Urgent

### Setting.DataType:
- String
- Number
- Boolean
- JSON

---

## Views (Virtual Entities)

### EventSummaryView
**Schema:** Analytics.EventSummaryView

#### Attributes:
- `EventId`: UNIQUEIDENTIFIER
- `Title`: NVARCHAR(255)
- `Status`: NVARCHAR(50)
- `StartDate`: DATETIME2
- `EndDate`: DATETIME2
- `Price`: DECIMAL(10,2)
- `Capacity`: INT
- `CategoryName`: NVARCHAR(100)
- `OrganizationName`: NVARCHAR(255)
- `OrganizerName`: NVARCHAR(201) (Computed: FirstName + LastName)
- `BookingCount`: INT
- `TotalRevenue`: DECIMAL(15,2)
- `ViewCount`: INT
- `AverageRating`: DECIMAL(3,2)
- `ReviewCount`: INT
- `CreatedAt`: DATETIME2
- `PublishedAt`: DATETIME2

### BookingSummaryView
**Schema:** Analytics.BookingSummaryView

#### Attributes:
- `BookingId`: UNIQUEIDENTIFIER
- `BookingReference`: NVARCHAR(20)
- `Status`: NVARCHAR(50)
- `PaymentStatus`: NVARCHAR(50)
- `Quantity`: INT
- `FinalAmount`: DECIMAL(10,2)
- `Currency`: NVARCHAR(3)
- `CreatedAt`: DATETIME2
- `EventTitle`: NVARCHAR(255)
- `EventStartDate`: DATETIME2
- `CustomerName`: NVARCHAR(201) (Computed: FirstName + LastName)
- `CustomerEmail`: NVARCHAR(255)

---

## Stored Procedures (Business Logic)

### CreateBooking
**Schema:** Events.CreateBooking

#### Input Parameters:
- `@EventId`: UNIQUEIDENTIFIER
- `@TicketId`: UNIQUEIDENTIFIER (Optional)
- `@UserId`: UNIQUEIDENTIFIER (Optional)
- `@Quantity`: INT
- `@AttendeeInfo`: NVARCHAR(MAX)

#### Output:
- `BookingId`: UNIQUEIDENTIFIER
- `BookingReference`: NVARCHAR(20)

#### Business Logic:
- Generates booking reference (EH + 6-digit number)
- Calculates platform fee (12.8%)
- Generates QR code
- Updates event booking count
- Updates ticket quantity sold

### CheckInAttendee
**Schema:** Events.CheckInAttendee

#### Input Parameters:
- `@QrCode`: NVARCHAR(255)
- `@CheckedInBy`: UNIQUEIDENTIFIER

#### Output:
- Message: 'Check-in successful'
- `BookingId`: UNIQUEIDENTIFIER

#### Business Logic:
- Validates QR code
- Checks booking confirmation status
- Prevents duplicate check-ins
- Updates booking status to CheckedIn

---

## Indexes

### User Table:
- IX_Users_Email (Email)
- IX_Users_Role (Role)
- IX_Users_Status (Status)

### UserSessions Table:
- IX_UserSessions_UserId (UserId)
- IX_UserSessions_ExpiresAt (ExpiresAt)

### Organizer Table:
- IX_Organizers_UserId (UserId)
- IX_Organizers_VerificationStatus (VerificationStatus)

### Category Table:
- IX_Categories_Name (Name)
- IX_Categories_IsActive (IsActive)

### Event Table:
- IX_Events_OrganizerId (OrganizerId)
- IX_Events_CategoryId (CategoryId)
- IX_Events_Status (Status)
- IX_Events_StartDate (StartDate)
- IX_Events_IsFeatured (IsFeatured)

### EventTicket Table:
- IX_EventTickets_EventId (EventId)
- IX_EventTickets_IsActive (IsActive)

### Booking Table:
- IX_Bookings_EventId (EventId)
- IX_Bookings_UserId (UserId)
- IX_Bookings_Status (Status)
- IX_Bookings_QrCode (QrCode)

### Review Table:
- IX_Reviews_EventId (EventId)
- IX_Reviews_UserId (UserId)
- IX_Reviews_Rating (Rating)

### Transaction Table:
- IX_Transactions_BookingId (BookingId)
- IX_Transactions_Type (Type)
- IX_Transactions_Status (Status)

### Notification Table:
- IX_Notifications_UserId (UserId)
- IX_Notifications_Type (Type)
- IX_Notifications_IsRead (IsRead)

### Setting Table:
- IX_Settings_Category (Category)

### AuditLog Table:
- IX_AuditLog_UserId (UserId)
- IX_AuditLog_Action (Action)
- IX_AuditLog_CreatedAt (CreatedAt)

---

## Unique Constraints

1. **Users.Email** - UNIQUE
2. **Users.UserId** in Organizers - UNIQUE
3. **Events.Slug** - UNIQUE
4. **Bookings.BookingReference** - UNIQUE
5. **Bookings.QrCode** - UNIQUE
6. **Categories.Name** - UNIQUE
7. **Settings (Category + Key)** - UNIQUE COMPOSITE

---

**Total Entities:** 12 Main Tables + 2 Views = 14 Entities
**Total Attributes:** 200+ attributes across all entities
**Total Relationships:** 18 Foreign Key relationships
**Total Stored Procedures:** 2 business logic procedures
**Total Indexes:** 30+ indexes for query optimization
