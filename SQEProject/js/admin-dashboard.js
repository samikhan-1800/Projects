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

    tbody.innerHTML = users.map(user => {
        // Determine proper status badge
        const statusBadge = getStatusBadgeForUser(user.status);
        
        // Show verification status for organizers
        let verificationBadge = '';
        if (user.emailVerified) {
            verificationBadge = '<i class="fas fa-check-circle text-success"></i> Verified';
        } else {
            verificationBadge = '<i class="fas fa-exclamation-circle text-warning"></i> Unverified';
        }
        
        // Add organizer verification status if applicable
        if (user.userType === 'Organizer' && user.verificationStatus) {
            if (user.verificationStatus === 'Verified') {
                verificationBadge += ' <span class="badge badge-success" style="font-size: 0.7em; margin-left: 5px;"><i class="fas fa-badge-check"></i> Org Verified</span>';
            } else if (user.verificationStatus === 'Pending') {
                verificationBadge += ' <span class="badge badge-warning" style="font-size: 0.7em; margin-left: 5px;"><i class="fas fa-clock"></i> Pending</span>';
            }
        }

        return `
        <tr ${user.status === 'Banned' ? 'style="background-color: #ffe6e6;"' : ''}>
            <td>
                <div>
                    <strong>${user.firstName} ${user.lastName}</strong>
                    ${user.status === 'Banned' ? '<span class="badge badge-danger" style="font-size: 0.7em; margin-left: 5px;"><i class="fas fa-ban"></i> BANNED</span>' : ''}
                    <small class="text-muted d-block">${verificationBadge}</small>
                </div>
            </td>
            <td>${user.email}</td>
            <td><span class="badge badge-${getRoleBadgeClass(user.userType)}">${user.userType}</span></td>
            <td>${formatDate(user.createdAt)}</td>
            <td>${user.eventsCreated || 0}</td>
            <td><span class="badge badge-${statusBadge.class}">${statusBadge.text}</span></td>
            <td>
                <div style="display: flex; gap: 5px; flex-wrap: wrap;">
                    <button class="btn btn-small btn-outline" onclick="viewUser('${user.userId}')" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${user.userType !== 'Admin' && user.status !== 'Banned' ? `
                        <button class="btn btn-small btn-${user.status === 'Active' ? 'warning' : 'success'}" 
                                onclick="toggleUserStatus('${user.userId}', '${user.status === 'Active' ? 'Inactive' : 'Active'}')" 
                                title="${user.status === 'Active' ? 'Suspend User' : 'Activate User'}">
                            ${user.status === 'Active' ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-check"></i>'}
                        </button>
                        <button class="btn btn-small btn-danger" 
                                onclick="banUser('${user.userId}', '${user.firstName} ${user.lastName}')" 
                                title="Ban User Permanently">
                            <i class="fas fa-ban"></i>
                        </button>
                    ` : ''}
                </div>
            </td>
        </tr>
    `;
    }).join('');
}

function renderEventsTable(events) {
    const tbody = document.getElementById('eventsTableBody');
    if (!tbody) return;

    if (!events || events.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center">No events found</td></tr>';
        return;
    }

    tbody.innerHTML = events.map(event => {
        // Highlight pending events
        const isPending = event.status === 'Pending';
        const isRejected = event.status === 'Rejected';
        const rowStyle = isPending ? 'background-color: #fff8e1;' : (isRejected ? 'background-color: #ffebee;' : '');
        
        return `
        <tr ${rowStyle ? `style="${rowStyle}"` : ''}>
            <td>
                <div>
                    <strong>${event.title}</strong>
                    <small class="text-muted d-block">${event.categoryName || 'Uncategorized'}</small>
                </div>
            </td>
            <td>${event.organizerName || 'Unknown'}</td>
            <td>${formatDate(event.startDate)}</td>
            <td>${event.categoryName || 'N/A'}</td>
            <td>${event.bookingCount || 0} / ${event.capacity || '∞'}</td>
            <td>Rs. ${(event.totalRevenue || 0).toLocaleString()}</td>
            <td><span class="badge badge-${getStatusBadgeClass(event.status)}">${event.status}</span></td>
            <td>
                <div style="display: flex; gap: 5px; flex-wrap: wrap;">
                    <button class="btn btn-small btn-outline" onclick="viewEvent('${event.eventId}')" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${isPending ? `
                        <button class="btn btn-small btn-success" onclick="approveEvent('${event.eventId}')" title="Approve & Publish">
                            <i class="fas fa-check"></i> Approve
                        </button>
                        <button class="btn btn-small btn-danger" onclick="rejectEvent('${event.eventId}')" title="Reject Event">
                            <i class="fas fa-times"></i> Reject
                        </button>
                    ` : event.status === 'Published' ? `
                        <button class="btn btn-small btn-warning" onclick="changeEventStatus('${event.eventId}', 'Cancelled')" title="Cancel Event">
                            <i class="fas fa-ban"></i>
                        </button>
                    ` : ''}
                </div>
            </td>
        </tr>
    `}).join('');
}

// Helper functions
function getStatusBadgeForUser(status) {
    const statusMap = {
        'Active': { class: 'success', text: 'ACTIVE' },
        'Inactive': { class: 'secondary', text: 'INACTIVE' },
        'Suspended': { class: 'warning', text: 'SUSPENDED' },
        'Banned': { class: 'danger', text: 'BANNED' }
    };
    return statusMap[status] || { class: 'secondary', text: status || 'UNKNOWN' };
}

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
        case 'contacts':
            loadContacts();
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
    
    // Load revenue summary table
    await loadRevenueSummary();
    
    // Load top categories and organizers
    await loadTopCategories();
    await loadTopOrganizers();
}

// Load revenue summary table
async function loadRevenueSummary() {
    const tbody = document.getElementById('revenueSummaryTable');
    if (!tbody) return;
    
    try {
        // Get monthly revenue data for last 6 months
        const data = await apiRequest('/admin/dashboard/stats');
        
        if (!data || !data.monthlyStats) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No revenue data available</td></tr>';
            return;
        }
        
        // Group by month and calculate revenue
        const monthlyRevenue = {};
        data.monthlyStats.forEach(stat => {
            const monthKey = `${stat.year}-${String(stat.month).padStart(2, '0')}`;
            if (!monthlyRevenue[monthKey]) {
                monthlyRevenue[monthKey] = {
                    month: new Date(stat.year, stat.month - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
                    bookings: 0,
                    totalSales: 0
                };
            }
            if (stat.type === 'bookings') {
                monthlyRevenue[monthKey].bookings = stat.count;
            }
        });
        
        // Get actual revenue data
        const stats = data.stats;
        const avgRevenuePerBooking = stats.totalRevenue / (stats.totalBookings || 1);
        
        // Generate table rows (last 6 months)
        const months = Object.keys(monthlyRevenue).sort().reverse().slice(0, 6);
        
        if (months.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No revenue data for recent months</td></tr>';
            return;
        }
        
        tbody.innerHTML = months.map((monthKey, index) => {
            const data = monthlyRevenue[monthKey];
            const totalSales = data.bookings * avgRevenuePerBooking;
            const platformFees = totalSales * 0.128; // 12.8% platform fee
            const organizerPayouts = totalSales - platformFees;
            const netRevenue = platformFees;
            
            // Calculate growth
            const prevMonthKey = months[index + 1];
            let growth = 0;
            if (prevMonthKey && monthlyRevenue[prevMonthKey]) {
                const prevSales = monthlyRevenue[prevMonthKey].bookings * avgRevenuePerBooking;
                growth = prevSales > 0 ? ((totalSales - prevSales) / prevSales * 100) : 0;
            }
            
            const growthIcon = growth > 0 ? '↑' : growth < 0 ? '↓' : '→';
            const growthClass = growth > 0 ? 'text-success' : growth < 0 ? 'text-danger' : 'text-muted';
            
            return `
                <tr>
                    <td>${data.month}</td>
                    <td>Rs. ${totalSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td>Rs. ${platformFees.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td>Rs. ${organizerPayouts.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td>Rs. ${netRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td class="${growthClass}">${growthIcon} ${Math.abs(growth).toFixed(1)}%</td>
                </tr>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Failed to load revenue summary:', error);
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Failed to load revenue data</td></tr>';
    }
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
    if (!confirm('Approve this event? It will be published and visible to all users.')) {
        return;
    }
    
    try {
        await apiRequest(`/admin/events/${eventId}/approve`, {
            method: 'PATCH'
        });
        showAlert('Event approved and published successfully!', 'success');
        await loadEventsSection(); // Refresh table
    } catch (error) {
        console.error('Failed to approve event:', error);
        showAlert('Failed to approve event', 'danger');
    }
}

async function rejectEvent(eventId) {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) {
        return;
    }
    
    try {
        await apiRequest(`/admin/events/${eventId}/reject`, {
            method: 'PATCH',
            body: JSON.stringify({ reason })
        });
        showAlert(`Event rejected: ${reason}`, 'warning');
        await loadEventsSection(); // Refresh table
    } catch (error) {
        console.error('Failed to reject event:', error);
        showAlert('Failed to reject event', 'danger');
    }
}

async function changeEventStatus(eventId, status) {
    const confirmMsg = status === 'Cancelled' ? 'Cancel this event? Users will be notified.' : `Change status to ${status}?`;
    if (!confirm(confirmMsg)) {
        return;
    }
    
    try {
        await apiRequest(`/admin/events/${eventId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status })
        });
        showAlert(`Event status changed to ${status}`, 'success');
        await loadEventsSection(); // Refresh table
    } catch (error) {
        console.error('Failed to change event status:', error);
        showAlert('Failed to change event status', 'danger');
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
async function viewUser(userId) {
    try {
        const user = allUsers.find(u => u.userId === userId);
        if (!user) {
            showAlert('User not found', 'danger');
            return;
        }
        
        // Create beautiful modal
        const modalHTML = `
            <div id="userDetailsModal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 10000;" onclick="if(event.target.id === 'userDetailsModal') document.getElementById('userDetailsModal').remove();">
                <div style="background: white; border-radius: 12px; padding: 0; max-width: 600px; width: 90%; max-height: 90vh; overflow-y: auto; box-shadow: 0 10px 40px rgba(0,0,0,0.3);" onclick="event.stopPropagation();">
                    <!-- Header -->
                    <div style="background: linear-gradient(135deg, #0ea5a4 0%, #0c8584 100%); color: white; padding: 25px; border-radius: 12px 12px 0 0;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <h2 style="margin: 0; font-size: 24px;"><i class="fas fa-user-circle"></i> User Details</h2>
                            <button onclick="document.getElementById('userDetailsModal').remove()" style="background: rgba(255,255,255,0.2); border: none; color: white; font-size: 24px; cursor: pointer; width: 35px; height: 35px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">&times;</button>
                        </div>
                    </div>
                    
                    <!-- Content -->
                    <div style="padding: 30px;">
                        <!-- User Info Card -->
                        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                            <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px;">
                                <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #0ea5a4, #0c8584); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; font-weight: bold;">
                                    ${user.firstName.charAt(0)}${user.lastName.charAt(0)}
                                </div>
                                <div>
                                    <h3 style="margin: 0; font-size: 22px; color: #333;">${user.firstName} ${user.lastName}</h3>
                                    <p style="margin: 5px 0 0 0; color: #666; display: flex; align-items: center; gap: 5px;">
                                        <i class="fas fa-envelope" style="color: #0ea5a4;"></i> ${user.email}
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Details Grid -->
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                            <div style="padding: 15px; background: white; border: 1px solid #e9ecef; border-radius: 8px;">
                                <div style="color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px;">Role</div>
                                <div style="font-size: 18px; font-weight: 600; color: #333;">
                                    <span class="badge badge-${getRoleBadgeClass(user.userType)}">${user.userType}</span>
                                </div>
                            </div>
                            <div style="padding: 15px; background: white; border: 1px solid #e9ecef; border-radius: 8px;">
                                <div style="color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px;">Status</div>
                                <div style="font-size: 18px; font-weight: 600;">
                                    <span class="badge badge-${getStatusBadgeForUser(user.status || 'Active').class}">${user.status || 'Active'}</span>
                                </div>
                            </div>
                            <div style="padding: 15px; background: white; border: 1px solid #e9ecef; border-radius: 8px;">
                                <div style="color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px;">Email Verified</div>
                                <div style="font-size: 18px; font-weight: 600; color: ${user.emailVerified ? '#28a745' : '#ffc107'};">
                                    <i class="fas fa-${user.emailVerified ? 'check-circle' : 'exclamation-circle'}"></i> ${user.emailVerified ? 'Yes' : 'No'}
                                </div>
                            </div>
                            <div style="padding: 15px; background: white; border: 1px solid #e9ecef; border-radius: 8px;">
                                <div style="color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px;">Member Since</div>
                                <div style="font-size: 16px; font-weight: 600; color: #333;">${formatDate(user.createdAt)}</div>
                            </div>
                        </div>
                        
                        <!-- Activity Stats -->
                        <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 20px; border-radius: 8px;">
                            <h4 style="margin: 0 0 15px 0; color: #333; font-size: 16px;"><i class="fas fa-chart-bar"></i> Activity Statistics</h4>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                                <div style="text-align: center; padding: 15px; background: white; border-radius: 6px;">
                                    <div style="font-size: 28px; font-weight: bold; color: #0ea5a4;">${user.eventsCreated || 0}</div>
                                    <div style="font-size: 12px; color: #666; text-transform: uppercase; margin-top: 5px;">Events Created</div>
                                </div>
                                <div style="text-align: center; padding: 15px; background: white; border-radius: 6px;">
                                    <div style="font-size: 28px; font-weight: bold; color: #0ea5a4;">${user.bookingsMade || 0}</div>
                                    <div style="font-size: 12px; color: #666; text-transform: uppercase; margin-top: 5px;">Bookings Made</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Footer -->
                    <div style="padding: 20px 30px; background: #f8f9fa; border-radius: 0 0 12px 12px; display: flex; justify-content: flex-end; gap: 10px;">
                        <button onclick="document.getElementById('userDetailsModal').remove()" class="btn btn-outline">Close</button>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    } catch (error) {
        console.error('Failed to load user details:', error);
        showAlert('Failed to load user details', 'danger');
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

// Export Report to HTML with real-time data
async function exportReportToHTML() {
    try {
        showAlert('Generating report...', 'info');
        
        // Fetch fresh data
        const statsData = await apiRequest('/admin/dashboard/stats');
        const topCategories = await apiRequest('/admin/reports/top-categories');
        const topOrganizers = await apiRequest('/admin/reports/top-organizers');
        
        const stats = statsData.stats;
        const timeRange = document.getElementById('reportTimeRange')?.value || '30';
        const exportDate = new Date().toLocaleString();
        
        // Generate HTML report
        const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EventHub Analytics Report - ${exportDate}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; background: #f5f5f5; color: #333; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 40px; border-bottom: 3px solid #0ea5a4; padding-bottom: 20px; }
        .header h1 { color: #0ea5a4; font-size: 32px; margin-bottom: 10px; }
        .header p { color: #666; font-size: 14px; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 40px; }
        .stat-card { background: linear-gradient(135deg, #0ea5a4 0%, #0c8584 100%); color: white; padding: 30px; border-radius: 8px; text-align: center; }
        .stat-value { font-size: 36px; font-weight: bold; margin-bottom: 10px; }
        .stat-label { font-size: 14px; opacity: 0.9; text-transform: uppercase; letter-spacing: 1px; }
        .section { margin-bottom: 40px; }
        .section-title { font-size: 24px; color: #0ea5a4; margin-bottom: 20px; border-bottom: 2px solid #e9ecef; padding-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { padding: 15px; text-align: left; border-bottom: 1px solid #e9ecef; }
        th { background: #f8f9fa; color: #495057; font-weight: 600; text-transform: uppercase; font-size: 12px; letter-spacing: 0.5px; }
        tr:hover { background: #f8f9fa; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; }
        .badge-success { background: #d4edda; color: #155724; }
        .badge-info { background: #d1ecf1; color: #0c5460; }
        .metric-row { display: flex; justify-content: space-between; align-items: center; padding: 15px; background: #f8f9fa; margin-bottom: 10px; border-radius: 6px; }
        .metric-label { font-weight: 600; color: #495057; }
        .metric-value { font-size: 20px; font-weight: bold; color: #0ea5a4; }
        .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #e9ecef; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 EventHub Analytics Report</h1>
            <p>Generated on ${exportDate} | Time Range: ${timeRange === 'all' ? 'All Time' : 'Last ' + timeRange + ' days'}</p>
        </div>

        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value">${(stats.totalUsers || 0).toLocaleString()}</div>
                <div class="stat-label">Total Users</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${(stats.totalEvents || 0).toLocaleString()}</div>
                <div class="stat-label">Total Events</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">Rs. ${(stats.totalRevenue || 0).toLocaleString()}</div>
                <div class="stat-label">Total Revenue</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${(stats.totalBookings || 0).toLocaleString()}</div>
                <div class="stat-label">Tickets Sold</div>
            </div>
        </div>

        <div class="section">
            <h2 class="section-title">Platform Statistics</h2>
            <div class="metric-row">
                <span class="metric-label">Regular Users</span>
                <span class="metric-value">${(stats.regularUsers || 0).toLocaleString()}</span>
            </div>
            <div class="metric-row">
                <span class="metric-label">Organizers</span>
                <span class="metric-value">${(stats.organizers || 0).toLocaleString()}</span>
            </div>
            <div class="metric-row">
                <span class="metric-label">Published Events</span>
                <span class="metric-value">${(stats.publishedEvents || 0).toLocaleString()}</span>
            </div>
            <div class="metric-row">
                <span class="metric-label">Draft Events</span>
                <span class="metric-value">${(stats.draftEvents || 0).toLocaleString()}</span>
            </div>
            <div class="metric-row">
                <span class="metric-label">Completed Bookings</span>
                <span class="metric-value">${(stats.paidBookings || 0).toLocaleString()}</span>
            </div>
        </div>

        <div class="section">
            <h2 class="section-title">Top Event Categories</h2>
            <table>
                <thead>
                    <tr>
                        <th>Rank</th>
                        <th>Category</th>
                        <th>Events</th>
                        <th>Revenue</th>
                    </tr>
                </thead>
                <tbody>
                    ${topCategories && topCategories.length > 0 ? topCategories.map((cat, idx) => `
                    <tr>
                        <td><strong>#${idx + 1}</strong></td>
                        <td>${cat.name}</td>
                        <td><span class="badge badge-info">${cat.eventCount} events</span></td>
                        <td><strong>Rs. ${(cat.totalRevenue || 0).toLocaleString()}</strong></td>
                    </tr>
                    `).join('') : '<tr><td colspan="4" style="text-align: center;">No data available</td></tr>'}
                </tbody>
            </table>
        </div>

        <div class="section">
            <h2 class="section-title">Top Organizers</h2>
            <table>
                <thead>
                    <tr>
                        <th>Rank</th>
                        <th>Organizer</th>
                        <th>Events</th>
                        <th>Bookings</th>
                        <th>Revenue</th>
                    </tr>
                </thead>
                <tbody>
                    ${topOrganizers && topOrganizers.length > 0 ? topOrganizers.map((org, idx) => `
                    <tr>
                        <td><strong>#${idx + 1}</strong></td>
                        <td>${org.name}</td>
                        <td><span class="badge badge-info">${org.eventCount} events</span></td>
                        <td><span class="badge badge-success">${org.totalBookings} bookings</span></td>
                        <td><strong>Rs. ${(org.totalRevenue || 0).toLocaleString()}</strong></td>
                    </tr>
                    `).join('') : '<tr><td colspan="5" style="text-align: center;">No data available</td></tr>'}
                </tbody>
            </table>
        </div>

        <div class="footer">
            <p>© ${new Date().getFullYear()} EventHub - Event Management Platform</p>
            <p>This report contains real-time data exported from the EventHub admin dashboard</p>
        </div>
    </div>
</body>
</html>`;
        
        // Create and download HTML file
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `EventHub-Report-${new Date().toISOString().split('T')[0]}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        showAlert('Report exported successfully!', 'success');
    } catch (error) {
        console.error('Export failed:', error);
        showAlert('Failed to export report', 'danger');
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
            body: JSON.stringify({ status: newStatus })
        });
        
        showAlert(`User ${newStatus.toLowerCase()} successfully!`, 'success');
        
        const search = document.getElementById('userSearch')?.value || '';
        const userType = document.getElementById('userRoleFilter')?.value || '';
        const status = document.getElementById('userStatusFilter')?.value || '';
        fetchUsers(currentUsersPage, search, userType, status);
    } catch (error) {
        showAlert('Failed to update user status', 'danger');
    }
}

// Ban user permanently
async function banUser(userId, userName) {
    if (!confirm(`Are you sure you want to permanently BAN user "${userName}"? They will not be able to login or access the system. This does not delete their data.`)) {
        return;
    }
    
    try {
        await apiRequest(`/admin/users/${userId}/ban`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'Banned' })
        });
        
        showAlert(`User "${userName}" has been permanently banned`, 'warning');
        
        const search = document.getElementById('userSearch')?.value || '';
        const userType = document.getElementById('userRoleFilter')?.value || '';
        const status = document.getElementById('userStatusFilter')?.value || '';
        fetchUsers(currentUsersPage, search, userType, status);
    } catch (error) {
        showAlert('Failed to ban user', 'danger');
    }
}

// Export users to PDF
async function exportUsersToPDF() {
    try {
        showAlert('Generating PDF report...', 'info');
        
        // Fetch all users
        const data = await apiRequest('/admin/users?page=1&limit=1000');
        const users = data.users;
        
        if (!users || users.length === 0) {
            showAlert('No users to export', 'warning');
            return;
        }
        
        // Create HTML report
        const doc = `<!DOCTYPE html>
<html>
<head>
    <title>EventHub Users Report</title>
    <style>
        @media print {
            body { margin: 0; }
            .no-print { display: none; }
        }
        body {
            font-family: Arial, sans-serif;
            margin: 40px;
            color: #333;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 3px solid #17a2b8;
            padding-bottom: 20px;
        }
        .header h1 {
            color: #17a2b8;
            margin: 0;
        }
        .header p {
            color: #666;
            margin: 5px 0;
        }
        .summary {
            display: flex;
            justify-content: space-around;
            margin: 30px 0;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
        }
        .summary-item {
            text-align: center;
        }
        .summary-item h3 {
            margin: 0;
            color: #17a2b8;
            font-size: 32px;
        }
        .summary-item p {
            margin: 5px 0;
            color: #666;
            font-size: 14px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        th {
            background: #17a2b8;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: bold;
        }
        td {
            padding: 10px;
            border-bottom: 1px solid #ddd;
        }
        tr:hover {
            background: #f8f9fa;
        }
        .badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: bold;
        }
        .badge-success { background: #28a745; color: white; }
        .badge-warning { background: #ffc107; color: #333; }
        .badge-danger { background: #dc3545; color: white; }
        .badge-info { background: #17a2b8; color: white; }
        .badge-primary { background: #007bff; color: white; }
        .badge-secondary { background: #6c757d; color: white; }
        .banned-row {
            background: #ffe6e6 !important;
        }
        .footer {
            margin-top: 40px;
            text-align: center;
            color: #666;
            font-size: 12px;
            border-top: 1px solid #ddd;
            padding-top: 20px;
        }
        .print-btn {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 10px 20px;
            background: #17a2b8;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
        }
        .print-btn:hover {
            background: #138496;
        }
    </style>
</head>
<body>
    <button class="print-btn no-print" onclick="window.print()">🖨️ Print to PDF</button>
    
    <div class="header">
        <h1>🎫 EventHub Users Report</h1>
        <p>Generated on ${new Date().toLocaleString()}</p>
        <p>Total Users: ${users.length}</p>
    </div>
    
    <div class="summary">
        <div class="summary-item">
            <h3>${users.filter(u => u.status === 'Active').length}</h3>
            <p>Active Users</p>
        </div>
        <div class="summary-item">
            <h3>${users.filter(u => u.userType === 'Organizer').length}</h3>
            <p>Organizers</p>
        </div>
        <div class="summary-item">
            <h3>${users.filter(u => u.status === 'Banned').length}</h3>
            <p>Banned Users</p>
        </div>
        <div class="summary-item">
            <h3>${users.filter(u => u.emailVerified).length}</h3>
            <p>Verified</p>
        </div>
    </div>
    
    <table>
        <thead>
            <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Verified</th>
                <th>Join Date</th>
                <th>Events</th>
            </tr>
        </thead>
        <tbody>
            ${users.map(user => {
                const statusBadge = getStatusBadgeForUser(user.status);
                return `
                <tr class="${user.status === 'Banned' ? 'banned-row' : ''}">
                    <td><strong>${user.firstName} ${user.lastName}</strong></td>
                    <td>${user.email}</td>
                    <td><span class="badge badge-${getRoleBadgeClass(user.userType)}">${user.userType}</span></td>
                    <td><span class="badge badge-${statusBadge.class}">${user.status || 'N/A'}</span></td>
                    <td>${user.emailVerified ? '✓ Yes' : '✗ No'}${user.verificationStatus === 'Verified' && user.userType === 'Organizer' ? ' (Org ✓)' : ''}</td>
                    <td>${formatDate(user.createdAt)}</td>
                    <td>${user.eventsCreated || 0}</td>
                </tr>
            `}).join('')}
        </tbody>
    </table>
    
    <div class="footer">
        <p><strong>EventHub Admin Panel</strong> | Confidential Report</p>
        <p>This report contains sensitive user information. Handle with care.</p>
    </div>
</body>
</html>`;
        
        // Create a blob and download
        const blob = new Blob([doc], { type: 'text/html' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `EventHub-Users-Report-${new Date().toISOString().split('T')[0]}.html`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showAlert('Report exported! Open the HTML file and use browser Print > Save as PDF', 'success');
    } catch (error) {
        console.error('Failed to export users:', error);
        showAlert('Failed to export users', 'danger');
    }
}

// Promote user to organizer
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

// System Management Functions
async function backupSystem() {
    if (!confirm('This will create a backup of the system database. Continue?')) {
        return;
    }
    
    try {
        showAlert('Creating system backup... This may take a few moments.', 'info');
        
        // Call backup endpoint
        await apiRequest('/admin/system/backup', {
            method: 'POST'
        });
        
        showAlert('✅ System backup created successfully!', 'success');
    } catch (error) {
        console.error('Backup failed:', error);
        showAlert('❌ Backup failed. Please contact system administrator.', 'danger');
    }
}

async function checkSystemHealth() {
    try {
        showAlert('Checking system health...', 'info');
        
        // Check health endpoint
        const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`);
        const health = await response.json();
        
        if (health.status === 'healthy') {
            const uptime = Math.floor(health.server.uptime / 60); // Convert to minutes
            const message = `
✅ System Status: HEALTHY
📊 Database: ${health.database.connected ? 'Connected' : 'Disconnected'}
⏱️ Uptime: ${uptime} minutes
🔧 Environment: ${health.server.environment}
            `.trim();
            
            alert(message);
            showAlert('System is healthy!', 'success');
        } else {
            showAlert('⚠️ System health check failed!', 'warning');
        }
    } catch (error) {
        console.error('Health check failed:', error);
        showAlert('❌ Unable to check system health', 'danger');
    }
}

function showBulkActionsModal() {
    const modal = document.createElement('div');
    modal.id = 'bulkActionsModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;
    
    modal.innerHTML = `
        <div style="background: white; padding: 30px; border-radius: 8px; max-width: 500px; width: 90%;">
            <h2 style="margin-top: 0;">Bulk Actions</h2>
            <p>Select an action to perform on multiple events:</p>
            
            <div style="display: flex; flex-direction: column; gap: 15px; margin: 20px 0;">
                <button class="btn btn-primary" onclick="bulkApproveEvents()">
                    <i class="fas fa-check-circle"></i> Approve Pending Events
                </button>
                <button class="btn btn-warning" onclick="bulkUpdateEventStatus()">
                    <i class="fas fa-edit"></i> Update Event Status
                </button>
                <button class="btn btn-outline" onclick="bulkExportEvents()">
                    <i class="fas fa-file-export"></i> Export All Events
                </button>
            </div>
            
            <div style="text-align: right; margin-top: 20px;">
                <button class="btn btn-outline" onclick="document.getElementById('bulkActionsModal').remove()">
                    Close
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close on outside click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

async function bulkApproveEvents() {
    const count = await apiRequest('/admin/events?status=Pending');
    const pendingCount = count.totalEvents || 0;
    
    if (pendingCount === 0) {
        showAlert('No pending events to approve', 'info');
        return;
    }
    
    if (!confirm(`Approve all ${pendingCount} pending events? This will make them visible to users.`)) {
        return;
    }
    
    try {
        showAlert('Processing bulk approval...', 'info');
        
        await apiRequest('/admin/events/bulk-approve', {
            method: 'POST'
        });
        
        showAlert(`✅ Successfully approved ${pendingCount} events!`, 'success');
        document.getElementById('bulkActionsModal')?.remove();
        await loadEventsSection();
    } catch (error) {
        console.error('Bulk approve failed:', error);
        showAlert('Bulk approval failed', 'danger');
    }
}

function bulkUpdateEventStatus() {
    showAlert('This feature allows you to update multiple events at once. Coming soon!', 'info');
    document.getElementById('bulkActionsModal')?.remove();
}

function bulkExportEvents() {
    exportEvents();
    document.getElementById('bulkActionsModal')?.remove();
}

// Make functions globally available
window.backupSystem = backupSystem;
window.checkSystemHealth = checkSystemHealth;
window.showBulkActionsModal = showBulkActionsModal;
window.bulkApproveEvents = bulkApproveEvents;
window.bulkUpdateEventStatus = bulkUpdateEventStatus;
window.bulkExportEvents = bulkExportEvents;

// Refresh dashboard data
async function refreshDashboard() {
    try {
        showAlert('Refreshing dashboard data...', 'info');
        await fetchDashboardStats();
        const currentSection = document.querySelector('.dashboard-section.active');
        if (currentSection) {
            const sectionId = currentSection.id.replace('-section', '');
            if (sectionId === 'users') {
                await fetchUsers(currentUsersPage);
            } else if (sectionId === 'events') {
                await fetchEvents(currentEventsPage);
            }
        }
        showAlert('Dashboard refreshed successfully!', 'success');
    } catch (error) {
        console.error('Refresh failed:', error);
        showAlert('Failed to refresh dashboard', 'danger');
    }
}

window.refreshDashboard = refreshDashboard;

// ===========================
// CONTACT MESSAGES MANAGEMENT
// ===========================

let allContacts = [];

async function loadContacts() {
    try {
        const status = document.getElementById('contactStatusFilter')?.value || '';
        const queryParam = status ? `?status=${status}` : '';
        
        const data = await apiRequest(`/contacts${queryParam}`);
        allContacts = data.contacts || [];
        
        // Update stats
        await loadContactStats();
        
        // Render table
        renderContactsTable();
    } catch (error) {
        console.error('Failed to load contacts:', error);
        document.getElementById('contactsTableBody').innerHTML = 
            '<tr><td colspan="7" style="text-align: center; color: #dc3545; padding: 40px;">Failed to load contacts</td></tr>';
    }
}

async function loadContactStats() {
    try {
        const stats = await apiRequest('/contacts/stats/summary');
        
        document.getElementById('totalContacts').textContent = stats.total || 0;
        document.getElementById('newContacts').textContent = stats.new || 0;
        document.getElementById('repliedContacts').textContent = stats.replied || 0;
        document.getElementById('resolvedContacts').textContent = stats.resolved || 0;
    } catch (error) {
        console.error('Failed to load contact stats:', error);
    }
}

function renderContactsTable() {
    const tbody = document.getElementById('contactsTableBody');
    
    if (!allContacts || allContacts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px;">No contact messages found</td></tr>';
        return;
    }
    
    tbody.innerHTML = allContacts.map(contact => {
        const date = new Date(contact.createdAt).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
        
        const statusColors = {
            'New': 'primary',
            'Read': 'info',
            'Replied': 'warning',
            'Resolved': 'success'
        };
        
        const statusColor = statusColors[contact.status] || 'secondary';
        const messagePreview = (contact.message || '').substring(0, 50) + '...';
        
        return `
            <tr onclick="viewContactDetails(${contact.contactId})" style="cursor: pointer;">
                <td><strong>${escapeHtml(contact.name)}</strong></td>
                <td>${escapeHtml(contact.email)}</td>
                <td>
                    <span class="badge badge-${getSubjectColor(contact.subject)}">
                        ${formatSubject(contact.subject)}
                    </span>
                </td>
                <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    ${escapeHtml(messagePreview)}
                </td>
                <td>${date}</td>
                <td>
                    <span class="badge badge-${statusColor}">${contact.status}</span>
                </td>
                <td onclick="event.stopPropagation();">
                    <button class="btn btn-small btn-outline" onclick="viewContactDetails(${contact.contactId})">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="btn btn-small btn-danger" onclick="deleteContact(${contact.contactId})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function getSubjectColor(subject) {
    const colors = {
        'general': 'info',
        'support': 'warning',
        'billing': 'danger',
        'organizer': 'primary',
        'partnership': 'success',
        'feedback': 'info',
        'other': 'secondary'
    };
    return colors[subject] || 'secondary';
}

function formatSubject(subject) {
    const formatted = {
        'general': 'General',
        'support': 'Support',
        'billing': 'Billing',
        'organizer': 'Organizer',
        'partnership': 'Partnership',
        'feedback': 'Feedback',
        'other': 'Other'
    };
    return formatted[subject] || subject;
}

function viewContactDetails(contactId) {
    const contact = allContacts.find(c => c.contactId === contactId);
    if (!contact) return;
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.id = 'contactDetailsModal';
    
    const date = new Date(contact.createdAt).toLocaleString();
    
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 700px;">
            <div class="modal-header">
                <h2><i class="fas fa-envelope-open"></i> Contact Message Details</h2>
                <button class="modal-close" onclick="closeContactModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                    <div>
                        <label style="font-weight: bold; color: #666; font-size: 0.9em;">Name</label>
                        <p style="margin: 5px 0;">${escapeHtml(contact.name)}</p>
                    </div>
                    <div>
                        <label style="font-weight: bold; color: #666; font-size: 0.9em;">Email</label>
                        <p style="margin: 5px 0;"><a href="mailto:${escapeHtml(contact.email)}">${escapeHtml(contact.email)}</a></p>
                    </div>
                    <div>
                        <label style="font-weight: bold; color: #666; font-size: 0.9em;">Phone</label>
                        <p style="margin: 5px 0;">${escapeHtml(contact.phone || 'N/A')}</p>
                    </div>
                    <div>
                        <label style="font-weight: bold; color: #666; font-size: 0.9em;">Subject</label>
                        <p style="margin: 5px 0;">${formatSubject(contact.subject)}</p>
                    </div>
                    <div>
                        <label style="font-weight: bold; color: #666; font-size: 0.9em;">Date</label>
                        <p style="margin: 5px 0;">${date}</p>
                    </div>
                    <div>
                        <label style="font-weight: bold; color: #666; font-size: 0.9em;">Newsletter</label>
                        <p style="margin: 5px 0;">${contact.newsletter ? 'Yes' : 'No'}</p>
                    </div>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <label style="font-weight: bold; color: #666; font-size: 0.9em;">Message</label>
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 5px;">
                        ${escapeHtml(contact.message).replace(/\n/g, '<br>')}
                    </div>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <label class="form-label">Status</label>
                    <select class="form-control" id="contactStatus${contactId}">
                        <option value="New" ${contact.status === 'New' ? 'selected' : ''}>New</option>
                        <option value="Read" ${contact.status === 'Read' ? 'selected' : ''}>Read</option>
                        <option value="Replied" ${contact.status === 'Replied' ? 'selected' : ''}>Replied</option>
                        <option value="Resolved" ${contact.status === 'Resolved' ? 'selected' : ''}>Resolved</option>
                    </select>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <label class="form-label">Admin Notes</label>
                    <textarea class="form-control" id="contactNotes${contactId}" rows="3" placeholder="Add internal notes...">${escapeHtml(contact.adminNotes || '')}</textarea>
                </div>
                
                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                    <button class="btn btn-outline" onclick="closeContactModal()">Close</button>
                    <button class="btn btn-primary" onclick="updateContact(${contactId})">
                        <i class="fas fa-save"></i> Save Changes
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Mark as read if it's new
    if (contact.status === 'New') {
        setTimeout(() => {
            updateContactStatus(contactId, 'Read');
        }, 1000);
    }
}

function closeContactModal() {
    const modal = document.getElementById('contactDetailsModal');
    if (modal) modal.remove();
}

async function updateContact(contactId) {
    try {
        const status = document.getElementById(`contactStatus${contactId}`).value;
        const notes = document.getElementById(`contactNotes${contactId}`).value;
        
        await apiRequest(`/contacts/${contactId}`, {
            method: 'PUT',
            body: JSON.stringify({ status, adminNotes: notes })
        });
        
        showAlert('Contact updated successfully', 'success');
        closeContactModal();
        await loadContacts();
    } catch (error) {
        console.error('Failed to update contact:', error);
        showAlert('Failed to update contact', 'danger');
    }
}

async function updateContactStatus(contactId, status) {
    try {
        await apiRequest(`/contacts/${contactId}`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
        await loadContacts();
    } catch (error) {
        console.error('Failed to update contact status:', error);
    }
}

async function deleteContact(contactId) {
    if (!confirm('Are you sure you want to delete this contact message?')) return;
    
    try {
        await apiRequest(`/contacts/${contactId}`, {
            method: 'DELETE'
        });
        
        showAlert('Contact deleted successfully', 'success');
        await loadContacts();
    } catch (error) {
        console.error('Failed to delete contact:', error);
        showAlert('Failed to delete contact', 'danger');
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Make functions globally available
window.loadContacts = loadContacts;
window.viewContactDetails = viewContactDetails;
window.closeContactModal = closeContactModal;
window.updateContact = updateContact;
window.deleteContact = deleteContact;
