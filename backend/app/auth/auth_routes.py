from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import secrets
from ..database import get_db
from ..models import User
from ..schemas import (
    TelegramAuthRequest, 
    TokenResponse, 
    UserResponse,
    LoginTokenRequest,
    LoginTokenResponse,
    LoginCompleteRequest
)
from ..auth import create_access_token, verify_token

router = APIRouter(prefix="/auth", tags=["auth"])

# In-memory store for one-time login tokens (token -> expiry)
# Production: use Redis with TTL
_login_tokens: dict[str, dict] = {}


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


@router.post("/request-login", response_model=LoginTokenResponse)
def request_login(request: LoginTokenRequest):
    """Generate one-time token and deep link for bot login."""
    token = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(minutes=5)
    
    _login_tokens[token] = {
        "expires_at": expires_at,
        "jwt": None  # Will be set by bot after user confirms
    }
    
    # Clean up expired tokens
    now = datetime.utcnow()
    expired = [k for k, v in _login_tokens.items() if v["expires_at"] < now]
    for k in expired:
        del _login_tokens[k]
    
    bot_username = "aisheduler_bot"
    deep_link = f"https://t.me/{bot_username}?start=login_{token}"
    
    return LoginTokenResponse(
        token=token,
        deep_link=deep_link,
        expires_in=300  # 5 minutes
    )


@router.post("/complete-login", response_model=TokenResponse)
def complete_login(
    request: LoginCompleteRequest,
    db: Session = Depends(get_db)
):
    """Poll for JWT after clicking deep link."""
    token_data = _login_tokens.get(request.token)
    
    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid or expired token"
        )
    
    if token_data["expires_at"] < datetime.utcnow():
        del _login_tokens[request.token]
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Token expired"
        )
    
    if not token_data.get("jwt"):
        raise HTTPException(
            status_code=status.HTTP_202_ACCEPTED,
            detail="Waiting for user confirmation in Telegram"
        )
    
    # JWT ready - return it and clean up
    jwt_token = token_data["jwt"]
    user_id = token_data["user_id"]
    del _login_tokens[request.token]
    
    user = db.query(User).filter(User.id == user_id).first()
    
    return TokenResponse(
        access_token=jwt_token,
        user=UserResponse.model_validate(user)
    )


def store_jwt_for_token(login_token: str, jwt: str, user_id: int):
    """Called by bot handler to store JWT after user confirmation."""
    if login_token in _login_tokens:
        _login_tokens[login_token]["jwt"] = jwt
        _login_tokens[login_token]["user_id"] = user_id


@router.post("/store-jwt")
def store_jwt_endpoint(login_token: str, jwt: str, user_id: int):
    """Internal endpoint for bot to store JWT."""
    store_jwt_for_token(login_token, jwt, user_id)
    return {"status": "stored"}
