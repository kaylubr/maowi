from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


import server.modules.models
import server.files.models
import server.users.models
