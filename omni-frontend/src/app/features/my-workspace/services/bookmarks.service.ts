import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { WorkspaceBookmark } from '../models/workspace.models';
import { environment } from '../../../../environments/environment';

interface BookmarkApiResponse {
  id: string;
  object_type: string;
  object_id: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

function toBookmark(r: BookmarkApiResponse): WorkspaceBookmark {
  return {
    id: r.id,
    objectType: r.object_type,
    objectId: r.object_id,
    metadata: r.metadata,
    createdAt: r.created_at,
  };
}

@Injectable({ providedIn: 'root' })
export class BookmarksService {
  private readonly base = environment.apiBase.replace('/v1', '');

  bookmarks = signal<WorkspaceBookmark[]>([]);

  constructor(private http: HttpClient) {}

  getBookmarks(objectType?: string): Observable<WorkspaceBookmark[]> {
    let params = new HttpParams();
    if (objectType) params = params.set('object_type', objectType);
    return this.http
      .get<BookmarkApiResponse[]>(`${this.base}/user-context/bookmarks`, { params })
      .pipe(
        map((items) => items.map(toBookmark)),
        tap((items) => this.bookmarks.set(items)),
      );
  }

  addBookmark(objectType: string, objectId: string, metadata: Record<string, unknown> = {}): Observable<WorkspaceBookmark> {
    return this.http
      .post<BookmarkApiResponse>(`${this.base}/user-context/bookmarks`, {
        object_type: objectType,
        object_id: objectId,
        metadata,
      })
      .pipe(
        map(toBookmark),
        tap((bm) => this.bookmarks.update((list) => [...list, bm])),
      );
  }

  removeBookmark(objectType: string, objectId: string): Observable<void> {
    const params = new HttpParams()
      .set('object_type', objectType)
      .set('object_id', objectId);
    return this.http
      .delete<void>(`${this.base}/user-context/bookmarks`, { params })
      .pipe(
        tap(() =>
          this.bookmarks.update((list) =>
            list.filter((b) => !(b.objectType === objectType && b.objectId === objectId))
          )
        ),
      );
  }

  toggleBookmark(objectType: string, objectId: string, metadata: Record<string, unknown> = {}): Observable<void | WorkspaceBookmark> {
    const exists = this.bookmarks().some(
      (b) => b.objectType === objectType && b.objectId === objectId
    );
    if (exists) {
      return this.removeBookmark(objectType, objectId);
    } else {
      return this.addBookmark(objectType, objectId, metadata);
    }
  }

  isBookmarked(objectType: string, objectId: string): boolean {
    return this.bookmarks().some(
      (b) => b.objectType === objectType && b.objectId === objectId
    );
  }

  getPinnedItems(): WorkspaceBookmark[] {
    return this.bookmarks().filter((b) => b.metadata?.['pinned'] === true);
  }
}
