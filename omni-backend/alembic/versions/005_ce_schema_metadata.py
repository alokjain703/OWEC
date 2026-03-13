"""Add metadata column to ce_schemas.

Revision ID: 005
Revises: 004
Create Date: 2026-03-12
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

# revision identifiers, used by Alembic.
revision = "005_ce_schema_metadata"
down_revision = "004_ce_dynamic_form_engine"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "ce_schemas",
        sa.Column(
            "metadata",
            JSONB,
            nullable=False,
            server_default="{}",
        ),
    )


def downgrade() -> None:
    op.drop_column("ce_schemas", "metadata")
