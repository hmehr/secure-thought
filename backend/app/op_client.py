# app/op_client.py
import os
import httpx

OP_CONNECT_TOKEN = os.getenv("OP_CONNECT_TOKEN")
# Secret reference like: op://Journal/LLM_API_KEY/credential
OP_SECRET_REF   = os.getenv("OP_SECRET_REF")  

REGION = (os.getenv("OP_REGION") or "us").lower()
BASES = {
    "us": "https://api.1password.com",
    "eu": "https://api.1password.eu",
    "ca": "https://api.1password.ca",
}
CONNECT_BASE = BASES.get(REGION, BASES["us"])

class OnePasswordConnect:
    @staticmethod
    async def get_secret_async(secret_ref: str) -> str | None:
        """
        Resolve a 1Password secret reference (op://vault/item/field) using the
        1Password SDK HTTP API. This version is PURELY ASYNC.
        """
        if not OP_CONNECT_TOKEN:
            return None
        if not secret_ref:
            return None

        # Resolve secret via 1Password Secrets/SDK HTTP endpoint
        # (Using the public SDK endpoint for secret-reference resolution)
        url = f"{CONNECT_BASE}/v1/secrets/resolve"
        headers = {"Authorization": f"Bearer {OP_CONNECT_TOKEN}"}
        payload = {"references": [secret_ref]}

        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.post(url, headers=headers, json=payload)
            r.raise_for_status()
            data = r.json()
            # response shape: {"secrets":[{"reference":"...","value":"..."}]}
            try:
                return data["secrets"][0]["value"]
            except Exception:
                return None

    @staticmethod
    async def get_llm_api_key() -> str | None:
        ref = OP_SECRET_REF
        return await OnePasswordConnect.get_secret_async(ref)