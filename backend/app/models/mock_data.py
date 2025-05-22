from typing import Dict, Any
from datetime import datetime, timedelta
import random
from passlib.context import CryptContext

# Initialize password hasher
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def generate_mock_data() -> Dict[str, Dict[str, Any]]:
    """Generate mock data for testing"""
    
    # Mock Users with hashed passwords
    users = {
        "student1": {
            "uid": "student1",
            "email": "student1@school.com",
            "username": "johndoe",
            "name": "John Doe",
            "password": pwd_context.hash("student123"),  # Hashed password
            "role": "student",
            "grade": "10A",
            "created_at": datetime.now().isoformat()
        },
        "student2": {
            "uid": "student2",
            "email": "student2@school.com",
            "username": "janesmith",
            "name": "Jane Smith",
            "password": pwd_context.hash("student456"),  # Hashed password
            "role": "student",
            "grade": "10B",
            "created_at": datetime.now().isoformat()
        },
        "teacher1": {
            "uid": "teacher1",
            "email": "teacher1@school.com",
            "username": "drbrown",
            "name": "Dr. Brown",
            "password": pwd_context.hash("teacher123"),  # Hashed password
            "role": "teacher",
            "subject": "Mathematics",
            "created_at": datetime.now().isoformat()
        },
        "admin1": {
            "uid": "admin1",
            "email": "admin@school.com",
            "username": "admin",
            "name": "Admin User",
            "password": pwd_context.hash("admin123"),  # Hashed password
            "role": "admin",
            "created_at": datetime.now().isoformat()
        }
    }

    # Mock Courses
    courses = {
        "math101": {
            "id": "math101",
            "name": "Mathematics 101",
            "teacher_id": "teacher1",
            "grade": "10A",
            "schedule": "Mon,Wed 9:00-10:30",
            "created_at": datetime.now().isoformat()
        },
        "science101": {
            "id": "science101",
            "name": "Science 101",
            "teacher_id": "teacher1",
            "grade": "10B",
            "schedule": "Tue,Thu 9:00-10:30",
            "created_at": datetime.now().isoformat()
        }
    }

    # Mock Attendance
    attendance = {}
    current_date = datetime.now()
    
    # Generate attendance records for the last 30 days
    for i in range(30):
        date = (current_date - timedelta(days=i)).strftime("%Y-%m-%d")
        for student_id in ["student1", "student2"]:
            for course_id in ["math101", "science101"]:
                attendance[f"{student_id}_{course_id}_{date}"] = {
                    "id": f"{student_id}_{course_id}_{date}",
                    "student_id": student_id,
                    "course_id": course_id,
                    "date": date,
                    "status": random.choice(["present", "absent", "late"]),
                    "created_at": datetime.now().isoformat()
                }

    return {
        "users": users,
        "courses": courses,
        "attendance": attendance
    }

# Cache the mock data
_mock_data = None

def get_mock_data() -> Dict[str, Dict[str, Any]]:
    """Get or generate mock data"""
    global _mock_data
    if _mock_data is None:
        _mock_data = generate_mock_data()
    return _mock_data 