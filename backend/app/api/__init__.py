from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from ..database import get_db
from ..models import Deadline, User
from ..schemas import DeadlineCreate, DeadlineUpdate, DeadlineResponse
from ..auth import get_current_user_id

router = APIRouter(prefix="/deadlines", tags=["deadlines"])


@router.get("/", response_model=list[DeadlineResponse])
def get_deadlines(
    skip: int = 0,
    limit: int = 100,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Get all deadlines for user."""
    deadlines = db.query(Deadline).filter(
        Deadline.user_id == user_id
    ).offset(skip).limit(limit).all()
    return deadlines


@router.get("/{deadline_id}", response_model=DeadlineResponse)
def get_deadline(
    deadline_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Get single deadline."""
    deadline = db.query(Deadline).filter(
        Deadline.id == deadline_id,
        Deadline.user_id == user_id
    ).first()

    if not deadline:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deadline not found"
        )
    return deadline


@router.post("/", response_model=DeadlineResponse, status_code=status.HTTP_201_CREATED)
def create_deadline(
    deadline: DeadlineCreate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Create new deadline."""
    db_deadline = Deadline(
        user_id=user_id,
        title=deadline.title,
        description=deadline.description,
        due_date=deadline.due_date,
        priority=deadline.priority,
        category_id=deadline.category_id
    )
    db.add(db_deadline)
    db.commit()
    db.refresh(db_deadline)
    return db_deadline


@router.put("/{deadline_id}", response_model=DeadlineResponse)
def update_deadline(
    deadline_id: int,
    deadline_update: DeadlineUpdate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Update deadline."""
    db_deadline = db.query(Deadline).filter(
        Deadline.id == deadline_id,
        Deadline.user_id == user_id
    ).first()

    if not db_deadline:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deadline not found"
        )

    update_data = deadline_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_deadline, key, value)

    db.add(db_deadline)
    db.commit()
    db.refresh(db_deadline)
    return db_deadline


@router.delete("/{deadline_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_deadline(
    deadline_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Delete deadline."""
    db_deadline = db.query(Deadline).filter(
        Deadline.id == deadline_id,
        Deadline.user_id == user_id
    ).first()

    if not db_deadline:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deadline not found"
        )

    db.delete(db_deadline)
    db.commit()
