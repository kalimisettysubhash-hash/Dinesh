"""
Seed script - creates the DB, an admin user, sample customers and purchases.
Run from the backend/ directory:
    python seed.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from datetime import date, timedelta
import random
from decimal import Decimal

from app.core.database import Base, engine, SessionLocal
from app.core.security import get_password_hash
from app.models.user import User
from app.models.customer import Customer
from app.models.purchase import Purchase

# Create all tables
Base.metadata.create_all(bind=engine)

db = SessionLocal()

# Admin user
if not db.query(User).filter(User.username == "admin").first():
    admin = User(
        username="admin",
        email="admin@tanviboutique.com",
        hashed_password=get_password_hash("admin123"),
    )
    db.add(admin)
    db.commit()
    print("Admin user created (username: admin | password: admin123)")

# Sample data
CATEGORIES = ["Sarees", "Lehengas", "Kurtis", "Blouses", "Jewellery", "Accessories", "Suits", "Other"]
PAYMENT_METHODS = ["Cash", "UPI", "Credit Card", "Debit Card", "Net Banking"]

customers_data = [
    ("Priya Sharma",    "9876543210", "priya@example.com",   "12 MG Road, Mumbai",          "Silk sarees, traditional"),
    ("Anita Verma",     "9812345678", "anita@example.com",   "45 Park Street, Delhi",        "Modern lehengas, pastels"),
    ("Rekha Nair",      "9923456789", "rekha@example.com",   "78 Church Road, Kochi",        "Kurtis, casual wear"),
    ("Sunita Gupta",    "9734567890", "sunita@example.com",  "23 Civil Lines, Jaipur",       "Bridal, heavy embroidery"),
    ("Meena Patel",     "9645678901", "meena@example.com",   "56 SG Highway, Ahmedabad",     "Fusion wear, contemporary"),
    ("Lakshmi Rao",     "9556789012", "lakshmi@example.com", "90 Anna Nagar, Chennai",       "South silk, temple jewellery"),
    ("Kavya Reddy",     "9467890123", "kavya@example.com",   "34 Jubilee Hills, Hyderabad",  "Casual kurtis, comfort"),
    ("Pooja Singh",     "9378901234", "pooja@example.com",   "67 Hazratganj, Lucknow",       "Chikankari, embroidery"),
    ("Deepa Krishnan",  "9289012345", "deepa@example.com",   "11 Indiranagar, Bengaluru",    "Designer blouses, sarees"),
    ("Swathi Menon",    "9190123456", "swathi@example.com",  "89 Viman Nagar, Pune",         "Printed kurtis, western fusion"),
    ("Asha Iyer",       "9001234567", "asha@example.com",    "22 Boat Club Road, Coimbatore","Cotton sarees, handloom"),
    ("Nandini Joshi",   "9912345678", "nandini@example.com", "44 Model Town, Chandigarh",    "Suits, heavy dupattas"),
    ("Radha Pillai",    "9823456789", "radha@example.com",   "77 Marine Drive, Kochi",       "Kasavu sarees, gold jewellery"),
    ("Geeta Malhotra",  "9734567891", "geeta@example.com",   "33 Lajpat Nagar, Delhi",       "Bridal lehengas, red"),
    ("Shanti Bhatt",    "9645678902", "shanti@example.com",  "55 Satellite, Ahmedabad",      "Cotton kurtis, minimal"),
]

existing_emails = {c.email for c in db.query(Customer).all()}
created_customers = []

for name, phone, email, address, style in customers_data:
    if email not in existing_emails:
        c = Customer(name=name, phone=phone, email=email, address=address, style_preferences=style)
        db.add(c)
        created_customers.append(c)

db.commit()
for c in created_customers:
    db.refresh(c)

all_customers = db.query(Customer).all()
print(f"{len(created_customers)} customers seeded (total: {len(all_customers)})")

# Purchases
if db.query(Purchase).count() == 0:
    today = date.today()
    items = [
        ("Banarasi Silk Saree", "Sarees", 8500),
        ("Bridal Lehenga Set", "Lehengas", 22000),
        ("Cotton Kurti", "Kurtis", 1200),
        ("Designer Blouse", "Blouses", 3500),
        ("Gold Necklace Set", "Jewellery", 45000),
        ("Silk Lehenga", "Lehengas", 15000),
        ("Embroidered Kurti", "Kurtis", 2200),
        ("Chikankari Saree", "Sarees", 6000),
        ("Bangles Set", "Accessories", 800),
        ("Casual Kurti Set", "Kurtis", 1800),
        ("Kashmiri Shawl", "Accessories", 4500),
        ("Palazzo Set", "Suits", 3200),
        ("Temple Jewellery", "Jewellery", 12000),
        ("Anarkali Suit", "Suits", 6500),
        ("Printed Saree", "Sarees", 2800),
    ]
    purchases_added = 0
    for customer in all_customers:
        num_purchases = random.randint(1, 5)
        for _ in range(num_purchases):
            item_name, category, base_price = random.choice(items)
            amount = Decimal(str(base_price + random.randint(-200, 2000)))
            days_ago = random.randint(0, 365)
            p = Purchase(
                customer_id=customer.id,
                purchase_date=today - timedelta(days=days_ago),
                item_name=item_name,
                category=category,
                amount=amount,
                payment_method=random.choice(PAYMENT_METHODS),
            )
            db.add(p)
            purchases_added += 1
    db.commit()
    print(f"{purchases_added} purchases seeded")
else:
    print("Purchases already exist, skipping")

db.close()
print("\nSeed complete! Login at http://localhost:5173")
print("    Username: admin")
print("    Password: admin123")
