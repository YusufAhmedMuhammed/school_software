document.getElementById('loginForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;

    try {
        const response = await fetch('http://localhost:8000/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`
        });

        const data = await response.json();

        if (response.ok) {
            // Store the token
            localStorage.setItem('token', data.access_token);
            localStorage.setItem('role', data.role);
            localStorage.setItem('username', username);

            // Redirect based on role
            switch(data.role) {
                case 'student':
                    window.location.href = '../student-dashboard/index.html';
                    break;
                case 'teacher':
                    window.location.href = '../teacher-portal/index.html';
                    break;
                case 'admin':
                    window.location.href = '../admin-dashboard/index.html';
                    break;
                default:
                    alert('Invalid role');
            }
        } else {
            alert(data.detail || 'Login failed');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred during login');
    }
});

// Check for session timeout
function checkSession() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'index.html';
    }
}

// Check session every 5 minutes
setInterval(checkSession, 5 * 60 * 1000); 