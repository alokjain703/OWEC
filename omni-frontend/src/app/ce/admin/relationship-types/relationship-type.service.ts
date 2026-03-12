import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { CE_API_BASE } from '../../services/ce-api-base';
import { RelationshipType } from '../models/relationship-type.model';

interface RelationshipTypeApi {
  id: string;
  schema_id: string;
  name: string;
  description?: string;
}

@Injectable({ providedIn: 'root' })
export class RelationshipTypeService {
  private readonly base = `${CE_API_BASE}/relationships/types`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<RelationshipType[]> {
    return this.http.get<RelationshipTypeApi[]>(this.base).pipe(map((items) => items.map(this.fromApi)));
  }

  getById(id: string): Observable<RelationshipType> {
    return this.http.get<RelationshipTypeApi>(`${this.base}/${id}`).pipe(map(this.fromApi));
  }

  create(data: Omit<RelationshipType, 'id'>): Observable<RelationshipType> {
    return this.http.post<RelationshipTypeApi>(this.base, this.toApi(data)).pipe(map(this.fromApi));
  }

  update(id: string, data: Partial<Omit<RelationshipType, 'id'>>): Observable<RelationshipType> {
    return this.http.put<RelationshipTypeApi>(`${this.base}/${id}`, this.toApi(data)).pipe(map(this.fromApi));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  private fromApi = (raw: RelationshipTypeApi): RelationshipType => ({
    id:          raw.id,
    schemaId:    raw.schema_id,
    name:        raw.name,
    description: raw.description,
  });

  private toApi(data: Partial<Omit<RelationshipType, 'id'>>): Partial<RelationshipTypeApi> {
    const out: Partial<RelationshipTypeApi> = {};
    if (data.schemaId    !== undefined) out.schema_id   = data.schemaId;
    if (data.name        !== undefined) out.name        = data.name;
    if (data.description !== undefined) out.description = data.description;
    return out;
  }
}
