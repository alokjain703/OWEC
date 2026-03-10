import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { CE_API_BASE } from './ce-api-base';
import { CeTemplate } from '../models/ce-template.model';

@Injectable({ providedIn: 'root' })
export class CeTemplateService {
  private readonly base = CE_API_BASE;

  constructor(private http: HttpClient) {}

  listTemplates(): Observable<CeTemplate[]> {
    return this.http.get<unknown[]>(`${this.base}/templates`).pipe(
      map((items) => items.map((item) => this.fromApi(item)))
    );
  }

  createTemplate(payload: CeTemplate): Observable<CeTemplate> {
    return this.http.post<unknown>(`${this.base}/templates`, this.toApi(payload)).pipe(
      map((item) => this.fromApi(item))
    );
  }

  updateTemplate(id: string, payload: Partial<CeTemplate>): Observable<CeTemplate> {
    return this.http.put<unknown>(`${this.base}/templates/${id}`, this.toApi(payload)).pipe(
      map((item) => this.fromApi(item))
    );
  }

  deleteTemplate(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/templates/${id}`);
  }

  private fromApi(raw: unknown): CeTemplate {
    const data = raw as {
      id: string;
      schema_id?: string;
      schemaId?: string;
      template_level?: string;
      templateLevel?: string;
      inherits_from?: string;
      inheritsFrom?: string;
    };
    return {
      id: data.id,
      schemaId: data.schema_id || data.schemaId || '',
      level: (data.template_level || data.templateLevel || 'XS') as any,
      inheritsFrom: (data.inherits_from || data.inheritsFrom) as any,
    };
  }

  private toApi(payload: Partial<CeTemplate>): Record<string, unknown> {
    return {
      ...(payload.id ? { id: payload.id } : {}),
      ...(payload.schemaId ? { schema_id: payload.schemaId } : {}),
      ...(payload.level ? { template_level: payload.level } : {}),
      ...(payload.inheritsFrom ? { inherits_from: payload.inheritsFrom } : {}),
    };
  }
}
