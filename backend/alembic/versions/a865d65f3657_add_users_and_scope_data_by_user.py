"""add users table and scope accounts/holdings/watchlist_items by user

Revision ID: a865d65f3657
Revises: 7b0f3e35fe4b
Create Date: 2026-08-02 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a865d65f3657'
down_revision: Union[str, None] = '7b0f3e35fe4b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Dev seed user that existing (pre-auth) rows get backfilled onto so this
# migration never leaves orphaned data behind. Password is "devpassword123";
# hash precomputed offline (bcrypt) rather than importing app code here.
_SEED_EMAIL = "dev@example.com"
_SEED_PASSWORD_HASH = "$2b$12$t57HQCZ1Y30BiclySWnp5.CEnM1hOQZQ19w7VzI0FE9rol4zZXeEy"


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)

    op.execute(
        f"INSERT INTO users (email, hashed_password) VALUES "
        f"('{_SEED_EMAIL}', '{_SEED_PASSWORD_HASH}')"
    )

    # Add user_id as nullable first (existing rows have none yet), backfill
    # onto the seed user, then tighten to NOT NULL.
    op.add_column("accounts", sa.Column("user_id", sa.Integer(), nullable=True))
    op.add_column("holdings", sa.Column("user_id", sa.Integer(), nullable=True))
    op.add_column("watchlist_items", sa.Column("user_id", sa.Integer(), nullable=True))

    op.execute(
        f"UPDATE accounts SET user_id = (SELECT id FROM users WHERE email = '{_SEED_EMAIL}') "
        f"WHERE user_id IS NULL"
    )
    op.execute(
        f"UPDATE holdings SET user_id = (SELECT id FROM users WHERE email = '{_SEED_EMAIL}') "
        f"WHERE user_id IS NULL"
    )
    op.execute(
        f"UPDATE watchlist_items SET user_id = (SELECT id FROM users WHERE email = '{_SEED_EMAIL}') "
        f"WHERE user_id IS NULL"
    )

    op.alter_column("accounts", "user_id", existing_type=sa.Integer(), nullable=False)
    op.alter_column("holdings", "user_id", existing_type=sa.Integer(), nullable=False)
    op.alter_column("watchlist_items", "user_id", existing_type=sa.Integer(), nullable=False)

    op.create_foreign_key(
        "fk_accounts_user_id_users", "accounts", "users", ["user_id"], ["id"]
    )
    op.create_foreign_key(
        "fk_holdings_user_id_users", "holdings", "users", ["user_id"], ["id"]
    )
    op.create_foreign_key(
        "fk_watchlist_items_user_id_users", "watchlist_items", "users", ["user_id"], ["id"]
    )

    op.create_index(op.f("ix_accounts_user_id"), "accounts", ["user_id"], unique=True)
    op.create_index(op.f("ix_holdings_user_id"), "holdings", ["user_id"], unique=False)
    op.create_index(
        op.f("ix_watchlist_items_user_id"), "watchlist_items", ["user_id"], unique=False
    )


def downgrade() -> None:
    # MySQL won't drop an index that still backs a foreign key, so the
    # constraints must go first.
    op.drop_constraint("fk_watchlist_items_user_id_users", "watchlist_items", type_="foreignkey")
    op.drop_constraint("fk_holdings_user_id_users", "holdings", type_="foreignkey")
    op.drop_constraint("fk_accounts_user_id_users", "accounts", type_="foreignkey")

    op.drop_index(op.f("ix_watchlist_items_user_id"), table_name="watchlist_items")
    op.drop_index(op.f("ix_holdings_user_id"), table_name="holdings")
    op.drop_index(op.f("ix_accounts_user_id"), table_name="accounts")

    op.drop_column("watchlist_items", "user_id")
    op.drop_column("holdings", "user_id")
    op.drop_column("accounts", "user_id")

    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_table("users")
