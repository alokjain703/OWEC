#!/bin/bash

# OMNI Workspace Tenancy - Quick Test Script
# This script helps test the multi-tenant workspace features

set -e

API_BASE="http://localhost:8052/api/v1"
USER_ID="${OMNI_USER_ID:-$(uuidgen)}"

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║         OMNI Workspace Tenancy - Quick Test                    ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "Using User ID: $USER_ID"
echo "API Base: $API_BASE"
echo ""
echo "💾 Save this for later:"
echo "   export OMNI_USER_ID=\"$USER_ID\""
echo ""

# Function to make API calls with user ID header
api_call() {
    local method=$1
    local endpoint=$2
    local data=$3
    
    if [ -n "$data" ]; then
        curl -s -X "$method" "$API_BASE$endpoint" \
            -H "X-User-Id: $USER_ID" \
            -H "Content-Type: application/json" \
            -d "$data"
    else
        curl -s -X "$method" "$API_BASE$endpoint" \
            -H "X-User-Id: $USER_ID"
    fi
}

# Test 1: Create Workspace
echo "📦 Test 1: Creating workspace..."
workspace_response=$(api_call POST "/workspaces" '{
  "name": "My Test Workspace",
  "type": "personal",
  "owner_user_id": "'$USER_ID'",
  "subscription_tier": "free",
  "storage_quota_mb": 1024,
  "project_limit": 5
}')

workspace_id=$(echo "$workspace_response" | grep -o '"id":"[^"]*' | cut -d'"' -f4)

if [ -z "$workspace_id" ]; then
    echo "❌ Failed to create workspace"
    echo "Response: $workspace_response"
    exit 1
fi

echo "✅ Created workspace: $workspace_id"
echo ""

# Test 2: List Workspaces
echo "📋 Test 2: Listing workspaces..."
workspaces=$(api_call GET "/workspaces")
workspace_count=$(echo "$workspaces" | grep -o '"id"' | wc -l)
echo "✅ Found $workspace_count workspace(s)"
echo ""

# Test 3: Get Workspace Details
echo "🔍 Test 3: Getting workspace details..."
workspace_details=$(api_call GET "/workspaces/$workspace_id")
workspace_name=$(echo "$workspace_details" | grep -o '"name":"[^"]*' | cut -d'"' -f4)
echo "✅ Workspace name: $workspace_name"
echo ""

# Test 4: Create Projects (up to limit)
echo "🏗️  Test 4: Creating projects..."
for i in {1..3}; do
    project_response=$(api_call POST "/workspaces/$workspace_id/projects" '{
      "workspace_id": "'$workspace_id'",
      "created_by": "'$USER_ID'",
      "title": "Test Project '$i'",
      "description": "A test project for workspace tenancy",
      "status": "active",
      "visibility": "workspace",
      "storage_mode": "local"
    }')
    
    project_id=$(echo "$project_response" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
    
    if [ -n "$project_id" ]; then
        echo "✅ Created project $i: $project_id"
    else
        echo "❌ Failed to create project $i"
        echo "Response: $project_response"
    fi
done
echo ""

# Test 5: List Projects
echo "📊 Test 5: Listing projects in workspace..."
projects=$(api_call GET "/workspaces/$workspace_id/projects")
project_count=$(echo "$projects" | grep -o '"id"' | wc -l)
echo "✅ Found $project_count project(s) in workspace"
echo ""

# Test 6: Try to exceed project limit
echo "⚠️  Test 6: Testing project limit enforcement..."
echo "Creating 3 more projects to test limit (limit is 5)..."
for i in {4..6}; do
    project_response=$(api_call POST "/workspaces/$workspace_id/projects" '{
      "workspace_id": "'$workspace_id'",
      "created_by": "'$USER_ID'",
      "title": "Test Project '$i'",
      "status": "active",
      "visibility": "workspace",
      "storage_mode": "local"
    }')
    
    if echo "$project_response" | grep -q '"id"'; then
        echo "✅ Created project $i"
    else
        if echo "$project_response" | grep -qi "limit"; then
            echo "✅ Project limit enforced correctly (project $i rejected)"
        else
            echo "❌ Unexpected error for project $i"
            echo "Response: $project_response"
        fi
    fi
done
echo ""

# Test 7: Add Member (should work as owner)
echo "👥 Test 7: Adding workspace member..."
new_member_id=$(uuidgen)
member_response=$(api_call POST "/workspaces/$workspace_id/members" '{
  "user_id": "'$new_member_id'",
  "role": "editor"
}')

if echo "$member_response" | grep -q '"user_id"'; then
    echo "✅ Added editor member: $new_member_id"
else
    echo "❌ Failed to add member"
    echo "Response: $member_response"
fi
echo ""

# Test 8: Update Workspace
echo "✏️  Test 8: Updating workspace..."
update_response=$(api_call PATCH "/workspaces/$workspace_id" '{
  "name": "Updated Test Workspace"
}')

if echo "$update_response" | grep -q "Updated Test Workspace"; then
    echo "✅ Workspace name updated"
else
    echo "❌ Failed to update workspace"
    echo "Response: $update_response"
fi
echo ""

# Summary
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                    Test Summary                                 ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "Workspace ID: $workspace_id"
echo "User ID: $USER_ID"
echo "Projects Created: $project_count"
echo ""
echo "🎉 All basic tests completed!"
echo ""
echo "Next steps:"
echo "1. Open http://localhost:4252 in browser"
echo "2. Run in browser console:"
echo "   localStorage.setItem('omni_user_id', '$USER_ID')"
echo "3. Refresh page and select workspace from toolbar"
echo ""
echo "To re-run tests with same user:"
echo "   export OMNI_USER_ID=\"$USER_ID\""
echo "   ./scripts/test-workspace-tenancy.sh"
