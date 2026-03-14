import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CommitRequest,
  CommitResponse,
  ContentFormat,
  ParseResponse,
} from '../models/import-tree.model';

const API_BASE =
  (typeof window !== 'undefined' && (window as any)['__OMNI_API_BASE__']) ||
  'http://localhost:8052/api/v1';

@Injectable({ providedIn: 'root' })
export class DocumentToNodesService {
  private readonly base = `${API_BASE}/document-import`;

  constructor(private http: HttpClient) {}

  /**
   * Upload a document to the backend and receive the parsed node tree.
   * Uses multipart/form-data so file + format are sent together.
   */
  parseDocument(
    file: File,
    format: ContentFormat,
    schemaDefinition?: object,
  ): Observable<ParseResponse> {
    const form = new FormData();
    form.append('file', file, file.name);
    form.append('content_format', format);
    if (schemaDefinition) {
      form.append('schema_definition', JSON.stringify(schemaDefinition));
    }
    return this.http.post<ParseResponse>(`${this.base}/parse`, form);
  }

  /** Commit the (optionally edited) import tree to the OMNI database. */
  commitTree(payload: CommitRequest): Observable<CommitResponse> {
    return this.http.post<CommitResponse>(`${this.base}/commit`, payload);
  }
}
