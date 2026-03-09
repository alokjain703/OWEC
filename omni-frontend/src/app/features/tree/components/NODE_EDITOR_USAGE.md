# Node Editor Component

The `NodeEditorComponent` is a reusable Angular component for creating and editing nodes in the OMNI application.

## Features

- ✅ Schema-driven metadata fields
- ✅ Support for create and edit modes
- ✅ Dynamic form generation based on node role
- ✅ Validation with required field support
- ✅ Multiple field types: string, integer, enum, array
- ✅ Can be embedded in any component
- ✅ Slide-out drawer UI pattern

## Basic Usage

```typescript
import { NodeEditorComponent } from './components/node-editor.component';

@Component({
  selector: 'my-component',
  imports: [NodeEditorComponent],
  template: `
    <mat-sidenav-container>
      <div class="main-content">
        <!-- Your main content -->
      </div>

      <mat-sidenav
        position="end"
        mode="over"
        [opened]="editorOpen"
        (openedChange)="editorOpen = $event">
        
        <omni-node-editor
          [node]="editingNode"
          [parentNode]="parentNode"
          [schema]="activeSchema"
          [mode]="editorMode"
          (nodeSaved)="onNodeSaved($event)"
          (nodeDeleted)="onNodeDeleted($event)"
          (editorClosed)="onEditorClosed()">
        </omni-node-editor>
        
      </mat-sidenav>
    </mat-sidenav-container>
  `
})
export class MyComponent {
  editorOpen = false;
  editorMode: 'create' | 'edit' = 'create';
  editingNode: any = null;
  parentNode: any = null;
  activeSchema: any = null;

  openEditorForCreate(parent: any) {
    this.parentNode = parent;
    this.editingNode = {
      parent_id: parent.id,
      title: '',
      metadata: {}
    };
    this.editorMode = 'create';
    this.editorOpen = true;
  }

  openEditorForEdit(node: any) {
    this.editingNode = { ...node };
    this.parentNode = null;
    this.editorMode = 'edit';
    this.editorOpen = true;
  }

  onNodeSaved(node: any) {
    console.log('Node saved:', node);
    // Handle save logic (API call, etc.)
    this.editorOpen = false;
  }

  onNodeDeleted(nodeId: string) {
    console.log('Node deleted:', nodeId);
    // Handle delete logic
    this.editorOpen = false;
  }

  onEditorClosed() {
    this.editorOpen = false;
    this.editingNode = null;
  }
}
```

## Component API

### Inputs

| Input | Type | Required | Description |
|-------|------|----------|-------------|
| `node` | `Node \| null` | No | The node to edit (null for create mode) |
| `parentNode` | `Node \| null` | No | Parent node when creating a child |
| `schema` | `Schema \| null` | No | Active schema with role and metadata definitions |
| `mode` | `'create' \| 'edit'` | No | Editor mode (default: 'create') |

### Outputs

| Output | Type | Description |
|--------|------|-------------|
| `nodeSaved` | `EventEmitter<Node>` | Emitted when user saves the node |
| `nodeDeleted` | `EventEmitter<string>` | Emitted when user deletes the node (passes node ID) |
| `editorClosed` | `EventEmitter<void>` | Emitted when user closes the editor |

### Node Interface

```typescript
interface Node {
  id?: string;
  project_id?: string;
  parent_id?: string;
  depth?: number;
  order_index?: number;
  node_role: string;        // Required
  title: string;            // Required
  content?: string;
  metadata: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}
```

### Schema Interface

```typescript
interface Schema {
  roles: Record<string, {
    label: string;
    description?: string;
  }>;
  allowed_children: Record<string, string[]>;
  metadata_definitions: Record<string, Record<string, {
    type: 'string' | 'integer' | 'enum' | 'array';
    required?: boolean;
    enum?: string[];
    items?: { type: string };
  }>>;
}
```

## Metadata Field Types

The component automatically renders form fields based on metadata definitions:

### String Field
```json
{
  "field_name": {
    "type": "string",
    "required": false
  }
}
```
Renders: Text input

### Integer Field
```json
{
  "book_number": {
    "type": "integer",
    "required": true
  }
}
```
Renders: Number input

### Enum Field
```json
{
  "scene_type": {
    "type": "string",
    "enum": ["action", "dialogue", "internal", "transition"],
    "required": false
  }
}
```
Renders: Select dropdown

### Array Field
```json
{
  "themes": {
    "type": "array",
    "items": { "type": "string" },
    "required": false
  }
}
```
Renders: Comma-separated text input

## Validation

The component validates:
- Required title field
- Required node_role field
- Required metadata fields based on schema
- Empty arrays for required array fields

The Save button is disabled until all validations pass.

## Styling

The component uses Angular Material components and includes built-in styling. You can customize the panel width:

```css
.node-editor-panel {
  width: 400px; /* Default */
}
```

## Integration with Tree Editor

The component is already integrated with `project-tree-editor.component.ts`. When users click "Add Child" in the tree:

1. Tree editor opens the node editor in a slide-out drawer
2. Node editor displays allowed roles based on parent node
3. Metadata fields auto-generate based on selected role
4. On save, the tree editor handles the API call and refreshes

## Example Schema

```json
{
  "roles": {
    "universe": { "label": "Universe", "description": "Top-level container" },
    "collection": { "label": "Collection", "description": "Group of items" },
    "major_unit": { "label": "Book", "description": "Single book" },
    "atomic_unit": { "label": "Chapter", "description": "Book chapter" }
  },
  "allowed_children": {
    "universe": ["collection"],
    "collection": ["major_unit"],
    "major_unit": ["atomic_unit"],
    "atomic_unit": []
  },
  "metadata_definitions": {
    "major_unit": {
      "book_number": { "type": "integer", "required": true },
      "isbn": { "type": "string", "required": false },
      "word_count": { "type": "integer", "required": false }
    },
    "atomic_unit": {
      "pov": { "type": "string", "required": false },
      "scene_type": {
        "type": "string",
        "enum": ["action", "dialogue", "internal", "transition"],
        "required": false
      }
    }
  }
}
```

## Tips

1. **Load Schema First**: Always load the schema before opening the editor
2. **Handle Events**: Implement all three event handlers for proper UX
3. **Validation**: The component handles validation internally
4. **Array Fields**: Use comma-separated values for array inputs
5. **Role Selection**: Role cannot be changed in edit mode
