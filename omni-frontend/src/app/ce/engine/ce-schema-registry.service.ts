import { Injectable, signal } from '@angular/core';

import { CeSchema } from '../models/ce-schema.model';
import { CeTemplate } from '../models/ce-template.model';
import { CeTraitDef, CeTraitPack } from '../models/ce-trait.model';
import { CeRelationshipType } from '../models/ce-relationship.model';

@Injectable({ providedIn: 'root' })
export class CeSchemaRegistryService {
  private schemas = signal<CeSchema[]>([]);
  private templates = signal<CeTemplate[]>([]);
  private traitDefs = signal<CeTraitDef[]>([]);
  private traitPacks = signal<CeTraitPack[]>([]);
  private relationshipTypes = signal<CeRelationshipType[]>([]);

  setSchemas(schemas: CeSchema[]): void {
    this.schemas.set(schemas);
  }

  setTemplates(templates: CeTemplate[]): void {
    this.templates.set(templates);
  }

  setTraitDefs(traits: CeTraitDef[]): void {
    this.traitDefs.set(traits);
  }

  setTraitPacks(packs: CeTraitPack[]): void {
    this.traitPacks.set(packs);
  }

  setRelationshipTypes(types: CeRelationshipType[]): void {
    this.relationshipTypes.set(types);
  }

  getSchemas(): CeSchema[] {
    return this.schemas();
  }

  getTemplates(schemaId?: string): CeTemplate[] {
    const items = this.templates();
    return schemaId ? items.filter((t) => t.schemaId === schemaId) : items;
  }

  getTraitDefs(schemaId?: string): CeTraitDef[] {
    const items = this.traitDefs();
    return schemaId ? items.filter((t) => t.schemaId === schemaId) : items;
  }

  getTraitPacks(schemaId?: string): CeTraitPack[] {
    const items = this.traitPacks();
    return schemaId ? items.filter((p) => p.schemaId === schemaId) : items;
  }

  getRelationshipTypes(schemaId?: string): CeRelationshipType[] {
    const items = this.relationshipTypes();
    return schemaId ? items.filter((r) => r.schemaId === schemaId) : items;
  }
}
