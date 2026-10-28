from typing import Optional
from sqlalchemy.orm import Session
from app.core.security import get_password_hash, verify_password, create_access_token, create_refresh_token, decode_token
from app.core.exceptions import BusinessLogicException, EntityNotFoundException, DuplicateResourceException
from app.models.user import User, Farmer, Buyer, FPO
from app.schemas.auth import RegisterRequest, LoginRequest, Token


class AuthService:
    @staticmethod
    def register_user(db: Session, req: RegisterRequest) -> User:
        # Check if email or phone already exists
        existing_email = db.query(User).filter(User.email == req.email.lower()).first()
        if existing_email:
            raise DuplicateResourceException("User", "email", req.email)

        if req.phone:
            existing_phone = db.query(User).filter(User.phone == req.phone).first()
            if existing_phone:
                raise DuplicateResourceException("User", "phone", req.phone)

        # Create user
        user = User(
            email=req.email.lower(),
            phone=req.phone,
            hashed_password=get_password_hash(req.password),
            full_name=req.full_name,
            role=req.role,
            is_active=True,
            is_verified=(req.role == "admin")  # Admin is auto-verified in bootstrap
        )
        db.add(user)
        db.flush()

        # Create role-specific profile
        if req.role == "farmer":
            farmer_profile = Farmer(
                user_id=user.id,
                state=req.state,
                district=req.district,
                pincode=req.pincode
            )
            db.add(farmer_profile)
        elif req.role == "buyer":
            buyer_profile = Buyer(
                user_id=user.id,
                company_name=req.company_name or f"{req.full_name}'s Enterprise",
                state=req.state,
                district=req.district,
                pincode=req.pincode
            )
            db.add(buyer_profile)
        elif req.role == "fpo":
            reg_num = req.registration_number or f"FPO-{user.id:04d}-{req.district or 'REG'}"
            fpo_profile = FPO(
                user_id=user.id,
                fpo_name=req.fpo_name or f"{req.full_name} Farmer Producer Co.",
                registration_number=reg_num,
                operational_districts=req.district or "Regional",
                total_members=1
            )
            db.add(fpo_profile)

        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def authenticate_user(db: Session, req: LoginRequest) -> Token:
        user = db.query(User).filter(User.email == req.email.lower()).first()
        if not user:
            raise BusinessLogicException("Incorrect email or password.")
        
        if not verify_password(req.password, user.hashed_password):
            raise BusinessLogicException("Incorrect email or password.")

        if not user.is_active:
            raise BusinessLogicException("User account is inactive.")

        access_token = create_access_token(subject=user.id, role=user.role)
        refresh_token = create_refresh_token(subject=user.id)

        return Token(
            access_token=access_token,
            refresh_token=refresh_token,
            role=user.role,
            user_id=user.id,
            full_name=user.full_name,
            email=user.email
        )

    @staticmethod
    def refresh_access_token(db: Session, refresh_token: str) -> Token:
        payload = decode_token(refresh_token)
        if not payload or payload.get("type") != "refresh":
            raise BusinessLogicException("Invalid or expired refresh token.")

        user_id = payload.get("sub")
        user = db.query(User).filter(User.id == int(user_id)).first()
        if not user or not user.is_active:
            raise BusinessLogicException("User account inactive or not found.")

        new_access_token = create_access_token(subject=user.id, role=user.role)
        new_refresh_token = create_refresh_token(subject=user.id)

        return Token(
            access_token=new_access_token,
            refresh_token=new_refresh_token,
            role=user.role,
            user_id=user.id,
            full_name=user.full_name,
            email=user.email
        )
