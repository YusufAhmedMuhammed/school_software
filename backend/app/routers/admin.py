from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict
from datetime import datetime
from ..database import db
from ..auth import get_current_admin_user
from ..models.user import User
from ..models.course import Course
from ..models.teacher import Teacher
from ..models.student import Student

router = APIRouter()

@router.get("/statistics")
async def get_statistics(current_user: User = Depends(get_current_admin_user)):
    """Get system statistics"""
    try:
        total_students = await db.students.count_documents({})
        total_teachers = await db.teachers.count_documents({})
        total_courses = await db.courses.count_documents({})
        active_users = await db.users.count_documents({"is_active": True})
        
        return {
            "totalStudents": total_students,
            "totalTeachers": total_teachers,
            "totalCourses": total_courses,
            "activeUsers": active_users
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/activities")
async def get_recent_activities(current_user: User = Depends(get_current_admin_user)):
    """Get recent system activities"""
    try:
        activities = await db.audit_logs.find().sort("timestamp", -1).limit(10).to_list(length=10)
        return activities
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/system-status")
async def get_system_status(current_user: User = Depends(get_current_admin_user)):
    """Get system status information"""
    try:
        # Check database connection
        db_status = True
        try:
            await db.command("ping")
        except Exception:
            db_status = False
        
        # Check storage (you can add more specific checks here)
        storage_status = True
        
        return {
            "database": db_status,
            "api": True,  # If we're here, the API is working
            "storage": storage_status,
            "timestamp": datetime.utcnow()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/users")
async def get_users(current_user: User = Depends(get_current_admin_user)):
    """Get all users"""
    try:
        users = await db.users.find().to_list(length=None)
        return users
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/teachers")
async def get_teachers(current_user: User = Depends(get_current_admin_user)):
    """Get all teachers"""
    try:
        teachers = await db.teachers.find().to_list(length=None)
        return teachers
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/students")
async def get_students(current_user: User = Depends(get_current_admin_user)):
    """Get all students"""
    try:
        students = await db.students.find().to_list(length=None)
        return students
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/courses")
async def get_courses(current_user: User = Depends(get_current_admin_user)):
    """Get all courses"""
    try:
        courses = await db.courses.find().to_list(length=None)
        return courses
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/users/{user_id}/deactivate")
async def deactivate_user(user_id: str, current_user: User = Depends(get_current_admin_user)):
    """Deactivate a user"""
    try:
        result = await db.users.update_one(
            {"_id": user_id},
            {"$set": {"is_active": False}}
        )
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
        return {"message": "User deactivated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/users/{user_id}/activate")
async def activate_user(user_id: str, current_user: User = Depends(get_current_admin_user)):
    """Activate a user"""
    try:
        result = await db.users.update_one(
            {"_id": user_id},
            {"$set": {"is_active": True}}
        )
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
        return {"message": "User activated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 