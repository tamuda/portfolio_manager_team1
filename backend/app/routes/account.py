from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database.connection import get_db
from app.database.models import User
from app.repositories import account_repository
from app.schemas.transaction import AccountResponse

router = APIRouter(
    prefix="/account",
    tags=["account"],
)


@router.get("", response_model=AccountResponse)
def get_account(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AccountResponse:
    return account_repository.get_account(db, current_user)
