// Check authentication
document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '../login page/index.html';
        return;
    }

    // Display username
    document.getElementById('username').textContent = localStorage.getItem('username');

    // Initialize calendar
    initCalendar();
    
    // Load assignments
    await loadAssignments();
    
    // Initialize performance chart
    initPerformanceChart();
});

// Initialize FullCalendar
function initCalendar() {
    const calendarEl = document.getElementById('calendar');
    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        events: async function(info, successCallback, failureCallback) {
            try {
                const response = await fetch('http://localhost:8000/courses/schedule', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                const events = await response.json();
                successCallback(events);
            } catch (error) {
                console.error('Error fetching calendar events:', error);
                failureCallback(error);
            }
        }
    });
    calendar.render();
}

// Load assignments
async function loadAssignments() {
    try {
        const response = await fetch('http://localhost:8000/assignments/student', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const assignments = await response.json();
        
        const assignmentsList = document.getElementById('assignmentsList');
        assignmentsList.innerHTML = assignments.map(assignment => `
            <tr>
                <td class="px-6 py-4 whitespace-nowrap">${assignment.title}</td>
                <td class="px-6 py-4 whitespace-nowrap">${assignment.course}</td>
                <td class="px-6 py-4 whitespace-nowrap">${new Date(assignment.deadline).toLocaleDateString()}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${assignment.status === 'submitted' ? 'bg-green-100 text-green-800' : 
                          assignment.status === 'late' ? 'bg-red-100 text-red-800' : 
                          'bg-yellow-100 text-yellow-800'}">
                        ${assignment.status}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    ${assignment.status === 'pending' ? 
                        `<button onclick="openUploadModal('${assignment.id}')" 
                            class="text-blue-600 hover:text-blue-900">Submit</button>` :
                        'Submitted'}
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading assignments:', error);
    }
}

// Initialize performance chart
function initPerformanceChart() {
    const ctx = document.getElementById('performanceChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'],
            datasets: [{
                label: 'Performance Trend',
                data: [65, 72, 78, 81, 85],
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });
}

// File upload handling
let currentAssignmentId = null;

function openUploadModal(assignmentId) {
    currentAssignmentId = assignmentId;
    document.getElementById('uploadModal').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('uploadModal').classList.add('hidden');
    currentAssignmentId = null;
}

document.getElementById('uploadForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const file = document.getElementById('assignmentFile').files[0];
    
    if (file && file.type === 'application/pdf') {
        const formData = new FormData();
        formData.append('file', file);
        
        try {
            const response = await fetch(`http://localhost:8000/assignments/${currentAssignmentId}/submit`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formData
            });
            
            if (response.ok) {
                alert('Assignment submitted successfully!');
                closeModal();
                await loadAssignments();
            } else {
                throw new Error('Submission failed');
            }
        } catch (error) {
            console.error('Error submitting assignment:', error);
            alert('Failed to submit assignment. Please try again.');
        }
    } else {
        alert('Please select a valid PDF file.');
    }
});

// Logout function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    window.location.href = '../login page/index.html';
} 