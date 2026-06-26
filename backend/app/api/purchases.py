from datetime import date
from decimal import Decimal
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..api.auth import get_current_user
from ..core.database import get_db
from ..models.customer import Customer
from ..models.purchase import Purchase
from ..models.user import User
from ..schemas.purchase import PurchaseCreate, PurchaseResponse, PurchaseUpdate

router = APIRouter(prefix="/api/purchases", tags=["purchases"])


def _to_response(p: Purchase) -> dict:
    return {
        "id": str(p.id),
        "customer_id": str(p.customer_id),
        "purchase_date": p.purchase_date,
        "item_name": p.item_name,
        "category": p.category,
        "amount": float(p.amount),
        "payment_method": p.payment_method,
        "created_at": p.created_at,
        "updated_at": p.updated_at,
        "customer_name": p.customer.name if p.customer else None,
    }


@router.get("", response_model=dict)
def list_purchases(
    page: int = Query(1, ge=1),
    page_size: int = Query(15, ge=1, le=100),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    amount_min: Optional[float] = Query(None),
    amount_max: Optional[float] = Query(None),
    customer_id: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    sort_by: str = Query('purchase_date', pattern='^(purchase_date|amount|created_at)$'),
    order: str = Query('desc', pattern='^(asc|desc)$'),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    query = db.query(Purchase).join(Customer)
    if date_from:
        query = query.filter(Purchase.purchase_date >= date_from)
    if date_to:
        query = query.filter(Purchase.purchase_date <= date_to)
    if amount_min is not None:
        query = query.filter(Purchase.amount >= amount_min)
    if amount_max is not None:
        query = query.filter(Purchase.amount <= amount_max)
    if customer_id:
        query = query.filter(Purchase.customer_id == customer_id)
    if category:
        query = query.filter(Purchase.category.ilike(f"%{category}%"))

    total = query.count()
    purchases = (
        query.order_by(getattr(Purchase, sort_by).desc() if order == 'desc' else getattr(Purchase, sort_by).asc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": (total + page_size - 1) // page_size,
        "data": [_to_response(p) for p in purchases],
    }


@router.post("", response_model=dict, status_code=201)
def create_purchase(
    payload: PurchaseCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    customer = db.query(Customer).filter(Customer.id == payload.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    purchase = Purchase(**payload.model_dump())
    db.add(purchase)
    db.commit()
    db.refresh(purchase)
    return _to_response(purchase)


@router.get("/{purchase_id}", response_model=dict)
def get_purchase(
    purchase_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    p = db.query(Purchase).filter(Purchase.id == purchase_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Purchase not found")
    response = _to_response(p)
    response["customer"] = {
        "id": str(p.customer.id) if p.customer else None,
        "name": p.customer.name if p.customer else None,
        "phone": p.customer.phone if p.customer else None,
        "email": p.customer.email if p.customer else None,
        "address": p.customer.address if p.customer else None,
        "style_preferences": p.customer.style_preferences if p.customer else None,
    }
    return response


@router.put("/{purchase_id}", response_model=dict)
def update_purchase(
    purchase_id: str,
    payload: PurchaseUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    p = db.query(Purchase).filter(Purchase.id == purchase_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Purchase not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(p, field, value)
    db.commit()
    db.refresh(p)
    return _to_response(p)


@router.get("/export/csv")
def export_csv(
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    customer_id: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    query = db.query(Purchase).join(Customer)
    if date_from:
        query = query.filter(Purchase.purchase_date >= date_from)
    if date_to:
        query = query.filter(Purchase.purchase_date <= date_to)
    if customer_id:
        query = query.filter(Purchase.customer_id == customer_id)
    if category:
        query = query.filter(Purchase.category.ilike(f"%{category}%"))

    purchases = query.order_by(Purchase.purchase_date.desc()).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Purchase ID",
        "Customer ID",
        "Customer Name",
        "Item",
        "Category",
        "Amount",
        "Payment Method",
        "Purchase Date",
        "Created At",
        "Updated At",
    ])
    for p in purchases:
        writer.writerow([
            str(p.id),
            str(p.customer_id),
            p.customer.name if p.customer else '',
            p.item_name,
            p.category,
            float(p.amount),
            p.payment_method,
            p.purchase_date,
            p.created_at,
            p.updated_at,
        ])
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=tanvi_purchases.csv"},
    )

@router.delete("/{purchase_id}", status_code=204)
def delete_purchase(
    purchase_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    p = db.query(Purchase).filter(Purchase.id == purchase_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Purchase not found")
    db.delete(p)
    db.commit()
