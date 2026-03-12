import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { CE_API_BASE } from './ce-api-base';
import { CeSchema } from '../models/ce-schema.model';

@Injectable({ providedIn: 'root' })
export class CeSchemaService {
  private readonly base = CE_API_BASE;

  constructor(private http: HttpClient) {}

  listSchemas(): Observable<CeSchema[]> {
    return this.http.get<CeSchema[]>(`${this.base}/schemas`);
  }

  createSchema(payload: Pick<CeSchema, 'id' | 'name'> & { description?: string }): Observable<CeSchema> {
    return this.http.post<CeSchema>(`${this.base}/schemas`, payload);
  }

  updateSchema(id: string, payload: Partial<Pick<CeSchema, 'name' | 'description'>>): Observable<CeSchema> {
    return this.http.put<CeSchema>(`${this.base}/schemas/${id}`, payload);
  }

  deleteSchema(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/schemas/${id}`);
  }
}
