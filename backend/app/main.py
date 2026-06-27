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

# Define allowed origins for CORS
# In development, this would typically include your frontend's dev server (e.g., http://localhost:5173)
# In production, list your deployed frontend URLs (e.g., https://your-app.vercel.app)
# Do NOT use ["*"] with allow_credentials=True in production.
origins = [
    "http://localhost:5173", # Frontend development server
    "https://dinesh-git-main-kalimisetty-subhash-s-projects.vercel.app", # Example Vercel deployment URL
]

# Add any additional origins from environment settings, if applicable
# This allows for flexible configuration without hardcoding all origins
if settings.CORS_ORIGINS:
    for origin in settings.CORS_ORIGINS.split(","):
        stripped_origin = origin.strip()
        if stripped_origin and stripped_origin not in origins:
            origins.append(stripped_origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
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
