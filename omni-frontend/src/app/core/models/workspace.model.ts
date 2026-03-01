export interface Workspace {
  id: string;
  type: 'personal' | 'organization' | 'enterprise';
  name: string;
  owner_user_id: string;
  subscription_tier: string;
  storage_quota_mb: number;
  project_limit: number;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
  members?: WorkspaceMember[];
}

export interface WorkspaceMember {
  workspace_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
}

export interface WorkspaceCreate {
  type?: 'personal' | 'organization' | 'enterprise';
  name: string;
  owner_user_id: string;
  subscription_tier?: string;
  storage_quota_mb?: number;
  project_limit?: number;
  settings?: Record<string, any>;
}

export interface WorkspaceUpdate {
  name?: string;
  subscription_tier?: string;
  storage_quota_mb?: number;
  project_limit?: number;
  settings?: Record<string, any>;
}

export interface WorkspaceMemberAdd {
  user_id: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
}
