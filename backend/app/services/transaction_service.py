import uuid
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_

from app.core.exceptions import EntityNotFoundException, PermissionDeniedException, BusinessLogicException
from app.models.transaction import Transaction, Payment, Dispute, Review
from app.models.notification import Notification
from app.models.user import User
from app.integrations.payment_gateway import RazorpayAdapter
from app.schemas.transaction import PaymentCreate, PaymentVerifyRequest, DisputeCreate, DisputeResolveRequest, ReviewCreate


class TransactionService:
    @staticmethod
    def get_user_transactions(db: Session, user: User) -> List[Transaction]:
        if user.role == "admin":
            return db.query(Transaction).order_by(desc(Transaction.created_at)).all()
        return db.query(Transaction).filter(
            or_(Transaction.buyer_id == user.id, Transaction.seller_id == user.id)
        ).order_by(desc(Transaction.created_at)).all()

    @staticmethod
    def get_transaction_by_id(db: Session, user: User, txn_id: int) -> Transaction:
        txn = db.query(Transaction).filter(Transaction.id == txn_id).first()
        if not txn:
            raise EntityNotFoundException("Transaction", txn_id)
        if user.role != "admin" and user.id not in [txn.buyer_id, txn.seller_id]:
            raise PermissionDeniedException("Not authorized to view this transaction.")
        return txn

    @staticmethod
    def initiate_payment(db: Session, user: User, req: PaymentCreate) -> Payment:
        txn = db.query(Transaction).filter(Transaction.id == req.transaction_id).first()
        if not txn:
            raise EntityNotFoundException("Transaction", req.transaction_id)

        if user.id != txn.buyer_id and user.role != "admin":
            raise PermissionDeniedException("Only the buyer can initiate payment for this deal.")

        if txn.payment_status in ["ESCROW_FUNDED", "RELEASED"]:
            raise BusinessLogicException("Payment has already been funded into escrow.")

        gateway = RazorpayAdapter()
        order_meta = gateway.create_order(amount=txn.total_amount, currency="INR", receipt=txn.transaction_code)

        payment_code = f"PAY-{uuid.uuid4().hex[:10].upper()}"
        payment = Payment(
            payment_code=payment_code,
            transaction_id=txn.id,
            amount=txn.total_amount,
            currency="INR",
            payment_gateway_order_id=order_meta.get("order_id"),
            payment_method=req.payment_method,
            status="PENDING",
            gateway_response=order_meta
        )
        db.add(payment)
        db.commit()
        db.refresh(payment)
        return payment

    @staticmethod
    def verify_payment(db: Session, user: User, req: PaymentVerifyRequest) -> Payment:
        payment = db.query(Payment).filter(Payment.id == req.payment_id).first()
        if not payment:
            raise EntityNotFoundException("Payment", req.payment_id)

        txn = payment.transaction
        if user.id != txn.buyer_id and user.role != "admin":
            raise PermissionDeniedException("Only the buyer can complete payment verification.")

        gateway = RazorpayAdapter()
        verified = gateway.verify_payment_signature(
            order_id=req.razorpay_order_id,
            payment_id=req.razorpay_payment_id,
            signature=req.razorpay_signature
        )

        if not verified:
            payment.status = "FAILED"
            db.commit()
            raise BusinessLogicException("Cryptographic payment signature verification failed.")

        # Payment verified successfully - lock into Escrow
        payment.status = "SUCCESS"
        payment.payment_gateway_payment_id = req.razorpay_payment_id
        payment.gateway_signature = req.razorpay_signature
        payment.paid_at = datetime.now(timezone.utc)

        txn.payment_status = "ESCROW_FUNDED"

        # Notify Seller that escrow is secured
        db.add(Notification(
            user_id=txn.seller_id,
            title="Escrow Payment Secured",
            message=f"Buyer has successfully deposited ₹{txn.total_amount} into platform escrow for Transaction {txn.transaction_code}. Please dispatch produce.",
            notification_type="PAYMENT_RECEIVED",
            reference_type="transaction",
            reference_id=txn.id
        ))

        db.commit()
        db.refresh(payment)
        return payment

    @staticmethod
    def update_fulfillment_status(db: Session, user: User, txn_id: int, new_status: str) -> Transaction:
        txn = db.query(Transaction).filter(Transaction.id == txn_id).first()
        if not txn:
            raise EntityNotFoundException("Transaction", txn_id)

        if user.role != "admin" and user.id not in [txn.buyer_id, txn.seller_id]:
            raise PermissionDeniedException("Not authorized to update fulfillment status.")

        # State transition validation
        valid_transitions = {
            "ORDER_PLACED": ["PACKED", "IN_TRANSIT", "CANCELLED"],
            "PACKED": ["IN_TRANSIT", "CANCELLED"],
            "IN_TRANSIT": ["DELIVERED", "DISPUTED"],
            "DELIVERED": ["COMPLETED", "DISPUTED"],
            "COMPLETED": [],
            "DISPUTED": ["RESOLVED", "DELIVERED"]
        }

        if new_status not in valid_transitions.get(txn.fulfillment_status, []):
            raise BusinessLogicException(f"Cannot transition from '{txn.fulfillment_status}' to '{new_status}'.")

        txn.fulfillment_status = new_status
        if new_status == "COMPLETED":
            txn.completed_at = datetime.now(timezone.utc)
            # Release escrow payment to seller
            txn.payment_status = "RELEASED"
            db.add(Notification(
                user_id=txn.seller_id,
                title="Payment Released to Account",
                message=f"₹{txn.total_amount} platform escrow funds for transaction {txn.transaction_code} have been released to your registered bank account.",
                notification_type="PAYMENT_RECEIVED",
                reference_type="transaction",
                reference_id=txn.id
            ))
        elif new_status == "DELIVERED":
            db.add(Notification(
                user_id=txn.buyer_id,
                title="Shipment Delivered",
                message=f"Consignment for Transaction {txn.transaction_code} has arrived at destination.",
                notification_type="DELIVERY_UPDATE",
                reference_type="transaction",
                reference_id=txn.id
            ))

        db.commit()
        db.refresh(txn)
        return txn

    @staticmethod
    def raise_dispute(db: Session, user: User, req: DisputeCreate) -> Dispute:
        txn = db.query(Transaction).filter(Transaction.id == req.transaction_id).first()
        if not txn:
            raise EntityNotFoundException("Transaction", req.transaction_id)

        if user.id not in [txn.buyer_id, txn.seller_id] and user.role != "admin":
            raise PermissionDeniedException("Only parties to this transaction can file a dispute.")

        dispute = Dispute(
            transaction_id=txn.id,
            raised_by_id=user.id,
            dispute_reason=req.dispute_reason,
            description=req.description,
            evidence_urls=req.evidence_urls,
            resolution_status="OPEN"
        )
        txn.fulfillment_status = "DISPUTED"
        db.add(dispute)
        db.commit()
        db.refresh(dispute)
        return dispute

    @staticmethod
    def resolve_dispute(db: Session, admin_user: User, dispute_id: int, req: DisputeResolveRequest) -> Dispute:
        if admin_user.role != "admin":
            raise PermissionDeniedException("Only platform administrators can resolve disputes.")

        dispute = db.query(Dispute).filter(Dispute.id == dispute_id).first()
        if not dispute:
            raise EntityNotFoundException("Dispute", dispute_id)

        dispute.resolution_status = req.resolution_status
        dispute.resolution_notes = req.resolution_notes
        dispute.resolved_by_id = admin_user.id
        dispute.resolved_at = datetime.now(timezone.utc)

        if req.resolution_status == "RESOLVED":
            dispute.transaction.fulfillment_status = "COMPLETED"
        elif req.resolution_status == "DISMISSED":
            dispute.transaction.fulfillment_status = "DELIVERED"

        db.commit()
        db.refresh(dispute)
        return dispute

    @staticmethod
    def add_review(db: Session, user: User, req: ReviewCreate) -> Review:
        txn = db.query(Transaction).filter(Transaction.id == req.transaction_id).first()
        if not txn:
            raise EntityNotFoundException("Transaction", req.transaction_id)

        if user.id not in [txn.buyer_id, txn.seller_id]:
            raise PermissionDeniedException("Only transaction participants can leave a review.")

        target_reviewee_id = txn.seller_id if user.id == txn.buyer_id else txn.buyer_id

        review = Review(
            transaction_id=txn.id,
            reviewer_id=user.id,
            reviewee_id=target_reviewee_id,
            rating=req.rating,
            comment=req.comment
        )
        db.add(review)
        db.commit()
        db.refresh(review)
        return review
