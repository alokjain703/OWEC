import {
  Component, AfterViewInit, ElementRef, ViewChild,
  ChangeDetectionStrategy, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import * as d3 from 'd3';

interface TimelineEvent {
  id: string;
  title: string;
  start_time: string;
  entities: string[];
}

@Component({
  selector: 'omni-timeline-view',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule, MatChipsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tl-page">

      <!-- Header card -->
      <mat-card class="page-header-card" appearance="outlined">
        <mat-card-header>
          <mat-icon mat-card-avatar class="header-icon">timeline</mat-icon>
          <mat-card-title>Timeline</mat-card-title>
          <mat-card-subtitle>Horizontal chronological view · Scroll to zoom · Drag to pan</mat-card-subtitle>
        </mat-card-header>
      </mat-card>

      <!-- SVG timeline card -->
      <mat-card class="tl-card" appearance="outlined">
        <mat-card-content class="tl-content">
          <svg #timelineSvg class="timeline-svg"></svg>
        </mat-card-content>
      </mat-card>

      <!-- Selected event detail -->
      @if (selected()) {
        <mat-card class="event-detail-card" appearance="outlined">
          <mat-card-header>
            <mat-icon mat-card-avatar>event</mat-icon>
            <mat-card-title>{{ selected()!.title }}</mat-card-title>
            <mat-card-subtitle>{{ selected()!.start_time | date:'medium' }}</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <mat-chip-set aria-label="Involved entities">
              @for (e of selected()!.entities; track e) {
                <mat-chip><mat-icon matChipAvatar>person</mat-icon>{{ e }}</mat-chip>
              } @empty {
                <span class="no-entities">No entities attached</span>
              }
            </mat-chip-set>
          </mat-card-content>
          <mat-card-actions>
            <button mat-button (click)="selected.set(null)"><mat-icon>close</mat-icon> Dismiss</button>
          </mat-card-actions>
        </mat-card>
      }

    </div>
  `,
  styles: [`
    .tl-page {
      display: flex; flex-direction: column; gap: 16px;
      padding: 20px; height: 100%; box-sizing: border-box;
    }
    .page-header-card .header-icon { color: var(--omni-accent-light); font-size: 32px; width: 32px; height: 32px; }
    .tl-card { flex: 1; overflow: hidden; display: flex; flex-direction: column; min-height: 0; }
    .tl-content { flex: 1; overflow: hidden; padding: 0 !important; height: 100%; }
    .timeline-svg { width: 100%; height: 100%; display: block; background: var(--omni-bg); }
    .event-detail-card { flex-shrink: 0; }
    .no-entities { font-size: 12px; color: var(--omni-text-muted); }
  `],
})
export class TimelineViewComponent implements AfterViewInit {
  @ViewChild('timelineSvg', { static: true }) svgRef!: ElementRef<SVGElement>;

  selected = signal<TimelineEvent | null>(null);

  private events: TimelineEvent[] = [
    { id: '1', title: 'The Founding', start_time: '2190-03-01T00:00:00Z', entities: ['Aria', 'The Order'] },
    { id: '2', title: 'The Betrayal', start_time: '2192-07-15T00:00:00Z', entities: ['Kane'] },
    { id: '3', title: 'The Battle', start_time: '2194-11-30T00:00:00Z', entities: ['Aria', 'Kane'] },
    { id: '4', title: 'Peace Treaty', start_time: '2195-01-01T00:00:00Z', entities: ['The Order'] },
  ];

  ngAfterViewInit(): void {
    this.renderTimeline();
  }

  private renderTimeline(): void {
    const el = this.svgRef.nativeElement;
    const W = el.clientWidth || 800;
    const H = el.clientHeight || 300;
    const margin = { top: 40, right: 60, bottom: 40, left: 60 };
    const innerW = W - margin.left - margin.right;

    const parseTime = d3.isoParse;
    const dates = this.events.map((e) => parseTime(e.start_time)!);

    const xScale = d3.scaleTime()
      .domain(d3.extent(dates) as [Date, Date])
      .range([0, innerW]);

    const svg = d3.select(el).attr('viewBox', `0 0 ${W} ${H}`);
    svg.selectAll('*').remove();

    const zoom = d3.zoom<SVGElement, unknown>().scaleExtent([0.5, 10]).on('zoom', (e) => {
      const xNew = e.transform.rescaleX(xScale);
      axisG.call(d3.axisBottom(xNew));
      circles.attr('cx', (d: any) => xNew(parseTime(d.start_time)!));
      labels.attr('x', (d: any) => xNew(parseTime(d.start_time)!));
    });
    svg.call(zoom as any);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Axis
    const axisG = g.append('g')
      .attr('transform', `translate(0,${(H - margin.top - margin.bottom) / 2})`)
      .call(d3.axisBottom(xScale));
    axisG.selectAll('text').attr('fill', '#7a7a9a');
    axisG.selectAll('line,path').attr('stroke', '#3a3a60');

    // Axis line
    g.append('line')
      .attr('x1', 0).attr('y1', (H - margin.top - margin.bottom) / 2)
      .attr('x2', innerW).attr('y2', (H - margin.top - margin.bottom) / 2)
      .attr('stroke', '#3a3a60').attr('stroke-width', 1);

    const cy = (H - margin.top - margin.bottom) / 2;

    // Event circles
    const circles = g.append('g').selectAll('circle')
      .data(this.events).join('circle')
      .attr('cx', (d) => xScale(parseTime(d.start_time)!))
      .attr('cy', cy)
      .attr('r', 10)
      .attr('fill', '#7c5cbf').attr('stroke', '#a384e0').attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('click', (_e, d) => this.selected.set(d as TimelineEvent));

    // Labels
    const labels = g.append('g').selectAll('text')
      .data(this.events).join('text')
      .text((d) => d.title)
      .attr('x', (d) => xScale(parseTime(d.start_time)!))
      .attr('y', cy - 18)
      .attr('text-anchor', 'middle')
      .attr('fill', '#e8e8f0').attr('font-size', 11);
  }
}
