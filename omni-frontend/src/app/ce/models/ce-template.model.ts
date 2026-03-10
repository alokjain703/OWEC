export type CeTemplateLevel = 'XS' | 'S' | 'M' | 'L' | 'XL';

export interface CeTemplate {
  id: string;
  schemaId: string;
  level: CeTemplateLevel;
  inheritsFrom?: CeTemplateLevel;
}
