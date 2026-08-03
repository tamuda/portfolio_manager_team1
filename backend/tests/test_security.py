from datetime import datetime, timedelta, timezone

import jwt
import pytest

from app.auth.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)
from app.config import settings


def test_hash_password_produces_different_output_than_input():
    hashed = hash_password("correcthorsebatterystaple")
    assert hashed != "correcthorsebatterystaple"


def test_verify_password_succeeds_with_correct_password():
    hashed = hash_password("correcthorsebatterystaple")
    assert verify_password("correcthorsebatterystaple", hashed) is True


def test_verify_password_fails_with_wrong_password():
    hashed = hash_password("correcthorsebatterystaple")
    assert verify_password("wrongpassword", hashed) is False


def test_create_and_decode_access_token_round_trip():
    token = create_access_token(user_id=42)
    payload = decode_access_token(token)
    assert payload["sub"] == "42"


def test_decode_access_token_rejects_expired_token():
    expired_payload = {
        "sub": "1",
        "exp": datetime.now(timezone.utc) - timedelta(minutes=1),
    }
    expired_token = jwt.encode(
        expired_payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm
    )

    with pytest.raises(jwt.ExpiredSignatureError):
        decode_access_token(expired_token)


def test_decode_access_token_rejects_garbage_token():
    with pytest.raises(jwt.InvalidTokenError):
        decode_access_token("not-a-real-token")
