import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from aiogram import Router, F
from aiogram.types import Message, CallbackQuery
from aiogram.filters import Command, CommandStart
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import User, Deadline
from app.auth import create_access_token
import os
import httpx
from bot.keyboards import (
    get_main_menu,
    get_priority_keyboard,
    get_deadline_actions,
    get_cancel_keyboard
)

router = Router()


class AddDeadlineState(StatesGroup):
    waiting_for_title = State()
    waiting_for_date = State()
    waiting_for_priority = State()


def get_db():
    """Get database session."""
    db = SessionLocal()
    try:
        return db
    finally:
        db.close()


@router.message(CommandStart(deep_link=True))
async def cmd_start_deep_link(message: Message):
    """Handle /start with deep link parameter."""
    args = message.text.split(maxsplit=1)
    
    if len(args) < 2:
        # No deep link - regular start
        await cmd_start(message)
        return
    
    param = args[1]
    
    if param.startswith("login_"):
        # Login flow
        login_token = param[6:]  # Remove "login_" prefix
        
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.telegram_id == message.from_user.id).first()
            
            if not user:
                user = User(
                    telegram_id=message.from_user.id,
                    username=message.from_user.username,
                    first_name=message.from_user.first_name,
                    last_name=message.from_user.last_name
                )
                db.add(user)
                db.commit()
                db.refresh(user)
            
            # Generate JWT
            jwt_token = create_access_token(
                data={"sub": str(user.id), "telegram_id": user.telegram_id}
            )
            
            backend_url = os.getenv("BACKEND_URL", "http://backend:8000")
            async with httpx.AsyncClient() as client:
                await client.post(
                    f"{backend_url}/auth/store-jwt",
                    params={
                        "login_token": login_token,
                        "jwt": jwt_token,
                        "user_id": user.id
                    }
                )
            
            await message.answer(
                f"✅ Авторизация успешна!\n\n"
                f"Теперь можешь вернуться в веб-интерфейс.\n"
                f"Окно браузера обновится автоматически."
            )
        finally:
            db.close()
    else:
        # Unknown parameter - regular start
        await cmd_start(message)


@router.message(Command("start"))
async def cmd_start(message: Message):
    """Handle /start command."""
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.telegram_id == message.from_user.id).first()
        
        if not user:
            user = User(
                telegram_id=message.from_user.id,
                username=message.from_user.username,
                first_name=message.from_user.first_name,
                last_name=message.from_user.last_name
            )
            db.add(user)
            db.commit()
        
        await message.answer(
            f"👋 Привет, {message.from_user.first_name}!\n\n"
            "Я помогу тебе управлять дедлайнами.\n"
            "Выбери действие:",
            reply_markup=get_main_menu()
        )
    finally:
        db.close()


@router.callback_query(F.data == "add_deadline")
async def start_add_deadline(callback: CallbackQuery, state: FSMContext):
    """Start adding new deadline."""
    await callback.message.edit_text(
        "📝 Введи название дедлайна:",
        reply_markup=get_cancel_keyboard()
    )
    await state.set_state(AddDeadlineState.waiting_for_title)
    await callback.answer()


@router.message(AddDeadlineState.waiting_for_title)
async def process_title(message: Message, state: FSMContext):
    """Process deadline title."""
    await state.update_data(title=message.text)
    await message.answer(
        "📅 Введи дату и время дедлайна в формате:\n"
        "ДД.ММ.ГГГГ ЧЧ:ММ\n\n"
        "Например: 31.12.2024 23:59",
        reply_markup=get_cancel_keyboard()
    )
    await state.set_state(AddDeadlineState.waiting_for_date)


@router.message(AddDeadlineState.waiting_for_date)
async def process_date(message: Message, state: FSMContext):
    """Process deadline date."""
    try:
        due_date = datetime.strptime(message.text, "%d.%m.%Y %H:%M")
        await state.update_data(due_date=due_date)
        await message.answer(
            "⚡ Выбери приоритет:",
            reply_markup=get_priority_keyboard()
        )
        await state.set_state(AddDeadlineState.waiting_for_priority)
    except ValueError:
        await message.answer(
            "❌ Неверный формат даты. Попробуй снова:\n"
            "ДД.ММ.ГГГГ ЧЧ:ММ\n\n"
            "Например: 31.12.2024 23:59"
        )


@router.callback_query(F.data.startswith("priority_"))
async def process_priority(callback: CallbackQuery, state: FSMContext):
    """Process deadline priority."""
    priority = callback.data.split("_")[1]
    data = await state.get_data()
    
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.telegram_id == callback.from_user.id).first()
        
        deadline = Deadline(
            user_id=user.id,
            title=data["title"],
            due_date=data["due_date"],
            priority=priority
        )
        db.add(deadline)
        db.commit()
        
        await callback.message.edit_text(
            f"✅ Дедлайн создан!\n\n"
            f"📝 {data['title']}\n"
            f"📅 {data['due_date'].strftime('%d.%m.%Y %H:%M')}\n"
            f"⚡ Приоритет: {priority}",
            reply_markup=get_main_menu()
        )
        await state.clear()
    finally:
        db.close()
    
    await callback.answer()


@router.callback_query(F.data == "today")
async def show_today(callback: CallbackQuery):
    """Show today's deadlines."""
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.telegram_id == callback.from_user.id).first()
        
        today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start + timedelta(days=1)
        
        deadlines = db.query(Deadline).filter(
            Deadline.user_id == user.id,
            Deadline.due_date >= today_start,
            Deadline.due_date < today_end,
            Deadline.is_completed == False
        ).order_by(Deadline.due_date).all()
        
        if not deadlines:
            await callback.message.edit_text(
                "📅 На сегодня дедлайнов нет!",
                reply_markup=get_main_menu()
            )
        else:
            text = "📅 Дедлайны на сегодня:\n\n"
            for d in deadlines:
                priority_emoji = {"high": "🔴", "medium": "🟡", "low": "🟢"}[d.priority]
                text += f"{priority_emoji} {d.title}\n⏰ {d.due_date.strftime('%H:%M')}\n\n"
            
            await callback.message.edit_text(text, reply_markup=get_main_menu())
    finally:
        db.close()
    
    await callback.answer()


@router.callback_query(F.data == "week")
async def show_week(callback: CallbackQuery):
    """Show this week's deadlines."""
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.telegram_id == callback.from_user.id).first()
        
        week_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        week_end = week_start + timedelta(days=7)
        
        deadlines = db.query(Deadline).filter(
            Deadline.user_id == user.id,
            Deadline.due_date >= week_start,
            Deadline.due_date < week_end,
            Deadline.is_completed == False
        ).order_by(Deadline.due_date).all()
        
        if not deadlines:
            await callback.message.edit_text(
                "📆 На эту неделю дедлайнов нет!",
                reply_markup=get_main_menu()
            )
        else:
            text = "📆 Дедлайны на неделю:\n\n"
            for d in deadlines:
                priority_emoji = {"high": "🔴", "medium": "🟡", "low": "🟢"}[d.priority]
                text += f"{priority_emoji} {d.title}\n📅 {d.due_date.strftime('%d.%m %H:%M')}\n\n"
            
            await callback.message.edit_text(text, reply_markup=get_main_menu())
    finally:
        db.close()
    
    await callback.answer()


@router.callback_query(F.data == "completed")
async def show_completed(callback: CallbackQuery):
    """Show completed deadlines."""
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.telegram_id == callback.from_user.id).first()
        
        deadlines = db.query(Deadline).filter(
            Deadline.user_id == user.id,
            Deadline.is_completed == True
        ).order_by(Deadline.updated_at.desc()).limit(10).all()
        
        if not deadlines:
            await callback.message.edit_text(
                "✅ Завершенных дедлайнов пока нет!",
                reply_markup=get_main_menu()
            )
        else:
            text = "✅ Последние завершенные дедлайны:\n\n"
            for d in deadlines:
                text += f"• {d.title}\n"
            
            await callback.message.edit_text(text, reply_markup=get_main_menu())
    finally:
        db.close()
    
    await callback.answer()


@router.callback_query(F.data.startswith("complete_"))
async def complete_deadline(callback: CallbackQuery):
    """Mark deadline as completed."""
    deadline_id = int(callback.data.split("_")[1])
    
    db = SessionLocal()
    try:
        deadline = db.query(Deadline).filter(Deadline.id == deadline_id).first()
        deadline.is_completed = True
        db.commit()
        
        await callback.message.edit_text(
            f"✅ Дедлайн '{deadline.title}' отмечен как выполненный!",
            reply_markup=get_main_menu()
        )
    finally:
        db.close()
    
    await callback.answer()


@router.callback_query(F.data.startswith("delete_"))
async def delete_deadline(callback: CallbackQuery):
    """Delete deadline."""
    deadline_id = int(callback.data.split("_")[1])
    
    db = SessionLocal()
    try:
        deadline = db.query(Deadline).filter(Deadline.id == deadline_id).first()
        title = deadline.title
        db.delete(deadline)
        db.commit()
        
        await callback.message.edit_text(
            f"🗑️ Дедлайн '{title}' удален!",
            reply_markup=get_main_menu()
        )
    finally:
        db.close()
    
    await callback.answer()


@router.callback_query(F.data == "cancel")
async def cancel_action(callback: CallbackQuery, state: FSMContext):
    """Cancel current action."""
    await state.clear()
    await callback.message.edit_text(
        "❌ Действие отменено",
        reply_markup=get_main_menu()
    )
    await callback.answer()


@router.callback_query(F.data == "back_to_menu")
async def back_to_menu(callback: CallbackQuery):
    """Return to main menu."""
    await callback.message.edit_text(
        "Главное меню:",
        reply_markup=get_main_menu()
    )
    await callback.answer()
