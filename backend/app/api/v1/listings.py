from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import current_user
from app.db.session import get_db
from app.models.marketplace import Listing
from app.models.user import User
from app.schemas.listing import ListingCreate, ListingResponse

router = APIRouter()

@router.post("", response_model=ListingResponse, status_code=201)
async def create_listing(data: ListingCreate, user: User = Depends(current_user), db: AsyncSession = Depends(get_db)):
    listing = Listing(seller_id=user.id, **data.model_dump())
    db.add(listing)
    await db.commit()
    await db.refresh(listing)
    return listing

@router.get("", response_model=list[ListingResponse])
async def list_listings(
    category: str | None = Query(default=None, max_length=40),
    limit: int = Query(default=20, ge=1, le=50),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    query = select(Listing).where(Listing.status == "active").order_by(Listing.created_at.desc()).offset(offset).limit(limit)
    if category:
        query = query.where(Listing.category == category)
    result = await db.scalars(query)
    return list(result)

@router.get("/{listing_id}", response_model=ListingResponse)
async def get_listing(listing_id: UUID, db: AsyncSession = Depends(get_db)):
    listing = await db.get(Listing, listing_id)
    if not listing or listing.status == "deleted":
        raise HTTPException(404, "Listing not found")
    return listing

@router.patch("/{listing_id}", response_model=ListingResponse)
async def update_listing(listing_id: UUID, data: ListingCreate, user: User = Depends(current_user), db: AsyncSession = Depends(get_db)):
    listing = await db.get(Listing, listing_id)
    if not listing:
        raise HTTPException(404, "Listing not found")
    if listing.seller_id != user.id and user.role not in {"moderator", "admin"}:
        raise HTTPException(403, "You do not own this listing")
    for key, value in data.model_dump().items():
        setattr(listing, key, value)
    await db.commit()
    await db.refresh(listing)
    return listing

@router.delete("/{listing_id}", status_code=204)
async def delete_listing(listing_id: UUID, user: User = Depends(current_user), db: AsyncSession = Depends(get_db)):
    listing = await db.get(Listing, listing_id)
    if not listing:
        raise HTTPException(404, "Listing not found")
    if listing.seller_id != user.id and user.role not in {"moderator", "admin"}:
        raise HTTPException(403, "You do not own this listing")
    listing.status = "deleted"
    await db.commit()
