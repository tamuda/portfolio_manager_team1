#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

# Confirm that initial setup has been completed.
if [ ! -x "$BACKEND_DIR/.venv/bin/python" ]; then
    echo "Backend virtual environment was not found."
    echo "Run the initial setup instructions first."
    exit 1
fi

if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
    echo "Frontend dependencies were not found."
    echo "Run: cd frontend && npm install"
    exit 1
fi

echo "Applying pending database migrations..."

cd "$BACKEND_DIR"
"$BACKEND_DIR/.venv/bin/python" -m alembic upgrade head

echo "Starting FastAPI..."

"$BACKEND_DIR/.venv/bin/python" -m uvicorn app.main:app --reload &
BACKEND_PID=$!

echo "Starting Next.js..."

cd "$FRONTEND_DIR"
npm run dev &
FRONTEND_PID=$!

cleanup() {
    echo
    echo "Stopping development servers..."

    kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
}

trap cleanup EXIT INT TERM

wait