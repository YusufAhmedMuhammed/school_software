from fastapi import APIRouter, HTTPException, Depends
from app.models import UserRole
from app.auth import get_current_user, require_role
from app.database import grades, users, courses
from datetime import datetime
from typing import List
from pydantic import BaseModel

router = APIRouter()

class Grade(BaseModel):
    student_id: str
    score: float
    assignment_name: str
    date: datetime

# Get grades for a course
@router.get("/{course_id}")
async def get_course_grades(
    course_id: str,
    current_user = Depends(get_current_user)
):
    if current_user.get("role") != UserRole.TEACHER:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Check if teacher teaches this course
    course = await courses.find_one({"_id": course_id})
    if not course or course.get("teacher_id") != current_user.get("username"):
        raise HTTPException(status_code=403, detail="Not authorized for this course")
    
    # Get all grades for the course
    grade_records = await grades.find({"course_id": course_id}).to_list(length=None)
    
    # Organize grades by student
    student_grades = {}
    for record in grade_records:
        student_id = record.get("student_id")
        if student_id not in student_grades:
            student = await users.find_one({"_id": student_id})
            if not student:
                continue
            student_grades[student_id] = {
                "student_name": student.get("fullname"),
                "grades": []
            }
        
        student_grades[student_id]["grades"].append({
            "assignment_name": record.get("assignment_name"),
            "score": record.get("score"),
            "date": record.get("date")
        })
    
    return list(student_grades.values())

# Add a grade for a student
@router.post("/{course_id}/student/{student_id}")
async def add_grade(
    course_id: str,
    student_id: str,
    grade: Grade,
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
    
    # Add grade record
    await grades.insert_one({
        "course_id": course_id,
        "student_id": student_id,
        "assignment_name": grade.assignment_name,
        "score": grade.score,
        "date": grade.date,
        "created_at": datetime.now(),
        "created_by": current_user.get("username")
    })
    
    return {"message": "Grade added successfully"}

# Bulk add grades
@router.post("/{course_id}/bulk")
async def bulk_add_grades(
    course_id: str,
    grade_list: List[Grade],
    current_user = Depends(get_current_user)
):
    if current_user.get("role") != UserRole.TEACHER:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Check if teacher teaches this course
    course = await courses.find_one({"_id": course_id})
    if not course or course.get("teacher_id") != current_user.get("username"):
        raise HTTPException(status_code=403, detail="Not authorized for this course")
    
    # Add all grade records
    for grade in grade_list:
        # Check if student is enrolled
        if grade.student_id not in course.get("students", []):
            continue
        
        await grades.insert_one({
            "course_id": course_id,
            "student_id": grade.student_id,
            "assignment_name": grade.assignment_name,
            "score": grade.score,
            "date": grade.date,
            "created_at": datetime.now(),
            "created_by": current_user.get("username")
        })
    
    return {"message": "Grades added successfully"} 