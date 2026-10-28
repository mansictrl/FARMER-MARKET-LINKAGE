from sqlalchemy import Column, Integer, String, Text, Numeric, Float, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base
from app.models.base import TimestampMixin


class Transaction(Base, TimestampMixin):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    transaction_code = Column(String(100), unique=True, index=True, nullable=False)
    offer_id = Column(Integer, ForeignKey("offers.id", ondelete="RESTRICT"), unique=True, nullable=False)
    listing_id = Column(Integer, ForeignKey("listings.id", ondelete="RESTRICT"), nullable=False, index=True)
    buyer_id = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    seller_id = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    
    agreed_quantity = Column(Float, nullable=False)
    agreed_price_per_unit = Column(Numeric(12, 2), nullable=False)
    total_amount = Column(Numeric(14, 2), nullable=False)
    
    payment_status = Column(String(50), default="PENDING", index=True, nullable=False)  # 'PENDING', 'ESCROW_FUNDED', 'RELEASED', 'REFUNDED'
    fulfillment_status = Column(String(50), default="ORDER_PLACED", index=True, nullable=False)  # 'ORDER_PLACED', 'PACKED', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED', 'DISPUTED'
    
    delivery_address = Column(Text, nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    offer = relationship("Offer", back_populates="transaction")
    listing = relationship("Listing")
    buyer = relationship("User", foreign_keys=[buyer_id])
    seller = relationship("User", foreign_keys=[seller_id])
    payments = relationship("Payment", back_populates="transaction", cascade="all, delete-orphan")
    logistics_bookings = relationship("LogisticsBooking", back_populates="transaction", cascade="all, delete-orphan")
    disputes = relationship("Dispute", back_populates="transaction", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="transaction", cascade="all, delete-orphan")


class Payment(Base, TimestampMixin):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    payment_code = Column(String(100), unique=True, index=True, nullable=False)
    transaction_id = Column(Integer, ForeignKey("transactions.id", ondelete="CASCADE"), nullable=False, index=True)
    amount = Column(Numeric(14, 2), nullable=False)
    currency = Column(String(10), default="INR", nullable=False)
    
    payment_gateway_order_id = Column(String(150), nullable=True, index=True)
    payment_gateway_payment_id = Column(String(150), nullable=True, index=True)
    gateway_signature = Column(String(255), nullable=True)
    payment_method = Column(String(50), default="RAZORPAY_TEST", nullable=False)  # 'RAZORPAY', 'ESCROW_NETBANKING', 'UPI', 'NEFT'
    
    status = Column(String(50), default="PENDING", index=True, nullable=False)  # 'PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'
    paid_at = Column(DateTime(timezone=True), nullable=True)
    gateway_response = Column(JSON, nullable=True)

    transaction = relationship("Transaction", back_populates="payments")


class PaymentGateway(Base, TimestampMixin):
    __tablename__ = "payment_gateways"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)  # 'Razorpay', 'Stripe', 'BankEscrow'
    is_active = Column(String(50), default="ACTIVE", nullable=False)
    is_test_mode = Column(String(50), default="YES", nullable=False)
    config_metadata = Column(JSON, nullable=True)


class Dispute(Base, TimestampMixin):
    __tablename__ = "disputes"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id", ondelete="CASCADE"), nullable=False, index=True)
    raised_by_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    dispute_reason = Column(String(255), nullable=False)  # 'QUALITY_MISMATCH', 'QUANTITY_SHORTAGE', 'TRANSIT_DAMAGE', 'NON_DELIVERY'
    description = Column(Text, nullable=False)
    evidence_urls = Column(JSON, nullable=True)  # List of URLs
    
    resolution_status = Column(String(50), default="OPEN", index=True, nullable=False)  # 'OPEN', 'UNDER_INVESTIGATION', 'RESOLVED', 'DISMISSED'
    resolution_notes = Column(Text, nullable=True)
    resolved_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)

    transaction = relationship("Transaction", back_populates="disputes")
    raised_by = relationship("User", foreign_keys=[raised_by_id])
    resolved_by = relationship("User", foreign_keys=[resolved_by_id])


class Review(Base, TimestampMixin):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id", ondelete="CASCADE"), nullable=False, index=True)
    reviewer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    reviewee_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    rating = Column(Integer, nullable=False)  # 1 to 5 stars
    comment = Column(Text, nullable=True)

    transaction = relationship("Transaction", back_populates="reviews")
    reviewer = relationship("User", foreign_keys=[reviewer_id])
    reviewee = relationship("User", foreign_keys=[reviewee_id])
