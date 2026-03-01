import { Routes } from '@angular/router';

export const TIMELINE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./timeline-view.component').then((m) => m.TimelineViewComponent),
  },
];
