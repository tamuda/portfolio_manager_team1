from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.repositories import account_repository
from app.schemas.transaction import AccountResponse

router = APIRouter(
    prefix="/account",
    tags=["account"],
)


@router.get("", response_model=AccountResponse)
def get_account(db: Session = Depends(get_db)) -> AccountResponse:
    return account_repository.get_account(db)
