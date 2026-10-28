# Farmer Market Linkage and Price Discovery System

An enterprise-grade, full-stack agricultural marketplace platform engineered to strengthen direct market linkages, eliminate exploitative intermediaries, and provide algorithmic price discovery for Indian smallholder farmers and Farmer Producer Organisations (FPOs).

---

## 🌾 Platform Highlights

- **Direct Farmer-to-Buyer Trading**: Farmers list produce lots directly with quality grading (Grade A / Export, Grade B / FAQ, Grade C / Processing), harvest timestamps, and asking prices.
- **APMC Mandi Price Discovery**: Ingests, normalizes, and compares live modal, minimum, and maximum prices across major agricultural mandis (Lasalgaon, Vashi APMC, Azadpur Delhi, Indore, Guntur, Khanna, Rajkot) with 30-day interactive price trend visualisations.
- **Explainable Price Recommendation Engine**: Baseline algorithmic engine analyzing 30-day historical moving averages, road freight logistics costs, arrival volume pressure, and cold storage availability to give explainable advice (`SELL_NOW`, `HOLD_FOR_BETTER_PRICE`, or `DIVERT_TO_ANOTHER_MANDI`).
- **Cryptographic Escrow & Settlement Machine**: Buyer offer negotiation workflow with test-mode Razorpay escrow payment initiation and cryptographic server-side HMAC-SHA256 signature verification. State progression: `OFFER_ACCEPTED` → `ESCROW_LOCKED` → `DISPATCHED` → `IN_TRANSIT` → `DELIVERED` → `COMPLETED`.
- **FPO Collective Produce Pooling**: Enables institutional aggregation of produce from smallholder member farmers into bulk lots while preserving complete farm-level traceability.
- **Post-Harvest Infrastructure**: Search and reserve WDRA-accredited dry grain warehouses, cold-chain storage facilities, and freight logistics trucks.
- **Role-Based Governance & KYC Verification**: Multi-tier authentication with role-based access control (Farmer, Buyer, FPO, Admin) and an administrative KYC verification review queue.

---

## 🏛️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, Recharts, Lucide Icons, Axios, React Router v6 |
| **Backend API** | Python 3.11+, FastAPI (Async), Pydantic v2, SQLAlchemy 2.0 ORM, Alembic Migrations |
| **Security** | Argon2/Bcrypt password hashing, PyJWT tokens, Server-side HMAC-SHA256 signature verification |
| **Database** | PostgreSQL 16 (Production / Docker) / SQLite + aiosqlite (Local zero-config dev) |
| **Caching & Queues** | Redis 7, RabbitMQ 3.12, Celery Background Workers |
| **Object Storage** | Amazon S3 / MinIO |
| **Deployment** | Docker Compose, Multi-stage Docker builds, Nginx Reverse Proxy |

---

## 🚀 Quick Start Guide

You can run the platform either using **Docker Compose** (recommended for production-identical local stacks) or **directly on your host machine** (instant development mode with zero external dependencies).

### Option A: Local Development (Host Machine)

#### 1. Backend Setup
```bash
cd backend

# Create and activate virtual environment
python -m venv .venv
# Windows:
.\.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Seed the database with Indian mandis, commodities, historical prices, and demo users
python seed.py

# Start the FastAPI backend
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
The interactive Swagger API documentation will be available at: **http://127.0.0.1:8000/docs**

#### 2. Frontend Setup
In a new terminal window:
```bash
cd frontend

# Install dependencies
npm install --legacy-peer-deps

# Start Vite development server
npm run dev
```
The React web application will be live at: **http://localhost:5173**

---

### Option B: Docker Compose

```bash
# Clone the repository and navigate to root
cd "FARMER MARKET LINKAGE"

# Copy environment settings
cp .env.example .env

# Build and start all services
docker-compose up --build
```

Services started:
- **Web Platform & Nginx Proxy**: `http://localhost`
- **FastAPI Backend**: `http://localhost:8000` (Docs: `http://localhost:8000/docs`)
- **Frontend SPA**: `http://localhost:3000`
- **PostgreSQL**: `localhost:5432`
- **RabbitMQ Management**: `http://localhost:15672` (guest / guest)
- **MinIO Console**: `http://localhost:9001` (minioadmin / minioadmin)
- **Redis**: `localhost:6379`

---

## 👥 Seeded Demo Accounts

The database includes pre-configured realistic personas across all 4 roles. You can either log in using the credentials below or click the **1-Click Demo Sign In** chips located directly above the login form:

| Role | Name / Organization | Email | Password |
| :--- | :--- | :--- | :--- |
| **Farmer** | Ramesh Patil (Nashik Grape & Onion Grower) | `ramesh.farmer@agrimarket.in` | `Farmer@123` |
| **Buyer** | Priya Sharma (ITC Agri Sourcing Ltd) | `priya.buyer@itc-agri.com` | `Buyer@123` |
| **FPO** | Sahyadri Farmers Producer Co. | `sahyadri.fpo@agrimarket.in` | `Fpo@123` |
| **Admin** | Department of Agricultural Marketing | `admin@agrimarket.gov.in` | `Admin@123` |

---

## 🧪 Automated Testing

The backend includes a comprehensive automated test suite testing authentication, RBAC authorization, produce listing creation, offer negotiation, transaction state transitions, and price recommendation generation:

```bash
cd backend
.\.venv\Scripts\pytest.exe -v
```

All 13 tests execute and validate:
- User registration & JWT authentication
- Role-based permissions enforcement
- Produce listing lifecycle & searching
- Offer creation, acceptance, and rejection
- Transaction generation & delivery state advances
- Explainable recommendation algorithmic outputs
- KYC verification moderation permissions

---

## 📁 Architecture & Directory Structure

```text
FARMER MARKET LINKAGE/
├── backend/
│   ├── app/
│   │   ├── api/v1/              # REST Endpoints (auth, listings, mandis, offers, etc.)
│   │   ├── core/                # Config, database, security, RBAC dependencies
│   │   ├── integrations/        # Agmarknet, Razorpay, Weather, SMS, Geocoding adapters
│   │   ├── models/              # SQLAlchemy 2.0 ORM models
│   │   ├── schemas/             # Pydantic v2 schemas
│   │   ├── services/            # Business logic (recommendations, escrow, FPO pooling)
│   │   ├── workers/             # Celery background tasks
│   │   └── main.py              # FastAPI application entrypoint
│   ├── alembic/                 # Database schema migrations
│   ├── tests/                   # Automated pytest suite
│   ├── seed.py                  # Realistic APMC mandi and user data generator
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/          # Reusable UI (badges, modals, trend charts)
│   │   ├── context/             # Authentication context with 1-click demo switcher
│   │   ├── layouts/             # Main and role dashboard navigation layouts
│   │   ├── pages/               # Landing, marketplace, price discovery, KYC, logistics
│   │   │   └── dashboards/      # Farmer, Buyer, FPO, and Admin role dashboards
│   │   ├── services/            # Axios API client
│   │   └── types/               # TypeScript interfaces
│   ├── Dockerfile
│   └── vite.config.ts
├── nginx/
│   └── nginx.conf               # Unified reverse proxy configuration
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 🔒 Security & Data Integrity

1. **No Plaintext Passwords**: Argon2/Bcrypt key derivation with salted hashing.
2. **Server-Side Verification**: Escrow payments are only confirmed after cryptographic HMAC-SHA256 signature calculation matching Razorpay order payloads.
3. **Strict RBAC Enforcement**: Backend route dependencies verify user identity and ownership before permitting lot updates, offer approvals, or status advances.
4. **Transparent Price Recommendations**: All price guidance explicitly displays the underlying mathematical factor weights, road freight distances, data freshness timestamps, and confidence scores.
