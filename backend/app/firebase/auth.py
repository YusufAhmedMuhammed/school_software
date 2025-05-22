from firebase_admin import auth, credentials, initialize_app
from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional, Dict
import os
from ..config import settings

# Initialize Firebase Admin SDK
cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH) if settings.FIREBASE_CREDENTIALS_PATH else None
firebase_app = initialize_app(cred) if cred else None

security = HTTPBearer()

class FirebaseAuth:
    @staticmethod
    async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict:
        """
        Verify the Firebase ID token and return the decoded token
        """
        if settings.USE_MOCK_DATA:
            # Return mock user data for testing
            return {
                "uid": "mock-user-id",
                "email": "test@example.com",
                "role": "student"
            }
            
        try:
            token = credentials.credentials
            decoded_token = auth.verify_id_token(token)
            return decoded_token
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )

    @staticmethod
    def get_user_role(decoded_token: Dict) -> str:
        """
        Extract user role from custom claims or default to 'student'
        """
        if settings.USE_MOCK_DATA:
            return decoded_token.get("role", "student")
            
        try:
            user = auth.get_user(decoded_token["uid"])
            return user.custom_claims.get("role", "student")
        except Exception:
            return "student"

    @staticmethod
    async def require_role(required_role: str, token: Dict = Depends(verify_token)) -> Dict:
        """
        Check if user has required role
        """
        user_role = FirebaseAuth.get_user_role(token)
        if user_role != required_role and user_role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return token

# Role-specific dependencies
async def require_student(token: Dict = Depends(FirebaseAuth.verify_token)) -> Dict:
    return await FirebaseAuth.require_role("student", token)

async def require_teacher(token: Dict = Depends(FirebaseAuth.verify_token)) -> Dict:
    return await FirebaseAuth.require_role("teacher", token)

async def require_admin(token: Dict = Depends(FirebaseAuth.verify_token)) -> Dict:
    return await FirebaseAuth.require_role("admin", token) 