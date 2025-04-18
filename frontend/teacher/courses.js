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

        // Load courses data
        loadCourses();
    } catch (error) {
        console.error('Error:', error);
        window.location.href = '../login.html';
    }
});

// Load courses
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
        displayCourses(courses);
    } catch (error) {
        console.error('Error loading courses:', error);
        showError('Failed to load courses');
    }
}

// Display courses in the table
function displayCourses(courses) {
    const tbody = document.getElementById('courses-table-body');
    tbody.innerHTML = '';

    courses.forEach(course => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${course.title}</td>
            <td>${course.description}</td>
            <td>${course.schedule}</td>
            <td>${course.room}</td>
            <td>${course.students.length}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="editCourse('${course._id}')">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-info" onclick="manageStudents('${course._id}')">
                    <i class="bi bi-people"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteCourse('${course._id}')">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Create new course
document.getElementById('create-course-btn').addEventListener('click', async () => {
    try {
        const token = localStorage.getItem('token');
        const courseData = {
            title: document.getElementById('course-title').value,
            description: document.getElementById('course-description').value,
            schedule: document.getElementById('course-schedule').value,
            room: document.getElementById('course-room').value
        };

        const response = await fetch('http://localhost:8000/courses', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(courseData)
        });

        if (!response.ok) {
            throw new Error('Failed to create course');
        }

        // Close modal and refresh courses list
        bootstrap.Modal.getInstance(document.getElementById('createCourseModal')).hide();
        document.getElementById('create-course-form').reset();
        loadCourses();
        showSuccess('Course created successfully');
    } catch (error) {
        console.error('Error creating course:', error);
        showError('Failed to create course');
    }
});

// Edit course
async function editCourse(courseId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:8000/courses/${courseId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch course details');
        }

        const course = await response.json();
        
        // Populate edit form
        document.getElementById('edit-course-id').value = course._id;
        document.getElementById('edit-course-title').value = course.title;
        document.getElementById('edit-course-description').value = course.description;
        document.getElementById('edit-course-schedule').value = course.schedule;
        document.getElementById('edit-course-room').value = course.room;

        // Show edit modal
        new bootstrap.Modal(document.getElementById('editCourseModal')).show();
    } catch (error) {
        console.error('Error loading course details:', error);
        showError('Failed to load course details');
    }
}

// Update course
document.getElementById('update-course-btn').addEventListener('click', async () => {
    try {
        const token = localStorage.getItem('token');
        const courseId = document.getElementById('edit-course-id').value;
        const courseData = {
            title: document.getElementById('edit-course-title').value,
            description: document.getElementById('edit-course-description').value,
            schedule: document.getElementById('edit-course-schedule').value,
            room: document.getElementById('edit-course-room').value
        };

        const response = await fetch(`http://localhost:8000/courses/${courseId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(courseData)
        });

        if (!response.ok) {
            throw new Error('Failed to update course');
        }

        // Close modal and refresh courses list
        bootstrap.Modal.getInstance(document.getElementById('editCourseModal')).hide();
        loadCourses();
        showSuccess('Course updated successfully');
    } catch (error) {
        console.error('Error updating course:', error);
        showError('Failed to update course');
    }
});

// Delete course
async function deleteCourse(courseId) {
    if (!confirm('Are you sure you want to delete this course?')) {
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:8000/courses/${courseId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to delete course');
        }

        loadCourses();
        showSuccess('Course deleted successfully');
    } catch (error) {
        console.error('Error deleting course:', error);
        showError('Failed to delete course');
    }
}

// Manage students
async function manageStudents(courseId) {
    try {
        const token = localStorage.getItem('token');
        const [courseResponse, studentsResponse] = await Promise.all([
            fetch(`http://localhost:8000/courses/${courseId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }),
            fetch('http://localhost:8000/students', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
        ]);

        if (!courseResponse.ok || !studentsResponse.ok) {
            throw new Error('Failed to fetch data');
        }

        const course = await courseResponse.json();
        const students = await studentsResponse.json();

        // Set course ID
        document.getElementById('manage-course-id').value = courseId;

        // Display students
        displayStudents(students, course.students);

        // Show manage students modal
        new bootstrap.Modal(document.getElementById('manageStudentsModal')).show();
    } catch (error) {
        console.error('Error loading students:', error);
        showError('Failed to load students');
    }
}

// Display students in the manage students modal
function displayStudents(students, enrolledStudents) {
    const tbody = document.getElementById('students-table-body');
    tbody.innerHTML = '';

    students.forEach(student => {
        const isEnrolled = enrolledStudents.includes(student._id);
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${student.fullname}</td>
            <td>${student.email}</td>
            <td>${isEnrolled ? '<span class="badge bg-success">Enrolled</span>' : '<span class="badge bg-secondary">Not Enrolled</span>'}</td>
            <td>
                ${isEnrolled ? 
                    `<button class="btn btn-sm btn-danger" onclick="removeStudent('${student._id}')">
                        <i class="bi bi-person-dash"></i> Remove
                    </button>` :
                    `<button class="btn btn-sm btn-success" onclick="addStudent('${student._id}')">
                        <i class="bi bi-person-plus"></i> Add
                    </button>`
                }
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Add student to course
async function addStudent(studentId) {
    try {
        const token = localStorage.getItem('token');
        const courseId = document.getElementById('manage-course-id').value;

        const response = await fetch(`http://localhost:8000/courses/${courseId}/students/${studentId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to add student');
        }

        // Refresh students list
        manageStudents(courseId);
        showSuccess('Student added successfully');
    } catch (error) {
        console.error('Error adding student:', error);
        showError('Failed to add student');
    }
}

// Remove student from course
async function removeStudent(studentId) {
    try {
        const token = localStorage.getItem('token');
        const courseId = document.getElementById('manage-course-id').value;

        const response = await fetch(`http://localhost:8000/courses/${courseId}/students/${studentId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to remove student');
        }

        // Refresh students list
        manageStudents(courseId);
        showSuccess('Student removed successfully');
    } catch (error) {
        console.error('Error removing student:', error);
        showError('Failed to remove student');
    }
}

// Search students
document.getElementById('student-search').addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const rows = document.querySelectorAll('#students-table-body tr');

    rows.forEach(row => {
        const name = row.cells[0].textContent.toLowerCase();
        const email = row.cells[1].textContent.toLowerCase();
        if (name.includes(searchTerm) || email.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
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