"""add unique constraint to schemas name+version

Revision ID: 002_unique_schema_name_version
Revises: 001_schema_version_id
Create Date: 2026-03-08

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '002_unique_schema_name_version'
down_revision: Union[str, None] = '001_schema_version_id'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add unique constraint to schemas table for name+version"""
    op.create_unique_constraint(
        'uq_schema_name_version',
        'schemas',
        ['name', 'version']
    )


def downgrade() -> None:
    """Remove unique constraint from schemas table"""
    op.drop_constraint('uq_schema_name_version', 'schemas', type_='unique')
