from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    ADMIN = "admin"
    TEACHER = "teacher"
    STUDENT = "student"

class User(BaseModel):
    id: Optional[str] = None
    username: str
    email: str
    password: str
    role: UserRole
    fullname: str
    created_at: datetime = datetime.now()

class Student(User):
    grade_level: str
    courses: List[str] = []
    attendance: Dict[str, bool] = {}  # course_id: present

class Teacher(User):
    department: str
    courses_teaching: List[str] = []

class Course(BaseModel):
    id: Optional[str] = None
    title: str
    description: str
    teacher_id: str
    schedule: Dict[str, str]  # day: time
    assignments: List[Dict] = []  # {title, deadline, max_points}
    students: List[str] = []

class Assignment(BaseModel):
    id: Optional[str] = None
    course_id: str
    title: str
    description: str
    deadline: datetime
    max_points: float
    submissions: Dict[str, Dict] = {}  # student_id: {file_path, submitted_at, grade}

class Grade(BaseModel):
    id: Optional[str] = None
    student_id: str
    course_id: str
    assignment_id: str
    points: float
    feedback: Optional[str] = None
    graded_by: str
    graded_at: datetime = datetime.now()

class AuditLog(BaseModel):
    id: Optional[str] = None
    user_id: str
    action: str
    details: Dict
    timestamp: datetime = datetime.now()
