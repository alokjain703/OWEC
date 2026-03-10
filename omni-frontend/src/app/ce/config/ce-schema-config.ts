import { CeTemplateLevel } from '../models/ce-template.model';

export const CE_TEMPLATE_LEVELS: CeTemplateLevel[] = ['XS', 'S', 'M', 'L', 'XL'];

export const CE_TRAIT_INPUT_MAP: Record<string, 'input' | 'textarea' | 'number' | 'boolean' | 'select' | 'relationship'> = {
  string: 'input',
  text: 'textarea',
  number: 'number',
  boolean: 'boolean',
  select: 'select',
  relationship: 'relationship',
};
