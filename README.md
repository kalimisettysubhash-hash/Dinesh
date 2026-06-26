# 🌸 TanviCRM — Customer CRM & Analytics Dashboard

A production-ready full-stack CRM for **Tanvi Boutique** featuring customer management, purchase tracking, analytics dashboards, and customer segmentation.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS + Recharts |
| Backend | Python FastAPI + SQLAlchemy |
| Database | PostgreSQL |
| Auth | JWT (python-jose + passlib/bcrypt) |
| HTTP Client | Axios |

---

## Prerequisites

- **Node.js** ≥ 18
- **Python** ≥ 3.10
- **PostgreSQL** ≥ 14 (running on localhost:5432)

---

## Quick Start

### 1. Create the PostgreSQL Database

Open pgAdmin or psql and run:

```sql
CREATE DATABASE tanvicrm;
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# (Optional) Edit .env if your PG credentials differ from defaults:
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tanvicrm

# Seed the database (creates tables + admin user + sample data)
python seed.py

# Start the API server
uvicorn app.main:app --reload --port 8000
```

Backend will be available at: **http://localhost:8000**  
API Docs (Swagger): **http://localhost:8000/docs**

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Frontend will be at: **http://localhost:5173**

---

## Default Login

| Field | Value |
|-------|-------|
| Username | `admin` |
| Password | `admin123` |

---

## Features

### 🏠 Dashboard
- Revenue this month & quarter (KPI cards)
- Total customers & purchases
- Repeat customer rate
- Revenue trend area chart
- New vs Returning customers bar chart
- Popular categories donut chart
- Top 10 customers by spending

### 👥 Customer Management
- Full CRUD (Add / Edit / Delete / View)
- Search by name or phone
- Filter by segment (VIP / Regular / New)
- Pagination (15 per page)
- CSV export of filtered results

### 👤 Customer Profile
- Full contact details
- Style preferences
- Purchase history timeline
- Total spending & segment badge

### 🛍️ Purchase Management
- Full CRUD with customer attachment
- Filter by date range and amount range
- Category and payment method dropdowns
- Paginated table

### 🏷️ Customer Segmentation
- **VIP** — Top 10% by total spending (dynamic 90th percentile)
- **Regular** — 2 or more purchases
- **New** — First purchase only
- Visual progress bars and revenue per segment
- Filterable customer lists per segment
- Per-segment CSV export

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | JWT login |
| POST | `/api/auth/register` | Register user |
| GET | `/api/auth/me` | Current user |
| GET | `/api/customers` | List customers |
| POST | `/api/customers` | Create customer |
| GET | `/api/customers/{id}` | Customer + purchases |
| PUT | `/api/customers/{id}` | Update customer |
| DELETE | `/api/customers/{id}` | Delete customer |
| GET | `/api/customers/export/csv` | CSV export |
| GET | `/api/purchases` | List purchases |
| POST | `/api/purchases` | Create purchase |
| PUT | `/api/purchases/{id}` | Update purchase |
| DELETE | `/api/purchases/{id}` | Delete purchase |
| GET | `/api/analytics/dashboard` | All dashboard KPIs |
| GET | `/api/analytics/revenue-trend` | Monthly revenue |
| GET | `/api/analytics/categories` | Category breakdown |
| GET | `/api/analytics/new-vs-returning` | NVR monthly |
| GET | `/api/analytics/top-customers` | Top N customers |
| GET | `/api/analytics/segments` | Segment counts & revenue |

---

## Project Structure

```
├── backend/
│   ├── app/
│   │   ├── api/          # Route handlers
│   │   ├── core/         # Config, DB, Security
│   │   ├── models/       # SQLAlchemy models
│   │   ├── schemas/      # Pydantic schemas
│   │   └── main.py       # FastAPI app
│   ├── seed.py           # Database seeder
│   ├── requirements.txt
│   └── .env
│
└── frontend/
    ├── src/
    │   ├── api/          # Axios service modules
    │   ├── components/   # Reusable UI components
    │   │   ├── layout/   # Sidebar, Topbar, Layout
    │   │   ├── ui/       # StatCard, Modal, Badge, etc.
    │   │   └── charts/   # Recharts wrappers
    │   ├── context/      # Auth context
    │   ├── pages/        # Route pages
    │   └── router/       # Protected route
    ├── tailwind.config.js
    └── vite.config.js
```

---

## Changing Database Credentials

Edit `backend/.env`:

```env
DATABASE_URL=postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/tanvicrm
SECRET_KEY=your-very-secret-key
```

---

*Built with ❤️ for Tanvi Boutique*
