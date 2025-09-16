# backend/app/auth.py

"""
Auth utilities for Passage (1Password) JWT verification.

ENV:
- PASSAGE_APP_ID        (required in production)
- PASSAGE_ISSUER        (recommended; e.g. "https://<your-subdomain>.withpassage.com/")
- PASSAGE_JWKS_URL      (required; e.g. ".../.well-known/jwks.json")
- PASSAGE_DEV_BYPASS    ("1" to allow dev tokens like "user:<id>" or "dev")
"""

from __future__ import annotations

import os
import time
from typing import Optional, Dict, Any

import httpx
from fastapi import Request, Depends, HTTPException
from jose import jwt
from passageidentity import Passage, PassageError
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# -------- Config --------

PASSAGE_APP_ID = os.getenv("PASSAGE_APP_ID", "").strip()
PASSAGE_ISSUER = os.getenv("PASSAGE_ISSUER", "").strip()
PASSAGE_JWKS_URL = os.getenv("PASSAGE_JWKS_URL", "").strip()

DEV_BYPASS = os.getenv("PASSAGE_DEV_BYPASS", "0") == "1"

# JWKS cache settings
_JWKS_TTL_SECONDS = 15 * 60


# -------- JWKS Cache --------

class _JWKSCache:
    def __init__(self, url: str, ttl: int = _JWKS_TTL_SECONDS):
        self.url = url
        self.ttl = ttl
        self._data: Optional[Dict[str, Any]] = None
        self._expires_at: float = 0.0
        self._etag: Optional[str] = None

    def _expired(self) -> bool:
        return not self._data or time.time() >= self._expires_at

    def get(self, force: bool = False) -> Dict[str, Any]:
        if not self.url:
            raise RuntimeError("PASSAGE_JWKS_URL not set")

        if self._expired() or force:
            headers = {}
            if self._etag:
                headers["If-None-Match"] = self._etag

            r = httpx.get(self.url, timeout=10.0, headers=headers)
            if r.status_code == 304 and self._data:                
                self._expires_at = time.time() + self.ttl
                return self._data

            r.raise_for_status()
            self._data = r.json()
            self._etag = r.headers.get("ETag")
            self._expires_at = time.time() + self.ttl

        return self._data or {"keys": []}


_jwks_cache = _JWKSCache(PASSAGE_JWKS_URL)


def _find_jwk_for_kid(jwks: Dict[str, Any], kid: str) -> Optional[Dict[str, Any]]:
    for k in jwks.get("keys", []):
        if k.get("kid") == kid:
            return k
    return None


# -------- Token Extraction --------

def _extract_bearer_token(request: Request) -> Optional[str]:
    auth = request.headers.get("authorization") or request.headers.get("Authorization")
    if auth and auth.lower().startswith("bearer "):
        return auth.split(" ", 1)[1].strip()

    return None


# -------- Verification --------

def _verify_with_jwks(token: str) -> Dict[str, Any]:
    unverified_header = jwt.get_unverified_header(token)
    kid = unverified_header.get("kid")
    alg = unverified_header.get("alg", "RS256")
    jwks = _jwks_cache.get()
    jwk = _find_jwk_for_kid(jwks, kid) if kid else None

    if not jwk:
        jwks = _jwks_cache.get(force=True)
        jwk = _find_jwk_for_kid(jwks, kid) if kid else None
        if not jwk:
            raise HTTPException(status_code=401, detail="Invalid token (unknown kid)")

    options = {"verify_aud": bool(PASSAGE_APP_ID)}

    claims = jwt.decode(
        token,
        jwk,
        algorithms=[alg],
        audience=PASSAGE_APP_ID or None,
        issuer=PASSAGE_ISSUER or None,
        options=options,
    )
    
    if "exp" in claims and int(claims["exp"]) < int(time.time()):
        raise HTTPException(status_code=401, detail="Token expired")

    return claims


# -------- Dependencies --------

def _dev_bypass_user(token: str) -> Optional[str]:
    """
    Accepts tokens:
      - 'user:<id>'  => returns <id>
      - 'dev'        => returns 'dev-user'
    """
    if token.startswith("user:"):
        return token.split(":", 1)[1]
    if token == "dev":
        return "dev-user"
    return None


def _claims_to_user_id(claims: Dict[str, Any]) -> Optional[str]:
    return claims.get("sub") or claims.get("userID") or claims.get("userId")


async def require_claims(request: Request) -> Dict[str, Any]:
    token = _extract_bearer_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Missing bearer token")
    if DEV_BYPASS:
        user = _dev_bypass_user(token)
        if user:            
            return {"sub": user, "aud": PASSAGE_APP_ID or None, "iss": PASSAGE_ISSUER or None}
    try:
        return _verify_with_jwks(token)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")


async def optional_user_id(request: Request) -> Optional[str]:
    token = _extract_bearer_token(request)
    if not token:
        return None

    if DEV_BYPASS:
        user = _dev_bypass_user(token)
        if user:
            return user

    try:
        claims = _verify_with_jwks(token)
        return _claims_to_user_id(claims)
    except Exception:
        return None


async def require_user_id(claims: Dict[str, Any] = Depends(require_claims)) -> str:
    user_id = _claims_to_user_id(claims)
    if not user_id:
        raise HTTPException(status_code=401, detail="No user id in token")
    return user_id


# -------- Passage Integration --------

# Initialize Passage client
passage = Passage(
    app_id=os.getenv("PASSAGE_APP_ID"),
    api_key=os.getenv("PASSAGE_API_KEY")
)

security = HTTPBearer()


async def verify_passage_token(token: str) -> dict:
    """Verify a Passage auth token"""
    try:
        # Remove request_data and directly use the token
        try:            
            user_id = passage.auth.validate_jwt(token)
            if not user_id:
                raise HTTPException(status_code=401, detail="Invalid token")            
            user = passage.user.get(user_id)
            return {
                "id": user.id,
                "email": getattr(user, "email", None) or None,
            }                
        except Exception as e:
            print(f"[auth] JWT validation failed: {str(e)}")
            raise HTTPException(status_code=401, detail="Invalid token")
            
    except PassageError as e:
        print(f"[auth] Passage auth failed: {str(e)}")
        raise HTTPException(
            status_code=401, 
            detail=f"Passage authentication failed: {str(e)}"
        )
    except Exception as e:
        print(f"Auth error: {str(e)}")
        raise HTTPException(
            status_code=401,
            detail=f"Authentication failed: {str(e)}"
        )


async def require_user_id(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """Dependency that returns the user ID from a valid token"""
    user_data = await verify_passage_token(credentials.credentials)
    return user_data["id"]