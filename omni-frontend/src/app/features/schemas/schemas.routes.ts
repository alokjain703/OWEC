import { Routes } from '@angular/router';

export const SCHEMA_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./schemas-view.component').then((m) => m.SchemasViewComponent),
  },
];
