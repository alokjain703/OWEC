import { Injectable } from '@angular/core';

import { CeEditorTrait, CeTraitGroup } from '../models/ce-trait-group.model';
import { CeEditorResponse } from '../models/ce-editor-response.model';

/**
 * Converts raw API responses into UI-ready structures:
 * - group traits by group name
 * - flatten all traits from all groups into a single list
 */
@Injectable({ providedIn: 'root' })
export class SchemaService {
  /**
   * Returns the groups exactly as received from the API.
   * Use this when you need the full grouped structure for rendering.
   */
  getGroups(response: CeEditorResponse): CeTraitGroup[] {
    return response.groups;
  }

  /**
   * Flattens all traits from all groups into a single ordered list.
   */
  flattenTraits(response: CeEditorResponse): CeEditorTrait[] {
    return response.groups.flatMap((g) => g.traits);
  }

  /**
   * Re-groups a flat trait list by each trait's original group index.
   * Useful if the API returns a flat list and you need to derive grouping from metadata.
   */
  groupBy(
    traits: CeEditorTrait[],
    keyFn: (trait: CeEditorTrait) => string,
  ): CeTraitGroup[] {
    const map = new Map<string, CeEditorTrait[]>();
    for (const trait of traits) {
      const key = keyFn(trait);
      const existing = map.get(key);
      if (existing) {
        existing.push(trait);
      } else {
        map.set(key, [trait]);
      }
    }
    return Array.from(map.entries()).map(([name, ts]) => ({ name, traits: ts }));
  }
}
