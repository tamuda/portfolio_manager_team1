"""Health / liveness endpoint.

A trivial route the frontend (or a load balancer) can hit to confirm the API
is up. Keeping it separate from business routes keeps concerns clean.
"""

from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "Backend is running. Healthy"}
