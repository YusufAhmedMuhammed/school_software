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

        // Set default date to today
        document.getElementById('date-select').valueAsDate = new Date();
        
        // Load courses
        loadCourses();
    } catch (error) {
        console.error('Error:', error);
        window.location.href = '../login.html';
    }
});

// Load courses for selection
async function loadCourses() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:8000/courses/teacher', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch courses');
        }

        const courses = await response.json();
        const courseSelect = document.getElementById('course-select');
        
        courses.forEach(course => {
            const option = document.createElement('option');
            option.value = course._id;
            option.textContent = course.title;
            courseSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading courses:', error);
        showError('Failed to load courses');
    }
}

// Load attendance records
document.getElementById('load-attendance-btn').addEventListener('click', async () => {
    const courseId = document.getElementById('course-select').value;
    const date = document.getElementById('date-select').value;

    if (!courseId) {
        showError('Please select a course');
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:8000/attendance/${courseId}?date=${date}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch attendance records');
        }

        const attendanceRecords = await response.json();
        displayAttendanceRecords(attendanceRecords);
    } catch (error) {
        console.error('Error loading attendance records:', error);
        showError('Failed to load attendance records');
    }
});

// Display attendance records
function displayAttendanceRecords(records) {
    const tbody = document.getElementById('attendance-table-body');
    tbody.innerHTML = '';

    records.forEach(record => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${record.student_name}</td>
            <td>
                <span class="badge ${getStatusBadgeClass(record.status)}">
                    ${record.status}
                </span>
            </td>
            <td>
                <div class="btn-group">
                    <button class="btn btn-sm btn-success" onclick="updateAttendance('${record.student_id}', 'present')">
                        <i class="bi bi-check-circle"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="updateAttendance('${record.student_id}', 'absent')">
                        <i class="bi bi-x-circle"></i>
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="updateAttendance('${record.student_id}', 'late')">
                        <i class="bi bi-clock"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Update attendance status
async function updateAttendance(studentId, status) {
    const courseId = document.getElementById('course-select').value;
    const date = document.getElementById('date-select').value;

    if (!courseId) {
        showError('Please select a course');
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:8000/attendance/${courseId}/student/${studentId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status,
                date
            })
        });

        if (!response.ok) {
            throw new Error('Failed to update attendance');
        }

        // Refresh attendance records
        document.getElementById('load-attendance-btn').click();
        showSuccess('Attendance updated successfully');
    } catch (error) {
        console.error('Error updating attendance:', error);
        showError('Failed to update attendance');
    }
}

// Bulk update attendance
document.getElementById('bulk-update-btn').addEventListener('click', async () => {
    const courseId = document.getElementById('course-select').value;
    const date = document.getElementById('date-select').value;
    const status = document.getElementById('bulk-status').value;
    const selectedStudents = Array.from(document.querySelectorAll('.student-checkbox:checked'))
        .map(checkbox => checkbox.value);

    if (!courseId) {
        showError('Please select a course');
        return;
    }

    if (selectedStudents.length === 0) {
        showError('Please select at least one student');
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:8000/attendance/${courseId}/bulk`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                students: selectedStudents,
                status,
                date
            })
        });

        if (!response.ok) {
            throw new Error('Failed to update attendance');
        }

        // Close modal and refresh attendance records
        bootstrap.Modal.getInstance(document.getElementById('bulkUpdateModal')).hide();
        document.getElementById('load-attendance-btn').click();
        showSuccess('Attendance updated successfully');
    } catch (error) {
        console.error('Error updating attendance:', error);
        showError('Failed to update attendance');
    }
});

// Get status badge class
function getStatusBadgeClass(status) {
    switch (status.toLowerCase()) {
        case 'present':
            return 'bg-success';
        case 'absent':
            return 'bg-danger';
        case 'late':
            return 'bg-warning';
        default:
            return 'bg-secondary';
    }
}

// Refresh button
document.getElementById('refresh-btn').addEventListener('click', () => {
    document.getElementById('load-attendance-btn').click();
});

// Error handling
function showError(message) {
    const alert = document.createElement('div');
    alert.className = 'alert alert-danger alert-dismissible fade show';
    alert.role = 'alert';
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    document.querySelector('main').insertBefore(alert, document.querySelector('main').firstChild);
    
    setTimeout(() => {
        alert.classList.remove('show');
        setTimeout(() => alert.remove(), 150);
    }, 5000);
}

// Success message
function showSuccess(message) {
    const alert = document.createElement('div');
    alert.className = 'alert alert-success alert-dismissible fade show';
    alert.role = 'alert';
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    document.querySelector('main').insertBefore(alert, document.querySelector('main').firstChild);
    
    setTimeout(() => {
        alert.classList.remove('show');
        setTimeout(() => alert.remove(), 150);
    }, 5000);
} 