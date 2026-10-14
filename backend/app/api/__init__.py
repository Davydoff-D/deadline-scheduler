from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from ..database import get_db
from ..models import Deadline, User
from ..schemas import DeadlineCreate, DeadlineUpdate, DeadlineResponse

router = APIRouter(prefix="/deadlines", tags=["deadlines"])


def get_current_user(
    user_id: int,
    db: Session = Depends(get_db)
) -> User:
    """Get current user from database."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    return user


@router.get("/", response_model=list[DeadlineResponse])
def get_deadlines(
    user_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all deadlines for user."""
    user = get_current_user(user_id, db)
    deadlines = db.query(Deadline).filter(
        Deadline.user_id == user.id
    ).offset(skip).limit(limit).all()
    return deadlines


@router.get("/{deadline_id}", response_model=DeadlineResponse)
def get_deadline(
    deadline_id: int,
    user_id: int,
    db: Session = Depends(get_db)
):
    """Get single deadline."""
    user = get_current_user(user_id, db)
    deadline = db.query(Deadline).filter(
        Deadline.id == deadline_id,
        Deadline.user_id == user.id
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
    user_id: int,
    db: Session = Depends(get_db)
):
    """Create new deadline."""
    user = get_current_user(user_id, db)

    db_deadline = Deadline(
        user_id=user.id,
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
    user_id: int,
    db: Session = Depends(get_db)
):
    """Update deadline."""
    user = get_current_user(user_id, db)
    db_deadline = db.query(Deadline).filter(
        Deadline.id == deadline_id,
        Deadline.user_id == user.id
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
    user_id: int,
    db: Session = Depends(get_db)
):
    """Delete deadline."""
    user = get_current_user(user_id, db)
    db_deadline = db.query(Deadline).filter(
        Deadline.id == deadline_id,
        Deadline.user_id == user.id
    ).first()

    if not db_deadline:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deadline not found"
        )

    db.delete(db_deadline)
    db.commit()
