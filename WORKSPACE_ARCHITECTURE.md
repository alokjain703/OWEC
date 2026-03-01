# OMNI Multi-Tenant Workspace Architecture

## Overview

OMNI now supports multi-tenant workspaces with comprehensive role-based access control (RBAC), subscription limits, and storage abstraction. This architecture enables:

- **Workspace-based Ownership**: All projects belong to a workspace, not individual users
- **Flexible Collaboration**: Multiple users can be members of a workspace with different roles
- **Subscription Management**: Workspaces have configurable project limits and storage quotas
- **Storage Abstraction**: Projects can use local or S3 storage backends
- **Backward Compatibility**: Existing projects are migrated to a default "Legacy Projects" workspace

## Architecture

### Backend Components

#### 1. Database Models

**Workspace** (`app/models/workspace.py`)
- `type`: personal | organization | enterprise
- `name`: Workspace display name
- `owner_user_id`: Primary owner
- `subscription_tier`: free | pro | enterprise
- `storage_quota_mb`: Total storage limit
- `project_limit`: Maximum active projects
- `settings`: JSONB for extensibility

**WorkspaceMember** (`app/models/workspace.py`)
- Composite PK: (`workspace_id`, `user_id`)
- `role`: owner | admin | editor | viewer
- Relationships: `workspace`, `user_id`

**Project** (`app/models/project.py`)
- `workspace_id`: FK to workspaces (required)
- `created_by`: User who created project
- `status`: active | archived | deleted
- `visibility`: private | workspace | public
- `storage_mode`: local | s3
- `settings`: JSONB for storage config

#### 2. RBAC Permission Matrix

| Role   | View | Edit | Create Project | Delete Project | Manage Members |
|--------|------|------|----------------|----------------|----------------|
| Owner  | ✅   | ✅   | ✅             | ✅             | ✅             |
| Admin  | ✅   | ✅   | ✅             | ❌             | ❌             |
| Editor | ✅   | ✅   | ❌             | ❌             | ❌             |
| Viewer | ✅   | ❌   | ❌             | ❌             | ❌             |

#### 3. API Endpoints

**Workspaces**
```
GET    /api/v1/workspaces                          # List user's workspaces
POST   /api/v1/workspaces                          # Create workspace
GET    /api/v1/workspaces/{workspace_id}           # Get workspace details
PATCH  /api/v1/workspaces/{workspace_id}           # Update workspace (requires admin)
DELETE /api/v1/workspaces/{workspace_id}           # Delete workspace (requires owner)
POST   /api/v1/workspaces/{workspace_id}/members   # Add member (requires owner)
DELETE /api/v1/workspaces/{workspace_id}/members/{user_id}  # Remove member (requires owner)
```

**Projects** (workspace-scoped)
```
GET    /api/v1/workspaces/{workspace_id}/projects                # List projects
POST   /api/v1/workspaces/{workspace_id}/projects                # Create project (requires admin)
GET    /api/v1/workspaces/{workspace_id}/projects/{project_id}   # Get project
PATCH  /api/v1/workspaces/{workspace_id}/projects/{project_id}   # Update project (requires editor)
DELETE /api/v1/workspaces/{workspace_id}/projects/{project_id}   # Delete project (requires owner)
```

#### 4. Business Logic

**Project Limit Enforcement** (`app/modules/projects/service.py`)
- Counts active projects in workspace
- Rejects creation if `active_count >= workspace.project_limit`
- Archived/deleted projects don't count toward limit

**Storage Routing** (`app/storage/router.py`)
- `local`: Routes to `LocalStorage(./storage_data/{workspace_id}/{project_id})`
- `s3`: Routes to `S3Storage(bucket, region)` from `project.settings`

**Membership Validation** (`app/api/dependencies.py`)
- `get_workspace_member()`: Validates user is member of workspace
- Returns `WorkspaceMemberContext` with role and permission helpers
- Raises 403 if not a member

#### 5. Migration

**`001_workspace_tenancy.py`**
- Handles two scenarios:
  1. **Fresh install**: Creates all tables with workspace columns
  2. **Legacy migration**: 
     - Creates default workspace `00000000-0000-0000-0000-000000000001`
     - Backfills `workspace_id` for existing projects
     - Adds `created_by`, `status`, `visibility`, `storage_mode`, `settings`
- Full downgrade support

### Frontend Components

#### 1. Models

**Workspace** (`workspace.model.ts`)
```typescript
interface Workspace {
  id: string;
  type: 'personal' | 'organization' | 'enterprise';
  name: string;
  owner_user_id: string;
  subscription_tier: 'free' | 'pro' | 'enterprise';
  storage_quota_mb: number;
  project_limit: number;
  settings?: Record<string, any>;
  members?: WorkspaceMember[];
}
```

**Project** (`project.model.ts`)
```typescript
interface Project {
  id: string;
  workspace_id: string;
  created_by: string;
  title: string;
  status: 'active' | 'archived' | 'deleted';
  visibility: 'private' | 'workspace' | 'public';
  storage_mode: 'local' | 's3';
}
```

#### 2. Services

**WorkspaceService** (`workspace.service.ts`)
- Signal-based state management
- `workspaces$`: List of user's workspaces
- `activeWorkspace$`: Currently selected workspace
- `currentRole$`: User's role in active workspace
- Permission helpers: `canCreateProject()`, `canEdit()`, `canDelete()`, `canManageMembers()`

**OmniApiService** (`omni-api.service.ts`)
- Workspace CRUD methods
- Project CRUD methods (workspace-scoped)
- Auto-includes `X-User-Id` header from localStorage

#### 3. Components

**WorkspaceSelectorComponent** (`workspace-selector.component.ts`)
- Dropdown in toolbar showing active workspace
- List of user's workspaces
- "New Workspace" button
- Updates navigation links when workspace changes

**WorkspaceDialogComponent** (`workspace-dialog.component.ts`)
- Create/edit workspace form
- Fields: name, type, subscription tier, storage quota, project limit
- Validates user ID from localStorage

#### 4. Routing

**Workspace-scoped routes** (`app.routes.ts`)
```typescript
/workspace/:workspaceId/tree
/workspace/:workspaceId/characters
/workspace/:workspaceId/timeline
/workspace/:workspaceId/graph
/workspace/:workspaceId/schemas
```

Legacy routes (no workspace prefix) maintained for backward compatibility.

## Usage

### Backend Setup

1. **Run migration**:
```bash
cd omni-backend
docker exec omni-backend alembic upgrade head
```

2. **Test with curl**:
```bash
# Set user ID
USER_ID=$(uuidgen)

# Create workspace
curl -X POST http://localhost:8052/api/v1/workspaces \
  -H "X-User-Id: $USER_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Workspace",
    "type": "personal",
    "owner_user_id": "'$USER_ID'",
    "subscription_tier": "free",
    "storage_quota_mb": 1024,
    "project_limit": 5
  }'

# List workspaces
curl http://localhost:8052/api/v1/workspaces \
  -H "X-User-Id: $USER_ID"

# Create project
WORKSPACE_ID="<workspace-id-from-above>"
curl -X POST http://localhost:8052/api/v1/workspaces/$WORKSPACE_ID/projects \
  -H "X-User-Id: $USER_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "workspace_id": "'$WORKSPACE_ID'",
    "created_by": "'$USER_ID'",
    "title": "My First Project",
    "status": "active",
    "visibility": "workspace",
    "storage_mode": "local"
  }'
```

### Frontend Setup

1. **Set user ID in browser console**:
```javascript
localStorage.setItem('omni_user_id', crypto.randomUUID());
```

2. **Navigate to OMNI**:
- Open http://localhost:4252
- Workspace selector appears in toolbar
- Click to create a new workspace
- All navigation links include workspace context

3. **Permission-based UI**:
- Create/edit/delete buttons automatically hidden based on role
- Role shown in workspace selector tooltip

## Testing

### Backend Tests

Run comprehensive test suite:
```bash
cd omni-backend
python -m pytest tests/test_workspace_tenancy.py -v --cov=app
```

Tests cover:
- ✅ Workspace CRUD with membership filtering
- ✅ RBAC enforcement (admin/owner/editor/viewer)
- ✅ Project limit enforcement
- ✅ Workspace boundary isolation
- ✅ Member management (add/remove, prevent last owner removal)
- ✅ Unauthorized access rejection

### Frontend Tests

```bash
cd omni-frontend
pnpm run test
pnpm run lint
pnpm run build --configuration production
```

## Migration Notes

### For Existing Projects

1. **Automatic migration**: Run `alembic upgrade head`
2. All existing projects → Default workspace `00000000-0000-0000-0000-000000000001`
3. No data loss, projects remain accessible
4. Workspace owner set to first user in system

### For New Installations

1. Migration creates fresh schema with workspace tables
2. No default workspace created
3. Users create personal workspaces on first login

## Security Considerations

### Current Auth (Placeholder)

- Uses `X-User-Id` header for JWT simulation
- **NOT production-ready**
- Replace with real JWT validation before deployment

### Recommended JWT Implementation

```python
# app/api/dependencies.py
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt

security = HTTPBearer()

def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> str:
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=["HS256"])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
```

### Workspace Isolation

- All queries scoped to `workspace_id`
- Cross-workspace access blocked at service layer
- Project access requires workspace membership
- Storage paths include workspace ID to prevent leakage

## Future Enhancements

### Short-term (v0.2.0)
- [ ] Workspace settings page (manage members, quota, tier)
- [ ] Project transfer between workspaces (owner only)
- [ ] Workspace usage metrics (storage, project count)
- [ ] Audit log for member actions

### Medium-term (v0.3.0)
- [ ] Team workspaces with billing integration
- [ ] Role customization (custom permission sets)
- [ ] Workspace templates (quick setup presets)
- [ ] Workspace-level schemas (shared across projects)

### Long-term (v1.0.0)
- [ ] Enterprise SSO integration
- [ ] Workspace federation (cross-org collaboration)
- [ ] Advanced analytics (usage patterns, collaboration metrics)
- [ ] Workspace marketplace (templates, plugins)

## Troubleshooting

### "Cannot create project: limit reached"
- Check workspace project limit: `GET /api/v1/workspaces/{id}`
- Count active projects in workspace
- Archive old projects or upgrade subscription tier

### "Access denied (403)"
- Verify user is member of workspace
- Check user role has required permissions
- Confirm `X-User-Id` header is set correctly

### "Workspace not found"
- User not a member of workspace
- Workspace was deleted
- Check workspace ID in URL

### Storage errors
- Verify `storage_mode` is set correctly (local/s3)
- For S3: Check `project.settings` has `bucket` and `region`
- For local: Verify directory permissions on `./storage_data/`

## Support

For issues or questions:
1. Check this README
2. Review test suite for examples
3. Check backend logs: `docker logs omni-backend`
4. Check frontend console for errors
5. Open issue on GitHub (if applicable)
