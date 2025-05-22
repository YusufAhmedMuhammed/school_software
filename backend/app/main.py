from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .routers import auth, students, teachers, courses, attendance
from .utils.error_handlers import setup_exception_handlers

app = FastAPI(
    title=settings.APP_NAME,
    debug=settings.DEBUG
)

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Setup exception handlers
setup_exception_handlers(app)

# Include routers
app.include_router(auth.router, prefix=settings.API_V1_STR, tags=["Authentication"])
app.include_router(students.router, prefix=settings.API_V1_STR, tags=["Students"])
app.include_router(teachers.router, prefix=settings.API_V1_STR, tags=["Teachers"])
app.include_router(courses.router, prefix=settings.API_V1_STR, tags=["Courses"])
app.include_router(attendance.router, prefix=settings.API_V1_STR, tags=["Attendance"])

@app.get("/")
async def root():
    """Root endpoint - API health check"""
    return {
        "status": "healthy",
        "version": "1.0.0",
        "environment": "development" if settings.DEBUG else "production",
        "mock_data_enabled": settings.USE_MOCK_DATA
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )
