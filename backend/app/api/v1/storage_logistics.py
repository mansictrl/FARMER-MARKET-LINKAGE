import os
import uuid
from typing import List, Optional
from decimal import Decimal
from fastapi import APIRouter, Depends, status, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.exceptions import EntityNotFoundException
from app.models.logistics import StorageFacility, LogisticsBooking
from app.models.user import User
from app.schemas.storage_logistics import (
    StorageFacilityResponse, StorageBookingRequest,
    LogisticsBookingRequest, LogisticsBookingResponse
)

router = APIRouter(tags=["Storage & Logistics"])


# Storage Facilities
@router.get("/storage/facilities", response_model=List[StorageFacilityResponse])
def get_storage_facilities(
    state: Optional[str] = None,
    facility_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Browses certified cold storages, silos, and WDRA accredited warehouses."""
    query = db.query(StorageFacility)
    if state:
        query = query.filter(StorageFacility.state.ilike(f"%{state}%"))
    if facility_type:
        query = query.filter(StorageFacility.facility_type.ilike(f"%{facility_type}%"))
    return query.order_by(StorageFacility.state, StorageFacility.name).all()


@router.post("/storage/facilities/{facility_id}/book")
def book_storage_space(
    facility_id: int,
    req: StorageBookingRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Reserves storage capacity at an accredited cold store or warehouse."""
    facility = db.query(StorageFacility).filter(StorageFacility.id == facility_id).first()
    if not facility:
        raise EntityNotFoundException("StorageFacility", facility_id)

    if req.quantity_quintals / 10.0 > facility.available_capacity_tonnes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Requested space ({req.quantity_quintals} Q / {req.quantity_quintals/10:.1f} Tonnes) exceeds available capacity ({facility.available_capacity_tonnes} Tonnes)."
        )

    facility.available_capacity_tonnes = max(0.0, facility.available_capacity_tonnes - (req.quantity_quintals / 10.0))
    monthly_rate = facility.rate_per_quintal_per_month * Decimal(str(req.quantity_quintals)) * Decimal(str(req.duration_months))
    receipt_code = f"WHR-{uuid.uuid4().hex[:8].upper()}"

    db.commit()
    return {
        "status": "CONFIRMED",
        "warehouse_receipt_code": receipt_code,
        "facility_name": facility.name,
        "quantity_quintals": req.quantity_quintals,
        "duration_months": req.duration_months,
        "estimated_storage_cost_inr": float(monthly_rate),
        "message": "Storage space reserved. Electronic warehouse receipt generated."
    }


# Logistics Bookings
@router.get("/logistics/bookings", response_model=List[LogisticsBookingResponse])
def get_logistics_bookings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Returns freight logistics bookings created by the authenticated user."""
    bookings = db.query(LogisticsBooking).filter(LogisticsBooking.user_id == current_user.id).order_by(desc(LogisticsBooking.created_at)).all()
    return bookings


@router.post("/logistics/book", response_model=LogisticsBookingResponse, status_code=status.HTTP_201_CREATED)
def book_logistics_transport(
    req: LogisticsBookingRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Books farm-to-mandi or farm-to-warehouse transport dispatch."""
    booking_code = f"LOG-{uuid.uuid4().hex[:8].upper()}"
    tracking_num = f"TRK-{uuid.uuid4().hex[:10].upper()}"

    booking = LogisticsBooking(
        booking_code=booking_code,
        transaction_id=req.transaction_id,
        user_id=current_user.id,
        provider_name="Kisan Logistics Dedicated Freight",
        vehicle_type=req.vehicle_type,
        origin_address=req.origin_address,
        destination_address=req.destination_address,
        distance_km=145.0,
        estimated_cost=Decimal("4500.00"),
        pickup_date=req.pickup_date,
        delivery_date=req.delivery_date,
        tracking_number=tracking_num,
        status="CONFIRMED"
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return booking


# File Download / Serve Endpoint
@router.get("/storage/files/{filename}")
def serve_file(filename: str):
    """Serves uploaded documents and image receipts safely."""
    clean_filename = os.path.basename(filename)
    filepath = os.path.join(settings.LOCAL_STORAGE_DIR, clean_filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(filepath)
