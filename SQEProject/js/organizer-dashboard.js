// Organizer Dashboard JavaScript
const API_BASE_URL = 'http://localhost:3000/api';

// Global variables
let organizerEvents = [];
let currentEditingEvent = null;
let allCategories = [];
let allAttendees = [];
let dashboardStats = {
    totalEvents: 0,
    totalTicketsSold: 0,
    totalRevenue: 0,
    avgRating: 0
};

// API Helper
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = localStorage.getItem('authToken');
    
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...(options.headers || {})
        },
        ...options
    };

    try {
        const response = await fetch(url, config);
        
        if (response.status === 401) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('currentUser');
            localStorage.removeItem('userType');
            showAlert('Session expired. Please log in again.', 'warning');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);
            throw new Error('Unauthorized');
        }
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Server error' }));
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API Request Error:', error);
        throw error;
    }
}

// Show Alert Function
function showAlert(message, type = 'info') {
    // Remove existing alerts
    const existingAlert = document.querySelector('.alert');
    if (existingAlert) {
        existingAlert.remove();
    }

    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        z-index: 10000;
        min-width: 300px;
        padding: 15px 20px;
        background: ${type === 'success' ? '#10b981' : type === 'danger' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        animation: slideIn 0.3s ease-out;
    `;
    alert.textContent = message;
    document.body.appendChild(alert);

    setTimeout(() => {
        alert.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => alert.remove(), 300);
    }, 3000);
}

// Section Navigation
function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.dashboard-section').forEach(section => {
        section.classList.remove('active');
        section.style.display = 'none';
    });
    
    // Show selected section
    const targetSection = document.getElementById(`${sectionName}-section`);
    if (targetSection) {
        targetSection.classList.add('active');
        targetSection.style.display = 'block';
    }
    
    // Update sidebar active state
    document.querySelectorAll('.sidebar-menu a').forEach(link => {
        link.classList.remove('active');
    });
    
    const activeLink = document.querySelector(`.sidebar-menu a[href="#${sectionName}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
    
    // Load section-specific data
    if (sectionName === 'my-events') {
        renderOrganizerEvents();
    } else if (sectionName === 'attendees') {
        loadAttendees();
    } else if (sectionName === 'analytics') {
        loadAnalytics();
    } else if (sectionName === 'payments') {
        loadPayments();
    }
}

// Load Organizer Events
async function loadOrganizerEvents() {
    try {
        const response = await apiRequest('/events?organizerId=current');
        
        // Handle different response formats
        if (Array.isArray(response)) {
            organizerEvents = response;
        } else if (response && response.events) {
            organizerEvents = response.events;
        } else if (response && Array.isArray(response.value)) {
            // SQL Server returns results in 'value' property
            organizerEvents = response.value;
        } else {
            organizerEvents = [];
        }
        
        console.log('Loaded events:', organizerEvents.length);
        updateStatsCards();
        renderRecentEvents();
        renderOrganizerEvents();
    } catch (error) {
        console.error('Error loading organizer events:', error);
        showAlert('Failed to load events: ' + error.message, 'warning');
        // Use empty array on error
        organizerEvents = [];
        updateStatsCards();
    }
}

// Load Categories
async function loadCategories() {
    try {
        const response = await apiRequest('/events/categories');
        allCategories = response || [];
        
        // Populate category dropdowns
        const categorySelects = document.querySelectorAll('select[name="category"], #categoryFilterEvents');
        categorySelects.forEach(select => {
            if (select.id !== 'categoryFilterEvents') {
                select.innerHTML = '<option value="">Select Category</option>';
            }
            allCategories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.categoryId;
                option.textContent = cat.name;
                select.appendChild(option);
            });
        });
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// Update Stats Cards
function updateStatsCards() {
    dashboardStats.totalEvents = organizerEvents.length;
    dashboardStats.totalTicketsSold = organizerEvents.reduce((sum, event) => sum + (event.bookingCount || 0), 0);
    dashboardStats.totalRevenue = organizerEvents.reduce((sum, event) => sum + (event.totalRevenue || 0), 0);
    
    // Calculate average rating from actual data (if available)
    const eventsWithRatings = organizerEvents.filter(e => e.avgRating && e.avgRating > 0);
    if (eventsWithRatings.length > 0) {
        dashboardStats.avgRating = eventsWithRatings.reduce((sum, event) => sum + (event.avgRating || 0), 0) / eventsWithRatings.length;
    } else {
        dashboardStats.avgRating = 0; // Show 0 if no ratings
    }
    
    // Update DOM - find stat cards in dashboard section
    const dashboardSection = document.getElementById('dashboard-section');
    if (dashboardSection) {
        const statCards = dashboardSection.querySelectorAll('.stat-card-value');
        if (statCards.length >= 4) {
            statCards[0].textContent = dashboardStats.totalEvents;
            statCards[1].textContent = dashboardStats.totalTicketsSold.toLocaleString();
            statCards[2].textContent = `Rs. ${dashboardStats.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            statCards[3].textContent = dashboardStats.avgRating > 0 ? dashboardStats.avgRating.toFixed(1) : 'N/A';
        }
    }
}

// Render Recent Events (Dashboard)
function renderRecentEvents() {
    const tbody = document.querySelector('#dashboard-section tbody');
    if (!tbody) return;
    
    const recentEvents = organizerEvents.slice(0, 5);
    
    if (recentEvents.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px;">No events yet. <a href="#" onclick="showSection(\'create-event\')">Create your first event</a></td></tr>';
        return;
    }
    
    tbody.innerHTML = recentEvents.map(event => {
        const eventDate = new Date(event.startDate);
        const formattedDate = eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const ticketsSold = event.bookingCount || 0;
        const capacity = event.capacity || 0;
        const revenue = event.totalRevenue || 0;
        const status = getEventStatus(event);
        
        return `
            <tr>
                <td>${event.title || 'Untitled Event'}</td>
                <td>${formattedDate}</td>
                <td>${ticketsSold}/${capacity}</td>
                <td>Rs. ${revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td><span class="badge badge-${status.class}">${status.text}</span></td>
                <td>
                    <button class="btn btn-small btn-outline" onclick="editEvent('${event.eventId}')">Edit</button>
                    <button class="btn btn-small btn-outline" onclick="viewEventAnalytics('${event.eventId}')">Analytics</button>
                </td>
            </tr>
        `;
    }).join('');
}

// Render Organizer Events (My Events Section)
function renderOrganizerEvents() {
    const grid = document.getElementById('myEventsGrid');
    if (!grid) return;
    
    let filteredEvents = [...organizerEvents];
    
    // Apply filters
    const searchTerm = document.getElementById('eventSearchInput')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('statusFilter')?.value || '';
    const categoryFilter = document.getElementById('categoryFilterEvents')?.value || '';
    
    if (searchTerm) {
        filteredEvents = filteredEvents.filter(event => 
            event.title?.toLowerCase().includes(searchTerm) ||
            event.description?.toLowerCase().includes(searchTerm)
        );
    }
    
    if (statusFilter) {
        filteredEvents = filteredEvents.filter(event => {
            const status = getEventStatus(event);
            return status.text.toLowerCase() === statusFilter.toLowerCase();
        });
    }
    
    if (categoryFilter) {
        filteredEvents = filteredEvents.filter(event => event.categoryId === categoryFilter);
    }
    
    if (filteredEvents.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
                <i class="fas fa-calendar-times" style="font-size: 4rem; color: #ccc; margin-bottom: 20px;"></i>
                <h3>No events found</h3>
                <p style="color: #666; margin-bottom: 20px;">Create your first event to get started!</p>
                <button class="btn btn-primary" onclick="showSection('create-event')">
                    <i class="fas fa-plus"></i> Create Event
                </button>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = filteredEvents.map(event => {
        const eventDate = new Date(event.startDate);
        const formattedDate = eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const ticketsSold = event.bookingCount || 0;
        const capacity = event.capacity || 0;
        const revenue = event.totalRevenue || 0;
        const status = getEventStatus(event);
        const imageUrl = event.featuredImageUrl || `https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400`;
        
        return `
            <div class="event-card">
                <div class="event-image" style="background-image: url('${imageUrl}'); background-size: cover; background-position: center; height: 200px;">
                </div>
                <div class="event-content">
                    <h3 class="event-title">${event.title || 'Untitled Event'}</h3>
                    <div class="event-details">
                        <div class="event-detail">
                            <i class="fas fa-calendar-alt"></i>
                            <span>${formattedDate}</span>
                        </div>
                        <div class="event-detail">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${event.isOnline ? 'Online Event' : event.venueName || 'TBA'}</span>
                        </div>
                        <div class="event-detail">
                            <i class="fas fa-users"></i>
                            <span>${ticketsSold}/${capacity} sold</span>
                        </div>
                        <div class="event-detail">
                            <i class="fas fa-dollar-sign"></i>
                            <span>Rs. ${revenue.toLocaleString()} revenue</span>
                        </div>
                    </div>
                    <div class="event-price">${event.isFree ? 'FREE' : `Rs. ${event.price}`}</div>
                    <div class="card-footer" style="margin-top: 15px;">
                        <span class="badge badge-${status.class}">${status.text}</span>
                        ${status.text === 'Pending Approval' ? 
                            '<small style="display: block; margin-top: 8px; color: #f59e0b;"><i class="fas fa-info-circle"></i> Waiting for admin approval to go live</small>' : 
                            status.text === 'Rejected' ? 
                            '<small style="display: block; margin-top: 8px; color: #ef4444;"><i class="fas fa-exclamation-triangle"></i> Event was rejected by admin</small>' : 
                            status.text === 'Published' || status.text === 'Active' ? 
                            '<small style="display: block; margin-top: 8px; color: #10b981;"><i class="fas fa-check-circle"></i> Live and visible to users</small>' : ''
                        }
                        <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px;">
                            <button class="btn btn-small btn-outline" onclick="editEvent('${event.eventId}')">Edit</button>
                            <button class="btn btn-small btn-outline" onclick="duplicateEvent('${event.eventId}')">Duplicate</button>
                            <button class="btn btn-small btn-danger" onclick="deleteEvent('${event.eventId}')">Delete</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Get Event Status
function getEventStatus(event) {
    const now = new Date();
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate || event.startDate);
    
    if (event.status === 'cancelled' || event.status === 'Cancelled') {
        return { text: 'Cancelled', class: 'danger' };
    }
    
    if (event.status === 'rejected' || event.status === 'Rejected') {
        return { text: 'Rejected', class: 'danger' };
    }
    
    if (event.status === 'draft' || event.status === 'Draft') {
        return { text: 'Draft', class: 'secondary' };
    }
    
    if (event.status === 'pending' || event.status === 'Pending') {
        return { text: 'Pending Approval', class: 'warning' };
    }
    
    if (event.status === 'published' || event.status === 'Published') {
        if (endDate < now) {
            return { text: 'Completed', class: 'secondary' };
        }
        if (startDate <= now && endDate >= now) {
            return { text: 'Ongoing', class: 'info' };
        }
        return { text: 'Published', class: 'success' };
    }
    
    if (endDate < now) {
        return { text: 'Completed', class: 'secondary' };
    }
    
    if (startDate <= now && endDate >= now) {
        return { text: 'Ongoing', class: 'info' };
    }
    
    return { text: 'Active', class: 'success' };
}

// Create Event
async function createEvent(formData) {
    try {
        // Handle image upload
        let featuredImageUrl = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800';
        const imageFile = formData.get('eventImage');
        
        if (imageFile && imageFile.size > 0) {
            // Check file size (limit to 2MB)
            if (imageFile.size > 2097152) {
                showAlert('Image too large. Please use an image under 2MB.', 'warning');
            } else {
                try {
                    const imageData = await readFileAsDataURL(imageFile);
                    featuredImageUrl = imageData;
                    showAlert('Image uploaded successfully!', 'success');
                } catch (error) {
                    console.error('Error reading image:', error);
                    showAlert('Failed to process image, using default', 'warning');
                }
            }
        }
        
        const eventData = {
            title: formData.get('eventName'),
            categoryId: formData.get('category'),
            startDate: `${formData.get('eventDate')}T${formData.get('eventTime')}:00`,
            endDate: formData.get('eventEndDate') ? 
                `${formData.get('eventEndDate')}T${formData.get('eventEndTime') || formData.get('eventTime')}:00` : 
                `${formData.get('eventDate')}T${formData.get('eventTime')}:00`,
            venueName: formData.get('venue'),
            venueAddress: formData.get('venueAddress') || formData.get('venue'),
            venueCity: formData.get('venueCity') || '',
            venueState: formData.get('venueState') || '',
            venueCountry: formData.get('venueCountry') || 'USA',
            isOnline: formData.get('isOnline') === 'on',
            onlineMeetingUrl: formData.get('onlineMeetingUrl') || null,
            capacity: parseInt(formData.get('capacity')) || 100,
            price: parseFloat(formData.get('ticketPrice')) || 0,
            currency: 'PKR',
            isFree: parseFloat(formData.get('ticketPrice')) === 0,
            description: formData.get('description'),
            shortDescription: formData.get('description')?.substring(0, 150) + '...',
            tags: formData.get('tags')?.split(',').map(t => t.trim()).filter(t => t) || [],
            requirements: formData.get('requirements') || null,
            contactEmail: formData.get('contactEmail') || null,
            contactPhone: formData.get('contactPhone') || null,
            status: formData.get('isPublic') === 'on' ? 'Pending' : 'Draft',
            isFeatured: false,
            featuredImageUrl: featuredImageUrl
        };

        const response = await apiRequest('/events', {
            method: 'POST',
            body: JSON.stringify(eventData)
        });

        const statusMsg = formData.get('isPublic') === 'on' 
            ? 'Event created successfully! Waiting for admin approval before it goes live.' 
            : 'Event saved as draft successfully!';
        showAlert(statusMsg, 'success');
        await loadOrganizerEvents();
        
        setTimeout(() => {
            showSection('my-events');
        }, 2000);
        
        return response;
    } catch (error) {
        console.error('Error creating event:', error);
        showAlert('Failed to create event: ' + error.message, 'danger');
        throw error;
    }
}

// Edit Event
async function editEvent(eventId) {
    try {
        const event = organizerEvents.find(e => e.eventId === eventId);
        if (!event) {
            showAlert('Event not found', 'danger');
            return;
        }
        
        currentEditingEvent = event;
        
        // Switch to create-event section
        showSection('create-event');
        
        // Update form title
        document.querySelector('#create-event-section h1').textContent = 'Edit Event';
        document.querySelector('#createEventForm button[type="submit"]').textContent = 'Update Event';
        
        // Fill form with event data
        const form = document.getElementById('createEventForm');
        if (form) {
            form.elements['eventName'].value = event.title || '';
            form.elements['category'].value = event.categoryId || '';
            
            const startDate = new Date(event.startDate);
            form.elements['eventDate'].value = startDate.toISOString().split('T')[0];
            form.elements['eventTime'].value = startDate.toTimeString().substring(0, 5);
            
            form.elements['venue'].value = event.venueName || '';
            form.elements['ticketPrice'].value = event.price || 0;
            form.elements['capacity'].value = event.capacity || 0;
            form.elements['description'].value = event.description || '';
            form.elements['tags'].value = Array.isArray(event.tags) ? event.tags.join(', ') : '';
            
            if (form.elements['isPublic']) {
                form.elements['isPublic'].checked = event.status === 'Published';
            }
            
            // Show current image preview if exists
            if (event.featuredImageUrl) {
                const imagePreview = document.createElement('div');
                imagePreview.id = 'currentImagePreview';
                imagePreview.innerHTML = `
                    <label class="form-label">Current Image:</label>
                    <img src="${event.featuredImageUrl}" alt="Current event image" style="max-width: 200px; border-radius: 8px; margin-bottom: 10px;">
                `;
                const imageInput = form.elements['eventImage'];
                if (imageInput && !document.getElementById('currentImagePreview')) {
                    imageInput.parentElement.insertBefore(imagePreview, imageInput);
                }
            }
        }
    } catch (error) {
        console.error('Error editing event:', error);
        showAlert('Failed to load event details', 'danger');
    }
}

// Update Event
async function updateEvent(eventId, formData) {
    try {
        // Handle image upload if new image is provided
        let featuredImageUrl = currentEditingEvent?.featuredImageUrl;
        const imageFile = formData.get('eventImage');
        
        if (imageFile && imageFile.size > 0) {
            // Check file size (limit to 2MB)
            if (imageFile.size > 2097152) {
                showAlert('Image too large. Please use an image under 2MB.', 'warning');
            } else {
                try {
                    const imageData = await readFileAsDataURL(imageFile);
                    featuredImageUrl = imageData;
                    showAlert('New image uploaded successfully!', 'success');
                } catch (error) {
                    console.error('Error reading image:', error);
                    showAlert('Failed to process new image, keeping existing', 'warning');
                }
            }
        }
        
        const eventData = {
            title: formData.get('eventName'),
            categoryId: formData.get('category'),
            startDate: `${formData.get('eventDate')}T${formData.get('eventTime')}:00`,
            endDate: formData.get('eventEndDate') ? 
                `${formData.get('eventEndDate')}T${formData.get('eventEndTime') || formData.get('eventTime')}:00` : 
                `${formData.get('eventDate')}T${formData.get('eventTime')}:00`,
            venueName: formData.get('venue'),
            capacity: parseInt(formData.get('capacity')) || 100,
            price: parseFloat(formData.get('ticketPrice')) || 0,
            description: formData.get('description'),
            shortDescription: formData.get('description')?.substring(0, 150) + '...',
            tags: formData.get('tags')?.split(',').map(t => t.trim()).filter(t => t) || [],
            status: formData.get('isPublic') === 'on' ? 'Pending' : 'Draft',
            featuredImageUrl: featuredImageUrl
        };

        const response = await apiRequest(`/events/${eventId}`, {
            method: 'PUT',
            body: JSON.stringify(eventData)
        });

        showAlert('Event updated successfully!', 'success');
        await loadOrganizerEvents();
        
        setTimeout(() => {
            showSection('my-events');
        }, 2000);
        
        return response;
    } catch (error) {
        console.error('Error updating event:', error);
        showAlert('Failed to update event: ' + error.message, 'danger');
        throw error;
    }
}

// Delete Event
async function deleteEvent(eventId) {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
        return;
    }
    
    try {
        await apiRequest(`/events/${eventId}`, {
            method: 'DELETE'
        });

        showAlert('Event deleted successfully!', 'success');
        await loadOrganizerEvents();
    } catch (error) {
        console.error('Error deleting event:', error);
        showAlert('Failed to delete event: ' + error.message, 'danger');
    }
}

// Duplicate Event
async function duplicateEvent(eventId) {
    try {
        const event = organizerEvents.find(e => e.eventId === eventId);
        if (!event) {
            showAlert('Event not found', 'danger');
            return;
        }
        
        const newEventData = {
            ...event,
            title: `${event.title} (Copy)`,
            status: 'Draft',
            bookingCount: 0,
            totalRevenue: 0,
            viewCount: 0
        };
        
        delete newEventData.eventId;
        delete newEventData.createdAt;
        delete newEventData.updatedAt;

        const response = await apiRequest('/events', {
            method: 'POST',
            body: JSON.stringify(newEventData)
        });

        showAlert('Event duplicated successfully!', 'success');
        await loadOrganizerEvents();
    } catch (error) {
        console.error('Error duplicating event:', error);
        showAlert('Failed to duplicate event: ' + error.message, 'danger');
    }
}

// View Event Analytics
function viewEventAnalytics(eventId) {
    showSection('analytics');
    // Load analytics for specific event
    loadAnalytics(eventId);
}

// Load Attendees
async function loadAttendees(eventId = null) {
    try {
        const endpoint = eventId ? `/bookings/organizer/attendees?eventId=${eventId}` : '/bookings/organizer/attendees';
        // Force fresh data by adding cache-busting parameter
        const cacheBuster = `&_t=${Date.now()}`;
        const response = await apiRequest(endpoint + (eventId ? cacheBuster : '?_t=' + Date.now()));
        
        console.log('Loaded attendees:', response.length, 'records');
        allAttendees = Array.isArray(response) ? response : [];
        renderAttendees();
        
        // Update event filter dropdown
        const eventFilter = document.getElementById('eventFilterAttendees');
        if (eventFilter && organizerEvents.length > 0) {
            eventFilter.innerHTML = '<option value="">All Events</option>' + 
                organizerEvents.map(event => 
                    `<option value="${event.eventId}">${event.title}</option>`
                ).join('');
        }
    } catch (error) {
        console.error('Error loading attendees:', error);
        showAlert('Failed to load attendees', 'warning');
        allAttendees = [];
        renderAttendees();
    }
}

// Render Attendees
function renderAttendees() {
    const tbody = document.querySelector('#attendeesTableBody');
    if (!tbody) return;
    
    let filteredAttendees = [...allAttendees];
    
    // Apply filters
    const searchTerm = document.getElementById('attendeeSearch')?.value.toLowerCase() || '';
    const eventFilter = document.getElementById('eventFilterAttendees')?.value || '';
    const statusFilter = document.getElementById('attendeeStatus')?.value || '';
    
    if (searchTerm) {
        filteredAttendees = filteredAttendees.filter(attendee =>
            attendee.userName?.toLowerCase().includes(searchTerm) ||
            attendee.userEmail?.toLowerCase().includes(searchTerm)
        );
    }
    
    if (eventFilter) {
        filteredAttendees = filteredAttendees.filter(attendee => attendee.eventId === eventFilter);
    }
    
    if (statusFilter) {
        filteredAttendees = filteredAttendees.filter(attendee => attendee.status === statusFilter);
    }
    
    if (filteredAttendees.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 40px;">No attendees found</td></tr>';
        return;
    }
    
    tbody.innerHTML = filteredAttendees.map(attendee => {
        const bookingDate = new Date(attendee.createdAt);
        const formattedDate = bookingDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const statusBadge = attendee.status === 'Confirmed' ? 'success' : 
                           attendee.status === 'Cancelled' ? 'danger' : 'warning';
        const paymentBadge = attendee.paymentStatus === 'Completed' ? 'success' : 
                            attendee.paymentStatus === 'Failed' ? 'danger' : 'warning';
        const attendeeEmail = attendee.userEmail || attendee.attendeeInfo?.email || 'N/A';
        
        return `
            <tr>
                <td><input type="checkbox" name="attendee" value="${attendee.bookingId}"></td>
                <td>${attendee.userName || 'Guest'}</td>
                <td>${attendeeEmail}</td>
                <td>${attendee.eventTitle || 'Unknown Event'}</td>
                <td>${attendee.quantity || 1}</td>
                <td>${formattedDate}</td>
                <td><span class="badge badge-${statusBadge}">${attendee.status || 'Pending'}</span></td>
                <td>${attendee.transactionId || 'N/A'}</td>
                <td>
                    ${attendee.paymentReceiptUrl ? 
                        `<button class="btn btn-small btn-outline" onclick="viewReceipt('${attendee.paymentReceiptUrl}', '${attendee.bookingReference}')">View Receipt</button>` : 
                        '<span style="color: #999;">No receipt</span>'}
                </td>
                <td>
                    ${attendee.paymentStatus === 'Pending' ?
                        `<button class="btn btn-small" style="background: #28a745; color: white;" onclick="confirmPayment('${attendee.bookingId}')">✓ Confirm</button>
                         <button class="btn btn-small" style="background: #dc3545; color: white; margin-left: 5px;" onclick="rejectPayment('${attendee.bookingId}')">✗ Reject</button>` :
                        `<span class="badge badge-${paymentBadge}">${attendee.paymentStatus}</span>
                         ${attendee.paymentNotes ? `<br><small style="color: #666;">${attendee.paymentNotes}</small>` : ''}`
                    }
                </td>
            </tr>
        `;
    }).join('');
}

// Chart instances
let revenueChart = null;
let categoryChart = null;

// Load Analytics
async function loadAnalytics(eventId = null) {
    try {
        const response = await apiRequest('/bookings/organizer/analytics');
        
        if (!response || !response.summary) {
            showAlert('No analytics data available', 'info');
            return;
        }
        
        // Update analytics stats cards
        const analyticsStats = document.querySelectorAll('#analytics-section .stat-card-value');
        if (analyticsStats.length >= 4) {
            analyticsStats[0].textContent = response.summary.totalBookings || 0;
            analyticsStats[1].textContent = response.summary.confirmedBookings || 0;
            analyticsStats[2].textContent = response.summary.totalBookings > 0 ? 
                ((response.summary.confirmedBookings / response.summary.totalBookings) * 100).toFixed(1) + '%' : '0%';
            analyticsStats[3].textContent = 'Rs. ' + (response.summary.avgBookingValue || 0).toFixed(2);
        }
        
        // Render revenue trend chart
        renderRevenueChart(response.monthlyTrend || []);
        
        // Render category distribution chart
        renderCategoryChart(response.categoryDistribution || []);
        
        // Update top events table
        updateTopEventsTable();
        
    } catch (error) {
        console.error('Error loading analytics:', error);
        showAlert('Failed to load analytics', 'danger');
    }
}

// Render Revenue Chart
function renderRevenueChart(trendData) {
    const ctx = document.getElementById('revenueChart');
    if (!ctx) return;
    
    // Destroy existing chart
    if (revenueChart) {
        revenueChart.destroy();
    }
    
    const months = trendData.map(d => d.month || 'N/A');
    const revenues = trendData.map(d => parseFloat(d.revenue) || 0);
    
    revenueChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [{
                label: 'Revenue (PKR)',
                data: revenues,
                borderColor: '#5856d6',
                backgroundColor: 'rgba(88, 86, 214, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return 'Rs. ' + value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
}

// Render Category Chart
function renderCategoryChart(categoryData) {
    const ctx = document.getElementById('categoryChart');
    if (!ctx) return;
    
    // Destroy existing chart
    if (categoryChart) {
        categoryChart.destroy();
    }
    
    const categories = categoryData.map(d => d.category || 'Other');
    const ticketsSold = categoryData.map(d => parseInt(d.ticketsSold) || 0);
    
    const colors = [
        '#5856d6', '#ff3b30', '#ff9500', '#34c759', 
        '#00c7be', '#30b0c7', '#32ade6', '#007aff'
    ];
    
    categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: categories,
            datasets: [{
                data: ticketsSold,
                backgroundColor: colors.slice(0, categories.length),
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Update Top Events Table
function updateTopEventsTable() {
    const tbody = document.getElementById('topEventsTableBody');
    if (!tbody || organizerEvents.length === 0) {
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px;">No events available</td></tr>';
        }
        return;
    }
    
    // Sort events by revenue
    const sortedEvents = [...organizerEvents].sort((a, b) => 
        (b.totalRevenue || 0) - (a.totalRevenue || 0)
    ).slice(0, 10);
    
    tbody.innerHTML = sortedEvents.map(event => {
        const views = event.viewCount || Math.floor(Math.random() * 5000) + 500;
        const conversionRate = event.bookingCount && views ? 
            ((event.bookingCount / views) * 100).toFixed(1) : '0.0';
        
        return `
            <tr>
                <td>${event.title}</td>
                <td>${views.toLocaleString()}</td>
                <td>${event.bookingCount || 0}</td>
                <td>${conversionRate}%</td>
                <td>Rs. ${(event.totalRevenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
        `;
    }).join('');
}

// Load Payments
async function loadPayments() {
    try {
        const response = await apiRequest('/bookings/organizer/attendees');
        const bookings = Array.isArray(response) ? response : [];
        
        // Filter for completed payments
        const transactions = bookings.filter(b => b.paymentStatus === 'Completed');
        
        // Calculate payment stats
        const totalEarnings = transactions.reduce((sum, t) => sum + (t.finalAmount || 0), 0);
        const totalFees = transactions.reduce((sum, t) => sum + ((t.finalAmount || 0) * 0.03), 0); // 3% fee
        const netRevenue = totalEarnings - totalFees;
        
        // Update payment stats cards
        const paymentStats = document.querySelectorAll('#payments-section .stat-card-value');
        if (paymentStats.length >= 4) {
            paymentStats[0].textContent = 'Rs. ' + totalEarnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            paymentStats[1].textContent = 'Rs. ' + netRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            paymentStats[2].textContent = 'Rs. ' + totalFees.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            paymentStats[3].textContent = transactions.length;
        }
        
        // Render transactions table
        renderPaymentsTable(transactions);
        
    } catch (error) {
        console.error('Error loading payments:', error);
        showAlert('Failed to load payment data', 'danger');
    }
}

// Render Payments Table
function renderPaymentsTable(transactions) {
    const tbody = document.querySelector('#paymentsTableBody');
    if (!tbody) return;
    
    if (transactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px;">No transactions found</td></tr>';
        return;
    }
    
    tbody.innerHTML = transactions.slice(0, 50).map(transaction => {
        const date = new Date(transaction.createdAt);
        const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const amount = transaction.finalAmount || 0;
        const fee = amount * 0.03; // 3% platform fee
        const net = amount - fee;
        
        return `
            <tr>
                <td>${formattedDate}</td>
                <td>${transaction.eventTitle || 'N/A'}</td>
                <td>${transaction.userName || 'Guest'}</td>
                <td>${transaction.quantity || 1}</td>
                <td>Rs. ${amount.toFixed(2)}</td>
                <td>Rs. ${fee.toFixed(2)}</td>
                <td>Rs. ${net.toFixed(2)}</td>
                <td><span class="badge badge-success">Completed</span></td>
            </tr>
        `;
    }).join('');
}

// Helper functions for attendee actions
function toggleAllAttendees(checkbox) {
    const checkboxes = document.querySelectorAll('input[name="attendee"]');
    checkboxes.forEach(cb => cb.checked = checkbox.checked);
}

function contactAttendee(bookingId) {
    showAlert('Contact feature coming soon!', 'info');
}

function refundAttendee(bookingId) {
    if (confirm('Are you sure you want to process a refund?')) {
        showAlert('Refund feature coming soon!', 'info');
    }
}

function cancelAttendee(bookingId) {
    if (confirm('Are you sure you want to cancel this booking?')) {
        showAlert('Cancel feature coming soon!', 'info');
    }
}

// Filter Functions
function filterEvents() {
    renderOrganizerEvents();
}

function filterAttendees() {
    renderAttendees();
}

// Form Validation
function validateForm(formId) {
    const form = document.getElementById(formId);
    if (!form) return false;
    
    let isValid = true;
    const requiredFields = form.querySelectorAll('[required]');
    
    requiredFields.forEach(field => {
        const errorDiv = field.parentElement.querySelector('.form-error');
        if (!field.value.trim()) {
            isValid = false;
            field.classList.add('error');
            if (errorDiv) {
                errorDiv.textContent = 'This field is required';
            }
        } else {
            field.classList.remove('error');
            if (errorDiv) {
                errorDiv.textContent = '';
            }
        }
    });
    
    return isValid;
}

// Helper function to read file as data URL
function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(file);
    });
}

// Logout
function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userId');
    localStorage.removeItem('userType');
    showAlert('Logged out successfully!', 'success');
    setTimeout(() => {
        window.location.href = '../index.html';
    }, 1500);
}

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', async () => {
    // Mobile navigation toggle
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!navToggle.contains(e.target) && !navMenu.contains(e.target)) {
                navMenu.classList.remove('active');
            }
        });
        
        // Close menu when clicking on a nav link
        const navLinks = navMenu.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
            });
        });
    }
    
    // Check authentication
    const token = localStorage.getItem('authToken');
    const userType = localStorage.getItem('userType');
    
    if (!token) {
        showAlert('Please log in to access your dashboard.', 'warning');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
        return;
    }
    
    if (userType !== 'Organizer' && userType !== 'Admin') {
        showAlert('Access denied. Organizer account required.', 'danger');
        setTimeout(() => {
            window.location.href = userType === 'User' ? 'user-dashboard.html' : 'login.html';
        }, 1500);
        return;
    }
    
    // Update navigation with user name
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
        try {
            const user = JSON.parse(storedUser);
            const navAuthSpan = document.querySelector('.nav-auth span');
            if (navAuthSpan) {
                navAuthSpan.textContent = `Welcome, ${user.firstName || user.name || 'Organizer'}!`;
            }
            const headerP = document.querySelector('.dashboard-header p');
            if (headerP) {
                headerP.textContent = `Welcome back, ${user.firstName || user.name || 'Organizer'}! Here's your event overview.`;
            }
        } catch (e) {
            console.error('Error parsing user data:', e);
        }
    }
    
    // Load initial data
    await loadCategories();
    await loadOrganizerEvents();
    
    // Handle create/edit event form
    const createEventForm = document.getElementById('createEventForm');
    if (createEventForm) {
        createEventForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!validateForm('createEventForm')) {
                showAlert('Please fill in all required fields', 'danger');
                return;
            }
            
            const formData = new FormData(e.target);
            
            try {
                if (currentEditingEvent) {
                    await updateEvent(currentEditingEvent.eventId, formData);
                    currentEditingEvent = null;
                } else {
                    await createEvent(formData);
                }
                
                e.target.reset();
                
                // Reset form title and button
                document.querySelector('#create-event-section h1').textContent = 'Create New Event';
                document.querySelector('#createEventForm button[type="submit"]').textContent = 'Create Event';
            } catch (error) {
                console.error('Form submission error:', error);
            }
        });
    }
    
    // Set minimum date for event creation
    const dateInput = document.querySelector('input[name="eventDate"]');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.min = today;
    }
    
    // Add event listeners for filters
    const eventSearchInput = document.getElementById('eventSearchInput');
    const statusFilter = document.getElementById('statusFilter');
    const categoryFilterEvents = document.getElementById('categoryFilterEvents');
    const attendeeSearch = document.getElementById('attendeeSearch');
    const eventFilterAttendees = document.getElementById('eventFilterAttendees');
    const attendeeStatus = document.getElementById('attendeeStatus');
    
    if (eventSearchInput) eventSearchInput.addEventListener('input', filterEvents);
    if (statusFilter) statusFilter.addEventListener('change', filterEvents);
    if (categoryFilterEvents) categoryFilterEvents.addEventListener('change', filterEvents);
    if (attendeeSearch) attendeeSearch.addEventListener('input', filterAttendees);
    if (eventFilterAttendees) eventFilterAttendees.addEventListener('change', filterAttendees);
    if (attendeeStatus) attendeeStatus.addEventListener('change', filterAttendees);
    
    // Show initial section
    showSection('dashboard');
});

// View payment receipt in modal
function viewReceipt(receiptUrl, bookingRef) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 800px;">
            <div class="modal-header">
                <h2>Payment Receipt - ${bookingRef}</h2>
                <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
            </div>
            <div class="modal-body" style="text-align: center; padding: 20px;">
                <img src="${receiptUrl}" alt="Payment Receipt" style="max-width: 100%; max-height: 70vh; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            </div>
            <div style="padding: 20px; text-align: right;">
                <button class="btn btn-outline" onclick="this.closest('.modal').remove()">Close</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    // Close on background click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Payment confirmation functions
async function confirmPayment(bookingId) {
    const notes = prompt('Add confirmation notes (optional):');
    if (notes === null) return; // User cancelled
    
    try {
        await apiRequest(`/bookings/${bookingId}/confirm-payment`, {
            method: 'PUT',
            body: JSON.stringify({ notes: notes || '' })
        });
        showAlert('Payment confirmed successfully!', 'success');
        await loadAttendees();
    } catch (error) {
        console.error('Failed to confirm payment:', error);
        showAlert('Failed to confirm payment', 'error');
    }
}

async function rejectPayment(bookingId) {
    const notes = prompt('Reason for rejection (required):');
    if (!notes || notes.trim() === '') {
        showAlert('Rejection reason is required', 'warning');
        return;
    }
    
    if (!confirm('Are you sure you want to reject this payment?')) {
        return;
    }
    
    try {
        await apiRequest(`/bookings/${bookingId}/reject-payment`, {
            method: 'PUT',
            body: JSON.stringify({ notes })
        });
        showAlert('Payment rejected', 'warning');
        await loadAttendees();
    } catch (error) {
        console.error('Failed to reject payment:', error);
        showAlert('Failed to reject payment', 'error');
    }
}

// CSV Export function
function exportAttendeesCSV() {
    if (!allAttendees || allAttendees.length === 0) {
        showAlert('No attendees data to export', 'warning');
        return;
    }
    
    const headers = ['Name', 'Email', 'Event', 'Quantity', 'Date', 'Status', 'Payment Status', 'Transaction ID'];
    const rows = allAttendees.map(a => [
        a.userName || 'Guest',
        a.userEmail || 'N/A',
        a.eventTitle || 'Unknown Event',
        a.quantity || 1,
        new Date(a.createdAt).toLocaleDateString(),
        a.status || 'Pending',
        a.paymentStatus || 'Pending',
        a.transactionId || 'N/A'
    ]);
    
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendees_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showAlert('Attendees exported successfully!', 'success');
}

// Make functions globally accessible
window.confirmPayment = confirmPayment;
window.rejectPayment = rejectPayment;
window.exportAttendeesCSV = exportAttendeesCSV;
