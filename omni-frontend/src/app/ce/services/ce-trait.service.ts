import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { CE_API_BASE } from './ce-api-base';
import { CeTraitDef, CeTraitPack } from '../models/ce-trait.model';

@Injectable({ providedIn: 'root' })
export class CeTraitService {
  private readonly base = CE_API_BASE;

  constructor(private http: HttpClient) {}

  listTraitDefs(): Observable<CeTraitDef[]> {
    return this.http.get<unknown[]>(`${this.base}/traits`).pipe(
      map((items) => items.map((item) => this.fromApiTrait(item)))
    );
  }

  createTraitDef(payload: CeTraitDef): Observable<CeTraitDef> {
    return this.http.post<unknown>(`${this.base}/traits`, this.toApiTrait(payload)).pipe(
      map((item) => this.fromApiTrait(item))
    );
  }

  updateTraitDef(id: string, payload: Partial<CeTraitDef>): Observable<CeTraitDef> {
    return this.http.put<unknown>(`${this.base}/traits/${id}`, this.toApiTrait(payload)).pipe(
      map((item) => this.fromApiTrait(item))
    );
  }

  deleteTraitDef(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/traits/${id}`);
  }

  listTraitPacks(): Observable<CeTraitPack[]> {
    return this.http.get<unknown[]>(`${this.base}/trait-packs`).pipe(
      map((items) => items.map((item) => this.fromApiPack(item)))
    );
  }

  createTraitPack(payload: CeTraitPack): Observable<CeTraitPack> {
    return this.http.post<unknown>(`${this.base}/trait-packs`, this.toApiPack(payload)).pipe(
      map((item) => this.fromApiPack(item))
    );
  }

  updateTraitPack(id: string, payload: Partial<CeTraitPack>): Observable<CeTraitPack> {
    return this.http.put<unknown>(`${this.base}/trait-packs/${id}`, this.toApiPack(payload)).pipe(
      map((item) => this.fromApiPack(item))
    );
  }

  deleteTraitPack(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/trait-packs/${id}`);
  }

  private fromApiTrait(raw: unknown): CeTraitDef {
    const data = raw as {
      id: string;
      schema_id?: string;
      schemaId?: string;
      trait_key?: string;
      traitKey?: string;
      label: string;
      type: string;
      group_name?: string;
      group?: string;
      source: string;
    };
    return {
      id: data.id,
      schemaId: data.schema_id || data.schemaId,
      traitKey: data.trait_key || data.traitKey,
      label: data.label,
      type: data.type,
      group: data.group_name || data.group || '',
      source: data.source as any,
    };
  }

  private toApiTrait(payload: Partial<CeTraitDef>): Record<string, unknown> {
    return {
      ...(payload.id ? { id: payload.id } : {}),
      ...(payload.schemaId ? { schema_id: payload.schemaId } : {}),
      ...(payload.traitKey ? { trait_key: payload.traitKey } : {}),
      ...(payload.label ? { label: payload.label } : {}),
      ...(payload.type ? { type: payload.type } : {}),
      ...(payload.group ? { group_name: payload.group } : {}),
      ...(payload.source ? { source: payload.source } : {}),
    };
  }

  private fromApiPack(raw: unknown): CeTraitPack {
    const data = raw as {
      id: string;
      schema_id?: string;
      schemaId?: string;
      name: string;
      description?: string;
      trait_def_ids?: string[];
      traitDefIds?: string[];
    };
    return {
      id: data.id,
      schemaId: data.schema_id || data.schemaId || '',
      name: data.name,
      description: data.description,
      traitDefIds: data.trait_def_ids || data.traitDefIds,
    };
  }

  private toApiPack(payload: Partial<CeTraitPack>): Record<string, unknown> {
    return {
      ...(payload.id ? { id: payload.id } : {}),
      ...(payload.schemaId ? { schema_id: payload.schemaId } : {}),
      ...(payload.name ? { name: payload.name } : {}),
      ...(payload.description ? { description: payload.description } : {}),
      ...(payload.traitDefIds ? { trait_def_ids: payload.traitDefIds } : {}),
    };
  }
}
