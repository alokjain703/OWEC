import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { CE_API_BASE } from './ce-api-base';
import { CeEntity } from '../models/ce-entity.model';

@Injectable({ providedIn: 'root' })
export class CeAiService {
  private readonly base = CE_API_BASE;

  constructor(private http: HttpClient) {}

  generateTraits(entity: CeEntity): Observable<unknown> {
    return this.http.post(`${this.base}/ai/generate-traits`, { entityId: entity.id });
  }

  generateBackstory(entity: CeEntity): Observable<unknown> {
    return this.http.post(`${this.base}/ai/generate-backstory`, { entityId: entity.id });
  }

  suggestRelationships(entity: CeEntity): Observable<unknown> {
    return this.http.post(`${this.base}/ai/suggest-relationships`, { entityId: entity.id });
  }
}
