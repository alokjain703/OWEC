/**
 * ============================================================================
 * OMNI Relationship Graph Component - Usage Guide & Example
 * ============================================================================
 * 
 * This example demonstrates how to integrate the relationship graph component
 * into your OMNI application for visualizing entity relationships.
 * 
 * 
 * QUICK START
 * -----------
 * 
 * 1. Import the component:
 *    ```typescript
 *    import { RelationshipGraphComponent } from './relationship-graph/relationship-graph.component';
 *    ```
 * 
 * 2. Add to your component imports:
 *    ```typescript
 *    imports: [RelationshipGraphComponent, ...]
 *    ```
 * 
 * 3. Use in your template:
 *    ```html
 *    <omni-relationship-graph
 *      [nodes]="graphNodes()"
 *      [edges]="graphEdges()"
 *      [config]="graphConfig"
 *      (nodeSelected)="handleNodeSelected($event)"
 *      (edgeSelected)="handleEdgeSelected($event)"
 *      (nodePositionChanged)="handleNodePositionChanged($event)">
 *    </omni-relationship-graph>
 *    ```
 * 
 * 
 * ACCESSING THIS EXAMPLE
 * ----------------------
 * 
 * Navigate to: http://localhost:4252/projects/{projectId}/relationships
 * Example: http://localhost:4252/projects/3/relationships
 * 
 * 
 * COMPONENT INPUTS
 * ----------------
 * 
 * @Input() nodes: OmniGraphNode[]
 *   Array of nodes to display in the graph.
 *   Each node represents an entity (character, faction, item, event).
 *   
 *   Example node structure:
 *   {
 *     id: 'char_001',
 *     label: 'Aria',
 *     type: 'character',
 *     x: 400,          // optional: saved position
 *     y: 300,          // optional: saved position
 *     data: { ...entityData }
 *   }
 * 
 * @Input() edges: OmniGraphEdge[]
 *   Array of edges connecting nodes (relationships).
 *   
 *   Example edge structure:
 *   {
 *     id: 'rel_001',
 *     source: 'char_001',
 *     target: 'faction_001',
 *     type: 'member_of',
 *     data: { ...relationshipData }
 *   }
 * 
 * @Input() config: GraphConfig
 *   Optional configuration for graph appearance and behavior.
 *   
 *   Available options:
 *   {
 *     nodeRadius: 20,           // Size of nodes
 *     linkDistance: 120,        // Distance between connected nodes
 *     chargeStrength: -350,     // Repulsion force between nodes
 *     enableZoom: true,         // Allow zoom in/out
 *     enableDrag: true,         // Allow dragging nodes
 *     showLabels: true,         // Show node labels
 *     showEdgeLabels: true      // Show relationship type labels
 *   }
 * 
 * 
 * COMPONENT OUTPUTS (Events)
 * --------------------------
 * 
 * @Output() nodeSelected: EventEmitter<OmniGraphNode>
 *   Fires when a node is clicked. Use to open entity editor or show details.
 *   
 *   Example handler:
 *   handleNodeSelected(node: OmniGraphNode) {
 *     console.log('Selected entity:', node.data);
 *     this.openEntityEditor(node.data);
 *   }
 * 
 * @Output() edgeSelected: EventEmitter<OmniGraphEdge>
 *   Fires when an edge is clicked. Use to edit relationship properties.
 *   
 *   Example handler:
 *   handleEdgeSelected(edge: OmniGraphEdge) {
 *     console.log('Selected relationship:', edge.type);
 *     this.openRelationshipEditor(edge.data);
 *   }
 * 
 * @Output() nodePositionChanged: EventEmitter<{node, x, y}>
 *   Fires when a node is dragged to a new position.
 *   Use to persist layout by saving positions to entity metadata.
 *   
 *   Example handler:
 *   handleNodePositionChanged(event) {
 *     this.apiService.updateEntity(event.node.id, {
 *       metadata: { graph: { x: event.x, y: event.y } }
 *     });
 *   }
 * 
 * 
 * HELPER FUNCTIONS
 * ----------------
 * 
 * entitiesToNodes(entities): Converts OMNI entities to graph nodes
 *   Extracts saved positions from metadata.graph if available
 * 
 * relationshipsToEdges(relationships): Converts OMNI relationships to graph edges
 * 
 * getNodeColor(type): Returns color for entity type
 *   - character: purple (#9C27B0)
 *   - faction: blue (#2196F3)
 *   - item: teal (#009688)
 *   - event: pink (#E91E63)
 * 
 * 
 * INTEGRATION WITH OMNI API
 * -------------------------
 * 
 * 1. Load entities and relationships from backend:
 *    ```typescript
 *    this.entityService.listEntities(projectId).subscribe(entities => {
 *      this.relationService.getRelations(projectId).subscribe(relationships => {
 *        this.graphNodes.set(entitiesToNodes(entities));
 *        this.graphEdges.set(relationshipsToEdges(relationships));
 *      });
 *    });
 *    ```
 * 
 * 2. Save node positions after drag:
 *    ```typescript
 *    handleNodePositionChanged(event) {
 *      const updatedEntity = {
 *        ...event.node.data,
 *        metadata: {
 *          ...event.node.data.metadata,
 *          graph: { x: event.x, y: event.y }
 *        }
 *      };
 *      this.entityService.updateEntity(event.node.id, updatedEntity).subscribe();
 *    }
 *    ```
 * 
 * 3. Handle node selection to open editor:
 *    ```typescript
 *    handleNodeSelected(node: OmniGraphNode) {
 *      const dialogRef = this.dialog.open(EntityEditorDialog, {
 *        width: '600px',
 *        data: { entity: node.data }
 *      });
 *      
 *      dialogRef.afterClosed().subscribe(result => {
 *        if (result) {
 *          this.entityService.updateEntity(node.id, result).subscribe(() => {
 *            this.reloadGraph(); // Refresh after edit
 *          });
 *        }
 *      });
 *    }
 *    ```
 * 
 * 
 * PERFORMANCE TIPS
 * ----------------
 * 
 * 1. The component uses OnPush change detection for optimal performance
 * 2. D3 rendering runs outside Angular's zone (NgZone.runOutsideAngular)
 * 3. For large graphs (>100 nodes), consider:
 *    - Increasing chargeStrength (more negative = more spacing)
 *    - Disabling edge labels (showEdgeLabels: false)
 *    - Implementing lazy loading for entity details
 * 
 * 
 * STYLING & CUSTOMIZATION
 * -----------------------
 * 
 * The component is fully styled with Material Design and supports:
 * - Dark mode (automatically detects prefers-color-scheme)
 * - Responsive layout (mobile breakpoint at 960px)
 * - Customizable node colors via NODE_TYPE_COLORS constant
 * 
 * To customize node colors, edit relationship-graph.types.ts:
 * ```typescript
 * export const NODE_TYPE_COLORS: Record<string, string> = {
 *   character: '#9C27B0',  // Your custom color
 *   faction: '#2196F3',
 *   ...
 * };
 * ```
 * 
 * 
 * FILE STRUCTURE
 * --------------
 * 
 * relationship-graph.types.ts      - Type definitions and helpers
 * relationship-graph.renderer.ts   - D3 rendering engine
 * relationship-graph.component.ts  - Angular component wrapper
 * relationship-graph.component.scss - Styles
 * relationship-graph.example.ts    - This usage example (GraphExampleComponent)
 * 
 * 
 * TROUBLESHOOTING
 * ---------------
 * 
 * Q: Nodes not appearing?
 * A: Check that nodes array has valid id, label, and type properties
 * 
 * Q: Graph not updating when data changes?
 * A: Use signals or trigger change detection with markForCheck()
 * 
 * Q: Performance issues with large graphs?
 * A: Reduce chargeStrength, disable labels, or implement virtual scrolling
 * 
 * Q: Edges not connecting?
 * A: Ensure edge source/target IDs match node IDs exactly
 * 
 * 
 * ============================================================================
 */

import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';

import { RelationshipGraphComponent } from '../relationship-graph/relationship-graph.component';
import {
  OmniGraphNode,
  OmniGraphEdge,
  GraphConfig,
  entitiesToNodes,
  relationshipsToEdges
} from '../relationship-graph/relationship-graph.types';

/**
 * Example parent component using the relationship graph
 */
@Component({
  selector: 'omni-graph-example',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    RelationshipGraphComponent
  ],
  template: `
    <div class="graph-example-page">
      <!-- Header -->
      <mat-card appearance="outlined">
        <mat-card-header>
          <mat-icon mat-card-avatar>hub</mat-icon>
          <mat-card-title>Relationship Graph Example</mat-card-title>
          <mat-card-subtitle>Visualize and edit entity relationships</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <button mat-raised-button color="primary" (click)="loadSampleData()">
            <mat-icon>refresh</mat-icon>
            Load Sample Data
          </button>
        </mat-card-content>
      </mat-card>

      <!-- Relationship Graph -->
      <div class="graph-container">
        <omni-relationship-graph
          [nodes]="graphNodes()"
          [edges]="graphEdges()"
          [config]="graphConfig"
          (nodeSelected)="handleNodeSelected($event)"
          (edgeSelected)="handleEdgeSelected($event)"
          (nodePositionChanged)="handleNodePositionChanged($event)">
        </omni-relationship-graph>
      </div>

      <!-- Selected Item Info -->
      @if (selectedItem()) {
        <mat-card appearance="outlined" class="selection-card">
          <mat-card-content>
            <h3>Selected: {{ selectedItem() }}</h3>
            <p>Open an editor dialog here to modify properties...</p>
            <button mat-button (click)="clearSelection()">Clear Selection</button>
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .graph-example-page {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 20px;
      height: 100%;
      box-sizing: border-box;
    }

    .graph-container {
      flex: 1;
      min-height: 0;
      overflow: hidden;
    }

    .selection-card {
      flex-shrink: 0;
    }
  `]
})
export class GraphExampleComponent implements OnInit {
  
  // State
  graphNodes = signal<OmniGraphNode[]>([]);
  graphEdges = signal<OmniGraphEdge[]>([]);
  selectedItem = signal<string>('');

  // Graph configuration
  graphConfig: GraphConfig = {
    nodeRadius: 20,
    linkDistance: 120,
    chargeStrength: -350,
    enableZoom: true,
    enableDrag: true,
    showLabels: true,
    showEdgeLabels: true
  };

  constructor(private dialog: MatDialog) {}

  ngOnInit(): void {
    this.loadSampleData();
  }

  /**
   * Load sample data into the graph
   */
  loadSampleData(): void {
    // Example OMNI entities
    const entities = [
      {
        id: 'char_aria',
        type: 'character',
        title: 'Aria',
        metadata: {
          graph: { x: 400, y: 300 } // Saved position
        }
      },
      {
        id: 'char_kane',
        type: 'character',
        title: 'Kane',
        metadata: {}
      },
      {
        id: 'faction_order',
        type: 'faction',
        title: 'The Order',
        metadata: {}
      },
      {
        id: 'item_sword',
        type: 'item',
        title: 'The Legendary Sword',
        metadata: {}
      },
      {
        id: 'event_battle',
        type: 'event',
        title: 'The Battle of Dawn',
        metadata: {}
      }
    ];

    // Example OMNI relationships
    const relationships = [
      {
        id: 'rel_1',
        sourceId: 'char_aria',
        targetId: 'faction_order',
        type: 'member_of',
        metadata: {}
      },
      {
        id: 'rel_2',
        sourceId: 'char_kane',
        targetId: 'faction_order',
        type: 'enemy_of',
        metadata: {}
      },
      {
        id: 'rel_3',
        sourceId: 'char_aria',
        targetId: 'item_sword',
        type: 'wields',
        metadata: {}
      },
      {
        id: 'rel_4',
        sourceId: 'char_aria',
        targetId: 'event_battle',
        type: 'participated_in',
        metadata: {}
      },
      {
        id: 'rel_5',
        sourceId: 'char_kane',
        targetId: 'event_battle',
        type: 'participated_in',
        metadata: {}
      }
    ];

    // Transform to graph format
    const nodes = entitiesToNodes(entities);
    const edges = relationshipsToEdges(relationships);

    this.graphNodes.set(nodes);
    this.graphEdges.set(edges);
  }

  /**
   * Handle node selection
   */
  handleNodeSelected(node: OmniGraphNode): void {
    console.log('Node selected:', node);
    this.selectedItem.set(`Node: ${node.label} (${node.type})`);
    
    // In a real implementation, you would:
    // 1. Open an editor dialog/panel
    // 2. Load full entity details from API
    // 3. Allow user to edit properties
    // 4. Save changes via API
    // 5. Refresh graph if needed
    
    // Example: Open entity editor dialog
    // this.openEntityEditor(node.data);
  }

  /**
   * Handle edge selection
   */
  handleEdgeSelected(edge: OmniGraphEdge): void {
    console.log('Edge selected:', edge);
    this.selectedItem.set(`Relationship: ${edge.type}`);
    
    // In a real implementation:
    // 1. Open relationship editor dialog
    // 2. Allow user to modify relationship type/metadata
    // 3. Save changes via API
    // 4. Refresh graph
    
    // Example: Open relationship editor dialog
    // this.openRelationshipEditor(edge.data);
  }

  /**
   * Handle node position changes (save to persist layout)
   */
  handleNodePositionChanged(event: { node: OmniGraphNode; x: number; y: number }): void {
    console.log('Node position changed:', event);
    
    // In a real implementation:
    // 1. Update entity metadata with new position
    // 2. Save to API (debounced to avoid too many requests)
    
    // Example:
    // const updatedMetadata = {
    //   ...event.node.data.metadata,
    //   graph: { x: event.x, y: event.y }
    // };
    // this.apiService.updateEntity(event.node.id, { metadata: updatedMetadata });
  }

  /**
   * Clear selection
   */
  clearSelection(): void {
    this.selectedItem.set('');
  }

  /**
   * Example: Open entity editor dialog
   */
  private openEntityEditor(entity: any): void {
    // Implementation would open a Material Dialog or side panel
    // with a form to edit entity properties
    /*
    const dialogRef = this.dialog.open(EntityEditorDialog, {
      width: '600px',
      data: { entity }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Save changes and refresh graph
        this.apiService.updateEntity(entity.id, result).subscribe(() => {
          this.loadSampleData(); // Refresh
        });
      }
    });
    */
  }

  /**
   * Example: Open relationship editor dialog
   */
  private openRelationshipEditor(relationship: any): void {
    // Similar to entity editor, but for relationships
    /*
    const dialogRef = this.dialog.open(RelationshipEditorDialog, {
      width: '500px',
      data: { relationship }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.apiService.updateRelationship(relationship.id, result).subscribe(() => {
          this.loadSampleData();
        });
      }
    });
    */
  }
}

/**
 * Example: Integration with OMNI API Service
 * 
 * This shows how you would typically fetch and transform real data
 * from the OMNI backend API.
 */
export class GraphDataService {
  
  /**
   * Load graph data for a project
   */
  async loadProjectGraph(projectId: string): Promise<{
    nodes: OmniGraphNode[];
    edges: OmniGraphEdge[];
  }> {
    // 1. Fetch entities from API
    // const entities = await this.apiService.listEntities(projectId).toPromise();
    
    // 2. Fetch relationships from API
    // const relationships = await this.apiService.getRelations(projectId).toPromise();
    
    // 3. Transform to graph format
    // const nodes = entitiesToNodes(entities);
    // const edges = relationshipsToEdges(relationships);
    
    // return { nodes, edges };
    
    return { nodes: [], edges: [] };
  }

  /**
   * Save node position to entity metadata
   */
  async saveNodePosition(nodeId: string, x: number, y: number): Promise<void> {
    // Debounced API call to update entity metadata
    // await this.apiService.updateEntity(nodeId, {
    //   metadata: {
    //     graph: { x, y }
    //   }
    // }).toPromise();
  }
}
