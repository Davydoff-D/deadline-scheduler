from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from ..database import Base


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    color = Column(String, default="#3B82F6")  # Default blue

    # Relationships
    user = relationship("User", back_populates="categories")
    deadlines = relationship("Deadline", back_populates="category")
