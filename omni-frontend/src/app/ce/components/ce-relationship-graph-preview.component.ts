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

import * as d3 from 'd3';

import { CeGraphNode, CeGraphEdge } from '../models/ce-relationship.model';

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
        <div class="graph-empty" (click)="openFull.emit()">
          <mat-icon>device_hub</mat-icon>
          <span>No relationships</span>
        </div>
      } @else {
        <div class="graph-body" (click)="openFull.emit()" matTooltip="Open full graph">
          <svg #svgEl class="graph-svg"></svg>
          <div class="graph-overlay"><mat-icon>open_in_full</mat-icon></div>
        </div>
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
    .graph-empty { cursor: pointer; }
    .graph-empty:hover { background: rgba(255,255,255,0.04); }

    .graph-body {
      position: relative;
      cursor: pointer;
      display: block;
    }

    .graph-overlay {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.15s;
      background: rgba(0,0,0,0.35);
      mat-icon { font-size: 28px; width: 28px; height: 28px; color: #fff; }
    }
    .graph-body:hover .graph-overlay { opacity: 1; }

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
      // Defer so Angular's @if block has time to render <svg> into the DOM
      // before we try to select it via @ViewChild
      Promise.resolve().then(() => this.renderGraph());
    }
  }

  ngOnDestroy(): void {
    this.simulation?.stop();
  }

  private renderGraph(): void {
    const svgEl = this.svgRef?.nativeElement;
    if (!svgEl || !this.nodes.length) return;

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

    // Arrow marker (tip at node boundary: refX = radius + arrow length)
    svg.append('defs').append('marker')
      .attr('id', 'ce-arrow')
      .attr('viewBox', '0 -4 8 8')
      .attr('refX', 8)
      .attr('refY', 0)
      .attr('markerWidth', 5)
      .attr('markerHeight', 5)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-4L8,0L0,4')
      .attr('fill', '#7c5cbf');

    const linkData = this.edges.map((e) => ({ ...e }));
    const nodeData = this.nodes.map((n) => ({ ...n }));

    // Build parallel-edge curvature offsets (keyed by edge id)
    // Directed pair src→tgt: n=1 keeps a gentle arc (0.8); n≥2 fans out symmetrically.
    const offMap = new Map<string, number>();
    {
      const groups = new Map<string, string[]>();
      for (const e of linkData as any[]) {
        const src = typeof e.source === 'string' ? e.source : (e.source as any).id;
        const tgt = typeof e.target === 'string' ? e.target : (e.target as any).id;
        const key = `${src}\x00${tgt}`;
        const g = groups.get(key) ?? [];
        g.push(e.id);
        groups.set(key, g);
      }
      for (const ids of groups.values()) {
        const n = ids.length;
        ids.forEach((id, i) => offMap.set(id, n === 1 ? 0.8 : (i - (n - 1) / 2)));
      }
    }

    const link = svg.append('g')
      .selectAll('path')
      .data(linkData)
      .join('path')
      .attr('fill', 'none')
      .attr('stroke', '#7c5cbf')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', 1.5)
      .attr('marker-end', 'url(#ce-arrow)');

    const edgeLabel = svg.append('g')
      .selectAll('text')
      .data(linkData)
      .join('text')
      .attr('text-anchor', 'middle')
      .attr('font-size', 8)
      .attr('fill', 'rgba(255,255,255,0.55)')
      .attr('pointer-events', 'none')
      .text((d: any) => {
        const name = d.typeName || d.relationshipType || '';
        // Trim schema prefix: character.friend → friend
        const parts = name.split('.');
        return parts[parts.length - 1].slice(0, 12);
      });

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

    this.simulation = d3.forceSimulation<any>(nodeData)
      .force('link', d3.forceLink(linkData)
        .id((d: any) => d.id)
        .distance(50)
      )
      .force('charge', d3.forceManyBody().strength(-80))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide(radius + 8))
      .on('tick', () => {
        // Helper: compute arc points for a given edge datum (called after D3 resolves source/target)
        const arcPoints = (d: any) => {
          const sx = d.source.x, sy = d.source.y;
          const tx = d.target.x, ty = d.target.y;
          const dx = tx - sx, dy = ty - sy;
          const len = Math.sqrt(dx * dx + dy * dy) || 1;
          const r = radius + 3;
          const ex = tx - (dx / len) * r, ey = ty - (dy / len) * r;
          const mult = offMap.get(d.id) ?? 0.8;
          const off = mult * 25;
          const cx = (sx + ex) / 2 - (dy / len) * off;
          const cy = (sy + ey) / 2 + (dx / len) * off;
          return { sx, sy, ex, ey, cx, cy };
        };

        link.attr('d', (d: any) => {
          const { sx, sy, ex, ey, cx, cy } = arcPoints(d);
          return `M ${sx} ${sy} Q ${cx} ${cy} ${ex} ${ey}`;
        });
        edgeLabel
          .attr('x', (d: any) => { const { sx, cx, ex } = arcPoints(d); return 0.25 * sx + 0.5 * cx + 0.25 * ex; })
          .attr('y', (d: any) => { const { sy, cy, ey } = arcPoints(d); return 0.25 * sy + 0.5 * cy + 0.25 * ey - 3; });

        node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
      });

    // Stop after settling to keep it static in the preview
    this.simulation.alphaTarget(0).alphaDecay(0.05);
  }
}
