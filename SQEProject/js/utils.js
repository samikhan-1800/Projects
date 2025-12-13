/**
 * EventHub Shared Utilities
 * Centralized constants, helper functions, and reusable components
 */

// ============================================================================
// CONFIGURATION
// ============================================================================
const EventHubConfig = {
    API_BASE_URL: 'http://localhost:3000/api',
    APP_NAME: 'EventHub',
    
    // Public endpoints that don't require authentication
    PUBLIC_ENDPOINTS: ['/events', '/events/categories', '/contact', '/auth/login', '/auth/register'],
    
    // Alert display duration in milliseconds
    ALERT_DURATION: 3000,
    
    // Redirect delay after auth actions
    REDIRECT_DELAY: 1500,
    
    // Local storage keys
    STORAGE_KEYS: {
        AUTH_TOKEN: 'authToken',
        CURRENT_USER: 'currentUser',
        USER_ID: 'userId',
        USER_TYPE: 'userType',
        CACHED_EVENTS: 'cachedEvents'
    },
    
    // User types/roles
    USER_TYPES: {
        ADMIN: 'Admin',
        ORGANIZER: 'Organizer',
        USER: 'User'
    },
    
    // Badge status mappings
    STATUS_BADGES: {
        active: 'success',
        completed: 'secondary',
        cancelled: 'danger',
        pending: 'warning',
        confirmed: 'success',
        processing: 'warning',
        draft: 'warning',
        published: 'success',
        suspended: 'danger'
    },
    
    // Category icons mapping
    CATEGORY_ICONS: {
        technology: 'laptop-code',
        music: 'music',
        business: 'briefcase',
        art: 'palette',
        sports: 'futbol',
        food: 'utensils',
        education: 'graduation-cap',
        health: 'heartbeat',
        entertainment: 'film',
        networking: 'handshake',
        default: 'calendar-alt'
    }
};

// ============================================================================
// STORAGE HELPERS
// ============================================================================
const StorageHelper = {
    get(key) {
        try {
            const value = localStorage.getItem(key);
            return value ? JSON.parse(value) : null;
        } catch (e) {
            return localStorage.getItem(key);
        }
    },
    
    set(key, value) {
        try {
            localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
        } catch (e) {
            console.error('Storage error:', e);
        }
    },
    
    remove(key) {
        localStorage.removeItem(key);
    },
    
    clearAuth() {
        const keys = EventHubConfig.STORAGE_KEYS;
        this.remove(keys.AUTH_TOKEN);
        this.remove(keys.CURRENT_USER);
        this.remove(keys.USER_ID);
        this.remove(keys.USER_TYPE);
    },
    
    getAuthToken() {
        return localStorage.getItem(EventHubConfig.STORAGE_KEYS.AUTH_TOKEN);
    },
    
    getCurrentUser() {
        return this.get(EventHubConfig.STORAGE_KEYS.CURRENT_USER);
    },
    
    getUserType() {
        return localStorage.getItem(EventHubConfig.STORAGE_KEYS.USER_TYPE);
    },
    
    isLoggedIn() {
        return !!this.getAuthToken();
    }
};

// ============================================================================
// DATE/TIME FORMATTING
// ============================================================================
const DateHelper = {
    formatDate(dateString, options = {}) {
        const defaultOptions = {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        };
        return new Date(dateString).toLocaleDateString('en-US', { ...defaultOptions, ...options });
    },
    
    formatTime(dateString) {
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    },
    
    formatDateTime(dateString) {
        return `${this.formatDate(dateString)} at ${this.formatTime(dateString)}`;
    },
    
    formatRelativeTime(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diffMs = now - time;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        return time.toLocaleDateString();
    },
    
    getTodayString() {
        return new Date().toISOString().split('T')[0];
    },
    
    isFutureDate(dateString) {
        return new Date(dateString) > new Date();
    }
};

// ============================================================================
// NUMBER/CURRENCY FORMATTING
// ============================================================================
const NumberHelper = {
    formatCurrency(amount, currency = 'USD') {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency
        }).format(amount);
    },
    
    formatNumber(num) {
        return num.toLocaleString();
    },
    
    formatPercentage(value, decimals = 1) {
        return `${value.toFixed(decimals)}%`;
    }
};

// ============================================================================
// VALIDATION HELPERS
// ============================================================================
const ValidationHelper = {
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },
    
    isValidPhone(phone) {
        const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
        return phoneRegex.test(phone);
    },
    
    isEmpty(value) {
        return value === null || value === undefined || value.toString().trim() === '';
    },
    
    validateForm(formId) {
        const form = document.getElementById(formId);
        if (!form) return false;
        
        let isValid = true;
        const requiredFields = form.querySelectorAll('[required]');
        
        requiredFields.forEach(field => {
            const errorElement = field.parentNode.querySelector('.form-error');
            
            if (this.isEmpty(field.value)) {
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
            if (field.value && !this.isValidEmail(field.value)) {
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
};

// ============================================================================
// UI HELPERS
// ============================================================================
const UIHelper = {
    // Show alert notification
    showAlert(message, type = 'info') {
        // Remove existing alerts
        const existingAlert = document.querySelector('.alert-notification');
        if (existingAlert) {
            existingAlert.remove();
        }
        
        const colors = {
            success: '#10b981',
            danger: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        
        const alert = document.createElement('div');
        alert.className = `alert-notification alert-${type}`;
        alert.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            z-index: 10000;
            min-width: 300px;
            max-width: 400px;
            padding: 15px 20px;
            background: ${colors[type] || colors.info};
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
        }, EventHubConfig.ALERT_DURATION);
    },
    
    // Get badge class for status
    getBadgeClass(status) {
        const normalizedStatus = status.toLowerCase();
        return EventHubConfig.STATUS_BADGES[normalizedStatus] || 'secondary';
    },
    
    // Get category icon
    getCategoryIcon(category) {
        const normalizedCategory = category ? category.toLowerCase() : 'default';
        return EventHubConfig.CATEGORY_ICONS[normalizedCategory] || EventHubConfig.CATEGORY_ICONS.default;
    },
    
    // Create loading spinner
    createSpinner(text = 'Loading...') {
        return `<div class="text-center"><i class="fas fa-spinner fa-spin"></i> ${text}</div>`;
    },
    
    // Create empty state
    createEmptyState(icon, title, message, buttonText = null, buttonAction = null) {
        let html = `
            <div class="text-center" style="padding: 40px;">
                <i class="fas fa-${icon}" style="font-size: 4rem; color: #ccc; margin-bottom: 20px;"></i>
                <h3>${title}</h3>
                <p>${message}</p>
        `;
        
        if (buttonText && buttonAction) {
            html += `<button class="btn btn-primary" onclick="${buttonAction}">${buttonText}</button>`;
        }
        
        html += '</div>';
        return html;
    },
    
    // Modal functions
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    },
    
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    },
    
    // Capitalize first letter
    capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
};

// ============================================================================
// NAVIGATION HELPERS
// ============================================================================
const NavigationHelper = {
    isInPagesFolder() {
        return window.location.pathname.includes('/pages/');
    },
    
    getPathPrefix() {
        return this.isInPagesFolder() ? '' : 'pages/';
    },
    
    getHomeUrl() {
        return this.isInPagesFolder() ? '../index.html' : 'index.html';
    },
    
    getDashboardUrl(userType) {
        const prefix = this.getPathPrefix();
        const dashboards = {
            [EventHubConfig.USER_TYPES.ADMIN]: 'admin-dashboard.html',
            [EventHubConfig.USER_TYPES.ORGANIZER]: 'organizer-dashboard.html',
            [EventHubConfig.USER_TYPES.USER]: 'user-dashboard.html'
        };
        return prefix + (dashboards[userType] || dashboards[EventHubConfig.USER_TYPES.USER]);
    },
    
    updateNavigation() {
        const navAuth = document.querySelector('.nav-auth');
        if (!navAuth) return;
        
        const isLoggedIn = StorageHelper.isLoggedIn();
        const user = StorageHelper.getCurrentUser();
        const userType = StorageHelper.getUserType();
        const prefix = this.getPathPrefix();
        
        if (isLoggedIn && user) {
            const userName = user.firstName || user.name || 'User';
            const dashboardLink = this.getDashboardUrl(userType);
            
            navAuth.innerHTML = `
                <div style="display: flex; align-items: center; gap: 15px;">
                    <a href="${dashboardLink}" style="color: inherit; text-decoration: none;">
                        <span style="cursor: pointer;">Welcome, ${userName}!</span>
                    </a>
                    <button class="btn btn-outline btn-small" onclick="AuthHelper.logout()">Logout</button>
                </div>
            `;
        } else {
            navAuth.innerHTML = `
                <a href="${prefix}login.html" class="btn btn-outline">Login</a>
                <a href="${prefix}register.html" class="btn btn-primary">Register</a>
            `;
        }
    },
    
    redirectToLogin(message = 'Please log in to continue.') {
        UIHelper.showAlert(message, 'warning');
        setTimeout(() => {
            window.location.href = this.getPathPrefix() + 'login.html';
        }, EventHubConfig.REDIRECT_DELAY);
    },
    
    redirectToDashboard(userType) {
        window.location.href = this.getDashboardUrl(userType);
    }
};

// ============================================================================
// AUTHENTICATION HELPERS
// ============================================================================
const AuthHelper = {
    logout() {
        StorageHelper.clearAuth();
        UIHelper.showAlert('Logged out successfully!', 'success');
        setTimeout(() => {
            window.location.href = NavigationHelper.getHomeUrl();
        }, EventHubConfig.REDIRECT_DELAY);
    },
    
    checkAuth(requiredType = null) {
        if (!StorageHelper.isLoggedIn()) {
            NavigationHelper.redirectToLogin();
            return false;
        }
        
        if (requiredType) {
            const userType = StorageHelper.getUserType();
            if (userType !== requiredType && userType !== EventHubConfig.USER_TYPES.ADMIN) {
                UIHelper.showAlert('Access denied. Insufficient permissions.', 'danger');
                NavigationHelper.redirectToDashboard(userType);
                return false;
            }
        }
        
        return true;
    },
    
    isAdmin() {
        return StorageHelper.getUserType() === EventHubConfig.USER_TYPES.ADMIN;
    },
    
    isOrganizer() {
        const type = StorageHelper.getUserType();
        return type === EventHubConfig.USER_TYPES.ORGANIZER || type === EventHubConfig.USER_TYPES.ADMIN;
    }
};

// ============================================================================
// API HELPER
// ============================================================================
const ApiHelper = {
    async request(endpoint, options = {}) {
        const url = `${EventHubConfig.API_BASE_URL}${endpoint}`;
        const token = StorageHelper.getAuthToken();
        
        const isPublicEndpoint = EventHubConfig.PUBLIC_ENDPOINTS.some(pe => 
            endpoint === pe || endpoint.startsWith(pe + '/') || endpoint.startsWith(pe + '?')
        );
        
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...((token && !isPublicEndpoint) && { 'Authorization': `Bearer ${token}` }),
                ...(options.headers || {})
            },
            ...options
        };
        
        if (options.requireAuth && token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        
        try {
            const response = await fetch(url, config);
            
            if (response.status === 401 && !isPublicEndpoint) {
                StorageHelper.clearAuth();
                NavigationHelper.redirectToLogin('Session expired. Please log in again.');
                throw new Error('Unauthorized');
            }
            
            if (response.status === 403) {
                throw new Error('Access forbidden. You do not have permission.');
            }
            
            if (response.status === 404) {
                throw new Error('Resource not found.');
            }
            
            if (response.status === 500) {
                const errorData = await response.json().catch(() => ({ error: 'Internal server error' }));
                throw new Error(errorData.error || 'Server error occurred.');
            }
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
                throw new Error(errorData.error || errorData.details || `Request failed with status ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                UIHelper.showAlert('Cannot connect to server. Please ensure the backend is running.', 'danger');
            }
            
            throw error;
        }
    },
    
    async get(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'GET' });
    },
    
    async post(endpoint, data, options = {}) {
        return this.request(endpoint, { 
            ...options, 
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    
    async put(endpoint, data, options = {}) {
        return this.request(endpoint, { 
            ...options, 
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },
    
    async delete(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'DELETE' });
    }
};

// ============================================================================
// DASHBOARD BASE CLASS
// ============================================================================
class DashboardBase {
    constructor(dashboardType) {
        this.dashboardType = dashboardType;
        this.currentSection = 'dashboard';
        this.initialized = false;
    }
    
    async initialize() {
        // Check authentication
        if (!AuthHelper.checkAuth(this.getRequiredUserType())) {
            return false;
        }
        
        // Update navigation
        NavigationHelper.updateNavigation();
        
        // Update welcome message
        this.updateWelcomeMessage();
        
        // Initialize mobile nav toggle
        this.initNavToggle();
        
        // Load initial data
        await this.loadInitialData();
        
        this.initialized = true;
        return true;
    }
    
    getRequiredUserType() {
        // Override in subclass if specific type required
        return null;
    }
    
    updateWelcomeMessage() {
        const user = StorageHelper.getCurrentUser();
        if (!user) return;
        
        const headerP = document.querySelector('.dashboard-header p');
        if (headerP) {
            headerP.textContent = `Welcome back, ${user.firstName || 'User'}! Here's your overview.`;
        }
    }
    
    initNavToggle() {
        const navToggle = document.getElementById('navToggle');
        const navMenu = document.getElementById('navMenu');
        
        if (navToggle && navMenu) {
            navToggle.addEventListener('click', () => {
                navMenu.classList.toggle('active');
            });
        }
    }
    
    showSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('.dashboard-section').forEach(section => {
            section.classList.remove('active');
            section.style.display = 'none';
        });
        
        // Remove active class from all sidebar links
        document.querySelectorAll('.sidebar-menu a').forEach(link => {
            link.classList.remove('active');
        });
        
        // Show selected section
        const targetSection = document.getElementById(`${sectionName}-section`);
        if (targetSection) {
            targetSection.classList.add('active');
            targetSection.style.display = 'block';
        }
        
        // Add active class to clicked link
        const sidebarLink = document.querySelector(`.sidebar-menu a[href="#${sectionName}"]`);
        if (sidebarLink) {
            sidebarLink.classList.add('active');
        }
        
        this.currentSection = sectionName;
        
        // Load section-specific data
        this.loadSectionData(sectionName);
    }
    
    // Override in subclass
    async loadInitialData() {
        console.warn('loadInitialData should be overridden in subclass');
    }
    
    // Override in subclass
    loadSectionData(sectionName) {
        console.warn('loadSectionData should be overridden in subclass');
    }
}

// ============================================================================
// EVENT CARD GENERATOR
// ============================================================================
const EventCardGenerator = {
    create(event, options = {}) {
        const {
            showBookButton = true,
            isFromPagesFolder = NavigationHelper.isInPagesFolder(),
            onBook = null
        } = options;
        
        const formattedDate = DateHelper.formatDate(event.startDate);
        const formattedTime = DateHelper.formatTime(event.startDate);
        const availableSeats = event.capacity - (event.bookingCount || 0);
        const categoryIcon = UIHelper.getCategoryIcon(event.categoryName || event.category);
        
        const detailUrl = isFromPagesFolder ? 
            `event-detail.html?id=${event.eventId}` : 
            `pages/event-detail.html?id=${event.eventId}`;
        
        const eventImage = event.featuredImageUrl ? 
            `<img src="${event.featuredImageUrl}" alt="${event.title}" onerror="this.style.display='none'; this.parentNode.innerHTML='<i class=\\'fas fa-${categoryIcon}\\'></i>'" />` : 
            `<i class="fas fa-${categoryIcon}"></i>`;
        
        let cardFooter = `<a href="${detailUrl}" class="btn btn-outline btn-small">View Details</a>`;
        
        // Check if user is admin - admins cannot book events
        const userType = typeof localStorage !== 'undefined' ? localStorage.getItem('userType') : null;
        const isAdmin = userType === 'Admin';
        
        if (showBookButton && !isAdmin) {
            if (availableSeats <= 0) {
                cardFooter += `<button class="btn btn-primary btn-small" disabled>Sold Out</button>`;
            } else {
                const bookAction = onBook || `quickBookEvent('${event.eventId}')`;
                cardFooter += `<button onclick="${bookAction}" class="btn btn-primary btn-small">Book Now</button>`;
            }
        }
        
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
                            <span>${event.isOnline ? 'Online Event' : (event.venueName || event.venue || 'TBA')}</span>
                        </div>
                        <div class="event-detail">
                            <i class="fas fa-users"></i>
                            <span>${availableSeats}/${event.capacity} available</span>
                        </div>
                    </div>
                    <div class="event-price">
                        ${event.isFree || event.price === 0 ? 'Free' : NumberHelper.formatCurrency(event.price)}
                    </div>
                    <div class="card-footer">
                        ${cardFooter}
                    </div>
                </div>
            </div>
        `;
    }
};

// ============================================================================
// TABLE GENERATOR
// ============================================================================
const TableGenerator = {
    createRow(cells, options = {}) {
        const { className = '' } = options;
        return `<tr class="${className}">${cells.map(cell => `<td>${cell}</td>`).join('')}</tr>`;
    },
    
    createStatusBadge(status) {
        const badgeClass = UIHelper.getBadgeClass(status);
        return `<span class="badge badge-${badgeClass}">${UIHelper.capitalize(status)}</span>`;
    },
    
    createActionButtons(actions) {
        return actions.map(action => 
            `<button class="btn btn-small ${action.class || 'btn-outline'}" onclick="${action.onclick}">${action.label}</button>`
        ).join(' ');
    },
    
    createEmptyRow(colspan, message = 'No data found') {
        return `<tr><td colspan="${colspan}" class="text-center">${message}</td></tr>`;
    },
    
    createLoadingRow(colspan) {
        return `<tr><td colspan="${colspan}" class="text-center">${UIHelper.createSpinner()}</td></tr>`;
    }
};

// ============================================================================
// EXPORT TO GLOBAL SCOPE
// ============================================================================
window.EventHubConfig = EventHubConfig;
window.StorageHelper = StorageHelper;
window.DateHelper = DateHelper;
window.NumberHelper = NumberHelper;
window.ValidationHelper = ValidationHelper;
window.UIHelper = UIHelper;
window.NavigationHelper = NavigationHelper;
window.AuthHelper = AuthHelper;
window.ApiHelper = ApiHelper;
window.DashboardBase = DashboardBase;
window.EventCardGenerator = EventCardGenerator;
window.TableGenerator = TableGenerator;

// Shortcut functions for backward compatibility
window.showAlert = UIHelper.showAlert.bind(UIHelper);
window.openModal = UIHelper.openModal.bind(UIHelper);
window.closeModal = UIHelper.closeModal.bind(UIHelper);
window.validateForm = ValidationHelper.validateForm.bind(ValidationHelper);

// Add CSS for animations if not present
if (!document.getElementById('eventhub-utils-styles')) {
    const style = document.createElement('style');
    style.id = 'eventhub-utils-styles';
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
}
