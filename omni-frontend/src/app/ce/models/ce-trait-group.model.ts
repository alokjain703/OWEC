/**
 * Represents a single trait field as returned by the editor endpoint
 * GET /api/ce/entities/{id}/editor
 */
export interface CeEditorTrait {
  id: string;
  name: string;
  label: string;
  /** text | long_text | number | boolean | select */
  type: string;
  required: boolean;
  value: unknown;
  options?: string[];
}

/**
 * A named group of traits used to section the dynamic form.
 */
export interface CeTraitGroup {
  name: string;
  traits: CeEditorTrait[];
}
