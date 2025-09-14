
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class EntryIn(BaseModel):
    title: str
    body: str

class EntryOut(EntryIn):
    id: str
    user_id: str
    ai_summary: Optional[str] = None
    created_at: datetime
    updated_at: datetime
