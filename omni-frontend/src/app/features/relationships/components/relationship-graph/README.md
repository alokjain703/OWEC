# OMNI Relationship Graph Component

A reusable D3.js force-directed graph component for visualizing entity relationships in the OMNI narrative engine.

## 🚀 Quick Start

```typescript
import { RelationshipGraphComponent } from './relationship-graph/relationship-graph.component';
import { entitiesToNodes, relationshipsToEdges } from './relationship-graph/relationship-graph.types';

@Component({
  imports: [RelationshipGraphComponent],
  template: `
    <omni-relationship-graph
      [nodes]="graphNodes()"
      [edges]="graphEdges()"
      [config]="graphConfig"
      (nodeSelected)="onNodeClick($event)"
      (edgeSelected)="onEdgeClick($event)"
      (nodePositionChanged)="onNodeDrag($event)">
    </omni-relationship-graph>
  `
})
export class MyComponent {
  graphNodes = signal<OmniGraphNode[]>([]);
  graphEdges = signal<OmniGraphEdge[]>([]);
  
  graphConfig = {
    nodeRadius: 20,
    linkDistance: 120,
    chargeStrength: -350,
    enableZoom: true,
    enableDrag: true,
    showLabels: true
  };

  loadData(projectId: string) {
    this.entityService.listEntities(projectId).subscribe(entities => {
      this.graphNodes.set(entitiesToNodes(entities));
    });
    
    this.relationService.getRelations(projectId).subscribe(rels => {
      this.graphEdges.set(relationshipsToEdges(rels));
    });
  }

  onNodeClick(node: OmniGraphNode) {
    this.openEntityEditor(node.data);
  }

  onNodeDrag(event: {node: OmniGraphNode, x: number, y: number}) {
    // Save position to entity metadata
    this.entityService.updateEntity(event.node.id, {
      metadata: { graph: { x: event.x, y: event.y } }
    });
  }
}
```

## 📦 Files

| File | Purpose |
|------|---------|
| `relationship-graph.types.ts` | TypeScript interfaces, color mapping, helper functions |
| `relationship-graph.renderer.ts` | D3.js rendering engine (400 lines) |
| `relationship-graph.component.ts` | Angular component wrapper |
| `relationship-graph.component.scss` | Styles (responsive, dark mode) |
| `relationship-graph.example.ts` | Full usage example with sample data |

## 🎨 Features

- ✅ Force-directed layout with customizable physics
- ✅ Drag nodes to reposition (saves to metadata)
- ✅ Zoom and pan controls
- ✅ Color-coded by entity type
- ✅ Selection panel with entity details
- ✅ Stats overlay (node/edge counts)
- ✅ Responsive design (mobile-friendly)
- ✅ Dark mode support
- ✅ OnPush change detection (high performance)
- ✅ NgZone-optimized D3 rendering

## 🎯 Entity Types & Colors

| Type | Color | Hex |
|------|-------|-----|
| Character | Purple | `#9C27B0` |
| Faction | Blue | `#2196F3` |
| Item | Teal | `#009688` |
| Event | Pink | `#E91E63` |

## 📝 Input Properties

### `nodes: OmniGraphNode[]`
Array of graph nodes representing entities.

```typescript
{
  id: 'char_001',
  label: 'Aria',
  type: 'character',
  x?: 400,  // Optional saved position
  y?: 300,
  data: { /* original entity */ }
}
```

### `edges: OmniGraphEdge[]`
Array of graph edges representing relationships.

```typescript
{
  id: 'rel_001',
  source: 'char_001',
  target: 'faction_001',
  type: 'member_of',
  data: { /* original relationship */ }
}
```

### `config: GraphConfig`
Optional configuration object.

```typescript
{
  nodeRadius: 20,           // Node size
  linkDistance: 120,        // Distance between nodes
  chargeStrength: -350,     // Repulsion force (negative)
  enableZoom: true,         // Allow zoom
  enableDrag: true,         // Allow dragging
  showLabels: true,         // Show node names
  showEdgeLabels: true      // Show relationship types
}
```

## 📤 Output Events

### `nodeSelected: EventEmitter<OmniGraphNode>`
Fires when a node is clicked.

```typescript
handleNodeSelected(node: OmniGraphNode) {
  console.log('Clicked entity:', node.data);
  this.openEntityEditor(node.data);
}
```

### `edgeSelected: EventEmitter<OmniGraphEdge>`
Fires when an edge is clicked.

```typescript
handleEdgeSelected(edge: OmniGraphEdge) {
  console.log('Clicked relationship:', edge.type);
  this.openRelationshipEditor(edge.data);
}
```

### `nodePositionChanged: EventEmitter<{node, x, y}>`
Fires when a node is dragged (use to persist layout).

```typescript
handleNodePositionChanged(event) {
  this.entityService.updateEntity(event.node.id, {
    metadata: { graph: { x: event.x, y: event.y } }
  }).subscribe();
}
```

## 🔧 Helper Functions

### `entitiesToNodes(entities: any[]): OmniGraphNode[]`
Converts OMNI entities to graph nodes. Extracts saved positions from `metadata.graph.x/y`.

### `relationshipsToEdges(relationships: any[]): OmniGraphEdge[]`
Converts OMNI relationships to graph edges.

### `getNodeColor(type: string): string`
Returns the color for an entity type based on `NODE_TYPE_COLORS`.

## 🌐 Access the Example

**URL Pattern:**
```
http://localhost:4252/projects/{projectId}/relationships
```

**Example:**
```
http://localhost:4252/projects/3/relationships
```

The example component loads with sample data showing characters, factions, items, and events.

## 🔗 Integration with OMNI API

### Load Graph Data

```typescript
async loadProjectGraph(projectId: string) {
  // 1. Fetch entities
  const entities = await firstValueFrom(
    this.entityService.listEntities(projectId)
  );
  
  // 2. Fetch relationships
  const relationships = await firstValueFrom(
    this.relationService.getRelations(projectId)
  );
  
  // 3. Transform to graph format
  this.graphNodes.set(entitiesToNodes(entities));
  this.graphEdges.set(relationshipsToEdges(relationships));
}
```

### Save Node Positions

```typescript
handleNodePositionChanged(event: {node: OmniGraphNode, x: number, y: number}) {
  const updatedEntity = {
    ...event.node.data,
    metadata: {
      ...event.node.data.metadata,
      graph: { x: event.x, y: event.y }
    }
  };
  
  this.entityService.updateEntity(event.node.id, updatedEntity)
    .pipe(debounceTime(500)) // Debounce to avoid too many requests
    .subscribe();
}
```

### Open Entity Editor on Click

```typescript
handleNodeSelected(node: OmniGraphNode) {
  const dialogRef = this.dialog.open(EntityEditorDialog, {
    width: '600px',
    data: { entity: node.data, projectId: this.projectId }
  });
  
  dialogRef.afterClosed().subscribe(result => {
    if (result) {
      this.entityService.updateEntity(node.id, result).subscribe(() => {
        this.reloadGraph();
      });
    }
  });
}
```

## ⚡ Performance Optimization

### For Large Graphs (100+ nodes)

1. **Increase spacing:**
   ```typescript
   config = {
     chargeStrength: -500,  // More repulsion
     linkDistance: 150      // More distance
   }
   ```

2. **Disable labels:**
   ```typescript
   config = {
     showLabels: false,
     showEdgeLabels: false
   }
   ```

3. **Lazy load entity details:**
   ```typescript
   handleNodeSelected(node: OmniGraphNode) {
     // Only fetch full entity data when clicked
     this.entityService.getEntity(node.id).subscribe(fullData => {
       this.openEntityEditor(fullData);
     });
   }
   ```

4. **Debounce position saves:**
   ```typescript
   private positionSave$ = new Subject<{id: string, x: number, y: number}>();
   
   ngOnInit() {
     this.positionSave$.pipe(
       debounceTime(500),
       distinctUntilChanged()
     ).subscribe(pos => this.savePosition(pos));
   }
   ```

## 🎨 Customization

### Change Node Colors

Edit `relationship-graph.types.ts`:

```typescript
export const NODE_TYPE_COLORS: Record<string, string> = {
  character: '#FF5722',  // Your custom color
  faction: '#3F51B5',
  item: '#4CAF50',
  event: '#FFC107',
  // Add custom entity types
  location: '#795548',
  quest: '#00BCD4'
};
```

### Customize Graph Physics

```typescript
graphConfig: GraphConfig = {
  nodeRadius: 25,          // Bigger nodes
  linkDistance: 150,       // More spacing
  chargeStrength: -500,    // Stronger repulsion
  enableZoom: true,
  enableDrag: true,
  showLabels: true,
  showEdgeLabels: false    // Hide edge labels for cleaner look
};
```

## 🐛 Troubleshooting

### Nodes not appearing
- Check that each node has `id`, `label`, and `type` properties
- Verify entity data is properly formatted

### Graph not updating
- Use Angular signals: `graphNodes.set(newNodes)`
- Or trigger change detection: `this.cdr.markForCheck()`

### Edges not connecting
- Ensure `edge.source` and `edge.target` match node IDs exactly
- Check that both nodes exist in the nodes array

### Performance issues
- Reduce number of nodes displayed
- Disable labels with `showLabels: false`
- Increase `chargeStrength` (more negative)

### Layout too crowded
- Increase `linkDistance` (e.g., 200)
- Increase `chargeStrength` magnitude (e.g., -600)
- Reduce `nodeRadius`

## 📚 Additional Resources

- **D3.js Force Layout:** https://d3js.org/d3-force
- **Angular Signals:** https://angular.io/guide/signals
- **Material Design:** https://material.angular.io

## 📄 License

Part of the OMNI narrative engine project.
