from app.database import db
from app.models import Student, Course

# Student CRUD Operations
async def create_student(student: Student):
    result = await db["students"].insert_one(student.dict())
    return result.inserted_id

async def get_students():
    return await db["students"].find().to_list(100)

# Course CRUD Operations
async def create_course(course: Course):
    result = await db["courses"].insert_one(course.dict())
    return result.inserted_id

async def get_courses():
    return await db["courses"].find().to_list(100)
