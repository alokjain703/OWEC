import {
  Component, AfterViewInit, ElementRef, ViewChild, ChangeDetectionStrategy, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import * as d3 from 'd3';

// Material-palette node colours
const KIND_COLOR: Record<string, string> = {
  character: '#ce93d8',  // purple-200
  faction:   '#90caf9',  // blue-200
  event:     '#f48fb1',  // pink-200
  item:      '#80cbc4',  // teal-200
};

@Component({
  selector: 'omni-graph-view',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatChipsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="graph-page">

      <!-- Header card -->
      <mat-card class="page-header-card" appearance="outlined">
        <mat-card-header>
          <mat-icon mat-card-avatar class="header-icon">hub</mat-icon>
          <mat-card-title>Relationship Graph</mat-card-title>
          <mat-card-subtitle>Entity-to-entity · Causality chains · Event linking · Drag & zoom</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <mat-chip-set aria-label="Node type legend">
            @for (entry of legend; track entry.kind) {
              <mat-chip [style.background]="entry.color + '33'" [style.color]="entry.color">
                {{ entry.kind }}
              </mat-chip>
            }
          </mat-chip-set>
        </mat-card-content>
      </mat-card>

      <!-- Graph card -->
      <mat-card class="graph-card" appearance="outlined">
        <mat-card-content class="graph-content">
          <svg #graphSvg class="full-graph"></svg>
        </mat-card-content>
      </mat-card>

    </div>
  `,
  styles: [`
    .graph-page {
      display: flex; flex-direction: column; gap: 16px;
      padding: 20px; height: 100%; box-sizing: border-box;
    }
    .page-header-card .header-icon { color: var(--omni-accent-light); font-size: 32px; width: 32px; height: 32px; }
    .graph-card { flex: 1; overflow: hidden; display: flex; flex-direction: column; min-height: 0; }
    .graph-content { flex: 1; overflow: hidden; padding: 0 !important; height: 100%; }
    .full-graph { width: 100%; height: 100%; display: block; background: var(--omni-bg); }
  `],
})
export class GraphViewComponent implements AfterViewInit {
  @ViewChild('graphSvg', { static: true }) svgRef!: ElementRef<SVGElement>;

  legend = Object.entries(KIND_COLOR).map(([kind, color]) => ({ kind, color }));

  ngAfterViewInit(): void {
    this.render();
  }

  private render(): void {
    const el = this.svgRef.nativeElement;
    const W = el.clientWidth || 900;
    const H = el.clientHeight || 600;

    type NodeDatum = d3.SimulationNodeDatum & { id: string; label: string; kind: string };
    type LinkDatum = { source: string; target: string; rel: string };

    const nodes: NodeDatum[] = [
      { id: 'n1', label: 'Aria',      kind: 'character' },
      { id: 'n2', label: 'Kane',      kind: 'character' },
      { id: 'n3', label: 'The Order', kind: 'faction'   },
      { id: 'n4', label: 'Betrayal',  kind: 'event'     },
      { id: 'n5', label: 'Sword',     kind: 'item'      },
    ];

    const links: LinkDatum[] = [
      { source: 'n1', target: 'n3', rel: 'member_of'   },
      { source: 'n2', target: 'n4', rel: 'causes'      },
      { source: 'n4', target: 'n3', rel: 'impacts'     },
      { source: 'n1', target: 'n5', rel: 'wields'      },
      { source: 'n1', target: 'n2', rel: 'rivals'      },
    ];

    const kindColor: Record<string, string> = KIND_COLOR;

    const svg = d3.select(el)
      .attr('viewBox', `0 0 ${W} ${H}`)
      .call(d3.zoom<SVGElement, unknown>().on('zoom', (e) => g.attr('transform', e.transform)) as any);

    svg.selectAll('*').remove();

    // Arrow marker
    svg.append('defs').append('marker')
      .attr('id', 'arrow').attr('viewBox', '0 -5 10 10')
      .attr('refX', 28).attr('refY', 0)
      .attr('markerWidth', 6).attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path').attr('d', 'M0,-5L10,0L0,5').attr('fill', '#4a4a70');

    const g = svg.append('g');

    const sim = d3.forceSimulation(nodes as any)
      .force('link', d3.forceLink(links as any).id((d: any) => d.id).distance(140))
      .force('charge', d3.forceManyBody().strength(-400))
      .force('center', d3.forceCenter(W / 2, H / 2))
      .force('collide', d3.forceCollide(40));

    const link = g.append('g').selectAll('line')
      .data(links).join('line')
      .attr('stroke', '#3a3a60').attr('stroke-width', 1.5)
      .attr('marker-end', 'url(#arrow)');

    const relLabel = g.append('g').selectAll('text')
      .data(links).join('text')
      .text((d) => d.rel)
      .attr('fill', '#555').attr('font-size', 10).attr('text-anchor', 'middle');

    const nodeG = g.append('g').selectAll<SVGGElement, NodeDatum>('g')
      .data(nodes).join('g');

    (nodeG as any).call(
      d3.drag<SVGGElement, NodeDatum>()
        .on('start', (e: d3.D3DragEvent<SVGGElement, NodeDatum, NodeDatum>, d: NodeDatum) => { if (!e.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
        .on('drag',  (e: d3.D3DragEvent<SVGGElement, NodeDatum, NodeDatum>, d: NodeDatum) => { d.fx = e.x; d.fy = e.y; })
        .on('end',   (e: d3.D3DragEvent<SVGGElement, NodeDatum, NodeDatum>, d: NodeDatum) => { if (!e.active) sim.alphaTarget(0); d.fx = null; d.fy = null; })
    );

    nodeG.append('circle').attr('r', 24)
      .attr('fill', (d: NodeDatum) => kindColor[d.kind] ?? '#888')
      .attr('stroke', 'rgba(255,255,255,0.2)').attr('stroke-width', 1.5);

    nodeG.append('text').text((d: NodeDatum) => d.label)
      .attr('text-anchor', 'middle').attr('dy', 4)
      .attr('fill', '#e8e8f0').attr('font-size', 11).attr('pointer-events', 'none');

    sim.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x).attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x).attr('y2', (d: any) => d.target.y);
      relLabel
        .attr('x', (d: any) => (d.source.x + d.target.x) / 2)
        .attr('y', (d: any) => (d.source.y + d.target.y) / 2 - 6);
      nodeG.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });
  }
}
