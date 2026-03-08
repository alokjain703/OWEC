"""Workspace router for syncing and retrieving workspace/project data"""
import logging
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.modules.workspace_service import WorkspaceSyncService
from app.schemas.workspace import (
    WorkspaceWithProjects,
    ProjectCacheOut,
    SyncWorkspacesRequest,
    SyncWorkspacesResponse
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/workspaces", tags=["workspaces"])


def get_user_id_from_token(authorization: str = Header(...)) -> UUID:
    """
    Extract user_id from JWT token.
    In production, this should properly decode and validate the JWT.
    For now, assuming the token contains user_id in payload.
    """
    # TODO: Implement proper JWT decoding
    # This is a placeholder - you should decode the JWT and extract user_id
    # from the token payload
    try:
        # Placeholder: extract from token
        # In reality: decode JWT, validate, extract user_id
        import jwt
        
        logger.info(f"[Backend] Received Authorization header: {authorization[:50]}...")
        
        token = authorization.replace("Bearer ", "")
        logger.info(f"[Backend] Token after removing Bearer: {token[:50]}...")
        
        # Decode without verification for now (should verify in production)
        payload = jwt.decode(token, options={"verify_signature": False})
        logger.info(f"[Backend] Decoded JWT payload: {payload}")
        
        # Try to get user_id from various possible fields
        user_id_str = payload.get("sub") or payload.get("user_id") or payload.get("id")
        logger.info(f"[Backend] Extracted user_id string: {user_id_str}")
        
        if not user_id_str:
            logger.error(f"[Backend] No user_id found in token payload: {payload}")
            raise HTTPException(status_code=401, detail="No user_id in token")
        
        user_id = UUID(user_id_str)
        logger.info(f"[Backend] Successfully extracted user_id: {user_id}")
        return user_id
    except Exception as e:
        logger.error(f"[Backend] Error extracting user_id from token: {e}", exc_info=True)
        raise HTTPException(status_code=401, detail=f"Invalid authentication token: {str(e)}")


@router.post("/sync", response_model=SyncWorkspacesResponse)
async def sync_workspaces(
    request: SyncWorkspacesRequest,
    db: AsyncSession = Depends(get_db),
    authorization: str = Header(...),
    user_id: UUID = Depends(get_user_id_from_token)
):
    """
    Sync workspaces and projects from RAMPS for the authenticated user.
    This fetches the latest workspace/project metadata and caches it locally.
    """
    try:
        service = WorkspaceSyncService(db)
        workspaces_synced, projects_synced = await service.sync_user_workspaces(
            user_id=user_id,
            access_token=authorization.replace("Bearer ", ""),
            force=request.force
        )
        
        return SyncWorkspacesResponse(
            workspaces_synced=workspaces_synced,
            projects_synced=projects_synced,
            message=f"Successfully synced {workspaces_synced} workspaces and {projects_synced} projects"
        )
    except Exception as e:
        logger.error(f"Error syncing workspaces: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to sync workspaces: {str(e)}")


@router.get("/", response_model=list[WorkspaceWithProjects])
async def get_user_workspaces(
    db: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_user_id_from_token)
):
    """
    Get all workspaces for the authenticated user with their projects.
    Returns cached data - call /sync first to refresh from RAMPS.
    """
    try:
        service = WorkspaceSyncService(db)
        workspaces = await service.get_user_workspaces(user_id)
        logger.info(f"[GET /workspaces] Found {len(workspaces)} workspaces for user {user_id}")
        
        # Fetch projects for each workspace
        result = []
        for workspace in workspaces:
            projects = await service.get_workspace_projects(workspace.id)
            logger.info(f"[GET /workspaces] Workspace '{workspace.name}' (ID: {workspace.id}) has {len(projects)} projects")
            
            workspace_dict = {
                "id": workspace.id,
                "name": workspace.name,
                "description": workspace.description,
                "workspace_type": workspace.workspace_type,
                "status": workspace.status,
                "created_at": workspace.created_at,
                "updated_at": workspace.updated_at,
                "synced_at": workspace.synced_at,
                "projects": [
                    ProjectCacheOut.model_validate(p) for p in projects
                ]
            }
            logger.info(f"[GET /workspaces] Constructed workspace_dict with {len(workspace_dict['projects'])} projects")
            result.append(WorkspaceWithProjects(**workspace_dict))
        
        logger.info(f"[GET /workspaces] Returning {len(result)} workspaces with projects")
        return result
    except Exception as e:
        logger.error(f"Error fetching workspaces: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch workspaces: {str(e)}")


@router.get("/{workspace_id}/projects", response_model=list[ProjectCacheOut])
async def get_workspace_projects(
    workspace_id: UUID,
    db: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_user_id_from_token)
):
    """
    Get all projects for a specific workspace.
    Returns cached data - call /sync first to refresh from RAMPS.
    """
    try:
        service = WorkspaceSyncService(db)
        projects = await service.get_workspace_projects(workspace_id)
        return [ProjectCacheOut.model_validate(p) for p in projects]
    except Exception as e:
        logger.error(f"Error fetching projects for workspace {workspace_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch projects: {str(e)}")
