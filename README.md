# Portfolio Manager

A Next.js frontend and a FastAPI backend.

## Backend (FastAPI)

```
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

- API base: http://localhost:8000/api/v1
- Interactive docs: http://localhost:8000/docs
- Health check: http://localhost:8000/api/v1/health

## Frontend (Next.js)

```
cd frontend
npm install
cp .env.example .env.local   # points the app at the backend
npm run dev
```

## How they connect

- The backend exposes a versioned REST API under `/api/v1` (currently just
  `/health`) and allows CORS from the frontend dev server
  (`http://localhost:3000`) so the browser can call it directly once the
  frontend adds a fetch.
- `frontend/.env.local` holds `API_BASE_URL` for when that fetch is added.

The frontend doesn't call the backend yet — right now this just confirms the
backend runs and is reachable. Hit http://localhost:8000/api/v1/health or
http://localhost:8000/docs directly to see it.

Last Updated 07/20/2026

Hello