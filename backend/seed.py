import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import random
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models.user import User, Farmer, Buyer, FPO, FPOMembership
from app.models.kyc import KYCVerification
from app.models.commodity import Commodity, QualityGrade
from app.models.market import Market, MarketPrice, ArrivalVolume
from app.models.lot import Lot, Inspection
from app.models.listing import Listing, BuyerRequirement
from app.models.offer import Offer
from app.models.transaction import Transaction, Payment, Review
from app.models.logistics import StorageFacility, LogisticsBooking
from app.models.notification import Notification

print("Bootstrapping database schema and seeding demonstration data...")
Base.metadata.create_all(bind=engine)
db = SessionLocal()


def seed():
    # 1. Clean existing test tables if desired or check if already seeded
    existing_admin = db.query(User).filter(User.email == "admin@agrimarket.gov.in").first()
    if existing_admin:
        print("Database already contains seed accounts. Skipping bootstrap.")
        db.close()
        return

    print("Creating core Commodities & Quality Grades...")
    commodities_data = [
        {"name": "Onion", "code": "ONION", "category": "Vegetable", "unit": "Quintal", "msp": None, "shelf": 45, "img": "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600"},
        {"name": "Wheat", "code": "WHEAT", "category": "Cereal", "unit": "Quintal", "msp": Decimal("2275.00"), "shelf": 365, "img": "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600"},
        {"name": "Soybean", "code": "SOYBEAN", "category": "Oilseed", "unit": "Quintal", "msp": Decimal("4600.00"), "shelf": 180, "img": "https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=600"},
        {"name": "Basmati Rice", "code": "RICE_BAS", "category": "Cereal", "unit": "Quintal", "msp": Decimal("3800.00"), "shelf": 365, "img": "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600"},
        {"name": "Cotton", "code": "COTTON", "category": "Fiber", "unit": "Quintal", "msp": Decimal("7122.00"), "shelf": 240, "img": "https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=600"},
        {"name": "Red Chilli", "code": "CHILLI", "category": "Spice", "unit": "Quintal", "msp": None, "shelf": 180, "img": "https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=600"},
        {"name": "Tomato", "code": "TOMATO", "category": "Vegetable", "unit": "Quintal", "msp": None, "shelf": 14, "img": "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600"},
        {"name": "Turmeric", "code": "TURMERIC", "category": "Spice", "unit": "Quintal", "msp": None, "shelf": 365, "img": "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600"},
    ]

    comm_objs = {}
    for c_info in commodities_data:
        comm = Commodity(
            name=c_info["name"],
            code=c_info["code"],
            category=c_info["category"],
            standard_unit=c_info["unit"],
            min_support_price=c_info["msp"],
            shelf_life_days=c_info["shelf"],
            image_url=c_info["img"],
            description=f"High quality farm harvest of {c_info['name']}."
        )
        db.add(comm)
        db.flush()
        comm_objs[c_info["code"]] = comm

        # Add Quality Grades
        db.add(QualityGrade(commodity_id=comm.id, grade_name="Grade A (Premium)", moisture_max_percentage=10.0, foreign_matter_max_pct=0.5, broken_grains_max_pct=1.0, specifications="Highest grade, dry, clean, uniform size"))
        db.add(QualityGrade(commodity_id=comm.id, grade_name="Grade B (Standard)", moisture_max_percentage=12.0, foreign_matter_max_pct=1.5, broken_grains_max_pct=3.0, specifications="Commercial standard market grade"))
        db.add(QualityGrade(commodity_id=comm.id, grade_name="FAQ (Fair Average Quality)", moisture_max_percentage=14.0, foreign_matter_max_pct=2.5, broken_grains_max_pct=5.0, specifications="Average harvest lot without sorting"))

    print("Creating verified APMC Mandis across India...")
    markets_data = [
        {"name": "Lasalgaon APMC", "code": "MH_LASAL", "state": "Maharashtra", "district": "Nashik", "lat": 20.147, "lng": 74.225, "address": "Lasalgaon APMC Yard, Niphad Road, Nashik, Maharashtra"},
        {"name": "Vashi APMC Market", "code": "MH_VASHI", "state": "Maharashtra", "district": "Navi Mumbai", "lat": 19.076, "lng": 72.998, "address": "Turbhe APMC Complex, Navi Mumbai, Maharashtra"},
        {"name": "Azadpur Mandi", "code": "DL_AZAD", "state": "Delhi", "district": "North Delhi", "lat": 28.711, "lng": 77.174, "address": "Azadpur APMC Fruit & Veg Yard, New Delhi"},
        {"name": "Indore Mandi", "code": "MP_INDORE", "state": "Madhya Pradesh", "district": "Indore", "lat": 22.719, "lng": 75.857, "address": "Laxmibai Nagar Mandi Yard, Indore, Madhya Pradesh"},
        {"name": "Guntur Mirchi Yard", "code": "AP_GUNTUR", "state": "Andhra Pradesh", "district": "Guntur", "lat": 16.306, "lng": 80.436, "address": "Agricultural Market Committee Yard, Guntur, AP"},
        {"name": "Rajkot APMC", "code": "GJ_RAJKOT", "state": "Gujarat", "district": "Rajkot", "lat": 22.303, "lng": 70.802, "address": "Bedi APMC Yard, Rajkot, Gujarat"},
        {"name": "Khanna Grain Mandi", "code": "PB_KHANNA", "state": "Punjab", "district": "Ludhiana", "lat": 30.707, "lng": 76.216, "address": "GT Road Grain Market, Khanna, Punjab"},
    ]

    mkt_objs = []
    for m in markets_data:
        mkt = Market(
            name=m["name"],
            code=m["code"],
            state=m["state"],
            district=m["district"],
            is_apmc=True,
            latitude=m["lat"],
            longitude=m["lng"],
            address=m["address"],
            contact_details="helpdesk@apmc.gov.in"
        )
        db.add(mkt)
        db.flush()
        mkt_objs.append(mkt)

    print("Generating 30-day historical Mandi prices & arrival trends...")
    base_prices = {
        "ONION": 2300,
        "WHEAT": 2550,
        "SOYBEAN": 4650,
        "RICE_BAS": 4150,
        "COTTON": 7100,
        "CHILLI": 18200,
        "TOMATO": 1400,
        "TURMERIC": 13500
    }

    for comm_code, base_p in base_prices.items():
        comm = comm_objs[comm_code]
        for mkt in mkt_objs:
            # Generate 30 daily price records
            for d in range(30, -1, -1):
                p_date = date.today() - timedelta(days=d)
                mandi_offset = (hash(mkt.name) % 250) - 100
                daily_fluct = random.randint(-80, 85)
                modal = max(500, base_p + mandi_offset + daily_fluct)
                min_p = int(modal * 0.92)
                max_p = int(modal * 1.08)
                arrivals = random.randint(120, 1800)

                mp = MarketPrice(
                    commodity_id=comm.id,
                    market_id=mkt.id,
                    price_date=p_date,
                    min_price=Decimal(str(min_p)),
                    max_price=Decimal(str(max_p)),
                    modal_price=Decimal(str(modal)),
                    arrival_volume=float(arrivals),
                    unit="Rs/Quintal",
                    source="Agmarknet Mandi Board Verified"
                )
                db.add(mp)

    print("Creating Certified Cold Storages and Warehouses...")
    storages = [
        StorageFacility(
            name="Sahyadri Agri Cold Chain Logistics",
            facility_type="Cold Storage",
            capacity_metric_tonnes=5000.0,
            available_capacity_tonnes=2300.0,
            rate_per_quintal_per_month=Decimal("45.00"),
            address="Plot 14, MIDC Dindori, Nashik",
            district="Nashik",
            state="Maharashtra",
            pincode="422206",
            contact_number="+91 253 2304910",
            is_wdra_accredited=True,
            features="Ammonia chillers, Pre-cooling chambers, 24/7 CCTV, NABL lab"
        ),
        StorageFacility(
            name="CWC Central Dry Warehouse Hub",
            facility_type="Dry Warehouse",
            capacity_metric_tonnes=15000.0,
            available_capacity_tonnes=8500.0,
            rate_per_quintal_per_month=Decimal("22.00"),
            address="APMC Yard Sector 19, Vashi, Navi Mumbai",
            district="Navi Mumbai",
            state="Maharashtra",
            pincode="400703",
            contact_number="+91 22 27889100",
            is_wdra_accredited=True,
            features="Pest proof, Electronic weighbridge, Insurance covered, Fumigated"
        ),
        StorageFacility(
            name="NBHC Modern Steel Grain Silos",
            facility_type="Grain Silo",
            capacity_metric_tonnes=25000.0,
            available_capacity_tonnes=11200.0,
            rate_per_quintal_per_month=Decimal("28.00"),
            address="Laxmibai Nagar Industrial Area, Indore",
            district="Indore",
            state="Madhya Pradesh",
            pincode="452006",
            contact_number="+91 731 2456789",
            is_wdra_accredited=True,
            features="Aeration system, Temperature sensors, Moisture monitoring"
        )
    ]
    for s in storages:
        db.add(s)

    print("Creating core Demonstration Users (Admin, Farmer, Buyer, FPO)...")
    admin = User(
        email="admin@agrimarket.gov.in",
        phone="9820000001",
        hashed_password=get_password_hash("Admin@123"),
        full_name="Rajesh Verma (Admin)",
        role="admin",
        is_active=True,
        is_verified=True
    )
    db.add(admin)

    farmer1 = User(
        email="ramesh.farmer@agrimarket.in",
        phone="9820000002",
        hashed_password=get_password_hash("Farmer@123"),
        full_name="Ramesh Patil",
        role="farmer",
        is_active=True,
        is_verified=True
    )
    db.add(farmer1)
    db.flush()

    farmer1_profile = Farmer(
        user_id=farmer1.id,
        land_area_acres=12.5,
        farm_location="Village Pimpalgaon, Niphad",
        primary_commodities="Onion, Wheat, Tomato",
        state="Maharashtra",
        district="Nashik",
        pincode="422209",
        kisan_credit_card_no="KCC-MH-9021-44",
        bank_account_no="30291049281",
        ifsc_code="SBIN0004921"
    )
    db.add(farmer1_profile)

    farmer2 = User(
        email="suresh.patel@agrimarket.in",
        phone="9820000003",
        hashed_password=get_password_hash("Farmer@123"),
        full_name="Suresh Patel",
        role="farmer",
        is_active=True,
        is_verified=True
    )
    db.add(farmer2)
    db.flush()

    farmer2_profile = Farmer(
        user_id=farmer2.id,
        land_area_acres=20.0,
        farm_location="Sanwer Road, Indore",
        primary_commodities="Soybean, Wheat",
        state="Madhya Pradesh",
        district="Indore",
        pincode="453551"
    )
    db.add(farmer2_profile)

    buyer1 = User(
        email="priya.buyer@itc-agri.com",
        phone="9820000004",
        hashed_password=get_password_hash("Buyer@123"),
        full_name="Priya Sharma",
        role="buyer",
        is_active=True,
        is_verified=True
    )
    db.add(buyer1)
    db.flush()

    buyer1_profile = Buyer(
        user_id=buyer1.id,
        company_name="ITC Agri Business Division",
        business_type="Agro Processor & Exporter",
        gst_number="27AAACI1681G1Z0",
        pan_number="AAACI1681G",
        trade_license="APMC-LIC-VASHI-902",
        state="Maharashtra",
        district="Navi Mumbai",
        pincode="400703",
        delivery_address="ITC Logistics Park, MIDC Industrial Area, Turbhe, Navi Mumbai"
    )
    db.add(buyer1_profile)

    fpo1 = User(
        email="sahyadri.fpo@agrimarket.in",
        phone="9820000005",
        hashed_password=get_password_hash("Fpo@123"),
        full_name="Sahyadri Farmers Producer Co.",
        role="fpo",
        is_active=True,
        is_verified=True
    )
    db.add(fpo1)
    db.flush()

    fpo1_profile = FPO(
        user_id=fpo1.id,
        fpo_name="Sahyadri Farmers Producer Company Ltd.",
        registration_number="U01403MH2011PTC212345",
        year_established=2014,
        total_members=450,
        operational_districts="Nashik, Dhule, Jalgaon",
        contact_person="Vilas Shinde (Director)",
        contact_phone="+91 253 2309100"
    )
    db.add(fpo1_profile)
    db.flush()

    # Link farmer to FPO
    db.add(FPOMembership(
        fpo_id=fpo1_profile.id,
        farmer_id=farmer1_profile.id,
        membership_number="MEM-SFPC-0012",
        shares_held=25,
        status="ACTIVE"
    ))

    # Add KYC verification records
    db.add(KYCVerification(
        user_id=farmer1.id,
        document_type="KISAN_CREDIT_CARD",
        document_number="KCC-9021-MH",
        status="APPROVED",
        remarks="Verified against Maharashtra Agriculture land records.",
        verified_at=datetime.now(timezone.utc)
    ))
    db.add(KYCVerification(
        user_id=buyer1.id,
        document_type="GSTIN",
        document_number="27AAACI1681G1Z0",
        status="APPROVED",
        remarks="Corporate GSTIN active on GST portal.",
        verified_at=datetime.now(timezone.utc)
    ))

    # Produce Lots & Listings
    print("Creating Produce Lots, Inspections, and Market Listings...")
    lot1 = Lot(
        lot_code="LOT-ONION-NSK-01",
        farmer_id=farmer1_profile.id,
        commodity_id=comm_objs["ONION"].id,
        quantity=350.0,
        unit="Quintal",
        harvest_date=date.today() - timedelta(days=5),
        variety="Nashik Red Medium",
        storage_type="Cold Storage",
        storage_address="Sahyadri Agri Cold Chain, Dindori",
        district="Nashik",
        state="Maharashtra",
        status="AVAILABLE"
    )
    db.add(lot1)
    db.flush()

    # Add inspection certificate
    db.add(Inspection(
        lot_id=lot1.id,
        inspector_id=admin.id,
        moisture_percentage=9.2,
        foreign_matter_percentage=0.4,
        grade_assigned="Grade A (Premium)",
        certificate_number="CERT-INSP-2026-0042",
        status="PASSED",
        remarks="Firm bulbs, no rot, dry outer skin, uniform 45-55mm diameter."
    ))

    listing1 = Listing(
        lot_id=lot1.id,
        seller_id=farmer1.id,
        title="Premium Nashik Red Onions (Grade A Export Quality)",
        description="Fresh harvest from Niphad, cured and packed in 50kg mesh bags. Ready for immediate loading.",
        commodity_id=comm_objs["ONION"].id,
        quantity_available=350.0,
        min_order_quantity=50.0,
        unit="Quintal",
        asking_price_per_unit=Decimal("2350.00"),
        currency="INR",
        quality_grade="Grade A (Premium)",
        pickup_address="Sahyadri Cold Chain, Dindori, Nashik",
        district="Nashik",
        state="Maharashtra",
        pincode="422206",
        status="ACTIVE",
        featured=True
    )
    db.add(listing1)

    lot2 = Lot(
        lot_code="LOT-WHEAT-SHAR-02",
        farmer_id=farmer1_profile.id,
        commodity_id=comm_objs["WHEAT"].id,
        quantity=200.0,
        unit="Quintal",
        harvest_date=date.today() - timedelta(days=12),
        variety="Sharbati Golden",
        storage_type="Farm Store",
        district="Nashik",
        state="Maharashtra",
        status="AVAILABLE"
    )
    db.add(lot2)
    db.flush()

    listing2 = Listing(
        lot_id=lot2.id,
        seller_id=farmer1.id,
        title="Sharbati Golden Grain Wheat - Clean & Sun Dried",
        description="Sharbati wheat harvested with combine, cleaned and packed in food-grade gunny bags.",
        commodity_id=comm_objs["WHEAT"].id,
        quantity_available=200.0,
        min_order_quantity=20.0,
        unit="Quintal",
        asking_price_per_unit=Decimal("2800.00"),
        currency="INR",
        quality_grade="Grade A (Premium)",
        district="Nashik",
        state="Maharashtra",
        status="ACTIVE"
    )
    db.add(listing2)

    lot3 = Lot(
        lot_code="LOT-SOY-IND-03",
        farmer_id=farmer2_profile.id,
        commodity_id=comm_objs["SOYBEAN"].id,
        quantity=500.0,
        unit="Quintal",
        harvest_date=date.today() - timedelta(days=7),
        variety="JS-335 Yellow",
        storage_type="Warehouse",
        district="Indore",
        state="Madhya Pradesh",
        status="AVAILABLE"
    )
    db.add(lot3)
    db.flush()

    listing3 = Listing(
        lot_id=lot3.id,
        seller_id=farmer2.id,
        title="High Oil Content Yellow Soybean (Bulk Lot)",
        description="Tested oil content 19.5%, moisture below 10%, suitable for solvent extraction.",
        commodity_id=comm_objs["SOYBEAN"].id,
        quantity_available=500.0,
        min_order_quantity=100.0,
        unit="Quintal",
        asking_price_per_unit=Decimal("4750.00"),
        currency="INR",
        quality_grade="Grade B (Standard)",
        district="Indore",
        state="Madhya Pradesh",
        status="ACTIVE"
    )
    db.add(listing3)
    db.flush()

    # FPO Collective Lot
    lot_fpo = Lot(
        lot_code="LOT-FPO-PUSA-RICE-04",
        fpo_id=fpo1_profile.id,
        commodity_id=comm_objs["RICE_BAS"].id,
        quantity=1200.0,
        unit="Quintal",
        harvest_date=date.today() - timedelta(days=10),
        variety="Pusa 1121 Extra Long",
        storage_type="FPO Warehouse",
        district="Nashik",
        state="Maharashtra",
        is_aggregated=True,
        contributing_farmer_notes='[{"farmer_name": "Ramesh Patil", "quantity": 120}, {"farmer_name": "Kailash Jadhav", "quantity": 250}, {"farmer_name": "Datta Bhalerao", "quantity": 380}]',
        status="AVAILABLE"
    )
    db.add(lot_fpo)
    db.flush()

    listing_fpo = Listing(
        lot_id=lot_fpo.id,
        seller_id=fpo1.id,
        title="FPO Aggregated Pusa 1121 Basmati Paddy (1200 Quintals)",
        description="Direct bulk lot from 15 member farmers with single point quality audit and billing.",
        commodity_id=comm_objs["RICE_BAS"].id,
        quantity_available=1200.0,
        min_order_quantity=200.0,
        unit="Quintal",
        asking_price_per_unit=Decimal("4250.00"),
        currency="INR",
        quality_grade="Grade A (Premium)",
        district="Nashik",
        state="Maharashtra",
        status="ACTIVE",
        featured=True
    )
    db.add(listing_fpo)
    db.flush()

    # Offers and Transactions
    print("Creating Sample Offers and Transactions...")
    offer1 = Offer(
        listing_id=listing1.id,
        buyer_id=buyer1_profile.id,
        offered_quantity=100.0,
        offered_price_per_unit=Decimal("2300.00"),
        total_amount=Decimal("230000.00"),
        proposed_delivery_date=datetime.now(timezone.utc) + timedelta(days=4),
        notes="Urgent supply for ITC distribution center in Navi Mumbai.",
        status="ACCEPTED"
    )
    db.add(offer1)
    db.flush()

    # Deduct listing available quantity
    listing1.quantity_available -= 100.0

    txn1 = Transaction(
        transaction_code="TXN-2026-AGRI-001",
        offer_id=offer1.id,
        listing_id=listing1.id,
        buyer_id=buyer1.id,
        seller_id=farmer1.id,
        agreed_quantity=100.0,
        agreed_price_per_unit=Decimal("2300.00"),
        total_amount=Decimal("230000.00"),
        payment_status="ESCROW_FUNDED",
        fulfillment_status="IN_TRANSIT",
        delivery_address=buyer1_profile.delivery_address
    )
    db.add(txn1)
    db.flush()

    db.add(Payment(
        payment_code="PAY-RZP-2026-001",
        transaction_id=txn1.id,
        amount=Decimal("230000.00"),
        currency="INR",
        payment_gateway_order_id="order_mock_itc_001",
        payment_gateway_payment_id="pay_mock_itc_001",
        payment_method="RAZORPAY_TEST",
        status="SUCCESS",
        paid_at=datetime.now(timezone.utc) - timedelta(days=1)
    ))

    # Logistics Booking
    db.add(LogisticsBooking(
        booking_code="LOG-MH-2026-01",
        transaction_id=txn1.id,
        user_id=buyer1.id,
        provider_name="Kisan Express Road Freight",
        vehicle_type="10 Tonne Heavy Truck (MH-15-EG-4912)",
        origin_address="Sahyadri Cold Chain, Dindori, Nashik",
        destination_address=buyer1_profile.delivery_address,
        distance_km=185.0,
        estimated_cost=Decimal("6200.00"),
        pickup_date=datetime.now(timezone.utc) - timedelta(hours=8),
        tracking_number="TRK-KISAN-90214",
        status="IN_TRANSIT"
    ))

    # Notifications
    db.add(Notification(
        user_id=farmer1.id,
        title="Order Dispatched!",
        message="Buyer verified payment of ₹2,30,000 in escrow. Transporter is moving to destination.",
        notification_type="DELIVERY_UPDATE",
        reference_type="transaction",
        reference_id=txn1.id
    ))
    db.add(Notification(
        user_id=buyer1.id,
        title="Consignment in Transit",
        message="100 Quintals of Red Onion has departed from Nashik hub under tracking TRK-KISAN-90214.",
        notification_type="DELIVERY_UPDATE",
        reference_type="transaction",
        reference_id=txn1.id
    ))

    db.commit()
    print("Seed data completed successfully!")
    db.close()


if __name__ == "__main__":
    seed()
