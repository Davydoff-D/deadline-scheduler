from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class CategoryBase(BaseModel):
    name: str
    color: str = "#3B82F6"


class CategoryCreate(CategoryBase):
    pass


class CategoryResponse(CategoryBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True


class DeadlineBase(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: datetime
    priority: str = "medium"
    category_id: Optional[int] = None


class DeadlineCreate(DeadlineBase):
    pass


class DeadlineUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    priority: Optional[str] = None
    category_id: Optional[int] = None
    is_completed: Optional[bool] = None


class DeadlineResponse(DeadlineBase):
    id: int
    user_id: int
    is_completed: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    category: Optional[CategoryResponse] = None

    class Config:
        from_attributes = True


class UserBase(BaseModel):
    telegram_id: int
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None


class UserCreate(UserBase):
    pass


class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    deadlines: list[DeadlineResponse] = []
    categories: list[CategoryResponse] = []

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class TelegramAuthRequest(BaseModel):
    telegram_id: int
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None


class LoginTokenRequest(BaseModel):
    """Request schema for requesting login via deep link."""
    pass


class LoginTokenResponse(BaseModel):
    """Response with one-time token and deep link."""
    token: str
    deep_link: str
    expires_in: int  # seconds


class LoginCompleteRequest(BaseModel):
    """Request schema for completing login with token."""
    token: str
