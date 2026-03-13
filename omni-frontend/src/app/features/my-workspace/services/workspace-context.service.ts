import { Injectable, signal } from '@angular/core';
import { forkJoin, Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { ActivityService } from './activity.service';
import { BookmarksService } from './bookmarks.service';
import { UserSettingsService } from './user-settings.service';
import { RampsAccountService } from './ramps-account.service';
import { DashboardData } from '../models/workspace.models';

@Injectable({ providedIn: 'root' })
export class WorkspaceContextService {
  loading = signal(false);

  constructor(
    private activitySvc: ActivityService,
    private bookmarksSvc: BookmarksService,
    private settingsSvc: UserSettingsService,
    private rampsSvc: RampsAccountService,
  ) {}

  getDashboardData(): Observable<DashboardData> {
    this.loading.set(true);
    return forkJoin({
      recentActivity: this.activitySvc.getRecentActivity(20).pipe(catchError(() => of([]))),
      bookmarks: this.bookmarksSvc.getBookmarks().pipe(catchError(() => of([]))),
      settingsResponse: this.settingsSvc.getSettings().pipe(catchError(() => of(null))),
      profile: this.rampsSvc.getProfile().pipe(catchError(() => of(undefined))),
    }).pipe(
      map(({ recentActivity, bookmarks, settingsResponse, profile }) => ({
        recentActivity,
        bookmarks,
        settings: settingsResponse?.settings ?? {},
        profile,
      })),
      // tap stop loading
      map((data) => {
        this.loading.set(false);
        return data;
      }),
    );
  }
}
