import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { CE_API_BASE } from '../../services/ce-api-base';
import { TraitPack } from '../models/trait-pack.model';

interface TraitPackApi {
  id: string;
  schema_id: string;
  name: string;
  description?: string;
  trait_def_ids?: string[];
}

@Injectable({ providedIn: 'root' })
export class TraitPackService {
  private readonly base = `${CE_API_BASE}/trait-packs`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<TraitPack[]> {
    return this.http.get<TraitPackApi[]>(this.base).pipe(map((items) => items.map(this.fromApi)));
  }

  getById(id: string): Observable<TraitPack> {
    return this.http.get<TraitPackApi>(`${this.base}/${id}`).pipe(map(this.fromApi));
  }

  create(data: TraitPack): Observable<TraitPack> {
    return this.http.post<TraitPackApi>(this.base, this.toApi(data)).pipe(map(this.fromApi));
  }

  update(id: string, data: Partial<TraitPack>): Observable<TraitPack> {
    return this.http.put<TraitPackApi>(`${this.base}/${id}`, this.toApi(data)).pipe(map(this.fromApi));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  private fromApi = (raw: TraitPackApi): TraitPack => ({
    id:          raw.id,
    schemaId:    raw.schema_id,
    name:        raw.name,
    description: raw.description,
    traitDefIds: raw.trait_def_ids ?? [],
  });

  private toApi(data: Partial<TraitPack>): Partial<TraitPackApi> {
    const out: Partial<TraitPackApi> = {};
    if (data.id          !== undefined) out.id            = data.id;
    if (data.schemaId    !== undefined) out.schema_id     = data.schemaId;
    if (data.name        !== undefined) out.name          = data.name;
    if (data.description !== undefined) out.description   = data.description;
    if (data.traitDefIds !== undefined) out.trait_def_ids = data.traitDefIds;
    return out;
  }
}
