from datetime import datetime, timezone
from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.exceptions import EntityNotFoundException, PermissionDeniedException, BusinessLogicException
from app.models.kyc import KYCVerification
from app.models.user import User
from app.models.notification import Notification
from app.schemas.kyc import KYCSubmitRequest, KYCReviewRequest, KYCVerificationResponse


class KYCService:
    @staticmethod
    def submit_kyc(db: Session, user: User, req: KYCSubmitRequest) -> KYCVerification:
        # Check if already pending or approved
        existing = db.query(KYCVerification).filter(
            KYCVerification.user_id == user.id,
            KYCVerification.document_type == req.document_type
        ).first()

        if existing and existing.status == "APPROVED":
            raise BusinessLogicException(f"KYC for {req.document_type} has already been approved.")

        if existing:
            existing.document_number = req.document_number
            existing.document_url = req.document_url
            existing.status = "PENDING"
            existing.submitted_at = datetime.now(timezone.utc)
            db.commit()
            db.refresh(existing)
            return existing

        kyc = KYCVerification(
            user_id=user.id,
            document_type=req.document_type,
            document_number=req.document_number,
            document_url=req.document_url,
            status="PENDING"
        )
        db.add(kyc)
        db.commit()
        db.refresh(kyc)
        return kyc

    @staticmethod
    def get_user_kyc(db: Session, user: User) -> List[KYCVerificationResponse]:
        records = db.query(KYCVerification).filter(KYCVerification.user_id == user.id).all()
        return [
            KYCVerificationResponse(
                id=r.id,
                user_id=r.user_id,
                user_name=user.full_name,
                user_role=user.role,
                user_email=user.email,
                document_type=r.document_type,
                document_number=r.document_number,
                document_url=r.document_url,
                status=r.status,
                remarks=r.remarks,
                verified_by_id=r.verified_by_id,
                verified_at=r.verified_at,
                submitted_at=r.submitted_at
            )
            for r in records
        ]

    @staticmethod
    def get_all_kyc_for_admin(db: Session, status_filter: str = None) -> List[KYCVerificationResponse]:
        query = db.query(KYCVerification)
        if status_filter:
            query = query.filter(KYCVerification.status == status_filter)
        records = query.order_by(desc(KYCVerification.submitted_at)).all()

        results = []
        for r in records:
            results.append(KYCVerificationResponse(
                id=r.id,
                user_id=r.user_id,
                user_name=r.user.full_name if r.user else "User",
                user_role=r.user.role if r.user else "farmer",
                user_email=r.user.email if r.user else "",
                document_type=r.document_type,
                document_number=r.document_number,
                document_url=r.document_url,
                status=r.status,
                remarks=r.remarks,
                verified_by_id=r.verified_by_id,
                verified_at=r.verified_at,
                submitted_at=r.submitted_at
            ))
        return results

    @staticmethod
    def review_kyc(db: Session, admin_user: User, kyc_id: int, req: KYCReviewRequest) -> KYCVerification:
        if admin_user.role != "admin":
            raise PermissionDeniedException("Only platform administrators can review KYC documents.")

        kyc = db.query(KYCVerification).filter(KYCVerification.id == kyc_id).first()
        if not kyc:
            raise EntityNotFoundException("KYCVerification", kyc_id)

        kyc.status = req.status
        kyc.remarks = req.remarks
        kyc.verified_by_id = admin_user.id
        kyc.verified_at = datetime.now(timezone.utc)

        target_user = kyc.user
        if req.status == "APPROVED":
            target_user.is_verified = True
            db.add(Notification(
                user_id=target_user.id,
                title="KYC Verification Approved",
                message=f"Your submitted {kyc.document_type} verification document has been approved by the admin.",
                notification_type="KYC_APPROVED",
                reference_type="kyc",
                reference_id=kyc.id
            ))
        elif req.status == "REJECTED":
            db.add(Notification(
                user_id=target_user.id,
                title="KYC Verification Declined",
                message=f"Your {kyc.document_type} document was declined. Reason: {req.remarks or 'Please re-upload a clear copy.'}",
                notification_type="KYC_REJECTED",
                reference_type="kyc",
                reference_id=kyc.id
            ))

        db.commit()
        db.refresh(kyc)
        return kyc
