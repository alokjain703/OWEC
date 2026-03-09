/**
 * OMNI Relationship Graph D3 Renderer
 * 
 * Handles all D3.js logic for rendering the force-directed graph.
 * Separated from Angular component to avoid change detection overhead.
 */
import * as d3 from 'd3';
import { OmniGraphNode, OmniGraphEdge, GraphConfig, getNodeColor } from './relationship-graph.types';

export class GraphRenderer {
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | null = null;
  private g: d3.Selection<SVGGElement, unknown, null, undefined> | null = null;
  private simulation: d3.Simulation<OmniGraphNode, OmniGraphEdge> | null = null;
  private nodes: OmniGraphNode[] = [];
  private edges: OmniGraphEdge[] = [];
  private config: Required<GraphConfig>;

  // Event callbacks
  private onNodeClick: ((node: OmniGraphNode) => void) | null = null;
  private onEdgeClick: ((edge: OmniGraphEdge) => void) | null = null;
  private onNodeDragEnd: ((node: OmniGraphNode) => void) | null = null;

  constructor(config: GraphConfig = {}) {
    this.config = {
      width: config.width || 800,
      height: config.height || 600,
      nodeRadius: config.nodeRadius || 20,
      linkDistance: config.linkDistance || 100,
      chargeStrength: config.chargeStrength || -300,
      enableZoom: config.enableZoom !== false,
      enableDrag: config.enableDrag !== false,
      showLabels: config.showLabels !== false,
      showEdgeLabels: config.showEdgeLabels !== false
    };
  }

  /**
   * Initialize the SVG and D3 simulation
   */
  initialize(containerElement: HTMLElement): void {
    // Remove existing SVG if any
    d3.select(containerElement).select('svg').remove();

    // Create new SVG
    this.svg = d3.select(containerElement)
      .append('svg')
      .attr('width', this.config.width)
      .attr('height', this.config.height)
      .attr('viewBox', `0 0 ${this.config.width} ${this.config.height}`);

    // Create main group for zoom/pan
    this.g = this.svg.append('g').attr('class', 'graph-container');

    // Enable zoom and pan
    if (this.config.enableZoom) {
      const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.1, 4])
        .on('zoom', (event) => {
          this.g?.attr('transform', event.transform);
        });
      
      this.svg.call(zoom as any);
    }

    // Initialize D3 force simulation
    this.simulation = d3.forceSimulation<OmniGraphNode>(this.nodes)
      .force('link', d3.forceLink<OmniGraphNode, OmniGraphEdge>(this.edges)
        .id((d) => d.id)
        .distance(this.config.linkDistance))
      .force('charge', d3.forceManyBody().strength(this.config.chargeStrength))
      .force('center', d3.forceCenter(this.config.width / 2, this.config.height / 2))
      .force('collision', d3.forceCollide().radius(this.config.nodeRadius + 5));
  }

  /**
   * Update the graph with new data
   */
  update(nodes: OmniGraphNode[], edges: OmniGraphEdge[]): void {
    if (!this.g || !this.simulation) {
      console.error('Graph not initialized');
      return;
    }

    this.nodes = [...nodes];
    this.edges = [...edges];

    // Update simulation nodes and links
    this.simulation.nodes(this.nodes);
    const linkForce = this.simulation.force('link') as d3.ForceLink<OmniGraphNode, OmniGraphEdge>;
    if (linkForce) {
      linkForce.links(this.edges);
    }

    // Render edges
    this.renderEdges();

    // Render nodes
    this.renderNodes();

    // Render labels
    if (this.config.showLabels) {
      this.renderNodeLabels();
    }

    if (this.config.showEdgeLabels) {
      this.renderEdgeLabels();
    }

    // Restart simulation
    this.simulation.alpha(1).restart();

    // Update positions on tick
    this.simulation.on('tick', () => {
      this.onTick();
    });
  }

  /**
   * Render edges (links)
   */
  private renderEdges(): void {
    if (!this.g) return;

    const link = this.g.selectAll<SVGLineElement, OmniGraphEdge>('.link')
      .data(this.edges, (d) => d.id);

    // Remove old edges
    link.exit().remove();

    // Add new edges
    const linkEnter = link.enter()
      .append('line')
      .attr('class', 'link')
      .attr('stroke', '#999')
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0.6)
      .style('cursor', 'pointer');

    // Handle edge clicks
    linkEnter.on('click', (event, d) => {
      event.stopPropagation();
      if (this.onEdgeClick) {
        this.onEdgeClick(d);
      }
    });

    // Merge
    link.merge(linkEnter as any);
  }

  /**
   * Render nodes
   */
  private renderNodes(): void {
    if (!this.g) return;

    const node = this.g.selectAll<SVGCircleElement, OmniGraphNode>('.node')
      .data(this.nodes, (d) => d.id);

    // Remove old nodes
    node.exit().remove();

    // Add new nodes
    const nodeEnter = node.enter()
      .append('circle')
      .attr('class', 'node')
      .attr('r', this.config.nodeRadius)
      .attr('fill', (d) => getNodeColor(d.type))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer');

    // Handle node clicks
    nodeEnter.on('click', (event, d) => {
      event.stopPropagation();
      if (this.onNodeClick) {
        this.onNodeClick(d);
      }
    });

    // Enable dragging
    if (this.config.enableDrag) {
      nodeEnter.call(this.createDragBehavior() as any);
    }

    // Merge
    node.merge(nodeEnter as any);
  }

  /**
   * Render node labels
   */
  private renderNodeLabels(): void {
    if (!this.g) return;

    const label = this.g.selectAll<SVGTextElement, OmniGraphNode>('.node-label')
      .data(this.nodes, (d) => d.id);

    // Remove old labels
    label.exit().remove();

    // Add new labels
    const labelEnter = label.enter()
      .append('text')
      .attr('class', 'node-label')
      .attr('text-anchor', 'middle')
      .attr('dy', this.config.nodeRadius + 15)
      .attr('font-size', '12px')
      .attr('font-family', 'Roboto, sans-serif')
      .attr('fill', '#333')
      .attr('pointer-events', 'none')
      .text((d) => d.label);

    // Merge
    label.merge(labelEnter as any);
  }

  /**
   * Render edge labels
   */
  private renderEdgeLabels(): void {
    if (!this.g) return;

    const edgeLabel = this.g.selectAll<SVGTextElement, OmniGraphEdge>('.edge-label')
      .data(this.edges, (d) => d.id);

    // Remove old labels
    edgeLabel.exit().remove();

    // Add new labels
    const edgeLabelEnter = edgeLabel.enter()
      .append('text')
      .attr('class', 'edge-label')
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('font-family', 'Roboto, sans-serif')
      .attr('fill', '#666')
      .attr('pointer-events', 'none')
      .text((d) => d.type);

    // Merge
    edgeLabel.merge(edgeLabelEnter as any);
  }

  /**
   * Update positions on simulation tick
   */
  private onTick(): void {
    if (!this.g) return;

    // Update link positions
    this.g.selectAll<SVGLineElement, OmniGraphEdge>('.link')
      .attr('x1', (d) => (d.source as OmniGraphNode).x!)
      .attr('y1', (d) => (d.source as OmniGraphNode).y!)
      .attr('x2', (d) => (d.target as OmniGraphNode).x!)
      .attr('y2', (d) => (d.target as OmniGraphNode).y!);

    // Update node positions
    this.g.selectAll<SVGCircleElement, OmniGraphNode>('.node')
      .attr('cx', (d) => d.x!)
      .attr('cy', (d) => d.y!);

    // Update node label positions
    this.g.selectAll<SVGTextElement, OmniGraphNode>('.node-label')
      .attr('x', (d) => d.x!)
      .attr('y', (d) => d.y!);

    // Update edge label positions
    this.g.selectAll<SVGTextElement, OmniGraphEdge>('.edge-label')
      .attr('x', (d) => ((d.source as OmniGraphNode).x! + (d.target as OmniGraphNode).x!) / 2)
      .attr('y', (d) => ((d.source as OmniGraphNode).y! + (d.target as OmniGraphNode).y!) / 2);
  }

  /**
   * Create drag behavior for nodes
   */
  private createDragBehavior(): d3.DragBehavior<Element, OmniGraphNode, OmniGraphNode | d3.SubjectPosition> {
    const dragStarted = (event: d3.D3DragEvent<Element, OmniGraphNode, OmniGraphNode>, d: OmniGraphNode) => {
      if (!event.active && this.simulation) {
        this.simulation.alphaTarget(0.3).restart();
      }
      d.fx = d.x;
      d.fy = d.y;
    };

    const dragged = (event: d3.D3DragEvent<Element, OmniGraphNode, OmniGraphNode>, d: OmniGraphNode) => {
      d.fx = event.x;
      d.fy = event.y;
    };

    const dragEnded = (event: d3.D3DragEvent<Element, OmniGraphNode, OmniGraphNode>, d: OmniGraphNode) => {
      if (!event.active && this.simulation) {
        this.simulation.alphaTarget(0);
      }
      // Keep node fixed at dragged position
      d.fx = event.x;
      d.fy = event.y;
      
      // Notify parent to save position
      if (this.onNodeDragEnd) {
        this.onNodeDragEnd(d);
      }
    };

    return d3.drag<Element, OmniGraphNode, OmniGraphNode | d3.SubjectPosition>()
      .on('start', dragStarted)
      .on('drag', dragged)
      .on('end', dragEnded);
  }

  /**
   * Set event handlers
   */
  setNodeClickHandler(handler: (node: OmniGraphNode) => void): void {
    this.onNodeClick = handler;
  }

  setEdgeClickHandler(handler: (edge: OmniGraphEdge) => void): void {
    this.onEdgeClick = handler;
  }

  setNodeDragEndHandler(handler: (node: OmniGraphNode) => void): void {
    this.onNodeDragEnd = handler;
  }

  /**
   * Resize the graph
   */
  resize(width: number, height: number): void {
    this.config.width = width;
    this.config.height = height;

    if (this.svg) {
      this.svg
        .attr('width', width)
        .attr('height', height)
        .attr('viewBox', `0 0 ${width} ${height}`);
    }

    if (this.simulation) {
      this.simulation
        .force('center', d3.forceCenter(width / 2, height / 2))
        .alpha(1)
        .restart();
    }
  }

  /**
   * Cleanup and destroy
   */
  destroy(): void {
    if (this.simulation) {
      this.simulation.stop();
    }
    if (this.svg) {
      this.svg.remove();
    }
    this.svg = null;
    this.g = null;
    this.simulation = null;
    this.nodes = [];
    this.edges = [];
  }
}
