import { Routes } from '@angular/router';
import { ceAdminGuard } from './admin/guards/ce-admin.guard';

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
  {
    path: 'admin',
    loadComponent: () =>
      import('./admin/components/admin-shell/ce-admin-shell.component').then(
        (m) => m.CeAdminShellComponent
      ),
    canActivate: [ceAdminGuard],
    children: [
      { path: '', redirectTo: 'schemas', pathMatch: 'full' },
      {
        path: 'schemas',
        loadComponent: () =>
          import('./admin/schemas/schemas-page.component').then(
            (m) => m.SchemasPageComponent
          ),
        canActivate: [ceAdminGuard],
      },
      {
        path: 'trait-groups',
        loadComponent: () =>
          import('./admin/trait-groups/trait-groups-page.component').then(
            (m) => m.TraitGroupsPageComponent
          ),
        canActivate: [ceAdminGuard],
      },
      {
        path: 'trait-defs',
        loadComponent: () =>
          import('./admin/trait-defs/trait-defs-page.component').then(
            (m) => m.TraitDefsPageComponent
          ),
        canActivate: [ceAdminGuard],
      },
      {
        path: 'trait-options',
        loadComponent: () =>
          import('./admin/trait-options/trait-options-page.component').then(
            (m) => m.TraitOptionsPageComponent
          ),
        canActivate: [ceAdminGuard],
      },
      {
        path: 'trait-packs',
        loadComponent: () =>
          import('./admin/trait-packs/trait-packs-page.component').then(
            (m) => m.TraitPacksPageComponent
          ),
        canActivate: [ceAdminGuard],
      },
      {
        path: 'relationship-types',
        loadComponent: () =>
          import('./admin/relationship-types/relationship-types-page.component').then(
            (m) => m.RelationshipTypesPageComponent
          ),
        canActivate: [ceAdminGuard],
      },
    ],
  },
];
