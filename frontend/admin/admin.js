// Admin Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    checkAuth();
    
    // Initialize dashboard
    initializeDashboard();
    
    // Add event listeners
    document.getElementById('refreshBtn').addEventListener('click', refreshDashboard);
    
    // Navigation handling
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.dataset.page;
            loadPage(page);
        });
    });
});

// Check if user is authenticated and is an admin
async function checkAuth() {
    try {
        const userData = JSON.parse(localStorage.getItem(config.auth.userKey));
        if (!userData || userData.role !== 'admin') {
            window.location.href = config.routes.login;
            return;
        }
        document.getElementById('adminName').textContent = userData.name;
    } catch (error) {
        console.error('Auth check failed:', error);
        window.location.href = config.routes.login;
    }
}

// Initialize dashboard with data
async function initializeDashboard() {
    try {
        await Promise.all([
            loadStatistics(),
            loadRecentActivities(),
            loadSystemStatus()
        ]);
    } catch (error) {
        console.error('Dashboard initialization failed:', error);
        showError('Failed to load dashboard data');
    }
}

// Load dashboard statistics
async function loadStatistics() {
    try {
        const stats = await api.request('/admin/statistics', 'GET');
        
        document.getElementById('totalStudents').textContent = stats.totalStudents;
        document.getElementById('totalTeachers').textContent = stats.totalTeachers;
        document.getElementById('totalCourses').textContent = stats.totalCourses;
        document.getElementById('activeUsers').textContent = stats.activeUsers;
    } catch (error) {
        console.error('Failed to load statistics:', error);
        showError('Failed to load statistics');
    }
}

// Load recent activities
async function loadRecentActivities() {
    try {
        const activities = await api.request('/admin/activities', 'GET');
        const activitiesContainer = document.getElementById('recentActivities');
        
        activitiesContainer.innerHTML = activities.map(activity => `
            <div class="list-group-item">
                <div class="d-flex w-100 justify-content-between">
                    <h6 class="mb-1">${activity.title}</h6>
                    <small>${new Date(activity.timestamp).toLocaleString()}</small>
                </div>
                <p class="mb-1">${activity.description}</p>
                <small class="text-muted">${activity.user}</small>
            </div>
        `).join('');
    } catch (error) {
        console.error('Failed to load activities:', error);
        showError('Failed to load recent activities');
    }
}

// Load system status
async function loadSystemStatus() {
    try {
        const status = await api.request('/admin/system-status', 'GET');
        const statusContainer = document.getElementById('systemStatus');
        
        statusContainer.innerHTML = `
            <div class="list-group">
                <div class="list-group-item">
                    <div class="d-flex w-100 justify-content-between">
                        <h6 class="mb-1">Database Status</h6>
                        <span class="badge ${status.database ? 'bg-success' : 'bg-danger'}">
                            ${status.database ? 'Online' : 'Offline'}
                        </span>
                    </div>
                </div>
                <div class="list-group-item">
                    <div class="d-flex w-100 justify-content-between">
                        <h6 class="mb-1">API Status</h6>
                        <span class="badge ${status.api ? 'bg-success' : 'bg-danger'}">
                            ${status.api ? 'Online' : 'Offline'}
                        </span>
                    </div>
                </div>
                <div class="list-group-item">
                    <div class="d-flex w-100 justify-content-between">
                        <h6 class="mb-1">Storage Status</h6>
                        <span class="badge ${status.storage ? 'bg-success' : 'bg-danger'}">
                            ${status.storage ? 'Online' : 'Offline'}
                        </span>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Failed to load system status:', error);
        showError('Failed to load system status');
    }
}

// Refresh dashboard data
function refreshDashboard() {
    const refreshBtn = document.getElementById('refreshBtn');
    refreshBtn.disabled = true;
    refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...';
    
    initializeDashboard().finally(() => {
        refreshBtn.disabled = false;
        refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
    });
}

// Load different pages
async function loadPage(page) {
    const mainContent = document.getElementById('dashboardContent');
    mainContent.innerHTML = '<div class="text-center"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
    
    try {
        switch (page) {
            case 'users':
                await loadUserManagement();
                break;
            case 'courses':
                await loadCourseManagement();
                break;
            case 'teachers':
                await loadTeacherManagement();
                break;
            case 'students':
                await loadStudentManagement();
                break;
            case 'reports':
                await loadReports();
                break;
            case 'settings':
                await loadSettings();
                break;
            default:
                await initializeDashboard();
        }
    } catch (error) {
        console.error(`Failed to load ${page}:`, error);
        showError(`Failed to load ${page}`);
    }
}

// Show error message
function showError(message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-danger alert-dismissible fade show';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.querySelector('main').insertBefore(alertDiv, document.querySelector('main').firstChild);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
} 