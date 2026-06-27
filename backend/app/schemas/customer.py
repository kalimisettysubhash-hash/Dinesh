from datetime import date, datetime
from typing import Literal, Optional

from pydantic import BaseModel


class CustomerCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    style_preferences: Optional[str] = None
    notes: Optional[str] = None
    segment: Literal["VIP", "Regular", "New"] = "New"


class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    style_preferences: Optional[str] = None
    notes: Optional[str] = None
    segment: Optional[Literal["VIP", "Regular", "New"]] = None


class CustomerResponse(BaseModel):
    id: str
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    style_preferences: Optional[str] = None
    notes: Optional[str] = None
    segment: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    last_purchase_date: Optional[date] = None
    total_spending: Optional[float] = None
    purchase_count: Optional[int] = None

    class Config:
        from_attributes = True
