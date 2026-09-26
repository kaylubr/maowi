from enum import StrEnum

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from server.db.base import Base


class ModuleStatus(StrEnum):
    draft = "draft"
    generating = "generating"
    ready = "ready"
    failed = "failed"


class Module(Base):
    __tablename__ = "modules"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    name: Mapped[str] = mapped_column(String(255))
    status: Mapped[str] = mapped_column(String(16), default=ModuleStatus.draft)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
