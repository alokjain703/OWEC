import { Routes } from '@angular/router';

export const CHARACTER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./character-dashboard.component').then(
        (m) => m.CharacterDashboardComponent
      ),
  },
];
