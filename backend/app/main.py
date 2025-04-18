from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, students, teachers, admin, courses, assignments
from app.database import create_indexes
import asyncio

app = FastAPI(title="School Management System")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(students.router, prefix="/students", tags=["Students"])
app.include_router(teachers.router, prefix="/teachers", tags=["Teachers"])
app.include_router(admin.router, prefix="/admin", tags=["Admin"])
app.include_router(courses.router, prefix="/courses", tags=["Courses"])
app.include_router(assignments.router, prefix="/assignments", tags=["Assignments"])

@app.on_event("startup")
async def startup_event():
    await create_indexes()

@app.get("/")
async def root():
    return {"message": "Welcome to the School Management System"}
