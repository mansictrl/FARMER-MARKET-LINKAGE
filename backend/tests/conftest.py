import os
import sys
import pytest
from decimal import Decimal
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import Base, get_db
from app.core.security import create_access_token, get_password_hash
from app.main import app
from app.models.user import User, Farmer, Buyer, FPO
from app.models.commodity import Commodity, QualityGrade
from app.models.market import Market, MarketPrice
from datetime import date, timedelta

# In-memory SQLite for super-fast, isolated test execution
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    """Creates a fresh in-memory database schema for each test function."""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    """Provides a TestClient with overridden database session dependency."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def test_commodity(db_session):
    comm = Commodity(
        name="Test Wheat",
        code="TWHEAT",
        category="Cereal",
        standard_unit="Quintal",
        min_support_price=Decimal("2275.00"),
        shelf_life_days=365
    )
    db_session.add(comm)
    db_session.flush()

    grade = QualityGrade(
        commodity_id=comm.id,
        grade_name="Grade A",
        moisture_max_percentage=10.0
    )
    db_session.add(grade)

    market = Market(
        name="Indore Test Mandi",
        code="TEST_IND",
        state="Madhya Pradesh",
        district="Indore",
        is_apmc=True
    )
    db_session.add(market)
    db_session.flush()

    # Add historical prices
    for i in range(15):
        db_session.add(MarketPrice(
            commodity_id=comm.id,
            market_id=market.id,
            price_date=date.today() - timedelta(days=i),
            min_price=Decimal("2400.00"),
            max_price=Decimal("2600.00"),
            modal_price=Decimal("2500.00"),
            arrival_volume=500.0,
            unit="Rs/Quintal",
            source="Test Provider"
        ))

    db_session.commit()
    return comm


@pytest.fixture
def farmer_user(db_session):
    user = User(
        email="test.farmer@example.com",
        phone="9990000001",
        hashed_password=get_password_hash("Secret123"),
        full_name="Farmer Ramesh",
        role="farmer",
        is_active=True,
        is_verified=True
    )
    db_session.add(user)
    db_session.flush()

    farmer = Farmer(user_id=user.id, district="Indore", state="Madhya Pradesh")
    db_session.add(farmer)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def buyer_user(db_session):
    user = User(
        email="test.buyer@example.com",
        phone="9990000002",
        hashed_password=get_password_hash("Secret123"),
        full_name="Buyer Enterprise",
        role="buyer",
        is_active=True,
        is_verified=True
    )
    db_session.add(user)
    db_session.flush()

    buyer = Buyer(user_id=user.id, company_name="AgriProcure India Ltd", delivery_address="Plot 5, Sector 12, Navi Mumbai")
    db_session.add(buyer)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def admin_user(db_session):
    user = User(
        email="test.admin@example.com",
        phone="9990000003",
        hashed_password=get_password_hash("Secret123"),
        full_name="Platform Admin",
        role="admin",
        is_active=True,
        is_verified=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def farmer_token(farmer_user):
    return create_access_token(subject=farmer_user.id, role=farmer_user.role)


@pytest.fixture
def buyer_token(buyer_user):
    return create_access_token(subject=buyer_user.id, role=buyer_user.role)


@pytest.fixture
def admin_token(admin_user):
    return create_access_token(subject=admin_user.id, role=admin_user.role)
