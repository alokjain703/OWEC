"""add schema_version_id to projects

Revision ID: 001_schema_version_id
Revises: 
Create Date: 2026-03-08

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '001_schema_version_id'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add schema_version_id column to projects table"""
    op.add_column(
        'projects',
        sa.Column('schema_version_id', postgresql.UUID(as_uuid=True), nullable=True)
    )


def downgrade() -> None:
    """Remove schema_version_id column from projects table"""
    op.drop_column('projects', 'schema_version_id')
