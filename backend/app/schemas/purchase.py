from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel


class PurchaseCreate(BaseModel):
    customer_id: str
    purchase_date: date
    item_name: str
    category: Optional[str] = None
    amount: Decimal
    payment_method: Optional[str] = None


class PurchaseUpdate(BaseModel):
    purchase_date: Optional[date] = None
    item_name: Optional[str] = None
    category: Optional[str] = None
    amount: Optional[Decimal] = None
    payment_method: Optional[str] = None
    customer_id: Optional[str] = None


class PurchaseResponse(BaseModel):
    id: str
    customer_id: str
    purchase_date: date
    item_name: str
    category: Optional[str] = None
    amount: Decimal
    payment_method: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    customer_name: Optional[str] = None

    class Config:
        from_attributes = True
