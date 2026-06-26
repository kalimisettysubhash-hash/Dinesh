from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .core.database import Base, engine
from .core.config import settings
from .api import auth, customers, purchases, analytics

# Create all tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="TanviCRM API",
    description="Customer CRM & Analytics Dashboard for Tanvi Boutique",
    version="1.0.0",
)

# CORS – allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        origin.strip()
        for origin in settings.CORS_ORIGINS.split(",")
        if origin.strip()
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(customers.router)
app.include_router(purchases.router)
app.include_router(analytics.router)


@app.get("/")
def root():
    return {"message": "TanviCRM API is running 🌸"}
