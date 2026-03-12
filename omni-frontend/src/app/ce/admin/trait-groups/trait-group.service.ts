import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { CE_API_BASE } from '../../services/ce-api-base';
import { TraitGroup } from '../models/trait-group.model';

interface TraitGroupApi {
  id: string;
  schema_id: string;
  name: string;
  label: string;
  display_order: number;
  description?: string;
}

@Injectable({ providedIn: 'root' })
export class TraitGroupService {
  private readonly base = `${CE_API_BASE}/trait-groups`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<TraitGroup[]> {
    return this.http.get<TraitGroupApi[]>(this.base).pipe(map((items) => items.map(this.fromApi)));
  }

  getById(id: string): Observable<TraitGroup> {
    return this.http.get<TraitGroupApi>(`${this.base}/${id}`).pipe(map(this.fromApi));
  }

  create(data: Omit<TraitGroup, 'id'>): Observable<TraitGroup> {
    return this.http.post<TraitGroupApi>(this.base, this.toApi(data)).pipe(map(this.fromApi));
  }

  update(id: string, data: Partial<Omit<TraitGroup, 'id'>>): Observable<TraitGroup> {
    return this.http.put<TraitGroupApi>(`${this.base}/${id}`, this.toApi(data)).pipe(map(this.fromApi));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  private fromApi = (raw: TraitGroupApi): TraitGroup => ({
    id:           raw.id,
    schemaId:     raw.schema_id,
    name:         raw.name,
    label:        raw.label,
    displayOrder: raw.display_order,
    description:  raw.description,
  });

  private toApi(data: Partial<Omit<TraitGroup, 'id'>>): Partial<TraitGroupApi> {
    const out: Partial<TraitGroupApi> = {};
    if (data.schemaId     !== undefined) out.schema_id     = data.schemaId;
    if (data.name         !== undefined) out.name          = data.name;
    if (data.label        !== undefined) out.label         = data.label;
    if (data.displayOrder !== undefined) out.display_order = data.displayOrder;
    if (data.description  !== undefined) out.description   = data.description;
    return out;
  }
}
