"""add ticker index and rename quantity to quantity_added

Revision ID: eab78dff01ba
Revises: 1d842379c1d2
Create Date: 2026-07-22 18:17:15.088373

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision: str = 'eab78dff01ba'
down_revision: Union[str, None] = '1d842379c1d2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        'holdings',
        'quantity',
        new_column_name='quantity_added',
        existing_type=sa.Numeric(precision=18, scale=6),
        existing_nullable=False,
    )
    op.create_index(op.f('ix_holdings_ticker'), 'holdings', ['ticker'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_holdings_ticker'), table_name='holdings')
    op.alter_column(
        'holdings',
        'quantity_added',
        new_column_name='quantity',
        existing_type=sa.Numeric(precision=18, scale=6),
        existing_nullable=False,
    )
