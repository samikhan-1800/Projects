// API Configuration
const API_BASE_URL = 'http://localhost:3000/api'; // Backend API running on port 3000

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
        navMenu.classList.remove('active');
    }
});

// API Helper Functions
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
        
        if (!response.ok) {
            const errorData = await response.text();
            console.error(`API Error ${response.status}:`, errorData);
            throw new Error(`HTTP error! status: ${response.status} - ${errorData}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API request failed:', error);
        
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            showAlert('Cannot connect to server. Please ensure the backend is running on http://localhost:3000', 'danger');
        } else {
            showAlert(`Network error: ${error.message}`, 'danger');
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
        return events;
    } catch (error) {
        console.error('Failed to fetch events:', error);
        return [];
    }
}

async function fetchCurrentUser() {
    try {
        const token = localStorage.getItem('authToken');
        if (!token) {
            return null;
        }
        currentUser = await apiRequest('/auth/me');
        return currentUser;
    } catch (error) {
        console.error('Failed to fetch current user:', error);
        localStorage.removeItem('authToken'); // Remove invalid token
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
            console.log('Loaded events:', allEvents.length);
            
            let eventsToShow = allEvents.filter(event => event.isFeatured).slice(0, 3);
            
            // If no featured events, show the first 3 events
            if (eventsToShow.length === 0) {
                console.log('No featured events found, showing first 3 events');
                eventsToShow = allEvents.slice(0, 3);
            }
            
            if (eventsToShow.length > 0) {
                featuredEventsContainer.innerHTML = eventsToShow.map(event => createEventCard(event, true)).join('');
            } else {
                featuredEventsContainer.innerHTML = '<p class="text-center">No events available at the moment.</p>';
            }
        } catch (error) {
            console.error('Failed to load featured events:', error);
            featuredEventsContainer.innerHTML = '<p class="text-center text-danger">Unable to load events. Please check your connection and try again.</p>';
        }
    }
}

// Create Event Card HTML
function createEventCard(event, isFeatured = false) {
    const formattedDate = new Date(event.startDate).toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });

    const formattedTime = new Date(event.startDate).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });

    const availableSeats = event.capacity - (event.bookingCount || 0);
    const eventImage = event.featuredImageUrl ? 
        `<img src="${event.featuredImageUrl}" alt="${event.title}" onerror="this.style.display='none'; this.parentNode.innerHTML='<i class=\\'fas fa-calendar-alt\\'></i>'" />` : 
        `<i class="fas fa-calendar-alt"></i>`;

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
                        <span>${event.isOnline ? 'Online Event' : event.venueName}</span>
                    </div>
                    <div class="event-detail">
                        <i class="fas fa-users"></i>
                        <span>${availableSeats}/${event.capacity} available</span>
                    </div>
                </div>
                <div class="event-price">
                    ${event.isFree ? 'Free' : `$${event.price}`}
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

// Event Booking
async function bookEvent(eventId, ticketQuantity = 1, attendeeInfo = {}) {
    if (!currentUser) {
        showAlert('Please log in to book events.', 'warning');
        window.location.href = 'pages/login.html';
        return;
    }

    try {
        const bookingData = {
            eventId,
            quantity: ticketQuantity,
            attendeeInfo
        };

        const result = await apiRequest('/bookings', {
            method: 'POST',
            body: JSON.stringify(bookingData)
        });

        showAlert(`Successfully booked event! Booking reference: ${result.bookingReference}`, 'success');
        
        // Refresh events data
        await fetchEvents();
        
        // Update UI if on events page
        if (window.location.pathname.includes('events.html')) {
            loadEvents();
        }
        
        return result;
    } catch (error) {
        console.error('Booking failed:', error);
        showAlert('Booking failed. Please try again.', 'danger');
    }
}

// Alert System
function showAlert(message, type = 'info') {
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
                    
                    await bookEvent(eventId, tickets, {
                        name: formData.get('fullName'),
                        email: formData.get('email'),
                        phone: formData.get('phone')
                    });
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
                            '<p class="text-center">No upcoming events</p>'
                        }
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
                                    const event = bookedEvents.find(e => e.eventId === booking.eventId);
                                    return `
                                        <tr>
                                            <td>${event ? event.title : 'Unknown Event'}</td>
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
    
    try {
        switch (formType) {
            case 'loginForm':
                const loginResult = await apiRequest('/auth/login', {
                    method: 'POST',
                    body: JSON.stringify({
                        email: data.email,
                        password: data.password
                    })
                });
                
                // Store authentication data
                localStorage.setItem('authToken', loginResult.token);
                localStorage.setItem('userType', loginResult.user.userType);
                localStorage.setItem('userId', loginResult.user.userId);
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
                break;
                
            case 'registerForm':
                // Map userType from frontend to backend format
                let userRole = 'User'; // default
                if (data.userType === 'organizer' || data.userType === 'both') {
                    userRole = 'Organizer';
                }
                
                const registerData = {
                    firstName: data.firstName,
                    lastName: data.lastName,
                    email: data.email,
                    password: data.password,
                    phone: data.phone,
                    userType: userRole
                };
                
                await apiRequest('/auth/register', {
                    method: 'POST',
                    body: JSON.stringify(registerData)
                });
                
                showAlert('Registration successful! Please check your email to verify your account.', 'success');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
                break;
                
            case 'contactForm':
                await apiRequest('/contact', {
                    method: 'POST',
                    body: JSON.stringify(data)
                });
                
                showAlert('Thank you for your message! We will get back to you soon.', 'success');
                form.reset();
                break;
                
            case 'createEventForm':
                await apiRequest('/events', {
                    method: 'POST',
                    body: JSON.stringify(data)
                });
                
                showAlert('Event created successfully! It will be reviewed by our team.', 'success');
                form.reset();
                break;
                
            case 'bookingForm':
                const eventId = new URLSearchParams(window.location.search).get('id');
                await bookEvent(eventId, parseInt(data.tickets), {
                    name: data.fullName,
                    email: data.email,
                    phone: data.phone
                });
                break;
                
            default:
                showAlert('Form submitted successfully!', 'success');
        }
    } catch (error) {
        console.error('Form submission failed:', error);
        showAlert(error.message || 'Submission failed. Please try again.', 'danger');
    }
}

// Authentication check
async function checkAuth() {
    const token = localStorage.getItem('authToken');
    if (token) {
        await fetchCurrentUser();
    }
}

// Logout function
function logout() {
    localStorage.removeItem('authToken');
    currentUser = null;
    window.location.href = '../index.html';
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

// Make hostEvent available globally
window.hostEvent = hostEvent;

// Export functions for use in other files
window.EventHub = {
    createEventCard,
    filterEvents,
    bookEvent,
    showAlert,
    validateForm,
    openModal,
    closeModal,
    fetchEvents,
    fetchCurrentUser,
    logout,
    checkAuth,
    apiRequest
};