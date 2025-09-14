
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .db import SessionLocal
from .models import Entry
from .schemas import EntryIn, EntryOut
from .auth import require_user
from .ai import summarize_text

router = APIRouter(prefix="/entries", tags=["entries"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("", response_model=list[EntryOut])
def list_entries(user_id: str = Depends(require_user), db: Session = Depends(get_db)):
    return db.query(Entry).filter(Entry.user_id == user_id).order_by(Entry.created_at.desc()).all()

@router.post("", response_model=EntryOut)
def create_entry(payload: EntryIn, user_id: str = Depends(require_user), db: Session = Depends(get_db)):
    entry = Entry(user_id=user_id, title=payload.title, body=payload.body)
    db.add(entry); db.commit(); db.refresh(entry)
    return entry

@router.get("/{entry_id}", response_model=EntryOut)
def get_entry(entry_id: str, user_id: str = Depends(require_user), db: Session = Depends(get_db)):
    e = db.get(Entry, entry_id)
    if not e or e.user_id != user_id: raise HTTPException(status_code=404, detail="Not found")
    return e

@router.put("/{entry_id}", response_model=EntryOut)
def update_entry(entry_id: str, payload: EntryIn, user_id: str = Depends(require_user), db: Session = Depends(get_db)):
    e = db.get(Entry, entry_id)
    if not e or e.user_id != user_id: raise HTTPException(status_code=404, detail="Not found")
    e.title, e.body = payload.title, payload.body
    db.commit(); db.refresh(e); return e

@router.delete("/{entry_id}")
def delete_entry(entry_id: str, user_id: str = Depends(require_user), db: Session = Depends(get_db)):
    e = db.get(Entry, entry_id)
    if not e or e.user_id != user_id: raise HTTPException(status_code=404, detail="Not found")
    db.delete(e); db.commit(); return {"ok": True}

@router.post("/{entry_id}/summarize")
def summarize_entry(entry_id: str, user_id: str = Depends(require_user), db: Session = Depends(get_db)):
    e = db.get(Entry, entry_id)
    if not e or e.user_id != user_id: raise HTTPException(status_code=404, detail="Not found")
    e.ai_summary = summarize_text(e.body)
    db.commit(); db.refresh(e)
    return {"summary": e.ai_summary}
