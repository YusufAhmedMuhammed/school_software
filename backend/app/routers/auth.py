from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordRequestForm, HTTPBearer
from datetime import timedelta
from app.models import User, UserRole
from app.auth import create_access_token, get_current_user
from app.database import users
from passlib.context import CryptContext
from typing import Dict, Any, Optional
from ..firebase.auth import FirebaseAuth
from ..utils.error_handlers import APIError
from ..firebase.firestore import db
from ..config import settings
from ..models.mock_data import get_mock_data
from pydantic import BaseModel

router = APIRouter(prefix="/auth", tags=["Authentication"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

class LoginRequest(BaseModel):
    username: str  # Can be email or username
    password: str
    role: Optional[str] = None  # Optional role check

class UserResponse(BaseModel):
    uid: str
    email: str
    username: str
    name: str
    role: str
    grade: Optional[str] = None
    subject: Optional[str] = None

@router.post("/register")
async def register(user: User):
    # Check if user already exists
    if await users.find_one({"$or": [{"email": user.email}, {"username": user.username}]}):
        raise HTTPException(status_code=400, detail="Email or username already registered")
    
    # Hash password
    hashed_password = pwd_context.hash(user.password)
    user_dict = user.dict()
    user_dict["password"] = hashed_password
    
    # Insert user
    result = await users.insert_one(user_dict)
    user_dict["id"] = str(result.inserted_id)
    
    return {"message": "User created successfully", "user": user_dict}

async def find_user_by_username_or_email(username: str) -> Optional[Dict[str, Any]]:
    """Find user by username or email"""
    users = await db.get_collection("users")
    for user in users:
        if user.get("username") == username or user.get("email") == username:
            return user
    return None

@router.post("/login", response_model=Dict[str, Any])
async def login(request: LoginRequest) -> Dict[str, Any]:
    """
    Login endpoint that verifies username/email and password
    """
    try:
        # Find user by username or email
        user = await find_user_by_username_or_email(request.username)
        
        if not user:
            raise APIError(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
                error_code="USER_NOT_FOUND"
            )
        
        # Verify password
        if not pwd_context.verify(request.password, user["password"]):
            raise APIError(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect password",
                error_code="INVALID_PASSWORD"
            )
    
        # Check role if specified
        if request.role and user["role"] != request.role:
            raise APIError(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"User is not a {request.role}",
                error_code="ROLE_MISMATCH"
            )
        
        # Remove password from response
        user_data = {k: v for k, v in user.items() if k != "password"}
        
        # Generate Firebase token (in production, you would use Firebase Admin SDK)
        if not settings.USE_MOCK_DATA:
            # Here you would generate a real Firebase token
            token = "mock-token"  # Replace with actual Firebase token generation
        else:
            token = "mock-token"
    
    return {
            "user": user_data,
            "token": token
        }
        
    except APIError:
        raise
    except Exception as e:
        raise APIError(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during login",
            error_code="LOGIN_ERROR"
        )

@router.get("/me", response_model=Dict[str, Any])
async def get_current_user(
    token: Dict = Depends(FirebaseAuth.verify_token)
) -> Dict[str, Any]:
    """
    Get current user data
    """
    user_data = await db.get_document("users", token["uid"])
    
    if not user_data:
        raise APIError(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
            error_code="USER_NOT_FOUND"
        )
    
    # Remove password from response
    user_data = {k: v for k, v in user_data.items() if k != "password"}
    return {"user": user_data}

@router.post("/logout")
async def logout(
    token: Dict = Depends(FirebaseAuth.verify_token)
) -> Dict[str, str]:
    """
    Logout endpoint
    """
    return {"message": "Successfully logged out"} 