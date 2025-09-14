
from sqlalchemy import Column, String, Text, DateTime, func
from .db import Base
import uuid

def uuid4_str(): return str(uuid.uuid4())

class Entry(Base):
    __tablename__ = "entries"
    id = Column(String, primary_key=True, default=uuid4_str)
    user_id = Column(String, index=True, nullable=False)
    title = Column(String(200), nullable=False)
    body = Column(Text, nullable=False)
    ai_summary = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())
