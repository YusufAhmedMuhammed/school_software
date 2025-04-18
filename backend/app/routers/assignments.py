from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from app.models import Assignment, Grade
from app.database import assignments, grades, courses
from app.auth import get_current_user, require_role
from app.models import UserRole
from datetime import datetime
import os
import shutil
from typing import List, Optional
from pydantic import BaseModel

router = APIRouter()

class Assignment(BaseModel):
    title: str
    description: str
    due_date: datetime
    total_points: float
    course_id: str

class AssignmentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    total_points: Optional[float] = None

# Get student's assignments
@router.get("/student")
async def get_student_assignments(current_user = Depends(get_current_user)):
    if current_user.get("role") != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    student_assignments = []
    async for assignment in assignments.find():
        # Check if student is enrolled in the course
        if current_user.get("username") in assignment.get("students", []):
            # Get submission status
            submission = assignment.get("submissions", {}).get(current_user.get("username"))
            status = "submitted" if submission else "pending"
            
            # Check if deadline has passed
            if status == "pending" and datetime.now() > assignment.get("deadline"):
                status = "late"
            
            student_assignments.append({
                "id": str(assignment.get("_id")),
                "title": assignment.get("title"),
                "course": assignment.get("course_title"),
                "deadline": assignment.get("deadline"),
                "status": status
            })
    
    return student_assignments

# Submit assignment
@router.post("/{assignment_id}/submit")
async def submit_assignment(
    assignment_id: str,
    file: UploadFile = File(...),
    current_user = Depends(get_current_user)
):
    if current_user.get("role") != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Check if file is PDF
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    # Get assignment
    assignment = await assignments.find_one({"_id": assignment_id})
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    # Check if student is enrolled
    if current_user.get("username") not in assignment.get("students", []):
        raise HTTPException(status_code=403, detail="Not enrolled in this course")
    
    # Create upload directory if it doesn't exist
    upload_dir = f"uploads/assignments/{assignment_id}"
    os.makedirs(upload_dir, exist_ok=True)
    
    # Save file
    file_path = f"{upload_dir}/{current_user.get('username')}_{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Update assignment submission
    await assignments.update_one(
        {"_id": assignment_id},
        {"$set": {
            f"submissions.{current_user.get('username')}": {
                "file_path": file_path,
                "submitted_at": datetime.now(),
                "grade": None
            }
        }}
    )
    
    return {"message": "Assignment submitted successfully"}

# Get assignment grades
@router.get("/{assignment_id}/grades")
async def get_assignment_grades(
    assignment_id: str,
    current_user = Depends(get_current_user)
):
    assignment = await assignments.find_one({"_id": assignment_id})
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    if current_user.get("role") == UserRole.STUDENT:
        # Student can only see their own grade
        submission = assignment.get("submissions", {}).get(current_user.get("username"))
        if not submission:
            raise HTTPException(status_code=404, detail="No submission found")
        return {"grade": submission.get("grade")}
    
    elif current_user.get("role") == UserRole.TEACHER:
        # Teacher can see all grades
        grades = []
        for student_id, submission in assignment.get("submissions", {}).items():
            grades.append({
                "student_id": student_id,
                "grade": submission.get("grade")
            })
        return grades
    
    else:
        raise HTTPException(status_code=403, detail="Not authorized")

# Get all assignments for a course
@router.get("/course/{course_id}")
async def get_course_assignments(
    course_id: str,
    current_user = Depends(get_current_user)
):
    if current_user.get("role") != UserRole.TEACHER:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Check if teacher teaches this course
    course = await courses.find_one({"_id": course_id})
    if not course or course.get("teacher_id") != current_user.get("username"):
        raise HTTPException(status_code=403, detail="Not authorized for this course")
    
    # Get all assignments for the course
    assignment_list = await assignments.find({"course_id": course_id}).to_list(length=None)
    return assignment_list

# Create a new assignment
@router.post("/")
async def create_assignment(
    assignment: Assignment,
    current_user = Depends(get_current_user)
):
    if current_user.get("role") != UserRole.TEACHER:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Check if teacher teaches this course
    course = await courses.find_one({"_id": assignment.course_id})
    if not course or course.get("teacher_id") != current_user.get("username"):
        raise HTTPException(status_code=403, detail="Not authorized for this course")
    
    # Create assignment record
    assignment_data = {
        "_id": str(datetime.now().timestamp()),  # Simple ID generation
        "title": assignment.title,
        "description": assignment.description,
        "due_date": assignment.due_date,
        "total_points": assignment.total_points,
        "course_id": assignment.course_id,
        "created_at": datetime.now(),
        "created_by": current_user.get("username")
    }
    
    await assignments.insert_one(assignment_data)
    return {"message": "Assignment created successfully", "assignment_id": assignment_data["_id"]}

# Update an assignment
@router.put("/{assignment_id}")
async def update_assignment(
    assignment_id: str,
    assignment_update: AssignmentUpdate,
    current_user = Depends(get_current_user)
):
    if current_user.get("role") != UserRole.TEACHER:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get the assignment
    assignment = await assignments.find_one({"_id": assignment_id})
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    # Check if teacher teaches this course
    course = await courses.find_one({"_id": assignment.get("course_id")})
    if not course or course.get("teacher_id") != current_user.get("username"):
        raise HTTPException(status_code=403, detail="Not authorized for this course")
    
    # Prepare update data
    update_data = {}
    if assignment_update.title is not None:
        update_data["title"] = assignment_update.title
    if assignment_update.description is not None:
        update_data["description"] = assignment_update.description
    if assignment_update.due_date is not None:
        update_data["due_date"] = assignment_update.due_date
    if assignment_update.total_points is not None:
        update_data["total_points"] = assignment_update.total_points
    
    if update_data:
        update_data["updated_at"] = datetime.now()
        update_data["updated_by"] = current_user.get("username")
        await assignments.update_one(
            {"_id": assignment_id},
            {"$set": update_data}
        )
    
    return {"message": "Assignment updated successfully"}

# Delete an assignment
@router.delete("/{assignment_id}")
async def delete_assignment(
    assignment_id: str,
    current_user = Depends(get_current_user)
):
    if current_user.get("role") != UserRole.TEACHER:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get the assignment
    assignment = await assignments.find_one({"_id": assignment_id})
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    # Check if teacher teaches this course
    course = await courses.find_one({"_id": assignment.get("course_id")})
    if not course or course.get("teacher_id") != current_user.get("username"):
        raise HTTPException(status_code=403, detail="Not authorized for this course")
    
    # Delete the assignment
    await assignments.delete_one({"_id": assignment_id})
    return {"message": "Assignment deleted successfully"} 