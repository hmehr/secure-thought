# backend/app/op_client.py
import os
import asyncio
from typing import Optional

import httpx
from onepassword.client import Client


class OnePasswordConnect:
    # ---------- Service Account (SDK) ----------
    @staticmethod
    def _service_token() -> Optional[str]:
        return os.getenv("OP_SERVICE_ACCOUNT_TOKEN")

    @staticmethod
    def _integration_name() -> str:
        return os.getenv("OP_INTEGRATION_NAME", "Journal Integration")

    @staticmethod
    def _default_secret_ref() -> str:
        return os.getenv("OP_SECRET_REF", "op://Journal/LLM_API_KEY/credential")

    # ---------- Connect ----------
    @staticmethod
    def _connect_host() -> Optional[str]:
        return os.getenv("OP_CONNECT_HOST")

    @staticmethod
    def _connect_token() -> Optional[str]:
        return os.getenv("OP_CONNECT_TOKEN")

    # ---------- Async SDK path ----------
    @staticmethod
    async def _sdk_resolve(ref: str) -> str:
        """
        Resolve a secret using the 1Password Python SDK (Service Account).
        """
        token = OnePasswordConnect._service_token()
        if not token:
            raise RuntimeError("OP_SERVICE_ACCOUNT_TOKEN is not set")

        client = await Client.authenticate(
            auth=token,
            integration_name=OnePasswordConnect._integration_name(),
        )
        value = await client.secrets.resolve(ref)
        if not isinstance(value, str) or not value:
            raise RuntimeError("1Password SDK returned an empty value")
        return value

    # ---------- Connect HTTP path ----------
    @staticmethod
    def _connect_resolve(ref: str) -> str:
        """
        Resolve a secret using the 1Password Connect HTTP API.
        """
        host = OnePasswordConnect._connect_host()
        token = OnePasswordConnect._connect_token()
        if not (host and token):
            raise RuntimeError("1Password Connect not configured")

        url = f"{host.rstrip('/')}/v1/secrets"
        headers = {"Authorization": f"Bearer {token}"}
        r = httpx.get(url, params={"ref": ref}, headers=headers, timeout=10.0)
        r.raise_for_status()
        data = r.json()

        # Accept a couple of shapes that Connect might return
        if isinstance(data, dict):
            # {"value": "..."} OR {"secrets": {"<ref>": {"value": "..."}}}
            if "value" in data:
                return data["value"]
            if "secrets" in data:
                try:
                    return next(iter(data["secrets"].values()))["value"]
                except Exception:
                    pass
        if isinstance(data, str):
            return data

        raise RuntimeError("Unexpected 1Password Connect response format")

    # ---------- Public API ----------
    @staticmethod
    async def get_secret_async(ref: Optional[str] = None) -> str:
        """
        Async: resolve a secret by reference using SDK if possible,
        then Connect, then env var.
        """
        ref = ref or OnePasswordConnect._default_secret_ref()

        # 1) Try SDK (Service Account)
        token = OnePasswordConnect._service_token()
        if token:
            try:
                return await OnePasswordConnect._sdk_resolve(ref)
            except Exception as e:
                print(f"[op_client] SDK resolve failed: {e}")

        # 2) Try Connect
        if OnePasswordConnect._connect_host() and OnePasswordConnect._connect_token():
            try:
                return OnePasswordConnect._connect_resolve(ref)
            except Exception as e:
                print(f"[op_client] Connect resolve failed: {e}")

        # 3) Fallback to env var
        env_val = os.getenv("LLM_API_KEY")
        if env_val:
            return env_val

        raise RuntimeError(
            "Unable to resolve secret: no SDK token, no Connect, and LLM_API_KEY not set"
        )

    @staticmethod
    def get_secret(ref: Optional[str] = None) -> str:
        """
        Sync wrapper around get_secret_async.
        Useful from non-async parts of your app.
        """
        return asyncio.run(OnePasswordConnect.get_secret_async(ref))

    # Convenience: specifically fetch the LLM API key (with sane default ref)
    @staticmethod
    def get_llm_api_key() -> str:
        try:
            return OnePasswordConnect.get_secret(OnePasswordConnect._default_secret_ref())
        except Exception as e:
            print(f"[op_client] Failed to fetch LLM_API_KEY: {e}")
            # last-ditch fallback
            v = os.getenv("LLM_API_KEY")
            if v:
                return v
            raise