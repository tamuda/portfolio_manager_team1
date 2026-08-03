from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.auth.security import create_access_token, hash_password, verify_password
from app.database.connection import get_db
from app.database.models import User
from app.repositories import account_repository, user_repository
from app.schemas.auth import TokenResponse, UserCreate, UserLogin, UserResponse

router = APIRouter(
    prefix="/auth",
    tags=["auth"],
)


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(request: UserCreate, db: Session = Depends(get_db)) -> TokenResponse:
    if user_repository.get_user_by_email(db, request.email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    user = user_repository.create_user(db, request.email, hash_password(request.password))
    account_repository.get_account(db, user)  # eagerly create the user's account

    return TokenResponse(access_token=create_access_token(user.id))


@router.post("/login", response_model=TokenResponse)
def login(request: UserLogin, db: Session = Depends(get_db)) -> TokenResponse:
    user = user_repository.get_user_by_email(db, request.email)
    if user is None or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    return TokenResponse(access_token=create_access_token(user.id))


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)) -> UserResponse:
    return current_user
