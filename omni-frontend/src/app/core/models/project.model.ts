export type ProjectStatus = 'active' | 'archived' | 'deleted';
export type ProjectVisibility = 'private' | 'workspace' | 'public';
export type StorageMode = 'local' | 's3';

export interface Project {
  id: string;
  workspace_id: string;
  created_by: string;
  title: string;
  description?: string;
  status: ProjectStatus;
  visibility: ProjectVisibility;
  storage_mode: StorageMode;
  active_schema_id?: string;
  settings?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ProjectCreate {
  workspace_id: string;
  created_by: string;
  title: string;
  description?: string;
  status?: ProjectStatus;
  visibility?: ProjectVisibility;
  storage_mode?: StorageMode;
  active_schema_id?: string;
  settings?: Record<string, any>;
}

export interface ProjectUpdate {
  title?: string;
  description?: string;
  status?: ProjectStatus;
  visibility?: ProjectVisibility;
  storage_mode?: StorageMode;
  active_schema_id?: string;
  settings?: Record<string, any>;
}
