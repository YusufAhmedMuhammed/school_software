from fastapi import APIRouter, HTTPException, Depends
from app.models import Course
from app.database import courses, users
from app.auth import get_current_user, require_role
from app.models import UserRole
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel

router = APIRouter()

class Course(BaseModel):
    title: str
    description: str
    schedule: str
    room: str

class CourseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    schedule: Optional[str] = None
    room: Optional[str] = None

# Get course schedule for student
@router.get("/schedule")
async def get_course_schedule(current_user = Depends(get_current_user)):
    if current_user.get("role") != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get student's courses
    student = await users.find_one({"username": current_user.get("username")})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    student_courses = student.get("courses", [])
    schedule_events = []
    
    # Get schedule for each course
    async for course in courses.find({"_id": {"$in": student_courses}}):
        for day, time in course.get("schedule", {}).items():
            # Convert day and time to datetime
            # Assuming time is in format "HH:MM"
            hour, minute = map(int, time.split(":"))
            event_date = datetime.now().replace(hour=hour, minute=minute)
            
            schedule_events.append({
                "title": course.get("title"),
                "start": event_date.isoformat(),
                "end": (event_date.replace(hour=hour+1)).isoformat(),  # 1-hour duration
                "color": "#" + str(hash(course.get("title")) % 0xFFFFFF)  # Unique color for each course
            })
    
    return schedule_events

# Get course details
@router.get("/{course_id}")
async def get_course(course_id: str, current_user = Depends(get_current_user)):
    course = await courses.find_one({"_id": course_id})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Check if user has access to the course
    if current_user.get("role") == UserRole.STUDENT:
        student = await users.find_one({"username": current_user.get("username")})
        if course_id not in student.get("courses", []):
            raise HTTPException(status_code=403, detail="Not enrolled in this course")
    
    return course

# Get student's grades for a course
@router.get("/{course_id}/grades")
async def get_course_grades(course_id: str, current_user = Depends(get_current_user)):
    if current_user.get("role") != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get all assignments for the course
    course_assignments = []
    async for assignment in assignments.find({"course_id": course_id}):
        submission = assignment.get("submissions", {}).get(current_user.get("username"))
        if submission:
            course_assignments.append({
                "title": assignment.get("title"),
                "grade": submission.get("grade"),
                "max_points": assignment.get("max_points")
            })
    
    return course_assignments

# Get course performance trend
@router.get("/{course_id}/performance")
async def get_course_performance(course_id: str, current_user = Depends(get_current_user)):
    if current_user.get("role") != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get grades over time
    performance_data = []
    async for assignment in assignments.find({
        "course_id": course_id,
        f"submissions.{current_user.get('username')}": {"$exists": True}
    }).sort("deadline", 1):
        submission = assignment.get("submissions", {}).get(current_user.get("username"))
        if submission and submission.get("grade") is not None:
            performance_data.append({
                "date": assignment.get("deadline"),
                "grade": submission.get("grade"),
                "max_points": assignment.get("max_points")
            })
    
    return performance_data

# Get teacher's courses
@router.get("/teacher")
async def get_teacher_courses(current_user = Depends(get_current_user)):
    if current_user.get("role") != UserRole.TEACHER:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get all courses taught by the teacher
    course_list = await courses.find({"teacher_id": current_user.get("username")}).to_list(length=None)
    
    # Get student details for each course
    for course in course_list:
        student_details = []
        for student_id in course.get("students", []):
            student = await users.find_one({"_id": student_id})
            if student:
                student_details.append({
                    "id": student_id,
                    "name": student.get("fullname"),
                    "email": student.get("email")
                })
        course["students"] = student_details
    
    return course_list

# Create a new course
@router.post("/")
async def create_course(
    course: Course,
    current_user = Depends(get_current_user)
):
    if current_user.get("role") != UserRole.TEACHER:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Create course record
    course_data = {
        "_id": str(datetime.now().timestamp()),  # Simple ID generation
        "title": course.title,
        "description": course.description,
        "schedule": course.schedule,
        "room": course.room,
        "teacher_id": current_user.get("username"),
        "students": [],
        "created_at": datetime.now()
    }
    
    await courses.insert_one(course_data)
    return {"message": "Course created successfully", "course_id": course_data["_id"]}

# Update course details
@router.put("/{course_id}")
async def update_course(
    course_id: str,
    course_update: CourseUpdate,
    current_user = Depends(get_current_user)
):
    if current_user.get("role") != UserRole.TEACHER:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get the course
    course = await courses.find_one({"_id": course_id})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Check if teacher teaches this course
    if course.get("teacher_id") != current_user.get("username"):
        raise HTTPException(status_code=403, detail="Not authorized for this course")
    
    # Prepare update data
    update_data = {}
    if course_update.title is not None:
        update_data["title"] = course_update.title
    if course_update.description is not None:
        update_data["description"] = course_update.description
    if course_update.schedule is not None:
        update_data["schedule"] = course_update.schedule
    if course_update.room is not None:
        update_data["room"] = course_update.room
    
    if update_data:
        update_data["updated_at"] = datetime.now()
        await courses.update_one(
            {"_id": course_id},
            {"$set": update_data}
        )
    
    return {"message": "Course updated successfully"}

# Add student to course
@router.post("/{course_id}/students/{student_id}")
async def add_student_to_course(
    course_id: str,
    student_id: str,
    current_user = Depends(get_current_user)
):
    if current_user.get("role") != UserRole.TEACHER:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get the course
    course = await courses.find_one({"_id": course_id})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Check if teacher teaches this course
    if course.get("teacher_id") != current_user.get("username"):
        raise HTTPException(status_code=403, detail="Not authorized for this course")
    
    # Check if student exists
    student = await users.find_one({"_id": student_id, "role": UserRole.STUDENT})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Check if student is already enrolled
    if student_id in course.get("students", []):
        raise HTTPException(status_code=400, detail="Student already enrolled in this course")
    
    # Add student to course
    await courses.update_one(
        {"_id": course_id},
        {"$push": {"students": student_id}}
    )
    
    return {"message": "Student added to course successfully"}

# Remove student from course
@router.delete("/{course_id}/students/{student_id}")
async def remove_student_from_course(
    course_id: str,
    student_id: str,
    current_user = Depends(get_current_user)
):
    if current_user.get("role") != UserRole.TEACHER:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get the course
    course = await courses.find_one({"_id": course_id})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Check if teacher teaches this course
    if course.get("teacher_id") != current_user.get("username"):
        raise HTTPException(status_code=403, detail="Not authorized for this course")
    
    # Check if student is enrolled
    if student_id not in course.get("students", []):
        raise HTTPException(status_code=400, detail="Student not enrolled in this course")
    
    # Remove student from course
    await courses.update_one(
        {"_id": course_id},
        {"$pull": {"students": student_id}}
    )
    
    return {"message": "Student removed from course successfully"}
