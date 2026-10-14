import os
import logging
from contextlib import asynccontextmanager
from collections.abc import AsyncIterator
from aiogram import Bot
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from app.database import init_db
from app.api import router as deadlines_router
from app.auth.auth_routes import router as auth_router
from scheduler import configure_bot, start_scheduler, stop_scheduler

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    """Application lifespan manager."""
    logger.info("Initializing database...")
    init_db()

    bot_token = os.getenv("BOT_TOKEN")
    if not bot_token:
        raise ValueError("BOT_TOKEN not found in environment variables")
    reminder_bot = Bot(token=bot_token)
    configure_bot(reminder_bot)

    logger.info("Starting scheduler...")
    start_scheduler()

    try:
        yield
    finally:
        logger.info("Stopping scheduler...")
        stop_scheduler()
        await reminder_bot.session.close()


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
