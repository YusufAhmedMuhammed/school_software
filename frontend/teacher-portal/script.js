// Check authentication
document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token || localStorage.getItem('role') !== 'teacher') {
        window.location.href = '../login page/index.html';
        return;
    }

    // Display username
    document.getElementById('username').textContent = localStorage.getItem('username');

    // Load teacher's courses
    await loadCourses();
    
    // Set up event listeners
    setupEventListeners();
});

// Load teacher's courses
async function loadCourses() {
    try {
        const response = await fetch('http://localhost:8000/courses/teacher', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const courses = await response.json();
        
        const courseSelect = document.getElementById('courseSelect');
        courseSelect.innerHTML = courses.map(course => 
            `<option value="${course.id}">${course.title}</option>`
        ).join('');
        
        // Load initial data for first course
        if (courses.length > 0) {
            await loadCourseData(courses[0].id);
        }
    } catch (error) {
        console.error('Error loading courses:', error);
    }
}

// Load course data (attendance and assignments)
async function loadCourseData(courseId) {
    await Promise.all([
        loadAttendance(courseId),
        loadAssignments(courseId),
        loadStudents(courseId)
    ]);
}

// Load attendance for selected course and date
async function loadAttendance(courseId) {
    const date = document.getElementById('attendanceDate').value || new Date().toISOString().split('T')[0];
    
    try {
        const response = await fetch(`http://localhost:8000/attendance/${courseId}?date=${date}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const attendance = await response.json();
        
        const attendanceList = document.getElementById('attendanceList');
        attendanceList.innerHTML = attendance.map(record => `
            <tr>
                <td class="px-6 py-4 whitespace-nowrap">${record.student_name}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${record.present ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                        ${record.present ? 'Present' : 'Absent'}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <button onclick="toggleAttendance('${record.student_id}', ${!record.present})" 
                        class="text-blue-600 hover:text-blue-900">
                        ${record.present ? 'Mark Absent' : 'Mark Present'}
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading attendance:', error);
    }
}

// Load assignments for grade input
async function loadAssignments(courseId) {
    try {
        const response = await fetch(`http://localhost:8000/assignments/course/${courseId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const assignments = await response.json();
        
        const assignmentSelect = document.getElementById('assignmentSelect');
        assignmentSelect.innerHTML = assignments.map(assignment => 
            `<option value="${assignment.id}">${assignment.title}</option>`
        ).join('');
        
        // Load grades for first assignment
        if (assignments.length > 0) {
            await loadGrades(assignments[0].id);
        }
    } catch (error) {
        console.error('Error loading assignments:', error);
    }
}

// Load grades for selected assignment
async function loadGrades(assignmentId) {
    try {
        const response = await fetch(`http://localhost:8000/assignments/${assignmentId}/grades`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const grades = await response.json();
        
        const gradeList = document.getElementById('gradeList');
        gradeList.innerHTML = grades.map(grade => `
            <tr>
                <td class="px-6 py-4 whitespace-nowrap">${grade.student_name}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <input type="number" 
                        class="w-20 p-1 border rounded" 
                        value="${grade.grade || ''}"
                        data-student-id="${grade.student_id}"
                        min="0" max="100">
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading grades:', error);
    }
}

// Save grades for current assignment
async function saveGrades() {
    const assignmentId = document.getElementById('assignmentSelect').value;
    const grades = Array.from(document.querySelectorAll('#gradeList input')).map(input => ({
        student_id: input.dataset.studentId,
        grade: parseFloat(input.value)
    }));
    
    try {
        const response = await fetch(`http://localhost:8000/assignments/${assignmentId}/grades`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ grades })
        });
        
        if (response.ok) {
            alert('Grades saved successfully!');
        } else {
            throw new Error('Failed to save grades');
        }
    } catch (error) {
        console.error('Error saving grades:', error);
        alert('Failed to save grades. Please try again.');
    }
}

// Student search functionality
let searchTimeout;
document.getElementById('studentSearch').addEventListener('input', async (e) => {
    clearTimeout(searchTimeout);
    const query = e.target.value.trim();
    
    if (query.length < 2) {
        document.getElementById('searchResults').classList.add('hidden');
        return;
    }
    
    searchTimeout = setTimeout(async () => {
        try {
            const response = await fetch(`http://localhost:8000/students/search?q=${encodeURIComponent(query)}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const results = await response.json();
            
            const searchResults = document.getElementById('searchResults');
            searchResults.innerHTML = results.map(student => `
                <div class="p-2 hover:bg-gray-100 cursor-pointer" 
                    onclick="selectStudent('${student.id}')">
                    ${student.name} - ${student.grade}
                </div>
            `).join('');
            searchResults.classList.remove('hidden');
        } catch (error) {
            console.error('Error searching students:', error);
        }
    }, 300);
});

// Report generation
async function generateAttendanceReport() {
    const courseId = document.getElementById('courseSelect').value;
    try {
        const response = await fetch(`http://localhost:8000/reports/attendance/${courseId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'attendance_report.pdf';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error generating attendance report:', error);
        alert('Failed to generate attendance report');
    }
}

// Setup event listeners
function setupEventListeners() {
    document.getElementById('courseSelect').addEventListener('change', async (e) => {
        await loadCourseData(e.target.value);
    });
    
    document.getElementById('assignmentSelect').addEventListener('change', async (e) => {
        await loadGrades(e.target.value);
    });
    
    document.getElementById('attendanceDate').addEventListener('change', async (e) => {
        const courseId = document.getElementById('courseSelect').value;
        await loadAttendance(courseId);
    });
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    window.location.href = '../login page/index.html';
} 