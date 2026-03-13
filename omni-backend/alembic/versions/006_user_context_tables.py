"""006 – Create user_context tables.

Revision ID: 006_user_context_tables
Revises: 005_ce_schema_metadata
"""
import sqlalchemy as sa
from alembic import op

revision = "006_user_context_tables"
down_revision = "005_ce_schema_metadata"
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    insp = sa.inspect(conn)
    existing = set(insp.get_table_names())

    # ── user_settings ─────────────────────────────────────────────────────────
    if "user_settings" not in existing:
        op.create_table(
            "user_settings",
            sa.Column("id", sa.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
            sa.Column("tenant_id", sa.String(), nullable=False),
            sa.Column("user_id", sa.String(), nullable=False),
            sa.Column("scope_type", sa.String(), nullable=False, server_default="global"),
            sa.Column("scope_id", sa.String(), nullable=True),
            sa.Column("settings", sa.JSON(), nullable=False, server_default="{}"),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
            sa.UniqueConstraint("tenant_id", "user_id", "scope_type", "scope_id", name="uq_user_settings_scope"),
        )
        op.create_index("ix_user_settings_lookup", "user_settings", ["tenant_id", "user_id", "scope_type", "scope_id"])

    # ── user_preferences ──────────────────────────────────────────────────────
    if "user_preferences" not in existing:
        op.create_table(
            "user_preferences",
            sa.Column("id", sa.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
            sa.Column("tenant_id", sa.String(), nullable=False),
            sa.Column("user_id", sa.String(), nullable=False),
            sa.Column("key", sa.String(), nullable=False),
            sa.Column("scope_type", sa.String(), nullable=False, server_default="global"),
            sa.Column("scope_id", sa.String(), nullable=True),
            sa.Column("value", sa.JSON(), nullable=False, server_default="{}"),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
            sa.UniqueConstraint("tenant_id", "user_id", "key", "scope_type", "scope_id", name="uq_user_preferences_key_scope"),
        )
        op.create_index("ix_user_preferences_lookup", "user_preferences", ["tenant_id", "user_id", "key"])

    # ── user_activity ─────────────────────────────────────────────────────────
    if "user_activity" not in existing:
        op.create_table(
            "user_activity",
            sa.Column("id", sa.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
            sa.Column("tenant_id", sa.String(), nullable=False),
            sa.Column("user_id", sa.String(), nullable=False),
            sa.Column("object_type", sa.String(), nullable=False),
            sa.Column("object_id", sa.String(), nullable=False),
            sa.Column("action", sa.String(), nullable=False),
            sa.Column("metadata", sa.JSON(), nullable=False, server_default="{}"),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        )
        op.create_index("ix_user_activity_user", "user_activity", ["tenant_id", "user_id"])
        op.create_index("ix_user_activity_recent", "user_activity", ["user_id", "created_at"])

    # ── user_bookmarks ────────────────────────────────────────────────────────
    if "user_bookmarks" not in existing:
        op.create_table(
            "user_bookmarks",
            sa.Column("id", sa.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
            sa.Column("tenant_id", sa.String(), nullable=False),
            sa.Column("user_id", sa.String(), nullable=False),
            sa.Column("object_type", sa.String(), nullable=False),
            sa.Column("object_id", sa.String(), nullable=False),
            sa.Column("metadata", sa.JSON(), nullable=False, server_default="{}"),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
            sa.UniqueConstraint("tenant_id", "user_id", "object_type", "object_id", name="uq_user_bookmarks_object"),
        )
        op.create_index("ix_user_bookmarks_user", "user_bookmarks", ["tenant_id", "user_id"])


def downgrade() -> None:
    op.drop_table("user_bookmarks")
    op.drop_table("user_activity")
    op.drop_table("user_preferences")
    op.drop_table("user_settings")
