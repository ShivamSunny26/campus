import uuid
from decimal import Decimal
from sqlalchemy import Boolean, ForeignKey, Numeric, String, Text, UniqueConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, UUIDPrimaryKey, TimestampMixin

class Listing(UUIDPrimaryKey, TimestampMixin, Base):
    __tablename__ = "listings"
    seller_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("campus_users.id", ondelete="RESTRICT"), index=True)
    title: Mapped[str] = mapped_column(String(140), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(String(40), index=True, nullable=False)
    price: Mapped[Decimal] = mapped_column(Numeric(12,2), nullable=False)
    price_unit: Mapped[str | None] = mapped_column(String(30))
    pickup_location: Mapped[str] = mapped_column(String(180), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="active", index=True, nullable=False)
    quantity: Mapped[int] = mapped_column(default=1)
    verified_seller_only: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    seller: Mapped["User"] = relationship()
    media: Mapped[list["ListingMedia"]] = relationship(back_populates="listing", cascade="all, delete-orphan")

    __table_args__ = (Index("ix_listing_discovery", "status", "category", "created_at"),)

class ListingMedia(UUIDPrimaryKey, Base):
    __tablename__ = "listing_media"
    listing_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("listings.id", ondelete="CASCADE"), index=True)
    object_key: Mapped[str] = mapped_column(String(500), nullable=False)
    mime_type: Mapped[str] = mapped_column(String(100), nullable=False)
    size_bytes: Mapped[int] = mapped_column(nullable=False)
    sort_order: Mapped[int] = mapped_column(default=0)
    listing: Mapped["Listing"] = relationship(back_populates="media")

class Favorite(UUIDPrimaryKey, Base):
    __tablename__ = "favorites"
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("campus_users.id", ondelete="CASCADE"), index=True)
    listing_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("listings.id", ondelete="CASCADE"), index=True)
    __table_args__ = (UniqueConstraint("user_id", "listing_id", name="uq_favorite_user_listing"),)

class Review(UUIDPrimaryKey, TimestampMixin, Base):
    __tablename__ = "reviews"
    deal_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("deals.id", ondelete="RESTRICT"), index=True)
    reviewer_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("campus_users.id", ondelete="RESTRICT"))
    reviewee_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("campus_users.id", ondelete="RESTRICT"))
    rating: Mapped[int] = mapped_column(nullable=False)
    comment: Mapped[str | None] = mapped_column(Text)
    __table_args__ = (UniqueConstraint("deal_id", "reviewer_id", name="uq_review_once"),)
