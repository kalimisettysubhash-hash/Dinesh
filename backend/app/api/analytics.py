import csv
import io
from datetime import date, datetime, timedelta, timezone
from typing import List

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import extract, func
from sqlalchemy.orm import Session

from ..api.auth import get_current_user
from ..core.database import get_db
from ..models.customer import Customer
from ..models.purchase import Purchase
from ..models.user import User

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

CATEGORIES = ["Sarees", "Lehengas", "Kurtis", "Blouses", "Jewellery", "Accessories", "Suits", "Other"]


def _vip_threshold(db: Session) -> float:
    rows = (
        db.query(func.coalesce(func.sum(Purchase.amount), 0).label("total"))
        .join(Customer, Customer.id == Purchase.customer_id)
        .group_by(Purchase.customer_id)
        .all()
    )
    if not rows:
        return 0.0
    values = sorted([float(r.total) for r in rows], reverse=True)
    idx = max(0, int(len(values) * 0.10) - 1)
    return values[idx]


@router.get("/dashboard")
def dashboard(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    prev_month_end = month_start - timedelta(days=1)
    prev_month_start = prev_month_end.replace(day=1)
    quarter_month = ((now.month - 1) // 3) * 3 + 1
    quarter_start = now.replace(month=quarter_month, day=1, hour=0, minute=0, second=0, microsecond=0)

    rev_month = (
        db.query(func.coalesce(func.sum(Purchase.amount), 0))
        .filter(Purchase.purchase_date >= month_start.date())
        .scalar()
    )
    rev_prev_month = (
        db.query(func.coalesce(func.sum(Purchase.amount), 0))
        .filter(Purchase.purchase_date >= prev_month_start)
        .filter(Purchase.purchase_date <= prev_month_end)
        .scalar()
    )
    rev_quarter = (
        db.query(func.coalesce(func.sum(Purchase.amount), 0))
        .filter(Purchase.purchase_date >= quarter_start.date())
        .scalar()
    )

    total_customers = db.query(func.count(Customer.id)).scalar()
    total_purchases = db.query(func.count(Purchase.id)).scalar()
    total_revenue = db.query(func.coalesce(func.sum(Purchase.amount), 0)).scalar() or 0
    avg_order_value = float(total_revenue / total_purchases) if total_purchases else 0

    repeat_count = (
        db.query(Purchase.customer_id)
        .group_by(Purchase.customer_id)
        .having(func.count(Purchase.id) >= 2)
        .count()
    )
    repeat_rate = round((repeat_count / total_customers * 100), 1) if total_customers else 0

    first_purchase = (
        db.query(Purchase.customer_id, func.min(Purchase.purchase_date).label('first_date'))
        .group_by(Purchase.customer_id)
        .subquery()
    )
    new_customer_count = (
        db.query(func.count(first_purchase.c.customer_id))
        .filter(first_purchase.c.first_date >= month_start.date())
        .scalar()
    )
    returning_customer_count = (
        db.query(func.count(func.distinct(Purchase.customer_id)))
        .filter(Purchase.purchase_date >= month_start.date())
        .group_by(Purchase.customer_id)
        .having(func.count(Purchase.id) > 1)
        .count()
    )
    monthly_growth = 0.0
    if rev_prev_month:
        monthly_growth = round(((float(rev_month) - float(rev_prev_month)) / float(rev_prev_month)) * 100, 1)
    elif rev_month:
        monthly_growth = 100.0

    # Top customers
    vip_threshold = _vip_threshold(db)
    top_customers_rows = (
        db.query(
            Customer.id,
            Customer.name,
            func.coalesce(func.sum(Purchase.amount), 0).label("total"),
            func.count(Purchase.id).label("count"),
        )
        .outerjoin(Purchase, Purchase.customer_id == Customer.id)
        .group_by(Customer.id, Customer.name)
        .order_by(func.coalesce(func.sum(Purchase.amount), 0).desc())
        .limit(10)
        .all()
    )
    top_customers = [
        {
            "id": str(r.id),
            "name": r.name,
            "total_spending": float(r.total),
            "purchase_count": r.count,
            "segment": (
                "VIP" if float(r.total) >= vip_threshold
                else ("Regular" if r.count >= 2 else "New")
            ),
        }
        for r in top_customers_rows
    ]

    # Popular categories
    cat_rows = (
        db.query(Purchase.category, func.count(Purchase.id).label("count"))
        .filter(Purchase.category.isnot(None))
        .group_by(Purchase.category)
        .order_by(func.count(Purchase.id).desc())
        .limit(8)
        .all()
    )
    popular_categories = [{"category": r.category, "count": r.count} for r in cat_rows]

    return {
        "revenue_this_month": float(rev_month),
        "revenue_this_quarter": float(rev_quarter),
        "total_customers": total_customers,
        "total_purchases": total_purchases,
        "average_order_value": float(avg_order_value),
        "new_customer_count": new_customer_count,
        "returning_customer_count": returning_customer_count,
        "monthly_growth": monthly_growth,
        "repeat_customer_rate": repeat_rate,
        "top_customers": top_customers,
        "popular_categories": popular_categories,
        "vip_threshold": vip_threshold,
    }


@router.get("/revenue-trend")
def revenue_trend(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Monthly revenue for last 12 months."""
    rows = (
        db.query(
            extract("year", Purchase.purchase_date).label("year"),
            extract("month", Purchase.purchase_date).label("month"),
            func.coalesce(func.sum(Purchase.amount), 0).label("revenue"),
        )
        .group_by("year", "month")
        .order_by("year", "month")
        .limit(12)
        .all()
    )
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
              "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    return [
        {
            "period": f"{months[int(r.month) - 1]} {int(r.year)}",
            "revenue": float(r.revenue),
        }
        for r in rows
    ]


@router.get("/weekly-revenue-trend")
def weekly_revenue_trend(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Weekly revenue for last 12 weeks."""
    # SQLite/PostgreSQL agnostic way: get all purchases from last 12 weeks
    twelve_weeks_ago = datetime.now(timezone.utc).date() - timedelta(weeks=12)
    rows = (
        db.query(
            Purchase.purchase_date,
            Purchase.amount,
        )
        .filter(Purchase.purchase_date >= twelve_weeks_ago)
        .all()
    )

    # Group by ISO year and week manually
    weekly_data = {}
    for r in rows:
        iso_year, iso_week, _ = r.purchase_date.isocalendar()
        key = f"{iso_year}-W{iso_week:02d}"
        if key not in weekly_data:
            weekly_data[key] = 0.0
        weekly_data[key] += float(r.amount)

    result = []
    for key in sorted(weekly_data.keys()):
        result.append({
            "period": key,
            "revenue": weekly_data[key]
        })
    return result


@router.get("/recent-activity")
def recent_activity(
    limit: int = 10,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    purchases = (
        db.query(Purchase, Customer.name.label("customer_name"))
        .join(Customer, Customer.id == Purchase.customer_id)
        .order_by(Purchase.created_at.desc())
        .limit(limit)
        .all()
    )
    
    customers = (
        db.query(Customer)
        .order_by(Customer.created_at.desc())
        .limit(limit)
        .all()
    )

    activities = []
    for p, c_name in purchases:
        activities.append({
            "type": "purchase",
            "id": str(p.id),
            "customer_name": c_name,
            "amount": float(p.amount),
            "item_name": p.item_name,
            "date": p.created_at
        })
        
    for c in customers:
        activities.append({
            "type": "customer",
            "id": str(c.id),
            "customer_name": c.name,
            "date": c.created_at
        })

    activities.sort(key=lambda x: x["date"], reverse=True)
    return activities[:limit]


@router.get("/categories")
def categories(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    rows = (
        db.query(
            Purchase.category,
            func.count(Purchase.id).label("count"),
            func.coalesce(func.sum(Purchase.amount), 0).label("revenue"),
        )
        .filter(Purchase.category.isnot(None))
        .group_by(Purchase.category)
        .order_by(func.count(Purchase.id).desc())
        .all()
    )
    return [
        {"category": r.category, "count": r.count, "revenue": float(r.revenue)}
        for r in rows
    ]


@router.get("/purchase-frequency")
def purchase_frequency(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    rows = (
        db.query(
            extract("year", Purchase.purchase_date).label("year"),
            extract("month", Purchase.purchase_date).label("month"),
            func.count(Purchase.id).label("purchases"),
        )
        .group_by("year", "month")
        .order_by("year", "month")
        .all()
    )

    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    return [
        {
            "period": f"{months[int(r.month) - 1]} {int(r.year)}",
            "purchases": int(r.purchases),
        }
        for r in rows
    ]


@router.get("/export/csv")
def export_csv(
    report: str = Query('dashboard', pattern='^(dashboard|top-customers|revenue-by-category|purchase-frequency)$'),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    output = io.StringIO()
    writer = csv.writer(output)

    if report == 'top-customers':
        vip_threshold = _vip_threshold(db)
        rows = (
            db.query(
                Customer.id,
                Customer.name,
                Customer.email,
                Customer.phone,
                func.coalesce(func.sum(Purchase.amount), 0).label('total'),
                func.count(Purchase.id).label('count'),
            )
            .outerjoin(Purchase, Purchase.customer_id == Customer.id)
            .group_by(Customer.id, Customer.name, Customer.email, Customer.phone)
            .order_by(func.coalesce(func.sum(Purchase.amount), 0).desc())
            .limit(limit)
            .all()
        )
        writer.writerow(['Rank', 'Customer ID', 'Name', 'Email', 'Phone', 'Total Spending', 'Purchase Count', 'Segment'])
        for idx, r in enumerate(rows, start=1):
            segment = 'VIP' if float(r.total) >= vip_threshold else ('Regular' if r.count >= 2 else 'New')
            writer.writerow([idx, str(r.id), r.name, r.email, r.phone, float(r.total), r.count, segment])
    elif report == 'revenue-by-category':
        rows = (
            db.query(
                Purchase.category,
                func.count(Purchase.id).label('count'),
                func.coalesce(func.sum(Purchase.amount), 0).label('revenue'),
            )
            .filter(Purchase.category.isnot(None))
            .group_by(Purchase.category)
            .order_by(func.count(Purchase.id).desc())
            .all()
        )
        writer.writerow(['Category', 'Purchase Count', 'Revenue'])
        for r in rows:
            writer.writerow([r.category, r.count, float(r.revenue)])
    elif report == 'purchase-frequency':
        rows = (
            db.query(
                extract('year', Purchase.purchase_date).label('year'),
                extract('month', Purchase.purchase_date).label('month'),
                func.count(Purchase.id).label('purchases'),
            )
            .group_by('year', 'month')
            .order_by('year', 'month')
            .all()
        )
        months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        writer.writerow(['Period', 'Purchases'])
        for r in rows:
            writer.writerow([f"{months[int(r.month) - 1]} {int(r.year)}", int(r.purchases)])
    else:
        writer.writerow(['Metric', 'Value'])
        current_month_start = datetime.now(timezone.utc).replace(day=1).date()
        current_quarter_start = datetime.now(timezone.utc).replace(
            month=((datetime.now(timezone.utc).month - 1) // 3) * 3 + 1,
            day=1,
        ).date()
        writer.writerow(['Revenue This Month', float(
            db.query(func.coalesce(func.sum(Purchase.amount), 0))
            .filter(Purchase.purchase_date >= current_month_start)
            .scalar()
        )])
        writer.writerow(['Revenue This Quarter', float(
            db.query(func.coalesce(func.sum(Purchase.amount), 0))
            .filter(Purchase.purchase_date >= current_quarter_start)
            .scalar()
        )])
        writer.writerow(['Repeat Customer Rate (%)', round((
            db.query(Purchase.customer_id)
            .group_by(Purchase.customer_id)
            .having(func.count(Purchase.id) >= 2)
            .count()
        ) / (db.query(func.count(Customer.id)).scalar() or 1) * 100, 1)])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type='text/csv',
        headers={'Content-Disposition': f'attachment; filename=tanvi_analytics_{report}.csv'},
    )


@router.get("/new-vs-returning")
def new_vs_returning(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Count customers with exactly 1 purchase (new) vs 2+ purchases (returning) per month."""
    rows = (
        db.query(
            extract("year", Purchase.purchase_date).label("year"),
            extract("month", Purchase.purchase_date).label("month"),
            Purchase.customer_id,
            func.count(Purchase.id).label("pcount"),
        )
        .group_by("year", "month", Purchase.customer_id)
        .order_by("year", "month")
        .all()
    )

    monthly: dict = {}
    for r in rows:
        key = f"{int(r.year)}-{int(r.month):02d}"
        if key not in monthly:
            monthly[key] = {"new": 0, "returning": 0}
        if r.pcount == 1:
            monthly[key]["new"] += 1
        else:
            monthly[key]["returning"] += 1

    months_map = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    result = []
    for key in sorted(monthly.keys())[-12:]:
        year, month = key.split("-")
        result.append({
            "period": f"{months_map[int(month) - 1]} {year}",
            "new": monthly[key]["new"],
            "returning": monthly[key]["returning"],
        })
    return result


@router.get("/top-customers")
def top_customers(
    limit: int = 10,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    vip_threshold = _vip_threshold(db)
    rows = (
        db.query(
            Customer.id,
            Customer.name,
            Customer.email,
            Customer.phone,
            func.coalesce(func.sum(Purchase.amount), 0).label("total"),
            func.count(Purchase.id).label("count"),
        )
        .outerjoin(Purchase, Purchase.customer_id == Customer.id)
        .group_by(Customer.id, Customer.name, Customer.email, Customer.phone)
        .order_by(func.coalesce(func.sum(Purchase.amount), 0).desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id": str(r.id),
            "name": r.name,
            "email": r.email,
            "phone": r.phone,
            "total_spending": float(r.total),
            "purchase_count": r.count,
            "segment": (
                "VIP" if float(r.total) >= vip_threshold
                else ("Regular" if r.count >= 2 else "New")
            ),
        }
        for r in rows
    ]


@router.get("/segments")
def segments(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    vip_threshold = _vip_threshold(db)
    rows = (
        db.query(
            Customer.id,
            func.coalesce(func.sum(Purchase.amount), 0).label("total"),
            func.count(Purchase.id).label("count"),
        )
        .outerjoin(Purchase, Purchase.customer_id == Customer.id)
        .group_by(Customer.id)
        .all()
    )
    counts = {"VIP": 0, "Regular": 0, "New": 0}
    revenue = {"VIP": 0.0, "Regular": 0.0, "New": 0.0}
    for r in rows:
        total = float(r.total)
        count = r.count
        seg = "VIP" if total >= vip_threshold else ("Regular" if count >= 2 else "New")
        counts[seg] += 1
        revenue[seg] += total
    return [
        {"segment": seg, "count": counts[seg], "revenue": revenue[seg]}
        for seg in ["VIP", "Regular", "New"]
    ]
