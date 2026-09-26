from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


import server.modules.models
import server.attempts.models
import server.files.models
import server.questions.models
import server.users.models
