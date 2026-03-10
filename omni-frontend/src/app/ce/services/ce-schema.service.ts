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
}
