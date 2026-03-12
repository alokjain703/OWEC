import { CeTraitGroup } from './ce-trait-group.model';

export interface CeEditorEntity {
  id: string;
  name: string;
  schema: string;
}

/**
 * Full response from GET /api/ce/entities/{id}/editor
 */
export interface CeEditorResponse {
  entity: CeEditorEntity;
  groups: CeTraitGroup[];
}

/** Flat payload item used when saving trait values */
export interface CeTraitSaveItem {
  trait: string;
  value: unknown;
}
