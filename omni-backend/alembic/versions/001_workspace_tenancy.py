"""Add workspace multi-tenancy

Revision ID: 001_workspace_tenancy
Revises: 
Create Date: 2026-03-01 13:45:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '001_workspace_tenancy'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create workspaces table
    op.create_table(
        'workspaces',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('type', sa.String(length=32), nullable=False),
        sa.Column('name', sa.Text(), nullable=False),
        sa.Column('owner_user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('subscription_tier', sa.String(length=32), nullable=False, server_default='free'),
        sa.Column('storage_quota_mb', sa.Integer(), nullable=False, server_default='1024'),
        sa.Column('project_limit', sa.Integer(), nullable=False, server_default='5'),
        sa.Column('settings', postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default='{}'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.CheckConstraint("type IN ('personal','organization','enterprise')", name='ck_workspace_type'),
    )
    op.create_index('idx_workspace_owner', 'workspaces', ['owner_user_id'])

    # 2. Create workspace_members table
    op.create_table(
        'workspace_members',
        sa.Column('workspace_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('role', sa.String(length=32), nullable=False),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('workspace_id', 'user_id'),
        sa.CheckConstraint("role IN ('owner','admin','editor','viewer')", name='ck_member_role'),
    )
    op.create_index('idx_workspace_member_user', 'workspace_members', ['user_id'])

    # 3. Check if projects table exists (for backward compatibility)
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    table_exists = 'projects' in inspector.get_table_names()

    if not table_exists:
        # Fresh install – create projects table directly with workspace ownership
        op.create_table(
            'projects',
            sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
            sa.Column('workspace_id', postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column('title', sa.String(), nullable=False),
            sa.Column('description', sa.Text(), nullable=True),
            sa.Column('status', sa.String(length=16), nullable=False, server_default='active'),
            sa.Column('visibility', sa.String(length=16), nullable=False, server_default='private'),
            sa.Column('storage_mode', sa.String(length=16), nullable=False, server_default='local'),
            sa.Column('active_schema_id', postgresql.UUID(as_uuid=True), nullable=True),
            sa.Column('settings', postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default='{}'),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
            sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['active_schema_id'], ['schemas.id'], ondelete='SET NULL'),
            sa.CheckConstraint("status IN ('active','archived','deleted')", name='ck_project_status'),
            sa.CheckConstraint("visibility IN ('private','workspace','public')", name='ck_project_visibility'),
            sa.CheckConstraint("storage_mode IN ('local','s3')", name='ck_project_storage_mode'),
        )
        op.create_index('idx_project_workspace_id', 'projects', ['workspace_id'])
        op.create_index('idx_project_created_by', 'projects', ['created_by'])
    else:
        # Legacy migration – alter existing projects table
        # Drop old owner_id if it exists
        columns = [c['name'] for c in inspector.get_columns('projects')]
        if 'owner_id' in columns:
            op.drop_column('projects', 'owner_id')
        
        # Add new columns if they don't exist
        if 'workspace_id' not in columns:
            # Create a temporary default workspace for legacy projects
            op.execute("""
                INSERT INTO workspaces (id, type, name, owner_user_id, subscription_tier, project_limit, settings)
                VALUES (
                    '00000000-0000-0000-0000-000000000001'::uuid,
                    'organization',
                    'Legacy Projects Workspace',
                    '00000000-0000-0000-0000-000000000000'::uuid,
                    'free',
                    1000,
                    '{}'::jsonb
                )
                ON CONFLICT DO NOTHING;
            """)
            op.add_column('projects', sa.Column('workspace_id', postgresql.UUID(as_uuid=True), nullable=True))
            op.execute("UPDATE projects SET workspace_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE workspace_id IS NULL")
            op.alter_column('projects', 'workspace_id', nullable=False)
            op.create_foreign_key('fk_project_workspace', 'projects', 'workspaces', ['workspace_id'], ['id'], ondelete='CASCADE')
            op.create_index('idx_project_workspace_id', 'projects', ['workspace_id'])
        
        if 'created_by' not in columns:
            op.add_column('projects', sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True))
            op.execute("UPDATE projects SET created_by = '00000000-0000-0000-0000-000000000000'::uuid WHERE created_by IS NULL")
            op.alter_column('projects', 'created_by', nullable=False)
            op.create_index('idx_project_created_by', 'projects', ['created_by'])
        
        if 'description' not in columns:
            op.add_column('projects', sa.Column('description', sa.Text(), nullable=True))
        
        if 'status' not in columns:
            op.add_column('projects', sa.Column('status', sa.String(length=16), nullable=False, server_default='active'))
            op.create_check_constraint('ck_project_status', 'projects', "status IN ('active','archived','deleted')")
        
        if 'visibility' not in columns:
            op.add_column('projects', sa.Column('visibility', sa.String(length=16), nullable=False, server_default='private'))
            op.create_check_constraint('ck_project_visibility', 'projects', "visibility IN ('private','workspace','public')")
        
        if 'storage_mode' not in columns:
            op.add_column('projects', sa.Column('storage_mode', sa.String(length=16), nullable=False, server_default='local'))
            op.create_check_constraint('ck_project_storage_mode', 'projects', "storage_mode IN ('local','s3')")
        
        if 'settings' not in columns:
            op.add_column('projects', sa.Column('settings', postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default='{}'))


def downgrade() -> None:
    # Drop indexes first
    op.drop_index('idx_project_created_by', table_name='projects')
    op.drop_index('idx_project_workspace_id', table_name='projects')
    op.drop_index('idx_workspace_member_user', table_name='workspace_members')
    op.drop_index('idx_workspace_owner', table_name='workspaces')
    
    # Drop tables in reverse order (respecting foreign keys)
    op.drop_table('workspace_members')
    
    # For projects: if we're doing a full rollback, drop the table; otherwise restore old schema
    # (In practice, downgrade is rarely used in production – this is a safety net)
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [c['name'] for c in inspector.get_columns('projects')]
    
    if 'workspace_id' in columns:
        op.drop_constraint('fk_project_workspace', 'projects', type_='foreignkey')
        op.drop_column('projects', 'workspace_id')
    if 'created_by' in columns:
        op.drop_column('projects', 'created_by')
    if 'settings' in columns:
        op.drop_column('projects', 'settings')
    if 'storage_mode' in columns:
        op.drop_constraint('ck_project_storage_mode', 'projects', type_='check')
        op.drop_column('projects', 'storage_mode')
    if 'visibility' in columns:
        op.drop_constraint('ck_project_visibility', 'projects', type_='check')
        op.drop_column('projects', 'visibility')
    if 'status' in columns:
        op.drop_constraint('ck_project_status', 'projects', type_='check')
        op.drop_column('projects', 'status')
    if 'description' in columns:
        op.drop_column('projects', 'description')
    
    op.drop_table('workspaces')
