import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { MY_WORKSPACE_ROUTES } from './features/my-workspace/routes/workspace.routes';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard/user', pathMatch: 'full' },
  ...MY_WORKSPACE_ROUTES,
  
  // Dashboard routes (protected)
  {
    path: 'dashboard/account-manager',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboards/account-manager-dashboard.component').then(
        (m) => m.AccountManagerDashboardComponent
      ),
  },
  {
    path: 'dashboard/manager',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboards/manager-dashboard.component').then(
        (m) => m.ManagerDashboardComponent
      ),
  },
  {
    path: 'dashboard/user',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboards/user-dashboard.component').then(
        (m) => m.UserDashboardComponent
      ),
  },
  
  // Application-level routes (protected)
  {
    path: 'schemas',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/schemas/schemas.routes').then(
        (m) => m.SCHEMA_ROUTES
      ),
  },
  
  // Project routes (protected)
  {
    path: 'projects/:projectId/tree',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/tree/tree.routes').then((m) => m.TREE_ROUTES),
  },
  {
    path: 'tree',
    redirectTo: 'dashboard/user',
    pathMatch: 'full'
  },
  {
    path: 'characters',
    redirectTo: 'dashboard/user',
    pathMatch: 'full'
  },
  {
    path: 'projects/:projectId/characters',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/characters/characters.routes').then(
        (m) => m.CHARACTER_ROUTES
      ),
  },
  {
    path: 'timeline',
    redirectTo: 'dashboard/user',
    pathMatch: 'full'
  },
  {
    path: 'projects/:projectId/timeline',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/timeline/timeline.routes').then(
        (m) => m.TIMELINE_ROUTES
      ),
  },
  {
    path: 'graph',
    redirectTo: 'dashboard/user',
    pathMatch: 'full'
  },
  {
    path: 'projects/:projectId/graph',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/graph/graph.routes').then((m) => m.GRAPH_ROUTES),
  },
  {
    path: 'relationships',
    redirectTo: 'dashboard/user',
    pathMatch: 'full'
  },
  {
    path: 'projects/:projectId/relationships',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/relationships/relationships.routes').then(
        (m) => m.RELATIONSHIP_ROUTES
      ),
  },
  {
    path: 'ce',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./ce/ce.routes').then((m) => m.CE_ROUTES),
  },
  {
    path: 'projects/:projectId/schemas',
    redirectTo: '/schemas',
    pathMatch: 'full'
  },
  {
    path: 'auth/callback',
    loadComponent: () =>
      import('./features/auth/auth-callback.component').then(
        (m) => m.AuthCallbackComponent
      ),
  },
  { path: '**', redirectTo: 'dashboard/user' },
];
