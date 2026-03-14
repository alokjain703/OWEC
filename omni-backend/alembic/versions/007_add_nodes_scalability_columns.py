"""007 – Add content_format, path, has_children, order_key to nodes.

Revision ID: 007_add_nodes_scalability_columns
Revises: 006_user_context_tables
Create Date: 2026-03-14
"""
from alembic import op
import sqlalchemy as sa

revision = "007_nodes_scalability"
down_revision = "006_user_context_tables"
branch_labels = None
depends_on = None


def upgrade():
    # ── New columns ─────────────────────────────────────────────────────────────

    op.add_column(
        "nodes",
        sa.Column(
            "content_format",
            sa.Text(),
            nullable=False,
            server_default="html",
        ),
    )

    op.add_column(
        "nodes",
        sa.Column("path", sa.Text(), nullable=True),
    )

    op.add_column(
        "nodes",
        sa.Column(
            "has_children",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
    )

    op.add_column(
        "nodes",
        sa.Column("order_key", sa.Numeric(), nullable=True),
    )

    # ── Backfill order_key from existing order_index ─────────────────────────────
    op.execute(
        """
        UPDATE nodes
        SET order_key = order_index * 100
        """
    )

    # ── Backfill has_children ────────────────────────────────────────────────────
    op.execute(
        """
        UPDATE nodes
        SET has_children = TRUE
        WHERE id IN (
            SELECT DISTINCT parent_id
            FROM nodes
            WHERE parent_id IS NOT NULL
        )
        """
    )

    # ── Generate hierarchical paths via recursive CTE ───────────────────────────
    op.execute(
        """
        WITH RECURSIVE node_paths AS (
            SELECT id, parent_id, id::text AS path
            FROM nodes
            WHERE parent_id IS NULL

            UNION ALL

            SELECT n.id, n.parent_id, np.path || '/' || n.id
            FROM nodes n
            JOIN node_paths np ON n.parent_id = np.id
        )
        UPDATE nodes
        SET path = node_paths.path
        FROM node_paths
        WHERE nodes.id = node_paths.id
        """
    )

    # ── Indexes ──────────────────────────────────────────────────────────────────
    op.create_index("idx_nodes_path", "nodes", ["path"])
    op.create_index("idx_nodes_order_key", "nodes", ["project_id", "parent_id", "order_key"])


def downgrade():
    op.drop_index("idx_nodes_order_key", table_name="nodes")
    op.drop_index("idx_nodes_path", table_name="nodes")
    op.drop_column("nodes", "order_key")
    op.drop_column("nodes", "has_children")
    op.drop_column("nodes", "path")
    op.drop_column("nodes", "content_format")
