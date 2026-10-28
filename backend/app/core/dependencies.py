from typing import List, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.core.security import decode_token
from app.core.exceptions import PermissionDeniedException

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login", auto_error=False)


def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    """Extracts and validates current authenticated user from Bearer JWT token."""
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token subject invalid.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Late import to prevent circular dependencies
    from app.models.user import User
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User associated with this token was not found."
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user account."
        )
    return user


def get_current_active_user(current_user = Depends(get_current_user)):
    return current_user


def get_current_user_optional(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    """Optional authentication: returns User if valid Bearer token provided, otherwise None."""
    if not token:
        return None
    try:
        payload = decode_token(token)
        if not payload or payload.get("type") != "access":
            return None
        user_id = payload.get("sub")
        if not user_id:
            return None
        from app.models.user import User
        return db.query(User).filter(User.id == int(user_id)).first()
    except Exception:
        return None


class RoleChecker:
    """Enforces role-based permissions strictly on the backend."""
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user = Depends(get_current_user)):
        if current_user.role not in self.allowed_roles and current_user.role != "admin":
            raise PermissionDeniedException(
                f"Role '{current_user.role}' is not authorized to access this resource. Required roles: {self.allowed_roles}"
            )
        return current_user


# Convenience shortcuts for role checking
require_farmer = RoleChecker(["farmer"])
require_buyer = RoleChecker(["buyer"])
require_fpo = RoleChecker(["fpo"])
require_admin = RoleChecker(["admin"])
require_farmer_or_fpo = RoleChecker(["farmer", "fpo"])
require_buyer_or_fpo = RoleChecker(["buyer", "fpo"])
require_any_authenticated = get_current_user
