# CE Admin Module

The `admin/` folder implements the **Character Engine Administration** section of the Omni Frontend. It provides full CRUD management for the metadata layer that powers the Dynamic Form Engine — schemas, trait groups, trait definitions, trait options, trait packs, and relationship types.

Route prefix: `/ce/admin/**`  
Guard: `ce-admin.guard.ts` — `sc_mgr` and `sc_acct_mgr` roles only; unauthorized users are redirected to `/ce`.

---

## Folder Structure

```
admin/
├── ce-admin.md                        ← this file
├── guards/
│   └── ce-admin.guard.ts              ← route guard + role helpers
├── models/
│   ├── schema.model.ts
│   ├── trait-group.model.ts
│   ├── trait-def.model.ts             ← includes TraitValueType enum
│   ├── trait-option.model.ts
│   ├── trait-pack.model.ts
│   └── relationship-type.model.ts
├── components/
│   ├── admin-shell/
│   │   ├── ce-admin-shell.component.ts
│   │   └── ce-admin-shell.component.html
│   └── admin-navigation/
│       └── ce-admin-navigation.component.ts
├── schemas/
│   ├── schema.service.ts
│   ├── schema-list.component.ts
│   ├── schema-editor.component.ts
│   └── schemas-page.component.ts
├── trait-groups/
│   ├── trait-group.service.ts
│   ├── trait-group-list.component.ts
│   ├── trait-group-editor.component.ts
│   └── trait-groups-page.component.ts
├── trait-defs/
│   ├── trait-def.service.ts
│   ├── trait-def-list.component.ts
│   ├── trait-def-editor.component.ts
│   └── trait-defs-page.component.ts
├── trait-options/
│   ├── trait-option.service.ts
│   ├── trait-option-list.component.ts
│   ├── trait-option-editor.component.ts
│   └── trait-options-page.component.ts
├── trait-packs/
│   ├── trait-pack.service.ts
│   ├── trait-pack-list.component.ts
│   ├── trait-pack-editor.component.ts
│   └── trait-packs-page.component.ts
└── relationship-types/
    ├── relationship-type.service.ts
    ├── relationship-type-list.component.ts
    ├── relationship-type-editor.component.ts
    └── relationship-types-page.component.ts
```

---

## Guard & Role System

**File:** `guards/ce-admin.guard.ts`

| Export | Purpose |
|---|---|
| `ceAdminGuard` | `CanActivateFn` — gates the entire `/ce/admin` subtree |
| `CE_ADMIN_ROLES` | `['sc_mgr', 'sc_acct_mgr']` |
| `CE_ADMIN_PERMISSIONS` | Per-section role requirements (see below) |
| `hasAdminRole(auth, ...roles)` | Helper — safe to call in components/templates |

### Per-Section Permissions

| Section | sc_user | sc_mgr | sc_acct_mgr |
|---|:---:|:---:|:---:|
| Schemas | ✗ | ✗ | ✓ |
| Trait Groups | ✗ | ✓ | ✓ |
| Trait Definitions | ✗ | ✗ | ✓ |
| Trait Options | ✗ | ✗ | ✓ |
| Trait Packs | ✗ | ✓ | ✓ |
| Relationship Types | ✗ | ✓ | ✓ |

---

## Shell & Navigation

### `components/admin-shell/`

The outer host component for all admin routes. Renders a CSS grid with a fixed 240 px left navigation panel and a flex-fill main content area (`<router-outlet>`).

```
┌─────────────────────────────────────────────────────┐
│  CeAdminNavigationComponent (240px)  │  RouterOutlet │
└─────────────────────────────────────────────────────┘
```

### `components/admin-navigation/`

Left-panel navigation list. Filters the full `NAV_ITEMS` array using `hasAdminRole()` so that `sc_mgr` only sees the sections they are permitted to access.

| Label | Icon | Path |
|---|---|---|
| Schemas | `schema` | `schemas` |
| Trait Groups | `folder` | `trait-groups` |
| Trait Definitions | `tune` | `trait-defs` |
| Trait Options | `checklist` | `trait-options` |
| Trait Packs | `inventory_2` | `trait-packs` |
| Relationship Types | `share` | `relationship-types` |

---

## Data Models (`models/`)

### `Schema`

```typescript
interface Schema {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
}
```

A Schema is the top-level container for a character configuration. All other metadata entities belong to a schema.

### `TraitGroup`

```typescript
interface TraitGroup {
  id: string;
  schemaId: string;
  name: string;
  label: string;
  displayOrder: number;
  description?: string;
}
```

Organizes trait definitions into logical sections within a schema (e.g., "Physical", "Skills").

### `TraitDef`

```typescript
enum TraitValueType {
  TEXT, LONG_TEXT, NUMBER, BOOLEAN, DATE, SELECT, MULTI_SELECT
}

interface TraitDef {
  id: string;
  schemaId: string;
  groupId: string;
  name: string;
  label: string;
  valueType: TraitValueType;
  isRequired: boolean;
  displayOrder: number;
  description?: string;
}
```

A single field definition within a trait group. `valueType` determines the control rendered by the Dynamic Form Engine.

### `TraitOption`

```typescript
interface TraitOption {
  id: string;
  traitDefId: string;
  value: string;
  label: string;
  displayOrder: number;
}
```

Defines the allowed choices for `SELECT` / `MULTI_SELECT` trait definitions.

### `TraitPack`

```typescript
interface TraitPack {
  id: string;
  schemaId: string;
  name: string;
  description?: string;
  traitDefIds: string[];
}
```

A named bundle of trait definitions that can be applied as a unit when composing entity forms.

### `RelationshipType`

```typescript
interface RelationshipType {
  id: string;
  schemaId: string;
  name: string;
  description?: string;
}
```

Defines the named relationship kinds that can exist between entities within a schema (e.g., "Belongs To", "Commands").

---

## Feature Pattern

Every feature section (`schemas/`, `trait-groups/`, etc.) follows the same three-layer pattern:

```
*-page.component.ts   ← signal state + orchestration
  ├── *-list.component.ts    ← read-only display, emits selection / create
  └── *-editor.component.ts  ← reactive form, emits save / cancel
```

### Page Component

Owns all Angular signals (`items`, `selected`, `loading`, `saving`, `error`). Calls the service and propagates results into signals. Also pre-fetches any related data needed by the editor (e.g., the schemas list is loaded on the trait-groups page so the editor can offer a schema picker).

```
UI flow:
  onSelect(item)  → selected.set(item)          -- edit existing
  onNew()         → selected.set(null)           -- blank form
  onSave(data)    → service.create / update      -- persist
  onCancel()      → selected.set(undefined)      -- hide editor
```

### List Component

- Accepts `@Input() items`, `loading`, `selectedId`
- Emits `(selected)` and `(create)` events
- Includes a search/filter input
- Highlights the active row via `selectedId`

### Editor Component

- Accepts `@Input() item: T | null` (null = create mode), `saving`, `errorMsg`
- Emits `(save)` with the form value, `(cancel)`
- Reactive form (`FormBuilder`); calls `form.patchValue` on `ngOnChanges` when `item` changes
- Calls `form.markAllAsTouched()` before submitting to surface validation errors

---

## Services

All services are `providedIn: 'root'`, use `HttpClient`, and expose the same five methods:

```typescript
getAll(): Observable<T[]>
getById(id: string): Observable<T>
create(data: Omit<T, 'id'>): Observable<T>
update(id: string, data: Partial<Omit<T, 'id'>>): Observable<T>
delete(id: string): Observable<void>
```

Services that map between camelCase and the API's snake_case use private `fromApi` / `toApi` helpers.

| Service | API endpoint | Snake-case fields mapped |
|---|---|---|
| `SchemaService` | `GET/POST/PUT/DELETE /api/ce/schemas` | none (flat) |
| `TraitGroupService` | `/api/ce/trait-groups` | `schema_id`, `display_order` |
| `TraitDefService` | `/api/ce/traits` | `schema_id`, `group_id`, `value_type`, `is_required`, `display_order` |
| `TraitOptionService` | `/api/ce/trait-options` | `trait_def_id`, `display_order`; also `getByTraitDef(id)` |
| `TraitPackService` | `/api/ce/trait-packs` | `schema_id`, `trait_def_ids` |
| `RelationshipTypeService` | `/api/ce/relationships/types` | `schema_id` |

---

## Routes

Defined in `ce/ce.routes.ts` under the parent `/ce` route:

```
/ce/admin                     → CeAdminShellComponent  (guard: ceAdminGuard)
  /ce/admin/schemas            → SchemasPageComponent
  /ce/admin/trait-groups       → TraitGroupsPageComponent
  /ce/admin/trait-defs         → TraitDefsPageComponent
  /ce/admin/trait-options      → TraitOptionsPageComponent
  /ce/admin/trait-packs        → TraitPacksPageComponent
  /ce/admin/relationship-types → RelationshipTypesPageComponent
```

---

## Entity Relationship Diagram

```
Schema
  ├── TraitGroup (schemaId)
  │     └── TraitDef (schemaId + groupId)
  │           └── TraitOption (traitDefId)
  ├── TraitPack (schemaId) ──── TraitDef[]  (M:M via traitDefIds)
  └── RelationshipType (schemaId)
```

All child entities reference a `schemaId`; there is no cross-schema referencing.

---

## Styling

Components use `@use 'panel-common' as *;` which must be listed under `stylePreprocessorOptions.includePaths` in `angular.json`. The shell applies a CSS grid (`240px auto 1fr`) for the side-nav + divider + main-content layout.
