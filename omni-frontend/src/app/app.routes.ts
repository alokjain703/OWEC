import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'tree', pathMatch: 'full' },
  {
    path: 'tree',
    loadChildren: () =>
      import('./features/tree/tree.routes').then((m) => m.TREE_ROUTES),
  },
  {
    path: 'characters',
    loadChildren: () =>
      import('./features/characters/characters.routes').then(
        (m) => m.CHARACTER_ROUTES
      ),
  },
  {
    path: 'timeline',
    loadChildren: () =>
      import('./features/timeline/timeline.routes').then(
        (m) => m.TIMELINE_ROUTES
      ),
  },
  {
    path: 'graph',
    loadChildren: () =>
      import('./features/graph/graph.routes').then((m) => m.GRAPH_ROUTES),
  },
  {
    path: 'schemas',
    loadChildren: () =>
      import('./features/schemas/schemas.routes').then(
        (m) => m.SCHEMA_ROUTES
      ),
  },
  {
    path: 'auth/callback',
    loadComponent: () =>
      import('./features/auth/auth-callback.component').then(
        (m) => m.AuthCallbackComponent
      ),
  },
  { path: '**', redirectTo: 'tree' },
];
