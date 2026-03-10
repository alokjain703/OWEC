# Character Engine (CE) Module

The Character Engine is a standalone Angular 17+ feature module that provides a schema-driven, templated character and entity management system for the OWEC platform. It supports dynamic trait composition, multi-level template inheritance, relationship graphing, and AI-assisted generation.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Directory Structure](#directory-structure)
- [Core Concepts](#core-concepts)
- [Routes](#routes)
- [Setup & Wiring](#setup--wiring)
- [Services](#services)
- [Engine Layer](#engine-layer)
- [Components](#components)
- [Models](#models)
- [Config](#config)
- [API Reference](#api-reference)
- [Extending the Module](#extending-the-module)

---

## Overview

The Character Engine lets you:

- Define **schemas** (e.g. `character`, `faction`, `location`, `item`, `event`) that describe what kind of entity is being modelled.
- Build **templates** in a 5-level inheritance chain (`XS → S → M → L → XL`) that progressively add traits.
- Attach **trait packs** (reusable bundles of traits, e.g. `psychology`, `combat`, `magic`) to any entity.
- Edit entities through a **dynamic trait form** that resolves the full trait set from schema + template chain + trait packs at runtime.
- Visualise **entity relationships** as an interactive D3 graph.
- Use **AI-assisted generation** to suggest traits, backstory, and relationships.

---

## Architecture

```
app.config.ts
  └─ provideCharacterEngine()          ← registers all 8 CE services

app.routes.ts
  └─ /ce  → CE_ROUTES (lazy-loaded)
        ├─ /ce/characters              → CeCharacterEditorComponent
        ├─ /ce/characters/:entityId    → CeCharacterEditorComponent
        └─ /ce/relationships           → CeRelationshipGraphComponent
```

The module is fully standalone — no NgModules are used. All services are tree-shake-friendly and provided at the environment level via `provideCharacterEngine()`.

---

## Directory Structure

```
src/app/ce/
├── Readme-ce.md                        ← this file
├── index.ts                            ← public API barrel
├── ce-character-engine.feature.ts      ← internal barrel (re-exports everything)
├── ce-character-engine.providers.ts    ← provideCharacterEngine() factory
├── ce.routes.ts                        ← lazy route definitions
│
├── models/
│   ├── ce-schema.model.ts              ← CeSchema
│   ├── ce-template.model.ts            ← CeTemplate, CeTemplateLevel
│   ├── ce-trait.model.ts               ← CeTraitDef, CeTraitPack, CeResolvedTrait
│   ├── ce-entity.model.ts              ← CeEntity
│   └── ce-relationship.model.ts        ← CeRelationship, CeRelationshipType,
│                                          CeGraphNode, CeGraphEdge
│
├── config/
│   └── ce-schema-config.ts             ← CE_TEMPLATE_LEVELS, CE_TRAIT_INPUT_MAP
│
├── services/
│   ├── ce-api-base.ts                  ← CE_API_BASE constant
│   ├── ce-entity.service.ts            ← CRUD + trait operations for entities
│   ├── ce-trait.service.ts             ← Trait def and trait pack CRUD
│   ├── ce-template.service.ts          ← Template CRUD
│   ├── ce-relationship.service.ts      ← Relationship CRUD + graph data
│   └── ce-ai.service.ts               ← AI-assisted trait / backstory generation
│
├── engine/
│   ├── ce-schema-registry.service.ts   ← Signal-based runtime registry
│   ├── ce-template-resolver.service.ts ← Template inheritance chain resolver
│   └── ce-trait-resolver.service.ts    ← Merged trait resolver for an entity
│
└── components/
    ├── ce-character-editor.component.ts   ← Main entity edit surface
    ├── ce-entity-list.component.ts        ← Entity list display
    ├── ce-template-selector.component.ts  ← XS/S/M/L/XL toggle
    ├── ce-trait-editor.component.ts       ← Dynamic single-trait field
    └── ce-relationship-graph.component.ts ← D3 relationship graph wrapper
```

---

## Core Concepts

### Schema
A schema defines what _type_ of thing an entity is (character, location, faction, etc.). Schemas own a set of schema-level trait definitions that apply to all entities of that type.

### Template & Inheritance
Templates sit within a schema and are arranged in five levels: `XS → S → M → L → XL`. Each level references an optional `inheritsFrom` level, forming a chain. When an entity is assigned template level `M`, the engine resolves traits from all levels in the chain: `XS`, `S`, `M`.

### Trait Definitions
A `CeTraitDef` describes a single data field: its label, input type (`string`, `number`, `boolean`, `text`, `select`, `relationship`), grouping, and the source that contributes it (`schema | template | pack`).

### Trait Packs
Trait packs are reusable collections of trait definitions (e.g. `psychology` adds personality traits, `combat` adds strength/speed). An entity opts in to any number of packs.

### Resolved Traits
At edit time, `CeTraitResolverService` merges schema traits + template-chain traits + active pack traits into a deduplicated `CeResolvedTrait[]`, then overlays the entity's saved values.

### Relationships
Entities can be linked by typed directed edges (friend, enemy, mentor, member_of). The graph view renders these as an interactive D3 force-directed diagram.

---

## Routes

| URL | Component | Description |
|---|---|---|
| `/ce/characters` | `CeCharacterEditorComponent` | Create a new entity |
| `/ce/characters/:entityId` | `CeCharacterEditorComponent` | Edit an existing entity |
| `/ce/relationships` | `CeRelationshipGraphComponent` | View all entity relationships |

All CE routes are protected by `authGuard` (applied at the parent `/ce` route in `app.routes.ts`).

---

## Setup & Wiring

The module is already registered in the application. For reference, the two integration points are:

**`app.config.ts`** — registers all CE services:
```ts
import { provideCharacterEngine } from './ce';

export const appConfig: ApplicationConfig = {
  providers: [
    // ... other providers
    provideCharacterEngine(),
  ],
};
```

**`app.routes.ts`** — lazy-loads CE routes under `/ce`:
```ts
{
  path: 'ce',
  canActivate: [authGuard],
  loadChildren: () => import('./ce/ce.routes').then((m) => m.CE_ROUTES),
},
```

---

## Services

### `CeEntityService`
Manages entities (characters, factions, locations, etc.).

```ts
// List all entities
listEntities(): Observable<CeEntity[]>

// Get a single entity
getEntity(id: string): Observable<CeEntity>

// Create a new entity
createEntity(data: Partial<CeEntity>): Observable<CeEntity>

// Update an existing entity
updateEntity(id: string, data: Partial<CeEntity>): Observable<CeEntity>

// Delete an entity
deleteEntity(id: string): Observable<void>

// Get all traits for an entity
listEntityTraits(entityId: string): Observable<CeResolvedTrait[]>

// Save trait values for an entity (full replace)
putEntityTraits(entityId: string, traits: CeResolvedTrait[]): Observable<void>

// Get the fully-resolved trait set (schema + template + packs merged)
getResolvedTraits(entityId: string): Observable<CeResolvedTrait[]>
```

### `CeTraitService`
Manages trait definitions and trait packs.

```ts
listTraitDefs(schemaId?: string): Observable<CeTraitDef[]>
createTraitDef(data: Partial<CeTraitDef>): Observable<CeTraitDef>
updateTraitDef(id: string, data: Partial<CeTraitDef>): Observable<CeTraitDef>
deleteTraitDef(id: string): Observable<void>

listTraitPacks(): Observable<CeTraitPack[]>
createTraitPack(data: Partial<CeTraitPack>): Observable<CeTraitPack>
updateTraitPack(id: string, data: Partial<CeTraitPack>): Observable<CeTraitPack>
deleteTraitPack(id: string): Observable<void>
```

### `CeTemplateService`
Manages templates within a schema.

```ts
listTemplates(schemaId?: string): Observable<CeTemplate[]>
createTemplate(data: Partial<CeTemplate>): Observable<CeTemplate>
updateTemplate(id: string, data: Partial<CeTemplate>): Observable<CeTemplate>
deleteTemplate(id: string): Observable<void>
```

### `CeRelationshipService`
Manages entity relationships and provides graph data.

```ts
listRelationships(entityId?: string): Observable<CeRelationship[]>
createRelationship(data: Partial<CeRelationship>): Observable<CeRelationship>
deleteRelationship(id: string): Observable<void>

// Returns { nodes: CeGraphNode[], edges: CeGraphEdge[] } for the graph view
getGraph(): Observable<{ nodes: CeGraphNode[]; edges: CeGraphEdge[] }>
```

### `CeAiService`
AI-assisted content generation.

```ts
// Suggest trait values for an entity given its schema + template context
generateTraits(entityId: string): Observable<Record<string, unknown>>

// Generate a narrative backstory for an entity
generateBackstory(entityId: string): Observable<{ backstory: string }>

// Suggest relationships to other entities
suggestRelationships(entityId: string): Observable<CeRelationship[]>
```

---

## Engine Layer

The engine services are stateless helpers that operate on data already loaded into the registry.

### `CeSchemaRegistryService`
Signal-based in-memory store for all CE reference data. Populated during `CeCharacterEditorComponent.loadRegistry()`.

```ts
// Setters (called once during bootstrap)
setSchemas(schemas: CeSchema[]): void
setTemplates(templates: CeTemplate[]): void
setTraitDefs(defs: CeTraitDef[]): void
setTraitPacks(packs: CeTraitPack[]): void
setRelationshipTypes(types: CeRelationshipType[]): void

// Getters (optionally filtered by schemaId)
schemas(): CeSchema[]
templates(schemaId?: string): CeTemplate[]
traitDefs(schemaId?: string): CeTraitDef[]
traitPacks(): CeTraitPack[]
relationshipTypes(): CeRelationshipType[]
```

### `CeTemplateResolverService`
Resolves the full inheritance chain for a given template level.

```ts
// Given all templates for a schema and a target level,
// returns the ordered chain from root to target, e.g. ['XS','S','M']
resolveTemplateChain(templates: CeTemplate[], level: CeTemplateLevel): CeTemplateLevel[]
```

### `CeTraitResolverService`
Merges traits from all sources into a flat, deduplicated list.

```ts
// Returns all traits applicable to an entity,
// with saved values from entity.traits overlaid
resolveTraits(entity: CeEntity): CeResolvedTrait[]
```

Resolution order (later sources win on duplicate `traitKey`):
1. Schema-level trait defs
2. Template-chain trait defs (XS → … → selected level)
3. Active trait pack trait defs

---

## Components

### `CeCharacterEditorComponent` — `ce-character-editor`
The main entity editing surface. Manages the full lifecycle: loading the registry, resolving traits, rendering the trait form, and saving.

```html
<!-- Standalone usage (entityId optional; omit to create new) -->
<ce-character-editor [entityId]="'abc-123'" />
```

It also reads `:entityId` from the Angular router when mounted at `/ce/characters/:entityId`.

**Signals used:** `entity`, `resolvedTraits`, `traitValues`, `templateLevel`, `loading`

### `CeEntityListComponent` — `ce-entity-list`
Displays a list of entities and emits a selection event.

```html
<ce-entity-list [entities]="entities" (entitySelected)="onSelect($event)" />
```

### `CeTemplateSelectorComponent` — `ce-template-selector`
A button toggle group for picking a template level.

```html
<ce-template-selector
  [selected]="templateLevel"
  (selectedChange)="handleTemplateChange($event)"
/>
```

### `CeTraitEditorComponent` — `ce-trait-editor`
Renders a single dynamic form field based on the trait's type.

| Trait type | Rendered control |
|---|---|
| `string` | `<input type="text">` |
| `text` | `<textarea>` |
| `number` | `<input type="number">` |
| `boolean` | `<mat-checkbox>` |
| `select` | `<mat-select>` |
| `relationship` | Relationship picker |

```html
<ce-trait-editor
  [trait]="resolvedTrait"
  [value]="traitValues[resolvedTrait.traitKey]"
  (valueChange)="handleTraitChange(resolvedTrait.traitKey, $event)"
/>
```

### `CeRelationshipGraphComponent` — `ce-relationship-graph`
Wraps the existing D3 force-directed graph from `features/relationships`. If no `nodes`/`edges` inputs are provided it auto-loads from the API.

```html
<!-- Auto-load all relationships -->
<ce-relationship-graph
  (nodeSelected)="onNodeClick($event)"
  (edgeSelected)="onEdgeClick($event)"
/>

<!-- Or pass pre-loaded data -->
<ce-relationship-graph [nodes]="nodes" [edges]="edges" />
```

---

## Models

### `CeSchema`
```ts
interface CeSchema {
  id: string;
  name: string;          // e.g. 'character', 'faction'
  templates: string[];
  traitPacks: string[];
  relationships: string[];
}
```

### `CeTemplate`
```ts
type CeTemplateLevel = 'XS' | 'S' | 'M' | 'L' | 'XL';

interface CeTemplate {
  id: string;
  schemaId: string;
  level: CeTemplateLevel;
  inheritsFrom?: CeTemplateLevel;
}
```

### `CeTraitDef`
```ts
type CeTraitSource = 'schema' | 'template' | 'pack';
type CeTraitType = 'string' | 'number' | 'boolean' | 'text' | 'select' | 'relationship';

interface CeTraitDef {
  id: string;
  schemaId?: string;
  label: string;
  type: CeTraitType;
  group: string;
  source: CeTraitSource;
  traitKey?: string;
}
```

### `CeEntity`
```ts
interface CeEntity {
  id: string;
  schema: string;              // schema name
  template: CeTemplateLevel;
  traitPacks: string[];
  traits: Record<string, unknown>;
  name?: string;
  metadata?: Record<string, unknown>;
}
```

### `CeRelationship`
```ts
interface CeRelationship {
  id: string;
  source: string;              // source entity id
  target: string;              // target entity id
  type: string;                // relationship type id
}

interface CeGraphNode { id: string; label: string; type: string; }
interface CeGraphEdge { source: string; target: string; relationshipType: string; }
```

---

## Config

### `CE_TEMPLATE_LEVELS`
```ts
const CE_TEMPLATE_LEVELS: CeTemplateLevel[] = ['XS', 'S', 'M', 'L', 'XL'];
```

### `CE_TRAIT_INPUT_MAP`
Maps a trait type to an HTML/Material input control identifier:
```ts
const CE_TRAIT_INPUT_MAP: Record<CeTraitType, string> = {
  string: 'input',
  text: 'textarea',
  number: 'number',
  boolean: 'boolean',
  select: 'select',
  relationship: 'relationship',
};
```

---

## API Reference

All CE requests go to `http://localhost:8052/api/ce` (configurable via `window.__OMNI_CE_API_BASE__`).

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/schemas` | List all schemas |
| `GET` | `/templates?schema_id=` | List templates (optionally filtered) |
| `GET` | `/trait-defs?schema_id=` | List trait definitions |
| `GET` | `/trait-packs` | List trait packs |
| `GET` | `/entities` | List all entities |
| `GET` | `/entities/:id` | Get single entity |
| `POST` | `/entities` | Create entity |
| `PUT` | `/entities/:id` | Update entity |
| `DELETE` | `/entities/:id` | Delete entity |
| `GET` | `/entities/:id/traits` | List raw entity traits |
| `PUT` | `/entities/:id/traits` | Replace entity traits |
| `GET` | `/entities/:id/traits/resolved` | Get merged trait set |
| `GET` | `/relationships?entity_id=` | List relationships |
| `POST` | `/relationships` | Create relationship |
| `DELETE` | `/relationships/:id` | Delete relationship |
| `GET` | `/relationships/graph` | Get graph nodes + edges |
| `GET` | `/relationship-types` | List relationship types |
| `POST` | `/ai/traits/:entityId` | AI-generate trait values |
| `POST` | `/ai/backstory/:entityId` | AI-generate backstory |
| `POST` | `/ai/relationships/:entityId` | AI-suggest relationships |

Backend Swagger docs: **http://localhost:8052/docs**

---

## Extending the Module

### Adding a new schema type
1. Seed the schema in `omni-backend/scripts/seed_ce.py`.
2. Add templates and trait defs for it in the same script, then re-seed.

### Adding a new trait type
1. Add the type string to `CeTraitType` in `models/ce-trait.model.ts`.
2. Add the input mapping in `config/ce-schema-config.ts` (`CE_TRAIT_INPUT_MAP`).
3. Add a rendered case in `ce-trait-editor.component.ts`.

### Adding a new CE route
1. Add the route to `ce.routes.ts`.
2. Create the corresponding standalone component under `components/`.
3. Export it from `ce-character-engine.feature.ts`.
