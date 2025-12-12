/**
 * EventHub Main JavaScript
 * Uses shared utilities from utils.js
 */

// Ensure utils.js is loaded
if (typeof EventHubConfig === 'undefined') {
    console.warn('utils.js not loaded. Some features may not work properly.');
}

// API Configuration - use shared config or fallback
const API_BASE_URL = (typeof EventHubConfig !== 'undefined') ? 
    EventHubConfig.API_BASE_URL : 'http://localhost:3000/api';

// Global data stores
let events = [];
let currentUser = null;
let userBookings = [];

// DOM Elements
const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');
const featuredEventsContainer = document.getElementById('featuredEvents');

// Navigation Toggle
if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });
}

// Close mobile menu when clicking on a link
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('nav-link')) {
        if (navMenu) navMenu.classList.remove('active');
    }
});

// API Helper Functions - uses ApiHelper from utils.js if available
async function apiRequest(endpoint, options = {}) {
    // Use shared ApiHelper if available
    if (typeof ApiHelper !== 'undefined') {
        return ApiHelper.request(endpoint, options);
    }
    
    // Fallback implementation
    const url = `${API_BASE_URL}${endpoint}`;
    const token = localStorage.getItem('authToken');
    
    // Define public endpoints that don't require authentication
    const publicEndpoints = ['/events', '/events/categories', '/contact', '/auth/login', '/auth/register'];
    const isPublicEndpoint = publicEndpoints.some(pe => endpoint === pe || endpoint.startsWith(pe + '/') || endpoint.startsWith(pe + '?'));
    
    const config = {
        headers: {
            'Content-Type': 'application/json',
            // Only send auth header for non-public endpoints or if explicitly needed
            ...((token && !isPublicEndpoint) && { 'Authorization': `Bearer ${token}` }),
            ...(options.headers || {})
        },
        ...options
    };
    
    // If options explicitly wants auth, include the token
    if (options.requireAuth && token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    try {
        const response = await fetch(url, config);
        
        // Handle different status codes
        if (response.status === 500) {
            const errorData = await response.json().catch(() => ({ error: 'Internal server error' }));
            console.error('Server Error 500:', errorData);
            throw new Error(errorData.error || 'Server error occurred. Please try again later.');
        }
        
        if (response.status === 401) {
            // Only clear auth and redirect for authenticated endpoints
            // Don't logout user just because they're browsing public pages
            if (!isPublicEndpoint) {
                console.warn('Session expired for authenticated endpoint:', endpoint);
                localStorage.removeItem('authToken');
                localStorage.removeItem('currentUser');
                localStorage.removeItem('userId');
                localStorage.removeItem('userType');
                
                // Only show alert and redirect if user was trying to access protected content
                if (!window.location.pathname.includes('login.html') && 
                    !window.location.pathname.includes('events.html') &&
                    !window.location.pathname.includes('index.html')) {
                    showAlert('Session expired. Please log in again.', 'warning');
                    setTimeout(() => window.location.href = 'login.html', 2000);
                }
            }
            throw new Error('Unauthorized');
        }
        
        if (response.status === 403) {
            throw new Error('Access forbidden. You do not have permission.');
        }
        
        if (response.status === 404) {
            throw new Error('Resource not found.');
        }
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
            console.error(`API Error ${response.status}:`, errorData);
            throw new Error(errorData.error || errorData.details || `Request failed with status ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API request failed:', error);
        
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            showAlert('Cannot connect to server. Please ensure the backend is running.', 'danger');
        } else if (error.message !== 'Unauthorized') {
            // Don't show alert for unauthorized since we already handle that
            showAlert(error.message || 'Request failed. Please try again.', 'danger');
        }
        throw error;
    }
}

// Data fetching functions
async function fetchEvents() {
    try {
        console.log('Fetching events from:', `${API_BASE_URL}/events`);
        events = await apiRequest('/events');
        console.log('Successfully fetched events:', events.length);
        
        // Store events in localStorage as backup
        if (events && events.length > 0) {
            localStorage.setItem('cachedEvents', JSON.stringify(events));
        }
        
        return events;
    } catch (error) {
        console.error('Failed to fetch events:', error);
        
        // Try to load from cache if API fails
        const cached = localStorage.getItem('cachedEvents');
        if (cached) {
            console.log('Loading events from cache');
            events = JSON.parse(cached);
            return events;
        }
        
        return [];
    }
}

async function fetchCurrentUser() {
    try {
        const token = localStorage.getItem('authToken');
        if (!token) {
            return null;
        }
        currentUser = await apiRequest('/auth/me', { requireAuth: true });
        return currentUser;
    } catch (error) {
        console.error('Failed to fetch current user:', error);
        // Don't immediately remove token - it might be a network issue
        // Only remove if it's definitely an auth error
        if (error.message === 'Unauthorized') {
            localStorage.removeItem('authToken');
            localStorage.removeItem('currentUser');
            localStorage.removeItem('userId');
            localStorage.removeItem('userType');
        }
        return null;
    }
}

async function fetchUserBookings() {
    try {
        userBookings = await apiRequest('/bookings/my');
        return userBookings;
    } catch (error) {
        console.error('Failed to fetch user bookings:', error);
        return [];
    }
}

// Load Featured Events on Home Page
async function loadFeaturedEvents() {
    if (featuredEventsContainer) {
        try {
            featuredEventsContainer.innerHTML = '<div class="text-center"><i class="fas fa-spinner fa-spin"></i> Loading events...</div>';
            
            const allEvents = await fetchEvents();
            console.log('Loaded events for home page:', allEvents.length);
            
            // Filter for published events only
            const publishedEvents = allEvents.filter(event => {
                // Check if event is published and in the future
                const eventDate = new Date(event.startDate);
                const now = new Date();
                return eventDate > now;
            });
            
            console.log('Published future events:', publishedEvents.length);
            
            // Show all published future events (up to 9 for grid layout)
            let eventsToShow = publishedEvents.slice(0, 9);
            
            // If no published future events, show recent events
            if (eventsToShow.length === 0) {
                console.log('No published future events, showing recent events');
                eventsToShow = allEvents.filter(e => e.status === 'Published').slice(0, 9);
            }
            
            // If still no events, show any events (for testing)
            if (eventsToShow.length === 0) {
                console.log('No published events, showing all events');
                eventsToShow = allEvents.slice(0, 9);
            }
            
            if (eventsToShow.length > 0) {
                featuredEventsContainer.innerHTML = eventsToShow.map(event => createEventCard(event, true)).join('');
            } else {
                featuredEventsContainer.innerHTML = `
                    <div class="text-center" style="grid-column: 1/-1;">
                        <i class="fas fa-calendar-times" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
                        <p>No events available at the moment.</p>
                        <p>Check back soon for exciting upcoming events!</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Failed to load featured events:', error);
            featuredEventsContainer.innerHTML = `
                <div class="text-center text-danger" style="grid-column: 1/-1;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                    <p>Unable to load events. Please check your connection and try again.</p>
                    <button class="btn btn-primary" onclick="loadFeaturedEvents()">Retry</button>
                </div>
            `;
        }
    }
}

// Create Event Card HTML - uses EventCardGenerator from utils.js if available
function createEventCard(event, isFeatured = false) {
    // Use shared EventCardGenerator if available
    if (typeof EventCardGenerator !== 'undefined') {
        return EventCardGenerator.create(event, { 
            showBookButton: !isFeatured,
            isFromPagesFolder: false // Home page is in root
        });
    }
    
    // Fallback implementation
    const formattedDate = (typeof DateHelper !== 'undefined') ? 
        DateHelper.formatDate(event.startDate) :
        new Date(event.startDate).toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

    const formattedTime = (typeof DateHelper !== 'undefined') ?
        DateHelper.formatTime(event.startDate) :
        new Date(event.startDate).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });

    const availableSeats = event.capacity - (event.bookingCount || 0);
    const categoryIcon = (typeof UIHelper !== 'undefined') ? 
        UIHelper.getCategoryIcon(event.categoryName) : 'calendar-alt';
    
    const eventImage = event.featuredImageUrl ? 
        `<img src="${event.featuredImageUrl}" alt="${event.title}" onerror="this.style.display='none'; this.parentNode.innerHTML='<i class=\\'fas fa-${categoryIcon}\\'></i>'" />` : 
        `<i class="fas fa-${categoryIcon}"></i>`;

    return `
        <div class="event-card">
            <div class="event-image">
                ${eventImage}
            </div>
            <div class="event-content">
                <h3 class="event-title">${event.title}</h3>
                <div class="event-details">
                    <div class="event-detail">
                        <i class="fas fa-calendar-alt"></i>
                        <span>${formattedDate}</span>
                    </div>
                    <div class="event-detail">
                        <i class="fas fa-clock"></i>
                        <span>${formattedTime}</span>
                    </div>
                    <div class="event-detail">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${event.isOnline ? 'Online Event' : (event.venueName || 'TBA')}</span>
                    </div>
                    <div class="event-detail">
                        <i class="fas fa-users"></i>
                        <span>${availableSeats}/${event.capacity} available</span>
                    </div>
                </div>
                <div class="event-price">
                    ${event.isFree || event.price === 0 ? 'Free' : `$${event.price}`}
                </div>
                <div class="card-footer">
                    ${isFeatured ? 
                        `<a href="pages/event-detail.html?id=${event.eventId}" class="btn btn-primary">View Details</a>` :
                        `<a href="pages/event-detail.html?id=${event.eventId}" class="btn btn-outline btn-small">View Details</a>
                         <button onclick="bookEvent('${event.eventId}')" class="btn btn-primary" ${availableSeats <= 0 ? 'disabled' : ''}>
                             ${availableSeats <= 0 ? 'Sold Out' : 'Book Now'}
                         </button>`
                    }
                </div>
            </div>
        </div>
    `;
}

// Modal Functions
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
});

// Form Validation
function validateForm(formId) {
    const form = document.getElementById(formId);
    if (!form) return false;

    let isValid = true;
    const requiredFields = form.querySelectorAll('[required]');

    requiredFields.forEach(field => {
        const errorElement = field.parentNode.querySelector('.form-error');
        
        if (!field.value.trim()) {
            field.classList.add('error');
            if (errorElement) {
                errorElement.textContent = `${field.dataset.label || field.name} is required`;
            }
            isValid = false;
        } else {
            field.classList.remove('error');
            if (errorElement) {
                errorElement.textContent = '';
            }
        }
    });

    // Email validation
    const emailFields = form.querySelectorAll('input[type="email"]');
    emailFields.forEach(field => {
        if (field.value && !isValidEmail(field.value)) {
            field.classList.add('error');
            const errorElement = field.parentNode.querySelector('.form-error');
            if (errorElement) {
                errorElement.textContent = 'Please enter a valid email address';
            }
            isValid = false;
        }
    });

    // Password confirmation
    const passwordField = form.querySelector('input[name="password"]');
    const confirmPasswordField = form.querySelector('input[name="confirmPassword"]');
    
    if (passwordField && confirmPasswordField && passwordField.value !== confirmPasswordField.value) {
        confirmPasswordField.classList.add('error');
        const errorElement = confirmPasswordField.parentNode.querySelector('.form-error');
        if (errorElement) {
            errorElement.textContent = 'Passwords do not match';
        }
        isValid = false;
    }

    return isValid;
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Quick book from event card
function quickBookEvent(eventId) {
    if (!currentUser) {
        showAlert('Please log in to book events.', 'warning');
        setTimeout(() => {
            window.location.href = window.location.pathname.includes('pages/') ? 'login.html' : 'pages/login.html';
        }, 1500);
        return;
    }
    
    // Redirect to event detail page for booking
    const detailUrl = window.location.pathname.includes('pages/') ? 
        `event-detail.html?id=${eventId}` : 
        `pages/event-detail.html?id=${eventId}`;
    window.location.href = detailUrl;
}

// Event Booking
async function bookEvent(eventId, ticketQuantity = 1, attendeeInfo = {}, transactionId = '', paymentReceiptUrl = '') {
    if (!currentUser) {
        showAlert('Please log in to book events.', 'warning');
        const loginUrl = window.location.pathname.includes('pages/') ? 'login.html' : 'pages/login.html';
        setTimeout(() => window.location.href = loginUrl, 1500);
        return;
    }

    try {
        const bookingData = {
            eventId,
            quantity: ticketQuantity,
            attendeeInfo,
            transactionId: transactionId || '',
            paymentReceiptUrl: paymentReceiptUrl || ''
        };

        const result = await apiRequest('/bookings', {
            method: 'POST',
            body: JSON.stringify(bookingData)
        }).catch(error => {
            // Handle specific error for organizer booking own event
            if (error.message && error.message.includes('own event')) {
                throw new Error('As an organizer, you cannot book your own events.');
            }
            // Handle duplicate booking error
            if (error.message && error.message.includes('already booked')) {
                throw new Error('You have already booked this event. Check your booking history.');
            }
            throw error;
        });

        showAlert(`Booking created successfully! Reference: ${result.booking?.bookingReference || result.bookingReference}. Please upload payment proof in your dashboard to confirm.`, 'success');
        
        // Redirect to user dashboard after short delay
        setTimeout(() => {
            const dashboardUrl = window.location.pathname.includes('pages/') ? 
                'user-dashboard.html#booking-history' : 
                'pages/user-dashboard.html#booking-history';
            window.location.href = dashboardUrl;
        }, 2000);
        
        return result;
    } catch (error) {
        console.error('Booking failed:', error);
        const errorMessage = error.message || 'Booking failed. Please try again.';
        showAlert(errorMessage, 'danger');
        return null;
    }
}

// Alert System - uses UIHelper from utils.js if available
function showAlert(message, type = 'info') {
    // Use shared UIHelper if available
    if (typeof UIHelper !== 'undefined') {
        return UIHelper.showAlert(message, type);
    }
    
    // Fallback implementation
    const alertContainer = document.getElementById('alertContainer') || createAlertContainer();
    const alertId = 'alert-' + Date.now();
    
    const alertHTML = `
        <div id="${alertId}" class="alert alert-${type}">
            ${message}
            <button onclick="closeAlert('${alertId}')" class="btn btn-small alert-close">×</button>
        </div>
    `;
    
    alertContainer.innerHTML = alertHTML + alertContainer.innerHTML;
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        closeAlert(alertId);
    }, 5000);
}

// Make showAlert globally available
window.showAlert = showAlert;

function createAlertContainer() {
    let container = document.getElementById('alertContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'alertContainer';
        container.className = 'alert-container';
        document.body.appendChild(container);
    }
    return container;
}

function closeAlert(alertId) {
    const alert = document.getElementById(alertId);
    if (alert) {
        alert.remove();
    }
}

// Search and Filter Functions
function filterEvents(searchTerm = '', category = '', priceRange = '') {
    let filteredEvents = [...events];

    // Search by title, venue name, or description
    if (searchTerm) {
        filteredEvents = filteredEvents.filter(event => 
            event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            event.venueName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            event.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    // Filter by category
    if (category && category !== 'all') {
        filteredEvents = filteredEvents.filter(event => 
            event.categoryName && event.categoryName.toLowerCase() === category.toLowerCase()
        );
    }

    // Filter by price range
    if (priceRange) {
        const [min, max] = priceRange.split('-').map(Number);
        filteredEvents = filteredEvents.filter(event => {
            const eventPrice = event.price || 0;
            if (max) {
                return eventPrice >= min && eventPrice <= max;
            } else {
                return eventPrice >= min;
            }
        });
    }

    return filteredEvents;
}

// Load events on events page
async function loadEvents(filteredEvents = null) {
    const eventsContainer = document.getElementById('eventsContainer');
    if (eventsContainer) {
        try {
            const eventsToShow = filteredEvents || await fetchEvents();
            if (eventsToShow.length === 0) {
                eventsContainer.innerHTML = '<p class="text-center">No events found.</p>';
            } else {
                eventsContainer.innerHTML = eventsToShow.map(event => createEventCard(event)).join('');
            }
        } catch (error) {
            console.error('Failed to load events:', error);
            eventsContainer.innerHTML = '<p class="text-center">Unable to load events. Please try again later.</p>';
        }
    }
}

// Load event details
async function loadEventDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('id');
    
    if (!eventId) {
        document.body.innerHTML = '<div class="container"><h1>Event ID not provided</h1></div>';
        return;
    }

    try {
        const event = await apiRequest(`/events/${eventId}`);
        
        if (!event) {
            document.body.innerHTML = '<div class="container"><h1>Event not found</h1></div>';
            return;
        }

        const eventDetailContainer = document.getElementById('eventDetail');
        if (eventDetailContainer) {
            const formattedDate = new Date(event.startDate).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            const formattedTime = new Date(event.startDate).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            });

            eventDetailContainer.innerHTML = `
                <div class="event-detail-header">
                    <div class="event-detail-image">
                        ${event.featuredImageUrl ? 
                            `<img src="${event.featuredImageUrl}" alt="${event.title}" />` : 
                            '<i class="fas fa-calendar-alt"></i>'
                        }
                    </div>
                    <div class="event-detail-info">
                        <h1>${event.title}</h1>
                        <div class="event-meta">
                            <div class="meta-item">
                                <i class="fas fa-calendar-alt"></i>
                                <span>${formattedDate}</span>
                            </div>
                            <div class="meta-item">
                                <i class="fas fa-clock"></i>
                                <span>${formattedTime}</span>
                            </div>
                            <div class="meta-item">
                                <i class="fas fa-map-marker-alt"></i>
                                <span>${event.isOnline ? 'Online Event' : event.venueName}</span>
                            </div>
                            <div class="meta-item">
                                <i class="fas fa-user"></i>
                                <span>By ${event.organizerName || 'EventHub'}</span>
                            </div>
                        </div>
                        <div class="event-price-large">
                            ${event.isFree ? 'Free' : `$${event.price}`}
                        </div>
                    </div>
                </div>
                
                <div class="event-detail-content">
                    <div class="event-description">
                        <h3>About This Event</h3>
                        <p>${event.description}</p>
                        
                        <h3>Event Details</h3>
                        <ul>
                            <li><strong>Category:</strong> ${event.categoryName || 'General'}</li>
                            <li><strong>Capacity:</strong> ${event.capacity} attendees</li>
                            <li><strong>Available Seats:</strong> ${event.capacity - (event.bookingCount || 0)}</li>
                            <li><strong>Organizer:</strong> ${event.organizerName || 'EventHub'}</li>
                        </ul>
                    </div>
                    
                    <div class="booking-form-container">
                        <div class="card">
                            <div class="card-header">
                                <h3>Book Your Tickets</h3>
                            </div>
                            <div class="card-body">
                                <form id="bookingForm">
                                    <div class="form-group">
                                        <label class="form-label">Number of Tickets</label>
                                        <select class="form-control" name="tickets" required>
                                            <option value="">Select tickets</option>
                                            <option value="1">1 Ticket</option>
                                            <option value="2">2 Tickets</option>
                                            <option value="3">3 Tickets</option>
                                            <option value="4">4 Tickets</option>
                                            <option value="5">5 Tickets</option>
                                        </select>
                                        <div class="form-error"></div>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label class="form-label">Full Name</label>
                                        <input type="text" class="form-control" name="fullName" required>
                                        <div class="form-error"></div>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label class="form-label">Email Address</label>
                                        <input type="email" class="form-control" name="email" required>
                                        <div class="form-error"></div>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label class="form-label">Phone Number</label>
                                        <input type="tel" class="form-control" name="phone" required>
                                        <div class="form-error"></div>
                                    </div>
                                    
                                    <div class="total-price">
                                        <strong>Total: $<span id="totalPrice">${event.price || 0}</span></strong>
                                    </div>
                                    
                                    <button type="submit" class="btn btn-primary w-100" ${(event.capacity - (event.bookingCount || 0)) <= 0 ? 'disabled' : ''}>
                                        ${(event.capacity - (event.bookingCount || 0)) <= 0 ? 'Sold Out' : 'Book Now'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Add event listeners for booking form
            const bookingForm = document.getElementById('bookingForm');
            const ticketsSelect = bookingForm.querySelector('select[name="tickets"]');
            const totalPriceElement = document.getElementById('totalPrice');

            ticketsSelect.addEventListener('change', () => {
                const tickets = parseInt(ticketsSelect.value) || 0;
                totalPriceElement.textContent = ((event.price || 0) * tickets).toString();
            });

            bookingForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                if (validateForm('bookingForm')) {
                    const formData = new FormData(bookingForm);
                    const tickets = parseInt(formData.get('tickets'));
                    const availableSeats = event.capacity - (event.bookingCount || 0);
                    
                    if (tickets > availableSeats) {
                        showAlert(`Sorry, only ${availableSeats} tickets available!`, 'danger');
                        return;
                    }
                    
                    const attendeeInfo = {
                        name: formData.get('fullName'),
                        email: formData.get('email'),
                        phone: formData.get('phone')
                    };
                    
                    // For paid events, prompt for payment proof
                    let transactionId = '';
                    let paymentReceiptUrl = '';
                    
                    if (!event.isFree && event.price > 0) {
                        transactionId = prompt('Enter your payment transaction ID:');
                        if (!transactionId) {
                            showAlert('Transaction ID is required for paid events', 'warning');
                            return;
                        }
                        
                        const receipt = prompt('Paste receipt image URL (or upload base64):');
                        if (receipt) {
                            paymentReceiptUrl = receipt;
                        }
                        
                        showAlert('Please upload your payment receipt. After booking, the organizer will verify your payment.', 'info');
                    }
                    
                    await bookEvent(eventId, tickets, attendeeInfo, transactionId, paymentReceiptUrl);
                }
            });
        }
    } catch (error) {
        console.error('Failed to load event detail:', error);
        document.body.innerHTML = '<div class="container"><h1>Failed to load event details</h1></div>';
    }
}

// Dashboard Functions
async function loadUserDashboard() {
    // Try to fetch user if not already loaded
    if (!currentUser) {
        const token = localStorage.getItem('authToken');
        if (token) {
            try {
                currentUser = await apiRequest('/auth/me');
            } catch (error) {
                console.error('Failed to fetch user, redirecting to login:', error);
                window.location.href = 'login.html';
                return;
            }
        } else {
            window.location.href = 'login.html';
            return;
        }
    }
    
    const dashboardContent = document.getElementById('dashboardContent');
    
    // Update user name in navigation
    const welcomeSpan = document.querySelector('.nav-auth span');
    if (welcomeSpan && currentUser) {
        welcomeSpan.textContent = `Welcome, ${currentUser.firstName}!`;
    }
    
    // Update welcome message in dashboard
    const welcomeMessage = document.querySelector('.dashboard-header p');
    if (welcomeMessage && currentUser) {
        welcomeMessage.textContent = `Welcome back, ${currentUser.firstName}! Here's your event overview.`;
    }
    
    // Update profile form with user data
    const fullNameInput = document.querySelector('input[name="fullName"]');
    if (fullNameInput && currentUser) {
        fullNameInput.value = `${currentUser.firstName} ${currentUser.lastName}`;
    }
    
    if (dashboardContent) {
        try {
            const bookings = await fetchUserBookings().catch(() => []);
            let upcomingEvents = [];
            
            if (bookings.length > 0) {
                try {
                    const bookedEvents = await Promise.all(
                        bookings.map(booking => apiRequest(`/events/${booking.eventId}`).catch(() => null))
                    );
                    upcomingEvents = bookedEvents.filter(event => event && new Date(event.startDate) > new Date());
                } catch (error) {
                    console.error('Error fetching booked events:', error);
                }
            }
            
            const notifications = await apiRequest('/notifications/unread').catch(() => []);
            
            dashboardContent.innerHTML = `
                <div class="dashboard-stats">
                    <div class="stat-card">
                        <div class="stat-card-icon">
                            <i class="fas fa-ticket-alt"></i>
                        </div>
                        <div class="stat-card-value">${upcomingEvents.length}</div>
                        <div class="stat-card-label">Upcoming Events</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-card-icon">
                            <i class="fas fa-history"></i>
                        </div>
                        <div class="stat-card-value">${bookings.length}</div>
                        <div class="stat-card-label">Total Bookings</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-card-icon">
                            <i class="fas fa-bell"></i>
                        </div>
                        <div class="stat-card-value">${notifications.length}</div>
                        <div class="stat-card-label">Notifications</div>
                    </div>
                </div>
                
                <div class="dashboard-section">
                    <h2>Your Upcoming Events</h2>
                    <div class="events-grid">
                        ${upcomingEvents.length > 0 ? 
                            upcomingEvents.map(event => createEventCard(event)).join('') :
                            '<div class=\"text-center\" style=\"grid-column: 1/-1; padding: 2rem;\">' +
                            '<i class=\"fas fa-calendar-times\" style=\"font-size: 3rem; color: #ccc; margin-bottom: 1rem;\"></i>' +
                            '<p>You have no upcoming events</p>' +
                            '<a href=\"events.html\" class=\"btn btn-primary\">Browse Events</a>' +
                            '</div>'
                        }
                    </div>
                </div>
                
                <div class="dashboard-section" id="availableEventsSection">
                    <h2>Available Events to Book</h2>
                    <div class="events-grid" id="availableEventsGrid">
                        <div class="text-center" style="grid-column: 1/-1;">
                            <i class="fas fa-spinner fa-spin"></i> Loading events...
                        </div>
                    </div>
                </div>
                
                <div class="dashboard-section">
                    <h2>Booking History</h2>
                    <div class="table-container">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Event</th>
                                    <th>Booking Date</th>
                                    <th>Tickets</th>
                                    <th>Status</th>
                                    <th>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${bookings.length > 0 ? bookings.map(booking => {
                                    const event = upcomingEvents.find(e => e.eventId === booking.eventId) || { title: booking.eventTitle || 'Event' };
                                    return `
                                        <tr>
                                            <td>${event.title}</td>
                                            <td>${new Date(booking.createdAt).toLocaleDateString()}</td>
                                            <td>${booking.quantity}</td>
                                            <td><span class="badge badge-${booking.status.toLowerCase() === 'confirmed' ? 'success' : 'warning'}">${booking.status}</span></td>
                                            <td>$${booking.finalAmount}</td>
                                        </tr>
                                    `;
                                }).join('') : '<tr><td colspan="5" class="text-center">No bookings found</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
            
            // Load available events for booking
            setTimeout(async () => {
                const availableEventsGrid = document.getElementById('availableEventsGrid');
                if (availableEventsGrid) {
                    try {
                        const allEvents = await fetchEvents();
                        // Filter out already booked events
                        const bookedEventIds = bookings.map(b => b.eventId);
                        const availableEvents = allEvents
                            .filter(event => !bookedEventIds.includes(event.eventId))
                            .filter(event => {
                                const eventDate = new Date(event.startDate);
                                return eventDate > new Date(); // Only future events
                            })
                            .slice(0, 6); // Show max 6 events
                        
                        if (availableEvents.length > 0) {
                            availableEventsGrid.innerHTML = availableEvents.map(event => createEventCard(event)).join('');
                        } else {
                            availableEventsGrid.innerHTML = `
                                <div class="text-center" style="grid-column: 1/-1; padding: 2rem;">
                                    <i class="fas fa-check-circle" style="font-size: 3rem; color: #28a745; margin-bottom: 1rem;\"></i>
                                    <p>You're all caught up! Check back later for new events.</p>
                                    <a href="events.html" class="btn btn-primary">View All Events</a>
                                </div>
                            `;
                        }
                    } catch (error) {
                        console.error('Failed to load available events:', error);
                        availableEventsGrid.innerHTML = '<div class="text-center" style="grid-column: 1/-1;"><p>Failed to load events</p></div>';
                    }
                }
            }, 500);
            
        } catch (error) {
            console.error('Failed to load dashboard:', error);
            dashboardContent.innerHTML = '<p class="text-center">Unable to load dashboard. Please try again later.</p>';
        }
    }
}

// Handle form submissions
async function handleFormSubmission(formType, form) {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    console.log('Form submission:', { formType, data });
    
    try {
        switch (formType) {
            case 'loginForm':
                // Backend authentication
                try {
                    const loginResult = await apiRequest('/auth/login', {
                        method: 'POST',
                        body: JSON.stringify({
                            email: data.email,
                            password: data.password
                        })
                    });
                    
                    console.log('Login successful:', loginResult);
                    
                    // Store authentication data
                    localStorage.setItem('authToken', loginResult.token);
                    localStorage.setItem('userType', loginResult.user.userType);
                    localStorage.setItem('userId', loginResult.user.userId);
                    localStorage.setItem('currentUser', JSON.stringify(loginResult.user));
                    currentUser = loginResult.user;
                    
                    showAlert('Login successful! Redirecting...', 'success');
                    
                    // Redirect to appropriate dashboard
                    setTimeout(() => {
                        const redirectUrl = loginResult.user.userType === 'Admin' ? 
                            'admin-dashboard.html' : 
                            loginResult.user.userType === 'Organizer' ? 
                            'organizer-dashboard.html' : 
                            'user-dashboard.html';
                        window.location.href = redirectUrl;
                    }, 1500);
                } catch (error) {
                    console.error('Login failed:', error);
                    // Error already shown by apiRequest
                }
                break;
                
            case 'registerForm':
                // Map userType from frontend to backend format
                let userRole = 'User'; // default
                if (data.userType === 'organizer' || data.userType === 'both') {
                    userRole = 'Organizer';
                }
                
                try {
                    const registerData = {
                        firstName: data.firstName,
                        lastName: data.lastName,
                        email: data.email,
                        password: data.password,
                        phone: data.phone || null,
                        userType: userRole
                    };
                    
                    await apiRequest('/auth/register', {
                        method: 'POST',
                        body: JSON.stringify(registerData)
                    });
                    
                    showAlert('Registration successful! You can now log in with your credentials.', 'success');
                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 2000);
                } catch (error) {
                    console.error('Registration failed:', error);
                    // Error already shown by apiRequest
                }
                break;
                
            case 'contactForm':
                try {
                    await apiRequest('/contact', {
                        method: 'POST',
                        body: JSON.stringify(data)
                    });
                    
                    showAlert('Thank you for your message! We will get back to you soon.', 'success');
                    form.reset();
                } catch (error) {
                    console.error('Contact form submission failed:', error);
                    // Error already shown by apiRequest
                }
                break;
                
            case 'createEventForm':
                // Demo mode - this is handled in organizer dashboard
                showAlert('Event created successfully! It will be reviewed by our team.', 'success');
                form.reset();
                break;
                
            case 'bookingForm':
                try {
                    const eventId = new URLSearchParams(window.location.search).get('id');
                    
                    if (!currentUser) {
                        showAlert('Please log in to book events.', 'warning');
                        setTimeout(() => window.location.href = 'login.html', 2000);
                        return;
                    }
                    
                    const bookingData = {
                        eventId: eventId,
                        quantity: parseInt(data.tickets),
                        attendeeInfo: {
                            name: data.fullName,
                            email: data.email,
                            phone: data.phone
                        }
                    };
                    
                    const result = await apiRequest('/bookings', {
                        method: 'POST',
                        body: JSON.stringify(bookingData)
                    });
                    
                    showAlert(`Successfully booked ${data.tickets} ticket(s)! Booking reference: ${result.bookingReference}`, 'success');
                    
                    // Optionally redirect to user dashboard
                    setTimeout(() => {
                        if (confirm('Would you like to view your bookings?')) {
                            window.location.href = 'user-dashboard.html';
                        }
                    }, 2000);
                } catch (error) {
                    console.error('Booking failed:', error);
                    // Error already shown by apiRequest
                }
                break;
                
            default:
                showAlert('Form submitted successfully!', 'success');
        }
    } catch (error) {
        console.error('Form submission failed:', error);
        showAlert(error.message || 'Submission failed. Please try again.', 'danger');
    }
}

// Update navigation based on authentication state - uses NavigationHelper from utils.js if available
function updateNavigation() {
    // Use shared NavigationHelper if available
    if (typeof NavigationHelper !== 'undefined') {
        return NavigationHelper.updateNavigation();
    }
    
    // Fallback implementation
    const navAuth = document.querySelector('.nav-auth');
    if (!navAuth) return;
    
    const token = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('currentUser');
    const userType = localStorage.getItem('userType');
    
    if (token && storedUser) {
        try {
            const user = JSON.parse(storedUser);
            const userName = user.firstName || user.name || 'User';
            
            // Determine dashboard link based on user type
            let dashboardLink = 'user-dashboard.html';
            if (userType === 'Admin') {
                dashboardLink = 'admin-dashboard.html';
            } else if (userType === 'Organizer') {
                dashboardLink = 'organizer-dashboard.html';
            }
            
            // Check if we're in pages folder or root
            const isInPagesFolder = window.location.pathname.includes('/pages/');
            const prefix = isInPagesFolder ? '' : 'pages/';
            
            navAuth.innerHTML = `
                <div style="display: flex; align-items: center; gap: 15px;">
                    <a href="${prefix}${dashboardLink}" style="color: inherit; text-decoration: none;">
                        <span style="cursor: pointer;">Welcome, ${userName}!</span>
                    </a>
                    <button class="btn btn-outline btn-small" onclick="logout()">Logout</button>
                </div>
            `;
        } catch (e) {
            console.error('Error parsing user data:', e);
        }
    } else {
        // Show login/register buttons
        const isInPagesFolder = window.location.pathname.includes('/pages/');
        const prefix = isInPagesFolder ? '' : 'pages/';
        
        navAuth.innerHTML = `
            <a href="${prefix}login.html" class="btn btn-outline">Login</a>
            <a href="${prefix}register.html" class="btn btn-primary">Register</a>
        `;
    }
}

// Authentication check
async function checkAuth() {
    const token = localStorage.getItem('authToken');
    if (token) {
        try {
            // Try to fetch current user from backend
            const user = await apiRequest('/auth/me', { requireAuth: true });
            currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(user));
        } catch (error) {
            console.error('Failed to fetch current user:', error);
            // Fall back to stored user if API call fails
            const storedUser = localStorage.getItem('currentUser');
            if (storedUser) {
                currentUser = JSON.parse(storedUser);
            } else {
                // Clear invalid auth
                localStorage.removeItem('authToken');
                localStorage.removeItem('currentUser');
                localStorage.removeItem('userId');
                localStorage.removeItem('userType');
            }
        }
    }
    
    // Always update navigation based on current auth state
    updateNavigation();
}

// Logout function - uses AuthHelper from utils.js if available
function logout() {
    // Use shared AuthHelper if available
    if (typeof AuthHelper !== 'undefined') {
        return AuthHelper.logout();
    }
    
    // Fallback implementation
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userId');
    localStorage.removeItem('userType');
    currentUser = null;
    
    showAlert('Logged out successfully!', 'success');
    
    // Redirect to home page - handle both root and pages folder
    const isInPagesFolder = window.location.pathname.includes('/pages/');
    setTimeout(() => {
        window.location.href = isInPagesFolder ? '../index.html' : 'index.html';
    }, 1500);
}

// Initialize page-specific functions
document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication status
    await checkAuth();
    
    // Load featured events on home page
    loadFeaturedEvents();
    
    // Load events on events page
    if (window.location.pathname.includes('events.html')) {
        loadEvents();
        
        // Add search functionality
        const searchInput = document.getElementById('eventSearch');
        const categoryFilter = document.getElementById('categoryFilter');
        const priceFilter = document.getElementById('priceFilter');
        
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                const filteredEvents = filterEvents(
                    searchInput.value,
                    categoryFilter ? categoryFilter.value : '',
                    priceFilter ? priceFilter.value : ''
                );
                loadEvents(filteredEvents);
            });
        }
        
        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => {
                const filteredEvents = filterEvents(
                    searchInput ? searchInput.value : '',
                    categoryFilter.value,
                    priceFilter ? priceFilter.value : ''
                );
                loadEvents(filteredEvents);
            });
        }
        
        if (priceFilter) {
            priceFilter.addEventListener('change', () => {
                const filteredEvents = filterEvents(
                    searchInput ? searchInput.value : '',
                    categoryFilter ? categoryFilter.value : '',
                    priceFilter.value
                );
                loadEvents(filteredEvents);
            });
        }
    }
    
    // Load event detail
    if (window.location.pathname.includes('event-detail.html')) {
        loadEventDetail();
        
        // Track event view
        const urlParams = new URLSearchParams(window.location.search);
        const eventId = urlParams.get('id');
        if (eventId) {
            try {
                fetch(`${API_BASE_URL}/events/${eventId}/increment-view`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' }
                }).catch(err => console.log('View tracking failed (non-critical):', err));
            } catch (error) {
                console.log('View tracking failed (non-critical):', error);
            }
        }
    }
    
    // Load user dashboard
    if (window.location.pathname.includes('user-dashboard.html')) {
        loadUserDashboard();
    }
    
    // Form submissions
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (validateForm(form.id)) {
                const formType = form.id;
                await handleFormSubmission(formType, form);
            }
        });
    });
});

// Host Event Function with Authentication Check
function hostEvent() {
    const token = localStorage.getItem('authToken');
    const userType = localStorage.getItem('userType');
    
    if (!token) {
        showAlert('Please log in to host events.', 'info');
        setTimeout(() => {
            window.location.href = 'pages/login.html?redirect=host';
        }, 1500);
        return;
    }
    
    if (userType === 'User') {
        showAlert('Only organizers can host events. Please contact support to upgrade your account.', 'warning');
        return;
    }
    
    window.location.href = 'pages/organizer-dashboard.html';
}

// Make functions available globally
window.hostEvent = hostEvent;
window.quickBookEvent = quickBookEvent;
window.loadFeaturedEvents = loadFeaturedEvents;
window.logout = logout;
window.updateNavigation = updateNavigation;

// Export functions for use in other files
window.EventHub = {
    createEventCard,
    filterEvents,
    bookEvent,
    quickBookEvent,
    showAlert,
    validateForm,
    openModal,
    closeModal,
    fetchEvents,
    fetchCurrentUser,
    logout,
    checkAuth,
    apiRequest,
    loadFeaturedEvents,
    loadUserDashboard,
    updateNavigation
};