/**
 * Schema models for OMNI platform
 * Defines the structure of schema templates used to create and organize projects
 */

/**
 * Metadata field type enumeration
 */
export type MetadataFieldType = 'string' | 'integer' | 'number' | 'boolean' | 'array' | 'object';

/**
 * Metadata field definition for a specific role
 */
export interface MetadataFieldDefinition {
  type: MetadataFieldType;
  required?: boolean;
  default?: any;
  enum?: string[];
  items?: { type: string };
  description?: string;
}

/**
 * Collection of metadata fields for a role
 */
export interface MetadataDefinitions {
  [fieldName: string]: MetadataFieldDefinition;
}

/**
 * Role definition in a schema
 */
export interface RoleDefinition {
  label: string;
  description?: string;
  icon?: string;
}

/**
 * Complete schema structure
 */
export interface Schema {
  id?: string;
  name?: string;
  version?: number;
  roles: {
    [roleKey: string]: RoleDefinition;
  };
  allowed_children: {
    [roleKey: string]: string[];
  };
  metadata_definitions: {
    [roleKey: string]: MetadataDefinitions;
  };
}

/**
 * Default/empty schema template
 */
export const DEFAULT_SCHEMA: Schema = {
  roles: {
    universe: {
      label: 'Universe',
      description: 'The top-level fictional universe',
      icon: 'public'
    },
    collection: {
      label: 'Collection',
      description: 'A collection of related works',
      icon: 'folder'
    },
    major_unit: {
      label: 'Major Unit',
      description: 'A major work or book',
      icon: 'menu_book'
    },
    atomic_unit: {
      label: 'Atomic Unit',
      description: 'A chapter or scene',
      icon: 'description'
    }
  },
  allowed_children: {
    universe: ['collection'],
    collection: ['major_unit'],
    major_unit: ['atomic_unit'],
    atomic_unit: []
  },
  metadata_definitions: {}
};

/**
 * Utility to validate schema structure
 */
export class SchemaValidator {
  static validate(schema: Schema): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check that roles exist
    if (!schema.roles || Object.keys(schema.roles).length === 0) {
      errors.push('Schema must define at least one role');
    }

    // Check that allowed_children only references defined roles
    if (schema.allowed_children) {
      for (const [parentRole, children] of Object.entries(schema.allowed_children)) {
        if (!schema.roles[parentRole]) {
          errors.push(`allowed_children references undefined parent role: ${parentRole}`);
        }
        for (const childRole of children) {
          if (!schema.roles[childRole]) {
            errors.push(`allowed_children references undefined child role: ${childRole}`);
          }
        }
      }
    }

    // Check that metadata_definitions only references defined roles
    if (schema.metadata_definitions) {
      for (const role of Object.keys(schema.metadata_definitions)) {
        if (!schema.roles[role]) {
          errors.push(`metadata_definitions references undefined role: ${role}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  static detectCycles(schema: Schema): { hasCycles: boolean; cycles: string[] } {
    const cycles: string[] = [];
    const visited = new Set<string>();
    const recStack = new Set<string>();

    const dfs = (role: string, path: string[]): boolean => {
      visited.add(role);
      recStack.add(role);
      path.push(role);

      const children = schema.allowed_children[role] || [];
      for (const child of children) {
        if (!visited.has(child)) {
          if (dfs(child, [...path])) {
            return true;
          }
        } else if (recStack.has(child)) {
          cycles.push([...path, child].join(' → '));
          return true;
        }
      }

      recStack.delete(role);
      return false;
    };

    for (const role of Object.keys(schema.roles)) {
      if (!visited.has(role)) {
        dfs(role, []);
      }
    }

    return {
      hasCycles: cycles.length > 0,
      cycles
    };
  }
}
