import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';

import { CeEntityService } from './services/ce-entity.service';
import { CeTraitService } from './services/ce-trait.service';
import { CeTemplateService } from './services/ce-template.service';
import { CeRelationshipService } from './services/ce-relationship.service';
import { CeAiService } from './services/ce-ai.service';
import { CeTraitResolverService } from './engine/ce-trait-resolver.service';
import { CeSchemaRegistryService } from './engine/ce-schema-registry.service';
import { CeTemplateResolverService } from './engine/ce-template-resolver.service';

export function provideCharacterEngine(): EnvironmentProviders {
  return makeEnvironmentProviders([
    CeEntityService,
    CeTraitService,
    CeTemplateService,
    CeRelationshipService,
    CeAiService,
    CeTraitResolverService,
    CeSchemaRegistryService,
    CeTemplateResolverService,
  ]);
}
