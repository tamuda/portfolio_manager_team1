"""create accounts and transactions tables

Revision ID: 0535dca319f1
Revises: a7fe76062296
Create Date: 2026-07-26 17:20:09.183124

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0535dca319f1'
down_revision: Union[str, None] = 'a7fe76062296'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "accounts",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("cash_balance", sa.Numeric(precision=18, scale=6), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "transactions",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("account_id", sa.Integer(), nullable=False),
        sa.Column(
            "type",
            sa.Enum("BUY", "SELL", "TRANSFER_IN", "TRANSFER_OUT", name="transactiontype"),
            nullable=False,
        ),
        sa.Column("ticker", sa.String(length=20), nullable=True),
        sa.Column("quantity", sa.Numeric(precision=18, scale=6), nullable=True),
        sa.Column("price", sa.Numeric(precision=18, scale=6), nullable=True),
        sa.Column("amount", sa.Numeric(precision=18, scale=6), nullable=False),
        sa.Column("realized_gain_loss", sa.Numeric(precision=18, scale=6), nullable=True),
        sa.Column("cash_balance_after", sa.Numeric(precision=18, scale=6), nullable=False),
        sa.Column("executed_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["account_id"], ["accounts.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_transactions_account_id"), "transactions", ["account_id"], unique=False)
    op.create_index(op.f("ix_transactions_ticker"), "transactions", ["ticker"], unique=False)

    # Seed the single implicit brokerage account with a zero cash balance.
    op.execute("INSERT INTO accounts (cash_balance) VALUES (0)")


def downgrade() -> None:
    op.drop_index(op.f("ix_transactions_ticker"), table_name="transactions")
    op.drop_index(op.f("ix_transactions_account_id"), table_name="transactions")
    op.drop_table("transactions")
    op.drop_table("accounts")
    sa.Enum(name="transactiontype").drop(op.get_bind(), checkfirst=True)
