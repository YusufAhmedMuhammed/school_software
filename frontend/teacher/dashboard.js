// Check if user is logged in and is a teacher
document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '../login.html';
        return;
    }

    try {
        const response = await fetch('http://localhost:8000/auth/me', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Not authorized');
        }

        const user = await response.json();
        if (user.role !== 'teacher') {
            window.location.href = '../login.html';
            return;
        }

        // Load dashboard data
        loadDashboardData();
    } catch (error) {
        console.error('Error:', error);
        window.location.href = '../login.html';
    }
});

// Load dashboard data
async function loadDashboardData() {
    try {
        const token = localStorage.getItem('token');
        const [coursesResponse, assignmentsResponse, attendanceResponse] = await Promise.all([
            fetch('http://localhost:8000/courses/teacher', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }),
            fetch('http://localhost:8000/assignments/teacher', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }),
            fetch('http://localhost:8000/attendance/today', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
        ]);

        if (!coursesResponse.ok || !assignmentsResponse.ok || !attendanceResponse.ok) {
            throw new Error('Failed to fetch data');
        }

        const courses = await coursesResponse.json();
        const assignments = await assignmentsResponse.json();
        const attendance = await attendanceResponse.json();

        // Update quick stats
        updateQuickStats(courses, assignments, attendance);
        
        // Update recent courses
        updateRecentCourses(courses);
        
        // Update upcoming deadlines
        updateUpcomingDeadlines(assignments);
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showError('Failed to load dashboard data');
    }
}

// Update quick stats
function updateQuickStats(courses, assignments, attendance) {
    // Active courses count
    document.getElementById('active-courses-count').textContent = courses.length;

    // Total students count
    const totalStudents = courses.reduce((total, course) => total + course.students.length, 0);
    document.getElementById('total-students-count').textContent = totalStudents;

    // Pending assignments count
    const pendingAssignments = assignments.filter(assignment => 
        new Date(assignment.due_date) > new Date() && 
        !assignment.graded
    ).length;
    document.getElementById('pending-assignments-count').textContent = pendingAssignments;

    // Today's attendance count
    document.getElementById('today-attendance-count').textContent = attendance.length;
}

// Update recent courses
function updateRecentCourses(courses) {
    const recentCoursesList = document.getElementById('recent-courses-list');
    recentCoursesList.innerHTML = '';

    // Sort courses by creation date (newest first)
    const sortedCourses = [...courses].sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
    ).slice(0, 5); // Show only 5 most recent courses

    sortedCourses.forEach(course => {
        const courseItem = document.createElement('a');
        courseItem.href = '#';
        courseItem.className = 'list-group-item list-group-item-action';
        courseItem.innerHTML = `
            <div class="d-flex w-100 justify-content-between">
                <h6 class="mb-1">${course.title}</h6>
                <small>${new Date(course.created_at).toLocaleDateString()}</small>
            </div>
            <p class="mb-1">${course.description}</p>
            <small>${course.students.length} students enrolled</small>
        `;
        recentCoursesList.appendChild(courseItem);
    });
}

// Update upcoming deadlines
function updateUpcomingDeadlines(assignments) {
    const deadlinesList = document.getElementById('upcoming-deadlines-list');
    deadlinesList.innerHTML = '';

    // Filter and sort assignments by due date
    const upcomingAssignments = assignments
        .filter(assignment => new Date(assignment.due_date) > new Date())
        .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
        .slice(0, 5); // Show only 5 upcoming assignments

    upcomingAssignments.forEach(assignment => {
        const deadlineItem = document.createElement('a');
        deadlineItem.href = '#';
        deadlineItem.className = 'list-group-item list-group-item-action';
        deadlineItem.innerHTML = `
            <div class="d-flex w-100 justify-content-between">
                <h6 class="mb-1">${assignment.title}</h6>
                <small>${new Date(assignment.due_date).toLocaleDateString()}</small>
            </div>
            <p class="mb-1">${assignment.description}</p>
            <small>${assignment.course_title}</small>
        `;
        deadlinesList.appendChild(deadlineItem);
    });
}

// Tab navigation
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Remove active class from all tabs
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        
        // Add active class to clicked tab
        link.classList.add('active');
        
        // Hide all content sections
        document.querySelectorAll('main > div[id$="-content"]').forEach(section => {
            section.classList.add('d-none');
        });
        
        // Show selected content section
        const contentId = link.id.replace('-tab', '-content');
        document.getElementById(contentId).classList.remove('d-none');
    });
});

// Refresh button
document.getElementById('refresh-btn').addEventListener('click', () => {
    loadDashboardData();
});

// Logout
document.getElementById('logout-link').addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('token');
    window.location.href = '../login.html';
});

// Error handling
function showError(message) {
    // Create error alert
    const alert = document.createElement('div');
    alert.className = 'alert alert-danger alert-dismissible fade show';
    alert.role = 'alert';
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // Add alert to the page
    document.querySelector('main').insertBefore(alert, document.querySelector('main').firstChild);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        alert.classList.remove('show');
        setTimeout(() => alert.remove(), 150);
    }, 5000);
} 