import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { CE_API_BASE } from '../../services/ce-api-base';
import { Schema } from '../models/schema.model';

@Injectable({ providedIn: 'root' })
export class SchemaService {
  private readonly base = `${CE_API_BASE}/schemas`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Schema[]> {
    return this.http.get<Schema[]>(this.base);
  }

  getById(id: string): Observable<Schema> {
    return this.http.get<Schema>(`${this.base}/${id}`);
  }

  create(data: Omit<Schema, 'id'>): Observable<Schema> {
    return this.http.post<Schema>(this.base, data);
  }

  update(id: string, data: Partial<Omit<Schema, 'id'>>): Observable<Schema> {
    return this.http.put<Schema>(`${this.base}/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
