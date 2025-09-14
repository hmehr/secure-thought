
import os, httpx

class OnePasswordConnect:
    """Fetch secrets from 1Password Connect using a secret reference.
    Requires:
      OP_CONNECT_HOST, OP_CONNECT_TOKEN, OP_SECRET_REF
    """
    def __init__(self):
        self.host = os.getenv("OP_CONNECT_HOST")
        self.token = os.getenv("OP_CONNECT_TOKEN")
        self.secret_ref = os.getenv("OP_SECRET_REF")

    def is_configured(self):
        return bool(self.host and self.token and self.secret_ref)

    def get_secret(self) -> str:
        if not self.is_configured():
            raise RuntimeError("1Password Connect not configured")
        url = f"{self.host.rstrip('/')}/v1/secrets?ref={self.secret_ref}"
        headers = {"Authorization": f"Bearer {self.token}"}
        r = httpx.get(url, headers=headers, timeout=10.0)
        r.raise_for_status()
        data = r.json()
        if isinstance(data, dict):
            if "secrets" in data:
                try:
                    return next(iter(data["secrets"].values()))["value"]
                except Exception:
                    pass
            if "value" in data:
                return data["value"]
        if isinstance(data, str):
            return data
        raise RuntimeError("Unexpected 1Password Connect response format")
