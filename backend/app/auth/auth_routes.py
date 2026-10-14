from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User
from ..schemas import TelegramAuthRequest, TokenResponse, UserResponse
from ..auth import create_access_token, verify_token

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/telegram", response_model=TokenResponse)
def telegram_login(
    auth_data: TelegramAuthRequest,
    db: Session = Depends(get_db)
):
    """Authenticate user via Telegram."""
    user = db.query(User).filter(User.telegram_id == auth_data.telegram_id).first()

    if not user:
        # Create new user if not exists
        user = User(
            telegram_id=auth_data.telegram_id,
            username=auth_data.username,
            first_name=auth_data.first_name,
            last_name=auth_data.last_name
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # Create access token
    access_token = create_access_token(
        data={"sub": str(user.id), "telegram_id": user.telegram_id}
    )

    return TokenResponse(
        access_token=access_token,
        user=UserResponse.model_validate(user)
    )


@router.post("/verify-token")
def verify_token_endpoint(token: str):
    """Verify JWT token."""
    payload = verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    return {"valid": True, "user_id": payload.get("sub")}


@router.get("/me", response_model=UserResponse)
def get_current_user(
    user_id: int,
    db: Session = Depends(get_db)
):
    """Get current user info."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    return user
