
import os, logging
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from .auth import require_user_id
from .schemas import Entry, EntryCreate
from .models import Entry as EntryModel
from .db import get_db
from app.op_client import OnePasswordConnect
from openai import OpenAI

router = APIRouter(prefix="/entries", tags=["entries"])

@router.post("", response_model=Entry)
async def create_entry(
    entry: EntryCreate, 
    user_id: str = Depends(require_user_id),
    db: Session = Depends(get_db)
):
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
    return db.query(EntryModel).filter(EntryModel.user_id == user_id).all()

@router.get("/{entry_id}", response_model=Entry)
async def get_entry(
    entry_id: str,
    user_id: str = Depends(require_user_id),
    db: Session = Depends(get_db)
):
    entry = db.query(EntryModel).filter(
        EntryModel.id == entry_id,
        EntryModel.user_id == user_id
    ).first()
    
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    return entry


@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_entry(
    entry_id: str,
    user_id: str = Depends(require_user_id),
    db: Session = Depends(get_db),
):
    entry = (
        db.query(EntryModel)
        .filter(EntryModel.id == entry_id, EntryModel.user_id == user_id)
        .first()
    )
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")

    db.delete(entry)
    db.commit()
    
    return

@router.put("/{entry_id}", response_model=Entry)
async def update_entry(
    entry_id: str,
    entry: EntryCreate,
    user_id: str = Depends(require_user_id),
    db: Session = Depends(get_db),
):
    db_entry = (
        db.query(EntryModel)
        .filter(EntryModel.id == entry_id, EntryModel.user_id == user_id)
        .first()
    )
    if not db_entry:
        raise HTTPException(status_code=404, detail="Entry not found")

    db_entry.title = entry.title
    db_entry.body = entry.body

    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    return db_entry

@router.post("/{entry_id}/summarize")
async def summarize_entry(
    entry_id: str,
    user_id: str = Depends(require_user_id),
    db: Session = Depends(get_db),
):
    entry = (
        db.query(EntryModel)
        .filter(EntryModel.id == entry_id, EntryModel.user_id == user_id)
        .first()
    )
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")

    api_key = await OnePasswordConnect.get_llm_api_key()
    if not api_key:
        raise HTTPException(status_code=500, detail="LLM_API_KEY missing on server")

    model = os.getenv("LLM_MODEL", "gpt-4o-mini")

    client = OpenAI(api_key=api_key)  # or rely on env var if you prefer

    prompt = (
        "You are an assistant that writes short, friendly summaries.\n"
        "Summarize the following journal entry in 1–2 sentences. "
        "Keep it faithful, concise, and neutral.\n\n"
        f"Title: {entry.title}\n"
        f"Content:\n{entry.body}\n"
    )

    try:
        resp = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "Summarize in 1–2 sentences."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.3,
            max_tokens=200,
        )
        summary = (resp.choices[0].message.content or "").strip()
        return {"summary": summary, "generated_at": datetime.now(timezone.utc).isoformat()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Summarization failed: {e}")