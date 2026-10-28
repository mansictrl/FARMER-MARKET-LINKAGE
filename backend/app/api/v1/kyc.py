from typing import List, Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_admin
from app.models.user import User
from app.schemas.kyc import KYCSubmitRequest, KYCReviewRequest, KYCVerificationResponse
from app.services.kyc_service import KYCService

router = APIRouter(prefix="/kyc", tags=["KYC Verification"])


@router.post("/submit", response_model=KYCVerificationResponse, status_code=status.HTTP_201_CREATED)
def submit_kyc(
    req: KYCSubmitRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Submits a KYC document (Aadhaar, PAN, Kisan Card, GSTIN) for admin review."""
    kyc = KYCService.submit_kyc(db, current_user, req)
    return KYCVerificationResponse(
        id=kyc.id,
        user_id=kyc.user_id,
        user_name=current_user.full_name,
        user_role=current_user.role,
        user_email=current_user.email,
        document_type=kyc.document_type,
        document_number=kyc.document_number,
        document_url=kyc.document_url,
        status=kyc.status,
        remarks=kyc.remarks,
        verified_by_id=kyc.verified_by_id,
        verified_at=kyc.verified_at,
        submitted_at=kyc.submitted_at
    )


@router.get("/my-status", response_model=List[KYCVerificationResponse])
def get_my_kyc(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Returns all submitted KYC documents and approval statuses for the current user."""
    return KYCService.get_user_kyc(db, current_user)


@router.get("/pending", response_model=List[KYCVerificationResponse])
def get_pending_kyc_for_admin(
    status_filter: Optional[str] = "PENDING",
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """Admin-only endpoint to view pending KYC verification queues."""
    return KYCService.get_all_kyc_for_admin(db, status_filter)


@router.put("/{kyc_id}/review", response_model=KYCVerificationResponse)
def review_kyc(
    kyc_id: int,
    req: KYCReviewRequest,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """Admin-only endpoint to approve or reject a KYC verification request."""
    kyc = KYCService.review_kyc(db, admin_user, kyc_id, req)
    return KYCVerificationResponse(
        id=kyc.id,
        user_id=kyc.user_id,
        user_name=kyc.user.full_name if kyc.user else "User",
        user_role=kyc.user.role if kyc.user else "farmer",
        user_email=kyc.user.email if kyc.user else "",
        document_type=kyc.document_type,
        document_number=kyc.document_number,
        document_url=kyc.document_url,
        status=kyc.status,
        remarks=kyc.remarks,
        verified_by_id=kyc.verified_by_id,
        verified_at=kyc.verified_at,
        submitted_at=kyc.submitted_at
    )
