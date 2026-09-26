from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from server.db.base import Base


class Question(Base):
    __tablename__ = "questions"

    id: Mapped[int] = mapped_column(primary_key=True)
    module_id: Mapped[int] = mapped_column(
        ForeignKey("modules.id", ondelete="CASCADE"), index=True
    )
    prompt: Mapped[str] = mapped_column(Text)
    answer: Mapped[str] = mapped_column(String(255))
    distractors: Mapped[list[str]] = mapped_column(JSONB)
