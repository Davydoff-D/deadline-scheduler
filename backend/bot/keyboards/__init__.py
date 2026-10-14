from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup


def get_main_menu() -> InlineKeyboardMarkup:
    """Get main menu keyboard."""
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="📝 Добавить дедлайн", callback_data="add_deadline")],
        [InlineKeyboardButton(text="📅 Сегодня", callback_data="today")],
        [InlineKeyboardButton(text="📆 На неделю", callback_data="week")],
        [InlineKeyboardButton(text="✅ Завершенные", callback_data="completed")],
        [InlineKeyboardButton(text="🔗 Открыть веб-интерфейс", url="http://localhost:3000")]
    ])
    return keyboard


def get_priority_keyboard() -> InlineKeyboardMarkup:
    """Get priority selection keyboard."""
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="🔴 Высокий", callback_data="priority_high")],
        [InlineKeyboardButton(text="🟡 Средний", callback_data="priority_medium")],
        [InlineKeyboardButton(text="🟢 Низкий", callback_data="priority_low")],
        [InlineKeyboardButton(text="❌ Отмена", callback_data="cancel")]
    ])
    return keyboard


def get_deadline_actions(deadline_id: int) -> InlineKeyboardMarkup:
    """Get deadline action buttons."""
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="✅ Отметить выполненным", callback_data=f"complete_{deadline_id}")],
        [InlineKeyboardButton(text="🗑️ Удалить", callback_data=f"delete_{deadline_id}")],
        [InlineKeyboardButton(text="◀️ Назад", callback_data="back_to_menu")]
    ])
    return keyboard


def get_cancel_keyboard() -> InlineKeyboardMarkup:
    """Get cancel keyboard."""
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="❌ Отмена", callback_data="cancel")]
    ])
    return keyboard
