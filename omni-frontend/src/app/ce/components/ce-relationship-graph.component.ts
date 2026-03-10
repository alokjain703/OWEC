import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

import { RelationshipGraphComponent } from '../../features/relationships/components/relationship-graph/relationship-graph.component';
import { OmniGraphEdge, OmniGraphNode } from '../../features/relationships/components/relationship-graph/relationship-graph.types';
import { CeGraphEdge, CeGraphNode } from '../models/ce-relationship.model';
import { CeRelationshipService } from '../services/ce-relationship.service';

@Component({
  selector: 'ce-relationship-graph',
  standalone: true,
  imports: [CommonModule, MatCardModule, RelationshipGraphComponent],
  template: `
    <mat-card class="ce-graph">
      <mat-card-header>
        <mat-card-title>Relationships</mat-card-title>
        <mat-card-subtitle>Character Engine graph</mat-card-subtitle>
      </mat-card-header>
      <mat-card-content>
        <omni-relationship-graph
          [nodes]="graphNodes()"
          [edges]="graphEdges()"
          (nodeSelected)="nodeSelected.emit($event)"
          (edgeSelected)="edgeSelected.emit($event)">
        </omni-relationship-graph>
      </mat-card-content>
    </mat-card>
  `,
  styleUrl: './ce-relationship-graph.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CeRelationshipGraphComponent implements OnInit, OnChanges {
  @Input() nodes: CeGraphNode[] | null = null;
  @Input() edges: CeGraphEdge[] | null = null;
  @Output() nodeSelected = new EventEmitter<OmniGraphNode>();
  @Output() edgeSelected = new EventEmitter<OmniGraphEdge>();

  graphNodes = signal<OmniGraphNode[]>([]);
  graphEdges = signal<OmniGraphEdge[]>([]);

  private selfLoaded = false;

  constructor(private relationships: CeRelationshipService) {}

  ngOnInit(): void {
    // Only fetch from the service when no external data is provided
    if (!this.nodes && !this.edges) {
      this.selfLoaded = true;
      this.relationships.getGraph().subscribe((graph) => {
        this.setGraph(graph.nodes, this.relationships.mapGraphEdges(graph.edges));
      });
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Re-render whenever inputs are updated from a parent (graph workspace)
    if ((changes['nodes'] || changes['edges']) && (this.nodes || this.edges)) {
      this.selfLoaded = false;
      this.setGraph(this.nodes ?? [], this.edges ?? []);
    }
  }

  private setGraph(nodes: CeGraphNode[], edges: CeGraphEdge[]): void {
    this.graphNodes.set(
      nodes.map((node) => ({
        id: node.id,
        label: node.label,
        type: node.type,
        data: node,
      }))
    );
    this.graphEdges.set(
      edges.map((edge) => ({
        id: edge.id ?? `${edge.source}-${edge.target}-${edge.relationshipType}`,
        source: edge.source,
        target: edge.target,
        type: edge.typeName || edge.relationshipType,
        data: edge,
      }))
    );
  }
}
