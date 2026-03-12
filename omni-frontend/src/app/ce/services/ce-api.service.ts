import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { CE_API_BASE } from './ce-api-base';
import { CeEditorResponse, CeTraitSaveItem } from '../models/ce-editor-response.model';

/**
 * Thin orchestration service providing editor-specific endpoints:
 *  - GET  /api/ce/entities/{id}/editor  → CeEditorResponse
 *  - PUT  /api/ce/entities/{id}/traits  → saved trait list
 *
 * For entity CRUD and lower-level operations use CeEntityService / CeTraitService.
 */
@Injectable({ providedIn: 'root' })
export class CeApiService {
  private readonly base = CE_API_BASE;

  constructor(private http: HttpClient) {}

  /**
   * Fetch the full editor payload for an entity.
   * The response drives the dynamic form engine.
   */
  getEditorData(entityId: string): Observable<CeEditorResponse> {
    return this.http.get<CeEditorResponse>(
      `${this.base}/entities/${entityId}/editor`,
    );
  }

  /**
   * Persist trait values for an entity.
   * @param payload Array of { trait: traitName, value } items built by DynamicFormService.flattenToPayload()
   */
  saveTraits(
    entityId: string,
    payload: CeTraitSaveItem[],
  ): Observable<CeTraitSaveItem[]> {
    return this.http.put<CeTraitSaveItem[]>(
      `${this.base}/entities/${entityId}/traits`,
      { traits: payload },
    );
  }
}
