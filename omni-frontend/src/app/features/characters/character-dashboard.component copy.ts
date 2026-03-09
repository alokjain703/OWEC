import {
  Component, AfterViewInit, ElementRef, ViewChild, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import * as d3 from 'd3';

// Material-palette colours for entity types
const TYPE_COLOR: Record<string, string> = {
  character: '#ce93d8',  // purple-200
  faction:   '#90caf9',  // blue-200
  item:      '#80cbc4',  // teal-200
  event:     '#f48fb1',  // pink-200
};

@Component({
  selector: 'omni-character-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatChipsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="char-page">

      <!-- Header card -->
      <mat-card class="page-header-card" appearance="outlined">
        <mat-card-header>
          <mat-icon mat-card-avatar class="header-icon">people</mat-icon>
          <mat-card-title>Character Map</mat-card-title>
          <mat-card-subtitle>D3 force-directed relationship graph · Drag nodes · Scroll to zoom</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <mat-chip-set aria-label="Entity type legend">
            @for (entry of legend; track entry.type) {
              <mat-chip [style.background]="entry.color + '33'" [style.color]="entry.color">
                {{ entry.type }}
              </mat-chip>
            }
          </mat-chip-set>
        </mat-card-content>
      </mat-card>

      <!-- Force graph card -->
      <mat-card class="graph-card" appearance="outlined">
        <mat-card-content class="graph-content">
          <svg #graphSvg class="force-graph"></svg>
        </mat-card-content>
      </mat-card>

    </div>
  `,
  styles: [`
    .char-page {
      display: flex; flex-direction: column; gap: 16px;
      padding: 20px; height: 100%; box-sizing: border-box;
    }
    .page-header-card .header-icon { color: var(--omni-accent-light); font-size: 32px; width: 32px; height: 32px; }
    .graph-card { flex: 1; overflow: hidden; display: flex; flex-direction: column; min-height: 0; }
    .graph-content { flex: 1; overflow: hidden; padding: 0 !important; height: 100%; }
    .force-graph { width: 100%; height: 100%; display: block; background: var(--omni-bg); }
  `],
})
export class CharacterDashboardComponent implements AfterViewInit {
  @ViewChild('graphSvg', { static: true }) svgRef!: ElementRef<SVGElement>;

  legend = Object.entries(TYPE_COLOR).map(([type, color]) => ({ type, color }));

  ngAfterViewInit(): void {
    this.renderForceGraph();
  }

  private renderForceGraph(): void {
    const nodes = [
      { id: '1', name: 'Aria',      type: 'character' },
      { id: '2', name: 'The Order', type: 'faction'   },
      { id: '3', name: 'Kane',      type: 'character' },
      { id: '4', name: 'The Sword', type: 'item'      },
    ] as (d3.SimulationNodeDatum & { id: string; name: string; type: string })[];

    const links = [
      { source: '1', target: '2', label: 'member_of' },
      { source: '3', target: '2', label: 'enemy_of'  },
      { source: '1', target: '4', label: 'wields'    },
    ];

    const el = this.svgRef.nativeElement;
    const width  = el.clientWidth  || 800;
    const height = el.clientHeight || 500;

    const svg = d3.select(el)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .call(d3.zoom<SVGElement, unknown>().on('zoom', (e: d3.D3ZoomEvent<SVGElement, unknown>) => g.attr('transform', e.transform.toString())) as any);

    svg.selectAll('*').remove();
    const g = svg.append('g');

    const sim = d3.forceSimulation(nodes as any)
      .force('link', d3.forceLink(links).id((d: any) => d.id).distance(130))
      .force('charge', d3.forceManyBody().strength(-320))
      .force('center', d3.forceCenter(width / 2, height / 2));

    const link = g.append('g').selectAll('line')
      .data(links).join('line')
      .attr('stroke', '#37374f').attr('stroke-width', 1.5);

    const linkLabel = g.append('g').selectAll('text')
      .data(links).join('text')
      .text((d) => d.label)
      .attr('fill', '#7a7a9a').attr('font-size', 10).attr('text-anchor', 'middle');

    type NDatum = d3.SimulationNodeDatum & { id: string; name: string; type: string };

    const node = g.append('g').selectAll<SVGCircleElement, NDatum>('circle')
      .data(nodes).join('circle')
      .attr('r', 22)
      .attr('fill', (d: NDatum) => TYPE_COLOR[d.type] ?? '#888')
      .attr('stroke', 'rgba(255,255,255,0.15)').attr('stroke-width', 1.5);

    (node as any).call(
      d3.drag<SVGCircleElement, NDatum>()
        .on('start', (e: d3.D3DragEvent<SVGCircleElement, NDatum, NDatum>, d: NDatum) => { if (!e.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
        .on('drag',  (e: d3.D3DragEvent<SVGCircleElement, NDatum, NDatum>, d: NDatum) => { d.fx = e.x; d.fy = e.y; })
        .on('end',   (e: d3.D3DragEvent<SVGCircleElement, NDatum, NDatum>, d: NDatum) => { if (!e.active) sim.alphaTarget(0); d.fx = null; d.fy = null; })
    );

    const label = g.append('g').selectAll('text')
      .data(nodes).join('text')
      .text((d: any) => d.name)
      .attr('fill', '#e8e8f0').attr('font-size', 11).attr('text-anchor', 'middle').attr('dy', 4);

    sim.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x).attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x).attr('y2', (d: any) => d.target.y);
      linkLabel
        .attr('x', (d: any) => (d.source.x + d.target.x) / 2)
        .attr('y', (d: any) => (d.source.y + d.target.y) / 2);
      node.attr('cx', (d: any) => d.x).attr('cy', (d: any) => d.y);
      label.attr('x', (d: any) => d.x).attr('y', (d: any) => d.y);
    });
  }
}
