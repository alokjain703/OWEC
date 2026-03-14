import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const API_BASE = (typeof window !== 'undefined' && (window as any)['__OMNI_API_BASE__'])
  || 'http://localhost:8052/api/v1';

@Injectable({ providedIn: 'root' })
export class OmniApiService {
  private readonly base = API_BASE;

  constructor(private http: HttpClient) {}

  // ── Projects ────────────────────────────────────────────────────────────────
  getProject(id: string): Observable<unknown> {
    return this.http.get(`${this.base}/projects/${id}`);
  }
  createProject(payload: unknown): Observable<unknown> {
    return this.http.post(`${this.base}/projects`, payload);
  }
  updateProject(id: string, payload: unknown): Observable<unknown> {
    return this.http.patch(`${this.base}/projects/${id}`, payload);
  }
  deleteProject(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/projects/${id}`);
  }
  getProjectNodes(projectId: string): Observable<unknown[]> {
    return this.http.get<unknown[]>(`${this.base}/projects/${projectId}/nodes`);
  }
  initializeProjectWithSchema(projectId: string, schemaId: string): Observable<unknown> {
    return this.http.post(`${this.base}/projects/${projectId}/initialize-schema`, {
      schema_id: schemaId
    });
  }

  // ── Tree ────────────────────────────────────────────────────────────────────
  createNode(payload: unknown): Observable<unknown> {
    return this.http.post(`${this.base}/tree/nodes`, payload);
  }
  updateNode(id: string, payload: unknown): Observable<unknown> {
    return this.http.patch(`${this.base}/tree/nodes/${id}`, payload);
  }
  moveNode(id: string, payload: unknown): Observable<unknown> {
    return this.http.post(`${this.base}/tree/nodes/${id}/move`, payload);
  }
  deleteNode(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/tree/nodes/${id}`);
  }
  getSubtree(id: string): Observable<unknown> {
    return this.http.get(`${this.base}/tree/nodes/${id}/subtree`);
  }
  reorderNodes(payload: unknown): Observable<unknown> {
    return this.http.post(`${this.base}/tree/nodes/reorder`, payload);
  }
  duplicateNode(id: string, payload: { include_children?: boolean } = {}): Observable<unknown> {
    return this.http.post(`${this.base}/tree/nodes/${id}/duplicate`, payload);
  }
  splitNode(id: string, payload: { title?: string; content?: string; node_role?: string } = {}): Observable<unknown> {
    return this.http.post(`${this.base}/tree/nodes/${id}/split`, payload);
  }
  mergeNode(id: string): Observable<unknown> {
    return this.http.post(`${this.base}/tree/nodes/${id}/merge`, {});
  }

  // ── Entities ────────────────────────────────────────────────────────────────
  createEntity(payload: unknown): Observable<unknown> {
    return this.http.post(`${this.base}/entities`, payload);
  }
  updateEntityAttributes(id: string, payload: unknown): Observable<unknown> {
    return this.http.patch(`${this.base}/entities/${id}/attributes`, payload);
  }
  updateEntityState(id: string, payload: unknown): Observable<unknown> {
    return this.http.patch(`${this.base}/entities/${id}/state`, payload);
  }
  getEntityGraph(id: string): Observable<unknown> {
    return this.http.get(`${this.base}/entities/${id}/graph`);
  }
  listEntities(projectId: string): Observable<unknown[]> {
    return this.http.get<unknown[]>(`${this.base}/entities/project/${projectId}`);
  }

  // ── Timeline ────────────────────────────────────────────────────────────────
  createEvent(payload: unknown): Observable<unknown> {
    return this.http.post(`${this.base}/timeline/events`, payload);
  }
  attachEntityToEvent(eventId: string, payload: unknown): Observable<unknown> {
    return this.http.post(`${this.base}/timeline/events/${eventId}/entities`, payload);
  }
  getProjectTimeline(projectId: string): Observable<unknown[]> {
    return this.http.get<unknown[]>(`${this.base}/timeline/project/${projectId}`);
  }
  getEntityTimeline(entityId: string): Observable<unknown[]> {
    return this.http.get<unknown[]>(`${this.base}/timeline/entity/${entityId}`);
  }
  validateChronology(projectId: string): Observable<unknown> {
    return this.http.get(`${this.base}/timeline/project/${projectId}/validate`);
  }

  // ── Graph ───────────────────────────────────────────────────────────────────
  createEdge(payload: unknown): Observable<unknown> {
    return this.http.post(`${this.base}/graph/edges`, payload);
  }
  deleteEdge(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/graph/edges/${id}`);
  }
  getRelations(projectId: string): Observable<unknown[]> {
    return this.http.get<unknown[]>(`${this.base}/graph/project/${projectId}/relations`);
  }
  queryPath(projectId: string, source: string, target: string): Observable<unknown> {
    return this.http.get(
      `${this.base}/graph/path?project_id=${projectId}&source=${source}&target=${target}`
    );
  }

  // ── Schemas ─────────────────────────────────────────────────────────────────
  listSchemas(): Observable<unknown[]> {
    return this.http.get<unknown[]>(`${this.base}/schemas`);
  }
  getSchema(schemaId: string): Observable<unknown> {
    return this.http.get(`${this.base}/schemas/${schemaId}`);
  }
  createSchema(payload: unknown): Observable<unknown> {
    return this.http.post(`${this.base}/schemas`, payload);
  }
  activateSchema(projectId: string, schemaId: string): Observable<unknown> {
    return this.http.post(`${this.base}/schemas/project/${projectId}/activate`, {
      schema_id: schemaId,
    });
  }
  validateMetadata(projectId: string, payload: unknown): Observable<unknown> {
    return this.http.post(`${this.base}/schemas/project/${projectId}/validate`, payload);
  }
}
