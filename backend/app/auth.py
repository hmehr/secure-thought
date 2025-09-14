
import os, time
from functools import lru_cache
import httpx
from jose import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer(auto_error=False)

PASSAGE_APP_ID = os.getenv("PASSAGE_APP_ID", "")
PASSAGE_ISSUER = os.getenv("PASSAGE_ISSUER", "")
PASSAGE_JWKS_URL = os.getenv("PASSAGE_JWKS_URL", "")
DEV_BYPASS = os.getenv("PASSAGE_DEV_BYPASS", "0") == "1"

@lru_cache(maxsize=1)
def _fetch_jwks():
    if not PASSAGE_JWKS_URL:
        raise RuntimeError("PASSAGE_JWKS_URL not set")
    resp = httpx.get(PASSAGE_JWKS_URL, timeout=10.0)
    resp.raise_for_status()
    return resp.json()

def _verify_with_jwks(token: str) -> dict:
    jwks = _fetch_jwks()
    unverified = jwt.get_unverified_header(token)
    kid = unverified.get("kid")
    key = None
    for k in jwks.get("keys", []):
        if k.get("kid") == kid:
            key = k
            break
    if not key:
        raise HTTPException(status_code=401, detail="Invalid token (kid)")
    options = {"verify_aud": bool(PASSAGE_APP_ID)}
    claims = jwt.decode(
        token,
        key,
        algorithms=[key.get("alg","RS256")],
        audience=PASSAGE_APP_ID if PASSAGE_APP_ID else None,
        issuer=PASSAGE_ISSUER if PASSAGE_ISSUER else None,
        options=options,
    )
    return claims

async def require_user(creds: HTTPAuthorizationCredentials = Depends(security)) -> str:
    if not creds or creds.scheme.lower() != "bearer":
        raise HTTPException(status_code=401, detail="Missing token")
    token = creds.credentials

    # Dev bypass: accept tokens like "user:<id>"
    if DEV_BYPASS:
        if token.startswith("user:"):
            return token.split(":",1)[1]
        if token == "dev":
            return "dev-user"

    try:
        claims = _verify_with_jwks(token)
        user_id = claims.get("sub") or claims.get("userID") or claims.get("userId")
        if not user_id:
            raise HTTPException(status_code=401, detail="No user id in token")
        if "exp" in claims and int(claims["exp"]) < int(time.time()):
            raise HTTPException(status_code=401, detail="Token expired")
        return user_id
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")
