import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from app.database import init_db
from app.api import router as deadlines_router
from app.auth.auth_routes import router as auth_router
from scheduler import start_scheduler, stop_scheduler

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    logger.info("Initializing database...")
    init_db()
    
    logger.info("Starting scheduler...")
    start_scheduler()
    
    yield
    
    logger.info("Stopping scheduler...")
    stop_scheduler()


app = FastAPI(
    title="Deadline Scheduler API",
    description="API for managing deadlines with Telegram bot integration",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(deadlines_router)


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Deadline Scheduler API",
        "docs": "/docs",
        "health": "/health"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
