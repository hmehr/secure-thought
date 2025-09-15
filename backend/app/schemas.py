from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class User(BaseModel):
    id: str
    email: Optional[str] = None

class EntryBase(BaseModel):
    title: str
    body: str

class EntryCreate(EntryBase):
    pass

class Entry(EntryBase):
    id: str
    user_id: str
    ai_summary: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
