import uuid
from datetime import datetime
from decimal import Decimal
from sqlalchemy import DateTime, ForeignKey, Numeric, String, Text, UniqueConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base, UUIDPrimaryKey, TimestampMixin

class Offer(UUIDPrimaryKey, TimestampMixin, Base):
    __tablename__ = "offers"
    conversation_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("conversations.id", ondelete="CASCADE"), index=True)
    sender_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("campus_users.id", ondelete="RESTRICT"))
    amount: Mapped[Decimal] = mapped_column(Numeric(12,2), nullable=False)
    note: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    __table_args__ = (Index("ix_offer_conversation_status", "conversation_id", "status"),)

class Deal(UUIDPrimaryKey, TimestampMixin, Base):
    __tablename__ = "deals"
    listing_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("listings.id", ondelete="RESTRICT"), index=True)
    conversation_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("conversations.id", ondelete="RESTRICT"), unique=True)
    buyer_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("campus_users.id", ondelete="RESTRICT"), index=True)
    seller_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("campus_users.id", ondelete="RESTRICT"), index=True)
    agreed_price: Mapped[Decimal] = mapped_column(Numeric(12,2), nullable=False)
    quantity: Mapped[int] = mapped_column(default=1)
    pickup_location: Mapped[str] = mapped_column(String(180), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="confirmed", index=True, nullable=False)
    __table_args__ = (Index("ix_deal_seller_status", "seller_id", "status"),)
