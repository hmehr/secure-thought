# app/op_client.py
import os
import asyncio
from typing import Optional
from onepassword.client import Client

OP_SECRET_REF = os.getenv("OP_SECRET_REF") 
_OP_TOKEN = os.getenv("OP_CONNECT_TOKEN")

class OnePasswordConnect:
    _client: Optional[Client] = None
    _lock = asyncio.Lock()

    @staticmethod
    async def _get_client() -> Client:
        if OnePasswordConnect._client is not None:
            return OnePasswordConnect._client
        if not _OP_TOKEN:
            raise RuntimeError("OP_CONNECT_TOKEN")

        async with OnePasswordConnect._lock:
            if OnePasswordConnect._client is None:
                OnePasswordConnect._client = await Client.authenticate(
                    auth=_OP_TOKEN,
                    integration_name="SecureThought",
                    integration_version="v1"
                )
        return OnePasswordConnect._client

    @staticmethod
    async def get_secret_async(secret_ref: str) -> Optional[str]:       
        if not secret_ref:
            return None
        client = await OnePasswordConnect._get_client()        
        return await client.secrets.resolve(secret_ref)

    @staticmethod
    async def get_llm_api_key() -> Optional[str]:
        if not OP_SECRET_REF:
            return None
        return await OnePasswordConnect.get_secret_async(OP_SECRET_REF)