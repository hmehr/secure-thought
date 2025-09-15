from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from .auth import require_user_id
from .schemas import Entry, EntryCreate
from .models import Entry as EntryModel
from .db import get_db

router = APIRouter(prefix="/entries", tags=["entries"])

@router.post("", response_model=Entry)
async def create_entry(
    entry: EntryCreate, 
    user_id: str = Depends(require_user_id),
    db: Session = Depends(get_db)
):
    """Create a new journal entry"""
    db_entry = EntryModel(
        user_id=user_id,
        title=entry.title,
        body=entry.body
    )
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    return db_entry

@router.get("", response_model=List[Entry])
async def get_entries(
    user_id: str = Depends(require_user_id),
    db: Session = Depends(get_db)
):
    """Get all entries for the current user"""
    return db.query(EntryModel).filter(EntryModel.user_id == user_id).all()

@router.get("/{entry_id}", response_model=Entry)
async def get_entry(
    entry_id: str,
    user_id: str = Depends(require_user_id),
    db: Session = Depends(get_db)
):
    """Get a specific entry"""
    entry = db.query(EntryModel).filter(
        EntryModel.id == entry_id,
        EntryModel.user_id == user_id
    ).first()
    
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    return entry
