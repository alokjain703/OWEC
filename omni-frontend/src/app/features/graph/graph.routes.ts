import { Routes } from '@angular/router';

export const GRAPH_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./graph-view.component').then((m) => m.GraphViewComponent),
  },
];
