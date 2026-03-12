# CE Dynamic Form Engine

## Overview

The Dynamic Form Engine renders entity trait-editing forms driven entirely by server-side schema data. Rather than hand-coding a form for each entity type, the engine fetches a descriptor from the API and constructs an `Angular FormGroup` at runtime — one control per trait, with validators and field types inferred from the schema.

```
API response
  └── CeEditorResponse
        ├── entity   (id, name, schema)
        └── groups[] (CeTraitGroup)
              └── traits[] (CeEditorTrait)
                    id | name | label | type | required | value | options?
                                  │
                          DynamicFormService.buildForm()
                                  │
                            Angular FormGroup
                                  │
                        CeDynamicFormComponent
                              renders
                        CeDynamicFieldComponent × N
```

---

## File Locations

| Layer | File | Role |
|---|---|---|
| **Models** | `ce/models/ce-trait-group.model.ts` | `CeEditorTrait`, `CeTraitGroup` |
| **Models** | `ce/models/ce-editor-response.model.ts` | `CeEditorResponse`, `CeTraitSaveItem` |
| **Engine** | `ce/engine/dynamic-form.service.ts` | Builds `FormGroup`; flattens to save payload |
| **Engine** | `ce/engine/schema.service.ts` | Extracts/groups traits from `CeEditorResponse` |
| **API** | `ce/services/ce-api.service.ts` | `getEditorData()`, `saveTraits()` |
| **Component** | `ce/components/dynamic/ce-dynamic-field.component.ts` | Renders a single trait field |
| **Component** | `ce/components/dynamic/ce-dynamic-form.component.ts` | Renders grouped form sections |

---

## Data Models

### `CeEditorTrait`

Single trait descriptor returned by the editor endpoint.

```typescript
export interface CeEditorTrait {
  id: string;
  name: string;       // FormControl key
  label: string;      // Display label
  type: string;       // text | long_text | number | boolean | select
  required: boolean;
  value: unknown;     // Current persisted value
  options?: string[]; // Populated for `select` types
}
```

### `CeTraitGroup`

A named section grouping related traits together.

```typescript
export interface CeTraitGroup {
  name: string;
  traits: CeEditorTrait[];
}
```

### `CeEditorResponse`

Full API response for a single entity's editor view.

```typescript
export interface CeEditorResponse {
  entity: {
    id: string;
    name: string;
    schema: string;
  };
  groups: CeTraitGroup[];
}
```

### `CeTraitSaveItem`

Flat payload item used when persisting trait values.

```typescript
export interface CeTraitSaveItem {
  trait: string;  // matches CeEditorTrait.name
  value: unknown;
}
```

---

## Engine Services

### `DynamicFormService`

Located: `ce/engine/dynamic-form.service.ts`

Converts trait descriptors into a reactive `FormGroup`.

#### `buildForm(traits: CeEditorTrait[]): FormGroup`

Creates one `FormControl` per trait. Automatically applies:

| Condition | Validator applied |
|---|---|
| `trait.required === true` | `Validators.required` |
| `trait.type === 'number'` | `Validators.pattern(/^-?\d*(\.\d+)?$/)` |

Default values are coerced by type:

| Type | Default |
|---|---|
| `boolean` | `false` |
| `number` | `null` |
| all others | `''` |

If `trait.value` is already set, the persisted value is used.

#### `flattenToPayload(form: FormGroup): { trait: string; value: unknown }[]`

Converts form values back into the array format expected by `PUT /entities/{id}/traits`.

```typescript
// Example output:
[
  { trait: 'age',         value: 34     },
  { trait: 'personality', value: 'bold' },
  { trait: 'is_leader',  value: true   },
]
```

---

### `SchemaService`

Located: `ce/engine/schema.service.ts`

Utility methods for transforming `CeEditorResponse` into UI-ready shapes.

| Method | Description |
|---|---|
| `getGroups(response)` | Returns `response.groups` as-is |
| `flattenTraits(response)` | Flattens all traits from all groups into a single ordered list |
| `groupBy(traits, keyFn)` | Re-groups a flat trait list using a custom key function |

`groupBy` is useful when the API returns a flat trait list and grouping must be derived locally:

```typescript
const groups = schemaService.groupBy(
  traits,
  (t) => t.name.split('_')[0]   // group by prefix
);
```

---

## API Service

### `CeApiService`

Located: `ce/services/ce-api.service.ts`

Thin HTTP layer for editor-specific endpoints.

#### `getEditorData(entityId: string): Observable<CeEditorResponse>`

```
GET /api/ce/entities/{entityId}/editor
```

Fetches the full trait schema + current values for an entity. The response is the primary input to `DynamicFormService.buildForm()`.

#### `saveTraits(entityId: string, payload: CeTraitSaveItem[]): Observable<CeTraitSaveItem[]>`

```
PUT /api/ce/entities/{entityId}/traits
Body: { traits: [...] }
```

Persists trait values. The payload is built by `DynamicFormService.flattenToPayload(form)`.

---

## Components

### `CeDynamicFieldComponent`

Located: `ce/components/dynamic/ce-dynamic-field.component.ts`

Selector: `ce-dynamic-field`

Renders a **single** form field, switching on `trait.type`:

| `trait.type` | Rendered as |
|---|---|
| `text` | `<input matInput>` |
| `long_text` | `<textarea matInput rows="4">` |
| `number` | `<input matInput type="number">` |
| `boolean` | `<mat-checkbox>` |
| `select` | `<mat-select>` populated from `trait.options` |

**Inputs:**

| Input | Type | Description |
|---|---|---|
| `trait` | `CeEditorTrait` | The trait descriptor |
| `form` | `FormGroup` | The parent form; the control is looked up by `trait.name` |

Throws in `ngOnInit` if `form.get(trait.name)` returns null (programming error guard).

**Usage:**
```html
<ce-dynamic-field [trait]="myTrait" [form]="myForm" />
```

---

### `CeDynamicFormComponent`

Located: `ce/components/dynamic/ce-dynamic-form.component.ts`

Selector: `ce-dynamic-form`

Renders the full trait editor: iterates over groups, renders a section heading per group, and delegates each trait to `CeDynamicFieldComponent`.

**Inputs:**

| Input | Type | Description |
|---|---|---|
| `groups` | `CeTraitGroup[]` | The trait groups to render |
| `form` | `FormGroup` | Pre-built reactive form (from `DynamicFormService`) |
| `saving` | `boolean` | Disables submit button and shows spinner |

**Outputs:**

| Output | Type | Description |
|---|---|---|
| `formSubmit` | `EventEmitter<FormGroup>` | Emitted when the form is submitted and valid |

On invalid submit, calls `form.markAllAsTouched()` to surface all validation errors before emitting nothing.

**Usage:**
```html
<ce-dynamic-form
  [groups]="groups"
  [form]="form"
  [saving]="saving()"
  (formSubmit)="onSave($event)" />
```

---

## Integration Pattern

A typical host component wires everything together:

```typescript
@Component({ ... })
export class MyEntityEditorComponent {
  private api     = inject(CeApiService);
  private engine  = inject(DynamicFormService);
  private schema  = inject(SchemaService);

  groups = signal<CeTraitGroup[]>([]);
  form   = signal<FormGroup>(new FormGroup({}));
  saving = signal(false);

  constructor() {
    const entityId = inject(ActivatedRoute).snapshot.params['entityId'];
    this.api.getEditorData(entityId).subscribe((response) => {
      const traits = this.schema.flattenTraits(response);
      this.groups.set(this.schema.getGroups(response));
      this.form.set(this.engine.buildForm(traits));
    });
  }

  onSave(form: FormGroup): void {
    const entityId = '...';
    const payload  = this.engine.flattenToPayload(form);
    this.saving.set(true);
    this.api.saveTraits(entityId, payload).subscribe({
      next:  () => this.saving.set(false),
      error: () => this.saving.set(false),
    });
  }
}
```

```html
<ce-dynamic-form
  [groups]="groups()"
  [form]="form()"
  [saving]="saving()"
  (formSubmit)="onSave($event)" />
```

---

## Supported Field Types

| Type value | UI control | Notes |
|---|---|---|
| `text` | Single-line text input | Default for unknown types |
| `long_text` | Multi-line textarea (4 rows) | — |
| `number` | Number input | Pattern validator applied |
| `boolean` | Checkbox | Defaults to `false` |
| `select` | Dropdown | Requires `trait.options` to be populated |

To add a new type, add a `*ngSwitchCase` branch in `CeDynamicFieldComponent` and a matching coerce case in `DynamicFormService.coerceValue()`.

---

## API Contract

### Editor endpoint

```
GET /api/ce/entities/{entityId}/editor
```

**Response shape:**
```json
{
  "entity": {
    "id": "abc-123",
    "name": "Aria Vale",
    "schema": "human"
  },
  "groups": [
    {
      "name": "Identity",
      "traits": [
        {
          "id": "t1",
          "name": "age",
          "label": "Age",
          "type": "number",
          "required": true,
          "value": 34,
          "options": null
        },
        {
          "id": "t2",
          "name": "personality",
          "label": "Personality",
          "type": "select",
          "required": false,
          "value": "bold",
          "options": ["bold", "quiet", "cunning"]
        }
      ]
    }
  ]
}
```

### Save endpoint

```
PUT /api/ce/entities/{entityId}/traits
```

**Request body:**
```json
{
  "traits": [
    { "trait": "age",         "value": 34     },
    { "trait": "personality", "value": "bold" }
  ]
}
```

**Response:** Same array shape confirming persisted values.
