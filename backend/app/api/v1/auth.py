from datetime import datetime, timezone
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import current_user
from app.core.rate_limit import enforce_rate_limit
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token, hash_refresh_token, refresh_expiry
from app.db.session import get_db
from app.models.user import User, RefreshSession
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse, UserResponse

router = APIRouter()

@router.post("/register", response_model=UserResponse, status_code=201)
async def register(data: RegisterRequest, request: Request, db: AsyncSession = Depends(get_db)):
    await enforce_rate_limit(f"register:{request.client.host}", 3, 300)
    existing = await db.scalar(select(User).where(User.email == data.email.lower()))
    if existing:
        raise HTTPException(409, "An account with this email already exists")
    user = User(
        email=data.email.lower(),
        password_hash=hash_password(data.password),
        full_name=data.full_name.strip(),
        campus_name=data.campus_name.strip(),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, request: Request, db: AsyncSession = Depends(get_db)):
    await enforce_rate_limit(f"login:{request.client.host}:{data.email.lower()}", 5, 60)
    user = await db.scalar(select(User).where(User.email == data.email.lower()))
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email or password")
    if not user.is_active or user.is_banned:
        raise HTTPException(403, "Account unavailable")
    access = create_access_token(str(user.id), user.role)
    refresh = create_refresh_token()
    session = RefreshSession(
        user_id=user.id,
        token_hash=hash_refresh_token(refresh),
        expires_at=refresh_expiry(),
        user_agent=request.headers.get("user-agent"),
        ip_address=request.client.host if request.client else None,
    )
    db.add(session)
    await db.commit()
    return TokenResponse(access_token=access, refresh_token=refresh)

@router.post("/refresh", response_model=TokenResponse)
async def refresh(refresh_token: str, request: Request, db: AsyncSession = Depends(get_db)):
    token_hash = hash_refresh_token(refresh_token)
    session = await db.scalar(select(RefreshSession).where(RefreshSession.token_hash == token_hash))
    now = datetime.now(timezone.utc)
    if not session or session.revoked_at or session.expires_at <= now:
        raise HTTPException(401, "Invalid refresh token")
    user = await db.get(User, session.user_id)
    if not user or not user.is_active or user.is_banned:
        raise HTTPException(403, "Account unavailable")
    new_refresh = create_refresh_token()
    new_hash = hash_refresh_token(new_refresh)
    session.revoked_at = now
    session.replaced_by_hash = new_hash
    db.add(RefreshSession(
        user_id=user.id,
        token_hash=new_hash,
        expires_at=refresh_expiry(),
        user_agent=request.headers.get("user-agent"),
        ip_address=request.client.host if request.client else None,
    ))
    await db.commit()
    return TokenResponse(access_token=create_access_token(str(user.id), user.role), refresh_token=new_refresh)

@router.post("/logout", status_code=204)
async def logout(refresh_token: str, db: AsyncSession = Depends(get_db)):
    token_hash = hash_refresh_token(refresh_token)
    session = await db.scalar(select(RefreshSession).where(RefreshSession.token_hash == token_hash))
    if session and not session.revoked_at:
        session.revoked_at = datetime.now(timezone.utc)
        await db.commit()

@router.get("/me", response_model=UserResponse)
async def me(user: User = Depends(current_user)):
    return user
