from fastapi import APIRouter, HTTPException, Depends
from app.models import UserRole
from app.auth import get_current_user, require_role
from app.database import attendance, users, courses
from datetime import datetime
from typing import List
from pydantic import BaseModel

router = APIRouter()

class AttendanceRecord(BaseModel):
    student_id: str
    present: bool
    date: datetime

# Get attendance for a course on a specific date
@router.get("/{course_id}")
async def get_attendance(
    course_id: str,
    date: str,
    current_user = Depends(get_current_user)
):
    if current_user.get("role") != UserRole.TEACHER:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Check if teacher teaches this course
    course = await courses.find_one({"_id": course_id})
    if not course or course.get("teacher_id") != current_user.get("username"):
        raise HTTPException(status_code=403, detail="Not authorized for this course")
    
    # Get all students in the course
    students = course.get("students", [])
    
    # Get attendance records for the date
    attendance_date = datetime.strptime(date, "%Y-%m-%d")
    records = []
    
    for student_id in students:
        # Get student details
        student = await users.find_one({"_id": student_id})
        if not student:
            continue
        
        # Get attendance record
        record = await attendance.find_one({
            "course_id": course_id,
            "student_id": student_id,
            "date": attendance_date
        })
        
        records.append({
            "student_id": student_id,
            "student_name": student.get("fullname"),
            "present": record.get("present", False) if record else False
        })
    
    return records

# Update attendance for a student
@router.post("/{course_id}/student/{student_id}")
async def update_attendance(
    course_id: str,
    student_id: str,
    present: bool,
    current_user = Depends(get_current_user)
):
    if current_user.get("role") != UserRole.TEACHER:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Check if teacher teaches this course
    course = await courses.find_one({"_id": course_id})
    if not course or course.get("teacher_id") != current_user.get("username"):
        raise HTTPException(status_code=403, detail="Not authorized for this course")
    
    # Check if student is enrolled
    if student_id not in course.get("students", []):
        raise HTTPException(status_code=400, detail="Student not enrolled in this course")
    
    # Update or create attendance record
    date = datetime.now().date()
    await attendance.update_one(
        {
            "course_id": course_id,
            "student_id": student_id,
            "date": date
        },
        {
            "$set": {
                "present": present,
                "updated_at": datetime.now(),
                "updated_by": current_user.get("username")
            }
        },
        upsert=True
    )
    
    return {"message": "Attendance updated successfully"}

# Bulk update attendance
@router.post("/{course_id}/bulk")
async def bulk_update_attendance(
    course_id: str,
    records: List[AttendanceRecord],
    current_user = Depends(get_current_user)
):
    if current_user.get("role") != UserRole.TEACHER:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Check if teacher teaches this course
    course = await courses.find_one({"_id": course_id})
    if not course or course.get("teacher_id") != current_user.get("username"):
        raise HTTPException(status_code=403, detail="Not authorized for this course")
    
    # Update all records
    for record in records:
        # Check if student is enrolled
        if record.student_id not in course.get("students", []):
            continue
        
        await attendance.update_one(
            {
                "course_id": course_id,
                "student_id": record.student_id,
                "date": record.date
            },
            {
                "$set": {
                    "present": record.present,
                    "updated_at": datetime.now(),
                    "updated_by": current_user.get("username")
                }
            },
            upsert=True
        )
    
    return {"message": "Attendance records updated successfully"} 