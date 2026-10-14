import logging
import os
from datetime import datetime, timedelta

from aiogram import Bot
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import Deadline, User

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()
bot: Bot | None = None


def configure_bot(telegram_bot: Bot) -> None:
    """Configure the Telegram client used by scheduled notifications."""
    global bot
    bot = telegram_bot


async def check_upcoming_deadlines() -> None:
    """Send one reminder for each incomplete deadline due within one hour."""
    if bot is None:
        logger.warning("Reminder check skipped because Telegram bot is not configured")
        return

    now = datetime.now()
    one_hour_later = now + timedelta(hours=1)
    db: Session = SessionLocal()
    try:
        deadlines = db.query(Deadline).filter(
            Deadline.due_date >= now,
            Deadline.due_date <= one_hour_later,
            Deadline.is_completed.is_(False),
            Deadline.reminder_sent.is_(False),
        ).all()

        for deadline in deadlines:
            user = db.query(User).filter(User.id == deadline.user_id).first()
            if user is None or not user.is_active:
                continue

            await bot.send_message(
                chat_id=user.telegram_id,
                text=(
                    "⏰ Напоминание о дедлайне\n\n"
                    f"📝 {deadline.title}\n"
                    f"📅 {deadline.due_date.strftime('%d.%m.%Y %H:%M')}\n"
                    f"⚡ Приоритет: {deadline.priority}"
                ),
            )
            deadline.reminder_sent = True
            db.commit()
            logger.info("Reminder sent for deadline %s", deadline.id)
    finally:
        db.close()


async def send_daily_summary() -> None:
    """Send active users a summary of their incomplete deadlines for tomorrow."""
    if bot is None:
        logger.warning("Daily summary skipped because Telegram bot is not configured")
        return

    db: Session = SessionLocal()
    try:
        users = db.query(User).filter(User.is_active.is_(True)).all()
        tomorrow_start = (datetime.now() + timedelta(days=1)).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        tomorrow_end = tomorrow_start + timedelta(days=1)

        for user in users:
            deadlines = db.query(Deadline).filter(
                Deadline.user_id == user.id,
                Deadline.due_date >= tomorrow_start,
                Deadline.due_date < tomorrow_end,
                Deadline.is_completed.is_(False),
            ).order_by(Deadline.due_date).all()
            if not deadlines:
                continue

            summary = "\n".join(
                f"• {deadline.due_date.strftime('%H:%M')} — {deadline.title}"
                for deadline in deadlines
            )
            await bot.send_message(
                chat_id=user.telegram_id,
                text=f"📆 Дедлайны на завтра:\n\n{summary}",
            )
            logger.info("Daily summary sent to user %s", user.id)
    finally:
        db.close()


def start_scheduler() -> None:
    """Start scheduled reminder jobs."""
    if scheduler.running:
        return

    timezone = os.getenv("SCHEDULER_TIMEZONE", "Europe/Moscow")
    scheduler.add_job(
        check_upcoming_deadlines,
        trigger=CronTrigger(minute="*/5", timezone=timezone),
        id="check_upcoming",
        replace_existing=True,
    )
    scheduler.add_job(
        send_daily_summary,
        trigger=CronTrigger(hour=9, minute=0, timezone=timezone),
        id="daily_summary",
        replace_existing=True,
    )
    scheduler.start()
    logger.info("Scheduler started with timezone %s", timezone)


def stop_scheduler() -> None:
    """Stop scheduled reminder jobs."""
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("Scheduler stopped")
