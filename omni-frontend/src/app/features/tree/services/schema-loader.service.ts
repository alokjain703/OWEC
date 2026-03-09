import { Injectable, inject } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';
import { OmniApiService } from '../../../core/services/omni-api.service';
import { Schema } from '../../schemas/models/schema.model';

export interface SchemaOption {
  id: string;
  name: string;
  version: number;
  description?: string;
}

/**
 * Schema Loader Service
 * 
 * Handles loading available schemas and initializing projects with schema templates.
 */
@Injectable({
  providedIn: 'root'
})
export class SchemaLoaderService {
  private api = inject(OmniApiService);

  /**
   * Get all available schemas from the backend
   */
  async listSchemas(): Promise<SchemaOption[]> {
    const schemas = await firstValueFrom(this.api.listSchemas());
    return schemas as SchemaOption[];
  }

  /**
   * Initialize a project with a selected schema
   * This will create starter nodes based on the schema definition
   */
  async initializeProjectWithSchema(projectId: string, schemaId: string): Promise<void> {
    await firstValueFrom(
      this.api.initializeProjectWithSchema(projectId, schemaId)
    );
  }

  /**
   * Create a new custom schema
   */
  async createSchema(schemaDefinition: Partial<Schema>): Promise<SchemaOption> {
    const result = await firstValueFrom(this.api.createSchema(schemaDefinition));
    return result as SchemaOption;
  }
}
