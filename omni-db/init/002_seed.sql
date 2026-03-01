-- ============================================================
-- OMNI – Seed: Bible Schemas
-- Universe → Collection → Major Unit → Atomic Unit
-- ============================================================

INSERT INTO schemas (name, version, definition) VALUES

-- -------------------------------------------------------
-- BOOK SERIES
-- -------------------------------------------------------
(
  'BOOK_SERIES', 1,
  '{
    "roles": {
      "universe":    {"label": "Universe",  "description": "The top-level fictional universe"},
      "collection":  {"label": "Series",    "description": "A named series within the universe"},
      "major_unit":  {"label": "Book",      "description": "A single book in the series"},
      "atomic_unit": {"label": "Chapter",   "description": "A chapter inside a book"}
    },
    "allowed_children": {
      "universe":    ["collection"],
      "collection":  ["major_unit"],
      "major_unit":  ["atomic_unit"],
      "atomic_unit": []
    },
    "metadata_definitions": {
      "collection": {
        "genre":    {"type": "string",  "required": false},
        "logline":  {"type": "string",  "required": false},
        "themes":   {"type": "array",   "items": {"type": "string"}, "required": false}
      },
      "major_unit": {
        "book_number":  {"type": "integer", "required": true},
        "word_count":   {"type": "integer", "required": false},
        "isbn":         {"type": "string",  "required": false}
      },
      "atomic_unit": {
        "pov":         {"type": "string", "required": false},
        "scene_type":  {"type": "string", "enum": ["action","dialogue","internal","transition"], "required": false},
        "word_count":  {"type": "integer","required": false}
      }
    }
  }'::jsonb
),

-- -------------------------------------------------------
-- TV SERIES
-- -------------------------------------------------------
(
  'TV_SERIES', 1,
  '{
    "roles": {
      "universe":    {"label": "Universe",  "description": "The shared fictional universe"},
      "collection":  {"label": "Show",      "description": "A television series"},
      "major_unit":  {"label": "Season",    "description": "A production season"},
      "atomic_unit": {"label": "Episode",   "description": "A single episode"}
    },
    "allowed_children": {
      "universe":    ["collection"],
      "collection":  ["major_unit"],
      "major_unit":  ["atomic_unit"],
      "atomic_unit": []
    },
    "metadata_definitions": {
      "collection": {
        "network":      {"type": "string", "required": false},
        "format":       {"type": "string", "enum": ["live-action","animated","hybrid"], "required": false},
        "genre":        {"type": "string", "required": false}
      },
      "major_unit": {
        "season_number":  {"type": "integer", "required": true},
        "episode_count":  {"type": "integer", "required": false},
        "air_year":       {"type": "integer", "required": false}
      },
      "atomic_unit": {
        "episode_number": {"type": "integer", "required": true},
        "air_date":       {"type": "string",  "format": "date", "required": false},
        "runtime_mins":   {"type": "integer", "required": false},
        "cold_open":      {"type": "boolean", "required": false}
      }
    }
  }'::jsonb
),

-- -------------------------------------------------------
-- MOVIE SERIES
-- -------------------------------------------------------
(
  'MOVIE_SERIES', 1,
  '{
    "roles": {
      "universe":    {"label": "Universe",   "description": "The cinematic universe"},
      "collection":  {"label": "Franchise",  "description": "A film franchise or sub-saga"},
      "major_unit":  {"label": "Film",       "description": "A feature film"},
      "atomic_unit": {"label": "Sequence",   "description": "A narrative sequence / act inside the film"}
    },
    "allowed_children": {
      "universe":    ["collection"],
      "collection":  ["major_unit"],
      "major_unit":  ["atomic_unit"],
      "atomic_unit": []
    },
    "metadata_definitions": {
      "collection": {
        "studio":    {"type": "string", "required": false},
        "sub_genre": {"type": "string", "required": false}
      },
      "major_unit": {
        "release_year":    {"type": "integer", "required": false},
        "budget_usd":      {"type": "number",  "required": false},
        "runtime_mins":    {"type": "integer", "required": false},
        "mpaa_rating":     {"type": "string",  "required": false}
      },
      "atomic_unit": {
        "sequence_number": {"type": "integer", "required": false},
        "sequence_type":   {"type": "string",  "enum": ["setup","confrontation","climax","denouement"], "required": false},
        "location":        {"type": "string",  "required": false}
      }
    }
  }'::jsonb
),

-- -------------------------------------------------------
-- GAME PROJECT
-- -------------------------------------------------------
(
  'GAME_PROJECT', 1,
  '{
    "roles": {
      "universe":    {"label": "Universe",  "description": "The game world / IP"},
      "collection":  {"label": "Game",      "description": "A specific game title"},
      "major_unit":  {"label": "Act",       "description": "A narrative act or chapter"},
      "atomic_unit": {"label": "Quest",     "description": "A discrete quest or mission"}
    },
    "allowed_children": {
      "universe":    ["collection"],
      "collection":  ["major_unit"],
      "major_unit":  ["atomic_unit"],
      "atomic_unit": []
    },
    "metadata_definitions": {
      "collection": {
        "platforms":      {"type": "array", "items": {"type": "string"}, "required": false},
        "engine":         {"type": "string", "required": false},
        "genre":          {"type": "string", "required": false}
      },
      "major_unit": {
        "act_number":     {"type": "integer", "required": true},
        "branching":      {"type": "boolean", "required": false},
        "unlock_trigger": {"type": "string",  "required": false}
      },
      "atomic_unit": {
        "quest_type":     {"type": "string", "enum": ["main","side","hidden","daily"], "required": false},
        "level_range":    {"type": "string", "required": false},
        "repeatable":     {"type": "boolean","required": false},
        "reward_data":    {"type": "object", "required": false}
      }
    }
  }'::jsonb
);
