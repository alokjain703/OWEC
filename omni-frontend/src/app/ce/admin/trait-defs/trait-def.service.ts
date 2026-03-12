import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { CE_API_BASE } from '../../services/ce-api-base';
import { TraitDef } from '../models/trait-def.model';

interface TraitDefApi {
  id: string;
  schema_id: string;
  group_id: string;
  name: string;
  label: string;
  value_type: string;
  is_required: boolean;
  display_order: number;
  description?: string;
}

@Injectable({ providedIn: 'root' })
export class TraitDefService {
  private readonly base = `${CE_API_BASE}/traits`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<TraitDef[]> {
    return this.http.get<TraitDefApi[]>(this.base).pipe(map((items) => items.map(this.fromApi)));
  }

  getById(id: string): Observable<TraitDef> {
    return this.http.get<TraitDefApi>(`${this.base}/${id}`).pipe(map(this.fromApi));
  }

  create(data: TraitDef): Observable<TraitDef> {
    return this.http.post<TraitDefApi>(this.base, this.toApi(data)).pipe(map(this.fromApi));
  }

  update(id: string, data: Partial<TraitDef>): Observable<TraitDef> {
    return this.http.put<TraitDefApi>(`${this.base}/${id}`, this.toApi(data)).pipe(map(this.fromApi));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  private fromApi = (raw: TraitDefApi): TraitDef => ({
    id:           raw.id,
    schemaId:     raw.schema_id,
    groupId:      raw.group_id,
    name:         raw.name,
    label:        raw.label,
    valueType:    raw.value_type as TraitDef['valueType'],
    isRequired:   raw.is_required,
    displayOrder: raw.display_order,
    description:  raw.description,
  });

  private toApi(data: Partial<TraitDef>): Partial<TraitDefApi> {
    const out: Partial<TraitDefApi> = {};
    if (data.id           !== undefined) out.id            = data.id;
    if (data.schemaId     !== undefined) out.schema_id    = data.schemaId;
    if (data.groupId      !== undefined) out.group_id     = data.groupId;
    if (data.name         !== undefined) out.name         = data.name;
    if (data.label        !== undefined) out.label        = data.label;
    if (data.valueType    !== undefined) out.value_type   = data.valueType;
    if (data.isRequired   !== undefined) out.is_required  = data.isRequired;
    if (data.displayOrder !== undefined) out.display_order = data.displayOrder;
    if (data.description  !== undefined) out.description  = data.description;
    return out;
  }
}
