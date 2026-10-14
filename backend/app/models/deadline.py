from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from enum import Enum as PyEnum
from ..database import Base


class PriorityEnum(PyEnum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class Deadline(Base):
    __tablename__ = "deadlines"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    due_date = Column(DateTime(timezone=True), nullable=False)
    priority = Column(String, default="medium")
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    is_completed = Column(Boolean, default=False)
    reminder_sent = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="deadlines")
    category = relationship("Category", back_populates="deadlines")
