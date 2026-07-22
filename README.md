# Portfolio Manager

A Next.js frontend and a FastAPI backend.

## Backend (FastAPI)

```
cd backend
python3 -m venv .venv
source .venv/bin/activate # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

- API base: http://localhost:8000/api/v1
- Interactive docs: http://localhost:8000/docs
- Health check: http://localhost:8000/api/v1/health

## Frontend (Next.js)

### 1. Install Node.js (if you don't have it yet)

The frontend requires **Node.js 20 or later**.

**Check if it's already installed:**

```bash
node --version
npm --version
```

If both commands print a version number, skip to step 2.

**Install Node.js:**

- **macOS (recommended):** Install [nvm](https://github.com/nvm-sh/nvm), then run:
  ```bash
  nvm install 20
  nvm use 20
  ```
- **macOS (alternative):** Download the LTS installer from [nodejs.org](https://nodejs.org/)
- **Windows:** Download the LTS installer from [nodejs.org](https://nodejs.org/)

After installing, open a **new terminal** and confirm:

```bash
node --version   # should show v20.x or higher
npm --version
```

### 2. Install dependencies

```bash
cd frontend
npm install
```

### 3. Configure environment

```bash
cp .env.example .env.local   # points the app at the backend
```

`.env.local` should contain:

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
```

### 4. Start the dev server

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

- **Dashboard** (`/`) — portfolio summary (holding count, total cost basis)
- **Portfolios** (`/portfolios`) — browse, add, and delete holdings

If port 3000 is already in use, Next.js will pick the next available port

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
