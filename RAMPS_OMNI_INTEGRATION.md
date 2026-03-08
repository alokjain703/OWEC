# RAMPS-OMNI Integration Guide

## Overview

This document describes how the RAMPS frontend should link to the OMNI application's tree editor, passing project metadata for a seamless user experience.

The OMNI tree view displays **one project at a time** and must receive project information via URL query parameters from RAMPS.

## Integration Flow

1. **User navigates from RAMPS Dashboard** → Clicks on a project to edit its tree structure
2. **RAMPS constructs URL** → Includes project metadata as query parameters
3. **User redirected to OMNI** → OMNI tree view receives and displays the specified project
4. **Single project view** → OMNI shows only the project specified in the URL parameters

## URL Structure

### Format

```
http://localhost:4252/projects/{PROJECT_ID}/tree?projectName={NAME}
```

### Parameters

| Parameter | Type | Location | Required | Description |
|-----------|------|----------|----------|-------------|
| `projectId` | UUID | **URL Path** | **Yes** | The unique identifier of the project in OMNI |
| `projectName` | string | Query String | No | The project name to prepopulate when creating a new project |

**Note**: The `projectId` is part of the URL path (not a query parameter) and is **required**.

### Example URLs

**Existing Project:**
```
http://localhost:4252/projects/550e8400-e29b-41d4-a716-446655440000/tree?projectName=My%20Fantasy%20Novel
```

**Another Project:**
```
http://localhost:4252/projects/7c5a2e10-f3b4-4d9e-8a6f-123456789abc/tree?projectName=Epic%20Space%20Opera
```

**Without Project Name (projectName is optional):**
```
http://localhost:4252/projects/550e8400-e29b-41d4-a716-446655440000/tree
```

## Implementation in RAMPS

### Example: TypeScript/Angular

```typescript
import { Router } from '@angular/router';

export class DashboardComponent {
  constructor(private router: Router) {}

  openProjectInOmni(projectId: string, projectName: string): void {
    // Build URL with projectId in path and projectName in query params
    const omniUrl = `http://localhost:4252/projects/${encodeURIComponent(projectId)}/tree?projectName=${encodeURIComponent(projectName)}`;
    
    // Option 1: Open in same window
    window.location.href = omniUrl;
    
    // Option 2: Open in new tab
    window.open(omniUrl, '_blank');
  }
}
```

### Example: HTML Template

```html
<!-- Link to existing project -->
<a 
  [href]="'http://localhost:4252/projects/' + project.id + '/tree?projectName=' + encodeURIComponent(project.name)"
  target="_blank">
  Edit Tree Structure
</a>

<!-- Button to open project -->
<button 
  (click)="openProjectInOmni(project.id, project.name)">
  Open in OMNI
</button>
``` 
  (click)="openProjectInOmni(project.id, project.name)">
  Open in OMNI
</button>
```

## OMNI Implementation (Already Completed)

### TreeViewComponent

The [tree-view.component.ts](omni-frontend/src/app/features/tree/tree-view.component.ts) reads projectId from route parameters and projectName from query parameters:

```typescript
ngOnInit(): void {
  // Read projectId from route params (path parameter)
  this.route.params.subscribe(params => {
    if (params['projectId']) {
      this.selectedProjectId.set(params['projectId']);
    }
  });

  // Read optional projectName from query parameters
  this.route.queryParams.subscribe(params => {
    if (params['projectName']) {
      this.projectNameFromRoute.set(params['projectName']);
    }
  });
}
```

**Key Features:**
- Reads `projectId` from URL path (`/projects/:projectId/tree`)
- Reads `projectName` from query string (`?projectName=...`)
- No project selector dropdown (displays one project at a time)
- Shows a message if no `projectId` is provided in the route
- Passes project information to child component

### ProjectTreeEditorComponent

The [project-tree-editor.component.ts](omni-frontend/src/app/features/tree/components/project-tree-editor.component.ts) accepts a `projectName` input:

```typescript
@Component({
  selector: 'omni-project-tree-editor',
  // ...
})
export class ProjectTreeEditorComponent {
  projectId = input.required<string>();
  projectName = input<string>(''); // From RAMPS
  
  openCreateProjectDialog(): void {
    const defaultName = this.projectName() || '';
    const title = prompt('Enter project title:', defaultName);
    // ...
  }
}
```

## Data Flow

```
┌─────────────────┐
│ RAMPS Dashboard │
│                 │
│ Project List    │
│ - Project A     │───┐
│ - Project B     │   │ Click "Edit Tree"
│ - Project C     │   │
└─────────────────┘   │
                      │
                      ▼
        Construct URL: /projects/{projectId}/tree?projectName={name}
                      │
                      ▼
┌─────────────────────────────────────┐
│ OMNI Tree View Component            │
│                                     │
│ 1. Read projectId from route path   │
│ 2. Read projectName from query      │
│ 3. Pass both to editor component    │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Project Tree Editor Component   │ │
│ │                                 │ │
│ │ - Loads project tree structure │ │
│ │ - Prepopulates name on create  │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

## Project Name and Description Management

### Current Architecture

- **Project Metadata in RAMPS**: The RAMPS application manages project names and descriptions as part of tenant/workspace management
- **Tree Structure in OMNI**: OMNI focuses on the narrative tree structure (nodes, hierarchies, content)

### Recommendation

Since project names and descriptions are managed in RAMPS:

1. **RAMPS stores**: `project_name`, `project_description`, `omni_project_id`
2. **OMNI stores**: Tree structure, nodes, content
3. **RAMPS passes**: Project metadata to OMNI via query parameters
4. **OMNI uses**: The passed name for display and prepopulation

### Syncing Project Names

If project names can be edited in both applications, consider:

**Option 1: RAMPS as Source of Truth (Recommended)**
- RAMPS always passes the authoritative project name
- OMNI uses it for display but doesn't persist it
- When creating projects, OMNI returns the UUID to RAMPS, which stores name/description

**Option 2: Bidirectional Sync**
- Add an API endpoint to sync project metadata between RAMPS and OMNI
- Requires more complex state management

## Environment Configuration

### Production URLs

Update the base URLs for production environments:

```typescript
// Development
const OMNI_BASE_URL = 'http://localhost:4252';

// Production
const OMNI_BASE_URL = 'https://omni.yourcompany.com';
```

## Security Considerations

1. **URL Encoding**: Always encode query parameters using `encodeURIComponent()`
2. **UUID Validation**: Validate project IDs before passing them
3. **CORS**: Ensure CORS is properly configured between RAMPS and OMNI domains
4. **Authentication**: Consider passing authentication tokens if needed (use secure methods)

## Testing Checklist

- [ ] Navigate from RAMPS to OMNI with existing project
- [ ] Verify project name appears in OMNI UI
- [ ] Create new project from OMNI with prepopulated name
- [ ] Test URL encoding with special characters in project names
- [ ] Verify behavior when query parameters are missing
- [ ] Test with invalid/non-existent project IDs

## Future Enhancements

1. **Modal/Iframe Integration**: Embed OMNI tree editor directly in RAMPS using an iframe
2. **Deep Linking**: Support linking to specific nodes within a project
3. **Return Navigation**: Add a "Back to Dashboard" button in OMNI that returns to RAMPS
4. **Session Sharing**: Share authentication session between RAMPS and OMNI

---

**Last Updated**: 2024-01-08  
**OMNI Version**: 0.1.0  
**Integration Status**: ✅ Complete - Ready for RAMPS implementation
