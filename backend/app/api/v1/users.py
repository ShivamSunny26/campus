from fastapi import APIRouter, Depends
from app.api.deps import current_user
from app.models.user import User
from app.schemas.auth import UserResponse

router = APIRouter()

@router.get("/me", response_model=UserResponse)
async def get_me(user: User = Depends(current_user)):
    return user
