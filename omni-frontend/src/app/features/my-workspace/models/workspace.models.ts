/** Shared data models for the My Workspace feature. */

export interface WorkspaceBookmark {
  id: string;
  objectType: string;
  objectId: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface WorkspaceActivity {
  id: string;
  objectType: string;
  objectId: string;
  action: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface UserSettings {
  theme?: string;
  defaultSchema?: string;
  graphLayout?: string;
  editorFontSize?: number;
  sidebarCollapsed?: boolean;
  [key: string]: unknown;
}

export interface SettingsResponse {
  id: string;
  tenantId: string;
  userId: string;
  scopeType: string;
  scopeId?: string | null;
  settings: UserSettings;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  tenantId: string;
  roles?: string[];
  avatarUrl?: string;
}

export interface DashboardData {
  recentActivity: WorkspaceActivity[];
  bookmarks: WorkspaceBookmark[];
  settings: UserSettings;
  profile?: UserProfile;
}
