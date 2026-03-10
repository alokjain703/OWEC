import { Injectable } from '@angular/core';

import { CeTemplate, CeTemplateLevel } from '../models/ce-template.model';

@Injectable({ providedIn: 'root' })
export class CeTemplateResolverService {
  resolveTemplateChain(templates: CeTemplate[], level: CeTemplateLevel): CeTemplateLevel[] {
    const byLevel = new Map<string, CeTemplate>();
    templates.forEach((t) => byLevel.set(t.level, t));

    const chain: CeTemplateLevel[] = [];
    let current: CeTemplateLevel | undefined = level;

    while (current) {
      chain.push(current);
      const template = byLevel.get(current);
      if (!template || !template.inheritsFrom) {
        break;
      }
      current = template.inheritsFrom as CeTemplateLevel;
    }

    return chain;
  }
}
