import { Routes } from '@angular/router';

export const CE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/ce-character-explorer.component').then(
        (m) => m.CeCharacterExplorerComponent
      ),
  },
  {
    path: 'characters',
    loadComponent: () =>
      import('./components/ce-character-editor.component').then(
        (m) => m.CeCharacterEditorComponent
      ),
  },
  {
    path: 'characters/:entityId',
    loadComponent: () =>
      import('./components/ce-character-editor.component').then(
        (m) => m.CeCharacterEditorComponent
      ),
  },
  {
    path: 'relationships',
    loadComponent: () =>
      import('./components/ce-relationship-graph.component').then(
        (m) => m.CeRelationshipGraphComponent
      ),
  },
  {
    path: 'graph',
    loadComponent: () =>
      import('./graph/ce-graph-workspace.component').then(
        (m) => m.CeGraphWorkspaceComponent
      ),
  },
];
