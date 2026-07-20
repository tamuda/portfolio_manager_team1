"""Application entry point.

Builds the FastAPI app: configures CORS so the browser frontend can call us,
and mounts every route group under the versioned API prefix (/api/v1).

Run it with:  uvicorn app.main:app --reload
Interactive docs:  http://localhost:8000/docs
"""

from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routes import health


def create_app() -> FastAPI:
    app = FastAPI(title=settings.app_name, version=settings.version)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Group every versioned route under one router, then mount it once.
    api_router = APIRouter()
    api_router.include_router(health.router, tags=["health"])
    app.include_router(api_router, prefix=settings.api_prefix)

    return app


app = create_app()
