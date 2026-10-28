from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.auth import RegisterRequest, LoginRequest, RefreshTokenRequest, Token
from app.schemas.user import UserResponse
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    """Registers a new user account (farmer, buyer, fpo, admin)."""
    user = AuthService.register_user(db, req)
    return user


@router.post("/login", response_model=Token)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    """Authenticates user credentials and returns JWT access and refresh tokens."""
    token_data = AuthService.authenticate_user(db, req)
    return token_data


@router.post("/refresh", response_model=Token)
def refresh_token(req: RefreshTokenRequest, db: Session = Depends(get_db)):
    """Generates a refreshed access token using a valid refresh token."""
    return AuthService.refresh_access_token(db, req.refresh_token)


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Returns the authenticated user's profile and role-specific details."""
    return current_user
