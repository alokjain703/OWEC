export type CeTraitSource = 'schema' | 'template' | 'traitPack';

export interface CeTraitDef {
  id: string;
  schemaId?: string;
  label: string;
  type: string;
  group: string;
  source: CeTraitSource;
  traitKey?: string;
}

export interface CeTraitPack {
  id: string;
  schemaId: string;
  name: string;
  description?: string;
  traitDefIds?: string[];
}

export interface CeResolvedTrait {
  traitDefId: string;
  traitKey: string;
  label: string;
  type: string;
  group: string;
  source: CeTraitSource;
  value?: unknown;
}
