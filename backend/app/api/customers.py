import io
import csv
from datetime import datetime
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from ..api.auth import get_current_user
from ..core.database import get_db
from ..models.customer import Customer
from ..models.purchase import Purchase
from ..models.user import User
from ..schemas.customer import CustomerCreate, CustomerResponse, CustomerUpdate

router = APIRouter(prefix="/api/customers", tags=["customers"])


def compute_segment(total_spending: float, purchase_count: int, vip_threshold: float) -> str:
    if total_spending >= vip_threshold:
        return "VIP"
    elif purchase_count >= 2:
        return "Regular"
    else:
        return "New"


def get_vip_threshold(db: Session) -> float:
    """Compute 90th percentile of customer total spending."""
    spending_subquery = (
        db.query(func.coalesce(func.sum(Purchase.amount), 0).label("total"))
        .filter(Purchase.customer_id == Customer.id)
        .correlate(Customer)
        .scalar_subquery()
    )
    rows = db.query(spending_subquery).all()
    if not rows:
        return 0.0
    values = sorted([float(r[0]) for r in rows], reverse=True)
    idx = max(0, int(len(values) * 0.10) - 1)
    return values[idx] if values else 0.0


def enrich_customer(customer: Customer, db: Session, vip_threshold: float) -> dict:
    agg = (
        db.query(
            func.coalesce(func.sum(Purchase.amount), 0).label("total"),
            func.count(Purchase.id).label("count"),
        )
        .filter(Purchase.customer_id == customer.id)
        .one()
    )
    total = float(agg.total)
    count = int(agg.count)
    last_purchase = db.query(func.max(Purchase.purchase_date)).filter(Purchase.customer_id == customer.id).scalar()
    segment = compute_segment(total, count, vip_threshold)
    return {
        "id": str(customer.id),
        "name": customer.name,
        "phone": customer.phone,
        "email": customer.email,
        "address": customer.address,
        "style_preferences": customer.style_preferences,
        "notes": customer.notes,
        "created_at": customer.created_at,
        "updated_at": customer.updated_at,
        "last_purchase_date": last_purchase,
        "total_spending": total,
        "purchase_count": count,
        "segment": segment,
    }


@router.get("", response_model=dict)
def list_customers(
    page: int = Query(1, ge=1),
    page_size: int = Query(15, ge=1, le=100),
    search: Optional[str] = Query(None),
    phone: Optional[str] = Query(None),
    segment: Optional[str] = Query(None),
    sort_by: str = Query('created_at', pattern='^(name|created_at|total_spending|purchase_count|last_purchase_date)$'),
    order: str = Query('desc', pattern='^(asc|desc)$'),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    query = db.query(Customer)
    if search:
        query = query.filter(
            or_(
                Customer.name.ilike(f"%{search}%"),
                Customer.email.ilike(f"%{search}%"),
                Customer.phone.ilike(f"%{search}%"),
            )
        )
    if phone:
        query = query.filter(Customer.phone.ilike(f"%{phone}%"))

    vip_threshold = get_vip_threshold(db)
    all_customers = query.all()
    data = [enrich_customer(c, db, vip_threshold) for c in all_customers]

    if segment and segment != 'All':
        data = [c for c in data if c['segment'] == segment]

    if sort_by in ['total_spending', 'purchase_count', 'last_purchase_date']:
        data.sort(key=lambda c: (c[sort_by] or datetime.min), reverse=(order == 'desc'))
    elif sort_by == 'name':
        data.sort(key=lambda c: c['name'].lower(), reverse=(order == 'desc'))
    elif sort_by == 'created_at':
        data.sort(key=lambda c: c['created_at'] or datetime.min, reverse=(order == 'desc'))

    total = len(data)
    page_data = data[(page - 1) * page_size : page * page_size]
    return {
        'total': total,
        'page': page,
        'page_size': page_size,
        'pages': (total + page_size - 1) // page_size,
        'data': page_data,
    }


@router.post("", response_model=CustomerResponse, status_code=201)
def create_customer(
    payload: CustomerCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    customer = Customer(**payload.model_dump())
    db.add(customer)
    db.commit()
    db.refresh(customer)
    vip_threshold = get_vip_threshold(db)
    return enrich_customer(customer, db, vip_threshold)


@router.get("/export/csv")
def export_csv(
    search: Optional[str] = Query(None),
    segment: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    query = db.query(Customer)
    if search:
        query = query.filter(Customer.name.ilike(f"%{search}%"))
    customers = query.order_by(Customer.name).all()
    vip_threshold = get_vip_threshold(db)

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "ID",
        "Name",
        "Phone",
        "Email",
        "Address",
        "Style Preferences",
        "Notes",
        "Total Spending",
        "Purchase Count",
        "Segment",
        "Last Purchase Date",
        "Created At",
        "Updated At",
    ])
    for c in customers:
        enriched = enrich_customer(c, db, vip_threshold)
        if segment and enriched["segment"] != segment:
            continue
        writer.writerow([
            enriched["id"],
            enriched["name"],
            enriched["phone"],
            enriched["email"],
            enriched["address"],
            enriched["style_preferences"],
            enriched["notes"],
            enriched["total_spending"],
            enriched["purchase_count"],
            enriched["segment"],
            enriched["last_purchase_date"],
            enriched["created_at"],
            enriched["updated_at"],
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=tanvi_customers.csv"},
    )


@router.get("/{customer_id}", response_model=dict)
def get_customer(
    customer_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    try:
        cid = UUID(customer_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid customer id")

    customer = db.query(Customer).filter(Customer.id == cid).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    vip_threshold = get_vip_threshold(db)
    enriched = enrich_customer(customer, db, vip_threshold)

    purchases = (
        db.query(Purchase)
        .filter(Purchase.customer_id == customer.id)
        .order_by(Purchase.purchase_date.desc())
        .all()
    )
    enriched["purchases"] = [
        {
            "id": str(p.id),
            "purchase_date": p.purchase_date,
            "item_name": p.item_name,
            "category": p.category,
            "amount": float(p.amount),
            "payment_method": p.payment_method,
            "created_at": p.created_at,
        }
        for p in purchases
    ]
    return enriched


@router.put("/{customer_id}", response_model=CustomerResponse)
def update_customer(
    customer_id: str,
    payload: CustomerUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    try:
        cid = UUID(customer_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid customer id")

    customer = db.query(Customer).filter(Customer.id == cid).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(customer, field, value)
    db.commit()
    db.refresh(customer)
    vip_threshold = get_vip_threshold(db)
    return enrich_customer(customer, db, vip_threshold)


@router.delete("/{customer_id}", status_code=204)
def delete_customer(
    customer_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    try:
        cid = UUID(customer_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid customer id")

    customer = db.query(Customer).filter(Customer.id == cid).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    try:
        db.delete(customer)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
