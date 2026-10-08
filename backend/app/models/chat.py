import uuid
from sqlalchemy import ForeignKey, String, Text, UniqueConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, UUIDPrimaryKey, TimestampMixin

class Conversation(UUIDPrimaryKey, TimestampMixin, Base):
    __tablename__ = "conversations"
    listing_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("listings.id", ondelete="SET NULL"), index=True)
    status: Mapped[str] = mapped_column(String(20), default="open", nullable=False)
    members: Mapped[list["ConversationMember"]] = relationship(back_populates="conversation", cascade="all, delete-orphan")
    messages: Mapped[list["Message"]] = relationship(back_populates="conversation", cascade="all, delete-orphan")

class ConversationMember(UUIDPrimaryKey, Base):
    __tablename__ = "conversation_members"
    conversation_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("conversations.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("campus_users.id", ondelete="CASCADE"), index=True)
    role: Mapped[str] = mapped_column(String(20), default="member")
    conversation: Mapped["Conversation"] = relationship(back_populates="members")
    __table_args__ = (UniqueConstraint("conversation_id", "user_id", name="uq_conversation_member"),)

class Message(UUIDPrimaryKey, TimestampMixin, Base):
    __tablename__ = "messages"
    conversation_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("conversations.id", ondelete="CASCADE"), index=True)
    sender_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("campus_users.id", ondelete="RESTRICT"), index=True)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    message_type: Mapped[str] = mapped_column(String(20), default="text", nullable=False)
    attachment_key: Mapped[str | None] = mapped_column(String(500))
    conversation: Mapped["Conversation"] = relationship(back_populates="messages")
    __table_args__ = (Index("ix_messages_conversation_created", "conversation_id", "created_at"),)
