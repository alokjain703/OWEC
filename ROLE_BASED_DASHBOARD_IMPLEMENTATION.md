# Role-Based Dashboard Implementation

## Overview
This implementation adds a complete role-based dashboard system with workspace and project management, integrating RAMPS authentication with Omni's local project data.

## Architecture

### Data Flow
1. **RAMPS** - Source of truth for:
   - User authentication (JWT tokens with roles)
   - Workspace metadata (tenants)
   - Project metadata (resource groups of type "project")
   - User-workspace access mappings

2. **Omni Backend** - Manages:
   - Workspace/project cache (synced from RAMPS)
   - Detailed project data (nodes, entities, events, edges, schemas)
   - Sync endpoints to refresh cache from RAMPS

3. **Omni Frontend** - Provides:
   - Role-based dashboard routing
   - Workspace/project selection UI
   - Role switcher for users with multiple roles
   - Current workspace/project display in header

## Features Implemented

### 1. Backend Infrastructure

#### Database Schema (`omni-db/init/001_init.sql`)
- **workspace_cache** - Caches workspace metadata from RAMPS
- **project_cache** - Caches basic project metadata from RAMPS
- **user_workspace_access** - Tracks user access to workspaces with roles

#### ORM Models (`omni-backend/app/models/workspace_cache.py`)
- `WorkspaceCache` - Workspace entity with name, type, status
- `ProjectCache` - Project entity with workspace FK, name, type
- `UserWorkspaceAccess` - User-workspace-role mapping

#### Pydantic Schemas (`omni-backend/app/schemas/workspace.py`)
- Request/response schemas for workspace operations
- DTOs for workspace with projects
- Sync request/response schemas

#### Backend Service (`omni-backend/app/modules/workspace_service.py`)
- `WorkspaceSyncService` - Handles syncing data from RAMPS
  - `sync_user_workspaces()` - Fetches and caches user workspaces
  - `get_user_workspaces()` - Returns cached workspaces
  - `get_workspace_projects()` - Returns cached projects for a workspace

#### API Endpoints (`omni-backend/app/api/v1/workspaces.py`)
- `POST /api/v1/workspaces/sync` - Sync workspaces from RAMPS
- `GET /api/v1/workspaces` - Get user's workspaces with projects
- `GET /api/v1/workspaces/{id}/projects` - Get projects for a workspace

#### Settings (`omni-backend/app/config/settings.py`)
- Added `RAMPS_API_URL` configuration (default: http://localhost:8001/api)

### 2. RAMPS Integration

#### RAMPS Endpoints (`RAMPS/apps/ramps-backend/app/api/routes/workspaces.py`)
- `GET /api/users/{user_id}/workspaces` - Returns workspaces (tenants) for a user
- `GET /api/workspaces/{workspace_id}/projects` - Returns projects (resource groups) for a workspace

These endpoints map RAMPS concepts to Omni concepts:
- **Tenant** → **Workspace**
- **Resource Group (type="project")** → **Project**

### 3. Frontend Services

#### WorkspaceService (`omni-frontend/src/app/core/services/workspace.service.ts`)
- HTTP client for workspace endpoints
- Methods: `syncWorkspaces()`, `getUserWorkspaces()`, `getWorkspaceProjects()`

#### WorkspaceStateService (`omni-frontend/src/app/core/services/workspace-state.service.ts`)
- Signal-based state management for workspaces and projects
- Tracks current workspace and project selection
- Persists selection to localStorage
- Reactive updates via Angular signals

#### RoleRoutingService (`omni-frontend/src/app/core/services/role-routing.service.ts`)
- Manages role-based routing logic
- Role priority: `sc-acct-mgr` > `sc-mgr` > `user`
- Handles role switching for multi-role users
- Persists current role to localStorage

### 4. Dashboard Components

#### Account Manager Dashboard (`account-manager-dashboard.component.ts`)
- Full workspace management view
- Grid layout of workspace cards
- Expandable project lists per workspace
- Workspace actions (view details, manage in RAMPS)
- Sync button to refresh from RAMPS

#### Manager Dashboard (`manager-dashboard.component.ts`)
- Team-focused workspace view
- List layout with project grids
- Emphasis on project selection
- Quick access to team workspaces

#### User Dashboard (`user-dashboard.component.ts`)
- Simple project-centric view
- Shows all projects across workspaces
- Highlights currently active project
- Quick project switching

### 5. Routing Integration

#### Routes (`omni-frontend/src/app/app.routes.ts`)
- `/dashboard/account-manager` - Account manager dashboard
- `/dashboard/manager` - Manager dashboard
- `/dashboard/user` - User dashboard (default)
- `/projects/:projectId/tree` - Project tree (scoped to project)
- `/projects/:projectId/...` - All feature routes scoped to project
- Default redirect: `/` → `/dashboard/user`

#### Auth Callback (`omni-frontend/src/app/features/auth/auth-callback.component.ts`)
- Updated to initialize roles from JWT token
- Automatically routes to appropriate dashboard based on role priority
- Triggers workspace sync in background

#### App Header (`omni-frontend/src/app/app.component.ts`)
- Displays current workspace and project as chips
- Shows role switcher dropdown for multi-role users
- Dashboard navigation link added to sidebar

## User Experience

### Login Flow
1. User authenticates with RAMPS
2. RAMPS redirects to `/auth/callback` with JWT token
3. JWT token contains user info and roles
4. App initializes role routing with user's roles
5. App triggers workspace sync from RAMPS
6. User is redirected to appropriate dashboard based on highest priority role

### Role Priority
If a user has multiple roles, they are directed to the dashboard in this order:
1. **Account Manager** (`sc-acct-mgr`) - Highest priority
2. **Manager** (`sc-mgr`) - Medium priority
3. **User** (`user`) - Default priority

Users can switch between their available roles using the role switcher in the header.

### Workspace/Project Selection
1. User lands on their role-appropriate dashboard
2. Dashboard displays all workspaces the user has access to
3. User expands a workspace to see its projects
4. User selects a project (becomes "current project")
5. Current workspace and project are displayed in the header
6. Selection is persisted to localStorage
7. User navigates to project features (tree, timeline, etc.)

### Data Synchronization
- **Initial sync**: Triggered automatically after login
- **Manual sync**: User can click "Sync from RAMPS" button on dashboard
- **Cache duration**: 5 minutes (configurable in `WorkspaceSyncService`)
- **Force sync**: Pass `force: true` to bypass cache check

## Configuration

### Environment Variables

#### Omni Backend
```bash
RAMPS_API_URL=http://localhost:8001/api  # RAMPS API base URL
```

#### RAMPS Backend
No additional configuration needed. The workspace endpoints use existing tenant and resource group models.

### Database Migration

Run the updated SQL initialization:
```bash
cd OWEC/omni-db
# Drop and recreate database (development only)
docker-compose down -v
docker-compose up -d
```

Or apply migration manually:
```sql
-- Add workspace cache tables
CREATE TABLE workspace_cache (...);
CREATE TABLE project_cache (...);
CREATE TABLE user_workspace_access (...);
```

## API Examples

### Sync Workspaces
```bash
POST /api/v1/workspaces/sync
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "force": false
}
```

Response:
```json
{
  "workspaces_synced": 2,
  "projects_synced": 5,
  "message": "Successfully synced 2 workspaces and 5 projects"
}
```

### Get User Workspaces
```bash
GET /api/v1/workspaces
Authorization: Bearer <jwt_token>
```

Response:
```json
[
  {
    "id": "uuid",
    "name": "My Workspace",
    "description": "Workspace description",
    "workspace_type": "customer",
    "status": "active",
    "created_at": "2026-03-08T10:00:00Z",
    "updated_at": "2026-03-08T10:00:00Z",
    "synced_at": "2026-03-08T12:00:00Z",
    "projects": [
      {
        "id": "uuid",
        "workspace_id": "uuid",
        "name": "My Project",
        "description": "Project description",
        "project_type": "narrative",
        "status": "active",
        "created_at": "2026-03-08T10:00:00Z",
        "updated_at": "2026-03-08T10:00:00Z",
        "synced_at": "2026-03-08T12:00:00Z"
      }
    ]
  }
]
```

## Testing

### Backend Testing
```bash
cd OWEC/omni-backend

# Test workspace sync endpoint
curl -X POST http://localhost:8000/api/v1/workspaces/sync \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"force": true}'

# Test get workspaces endpoint
curl -X GET http://localhost:8000/api/v1/workspaces \
  -H "Authorization: Bearer <token>"
```

### RAMPS Testing
```bash
cd RAMPS/apps/ramps-backend

# Test get user workspaces
curl -X GET http://localhost:8001/api/users/{user_id}/workspaces \
  -H "Authorization: Bearer <token>"

# Test get workspace projects
curl -X GET http://localhost:8001/api/workspaces/{workspace_id}/projects \
  -H "Authorization: Bearer <token>"
```

### Frontend Testing
1. Start the frontend: `cd OWEC/omni-frontend && npm start`
2. Navigate to `http://localhost:4252`
3. Login with RAMPS credentials
4. Verify:
   - Redirected to appropriate dashboard based on role
   - Workspaces and projects are displayed
   - Can select a project
   - Current workspace/project shown in header
   - Can switch roles (if user has multiple roles)
   - Can navigate to project features

## Key Design Decisions

1. **Cache Pattern**: Workspace and project metadata are cached locally in Omni for performance. The cache is refreshed on login and can be manually synced.

2. **Separation of Concerns**: 
   - RAMPS manages workspace/project metadata and access control
   - Omni manages detailed project content (nodes, entities, events, etc.)
   - Project ID is the link between the two systems

3. **Role Priority**: Clear hierarchy (acct-mgr > mgr > user) ensures consistent default routing while allowing role switching.

4. **Signal-Based State**: Using Angular signals for reactive state management provides better performance and simpler change detection.

5. **localStorage Persistence**: Current workspace, project, and role are persisted to localStorage for better UX across page refreshes.

## Future Enhancements

1. **Real-time Sync**: WebSocket connection to RAMPS for real-time workspace/project updates
2. **Offline Support**: Cache workspaces/projects for offline access
3. **Role-Based Permissions**: Granular permissions within dashboards based on role
4. **Workspace Creation**: Direct workspace creation from Omni (currently requires RAMPS)
5. **Project Analytics**: Dashboard widgets showing project statistics and activity
6. **Team Collaboration**: Real-time collaboration indicators on dashboards
7. **Search and Filtering**: Advanced search across workspaces and projects
8. **Favorites/Bookmarks**: Quick access to frequently used projects

## Troubleshooting

### Workspaces Not Loading
- Check RAMPS API URL configuration
- Verify JWT token is valid and contains user_id
- Check RAMPS backend logs for errors
- Ensure user has workspace access in RAMPS

### Role Routing Not Working
- Verify JWT token contains roles array
- Check role format (should be 'sc-acct-mgr', 'sc-mgr', or 'user')
- Clear localStorage and re-login
- Check browser console for errors

### Sync Failing
- Verify RAMPS endpoints are accessible
- Check network tab for API errors
- Ensure database tables exist (workspace_cache, project_cache, user_workspace_access)
- Check Omni backend logs

### Project Not Opening
- Verify project exists in local Omni database
- Check that workspace/project cache contains the project
- Ensure project routes are configured correctly
- Check for routing errors in browser console
