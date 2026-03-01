"""
Test suite for multi-tenant workspace architecture.
"""
import pytest
from uuid import uuid4
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.workspace import Workspace, WorkspaceMember
from app.models.project import Project

# ── Fixtures ─────────────────────────────────────────────────────────────────

@pytest.fixture
def mock_user_id() -> str:
    """Return a mock user ID for testing."""
    return str(uuid4())


@pytest.fixture
def mock_headers(mock_user_id: str) -> dict[str, str]:
    """Return auth headers with mock user ID."""
    return {"X-User-Id": mock_user_id}


# ── Workspace CRUD Tests ─────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_create_workspace(client: AsyncClient, mock_user_id: str, mock_headers: dict):
    """Test creating a new workspace."""
    payload = {
        "name": "Test Workspace",
        "type": "personal",
        "owner_user_id": mock_user_id,
        "subscription_tier": "free",
        "storage_quota_mb": 1024,
        "project_limit": 5,
    }
    
    response = await client.post("/api/v1/workspaces", json=payload, headers=mock_headers)
    
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Test Workspace"
    assert data["type"] == "personal"
    assert data["owner_user_id"] == mock_user_id
    assert data["project_limit"] == 5
    assert len(data["members"]) == 1
    assert data["members"][0]["role"] == "owner"


@pytest.mark.asyncio
async def test_list_workspaces_filtered_by_membership(
    client: AsyncClient, 
    db: AsyncSession,
    mock_user_id: str,
    mock_headers: dict
):
    """Test that users only see workspaces they're members of."""
    # Create workspace 1 with user as member
    ws1 = Workspace(
        name="User's Workspace",
        type="personal",
        owner_user_id=mock_user_id,
    )
    db.add(ws1)
    await db.flush()
    
    member1 = WorkspaceMember(workspace_id=ws1.id, user_id=mock_user_id, role="owner")
    db.add(member1)
    
    # Create workspace 2 with different owner
    other_user = str(uuid4())
    ws2 = Workspace(
        name="Other's Workspace",
        type="personal",
        owner_user_id=other_user,
    )
    db.add(ws2)
    await db.flush()
    
    member2 = WorkspaceMember(workspace_id=ws2.id, user_id=other_user, role="owner")
    db.add(member2)
    
    await db.commit()
    
    # User should only see their workspace
    response = await client.get("/api/v1/workspaces", headers=mock_headers)
    
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["name"] == "User's Workspace"


@pytest.mark.asyncio
async def test_update_workspace_requires_admin(
    client: AsyncClient,
    db: AsyncSession,
    mock_user_id: str,
    mock_headers: dict
):
    """Test that only admin/owner can update workspace."""
    # Create workspace with user as viewer
    owner_id = str(uuid4())
    ws = Workspace(name="Test Workspace", type="personal", owner_user_id=owner_id)
    db.add(ws)
    await db.flush()
    
    member = WorkspaceMember(workspace_id=ws.id, user_id=mock_user_id, role="viewer")
    db.add(member)
    await db.commit()
    
    # Viewer tries to update workspace
    response = await client.patch(
        f"/api/v1/workspaces/{ws.id}",
        json={"name": "Updated Name"},
        headers=mock_headers
    )
    
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_delete_workspace_requires_owner(
    client: AsyncClient,
    db: AsyncSession,
    mock_user_id: str,
    mock_headers: dict
):
    """Test that only owner can delete workspace."""
    # Create workspace with user as admin
    owner_id = str(uuid4())
    ws = Workspace(name="Test Workspace", type="personal", owner_user_id=owner_id)
    db.add(ws)
    await db.flush()
    
    member = WorkspaceMember(workspace_id=ws.id, user_id=mock_user_id, role="admin")
    db.add(member)
    await db.commit()
    
    # Admin tries to delete workspace
    response = await client.delete(f"/api/v1/workspaces/{ws.id}", headers=mock_headers)
    
    assert response.status_code == 403


# ── Workspace Membership Tests ───────────────────────────────────────────────

@pytest.mark.asyncio
async def test_add_member_requires_owner(
    client: AsyncClient,
    db: AsyncSession,
    mock_user_id: str,
    mock_headers: dict
):
    """Test that only owner can add members."""
    # Create workspace with user as admin
    owner_id = str(uuid4())
    ws = Workspace(name="Test Workspace", type="personal", owner_user_id=owner_id)
    db.add(ws)
    await db.flush()
    
    member = WorkspaceMember(workspace_id=ws.id, user_id=mock_user_id, role="admin")
    db.add(member)
    await db.commit()
    
    # Admin tries to add member
    new_user = str(uuid4())
    response = await client.post(
        f"/api/v1/workspaces/{ws.id}/members",
        json={"user_id": new_user, "role": "editor"},
        headers=mock_headers
    )
    
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_cannot_remove_last_owner(
    client: AsyncClient,
    db: AsyncSession,
    mock_user_id: str,
    mock_headers: dict
):
    """Test that the last owner cannot be removed."""
    # Create workspace with user as sole owner
    ws = Workspace(name="Test Workspace", type="personal", owner_user_id=mock_user_id)
    db.add(ws)
    await db.flush()
    
    member = WorkspaceMember(workspace_id=ws.id, user_id=mock_user_id, role="owner")
    db.add(member)
    await db.commit()
    
    # Try to remove the only owner
    response = await client.delete(
        f"/api/v1/workspaces/{ws.id}/members/{mock_user_id}",
        headers=mock_headers
    )
    
    assert response.status_code == 400
    assert "last owner" in response.json()["detail"].lower()


# ── Project Limit Tests ──────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_create_project_enforces_limit(
    client: AsyncClient,
    db: AsyncSession,
    mock_user_id: str,
    mock_headers: dict
):
    """Test that project creation enforces workspace limit."""
    # Create workspace with limit of 2 projects
    ws = Workspace(
        name="Test Workspace",
        type="personal",
        owner_user_id=mock_user_id,
        project_limit=2
    )
    db.add(ws)
    await db.flush()
    
    member = WorkspaceMember(workspace_id=ws.id, user_id=mock_user_id, role="owner")
    db.add(member)
    
    # Create 2 active projects (at limit)
    for i in range(2):
        proj = Project(
            workspace_id=ws.id,
            created_by=mock_user_id,
            title=f"Project {i+1}",
            status="active"
        )
        db.add(proj)
    
    await db.commit()
    
    # Try to create 3rd project
    payload = {
        "workspace_id": str(ws.id),
        "created_by": mock_user_id,
        "title": "Project 3",
        "status": "active"
    }
    
    response = await client.post(
        f"/api/v1/workspaces/{ws.id}/projects",
        json=payload,
        headers=mock_headers
    )
    
    assert response.status_code == 400
    assert "limit" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_archived_projects_dont_count_toward_limit(
    client: AsyncClient,
    db: AsyncSession,
    mock_user_id: str,
    mock_headers: dict
):
    """Test that archived projects don't count toward limit."""
    # Create workspace with limit of 2 projects
    ws = Workspace(
        name="Test Workspace",
        type="personal",
        owner_user_id=mock_user_id,
        project_limit=2
    )
    db.add(ws)
    await db.flush()
    
    member = WorkspaceMember(workspace_id=ws.id, user_id=mock_user_id, role="owner")
    db.add(member)
    
    # Create 1 active project and 1 archived
    proj1 = Project(
        workspace_id=ws.id,
        created_by=mock_user_id,
        title="Active Project",
        status="active"
    )
    proj2 = Project(
        workspace_id=ws.id,
        created_by=mock_user_id,
        title="Archived Project",
        status="archived"
    )
    db.add_all([proj1, proj2])
    await db.commit()
    
    # Should be able to create another active project
    payload = {
        "workspace_id": str(ws.id),
        "created_by": mock_user_id,
        "title": "New Project",
        "status": "active"
    }
    
    response = await client.post(
        f"/api/v1/workspaces/{ws.id}/projects",
        json=payload,
        headers=mock_headers
    )
    
    assert response.status_code == 201


# ── Project Boundary Tests ───────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_get_project_enforces_workspace_boundary(
    client: AsyncClient,
    db: AsyncSession,
    mock_user_id: str,
    mock_headers: dict
):
    """Test that users can't access projects in other workspaces."""
    # Create workspace 1 with user as member
    ws1 = Workspace(name="User's Workspace", type="personal", owner_user_id=mock_user_id)
    db.add(ws1)
    await db.flush()
    
    member1 = WorkspaceMember(workspace_id=ws1.id, user_id=mock_user_id, role="owner")
    db.add(member1)
    
    # Create workspace 2 with different user
    other_user = str(uuid4())
    ws2 = Workspace(name="Other's Workspace", type="personal", owner_user_id=other_user)
    db.add(ws2)
    await db.flush()
    
    member2 = WorkspaceMember(workspace_id=ws2.id, user_id=other_user, role="owner")
    db.add(member2)
    
    # Create project in workspace 2
    proj = Project(
        workspace_id=ws2.id,
        created_by=other_user,
        title="Other's Project",
        status="active"
    )
    db.add(proj)
    await db.commit()
    
    # User tries to access project through workspace 1 endpoint
    response = await client.get(
        f"/api/v1/workspaces/{ws1.id}/projects/{proj.id}",
        headers=mock_headers
    )
    
    assert response.status_code == 404


# ── RBAC Permission Tests ────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_create_project_requires_admin_or_owner(
    client: AsyncClient,
    db: AsyncSession,
    mock_user_id: str,
    mock_headers: dict
):
    """Test that only admin/owner can create projects."""
    # Create workspace with user as editor
    owner_id = str(uuid4())
    ws = Workspace(name="Test Workspace", type="personal", owner_user_id=owner_id)
    db.add(ws)
    await db.flush()
    
    member = WorkspaceMember(workspace_id=ws.id, user_id=mock_user_id, role="editor")
    db.add(member)
    await db.commit()
    
    # Editor tries to create project
    payload = {
        "workspace_id": str(ws.id),
        "created_by": mock_user_id,
        "title": "New Project",
        "status": "active"
    }
    
    response = await client.post(
        f"/api/v1/workspaces/{ws.id}/projects",
        json=payload,
        headers=mock_headers
    )
    
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_update_project_requires_editor_role(
    client: AsyncClient,
    db: AsyncSession,
    mock_user_id: str,
    mock_headers: dict
):
    """Test that only editor/admin/owner can update projects."""
    # Create workspace with user as viewer
    owner_id = str(uuid4())
    ws = Workspace(name="Test Workspace", type="personal", owner_user_id=owner_id)
    db.add(ws)
    await db.flush()
    
    member = WorkspaceMember(workspace_id=ws.id, user_id=mock_user_id, role="viewer")
    db.add(member)
    
    # Create project
    proj = Project(
        workspace_id=ws.id,
        created_by=owner_id,
        title="Test Project",
        status="active"
    )
    db.add(proj)
    await db.commit()
    
    # Viewer tries to update project
    response = await client.patch(
        f"/api/v1/workspaces/{ws.id}/projects/{proj.id}",
        json={"title": "Updated Title"},
        headers=mock_headers
    )
    
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_delete_project_requires_owner(
    client: AsyncClient,
    db: AsyncSession,
    mock_user_id: str,
    mock_headers: dict
):
    """Test that only owner can delete projects."""
    # Create workspace with user as editor
    owner_id = str(uuid4())
    ws = Workspace(name="Test Workspace", type="personal", owner_user_id=owner_id)
    db.add(ws)
    await db.flush()
    
    member = WorkspaceMember(workspace_id=ws.id, user_id=mock_user_id, role="editor")
    db.add(member)
    
    # Create project
    proj = Project(
        workspace_id=ws.id,
        created_by=owner_id,
        title="Test Project",
        status="active"
    )
    db.add(proj)
    await db.commit()
    
    # Editor tries to delete project
    response = await client.delete(
        f"/api/v1/workspaces/{ws.id}/projects/{proj.id}",
        headers=mock_headers
    )
    
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_unauthorized_access_rejected(client: AsyncClient, db: AsyncSession):
    """Test that requests without user ID are rejected."""
    # Create a workspace
    owner_id = str(uuid4())
    ws = Workspace(name="Test Workspace", type="personal", owner_user_id=owner_id)
    db.add(ws)
    await db.commit()
    
    # Try to list workspaces without auth header
    response = await client.get("/api/v1/workspaces")
    
    assert response.status_code == 401
