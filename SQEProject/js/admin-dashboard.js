// Admin Dashboard JavaScript
// Extends main EventHub functionality with admin-specific features

// Sample admin data (would come from API in production)
const adminData = {
    stats: {
        totalUsers: 1247,
        totalEvents: 89,
        totalBookings: 5432,
        totalRevenue: 127890,
        growth: {
            users: 12,
            events: 8,
            bookings: 23,
            revenue: 18
        }
    },
    recentActivities: [
        {
            id: 1,
            type: 'user_registration',
            message: 'New user registered',
            details: 'john.doe@email.com',
            timestamp: '2 minutes ago',
            icon: 'fas fa-user-plus',
            color: '#28a745'
        },
        {
            id: 2,
            type: 'event_submission',
            message: 'New event submitted',
            details: 'Digital Marketing Summit',
            timestamp: '15 minutes ago',
            icon: 'fas fa-calendar-plus',
            color: '#17a2b8'
        },
        {
            id: 3,
            type: 'support_ticket',
            message: 'Support ticket created',
            details: 'Payment issue',
            timestamp: '1 hour ago',
            icon: 'fas fa-exclamation-triangle',
            color: '#ffc107'
        }
    ],
    users: [
        {
            id: 1001,
            name: 'John Doe',
            email: 'john@example.com',
            role: 'user',
            status: 'active',
            joinDate: '2025-01-15',
            eventsBooked: 3
        },
        {
            id: 1002,
            name: 'Jane Smith',
            email: 'jane@techevents.com',
            role: 'organizer',
            status: 'active',
            joinDate: '2025-02-10',
            eventsCreated: 12
        },
        {
            id: 1003,
            name: 'Mike Johnson',
            email: 'mike@example.com',
            role: 'admin',
            status: 'active',
            joinDate: '2025-01-01',
            eventsBooked: 0
        }
    ],
    events: [
        {
            id: 1,
            title: 'Tech Conference 2025',
            organizer: 'TechEvents Inc.',
            date: '2025-11-15',
            category: 'Technology',
            capacity: 500,
            booked: 350,
            revenue: 104650,
            status: 'approved'
        },
        {
            id: 7,
            title: 'Digital Marketing Summit',
            organizer: 'Marketing Pro LLC',
            date: '2025-12-01',
            category: 'Business',
            capacity: 200,
            booked: 0,
            revenue: 0,
            status: 'pending'
        }
    ]
};

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
function loadDashboardOverview() {
    // Update stats
    document.getElementById('totalUsers').textContent = adminData.stats.totalUsers.toLocaleString();
    document.getElementById('totalEvents').textContent = adminData.stats.totalEvents.toLocaleString();
    document.getElementById('totalBookings').textContent = adminData.stats.totalBookings.toLocaleString();
    document.getElementById('totalRevenue').textContent = `$${adminData.stats.totalRevenue.toLocaleString()}`;
    
    // Load recent activities
    loadRecentActivities();
    
    // Initialize charts if Chart.js is available
    if (typeof Chart !== 'undefined') {
        initializeBookingsChart();
    }
}

// Load recent activities
function loadRecentActivities() {
    const container = document.getElementById('recentActivities');
    if (!container) return;
    
    container.innerHTML = adminData.recentActivities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon" style="background: ${activity.color};">
                <i class="${activity.icon}"></i>
            </div>
            <div class="activity-content">
                <p style="margin: 0; font-weight: 500;">${activity.message}</p>
                <small class="text-muted">${activity.details} - ${activity.timestamp}</small>
            </div>
        </div>
    `).join('');
}

// Load users section
function loadUsersSection() {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = adminData.users.map(user => `
        <tr>
            <td>
                <div>
                    <strong>${user.name}</strong>
                    <small class="text-muted d-block">ID: ${user.id}</small>
                </div>
            </td>
            <td>${user.email}</td>
            <td><span class="badge badge-${user.role === 'admin' ? 'secondary' : user.role === 'organizer' ? 'primary' : 'info'}">${user.role}</span></td>
            <td><span class="badge badge-success">${user.status}</span></td>
            <td>${new Date(user.joinDate).toLocaleDateString()}</td>
            <td>${user.eventsBooked || user.eventsCreated || '-'}</td>
            <td>
                <button class="btn btn-small btn-outline" onclick="viewUser(${user.id})">View</button>
                ${user.role !== 'admin' ? `<button class="btn btn-small btn-warning" onclick="suspendUser(${user.id})">Suspend</button>` : ''}
            </td>
        </tr>
    `).join('');
}

// Load events section
function loadEventsSection() {
    const tbody = document.getElementById('eventsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = adminData.events.map(event => `
        <tr>
            <td>
                <div>
                    <strong>${event.title}</strong>
                    <small class="text-muted d-block">ID: ${String(event.id).padStart(3, '0')}</small>
                </div>
            </td>
            <td>${event.organizer}</td>
            <td>${new Date(event.date).toLocaleDateString()}</td>
            <td>${event.category}</td>
            <td>${event.capacity}</td>
            <td>${event.booked}/${event.capacity}</td>
            <td>$${event.revenue.toLocaleString()}</td>
            <td><span class="badge badge-${event.status === 'approved' ? 'success' : 'warning'}">${event.status}</span></td>
            <td>
                ${event.status === 'pending' ? 
                    `<button class="btn btn-small btn-success" onclick="approveEvent(${event.id})">Approve</button>
                     <button class="btn btn-small btn-danger" onclick="rejectEvent(${event.id})">Reject</button>` :
                    `<button class="btn btn-small btn-outline" onclick="viewEvent(${event.id})">View</button>`
                }
            </td>
        </tr>
    `).join('');
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
function approveEvent(eventId) {
    EventHub.showAlert(`Event ${eventId} approved successfully!`, 'success');
    // Update event status in data
    const event = adminData.events.find(e => e.id === eventId);
    if (event) {
        event.status = 'approved';
        loadEventsSection(); // Refresh table
    }
}

function rejectEvent(eventId) {
    const reason = prompt('Please provide a reason for rejection:');
    if (reason) {
        EventHub.showAlert(`Event ${eventId} rejected. Reason: ${reason}`, 'warning');
        // Remove event from pending list
        adminData.events = adminData.events.filter(e => e.id !== eventId);
        loadEventsSection(); // Refresh table
    }
}

function suspendEvent(eventId) {
    if (confirm('Are you sure you want to suspend this event?')) {
        EventHub.showAlert(`Event ${eventId} suspended successfully!`, 'warning');
    }
}

function viewEvent(eventId) {
    EventHub.showAlert(`Viewing event ${eventId} details...`, 'info');
}

// User management functions
function viewUser(userId) {
    EventHub.showAlert(`Viewing user ${userId} profile...`, 'info');
}

function suspendUser(userId) {
    if (confirm('Are you sure you want to suspend this user?')) {
        EventHub.showAlert(`User ${userId} suspended successfully!`, 'warning');
        // Update user status
        const user = adminData.users.find(u => u.id === userId);
        if (user) {
            user.status = 'suspended';
            loadUsersSection(); // Refresh table
        }
    }
}

function promoteUser(userId) {
    EventHub.showAlert(`User ${userId} promoted to admin!`, 'success');
}

// Filter functions
function filterUsers() {
    const search = document.getElementById('userSearch').value.toLowerCase();
    const role = document.getElementById('userRoleFilter').value;
    const status = document.getElementById('userStatusFilter').value;
    
    let filteredUsers = adminData.users;
    
    if (search) {
        filteredUsers = filteredUsers.filter(user => 
            user.name.toLowerCase().includes(search) || 
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
                        <strong>${user.name}</strong>
                        <small class="text-muted d-block">ID: ${user.id}</small>
                    </div>
                </td>
                <td>${user.email}</td>
                <td><span class="badge badge-${user.role === 'admin' ? 'secondary' : user.role === 'organizer' ? 'primary' : 'info'}">${user.role}</span></td>
                <td><span class="badge badge-success">${user.status}</span></td>
                <td>${new Date(user.joinDate).toLocaleDateString()}</td>
                <td>${user.eventsBooked || user.eventsCreated || '-'}</td>
                <td>
                    <button class="btn btn-small btn-outline" onclick="viewUser(${user.id})">View</button>
                    ${user.role !== 'admin' ? `<button class="btn btn-small btn-warning" onclick="suspendUser(${user.id})">Suspend</button>` : ''}
                </td>
            </tr>
        `).join('');
    }
}

function filterEvents() {
    const search = document.getElementById('eventSearch').value.toLowerCase();
    const category = document.getElementById('eventCategoryFilter').value;
    const status = document.getElementById('eventStatusFilter').value;
    
    let filteredEvents = adminData.events;
    
    if (search) {
        filteredEvents = filteredEvents.filter(event => 
            event.title.toLowerCase().includes(search) || 
            event.organizer.toLowerCase().includes(search)
        );
    }
    
    if (category) {
        filteredEvents = filteredEvents.filter(event => event.category.toLowerCase() === category.toLowerCase());
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
                        <small class="text-muted d-block">ID: ${String(event.id).padStart(3, '0')}</small>
                    </div>
                </td>
                <td>${event.organizer}</td>
                <td>${new Date(event.date).toLocaleDateString()}</td>
                <td>${event.category}</td>
                <td>${event.capacity}</td>
                <td>${event.booked}/${event.capacity}</td>
                <td>$${event.revenue.toLocaleString()}</td>
                <td><span class="badge badge-${event.status === 'approved' ? 'success' : 'warning'}">${event.status}</span></td>
                <td>
                    ${event.status === 'pending' ? 
                        `<button class="btn btn-small btn-success" onclick="approveEvent(${event.id})">Approve</button>
                         <button class="btn btn-small btn-danger" onclick="rejectEvent(${event.id})">Reject</button>` :
                        `<button class="btn btn-small btn-outline" onclick="viewEvent(${event.id})">View</button>`
                    }
                </td>
            </tr>
        `).join('');
    }
}

// Utility functions
function refreshData() {
    EventHub.showAlert('Data refreshed successfully!', 'success');
    loadDashboardOverview();
}

function exportData() {
    EventHub.showAlert('Exporting data...', 'info');
    // Simulate export process
    setTimeout(() => {
        EventHub.showAlert('Data exported successfully!', 'success');
    }, 2000);
}

function exportUsers() {
    EventHub.showAlert('Exporting users...', 'info');
    setTimeout(() => {
        EventHub.showAlert('Users exported successfully!', 'success');
    }, 1500);
}

function exportEvents() {
    EventHub.showAlert('Exporting events...', 'info');
    setTimeout(() => {
        EventHub.showAlert('Events exported successfully!', 'success');
    }, 1500);
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