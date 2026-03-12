# CE Module — Change Log

_Last updated: March 11, 2026_

---

## 1. Edge Inspector Fixes

**File:** `graph/ce-edge-inspector.component.ts`

- Added `editedMetadataStr` and `metadataError` properties for inline metadata editing.
- Added `onMetadataChange()` method to validate JSON input before saving.
- Added `edgeTypeLabel` getter that resolves a relationship-type ID to its human-readable name via `relTypes`, fixing the edge pill displaying a raw UUID instead of the type name.
- Improved relationship lookup: falls back to source + target + type composite-key lookup when a UUID-keyed lookup fails, so metadata is correctly displayed when clicking an edge.

---

## 2. Metadata Editing in Create Relationship Views

**Files:**
- `graph/ce-create-relationship-panel.component.ts`
- `graph/ce-relationship-dialog.component.ts`

- Added a JSON textarea input to both create-relationship views so users can supply edge metadata when creating a new relationship.
- Added `onMetadataChange()` validation (same pattern as edge inspector) to each component.

---

## 3. Removed Relationship Type Editor

**Deleted:**
- `components/ce-relationship-type-editor.component.ts`

**Modified:**
- `ce/ce.routes.ts` — removed `rel-types` route.
- `app.component.ts` — removed "Rel Types" nav entries from both nav arrays.
- `graph/ce-graph-toolbar.component.ts` — removed toolbar button and `RouterModule` import.
- `graph/ce-property-inspector.component.ts` — removed inspector buttons and `RouterModule` import.

---

## 4. CE Dynamic Form Engine — New Scaffold

### 4a. Models

| File | Description |
|---|---|
| `models/ce-trait-group.model.ts` | `CeEditorTrait` (id, name, label, type, required, value, options) and `CeTraitGroup` (name, traits) |
| `models/ce-editor-response.model.ts` | `CeEditorEntity`, `CeEditorResponse` (entity + groups), `CeTraitSaveItem` |
| `models/ce-schema.model.ts` | **Updated** — added `description?: string` field |

### 4b. Engine Services

| File | Description |
|---|---|
| `engine/dynamic-form.service.ts` | `buildForm(traits)` → `FormGroup`; `flattenToPayload(form)` → `{trait, value}[]`; applies `Validators.required` and number-pattern validators |
| `engine/schema.service.ts` | `getGroups()`, `flattenTraits()`, `groupBy()` helpers |

### 4c. API Service

| File | Description |
|---|---|
| `services/ce-api.service.ts` | `getEditorData(entityId)` → `Observable<CeEditorResponse>`; `saveTraits(entityId, payload)` → `Observable<CeTraitSaveItem[]>` |
| `services/ce-schema.service.ts` | **Updated** — added `createSchema()`, `updateSchema()`, `deleteSchema()` |

### 4d. Dynamic Rendering Components

| File | Description |
|---|---|
| `components/dynamic/ce-dynamic-field.component.ts` | Standalone, OnPush; renders a single trait as `text / long_text / number / boolean / select` input via `*ngSwitch`; throws on missing form control in `ngOnInit` |
| `components/dynamic/ce-dynamic-form.component.ts` | Standalone, OnPush; renders grouped trait sections in a CSS grid; calls `markAllAsTouched` on invalid submit; emits `formSubmit` output |

### 4e. Admin Guard

| File | Description |
|---|---|
| `guards/ce-admin.guard.ts` | `ceAdminGuard: CanActivateFn`; redirects to `/ce` if user lacks `sc_mgr` or `sc_acct_mgr` role; exports `CE_ADMIN_PERMISSIONS` map and `hasAdminRole()` helper |

### 4f. Admin Shell & Panels

| File | Description |
|---|---|
| `admin/ce-admin-shell.component.ts` | 3-panel shell: 220 px left nav (role-filtered via `hasAdminRole()`), right `<router-outlet>` |
| `admin/schemas/ce-admin-schemas.component.ts` | Full list + editor; calls `listSchemas()`, `createSchema()`, `updateSchema()` |
| `admin/trait-packs/ce-admin-trait-packs.component.ts` | Full list + editor; calls `listTraitPacks()`, `createTraitPack()`, `updateTraitPack()` |
| `admin/relationship-types/ce-admin-rel-types.component.ts` | Full list + editor; calls `listRelationshipTypes()`, `createRelationshipType()`, `updateRelationshipType()` |
| `admin/trait-defs/ce-admin-trait-defs.component.ts` | Full list + editor with type selector (`text \| long_text \| number \| boolean \| select`); calls `listTraitDefs()`, `createTraitDef()`, `updateTraitDef()` |
| `admin/trait-groups/ce-admin-trait-groups.component.ts` | Placeholder — explains groups are managed via the `group` field on trait defs |
| `admin/trait-options/ce-admin-trait-options.component.ts` | Placeholder — explains options are managed inline in the trait def editor |

### 4g. Routing

**File:** `ce/ce.routes.ts`

Added lazy-loaded `/admin` route tree, all guarded by `ceAdminGuard`:

| URL | Component |
|---|---|
| `/ce/admin` | → redirects to `schemas` |
| `/ce/admin/schemas` | `CeAdminSchemasComponent` |
| `/ce/admin/trait-groups` | `CeAdminTraitGroupsComponent` |
| `/ce/admin/trait-defs` | `CeAdminTraitDefsComponent` |
| `/ce/admin/trait-options` | `CeAdminTraitOptionsComponent` |
| `/ce/admin/trait-packs` | `CeAdminTraitPacksComponent` |
| `/ce/admin/relationship-types` | `CeAdminRelTypesComponent` |
