"""create watchlist_items table

Revision ID: a7fe76062296
Revises: eab78dff01ba
Create Date: 2026-07-24 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'a7fe76062296'
down_revision: Union[str, None] = 'eab78dff01ba'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('watchlist_items',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('ticker', sa.String(length=20), nullable=False),
    sa.Column('position', sa.Integer(), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_watchlist_items_ticker'), 'watchlist_items', ['ticker'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_watchlist_items_ticker'), table_name='watchlist_items')
    op.drop_table('watchlist_items')
