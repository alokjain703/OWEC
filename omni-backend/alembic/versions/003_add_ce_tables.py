"""add character engine tables

Revision ID: 003_add_ce_tables
Revises: 002_unique_schema_name_version
Create Date: 2026-03-09

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "003_add_ce_tables"
down_revision: Union[str, None] = "002_unique_schema_name_version"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "ce_schemas",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "ce_templates",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("schema_id", sa.String(), sa.ForeignKey("ce_schemas.id", ondelete="CASCADE"), nullable=False),
        sa.Column("template_level", sa.String(), nullable=False),
        sa.Column("inherits_from", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("schema_id", "template_level", name="uq_ce_templates_schema_level"),
    )

    op.create_table(
        "ce_trait_defs",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("schema_id", sa.String(), sa.ForeignKey("ce_schemas.id", ondelete="CASCADE"), nullable=False),
        sa.Column("trait_key", sa.String(), nullable=False),
        sa.Column("label", sa.String(), nullable=False),
        sa.Column("type", sa.String(), nullable=False),
        sa.Column("group_name", sa.String(), nullable=False),
        sa.Column("source", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "ce_trait_packs",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("schema_id", sa.String(), sa.ForeignKey("ce_schemas.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("description", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "ce_trait_pack_traits",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("pack_id", sa.String(), sa.ForeignKey("ce_trait_packs.id", ondelete="CASCADE"), nullable=False),
        sa.Column("trait_def_id", sa.String(), sa.ForeignKey("ce_trait_defs.id", ondelete="CASCADE"), nullable=False),
    )

    op.create_table(
        "ce_entities",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("schema_id", sa.String(), sa.ForeignKey("ce_schemas.id", ondelete="CASCADE"), nullable=False),
        sa.Column("template_level", sa.String(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("metadata", postgresql.JSONB(), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("idx_ce_entities_schema", "ce_entities", ["schema_id"])

    op.create_table(
        "ce_entity_traits",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("entity_id", sa.String(), sa.ForeignKey("ce_entities.id", ondelete="CASCADE"), nullable=False),
        sa.Column("trait_def_id", sa.String(), sa.ForeignKey("ce_trait_defs.id", ondelete="CASCADE"), nullable=False),
        sa.Column("value", postgresql.JSONB(), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("idx_ce_entity_traits_entity", "ce_entity_traits", ["entity_id"])
    op.create_unique_constraint("uq_ce_entity_traits_entity_trait", "ce_entity_traits", ["entity_id", "trait_def_id"])

    op.create_table(
        "ce_relationship_types",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("schema_id", sa.String(), sa.ForeignKey("ce_schemas.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("description", sa.String(), nullable=True),
    )

    op.create_table(
        "ce_relationships",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("type_id", sa.String(), sa.ForeignKey("ce_relationship_types.id", ondelete="CASCADE"), nullable=False),
        sa.Column("source_entity_id", sa.String(), sa.ForeignKey("ce_entities.id", ondelete="CASCADE"), nullable=False),
        sa.Column("target_entity_id", sa.String(), sa.ForeignKey("ce_entities.id", ondelete="CASCADE"), nullable=False),
        sa.Column("metadata", postgresql.JSONB(), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("idx_ce_relationships_type", "ce_relationships", ["type_id"])
    op.create_index("idx_ce_relationships_source", "ce_relationships", ["source_entity_id"])
    op.create_index("idx_ce_relationships_target", "ce_relationships", ["target_entity_id"])

    op.create_table(
        "ce_ai_traits",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("entity_id", sa.String(), sa.ForeignKey("ce_entities.id", ondelete="CASCADE"), nullable=False),
        sa.Column("trait_def_id", sa.String(), sa.ForeignKey("ce_trait_defs.id", ondelete="CASCADE"), nullable=False),
        sa.Column("value", postgresql.JSONB(), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("confidence", sa.Float(), nullable=False, server_default="0"),
        sa.Column("generated_by", sa.String(), nullable=False, server_default="ce-ai"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("idx_ce_ai_traits_entity", "ce_ai_traits", ["entity_id"])


def downgrade() -> None:
    op.drop_index("idx_ce_ai_traits_entity", table_name="ce_ai_traits")
    op.drop_table("ce_ai_traits")

    op.drop_index("idx_ce_relationships_target", table_name="ce_relationships")
    op.drop_index("idx_ce_relationships_source", table_name="ce_relationships")
    op.drop_index("idx_ce_relationships_type", table_name="ce_relationships")
    op.drop_table("ce_relationships")

    op.drop_table("ce_relationship_types")

    op.drop_constraint("uq_ce_entity_traits_entity_trait", "ce_entity_traits", type_="unique")
    op.drop_index("idx_ce_entity_traits_entity", table_name="ce_entity_traits")
    op.drop_table("ce_entity_traits")

    op.drop_index("idx_ce_entities_schema", table_name="ce_entities")
    op.drop_table("ce_entities")

    op.drop_table("ce_trait_pack_traits")
    op.drop_table("ce_trait_packs")
    op.drop_table("ce_trait_defs")
    op.drop_table("ce_templates")
    op.drop_table("ce_schemas")
