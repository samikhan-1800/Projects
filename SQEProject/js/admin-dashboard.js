// Admin Dashboard JavaScript
// Extends main EventHub functionality with admin-specific features

// Admin data stores
let adminStats = {};
let allUsers = [];
let allEvents = [];
let recentActivities = [];

// Admin API functions
async function fetchAdminStats() {
    try {
        adminStats = await EventHub.apiRequest('/admin/stats');
        return adminStats;
    } catch (error) {
        console.error('Failed to fetch admin stats:', error);
        return {
            totalUsers: 0,
            totalEvents: 0,
            totalBookings: 0,
            totalRevenue: 0,
            growth: { users: 0, events: 0, bookings: 0, revenue: 0 }
        };
    }
}

async function fetchAllUsers() {
    try {
        allUsers = await EventHub.apiRequest('/admin/users');
        return allUsers;
    } catch (error) {
        console.error('Failed to fetch users:', error);
        return [];
    }
}

async function fetchAllEvents() {
    try {
        allEvents = await EventHub.apiRequest('/admin/events');
        return allEvents;
    } catch (error) {
        console.error('Failed to fetch events:', error);
        return [];
    }
}

async function fetchRecentActivities() {
    try {
        recentActivities = await EventHub.apiRequest('/admin/activities');
        return recentActivities;
    } catch (error) {
        console.error('Failed to fetch activities:', error);
        return [];
    }
}

// Dashboard section management
let currentSection = 'overview';

function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.dashboard-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Remove active class from all sidebar links
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Show selected section
    const section = document.getElementById(sectionName);
    if (section) {
        section.classList.add('active');
    }
    
    // Add active class to clicked link
    const activeLink = document.querySelector(`[data-section="${sectionName}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
    
    currentSection = sectionName;
    
    // Load section-specific data
    switch(sectionName) {
        case 'overview':
            loadDashboardOverview();
            break;
        case 'users':
            loadUsersSection();
            break;
        case 'events':
            loadEventsSection();
            break;
        case 'analytics':
            loadAnalyticsCharts();
            break;
    }
}

// Load dashboard overview data
async function loadDashboardOverview() {
    try {
        const stats = await fetchAdminStats();
        
        // Update stats
        document.getElementById('totalUsers').textContent = stats.totalUsers.toLocaleString();
        document.getElementById('totalEvents').textContent = stats.totalEvents.toLocaleString();
        document.getElementById('totalBookings').textContent = stats.totalBookings.toLocaleString();
        document.getElementById('totalRevenue').textContent = `$${stats.totalRevenue.toLocaleString()}`;
        
        // Load recent activities
        await loadRecentActivities();
        
        // Initialize charts if Chart.js is available
        if (typeof Chart !== 'undefined') {
            initializeBookingsChart();
        }
    } catch (error) {
        console.error('Failed to load dashboard overview:', error);
        EventHub.showAlert('Failed to load dashboard data', 'danger');
    }
}

// Load recent activities
async function loadRecentActivities() {
    const container = document.getElementById('recentActivities');
    if (!container) return;
    
    try {
        const activities = await fetchRecentActivities();
        
        if (activities.length === 0) {
            container.innerHTML = '<p class="text-center text-muted">No recent activities</p>';
            return;
        }
        
        container.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon" style="background: ${getActivityColor(activity.type)};">
                    <i class="${getActivityIcon(activity.type)}"></i>
                </div>
                <div class="activity-content">
                    <p style="margin: 0; font-weight: 500;">${activity.message}</p>
                    <small class="text-muted">${activity.details} - ${formatTimestamp(activity.createdAt)}</small>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Failed to load activities:', error);
        container.innerHTML = '<p class="text-center text-muted">Failed to load activities</p>';
    }
}

// Helper functions for activities
function getActivityColor(type) {
    const colors = {
        'user_registration': '#28a745',
        'event_submission': '#17a2b8',
        'support_ticket': '#ffc107',
        'booking_created': '#007bff',
        'payment_completed': '#28a745'
    };
    return colors[type] || '#6c757d';
}

function getActivityIcon(type) {
    const icons = {
        'user_registration': 'fas fa-user-plus',
        'event_submission': 'fas fa-calendar-plus',
        'support_ticket': 'fas fa-exclamation-triangle',
        'booking_created': 'fas fa-ticket-alt',
        'payment_completed': 'fas fa-credit-card'
    };
    return icons[type] || 'fas fa-info-circle';
}

function formatTimestamp(timestamp) {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffMs = now - activityTime;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return activityTime.toLocaleDateString();
}

// Load users section
async function loadUsersSection() {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;
    
    try {
        const users = await fetchAllUsers();
        
        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">No users found</td></tr>';
            return;
        }
        
        tbody.innerHTML = users.map(user => `
            <tr>
                <td>
                    <div>
                        <strong>${user.firstName} ${user.lastName}</strong>
                        <small class="text-muted d-block">ID: ${user.userId}</small>
                    </div>
                </td>
                <td>${user.email}</td>
                <td><span class="badge badge-${user.role === 'Admin' ? 'secondary' : user.role === 'Organizer' ? 'primary' : 'info'}">${user.role}</span></td>
                <td><span class="badge badge-${user.status === 'Active' ? 'success' : 'warning'}">${user.status}</span></td>
                <td>${new Date(user.createdAt).toLocaleDateString()}</td>
                <td>${user.bookingCount || '-'}</td>
                <td>
                    <button class="btn btn-small btn-outline" onclick="viewUser('${user.userId}')">View</button>
                    ${user.role !== 'Admin' ? `<button class="btn btn-small btn-warning" onclick="suspendUser('${user.userId}')">Suspend</button>` : ''}
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Failed to load users:', error);
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">Failed to load users</td></tr>';
    }
}

// Load events section
async function loadEventsSection() {
    const tbody = document.getElementById('eventsTableBody');
    if (!tbody) return;
    
    try {
        const events = await fetchAllEvents();
        
        if (events.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" class="text-center">No events found</td></tr>';
            return;
        }
        
        tbody.innerHTML = events.map(event => `
            <tr>
                <td>
                    <div>
                        <strong>${event.title}</strong>
                        <small class="text-muted d-block">ID: ${event.eventId}</small>
                    </div>
                </td>
                <td>${event.organizerName || 'Unknown'}</td>
                <td>${new Date(event.startDate).toLocaleDateString()}</td>
                <td>${event.categoryName || 'Uncategorized'}</td>
                <td>${event.capacity}</td>
                <td>${event.bookingCount || 0}/${event.capacity}</td>
                <td>$${(event.totalRevenue || 0).toLocaleString()}</td>
                <td><span class="badge badge-${event.status === 'Published' ? 'success' : event.status === 'Draft' ? 'warning' : 'secondary'}">${event.status}</span></td>
                <td>
                    ${event.status === 'Draft' ? 
                        `<button class="btn btn-small btn-success" onclick="approveEvent('${event.eventId}')">Approve</button>
                         <button class="btn btn-small btn-danger" onclick="rejectEvent('${event.eventId}')">Reject</button>` :
                        `<button class="btn btn-small btn-outline" onclick="viewEvent('${event.eventId}')">View</button>`
                    }
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Failed to load events:', error);
        tbody.innerHTML = '<tr><td colspan="9" class="text-center">Failed to load events</td></tr>';
    }
}

// Initialize booking chart
function initializeBookingsChart() {
    const ctx = document.getElementById('bookingsChart');
    if (!ctx) return;
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Bookings',
                data: [65, 59, 80, 81, 56, 95, 120],
                borderColor: 'rgb(14, 165, 164)',
                backgroundColor: 'rgba(14, 165, 164, 0.1)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Load analytics charts
function loadAnalyticsCharts() {
    if (typeof Chart === 'undefined') return;
    
    // Revenue chart
    const revenueCtx = document.getElementById('revenueChart');
    if (revenueCtx) {
        new Chart(revenueCtx, {
            type: 'bar',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Revenue',
                    data: [12000, 19000, 15000, 25000, 22000, 30000],
                    backgroundColor: 'rgba(14, 165, 164, 0.6)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }
    
    // User growth chart
    const userGrowthCtx = document.getElementById('userGrowthChart');
    if (userGrowthCtx) {
        new Chart(userGrowthCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'New Users',
                    data: [50, 75, 100, 125, 90, 150],
                    borderColor: 'rgb(124, 58, 237)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }
    
    // Categories pie chart
    const categoriesCtx = document.getElementById('categoriesChart');
    if (categoriesCtx) {
        new Chart(categoriesCtx, {
            type: 'doughnut',
            data: {
                labels: ['Technology', 'Music', 'Business', 'Art', 'Sports'],
                datasets: [{
                    data: [35, 25, 20, 15, 5],
                    backgroundColor: [
                        'rgb(14, 165, 164)',
                        'rgb(124, 58, 237)',
                        'rgb(34, 197, 94)',
                        'rgb(245, 158, 11)',
                        'rgb(239, 68, 68)'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }
}

// Event management functions
async function approveEvent(eventId) {
    try {
        await EventHub.apiRequest(`/admin/events/${eventId}/approve`, {
            method: 'PUT'
        });
        EventHub.showAlert('Event approved successfully!', 'success');
        await loadEventsSection(); // Refresh table
    } catch (error) {
        console.error('Failed to approve event:', error);
        EventHub.showAlert('Failed to approve event', 'danger');
    }
}

async function rejectEvent(eventId) {
    const reason = prompt('Please provide a reason for rejection:');
    if (reason) {
        try {
            await EventHub.apiRequest(`/admin/events/${eventId}/reject`, {
                method: 'PUT',
                body: JSON.stringify({ reason })
            });
            EventHub.showAlert('Event rejected successfully', 'warning');
            await loadEventsSection(); // Refresh table
        } catch (error) {
            console.error('Failed to reject event:', error);
            EventHub.showAlert('Failed to reject event', 'danger');
        }
    }
}

async function suspendEvent(eventId) {
    if (confirm('Are you sure you want to suspend this event?')) {
        try {
            await EventHub.apiRequest(`/admin/events/${eventId}/suspend`, {
                method: 'PUT'
            });
            EventHub.showAlert('Event suspended successfully', 'warning');
            await loadEventsSection(); // Refresh table
        } catch (error) {
            console.error('Failed to suspend event:', error);
            EventHub.showAlert('Failed to suspend event', 'danger');
        }
    }
}

function viewEvent(eventId) {
    window.open(`../pages/event-detail.html?id=${eventId}`, '_blank');
}

// User management functions
function viewUser(userId) {
    // Open user details in modal or new page
    EventHub.showAlert('User details functionality to be implemented', 'info');
}

async function suspendUser(userId) {
    if (confirm('Are you sure you want to suspend this user?')) {
        try {
            await EventHub.apiRequest(`/admin/users/${userId}/suspend`, {
                method: 'PUT'
            });
            EventHub.showAlert('User suspended successfully', 'warning');
            await loadUsersSection(); // Refresh table
        } catch (error) {
            console.error('Failed to suspend user:', error);
            EventHub.showAlert('Failed to suspend user', 'danger');
        }
    }
}

async function promoteUser(userId) {
    if (confirm('Are you sure you want to promote this user to admin?')) {
        try {
            await EventHub.apiRequest(`/admin/users/${userId}/promote`, {
                method: 'PUT',
                body: JSON.stringify({ role: 'Admin' })
            });
            EventHub.showAlert('User promoted successfully', 'success');
            await loadUsersSection(); // Refresh table
        } catch (error) {
            console.error('Failed to promote user:', error);
            EventHub.showAlert('Failed to promote user', 'danger');
        }
    }
}

// Filter functions
function filterUsers() {
    const search = document.getElementById('userSearch').value.toLowerCase();
    const role = document.getElementById('userRoleFilter').value;
    const status = document.getElementById('userStatusFilter').value;
    
    let filteredUsers = [...allUsers];
    
    if (search) {
        filteredUsers = filteredUsers.filter(user => 
            `${user.firstName} ${user.lastName}`.toLowerCase().includes(search) || 
            user.email.toLowerCase().includes(search)
        );
    }
    
    if (role) {
        filteredUsers = filteredUsers.filter(user => user.role === role);
    }
    
    if (status) {
        filteredUsers = filteredUsers.filter(user => user.status === status);
    }
    
    // Update table with filtered results
    const tbody = document.getElementById('usersTableBody');
    if (tbody) {
        tbody.innerHTML = filteredUsers.map(user => `
            <tr>
                <td>
                    <div>
                        <strong>${user.firstName} ${user.lastName}</strong>
                        <small class="text-muted d-block">ID: ${user.userId}</small>
                    </div>
                </td>
                <td>${user.email}</td>
                <td><span class="badge badge-${user.role === 'Admin' ? 'secondary' : user.role === 'Organizer' ? 'primary' : 'info'}">${user.role}</span></td>
                <td><span class="badge badge-${user.status === 'Active' ? 'success' : 'warning'}">${user.status}</span></td>
                <td>${new Date(user.createdAt).toLocaleDateString()}</td>
                <td>${user.bookingCount || '-'}</td>
                <td>
                    <button class="btn btn-small btn-outline" onclick="viewUser('${user.userId}')">View</button>
                    ${user.role !== 'Admin' ? `<button class="btn btn-small btn-warning" onclick="suspendUser('${user.userId}')">Suspend</button>` : ''}
                </td>
            </tr>
        `).join('');
    }
}

function filterEvents() {
    const search = document.getElementById('eventSearch').value.toLowerCase();
    const category = document.getElementById('eventCategoryFilter').value;
    const status = document.getElementById('eventStatusFilter').value;
    
    let filteredEvents = [...allEvents];
    
    if (search) {
        filteredEvents = filteredEvents.filter(event => 
            event.title.toLowerCase().includes(search) || 
            (event.organizerName && event.organizerName.toLowerCase().includes(search))
        );
    }
    
    if (category) {
        filteredEvents = filteredEvents.filter(event => 
            event.categoryName && event.categoryName.toLowerCase() === category.toLowerCase()
        );
    }
    
    if (status) {
        filteredEvents = filteredEvents.filter(event => event.status === status);
    }
    
    // Update table with filtered results
    const tbody = document.getElementById('eventsTableBody');
    if (tbody) {
        tbody.innerHTML = filteredEvents.map(event => `
            <tr>
                <td>
                    <div>
                        <strong>${event.title}</strong>
                        <small class="text-muted d-block">ID: ${event.eventId}</small>
                    </div>
                </td>
                <td>${event.organizerName || 'Unknown'}</td>
                <td>${new Date(event.startDate).toLocaleDateString()}</td>
                <td>${event.categoryName || 'Uncategorized'}</td>
                <td>${event.capacity}</td>
                <td>${event.bookingCount || 0}/${event.capacity}</td>
                <td>$${(event.totalRevenue || 0).toLocaleString()}</td>
                <td><span class="badge badge-${event.status === 'Published' ? 'success' : event.status === 'Draft' ? 'warning' : 'secondary'}">${event.status}</span></td>
                <td>
                    ${event.status === 'Draft' ? 
                        `<button class="btn btn-small btn-success" onclick="approveEvent('${event.eventId}')">Approve</button>
                         <button class="btn btn-small btn-danger" onclick="rejectEvent('${event.eventId}')">Reject</button>` :
                        `<button class="btn btn-small btn-outline" onclick="viewEvent('${event.eventId}')">View</button>`
                    }
                </td>
            </tr>
        `).join('');
    }
}

// Utility functions
async function refreshData() {
    try {
        EventHub.showAlert('Refreshing data...', 'info');
        await loadDashboardOverview();
        if (currentSection === 'users') {
            await loadUsersSection();
        } else if (currentSection === 'events') {
            await loadEventsSection();
        }
        EventHub.showAlert('Data refreshed successfully!', 'success');
    } catch (error) {
        console.error('Failed to refresh data:', error);
        EventHub.showAlert('Failed to refresh data', 'danger');
    }
}

async function exportData() {
    try {
        EventHub.showAlert('Exporting data...', 'info');
        const blob = await EventHub.apiRequest('/admin/export/all', {
            method: 'GET',
            headers: {
                'Accept': 'application/octet-stream'
            }
        });
        
        // Create download link
        const url = window.URL.createObjectURL(new Blob([blob]));
        const a = document.createElement('a');
        a.href = url;
        a.download = `eventhub-export-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        
        EventHub.showAlert('Data exported successfully!', 'success');
    } catch (error) {
        console.error('Export failed:', error);
        EventHub.showAlert('Export failed', 'danger');
    }
}

async function exportUsers() {
    try {
        EventHub.showAlert('Exporting users...', 'info');
        const response = await fetch(`${EventHub.API_BASE_URL}/admin/export/users`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });
        
        if (!response.ok) throw new Error('Export failed');
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        
        EventHub.showAlert('Users exported successfully!', 'success');
    } catch (error) {
        console.error('User export failed:', error);
        EventHub.showAlert('User export failed', 'danger');
    }
}

async function exportEvents() {
    try {
        EventHub.showAlert('Exporting events...', 'info');
        const response = await fetch(`${EventHub.API_BASE_URL}/admin/export/events`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });
        
        if (!response.ok) throw new Error('Export failed');
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `events-export-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        
        EventHub.showAlert('Events exported successfully!', 'success');
    } catch (error) {
        console.error('Event export failed:', error);
        EventHub.showAlert('Event export failed', 'danger');
    }
}

// Initialize admin dashboard
document.addEventListener('DOMContentLoaded', () => {
    // Load initial data
    loadDashboardOverview();
    
    // Set up filter event listeners
    const userSearch = document.getElementById('userSearch');
    const userRoleFilter = document.getElementById('userRoleFilter');
    const userStatusFilter = document.getElementById('userStatusFilter');
    
    if (userSearch) {
        userSearch.addEventListener('input', filterUsers);
    }
    if (userRoleFilter) {
        userRoleFilter.addEventListener('change', filterUsers);
    }
    if (userStatusFilter) {
        userStatusFilter.addEventListener('change', filterUsers);
    }
    
    const eventSearch = document.getElementById('eventSearch');
    const eventCategoryFilter = document.getElementById('eventCategoryFilter');
    const eventStatusFilter = document.getElementById('eventStatusFilter');
    
    if (eventSearch) {
        eventSearch.addEventListener('input', filterEvents);
    }
    if (eventCategoryFilter) {
        eventCategoryFilter.addEventListener('change', filterEvents);
    }
    if (eventStatusFilter) {
        eventStatusFilter.addEventListener('change', filterEvents);
    }
    
    // Handle sidebar navigation
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.getAttribute('data-section');
            if (section) {
                showSection(section);
            }
        });
    });
    
    // Handle forms
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            EventHub.showAlert('Settings updated successfully!', 'success');
        });
    });
});

// Export admin functions to global scope
window.AdminDashboard = {
    showSection,
    approveEvent,
    rejectEvent,
    suspendEvent,
    viewEvent,
    viewUser,
    suspendUser,
    promoteUser,
    refreshData,
    exportData,
    exportUsers,
    exportEvents
};