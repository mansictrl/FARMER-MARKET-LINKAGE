from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User, Farmer, Buyer, FPO
from app.schemas.user import UserResponse, UserUpdate

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/profile", response_model=UserResponse)
def get_profile(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/profile", response_model=UserResponse)
def update_profile(
    req: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if req.full_name is not None:
        current_user.full_name = req.full_name
    if req.phone is not None:
        current_user.phone = req.phone
    if req.profile_photo_url is not None:
        current_user.profile_photo_url = req.profile_photo_url

    if current_user.role == "farmer" and req.farmer_profile:
        fp = current_user.farmer_profile
        if not fp:
            fp = Farmer(user_id=current_user.id)
            db.add(fp)
        for field, val in req.farmer_profile.model_dump(exclude_unset=True).items():
            if field != "id":
                setattr(fp, field, val)

    elif current_user.role == "buyer" and req.buyer_profile:
        bp = current_user.buyer_profile
        if not bp:
            bp = Buyer(user_id=current_user.id, company_name=req.buyer_profile.company_name)
            db.add(bp)
        for field, val in req.buyer_profile.model_dump(exclude_unset=True).items():
            if field != "id":
                setattr(bp, field, val)

    elif current_user.role == "fpo" and req.fpo_profile:
        fpop = current_user.fpo_profile
        if not fpop:
            fpop = FPO(user_id=current_user.id, fpo_name=req.fpo_profile.fpo_name, registration_number=req.fpo_profile.registration_number)
            db.add(fpop)
        for field, val in req.fpo_profile.model_dump(exclude_unset=True).items():
            if field != "id":
                setattr(fpop, field, val)

    db.commit()
    db.refresh(current_user)
    return current_user
