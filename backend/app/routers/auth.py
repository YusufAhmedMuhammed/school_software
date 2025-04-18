from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta
from app.models import User, UserRole
from app.auth import create_access_token, get_current_user
from app.database import users
from passlib.context import CryptContext

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

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

@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    # Find user
    user = await users.find_one({"username": form_data.username})
    if not user or not pwd_context.verify(form_data.password, user["password"]):
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    
    # Create access token
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": user["username"], "role": user["role"]},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user["role"]
    }

@router.get("/me")
async def read_users_me(current_user = Depends(get_current_user)):
    return current_user 