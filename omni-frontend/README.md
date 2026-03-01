# OMNI – Frontend (omni-frontend)

Angular 19+ standalone component application for the OMNI narrative engine.

## Structure

```
omni-frontend/
├── src/
│   ├── main.ts                         # Bootstrap (standalone)
│   ├── index.html
│   ├── styles.scss
│   ├── environments/
│   │   ├── environment.ts              # Local/dev (apiBase → localhost:8000)
│   │   └── environment.prod.ts         # Production
│   └── app/
│       ├── app.component.ts            # Shell with sidebar nav
│       ├── app.config.ts               # App providers (router, http, animations)
│       ├── app.routes.ts               # Lazy-loaded routes
│       ├── core/
│       │   └── services/
│       │       └── omni-api.service.ts # Full API client (all 5 modules)
│       └── features/
│           ├── tree/                   # Recursive tree view
│           ├── characters/             # D3 force-graph character map
│           ├── timeline/               # D3 horizontal timeline + zoom/pan
│           ├── graph/                  # D3 entity-to-entity graph
│           └── schemas/                # Bible schema browser
├── angular.json
├── tsconfig.json
└── package.json
```

## Quick Start

> **Requires pnpm ≥ 9** — install once with `npm install -g pnpm` or via `corepack enable`.

```bash
cd omni-frontend
pnpm install
pnpm start           # http://localhost:4252
```

## Build

```bash
pnpm run build        # development
pnpm run build:prod   # production (output: dist/omni-frontend)
```

## Feature Modules

| Route          | Component                       | D3 Usage                    |
|----------------|---------------------------------|-----------------------------|
| `/tree`        | `TreeViewComponent`             | SVG node tree               |
| `/characters`  | `CharacterDashboardComponent`   | Force-directed graph        |
| `/timeline`    | `TimelineViewComponent`         | Horizontal timeline + zoom  |
| `/graph`       | `GraphViewComponent`            | Full entity-relation graph  |
| `/schemas`     | `SchemasViewComponent`          | Schema browser              |

All components use **OnPush** change detection and Angular 19 **signals**.  
D3 runs inside `AfterViewInit` with full **zoom + pan** support.
