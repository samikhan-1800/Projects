/**
 * Admin Dashboard JavaScript
 * Handles all admin dashboard functionality with real API integration
 */

// API base URL is already declared in main.js

// Admin data stores
let adminStats = {};
let allUsers = [];
let allEvents = [];
let currentUsersPage = 1;
let currentEventsPage = 1;
const itemsPerPage = 10;

// Utility: Make API request with authentication
async function apiRequest(endpoint, options = {}) {
    const token = localStorage.getItem('authToken');
    
    const config = {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...options.headers,
        },
    };

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        
        if (response.status === 401) {
            showAlert('Session expired. Please login again.', 'danger');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);
            throw new Error('Unauthorized');
        }

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'API request failed');
        }

        return data;
    } catch (error) {
        console.error('API Request failed:', error);
        throw error;
    }
}

// Fetch dashboard statistics
async function fetchDashboardStats() {
    try {
        const data = await apiRequest('/admin/dashboard/stats');
        adminStats = data.stats;
        
        // Update main stat cards
        document.getElementById('totalUsers').textContent = adminStats.totalUsers?.toLocaleString() || '0';
        document.getElementById('totalEvents').textContent = adminStats.totalEvents?.toLocaleString() || '0';
        document.getElementById('totalRevenue').textContent = `Rs. ${(adminStats.totalRevenue || 0).toLocaleString()}`;
        document.getElementById('totalBookings').textContent = adminStats.totalBookings?.toLocaleString() || '0';

        // Update growth indicators
        const usersThisMonth = data.monthlyStats?.filter(s => s.type === 'users')[0]?.count || 0;
        const eventsThisMonth = data.monthlyStats?.filter(s => s.type === 'events')[0]?.count || 0;
        const bookingsThisMonth = data.monthlyStats?.filter(s => s.type === 'bookings')[0]?.count || 0;
        
        document.getElementById('usersGrowth').textContent = `+${usersThisMonth} this month`;
        document.getElementById('eventsGrowth').textContent = `+${eventsThisMonth} this month`;
        document.getElementById('bookingsGrowth').textContent = `+${bookingsThisMonth} this month`;
        document.getElementById('revenueGrowth').textContent = `+12.8% this month`;

        // Update system status counts
        document.getElementById('statusUsersCount').textContent = adminStats.totalUsers || '0';
        document.getElementById('statusEventsCount').textContent = adminStats.totalEvents || '0';
        document.getElementById('statusPendingCount').textContent = adminStats.draftEvents || '0';
        document.getElementById('statusActiveBookings').textContent = adminStats.totalBookings || '0';

        // Update reports section
        document.getElementById('growthRate').textContent = calculateGrowthRate(data.monthlyStats) + '%';
        document.getElementById('activeUsers').textContent = adminStats.regularUsers?.toLocaleString() || '0';
        document.getElementById('publishedEvents').textContent = adminStats.publishedEvents?.toLocaleString() || '0';
        document.getElementById('completedBookings').textContent = adminStats.paidBookings?.toLocaleString() || '0';

        return data;
    } catch (error) {
        console.error('Failed to fetch admin stats:', error);
        showAlert('Failed to load dashboard statistics', 'danger');
        return null;
    }
}

// Calculate growth rate from monthly stats
function calculateGrowthRate(monthlyStats) {
    if (!monthlyStats || monthlyStats.length < 2) return '0.0';
    
    const bookings = monthlyStats.filter(s => s.type === 'bookings').slice(0, 2);
    if (bookings.length < 2) return '0.0';
    
    const current = bookings[0].count;
    const previous = bookings[1].count;
    
    if (previous === 0) return '100.0';
    
    const growth = ((current - previous) / previous) * 100;
    return growth.toFixed(1);
}

async function fetchUsers(page = 1, search = '', userType = '', status = '') {
    try {
        const queryParams = new URLSearchParams({
            page: page.toString(),
            limit: itemsPerPage.toString()
        });

        if (search) queryParams.append('search', search);
        if (userType) queryParams.append('userType', userType);
        if (status) queryParams.append('status', status);

        const data = await apiRequest(`/admin/users?${queryParams.toString()}`);
        allUsers = data.users;
        
        renderUsersTable(data.users);
        renderPagination('users', data.currentPage, data.totalPages);
        
        return data;
    } catch (error) {
        console.error('Failed to fetch users:', error);
        showAlert('Failed to load users', 'danger');
        document.getElementById('usersTableBody').innerHTML = 
            '<tr><td colspan="8" class="text-center">Failed to load users</td></tr>';
        return null;
    }
}

async function fetchEvents(page = 1, search = '', status = '', category = '') {
    try {
        const queryParams = new URLSearchParams({
            page: page.toString(),
            limit: itemsPerPage.toString()
        });

        if (search) queryParams.append('search', search);
        if (status) queryParams.append('status', status);
        if (category) queryParams.append('category', category);

        const data = await apiRequest(`/admin/events?${queryParams.toString()}`);
        allEvents = data.events;
        
        renderEventsTable(data.events);
        renderPagination('events', data.currentPage, data.totalPages);
        
        return data;
    } catch (error) {
        console.error('Failed to fetch events:', error);
        showAlert('Failed to load events', 'danger');
        document.getElementById('eventsTableBody').innerHTML = 
            '<tr><td colspan="9" class="text-center">Failed to load events</td></tr>';
        return null;
    }
}

// Render functions
function renderUsersTable(users) {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;

    if (!users || users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">No users found</td></tr>';
        return;
    }

    tbody.innerHTML = users.map(user => `
        <tr>
            <td>
                <div>
                    <strong>${user.firstName} ${user.lastName}</strong>
                    <small class="text-muted d-block">${user.email}</small>
                </div>
            </td>
            <td><span class="badge badge-${getRoleBadgeClass(user.userType)}">${user.userType}</span></td>
            <td><span class="badge badge-${user.isActive ? 'success' : 'warning'}">${user.isActive ? 'Active' : 'Inactive'}</span></td>
            <td>${user.emailVerified ? '<i class="fas fa-check-circle text-success"></i>' : '<i class="fas fa-times-circle text-danger"></i>'}</td>
            <td>${formatDate(user.createdAt)}</td>
            <td>${user.eventsCreated || 0}</td>
            <td>${user.bookingsMade || 0}</td>
            <td>
                <button class="btn btn-small btn-outline" onclick="viewUser('${user.userId}')">
                    <i class="fas fa-eye"></i>
                </button>
                ${user.userType !== 'Admin' ? `
                    <button class="btn btn-small btn-${user.isActive ? 'warning' : 'success'}" 
                            onclick="toggleUserStatus('${user.userId}', ${!user.isActive})">
                        ${user.isActive ? '<i class="fas fa-ban"></i>' : '<i class="fas fa-check"></i>'}
                    </button>
                ` : ''}
            </td>
        </tr>
    `).join('');
}

function renderEventsTable(events) {
    const tbody = document.getElementById('eventsTableBody');
    if (!tbody) return;

    if (!events || events.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center">No events found</td></tr>';
        return;
    }

    tbody.innerHTML = events.map(event => `
        <tr>
            <td>
                <div>
                    <strong>${event.title}</strong>
                    <small class="text-muted d-block">${event.categoryName || 'Uncategorized'}</small>
                </div>
            </td>
            <td>${event.organizerName || 'Unknown'}</td>
            <td>${formatDate(event.startDate)}</td>
            <td>${event.venueName || (event.isOnline ? 'Online' : 'TBA')}</td>
            <td>${event.capacity || 'Unlimited'}</td>
            <td>${event.bookingCount || 0}</td>
            <td>Rs. ${(event.totalRevenue || 0).toLocaleString()}</td>
            <td><span class="badge badge-${getStatusBadgeClass(event.status)}">${event.status}</span></td>
            <td>
                <button class="btn btn-small btn-outline" onclick="viewEvent('${event.eventId}')">
                    <i class="fas fa-eye"></i>
                </button>
                ${event.status === 'Pending' || event.status === 'Draft' ? `
                    <button class="btn btn-small btn-success" onclick="approveEvent('${event.eventId}')">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="btn btn-small btn-danger" onclick="rejectEvent('${event.eventId}')">
                        <i class="fas fa-times"></i>
                    </button>
                ` : ''}
            </td>
        </tr>
    `).join('');
}

// Helper functions
function getRoleBadgeClass(role) {
    const classes = {
        'Admin': 'danger',
        'Organizer': 'primary',
        'User': 'info'
    };
    return classes[role] || 'secondary';
}

function getStatusBadgeClass(status) {
    const classes = {
        'Published': 'success',
        'Approved': 'success',
        'Draft': 'warning',
        'Pending': 'warning',
        'Cancelled': 'danger',
        'Completed': 'info'
    };
    return classes[status] || 'secondary';
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function renderPagination(section, currentPage, totalPages) {
    const paginationId = `${section}Pagination`;
    let paginationContainer = document.getElementById(paginationId);
    
    if (!paginationContainer) {
        const tableContainer = document.getElementById(`${section}TableBody`)?.parentElement?.parentElement;
        if (tableContainer) {
            paginationContainer = document.createElement('div');
            paginationContainer.id = paginationId;
            paginationContainer.className = 'pagination-container';
            paginationContainer.style.cssText = 'display: flex; justify-content: center; padding: 20px; gap: 5px;';
            tableContainer.appendChild(paginationContainer);
        }
    }

    if (!paginationContainer || totalPages <= 1) return;

    let paginationHTML = `
        <button class="btn btn-small btn-outline" 
                onclick="changePage('${section}', ${currentPage - 1})"
                ${currentPage === 1 ? 'disabled' : ''}>
            <i class="fas fa-chevron-left"></i>
        </button>
    `;

    const maxButtons = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);
    
    if (endPage - startPage < maxButtons - 1) {
        startPage = Math.max(1, endPage - maxButtons + 1);
    }

    if (startPage > 1) {
        paginationHTML += `
            <button class="btn btn-small btn-outline" onclick="changePage('${section}', 1)">1</button>
            ${startPage > 2 ? '<span style="padding: 0 5px;">...</span>' : ''}
        `;
    }

    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <button class="btn btn-small ${i === currentPage ? 'btn-primary' : 'btn-outline'}" 
                    onclick="changePage('${section}', ${i})">
                ${i}
            </button>
        `;
    }

    if (endPage < totalPages) {
        paginationHTML += `
            ${endPage < totalPages - 1 ? '<span style="padding: 0 5px;">...</span>' : ''}
            <button class="btn btn-small btn-outline" onclick="changePage('${section}', ${totalPages})">${totalPages}</button>
        `;
    }

    paginationHTML += `
        <button class="btn btn-small btn-outline" 
                onclick="changePage('${section}', ${currentPage + 1})"
                ${currentPage === totalPages ? 'disabled' : ''}>
            <i class="fas fa-chevron-right"></i>
        </button>
    `;

    paginationContainer.innerHTML = paginationHTML;
}

function changePage(section, page) {
    if (section === 'users') {
        currentUsersPage = page;
        const search = document.getElementById('userSearch')?.value || '';
        const userType = document.getElementById('userRoleFilter')?.value || '';
        const status = document.getElementById('userStatusFilter')?.value || '';
        fetchUsers(page, search, userType, status);
    } else if (section === 'events') {
        currentEventsPage = page;
        const search = document.getElementById('eventSearch')?.value || '';
        const status = document.getElementById('eventStatusFilter')?.value || '';
        const category = document.getElementById('eventCategoryFilter')?.value || '';
        fetchEvents(page, search, status, category);
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
    document.querySelectorAll('.sidebar-menu a').forEach(link => {
        link.classList.remove('active');
    });
    
    // Show selected section - add '-section' suffix to match HTML IDs
    const sectionId = sectionName + '-section';
    const section = document.getElementById(sectionId);
    if (section) {
        section.classList.add('active');
    }
    
    // Add active class to clicked link
    const activeLink = document.querySelector(`.sidebar-menu a[onclick*="showSection('${sectionName}')"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
    
    currentSection = sectionName;
    
    // Load section-specific data
    switch(sectionName) {
        case 'dashboard':
            loadDashboardOverview();
            break;
        case 'users':
            loadUsersSection();
            break;
        case 'events':
            loadEventsSection();
            break;
        case 'reports':
            loadReportsSection();
            break;
    }
}

// Load dashboard overview data
async function loadDashboardOverview() {
    try {
        // Fetch dashboard stats which updates all the UI elements
        await fetchDashboardStats();
        
        // Initialize charts if Chart.js is available
        if (typeof Chart !== 'undefined') {
            initializeBookingsChart();
        }
    } catch (error) {
        console.error('Failed to load dashboard overview:', error);
        showAlert('Failed to load dashboard data', 'danger');
    }
}

// Helper function to format timestamps
function formatTimestamp(timestamp) {
    if (typeof DateHelper !== 'undefined') {
        return DateHelper.formatRelativeTime(timestamp);
    }
    
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
    await fetchUsers(1);
}

// Load events section
async function loadEventsSection() {
    await fetchEvents(1);
}

// Load reports section
async function loadReportsSection() {
    // Stats are already loaded from dashboard overview
    // Just ensure they're fresh
    await fetchDashboardStats();
    
    // Load top categories and organizers
    await loadTopCategories();
    await loadTopOrganizers();
}

// Load tickets section
async function loadTicketsSection() {
    const tbody = document.getElementById('ticketsTableBody');
    if (!tbody) return;
    
    try {
        // Try to fetch tickets from API, fallback to placeholder data
        let tickets = [];
        try {
            tickets = await apiRequest('/admin/tickets');
        } catch (e) {
            // Show placeholder message for now
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 40px;">
                        <i class="fas fa-inbox" style="font-size: 48px; color: var(--secondary-color); margin-bottom: 15px; display: block;"></i>
                        <h4 style="color: var(--text-secondary); margin-bottom: 10px;">No Support Tickets</h4>
                        <p style="color: var(--text-secondary);">Support tickets will appear here when users submit them</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        if (tickets.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 40px;">
                        <i class="fas fa-inbox" style="font-size: 48px; color: var(--secondary-color); margin-bottom: 15px; display: block;"></i>
                        <h4 style="color: var(--text-secondary); margin-bottom: 10px;">No Support Tickets</h4>
                        <p style="color: var(--text-secondary);">Support tickets will appear here when users submit them</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        // Get priority badge class
        const getPriorityBadge = (priority) => {
            const badges = {
                'High': 'badge-danger',
                'Medium': 'badge-warning',
                'Low': 'badge-info'
            };
            return badges[priority] || 'badge-secondary';
        };
        
        // Get status badge class
        const getStatusBadge = (status) => {
            const badges = {
                'Open': 'badge-warning',
                'In Progress': 'badge-info',
                'Resolved': 'badge-success',
                'Closed': 'badge-secondary'
            };
            return badges[status] || 'badge-secondary';
        };
        
        tbody.innerHTML = tickets.map(ticket => `
            <tr>
                <td>#${ticket.ticketId}</td>
                <td>${ticket.userName || 'Unknown'}</td>
                <td>${ticket.subject}</td>
                <td>${ticket.category}</td>
                <td><span class="badge ${getPriorityBadge(ticket.priority)}">${ticket.priority}</span></td>
                <td><span class="badge ${getStatusBadge(ticket.status)}">${ticket.status}</span></td>
                <td>${formatTimestamp(ticket.createdAt)}</td>
                <td>
                    ${ticket.status !== 'Resolved' && ticket.status !== 'Closed' ? 
                        `<button class="btn btn-small btn-primary" onclick="respondToTicket('${ticket.ticketId}')">Respond</button>` : ''
                    }
                    <button class="btn btn-small btn-outline" onclick="viewTicket('${ticket.ticketId}')">View</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Failed to load tickets:', error);
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">Failed to load tickets</td></tr>';
    }
}

// Load top categories for reports section
async function loadTopCategories() {
    try {
        const data = await apiRequest('/admin/reports/top-categories');
        const container = document.getElementById('topCategoriesContainer');
        
        if (!container) return;
        
        if (!data || data.length === 0) {
            container.innerHTML = '<p class="text-center text-muted">No category data available</p>';
            return;
        }

        // Calculate max for percentage bars
        const maxCount = Math.max(...data.map(c => c.eventCount));
        
        container.innerHTML = data.map(category => `
            <div style="margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span><i class="${category.iconClass || 'fas fa-tag'}"></i> ${category.name}</span>
                    <span class="text-muted">${category.eventCount} events</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <div style="width: 100%; height: 8px; background: #e9ecef; border-radius: 4px;">
                        <div style="width: ${(category.eventCount / maxCount) * 100}%; height: 100%; background: #17a2b8; border-radius: 4px;"></div>
                    </div>
                    <span style="min-width: 60px; text-align: right;">Rs. ${category.totalRevenue.toLocaleString()}</span>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Failed to load top categories:', error);
        const container = document.getElementById('topCategoriesContainer');
        if (container) {
            container.innerHTML = '<p class="text-center text-danger">Failed to load category data</p>';
        }
    }
}

// Load top organizers for reports section
async function loadTopOrganizers() {
    try {
        const data = await apiRequest('/admin/reports/top-organizers');
        const container = document.getElementById('topOrganizersContainer');
        
        if (!container) return;
        
        if (!data || data.length === 0) {
            container.innerHTML = '<p class="text-center text-muted">No organizer data available</p>';
            return;
        }

        container.innerHTML = data.map((organizer, index) => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px 0; border-bottom: 1px solid #e9ecef;">
                <div>
                    <div style="font-weight: 500;">#${index + 1} ${organizer.name}</div>
                    <small class="text-muted">${organizer.eventCount} events · ${organizer.totalBookings} bookings</small>
                </div>
                <div style="text-align: right;">
                    <div style="font-weight: 600; color: #28a745;">Rs. ${organizer.totalRevenue.toLocaleString()}</div>
                    <small class="text-muted">Total Revenue</small>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Failed to load top organizers:', error);
        const container = document.getElementById('topOrganizersContainer');
        if (container) {
            container.innerHTML = '<p class="text-center text-danger">Failed to load organizer data</p>';
        }
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
        await apiRequest(`/admin/events/${eventId}/approve`, {
            method: 'PUT'
        });
        showAlert('Event approved successfully!', 'success');
        await loadEventsSection(); // Refresh table
    } catch (error) {
        console.error('Failed to approve event:', error);
        showAlert('Failed to approve event', 'danger');
    }
}

async function rejectEvent(eventId) {
    const reason = prompt('Please provide a reason for rejection:');
    if (reason) {
        try {
            await apiRequest(`/admin/events/${eventId}/reject`, {
                method: 'PUT',
                body: JSON.stringify({ reason })
            });
            showAlert('Event rejected successfully', 'warning');
            await loadEventsSection(); // Refresh table
        } catch (error) {
            console.error('Failed to reject event:', error);
            showAlert('Failed to reject event', 'danger');
        }
    }
}

async function suspendEvent(eventId) {
    if (confirm('Are you sure you want to suspend this event?')) {
        try {
            await apiRequest(`/admin/events/${eventId}/suspend`, {
                method: 'PUT'
            });
            showAlert('Event suspended successfully', 'warning');
            await loadEventsSection(); // Refresh table
        } catch (error) {
            console.error('Failed to suspend event:', error);
            showAlert('Failed to suspend event', 'danger');
        }
    }
}

function viewEvent(eventId) {
    window.open(`event-detail.html?id=${eventId}`, '_blank');
}

// User management functions
function viewUser(userId) {
    // Open user details in modal or new page
    showAlert('User details functionality to be implemented', 'info');
}

async function suspendUser(userId) {
    if (confirm('Are you sure you want to suspend this user?')) {
        try {
            await apiRequest(`/admin/users/${userId}/suspend`, {
                method: 'PUT'
            });
            showAlert('User suspended successfully', 'warning');
            await loadUsersSection(); // Refresh table
        } catch (error) {
            console.error('Failed to suspend user:', error);
            showAlert('Failed to suspend user', 'danger');
        }
    }
}

async function promoteUser(userId) {
    if (confirm('Are you sure you want to promote this user to admin?')) {
        try {
            await apiRequest(`/admin/users/${userId}/promote`, {
                method: 'PUT',
                body: JSON.stringify({ role: 'Admin' })
            });
            showAlert('User promoted successfully', 'success');
            await loadUsersSection(); // Refresh table
        } catch (error) {
            console.error('Failed to promote user:', error);
            showAlert('Failed to promote user', 'danger');
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
        showAlert('Refreshing data...', 'info');
        await loadDashboardOverview();
        if (currentSection === 'users') {
            await loadUsersSection();
        } else if (currentSection === 'events') {
            await loadEventsSection();
        }
        showAlert('Data refreshed successfully!', 'success');
    } catch (error) {
        console.error('Failed to refresh data:', error);
        showAlert('Failed to refresh data', 'danger');
    }
}

async function exportData() {
    try {
        showAlert('Exporting data...', 'info');
        const blob = await apiRequest('/admin/export/all', {
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
        
        showAlert('Data exported successfully!', 'success');
    } catch (error) {
        console.error('Export failed:', error);
        showAlert('Export failed', 'danger');
    }
}

async function exportUsers() {
    try {
        showAlert('Exporting users...', 'info');
        const response = await fetch(`${API_BASE_URL}/admin/export/users`, {
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
        
        showAlert('Users exported successfully!', 'success');
    } catch (error) {
        console.error('User export failed:', error);
        showAlert('User export failed', 'danger');
    }
}

async function exportEvents() {
    try {
        showAlert('Exporting events...', 'info');
        const response = await fetch(`${API_BASE_URL}/admin/export/events`, {
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
        
        showAlert('Events exported successfully!', 'success');
    } catch (error) {
        console.error('Event export failed:', error);
        showAlert('Event export failed', 'danger');
    }
}

// Initialize admin dashboard
document.addEventListener('DOMContentLoaded', () => {
    // Update navigation if NavigationHelper is available
    if (typeof NavigationHelper !== 'undefined') {
        NavigationHelper.updateNavigation();
    }
    
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
            showAlert('Settings updated successfully!', 'success');
        });
    });
    
    // Setup search and filter event listeners
    setupEventListeners();
});

// Setup event listeners for search and filters
function setupEventListeners() {
    const userSearch = document.getElementById('userSearch');
    if (userSearch) {
        let searchTimeout;
        userSearch.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                const userType = document.getElementById('userRoleFilter')?.value || '';
                const status = document.getElementById('userStatusFilter')?.value || '';
                fetchUsers(1, e.target.value, userType, status);
            }, 500);
        });
    }

    const userRoleFilter = document.getElementById('userRoleFilter');
    if (userRoleFilter) {
        userRoleFilter.addEventListener('change', (e) => {
            const search = document.getElementById('userSearch')?.value || '';
            const status = document.getElementById('userStatusFilter')?.value || '';
            fetchUsers(1, search, e.target.value, status);
        });
    }

    const userStatusFilter = document.getElementById('userStatusFilter');
    if (userStatusFilter) {
        userStatusFilter.addEventListener('change', (e) => {
            const search = document.getElementById('userSearch')?.value || '';
            const userType = document.getElementById('userRoleFilter')?.value || '';
            fetchUsers(1, search, userType, e.target.value);
        });
    }

    const eventSearch = document.getElementById('eventSearch');
    if (eventSearch) {
        let searchTimeout;
        eventSearch.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                const status = document.getElementById('eventStatusFilter')?.value || '';
                const category = document.getElementById('eventCategoryFilter')?.value || '';
                fetchEvents(1, e.target.value, status, category);
            }, 500);
        });
    }

    const eventStatusFilter = document.getElementById('eventStatusFilter');
    if (eventStatusFilter) {
        eventStatusFilter.addEventListener('change', (e) => {
            const search = document.getElementById('eventSearch')?.value || '';
            const category = document.getElementById('eventCategoryFilter')?.value || '';
            fetchEvents(1, search, e.target.value, category);
        });
    }

    const eventCategoryFilter = document.getElementById('eventCategoryFilter');
    if (eventCategoryFilter) {
        eventCategoryFilter.addEventListener('change', (e) => {
            const search = document.getElementById('eventSearch')?.value || '';
            const status = document.getElementById('eventStatusFilter')?.value || '';
            fetchEvents(1, search, status, e.target.value);
        });
    }
}

// Additional management functions
async function toggleUserStatus(userId, newStatus) {
    try {
        await apiRequest(`/admin/users/${userId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ isActive: newStatus })
        });
        
        showAlert(`User status updated successfully!`, 'success');
        
        const search = document.getElementById('userSearch')?.value || '';
        const userType = document.getElementById('userRoleFilter')?.value || '';
        const status = document.getElementById('userStatusFilter')?.value || '';
        fetchUsers(currentUsersPage, search, userType, status);
    } catch (error) {
        showAlert('Failed to update user status', 'danger');
    }
}

function loadSectionData(sectionName) {
    switch(sectionName) {
        case 'dashboard':
            fetchDashboardStats();
            break;
        case 'users':
            fetchUsers(1);
            break;
        case 'events':
            fetchEvents(1);
            break;
    }
}

// Export admin functions to global scope
window.AdminDashboard = {
    showSection,
    approveEvent,
    rejectEvent,
    viewEvent,
    viewUser,
    toggleUserStatus,
    fetchUsers,
    fetchEvents,
    fetchDashboardStats
};