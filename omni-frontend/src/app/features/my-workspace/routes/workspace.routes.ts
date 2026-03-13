import { Routes } from '@angular/router';
import { authGuard } from '../../../core/guards/auth.guard';

export const MY_WORKSPACE_ROUTES: Routes = [
  {
    path: 'me',
    canActivate: [authGuard],
    loadComponent: () =>
      import('../pages/my-workspace-dashboard.component').then(
        (m) => m.MyWorkspaceDashboardComponent
      ),
  },
  {
    path: 'me/activity',
    canActivate: [authGuard],
    loadComponent: () =>
      import('../pages/my-workspace-activity.component').then(
        (m) => m.MyWorkspaceActivityComponent
      ),
  },
  {
    path: 'me/settings',
    canActivate: [authGuard],
    loadComponent: () =>
      import('../pages/my-workspace-settings.component').then(
        (m) => m.MyWorkspaceSettingsComponent
      ),
  },
];
