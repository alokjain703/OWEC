export enum TraitValueType {
  TEXT         = 'text',
  LONG_TEXT    = 'long_text',
  NUMBER       = 'number',
  BOOLEAN      = 'boolean',
  DATE         = 'date',
  SELECT       = 'select',
  MULTI_SELECT = 'multi_select',
}

export const TRAIT_VALUE_TYPE_LABELS: Record<TraitValueType, string> = {
  [TraitValueType.TEXT]:         'Text',
  [TraitValueType.LONG_TEXT]:    'Long Text',
  [TraitValueType.NUMBER]:       'Number',
  [TraitValueType.BOOLEAN]:      'Boolean',
  [TraitValueType.DATE]:         'Date',
  [TraitValueType.SELECT]:       'Select',
  [TraitValueType.MULTI_SELECT]: 'Multi Select',
};

export interface TraitDef {
  id: string;
  schemaId: string;
  groupId: string;
  name: string;
  label: string;
  valueType: TraitValueType;
  isRequired: boolean;
  displayOrder: number;
  description?: string;
}
