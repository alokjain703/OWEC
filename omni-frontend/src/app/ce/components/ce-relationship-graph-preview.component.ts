import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { CeGraphNode, CeGraphEdge } from '../models/ce-relationship.model';

/** Minimal D3 types used in this component to avoid requiring @types/d3 */
declare const d3: any; // D3 is loaded globally by the app

@Component({
  selector: 'ce-relationship-graph-preview',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="graph-preview-container">
      <div class="graph-header">
        <span class="graph-label">
          <mat-icon class="graph-icon">hub</mat-icon>
          Relationships
        </span>
        <button mat-icon-button matTooltip="Open full graph" (click)="openFull.emit()">
          <mat-icon>open_in_full</mat-icon>
        </button>
      </div>

      @if (loading) {
        <div class="graph-loading">
          <mat-spinner diameter="32" />
        </div>
      } @else if (!nodes.length) {
        <div class="graph-empty">
          <mat-icon>device_hub</mat-icon>
          <span>No relationships</span>
        </div>
      } @else {
        <svg #svgEl class="graph-svg"></svg>
        <div class="graph-stats">
          <span>{{ nodes.length }} nodes · {{ edges.length }} edges</span>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }

    .graph-preview-container {
      border: 1px solid var(--omni-border);
      border-radius: 8px;
      overflow: hidden;
      background: var(--omni-surface);
    }

    .graph-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 6px 6px 6px 10px;
      border-bottom: 1px solid var(--omni-border);
    }

    .graph-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 600;
      color: var(--omni-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .graph-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
      color: var(--omni-accent-light);
    }

    .graph-svg {
      display: block;
      width: 100%;
      height: 160px;
      background: rgba(0,0,0,0.1);
    }

    .graph-loading, .graph-empty {
      height: 160px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      color: var(--omni-text-muted);
      font-size: 12px;
    }

    .graph-empty mat-icon { opacity: 0.3; font-size: 32px; width: 32px; height: 32px; }

    .graph-stats {
      font-size: 11px;
      color: var(--omni-text-muted);
      padding: 4px 10px;
      text-align: center;
    }
  `],
})
export class CeRelationshipGraphPreviewComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() nodes: CeGraphNode[] = [];
  @Input() edges: CeGraphEdge[] = [];
  @Input() loading = false;
  @Input() highlightNodeId: string | null = null;

  @Output() openFull = new EventEmitter<void>();
  @Output() nodeClicked = new EventEmitter<CeGraphNode>();

  @ViewChild('svgEl') svgRef?: ElementRef<SVGSVGElement>;

  private simulation: any;

  ngAfterViewInit(): void {
    this.renderGraph();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['nodes'] || changes['edges'] || changes['highlightNodeId']) {
      if (this.svgRef) {
        this.renderGraph();
      }
    }
  }

  ngOnDestroy(): void {
    this.simulation?.stop();
  }

  private renderGraph(): void {
    const svgEl = this.svgRef?.nativeElement;
    if (!svgEl || !this.nodes.length || typeof d3 === 'undefined') return;

    // Clear previous render
    d3.select(svgEl).selectAll('*').remove();
    this.simulation?.stop();

    const width = svgEl.clientWidth || 240;
    const height = 160;
    const radius = 6;
    const highlightId = this.highlightNodeId;

    const svg = d3
      .select(svgEl)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    // Arrow marker
    svg.append('defs').append('marker')
      .attr('id', 'ce-arrow')
      .attr('viewBox', '0 -4 8 8')
      .attr('refX', 14)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-4L8,0L0,4')
      .attr('fill', '#7c5cbf');

    const linkData = this.edges.map((e) => ({ ...e }));
    const nodeData = this.nodes.map((n) => ({ ...n }));

    const link = svg.append('g')
      .selectAll('line')
      .data(linkData)
      .join('line')
      .attr('stroke', '#7c5cbf')
      .attr('stroke-opacity', 0.5)
      .attr('stroke-width', 1)
      .attr('marker-end', 'url(#ce-arrow)');

    const node = svg.append('g')
      .selectAll('g')
      .data(nodeData)
      .join('g')
      .style('cursor', 'pointer')
      .on('click', (_event: any, d: any) => {
        const original = this.nodes.find((n) => n.id === d.id);
        if (original) this.nodeClicked.emit(original);
      });

    node.append('circle')
      .attr('r', (d: any) => d.id === highlightId ? radius + 3 : radius)
      .attr('fill', (d: any) => d.id === highlightId ? '#b08fff' : '#7c5cbf')
      .attr('stroke', (d: any) => d.id === highlightId ? '#ffffff' : 'rgba(255,255,255,0.2)')
      .attr('stroke-width', (d: any) => d.id === highlightId ? 2 : 1);

    node.append('text')
      .attr('dx', radius + 4)
      .attr('dy', '0.35em')
      .attr('font-size', 9)
      .attr('fill', 'rgba(255,255,255,0.7)')
      .text((d: any) => (d.label || d.id).slice(0, 14));

    this.simulation = d3.forceSimulation(nodeData)
      .force('link', d3.forceLink(linkData)
        .id((d: any) => d.id)
        .distance(50)
      )
      .force('charge', d3.forceManyBody().strength(-80))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide(radius + 8))
      .on('tick', () => {
        link
          .attr('x1', (d: any) => d.source.x)
          .attr('y1', (d: any) => d.source.y)
          .attr('x2', (d: any) => d.target.x)
          .attr('y2', (d: any) => d.target.y);

        node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
      });

    // Stop after settling to keep it static in the preview
    this.simulation.alphaTarget(0).alphaDecay(0.05);
  }
}
