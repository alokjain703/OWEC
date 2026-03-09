import { Routes } from '@angular/router';

export const RELATIONSHIP_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/relationship-graph/relationship-graph.example').then(
        (m) => m.GraphExampleComponent
      ),
  },
];
