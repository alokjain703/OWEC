import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { CE_API_BASE } from '../../services/ce-api-base';
import { TraitOption } from '../models/trait-option.model';

interface TraitOptionApi {
  id: string;
  trait_def_id: string;
  value: string;
  label: string;
  display_order: number;
}

@Injectable({ providedIn: 'root' })
export class TraitOptionService {
  private readonly base = `${CE_API_BASE}/trait-options`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<TraitOption[]> {
    return this.http.get<TraitOptionApi[]>(this.base).pipe(map((items) => items.map(this.fromApi)));
  }

  getByTraitDef(traitDefId: string): Observable<TraitOption[]> {
    return this.http
      .get<TraitOptionApi[]>(`${this.base}?trait_def_id=${traitDefId}`)
      .pipe(map((items) => items.map(this.fromApi)));
  }

  getById(id: string): Observable<TraitOption> {
    return this.http.get<TraitOptionApi>(`${this.base}/${id}`).pipe(map(this.fromApi));
  }

  create(data: Omit<TraitOption, 'id'>): Observable<TraitOption> {
    return this.http.post<TraitOptionApi>(this.base, this.toApi(data)).pipe(map(this.fromApi));
  }

  update(id: string, data: Partial<Omit<TraitOption, 'id'>>): Observable<TraitOption> {
    return this.http.put<TraitOptionApi>(`${this.base}/${id}`, this.toApi(data)).pipe(map(this.fromApi));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  private fromApi = (raw: TraitOptionApi): TraitOption => ({
    id:           raw.id,
    traitDefId:   raw.trait_def_id,
    value:        raw.value,
    label:        raw.label,
    displayOrder: raw.display_order,
  });

  private toApi(data: Partial<Omit<TraitOption, 'id'>>): Partial<TraitOptionApi> {
    const out: Partial<TraitOptionApi> = {};
    if (data.traitDefId   !== undefined) out.trait_def_id  = data.traitDefId;
    if (data.value        !== undefined) out.value         = data.value;
    if (data.label        !== undefined) out.label         = data.label;
    if (data.displayOrder !== undefined) out.display_order = data.displayOrder;
    return out;
  }
}
