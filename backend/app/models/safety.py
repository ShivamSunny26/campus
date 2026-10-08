import uuid
from sqlalchemy import ForeignKey, String, Text, JSON, Index
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base, UUIDPrimaryKey, TimestampMixin

class Report(UUIDPrimaryKey, TimestampMixin, Base):
    __tablename__ = "reports"
    reporter_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("campus_users.id", ondelete="RESTRICT"), index=True)
    reported_user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("campus_users.id", ondelete="RESTRICT"))
    listing_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("listings.id", ondelete="SET NULL"))
    reason: Mapped[str] = mapped_column(String(50), nullable=False)
    details: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(20), default="open", index=True, nullable=False)

class AuditEvent(UUIDPrimaryKey, TimestampMixin, Base):
    __tablename__ = "audit_events"
    actor_user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("campus_users.id", ondelete="SET NULL"), index=True)
    action: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    entity_type: Mapped[str | None] = mapped_column(String(50))
    entity_id: Mapped[uuid.UUID | None]
    ip_address: Mapped[str | None] = mapped_column(String(64))
    metadata_json: Mapped[dict | None] = mapped_column(JSON)
    __table_args__ = (Index("ix_audit_created", "created_at"),)
