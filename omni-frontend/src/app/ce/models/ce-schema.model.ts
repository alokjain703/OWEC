export interface CeSchema {
  id: string;
  name: string;
  description?: string;
  templates: string[];
  traitPacks: string[];
  relationships: string[];
}
