import uuid
from decimal import Decimal
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.exceptions import EntityNotFoundException, PermissionDeniedException, BusinessLogicException
from app.models.offer import Offer
from app.models.listing import Listing
from app.models.user import User, Buyer
from app.models.transaction import Transaction
from app.models.notification import Notification
from app.schemas.offer import OfferCreate, OfferStatusUpdate


class OfferService:
    @staticmethod
    def create_offer(db: Session, user: User, req: OfferCreate) -> Offer:
        if user.role != "buyer" and user.role != "admin":
            raise PermissionDeniedException("Only verified buyers can submit offers.")

        listing = db.query(Listing).filter(Listing.id == req.listing_id).first()
        if not listing:
            raise EntityNotFoundException("Listing", req.listing_id)

        if listing.status != "ACTIVE":
            raise BusinessLogicException(f"Cannot make offer on a listing with status '{listing.status}'.")

        if req.offered_quantity > listing.quantity_available:
            raise BusinessLogicException(
                f"Offered quantity ({req.offered_quantity}) exceeds available quantity ({listing.quantity_available})."
            )

        if req.offered_quantity < listing.min_order_quantity:
            raise BusinessLogicException(
                f"Offered quantity ({req.offered_quantity}) is below minimum order quantity ({listing.min_order_quantity})."
            )

        if not user.buyer_profile:
            buyer = Buyer(user_id=user.id, company_name=f"{user.full_name}'s Enterprise")
            db.add(buyer)
            db.flush()
            buyer_id = buyer.id
        else:
            buyer_id = user.buyer_profile.id

        total_amount = Decimal(str(req.offered_quantity)) * req.offered_price_per_unit

        offer = Offer(
            listing_id=listing.id,
            buyer_id=buyer_id,
            offered_quantity=req.offered_quantity,
            offered_price_per_unit=req.offered_price_per_unit,
            total_amount=total_amount,
            proposed_delivery_date=req.proposed_delivery_date,
            notes=req.notes,
            status="PENDING"
        )
        db.add(offer)

        # Notify seller
        notification = Notification(
            user_id=listing.seller_id,
            title="New Offer Received",
            message=f"Buyer submitted an offer of ₹{req.offered_price_per_unit}/quintal for {req.offered_quantity} quintals on '{listing.title}'.",
            notification_type="OFFER_RECEIVED",
            reference_type="offer",
            reference_id=listing.id
        )
        db.add(notification)

        db.commit()
        db.refresh(offer)
        return offer

    @staticmethod
    def respond_to_offer(db: Session, user: User, offer_id: int, req: OfferStatusUpdate) -> Offer:
        offer = db.query(Offer).filter(Offer.id == offer_id).first()
        if not offer:
            raise EntityNotFoundException("Offer", offer_id)

        listing = db.query(Listing).filter(Listing.id == offer.listing_id).first()
        if not listing:
            raise EntityNotFoundException("Listing", offer.listing_id)

        # Verify seller ownership or admin
        if user.id != listing.seller_id and user.role != "admin":
            raise PermissionDeniedException("Only the listing seller can respond to this offer.")

        if offer.status in ["ACCEPTED", "REJECTED"]:
            raise BusinessLogicException(f"Offer is already marked as '{offer.status}'. Cannot modify.")

        buyer_user = offer.buyer.user

        if req.status == "ACCEPTED":
            offer.status = "ACCEPTED"
            if req.seller_notes:
                offer.seller_notes = req.seller_notes

            # Deduct quantity from listing
            listing.quantity_available = max(0.0, listing.quantity_available - offer.offered_quantity)
            if listing.quantity_available <= 0:
                listing.status = "CLOSED"

            # Create Transaction immediately
            txn_code = f"TXN-{uuid.uuid4().hex[:10].upper()}"
            transaction = Transaction(
                transaction_code=txn_code,
                offer_id=offer.id,
                listing_id=listing.id,
                buyer_id=buyer_user.id,
                seller_id=listing.seller_id,
                agreed_quantity=offer.offered_quantity,
                agreed_price_per_unit=offer.offered_price_per_unit,
                total_amount=offer.total_amount,
                payment_status="PENDING",
                fulfillment_status="ORDER_PLACED",
                delivery_address=buyer_user.buyer_profile.delivery_address if buyer_user.buyer_profile else None
            )
            db.add(transaction)

            # Notify buyer
            db.add(Notification(
                user_id=buyer_user.id,
                title="Offer Accepted!",
                message=f"Your offer for {offer.offered_quantity} quintals of '{listing.title}' was accepted! Transaction {txn_code} created.",
                notification_type="OFFER_ACCEPTED",
                reference_type="transaction",
                reference_id=offer.id
            ))

        elif req.status == "REJECTED":
            offer.status = "REJECTED"
            if req.seller_notes:
                offer.seller_notes = req.seller_notes

            # Notify buyer
            db.add(Notification(
                user_id=buyer_user.id,
                title="Offer Rejected",
                message=f"Your offer for '{listing.title}' was declined by the seller.",
                notification_type="OFFER_REJECTED",
                reference_type="offer",
                reference_id=offer.id
            ))

        elif req.status == "COUNTERED":
            if not req.counter_price_per_unit:
                raise BusinessLogicException("Counter price must be provided when countering an offer.")
            offer.status = "COUNTERED"
            offer.counter_price_per_unit = req.counter_price_per_unit
            offer.seller_notes = req.seller_notes

            db.add(Notification(
                user_id=buyer_user.id,
                title="Counter Offer Received",
                message=f"Seller proposed a counter price of ₹{req.counter_price_per_unit}/quintal on '{listing.title}'.",
                notification_type="OFFER_RECEIVED",
                reference_type="offer",
                reference_id=offer.id
            ))

        db.commit()
        db.refresh(offer)
        return offer
