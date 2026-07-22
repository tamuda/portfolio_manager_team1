# Running & testing this app on a new machine

These steps take you from a fresh clone of the repo to a working app with a
real MySQL-backed database, on a machine that has never run this project
before. Nothing here assumes anything is pre-installed except the tools
listed in Prerequisites.

## 1. Prerequisites

Install these first if you don't already have them:

- **Git**
- **Python 3.11+** — `python --version` (or `python3 --version`)
- **Node.js 20+** — `node --version` / `npm --version`
- **MySQL Server 8.x**, installed and running as a local service
  - Windows: installed via the MySQL Installer; runs as the `MySQL80`
    Windows service
  - macOS: `brew install mysql && brew services start mysql`
  - Linux: `sudo apt install mysql-server` (or your distro's equivalent),
    then make sure the service is running
- Know the username/password for a MySQL account that can create databases
  (usually `root`)

## 2. Clone the repo

```bash
git clone <repo-url>
cd portfolio_manager_team1
```

## 3. Backend setup

```bash
cd backend
python -m venv .venv
source .venv/Scripts/activate   # Windows Git Bash
# source .venv/bin/activate      # macOS/Linux
pip install -r requirements.txt
```

### Configure the database connection

```bash
cp .env.example .env
```

Edit `.env` and set `DATABASE_URL` to your own MySQL credentials — **do not
commit this file, and don't hand your real password to anyone else**:

```
DATABASE_URL=mysql+pymysql://<user>:<password>@localhost:3306/portfolio
```

If your password contains special characters (`@`, `:`, `/`, `!`, `#`, etc.),
URL-encode them (e.g. `!` → `%21`) or the connection string will fail to
parse.

### Create the database

```bash
mysql -u <user> -p -e "CREATE DATABASE IF NOT EXISTS portfolio;"
```

If `mysql` isn't on your PATH:
- Windows: use the full path, e.g.
  `"/c/Program Files/MySQL/MySQL Server 8.0/bin/mysql.exe"`
- macOS (Homebrew): `/opt/homebrew/opt/mysql/bin/mysql` (Apple Silicon) or
  `/usr/local/opt/mysql/bin/mysql` (Intel)

### Run migrations

```bash
alembic upgrade head
```

This creates the `holdings` table. Verify it exists:

```bash
mysql -u <user> -p portfolio -e "SHOW TABLES; DESCRIBE holdings;"
```

### Start the backend

```bash
uvicorn app.main:app --reload
```

- Health check: http://localhost:8000/api/v1/health
- Interactive docs: http://localhost:8000/docs

If `/health` returns `{"status": "Backend is running. Healthy"}`, the app
started and loaded config successfully (this does not yet prove the DB
connection works — the next section does).

Leave this running and open a **new terminal** for the remaining steps.

## 4. Frontend setup

```bash
cd frontend
npm install
cp .env.example .env.local
```

`.env.local` should contain:

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
```

Start the dev server:

```bash
npm run dev
```

Open http://localhost:3000 in a browser.

## 5. Exercise the database through the API

You can use the Swagger UI at http://localhost:8000/docs, the frontend UI at
http://localhost:3000, or curl from another terminal:

**Create a holding:**

```bash
curl -X POST http://localhost:8000/api/v1/holdings \
  -H "Content-Type: application/json" \
  -d '{
        "ticker": "AAPL",
        "quantity_added": 10,
        "purchase_price": 150.25,
        "purchase_date": "2026-01-15"
      }'
```

Expect a `200` response with the created holding, including a generated `id`.

**List holdings (confirms the row was persisted):**

```bash
curl http://localhost:8000/api/v1/holdings
```

**Fetch a single holding:**

```bash
curl http://localhost:8000/api/v1/holdings/1
```

**Update a holding:**

```bash
curl -X PATCH http://localhost:8000/api/v1/holdings/1 \
  -H "Content-Type: application/json" \
  -d '{"quantity_added": 20}'
```

**Delete a holding:**

```bash
curl -X DELETE http://localhost:8000/api/v1/holdings/1
```

Then `GET /holdings` again to confirm it's gone.

## 6. Confirm directly in MySQL (optional but reassuring)

```bash
mysql -u <user> -p portfolio -e "SELECT * FROM holdings;"
```

Rows created/updated/deleted via the API should be reflected here in real
time — that's the strongest proof the backend is actually talking to your
own local database rather than some in-memory fallback or someone else's
database.

## Troubleshooting

- **`Access denied for user ...`** — the password in `DATABASE_URL` doesn't
  match your MySQL user. Double check `.env`, and make sure special
  characters are URL-encoded.
- **`Can't connect to MySQL server`** — the MySQL service isn't running
  locally, or the port/host in `DATABASE_URL` is wrong.
- **`invalid literal for int() with base 10` on startup** — `DATABASE_URL`
  is malformed (usually a missing `@host:port/dbname` segment, or a
  password with an un-encoded special character breaking the URL parser).
- **422 error on create/update** — the request violates a DB constraint
  (e.g. `quantity_added` must be > 0). Check the response `detail` field.
- **404 on get/update/delete** — the `holding_id` doesn't exist; list
  holdings first to get a valid id.
- **Port 8000 or 3000 already in use** — stop whatever's already running on
  that port, or start uvicorn with `--port <other>` / let Next.js pick the
  next free port automatically.
