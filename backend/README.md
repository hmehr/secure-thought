
# Secure Journal — Backend API (FastAPI)

This is a minimal, production-leaning backend for the **Secure Journal** app.
It verifies **Passage** JWTs, provides CRUD for journal entries, and exposes an
endpoint to **summarize** an entry using an LLM API key that is fetched securely
(via 1Password Connect) or provided as an environment variable for local dev.

## Features
- FastAPI + SQLAlchemy (SQLite by default, Postgres-ready)
- Auth: Passage JWT verification (with a `PASSAGE_DEV_BYPASS` mode for local dev)
- Entries CRUD scoped to the authenticated `user_id`
- AI summary endpoint; loads LLM API key from **1Password Connect** or `LLM_API_KEY`
- CORS configured for your Lovable frontend origin

## Quick Start (Local Dev)
1. **Create and activate venv**
   ```bash
   python -m venv .venv && source .venv/bin/activate
   ```
2. **Install deps**
   ```bash
   pip install -r requirements.txt
   ```
3. **Copy env**
   ```bash
   cp .env.example .env
   # edit FRONTEND_ORIGIN, PASSAGE_APP_ID, etc.
   ```
4. **(Optional) Quick dev mode**
   - Set `PASSAGE_DEV_BYPASS=1` to accept any token of the form `user:<id>`
     (e.g., `Authorization: Bearer user:demo` → `user_id="demo"`). **Do not use in prod.**

5. **Run API**
   ```bash
   uvicorn app.main:app --reload --port 8080
   ```

## Environment Variables
See `.env.example` for the full list. Key ones:
- `DB_URL` — e.g., `sqlite:///./app.db` (default), or Postgres: `postgresql+psycopg://user:pass@host/db`
- `FRONTEND_ORIGIN` — your Lovable domain for CORS
- `PASSAGE_APP_ID` — your Passage app id
- `PASSAGE_ISSUER` — expected issuer (optional, but recommended)
- `PASSAGE_JWKS_URL` — JWKS URL for token verification (recommended for prod). If absent and `PASSAGE_DEV_BYPASS=0`, verification will fail.
- `PASSAGE_DEV_BYPASS` — `1` to bypass auth locally (accepts `user:<id>`), `0` for real verification
- **AI secrets** (choose one):
  - `LLM_API_KEY` (fast local start), or
  - `OP_CONNECT_HOST`, `OP_CONNECT_TOKEN`, `OP_SECRET_REF` (1Password Connect)

## API
- `GET /health` → `{ "ok": true }`
- `GET /entries` → list entries for user
- `POST /entries` `{ title, body }` → create
- `GET /entries/{id}` → get
- `PUT /entries/{id}` `{ title, body }` → update
- `DELETE /entries/{id}` → delete
- `POST /entries/{id}/summarize` → `{ summary }`

## Notes on Passage verification
This server includes JWKS verification via `python-jose` and `httpx`.
Provide:
- `PASSAGE_APP_ID` (audience check)
- `PASSAGE_ISSUER` (issuer check, optional but safer)
- `PASSAGE_JWKS_URL` (JWKS endpoint provided by Passage for your app)

If you can't configure JWKS right away, set `PASSAGE_DEV_BYPASS=1` until your
Passage config is ready.

## 1Password Connect quick setup
- Run/connect to a 1Password **Connect** server.
- Set:
  ```
  OP_CONNECT_HOST=https://<connect-host>
  OP_CONNECT_TOKEN=<token>
  OP_SECRET_REF=op://<Vault>/<Item>/<field>
  ```
- The backend will resolve the secret (your LLM API key) at runtime before
  calling the model API.

## Deploy
- Render/Fly/Heroku (or any Docker host) works well.
- Set the environment vars in the service dashboard.
- Use a managed Postgres for persistence in production.
