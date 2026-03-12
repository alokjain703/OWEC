"""CE Dynamic Form Engine – add trait groups, trait options, extend trait defs

Revision ID: 004_ce_dynamic_form_engine
Revises: 003_add_ce_tables
Create Date: 2026-06-01

New tables:
  • ce_trait_groups  – named groups of trait defs within a schema
  • ce_trait_options – enumerated values for select/multi-select trait defs

Altered table:
  • ce_trait_defs – adds group_id FK, is_required, display_order, description
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "004_ce_dynamic_form_engine"
down_revision: Union[str, None] = "003_add_ce_tables"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_tables = inspector.get_table_names()

    # ── ce_trait_groups ───────────────────────────────────────────────────────
    if "ce_trait_groups" not in existing_tables:
        op.create_table(
            "ce_trait_groups",
            sa.Column("id", sa.String(), primary_key=True),
            sa.Column(
                "schema_id",
                sa.String(),
                sa.ForeignKey("ce_schemas.id", ondelete="CASCADE"),
                nullable=False,
            ),
            sa.Column("name", sa.String(), nullable=False),
            sa.Column("label", sa.String(), nullable=True),
            sa.Column("display_order", sa.Integer(), server_default="0", nullable=False),
            sa.Column("description", sa.Text(), nullable=True),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                server_default=sa.func.now(),
                nullable=False,
            ),
        )
        op.create_index("idx_ce_trait_groups_schema", "ce_trait_groups", ["schema_id"])

    # ── ce_trait_options ──────────────────────────────────────────────────────
    if "ce_trait_options" not in existing_tables:
        op.create_table(
            "ce_trait_options",
            sa.Column("id", sa.String(), primary_key=True),
            sa.Column(
                "trait_def_id",
                sa.String(),
                sa.ForeignKey("ce_trait_defs.id", ondelete="CASCADE"),
                nullable=False,
            ),
            sa.Column("value", sa.String(), nullable=False),
            sa.Column("label", sa.String(), nullable=False),
            sa.Column("display_order", sa.Integer(), server_default="0", nullable=False),
        )
        op.create_index("idx_ce_trait_options_def", "ce_trait_options", ["trait_def_id"])

    # ── extend ce_trait_defs ──────────────────────────────────────────────────
    ce_trait_defs_cols = {c["name"] for c in inspector.get_columns("ce_trait_defs")}

    if "group_id" not in ce_trait_defs_cols:
        op.add_column(
            "ce_trait_defs",
            sa.Column(
                "group_id",
                sa.String(),
                sa.ForeignKey("ce_trait_groups.id", ondelete="SET NULL"),
                nullable=True,
            ),
        )
    if "is_required" not in ce_trait_defs_cols:
        op.add_column(
            "ce_trait_defs",
            sa.Column(
                "is_required",
                sa.Boolean(),
                server_default=sa.false(),
                nullable=False,
            ),
        )
    if "display_order" not in ce_trait_defs_cols:
        op.add_column(
            "ce_trait_defs",
            sa.Column(
                "display_order",
                sa.Integer(),
                server_default="0",
                nullable=False,
            ),
        )
    if "description" not in ce_trait_defs_cols:
        op.add_column(
            "ce_trait_defs",
            sa.Column("description", sa.Text(), nullable=True),
        )


def downgrade() -> None:
    # Remove new ce_trait_defs columns
    op.drop_column("ce_trait_defs", "description")
    op.drop_column("ce_trait_defs", "display_order")
    op.drop_column("ce_trait_defs", "is_required")
    op.drop_column("ce_trait_defs", "group_id")

    # Drop new tables
    op.drop_index("idx_ce_trait_options_def", table_name="ce_trait_options")
    op.drop_table("ce_trait_options")
    op.drop_index("idx_ce_trait_groups_schema", table_name="ce_trait_groups")
    op.drop_table("ce_trait_groups")
