import { CeTemplateLevel } from './ce-template.model';

export interface CeEntity {
  id: string;
  schema: string;
  template: CeTemplateLevel;
  traitPacks: string[];
  traits: Record<string, unknown>;
  name?: string;
  metadata?: Record<string, unknown>;
}
