from fastapi import APIRouter, HTTPException
from app.models import Student
from app.crud import create_student, get_students
from pydantic import BaseModel

router = APIRouter()

class SignupRequest(BaseModel):
    fullname: str
    email: str
    phone: str
    password: str

@router.post("/signup")
async def signup_student(request: SignupRequest):
    try:
        # Create student object
        student = Student(
            fullname=request.fullname,
            email=request.email,
            phone=request.phone,
            password=request.password  # Note: In production, you should hash the password
        )
        
        # Save to database
        student_id = await create_student(student)
        return {"success": True, "message": "Student registered successfully", "student_id": str(student_id)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/")
async def list_students():
    return await get_students()
