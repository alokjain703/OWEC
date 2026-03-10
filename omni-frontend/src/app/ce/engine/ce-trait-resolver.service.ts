import { Injectable } from '@angular/core';

import { CeEntity } from '../models/ce-entity.model';
import { CeTemplateResolverService } from './ce-template-resolver.service';
import { CeResolvedTrait, CeTraitDef } from '../models/ce-trait.model';
import { CeSchemaRegistryService } from './ce-schema-registry.service';

@Injectable({ providedIn: 'root' })
export class CeTraitResolverService {
  constructor(
    private registry: CeSchemaRegistryService,
    private templates: CeTemplateResolverService
  ) {}

  resolveTraits(entity: CeEntity): CeResolvedTrait[] {
    const templateList = this.registry.getTemplates(entity.schema);
    const templateChain = this.templates.resolveTemplateChain(
      templateList,
      entity.template as any
    );

    const traitDefs = this.registry.getTraitDefs(entity.schema);

    const schemaTraits = traitDefs.filter((t) => t.source === 'schema');
    const templateTraits = traitDefs.filter(
      (t) => t.source === 'template' && templateChain.includes(t.group as any)
    );
    const packTraits = traitDefs.filter(
      (t) => t.source === 'traitPack' && entity.traitPacks.includes(t.group)
    );

    const merged = new Map<string, CeTraitDef>();
    [...schemaTraits, ...templateTraits, ...packTraits].forEach((trait) => {
      merged.set(trait.id, trait);
    });

    return Array.from(merged.values()).map((trait) => ({
      traitDefId: trait.id,
      traitKey: trait.traitKey || trait.label,
      label: trait.label,
      type: trait.type,
      group: trait.group,
      source: trait.source,
      value: entity.traits[trait.id],
    }));
  }
}
