"""create treasury_holdings table

Revision ID: 7b0f3e35fe4b
Revises: 0535dca319f1
Create Date: 2026-07-30 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7b0f3e35fe4b'
down_revision: Union[str, None] = '0535dca319f1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "treasury_holdings",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("account_id", sa.Integer(), nullable=False),
        sa.Column(
            "treasury_type",
            sa.Enum("BILL", "NOTE", "BOND", name="treasurytype"),
            nullable=False,
        ),
        sa.Column("face_value", sa.Numeric(precision=18, scale=6), nullable=False),
        sa.Column("coupon_rate", sa.Numeric(precision=9, scale=6), nullable=False),
        sa.Column("coupon_frequency", sa.Integer(), nullable=False),
        sa.Column("maturity_date", sa.Date(), nullable=False),
        sa.Column("purchase_date", sa.Date(), nullable=False),
        sa.Column("purchase_price", sa.Numeric(precision=18, scale=6), nullable=False),
        sa.ForeignKeyConstraint(["account_id"], ["accounts.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_treasury_holdings_account_id"),
        "treasury_holdings",
        ["account_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_treasury_holdings_account_id"), table_name="treasury_holdings")
    op.drop_table("treasury_holdings")
    sa.Enum(name="treasurytype").drop(op.get_bind(), checkfirst=True)
