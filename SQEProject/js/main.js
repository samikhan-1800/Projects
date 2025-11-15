// Sample Data
const sampleEvents = [
    {
        id: 1,
        title: "Tech Conference 2025",
        date: "2025-11-15",
        time: "09:00 AM",
        venue: "Tech Center Downtown",
        price: 299,
        capacity: 500,
        available: 150,
        category: "Technology",
        description: "Join industry leaders for the biggest tech conference of the year. Featuring keynotes, workshops, and networking opportunities.",
        organizer: "TechEvents Inc.",
        image: "fas fa-laptop-code"
    },
    {
        id: 2,
        title: "Music Festival Summer",
        date: "2025-12-20",
        time: "06:00 PM",
        venue: "Central Park Amphitheater",
        price: 89,
        capacity: 2000,
        available: 800,
        category: "Music",
        description: "An unforgettable night of music featuring top artists from around the world. Food trucks and activities for the whole family.",
        organizer: "Summer Sounds",
        image: "fas fa-music"
    },
    {
        id: 3,
        title: "Startup Pitch Night",
        date: "2025-10-28",
        time: "07:00 PM",
        venue: "Innovation Hub",
        price: 49,
        capacity: 200,
        available: 50,
        category: "Business",
        description: "Watch promising startups pitch their ideas to investors. Great networking opportunity for entrepreneurs and investors.",
        organizer: "Startup Community",
        image: "fas fa-lightbulb"
    },
    {
        id: 4,
        title: "Art Gallery Opening",
        date: "2025-11-05",
        time: "05:30 PM",
        venue: "Modern Art Museum",
        price: 35,
        capacity: 150,
        available: 75,
        category: "Art",
        description: "Exclusive opening of our contemporary art exhibition featuring local and international artists.",
        organizer: "Modern Art Museum",
        image: "fas fa-palette"
    },
    {
        id: 5,
        title: "Food & Wine Festival",
        date: "2025-11-30",
        time: "12:00 PM",
        venue: "Riverside Gardens",
        price: 125,
        capacity: 800,
        available: 300,
        category: "Food",
        description: "Taste exquisite cuisine from top chefs and sample premium wines from around the world.",
        organizer: "Culinary Events",
        image: "fas fa-wine-glass-alt"
    },
    {
        id: 6,
        title: "Marathon Championship",
        date: "2025-12-01",
        time: "06:00 AM",
        venue: "City Sports Complex",
        price: 75,
        capacity: 1000,
        available: 400,
        category: "Sports",
        description: "Annual marathon championship with various categories for runners of all levels. Medals and prizes for winners.",
        organizer: "City Sports Authority",
        image: "fas fa-running"
    }
];

const sampleUsers = [
    {
        id: 1,
        name: "John Doe",
        email: "john@example.com",
        role: "user",
        status: "active",
        joinDate: "2025-01-15",
        bookedEvents: [1, 3],
        bookingHistory: [
            { eventId: 1, bookingDate: "2025-09-15", status: "confirmed", tickets: 2 },
            { eventId: 3, bookingDate: "2025-09-20", status: "confirmed", tickets: 1 }
        ]
    },
    {
        id: 2,
        name: "Jane Smith",
        email: "jane@example.com",
        role: "organizer",
        status: "active",
        joinDate: "2025-02-10",
        eventsCreated: [1, 4],
        totalRevenue: 15750
    },
    {
        id: 3,
        name: "Mike Johnson",
        email: "mike@example.com",
        role: "admin",
        status: "active",
        joinDate: "2025-01-01"
    }
];

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

// Load Featured Events on Home Page
function loadFeaturedEvents() {
    if (featuredEventsContainer) {
        const featuredEvents = sampleEvents.slice(0, 3);
        featuredEventsContainer.innerHTML = featuredEvents.map(event => createEventCard(event, true)).join('');
    }
}

// Create Event Card HTML
function createEventCard(event, isFeatured = false) {
    const formattedDate = new Date(event.date).toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });

    return `
        <div class="event-card">
            <div class="event-image">
                <i class="${event.image}"></i>
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
                        <span>${event.time}</span>
                    </div>
                    <div class="event-detail">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${event.venue}</span>
                    </div>
                    <div class="event-detail">
                        <i class="fas fa-users"></i>
                        <span>${event.available}/${event.capacity} available</span>
                    </div>
                </div>
                <div class="event-price">$${event.price}</div>
                <div class="card-footer">
                    ${isFeatured ? 
                        `<a href="pages/event-detail.html?id=${event.id}" class="btn btn-primary">View Details</a>` :
                        `<a href="pages/event-detail.html?id=${event.id}" class="btn btn-outline btn-small">View Details</a>
                         <button onclick="bookEvent(${event.id})" class="btn btn-primary">Book Now</button>`
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
function bookEvent(eventId) {
    const event = sampleEvents.find(e => e.id === eventId);
    if (!event) return;

    if (event.available <= 0) {
        showAlert('Sorry, this event is sold out!', 'danger');
        return;
    }

    // Simulate booking process
    showAlert(`Successfully booked "${event.title}"! Check your email for confirmation.`, 'success');
    
    // Update available seats
    event.available -= 1;
    
    // Update UI if on events page
    const eventCards = document.querySelectorAll('.event-card');
    eventCards.forEach(card => {
        const titleElement = card.querySelector('.event-title');
        if (titleElement && titleElement.textContent === event.title) {
            const availableElement = card.querySelector('.event-detail:nth-child(4) span');
            if (availableElement) {
                availableElement.textContent = `${event.available}/${event.capacity} available`;
            }
        }
    });
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
    let filteredEvents = [...sampleEvents];

    // Search by title or venue
    if (searchTerm) {
        filteredEvents = filteredEvents.filter(event => 
            event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            event.venue.toLowerCase().includes(searchTerm.toLowerCase()) ||
            event.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    // Filter by category
    if (category && category !== 'all') {
        filteredEvents = filteredEvents.filter(event => 
            event.category.toLowerCase() === category.toLowerCase()
        );
    }

    // Filter by price range
    if (priceRange) {
        const [min, max] = priceRange.split('-').map(Number);
        filteredEvents = filteredEvents.filter(event => {
            if (max) {
                return event.price >= min && event.price <= max;
            } else {
                return event.price >= min;
            }
        });
    }

    return filteredEvents;
}

// Load events on events page
function loadEvents(events = sampleEvents) {
    const eventsContainer = document.getElementById('eventsContainer');
    if (eventsContainer) {
        eventsContainer.innerHTML = events.map(event => createEventCard(event)).join('');
    }
}

// Load event details
function loadEventDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = parseInt(urlParams.get('id'));
    const event = sampleEvents.find(e => e.id === eventId);

    if (!event) {
        document.body.innerHTML = '<div class="container"><h1>Event not found</h1></div>';
        return;
    }

    const eventDetailContainer = document.getElementById('eventDetail');
    if (eventDetailContainer) {
        const formattedDate = new Date(event.date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        eventDetailContainer.innerHTML = `
            <div class="event-detail-header">
                <div class="event-detail-image">
                    <i class="${event.image}"></i>
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
                            <span>${event.time}</span>
                        </div>
                        <div class="meta-item">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${event.venue}</span>
                        </div>
                        <div class="meta-item">
                            <i class="fas fa-user"></i>
                            <span>By ${event.organizer}</span>
                        </div>
                    </div>
                    <div class="event-price-large">$${event.price}</div>
                </div>
            </div>
            
            <div class="event-detail-content">
                <div class="event-description">
                    <h3>About This Event</h3>
                    <p>${event.description}</p>
                    
                    <h3>Event Details</h3>
                    <ul>
                        <li><strong>Category:</strong> ${event.category}</li>
                        <li><strong>Capacity:</strong> ${event.capacity} attendees</li>
                        <li><strong>Available Seats:</strong> ${event.available}</li>
                        <li><strong>Organizer:</strong> ${event.organizer}</li>
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
                                    <strong>Total: $<span id="totalPrice">${event.price}</span></strong>
                                </div>
                                
                                <button type="submit" class="btn btn-primary w-100">
                                    ${event.available > 0 ? 'Book Now' : 'Sold Out'}
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
            totalPriceElement.textContent = (event.price * tickets).toString();
        });

        bookingForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (validateForm('bookingForm')) {
                const tickets = parseInt(ticketsSelect.value);
                if (tickets > event.available) {
                    showAlert(`Sorry, only ${event.available} tickets available!`, 'danger');
                    return;
                }
                
                showAlert(`Successfully booked ${tickets} ticket(s) for "${event.title}"!`, 'success');
                event.available -= tickets;
                
                // Update availability display
                const availableElement = document.querySelector('.event-detail-info .meta-item:nth-child(3) span');
                if (availableElement) {
                    availableElement.textContent = `${event.available} available`;
                }
                
                // Disable form if sold out
                if (event.available <= 0) {
                    bookingForm.querySelector('button[type="submit"]').textContent = 'Sold Out';
                    bookingForm.querySelector('button[type="submit"]').disabled = true;
                }
            }
        });
    }
}

// Dashboard Functions
function loadUserDashboard() {
    const user = sampleUsers[0]; // Current user
    const dashboardContent = document.getElementById('dashboardContent');
    
    if (dashboardContent) {
        const bookedEvents = sampleEvents.filter(event => user.bookedEvents.includes(event.id));
        
        dashboardContent.innerHTML = `
            <div class="dashboard-stats">
                <div class="stat-card">
                    <div class="stat-card-icon">
                        <i class="fas fa-ticket-alt"></i>
                    </div>
                    <div class="stat-card-value">${user.bookedEvents.length}</div>
                    <div class="stat-card-label">Booked Events</div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-icon">
                        <i class="fas fa-history"></i>
                    </div>
                    <div class="stat-card-value">${user.bookingHistory.length}</div>
                    <div class="stat-card-label">Total Bookings</div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-icon">
                        <i class="fas fa-bell"></i>
                    </div>
                    <div class="stat-card-value">3</div>
                    <div class="stat-card-label">Reminders</div>
                </div>
            </div>
            
            <div class="dashboard-section">
                <h2>Your Upcoming Events</h2>
                <div class="events-grid">
                    ${bookedEvents.map(event => createEventCard(event)).join('')}
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
                            </tr>
                        </thead>
                        <tbody>
                            ${user.bookingHistory.map(booking => {
                                const event = sampleEvents.find(e => e.id === booking.eventId);
                                return `
                                    <tr>
                                        <td>${event ? event.title : 'Unknown Event'}</td>
                                        <td>${new Date(booking.bookingDate).toLocaleDateString()}</td>
                                        <td>${booking.tickets}</td>
                                        <td><span class="badge badge-success">${booking.status}</span></td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }
}

// Initialize page-specific functions
document.addEventListener('DOMContentLoaded', () => {
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
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            if (validateForm(form.id)) {
                const formType = form.id;
                
                switch (formType) {
                    case 'loginForm':
                        showAlert('Login successful! Redirecting...', 'success');
                        setTimeout(() => {
                            window.location.href = '../pages/user-dashboard.html';
                        }, 2000);
                        break;
                        
                    case 'registerForm':
                        showAlert('Registration successful! Please check your email to verify your account.', 'success');
                        setTimeout(() => {
                            window.location.href = 'login.html';
                        }, 2000);
                        break;
                        
                    case 'contactForm':
                        showAlert('Thank you for your message! We will get back to you soon.', 'success');
                        form.reset();
                        break;
                        
                    case 'createEventForm':
                        showAlert('Event created successfully! It will be reviewed by our team.', 'success');
                        form.reset();
                        break;
                        
                    default:
                        showAlert('Form submitted successfully!', 'success');
                }
            }
        });
    });
});

// Export functions for use in other files
window.EventHub = {
    sampleEvents,
    sampleUsers,
    createEventCard,
    filterEvents,
    bookEvent,
    showAlert,
    validateForm,
    openModal,
    closeModal
};