import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Deadline, User
import logging

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()


async def check_upcoming_deadlines():
    """Check for upcoming deadlines and send reminders."""
    db = SessionLocal()
    try:
        # Find deadlines in next hour
        now = datetime.now()
        one_hour_later = now + timedelta(hours=1)
        
        deadlines = db.query(Deadline).filter(
            Deadline.due_date >= now,
            Deadline.due_date <= one_hour_later,
            Deadline.is_completed == False
        ).all()
        
        for deadline in deadlines:
            logger.info(f"Upcoming deadline: {deadline.title} at {deadline.due_date}")
            # Here you would send notifications to bot/frontend
            
    except Exception as e:
        logger.error(f"Error checking deadlines: {e}")
    finally:
        db.close()


async def send_daily_summary():
    """Send daily summary of deadlines."""
    db = SessionLocal()
    try:
        users = db.query(User).filter(User.is_active == True).all()
        
        for user in users:
            tomorrow_start = (datetime.now() + timedelta(days=1)).replace(
                hour=0, minute=0, second=0, microsecond=0
            )
            tomorrow_end = tomorrow_start + timedelta(days=1)
            
            deadlines = db.query(Deadline).filter(
                Deadline.user_id == user.id,
                Deadline.due_date >= tomorrow_start,
                Deadline.due_date < tomorrow_end,
                Deadline.is_completed == False
            ).all()
            
            if deadlines:
                logger.info(f"Daily summary for user {user.telegram_id}: {len(deadlines)} deadlines")
                # Here you would send summary to bot/frontend
                
    except Exception as e:
        logger.error(f"Error sending daily summary: {e}")
    finally:
        db.close()


def start_scheduler():
    """Start background scheduler."""
    if not scheduler.running:
        # Check upcoming deadlines every 5 minutes
        scheduler.add_job(
            check_upcoming_deadlines,
            trigger=CronTrigger(minute="*/5"),
            id="check_upcoming",
            replace_existing=True
        )
        
        # Send daily summary at 09:00
        scheduler.add_job(
            send_daily_summary,
            trigger=CronTrigger(hour=9, minute=0),
            id="daily_summary",
            replace_existing=True
        )
        
        scheduler.start()
        logger.info("Scheduler started")


def stop_scheduler():
    """Stop background scheduler."""
    if scheduler.running:
        scheduler.shutdown()
        logger.info("Scheduler stopped")
