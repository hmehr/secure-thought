import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .db import Base, engine
from .routes_auth import router as auth_router
from .routes_entries import router as entries_router
from dotenv import load_dotenv
from pathlib import Path



ENV_PATH = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=ENV_PATH, override=True)

# Initialize FastAPI app first
app = FastAPI(title="Secure Journal API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_ORIGIN", "*")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/health")
def health(): 
    return {"ok": True}

# Include routers
app.include_router(auth_router)
app.include_router(entries_router)

# Create database tables
Base.metadata.create_all(bind=engine)
