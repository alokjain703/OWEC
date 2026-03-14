-- ============================================================
-- OMNI – Core Schema
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -------------------------------------------------------
-- workspace_cache (from RAMPS)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS workspace_cache (
    id               UUID        PRIMARY KEY,
    name             TEXT        NOT NULL,
    description      TEXT,
    workspace_type   TEXT,
    status           TEXT        NOT NULL DEFAULT 'active',
    created_at       TIMESTAMPTZ NOT NULL,
    updated_at       TIMESTAMPTZ NOT NULL,
    synced_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workspace_cache_status ON workspace_cache(status);

-- -------------------------------------------------------
-- project_cache (from RAMPS)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS project_cache (
    id               UUID        PRIMARY KEY,
    workspace_id     UUID        NOT NULL,
    name             TEXT        NOT NULL,
    description      TEXT,
    project_type     TEXT,
    status           TEXT        NOT NULL DEFAULT 'active',
    created_at       TIMESTAMPTZ NOT NULL,
    updated_at       TIMESTAMPTZ NOT NULL,
    synced_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_cache_workspace_id ON project_cache(workspace_id);
CREATE INDEX IF NOT EXISTS idx_project_cache_status ON project_cache(status);

-- -------------------------------------------------------
-- user_workspace_access (from RAMPS)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_workspace_access (
    user_id          UUID        NOT NULL,
    workspace_id     UUID        NOT NULL,
    role             TEXT        NOT NULL,
    granted_at       TIMESTAMPTZ NOT NULL,
    synced_at        TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (user_id, workspace_id)
);

CREATE INDEX IF NOT EXISTS idx_user_workspace_access_user_id ON user_workspace_access(user_id);
CREATE INDEX IF NOT EXISTS idx_user_workspace_access_workspace_id ON user_workspace_access(workspace_id);

-- -------------------------------------------------------
-- projects
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS projects (
    id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id           UUID        NOT NULL,
    title              TEXT        NOT NULL,
    active_schema_id   UUID,
    schema_version_id  UUID,
    created_at         TIMESTAMPTZ DEFAULT now(),
    updated_at         TIMESTAMPTZ DEFAULT now()
);

-- -------------------------------------------------------
-- nodes  (recursive tree – depth-indexed)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS nodes (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id  UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    parent_id   UUID        REFERENCES nodes(id) ON DELETE CASCADE,

    depth       INT         NOT NULL,
    order_index INT         NOT NULL,
    order_key   NUMERIC,
    node_role   TEXT        NOT NULL,   -- 'universe' | 'collection' | 'major_unit' | 'atomic_unit'

    title       TEXT,
    content     TEXT,
    content_format TEXT     NOT NULL DEFAULT 'html',

    path        TEXT,
    has_children BOOLEAN    NOT NULL DEFAULT FALSE,

    metadata    JSONB       NOT NULL DEFAULT '{}'::jsonb,

    created_at  TIMESTAMPTZ DEFAULT now(),
    updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nodes_project_id  ON nodes(project_id);
CREATE INDEX IF NOT EXISTS idx_nodes_parent_id   ON nodes(parent_id);
CREATE INDEX IF NOT EXISTS idx_nodes_depth       ON nodes(depth);
CREATE INDEX IF NOT EXISTS idx_nodes_node_role   ON nodes(node_role);
CREATE INDEX IF NOT EXISTS idx_nodes_path        ON nodes(path);
CREATE INDEX IF NOT EXISTS idx_nodes_order_key   ON nodes(project_id, parent_id, order_key);
CREATE INDEX IF NOT EXISTS idx_nodes_metadata    ON nodes USING GIN (metadata);

-- -------------------------------------------------------
-- entities  (characters, factions, items – fully independent)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS entities (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id  UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    entity_type TEXT        NOT NULL,   -- 'character' | 'faction' | 'item' | …
    name        TEXT        NOT NULL,
    description TEXT,

    attributes  JSONB       NOT NULL DEFAULT '{}'::jsonb,
    state       JSONB       NOT NULL DEFAULT '{}'::jsonb,

    created_at  TIMESTAMPTZ DEFAULT now()
);

-- -------------------------------------------------------
-- events  (timeline – NOT coupled to tree nodes)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS events (
    id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id     UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    source_node_id UUID        REFERENCES nodes(id) ON DELETE SET NULL,   -- optional origin hint

    title          TEXT        NOT NULL,
    description    TEXT,

    start_time     TIMESTAMPTZ,
    end_time       TIMESTAMPTZ,

    time_data      JSONB       NOT NULL,   -- supports custom calendars, relative offsets, etc.

    created_at     TIMESTAMPTZ DEFAULT now()
);

-- -------------------------------------------------------
-- event_entities  (many-to-many: events ↔ entities)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS event_entities (
    event_id   UUID  REFERENCES events(id)   ON DELETE CASCADE,
    entity_id  UUID  REFERENCES entities(id) ON DELETE CASCADE,
    role       TEXT,
    metadata   JSONB NOT NULL DEFAULT '{}'::jsonb,
    PRIMARY KEY (event_id, entity_id)
);

-- -------------------------------------------------------
-- edges  (graph layer – entity↔entity  AND  node↔entity)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS edges (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id    UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    from_node     UUID        REFERENCES nodes(id)    ON DELETE CASCADE,
    to_node       UUID        REFERENCES nodes(id)    ON DELETE CASCADE,

    from_entity   UUID        REFERENCES entities(id) ON DELETE CASCADE,
    to_entity     UUID        REFERENCES entities(id) ON DELETE CASCADE,

    relation_type TEXT        NOT NULL,
    metadata      JSONB       NOT NULL DEFAULT '{}'::jsonb,

    created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_edges_project_id   ON edges(project_id);
CREATE INDEX IF NOT EXISTS idx_edges_from_node    ON edges(from_node);
CREATE INDEX IF NOT EXISTS idx_edges_to_node      ON edges(to_node);
CREATE INDEX IF NOT EXISTS idx_edges_from_entity  ON edges(from_entity);
CREATE INDEX IF NOT EXISTS idx_edges_to_entity    ON edges(to_entity);

-- -------------------------------------------------------
-- schemas  (Bible layer – swappable without migration)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS schemas (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT        NOT NULL,
    version     INT         NOT NULL DEFAULT 1,
    definition  JSONB       NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT now(),
    UNIQUE(name, version)
);
