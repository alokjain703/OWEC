#!/bin/bash

# OMNI Workspace Tenancy - Deployment Script
# This script copies the new workspace tenancy files to Docker containers and runs migration

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║         OMNI Workspace Tenancy - Deployment                    ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Check if containers are running
if ! docker ps | grep -q omni-backend; then
    echo "❌ omni-backend container is not running"
    echo "   Run: docker compose up -d"
    exit 1
fi

if ! docker ps | grep -q omni-frontend; then
    echo "❌ omni-frontend container is not running"
    echo "   Run: docker compose up -d"
    exit 1
fi

echo "✅ Containers are running"
echo ""

# ══════════════════════════════════════════════════════════════════════════════
# Backend Deployment
# ══════════════════════════════════════════════════════════════════════════════

echo "📦 Deploying backend files..."

# Copy RBAC dependency
echo "   → app/api/dependencies.py"
docker cp "$PROJECT_ROOT/omni-backend/app/api/dependencies.py" omni-backend:/app/app/api/

# Copy workspace module
echo "   → app/modules/workspaces/"
docker cp "$PROJECT_ROOT/omni-backend/app/modules/workspaces" omni-backend:/app/app/modules/

# Copy projects module
echo "   → app/modules/projects/"
docker cp "$PROJECT_ROOT/omni-backend/app/modules/projects" omni-backend:/app/app/modules/

# Copy storage router
echo "   → app/storage/router.py"
docker cp "$PROJECT_ROOT/omni-backend/app/storage/router.py" omni-backend:/app/app/storage/

# Copy API router
echo "   → app/api/v1/router.py"
docker cp "$PROJECT_ROOT/omni-backend/app/api/v1/router.py" omni-backend:/app/app/api/v1/

# Copy migration
echo "   → alembic/versions/001_workspace_tenancy.py"
docker cp "$PROJECT_ROOT/omni-backend/alembic/versions/001_workspace_tenancy.py" omni-backend:/app/alembic/versions/

# Copy tests
echo "   → tests/"
docker cp "$PROJECT_ROOT/omni-backend/tests" omni-backend:/app/

echo "✅ Backend files copied"
echo ""

# Run migration
echo "🔄 Running database migration..."
if docker exec omni-backend alembic upgrade head; then
    echo "✅ Migration completed successfully"
else
    echo "❌ Migration failed"
    echo "   Check logs: docker logs omni-backend"
    exit 1
fi
echo ""

# Restart backend
echo "🔄 Restarting backend service..."
docker compose restart backend
sleep 3
echo "✅ Backend restarted"
echo ""

# ══════════════════════════════════════════════════════════════════════════════
# Frontend Deployment
# ══════════════════════════════════════════════════════════════════════════════

echo "📦 Deploying frontend files..."

# Copy models
echo "   → core/models/workspace.model.ts"
docker cp "$PROJECT_ROOT/omni-frontend/src/app/core/models/workspace.model.ts" \
    omni-frontend:/app/src/app/core/models/

echo "   → core/models/project.model.ts"
docker cp "$PROJECT_ROOT/omni-frontend/src/app/core/models/project.model.ts" \
    omni-frontend:/app/src/app/core/models/

# Copy services
echo "   → core/services/workspace.service.ts"
docker cp "$PROJECT_ROOT/omni-frontend/src/app/core/services/workspace.service.ts" \
    omni-frontend:/app/src/app/core/services/

echo "   → core/services/omni-api.service.ts"
docker cp "$PROJECT_ROOT/omni-frontend/src/app/core/services/omni-api.service.ts" \
    omni-frontend:/app/src/app/core/services/

# Copy components
echo "   → workspace-selector.component.ts"
docker cp "$PROJECT_ROOT/omni-frontend/src/app/workspace-selector.component.ts" \
    omni-frontend:/app/src/app/

echo "   → workspace-dialog.component.ts"
docker cp "$PROJECT_ROOT/omni-frontend/src/app/workspace-dialog.component.ts" \
    omni-frontend:/app/src/app/

# Copy routing
echo "   → app.routes.ts"
docker cp "$PROJECT_ROOT/omni-frontend/src/app/app.routes.ts" \
    omni-frontend:/app/src/app/

echo "   → app.component.ts"
docker cp "$PROJECT_ROOT/omni-frontend/src/app/app.component.ts" \
    omni-frontend:/app/src/app/

echo "✅ Frontend files copied"
echo ""

# Restart frontend (Angular auto-reloads on file change)
echo "🔄 Restarting frontend service..."
docker compose restart frontend
sleep 5
echo "✅ Frontend restarted"
echo ""

# ══════════════════════════════════════════════════════════════════════════════
# Verification
# ══════════════════════════════════════════════════════════════════════════════

echo "🔍 Verifying deployment..."
echo ""

# Check backend health
if curl -s http://localhost:8052/health > /dev/null 2>&1; then
    echo "✅ Backend is responding (http://localhost:8052)"
else
    echo "⚠️  Backend health check failed"
fi

# Check frontend
if curl -s http://localhost:4252 > /dev/null 2>&1; then
    echo "✅ Frontend is responding (http://localhost:4252)"
else
    echo "⚠️  Frontend health check failed"
fi

echo ""

# ══════════════════════════════════════════════════════════════════════════════
# Summary
# ══════════════════════════════════════════════════════════════════════════════

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                    Deployment Summary                          ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "📍 Backend:  http://localhost:8052/api/v1"
echo "📍 Frontend: http://localhost:4252"
echo ""
echo "📚 Documentation: $PROJECT_ROOT/WORKSPACE_ARCHITECTURE.md"
echo ""
echo "Next steps:"
echo "1. Run test script:"
echo "   $SCRIPT_DIR/test-workspace-tenancy.sh"
echo ""
echo "2. Or test manually:"
echo "   curl http://localhost:8052/api/v1/workspaces \\"
echo "     -H \"X-User-Id: \$(uuidgen)\""
echo ""
echo "3. Open frontend and set user ID in browser console:"
echo "   localStorage.setItem('omni_user_id', crypto.randomUUID())"
echo ""
echo "🎉 Deployment complete!"
