import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

load_dotenv()  # Load environment variables from .env
MONGODB_URI = os.getenv("MONGODB_URI")
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM")
CORS_ORIGINS = os.getenv("CORS_ORIGINS")
ACCESS_TOKEN_EXPIRE_MINUTES = os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES")
REFRESH_TOKEN_EXPIRE_DAYS = os.getenv("REFRESH_TOKEN_EXPIRE_DAYS")

client = AsyncIOMotorClient(MONGODB_URI)
db = client["school_management"]  # Database name

# Collections
users = db["users"]
students = db["students"]
teachers = db["teachers"]
courses = db["courses"]
assignments = db["assignments"]
grades = db["grades"]
audit_logs = db["audit_logs"]

# Indexes
async def create_indexes():
    await users.create_index("email", unique=True)
    await users.create_index("username", unique=True)
    await courses.create_index("teacher_id")
    await assignments.create_index("course_id")
    await assignments.create_index("deadline")
    await grades.create_index([("student_id", 1), ("course_id", 1)])
    await audit_logs.create_index("timestamp")
