from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from .auth import verify_passage_token
from .schemas import User
import logging

router = APIRouter(prefix="/auth", tags=["auth"])
security = HTTPBearer()

@router.get("/me", response_model=User)
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get the current authenticated user"""
    try:
        # Add debug logging
        logging.debug(f"Verifying token: {credentials.credentials[:20]}...")
        
        user_data = await verify_passage_token(credentials.credentials)
        
        # Log successful verification
        logging.info(f"Token verified successfully for user")
        
        return {
            "id": user_data["id"],
            "email": user_data.get("email")
        }
    except Exception as e:
        # Log the full error
        logging.error(f"Authentication failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=401,
            detail=f"Invalid authentication credentials: {str(e)}"
        )