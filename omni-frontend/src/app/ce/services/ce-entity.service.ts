import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { CE_API_BASE } from './ce-api-base';
import { CeEntity } from '../models/ce-entity.model';
import { CeTemplateLevel } from '../models/ce-template.model';

@Injectable({ providedIn: 'root' })
export class CeEntityService {
  private readonly base = CE_API_BASE;

  constructor(private http: HttpClient) {}

  listEntities(): Observable<CeEntity[]> {
    return this.http.get<unknown[]>(`${this.base}/entities`).pipe(
      map((items) => items.map((item) => this.fromApi(item)))
    );
  }

  getEntity(id: string): Observable<CeEntity> {
    return this.http.get<unknown>(`${this.base}/entities/${id}`).pipe(
      map((item) => this.fromApi(item))
    );
  }

  createEntity(payload: CeEntity): Observable<CeEntity> {
    return this.http.post<unknown>(`${this.base}/entities`, this.toApi(payload)).pipe(
      map((item) => this.fromApi(item))
    );
  }

  updateEntity(id: string, payload: Partial<CeEntity>): Observable<CeEntity> {
    return this.http.put<unknown>(`${this.base}/entities/${id}`, this.toApi(payload)).pipe(
      map((item) => this.fromApi(item))
    );
  }

  deleteEntity(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/entities/${id}`);
  }

  listEntityTraits(id: string): Observable<unknown[]> {
    return this.http.get<unknown[]>(`${this.base}/entities/${id}/traits`);
  }

  putEntityTraits(id: string, payload: { values: { traitDefId: string; value: unknown }[] }): Observable<unknown[]> {
    const values = payload.values.map((item) => ({
      trait_def_id: item.traitDefId,
      value: item.value,
    }));
    return this.http.put<unknown[]>(`${this.base}/entities/${id}/traits`, { values });
  }

  getResolvedTraits(id: string): Observable<unknown[]> {
    return this.http.get<unknown[]>(`${this.base}/entities/${id}/resolved-traits`);
  }

  private fromApi(raw: unknown): CeEntity {
    const data = raw as {
      id: string;
      schema_id?: string;
      schema?: string;
      template_level?: string;
      template?: string;
      name?: string;
      metadata?: Record<string, unknown>;
      metadata_?: Record<string, unknown>;
      traits?: Record<string, unknown>;
    };
    const metadata = data.metadata || data.metadata_ || {};
    return {
      id: data.id,
      schema: data.schema_id || data.schema || '',
      template: (data.template_level || data.template || 'XS') as CeTemplateLevel,
      name: data.name,
      metadata,
      traitPacks: (metadata as any).trait_packs || [],
      traits: data.traits || {},
    };
  }

  private toApi(payload: Partial<CeEntity>): Record<string, unknown> {
    const metadata = {
      ...(payload.metadata || {}),
      ...(payload.traitPacks ? { trait_packs: payload.traitPacks } : {}),
    };

    return {
      ...(payload.id !== undefined ? { id: payload.id } : {}),
      ...(payload.schema !== undefined && payload.schema !== '' ? { schema_id: payload.schema } : {}),
      ...(payload.template !== undefined ? { template_level: payload.template } : {}),
      ...(payload.name !== undefined ? { name: payload.name } : {}),
      ...(Object.keys(metadata).length ? { metadata } : {}),
    };
  }
}
