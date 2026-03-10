import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { CE_API_BASE } from './ce-api-base';
import { CeRelationship, CeRelationshipType, CeGraphNode, CeGraphEdge } from '../models/ce-relationship.model';

@Injectable({ providedIn: 'root' })
export class CeRelationshipService {
  private readonly base = CE_API_BASE;

  constructor(private http: HttpClient) {}

  listRelationships(): Observable<CeRelationship[]> {
    return this.http.get<unknown[]>(`${this.base}/relationships`).pipe(
      map((items) => items.map((item) => this.fromApi(item)))
    );
  }

  createRelationship(payload: CeRelationship): Observable<CeRelationship> {
    return this.http.post<unknown>(`${this.base}/relationships`, this.toApi(payload)).pipe(
      map((item) => this.fromApi(item))
    );
  }

  updateRelationship(id: string, payload: Partial<CeRelationship>): Observable<CeRelationship> {
    return this.http.put<unknown>(`${this.base}/relationships/${id}`, this.toApi(payload)).pipe(
      map((item) => this.fromApi(item))
    );
  }

  deleteRelationship(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/relationships/${id}`);
  }

  listRelationshipTypes(): Observable<CeRelationshipType[]> {
    return this.http.get<unknown[]>(`${this.base}/relationships/types`).pipe(
      map((items) => items.map((item) => this.fromApiType(item)))
    );
  }

  createRelationshipType(payload: CeRelationshipType): Observable<CeRelationshipType> {
    return this.http.post<unknown>(`${this.base}/relationships/types`, this.toApiType(payload)).pipe(
      map((item) => this.fromApiType(item))
    );
  }

  updateRelationshipType(id: string, payload: Partial<CeRelationshipType>): Observable<CeRelationshipType> {
    return this.http.put<unknown>(`${this.base}/relationships/types/${id}`, this.toApiType(payload)).pipe(
      map((item) => this.fromApiType(item))
    );
  }

  deleteRelationshipType(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/relationships/types/${id}`);
  }

  getGraph(): Observable<{ nodes: CeGraphNode[]; edges: { source: string; target: string; type: string }[] }> {
    return this.http.get<{ nodes: CeGraphNode[]; edges: { source: string; target: string; type: string }[] }>(`${this.base}/graph`);
  }

  mapGraphEdges(edges: { source: string; target: string; type: string }[]): CeGraphEdge[] {
    return edges.map((edge) => ({
      source: edge.source,
      target: edge.target,
      relationshipType: edge.type,
    }));
  }

  private fromApi(raw: unknown): CeRelationship {
    const data = raw as {
      id: string;
      type_id?: string;
      type?: string;
      source_entity_id?: string;
      source?: string;
      target_entity_id?: string;
      target?: string;
      metadata?: Record<string, unknown>;
      metadata_?: Record<string, unknown>;
    };
    return {
      id: data.id,
      type: data.type_id || data.type || '',
      source: data.source_entity_id || data.source || '',
      target: data.target_entity_id || data.target || '',
      metadata: data.metadata || data.metadata_,
    };
  }

  private toApi(payload: Partial<CeRelationship>): Record<string, unknown> {
    return {
      ...(payload.id ? { id: payload.id } : {}),
      ...(payload.type ? { type_id: payload.type } : {}),
      ...(payload.source ? { source_entity_id: payload.source } : {}),
      ...(payload.target ? { target_entity_id: payload.target } : {}),
      ...(payload.metadata ? { metadata: payload.metadata } : {}),
    };
  }

  private fromApiType(raw: unknown): CeRelationshipType {
    const data = raw as {
      id: string;
      schema_id?: string;
      schemaId?: string;
      name: string;
      description?: string;
    };
    return {
      id: data.id,
      schemaId: data.schema_id || data.schemaId || '',
      name: data.name,
      description: data.description,
    };
  }

  private toApiType(payload: Partial<CeRelationshipType>): Record<string, unknown> {
    return {
      ...(payload.id ? { id: payload.id } : {}),
      ...(payload.schemaId ? { schema_id: payload.schemaId } : {}),
      ...(payload.name ? { name: payload.name } : {}),
      ...(payload.description ? { description: payload.description } : {}),
    };
  }
}
