/**
 * OMNI Relationship Graph Component
 * 
 * Reusable Angular component for visualizing and editing relationships
 * between OMNI entities using a D3 force-directed graph.
 */
import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  ElementRef,
  ViewChild,
  AfterViewInit,
  ChangeDetectionStrategy,
  NgZone
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';

import { OmniGraphNode, OmniGraphEdge, GraphConfig } from './relationship-graph.types';
import { GraphRenderer } from './relationship-graph.renderer';

@Component({
  selector: 'omni-relationship-graph',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatTooltipModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relationship-graph-container">
      <mat-card class="graph-card" appearance="outlined">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>hub</mat-icon>
            Relationship Graph
          </mat-card-title>
          <div class="header-actions">
            <button mat-icon-button matTooltip="Reset zoom" (click)="resetView()">
              <mat-icon>zoom_out_map</mat-icon>
            </button>
            <button mat-icon-button matTooltip="Refresh layout" (click)="refreshLayout()">
              <mat-icon>refresh</mat-icon>
            </button>
            @if (selectedNode() || selectedEdge()) {
              <button mat-icon-button matTooltip="Clear selection" (click)="clearSelection()">
                <mat-icon>clear</mat-icon>
              </button>
            }
          </div>
        </mat-card-header>

        <mat-card-content>
          <div class="graph-content">
            <!-- Graph visualization container -->
            <div #graphContainer class="graph-visualization"></div>

            <!-- Selection info panel -->
            @if (selectedNode() || selectedEdge()) {
              <div class="selection-panel">
                @if (selectedNode()) {
                  <div class="selection-info">
                    <div class="selection-header">
                      <mat-icon>account_circle</mat-icon>
                      <h3>{{ selectedNode()!.label }}</h3>
                    </div>
                    <mat-chip-set>
                      <mat-chip [style.background-color]="getNodeColor(selectedNode()!.type)">
                        {{ selectedNode()!.type }}
                      </mat-chip>
                    </mat-chip-set>
                    <div class="selection-actions">
                      <button mat-raised-button color="primary" (click)="editNode()">
                        <mat-icon>edit</mat-icon>
                        Edit
                      </button>
                    </div>
                  </div>
                }

                @if (selectedEdge()) {
                  <div class="selection-info">
                    <div class="selection-header">
                      <mat-icon>arrow_forward</mat-icon>
                      <h3>Relationship</h3>
                    </div>
                    <mat-chip-set>
                      <mat-chip>{{ selectedEdge()!.type }}</mat-chip>
                    </mat-chip-set>
                    <div class="selection-actions">
                      <button mat-raised-button color="primary" (click)="editEdge()">
                        <mat-icon>edit</mat-icon>
                        Edit
                      </button>
                    </div>
                  </div>
                }
              </div>
            }

            <!-- Stats -->
            <div class="graph-stats">
              <div class="stat">
                <mat-icon>circle</mat-icon>
                <span>{{ nodes.length }} nodes</span>
              </div>
              <div class="stat">
                <mat-icon>link</mat-icon>
                <span>{{ edges.length }} edges</span>
              </div>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styleUrls: ['./relationship-graph.component.scss']
})
export class RelationshipGraphComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('graphContainer', { static: false }) graphContainer!: ElementRef<HTMLDivElement>;

  // Inputs
  @Input() nodes: OmniGraphNode[] = [];
  @Input() edges: OmniGraphEdge[] = [];
  @Input() config: GraphConfig = {};

  // Outputs
  @Output() nodeSelected = new EventEmitter<OmniGraphNode>();
  @Output() edgeSelected = new EventEmitter<OmniGraphEdge>();
  @Output() nodePositionChanged = new EventEmitter<{ node: OmniGraphNode; x: number; y: number }>();

  // State
  private renderer: GraphRenderer | null = null;
  private _selectedNode: OmniGraphNode | null = null;
  private _selectedEdge: OmniGraphEdge | null = null;

  constructor(private ngZone: NgZone) {}

  ngOnInit(): void {
    // Component initialization
  }

  ngAfterViewInit(): void {
    // Run D3 operations outside Angular zone for performance
    this.ngZone.runOutsideAngular(() => {
      this.initializeGraph();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['nodes'] || changes['edges']) && this.renderer) {
      // Update graph when data changes
      this.ngZone.runOutsideAngular(() => {
        this.renderer!.update(this.nodes, this.edges);
      });
    }

    if (changes['config'] && this.renderer) {
      // Reinitialize if config changes
      this.ngZone.runOutsideAngular(() => {
        this.renderer!.destroy();
        this.initializeGraph();
      });
    }
  }

  ngOnDestroy(): void {
    if (this.renderer) {
      this.renderer.destroy();
    }
  }

  /**
   * Initialize the graph renderer
   */
  private initializeGraph(): void {
    if (!this.graphContainer) return;

    const container = this.graphContainer.nativeElement;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    const config: GraphConfig = {
      width,
      height,
      ...this.config
    };

    this.renderer = new GraphRenderer(config);
    this.renderer.initialize(container);

    // Set up event handlers
    this.renderer.setNodeClickHandler((node) => {
      this.ngZone.run(() => {
        this._selectedNode = node;
        this._selectedEdge = null;
        this.nodeSelected.emit(node);
      });
    });

    this.renderer.setEdgeClickHandler((edge) => {
      this.ngZone.run(() => {
        this._selectedEdge = edge;
        this._selectedNode = null;
        this.edgeSelected.emit(edge);
      });
    });

    this.renderer.setNodeDragEndHandler((node) => {
      this.ngZone.run(() => {
        if (node.fx != null && node.fy != null) {
          this.nodePositionChanged.emit({
            node,
            x: node.fx as number,
            y: node.fy as number
          });
        }
      });
    });

    // Initial render
    this.renderer.update(this.nodes, this.edges);
  }

  /**
   * Reset view to center
   */
  resetView(): void {
    if (this.renderer) {
      this.ngZone.runOutsideAngular(() => {
        this.renderer!.destroy();
        this.initializeGraph();
      });
    }
  }

  /**
   * Refresh layout (restart simulation)
   */
  refreshLayout(): void {
    if (this.renderer) {
      this.ngZone.runOutsideAngular(() => {
        this.renderer!.update(this.nodes, this.edges);
      });
    }
  }

  /**
   * Clear selection
   */
  clearSelection(): void {
    this._selectedNode = null;
    this._selectedEdge = null;
  }

  /**
   * Get selected node
   */
  selectedNode(): OmniGraphNode | null {
    return this._selectedNode;
  }

  /**
   * Get selected edge
   */
  selectedEdge(): OmniGraphEdge | null {
    return this._selectedEdge;
  }

  /**
   * Edit selected node
   */
  editNode(): void {
    if (this._selectedNode) {
      this.nodeSelected.emit(this._selectedNode);
    }
  }

  /**
   * Edit selected edge
   */
  editEdge(): void {
    if (this._selectedEdge) {
      this.edgeSelected.emit(this._selectedEdge);
    }
  }

  /**
   * Get node color (for template)
   */
  getNodeColor(type: string): string {
    const colors: Record<string, string> = {
      character: '#ce93d8',
      faction: '#90caf9',
      item: '#80cbc4',
      event: '#f48fb1'
    };
    return colors[type] || '#9e9e9e';
  }

  /**
   * Handle window resize
   */
  onResize(): void {
    if (this.renderer && this.graphContainer) {
      const container = this.graphContainer.nativeElement;
      const width = container.clientWidth;
      const height = container.clientHeight;
      
      this.ngZone.runOutsideAngular(() => {
        this.renderer!.resize(width, height);
      });
    }
  }
}
