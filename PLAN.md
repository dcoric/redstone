# Redstone - Development Plan

> **Quick Links**: [Completed Work](COMPLETED.md) | [Code Improvements](IMPROVEMENTS.md)

## Overview
Redstone is a knowledge management application similar to Obsidian, featuring markdown file storage, editing, and synchronization across web and mobile platforms.

## Architecture Decision

**Approach: Next.js Full-Stack with Separate Mobile App**

We use Next.js for both frontend and backend (API routes) to simplify deployment and reduce infrastructure complexity. The mobile app will be a separate Expo application that consumes the same API.

**Why This Architecture:**
- **Single Deployment**: One Next.js app at `redstone.citadel.red` serves both web UI and API
- **Shared Code**: Frontend and API routes share types, utilities, and business logic
- **Simple Infrastructure**: No separate backend service to deploy and maintain
- **Developer Experience**: Hot reload for both UI and API, unified TypeScript config
- **Flexible**: Can extract to separate NestJS/Express service later if needed
- **Mobile Ready**: JWT-based API works seamlessly with Expo app

**Trade-offs:**
- ✅ Faster development and simpler deployment
- ✅ Easier to maintain and debug
- ✅ Lower infrastructure costs
- ⚠️ Tightly coupled frontend/backend (acceptable for this use case)
- ⚠️ Scaling considerations (Next.js can scale well, but separate services offer more flexibility)

---

## Current Status

**✅ Phase 6 Complete** — Advanced web features shipped. **🔄 Pre-Mobile Hardening** — CI, tests, and stability before Phase 5.

### What's Working
- ✅ Full-stack authentication (NextAuth web + JWT for API/mobile clients)
- ✅ File management (CRUD, version history, import/export)
- ✅ Folder organization with nested structure
- ✅ Tag management with autocomplete
- ✅ Search with highlighting and context
- ✅ Wiki-style internal links (`[[title]]`), backlinks, broken-link detection
- ✅ Real-time sync via Server-Sent Events (SSE) with connection status
- ✅ Interactive graph view (force-directed, tag/folder filters)
- ✅ File attachments (upload API + Prisma model)
- ✅ Markdown editor with live preview, optional Vim keybindings
- ✅ Type-safe API client and SWR data layer
- ✅ GitHub Actions CI (build, lint, migrate, API tests)

### What's Next (priority order)
- [ ] **Pre-Mobile Hardening** (current) — expand test coverage, fix Next.js warnings, keep CI green
- [ ] **Phase 5 — Mobile app** (deferred until hardening is done)
- [ ] **Phase 7 — Desktop app** (Electron)

---

## Architecture

### Stack
- **Frontend**: Next.js 16 (App Router), React, TypeScript
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL 15+ with Prisma ORM
- **Auth**: NextAuth.js (web) + JWT (mobile)
- **Editor**: CodeMirror 6 with react-markdown preview
- **Styling**: TailwindCSS with shadcn/ui components
- **Data Fetching**: SWR for client-side caching

### Monorepo Structure
```
redstone/
├── apps/
│   ├── web/                 # Next.js app (frontend + API)
│   └── mobile/              # Expo app (scaffold — Phase 5, deferred)
├── packages/
│   ├── shared/              # Shared types and utilities
│   ├── database/            # Prisma schema and client
│   ├── api-client/          # Shared API client
│   └── markdown/            # Markdown utilities
├── .github/workflows/       # CI (build, lint, test)
├── PLAN.md                  # This file (current plan)
├── COMPLETED.md             # Completed phases archive
└── IMPROVEMENTS.md          # Code quality improvements log
```

### Database Schema
**Core Models**: User, File, Folder, FileVersion, Tag, FileTag, Attachment

**Key Features**:
- Soft deletes (`deletedAt`) for sync support
- Automatic file versioning on content changes
- Nested folder support with parent-child relationships
- User-scoped data with cascade deletion

**Location**: [packages/database/prisma/schema.prisma](packages/database/prisma/schema.prisma)

### API Endpoints

#### Authentication
- `POST /api/auth/login` - JWT login (mobile)
- `POST /api/auth/register` - User registration
- `GET/POST /api/auth/[...nextauth]` - NextAuth routes (web)

#### Files
- `GET /api/files` - List files (pagination, search, folder filter)
- `POST /api/files` - Create file
- `GET /api/files/:id` - Get file
- `PUT /api/files/:id` - Update file (auto-version)
- `DELETE /api/files/:id` - Soft delete
- `GET /api/files/:id/versions` - Version history

#### Folders
- `GET /api/folders` - List folders (tree structure)
- `POST /api/folders` - Create folder
- `GET /api/folders/:id` - Get folder with children/files
- `PUT /api/folders/:id` - Update folder
- `DELETE /api/folders/:id` - Delete empty folder

#### Tags
- `GET /api/tags` - List tags with file counts
- `POST /api/files/:id/tags` - Add tag to file
- `DELETE /api/files/:id/tags/:tagId` - Remove tag

#### Utilities
- `GET /api/search?q=query` - Full-text search
- `GET /api/sync?since=timestamp` - Mobile sync (incremental)
- `GET /api/events` - SSE stream for live updates
- `GET /api/graph` - Graph view data (nodes + wiki-link edges)
- `GET /api/files/:id/backlinks` - Files linking to this note
- `POST /api/files/import` - Import markdown files
- `GET /api/files/:id/export` - Export file as HTML
- `POST /api/attachments` - Upload image/PDF attachments

---

## Remaining Work

### Phase 4 - Web Frontend ✅ (Complete)

**Status: Complete** | **Completed: 2025-12-18**

#### Completed Tasks
- [x] **Search UI**: Wire search input to `/api/search`
  - Add search results view
  - Highlight matching text
  - Show search in context (file + folder)
  - Clear search functionality

- [x] **Tag Management UI**: Connect to `/api/tags`
  - Tag picker component with autocomplete
  - Add/remove tags on files
  - Display current tags on file editor
  - Create new tags on the fly
  - Tag suggestions from existing tags

- [x] **Folder Management UI**: Add folder CRUD operations
  - "New Folder" button with dialog
  - Folder rename (inline editing)
  - Folder delete (with empty check and confirmation)
  - Parent folder selection for nested folders
  - Context menu for folder actions

#### Files Modified
- `apps/web/app/page.tsx` - Search functionality
- `apps/web/components/features/file-browser/sidebar.tsx` - Folder CRUD operations
- `apps/web/app/files/[id]/page.tsx` - Tag management
- `apps/web/lib/hooks/use-tags.ts` - New hook for tags

---

### Phase 4.5 - Web/API Verification Gate

**Priority: High** | **Effort: Low** | **Time: 0.5-1 day**

Goal: confirm all web and API behaviors are stable before starting mobile.

#### Checklist
- [x] Auth flow (signup, signin, signout, protected routes, redirect) — verified 2026-05-15
- [x] File CRUD (create, edit, delete, version history) — verified 2026-05-15
- [x] Folder CRUD (create, rename, delete empty, move) — verified 2026-05-15
- [x] Tag CRUD (add, remove, autocomplete suggestions) — verified 2026-05-15
- [x] Search results (highlighting, context, empty/error states) — verified 2026-05-15
- [x] API contracts match docs in `API.md` — verified 2026-05-15
- [x] `pnpm --filter web build` pass (includes TypeScript check)

---

### Pre-Mobile Hardening (current)

**Priority: High** | **Effort: Medium** | **Goal: stable web/API before Expo work**

#### Done
- [x] GitHub Actions CI (PostgreSQL service, migrate, seed, build, lint, test)
- [x] Prisma `generate` in install/build pipeline (`postinstall` + `@redstone/database` build task)
- [x] API integration tests (auth, files CRUD, folders, search) via Vitest

#### Remaining
- [ ] Expand API tests (tags, graph, attachments, SSE smoke)
- [ ] Resolve 34 ESLint warnings in `apps/web` (re-enable `no-explicit-any` as error when clean)
- [ ] Resolve Next.js 16 warnings (`turbopack.root`, middleware → proxy migration)
- [ ] Keep `PLAN.md` / `API.md` aligned with implemented endpoints
- [ ] Optional: E2E smoke (Playwright) for auth + editor save path

---

### Phase 5 - Mobile App

**Status: Deferred** — start only after Pre-Mobile Hardening checklist is complete.

**Priority: Medium** | **Effort: High** | **Time: 1-2 weeks**

> Expo scaffold exists (`apps/mobile`) with offline SQLite; not in active development until web/API hardening is done.

#### Tasks
- [ ] Set up Expo project with TypeScript
- [ ] Configure navigation (Expo Router)
- [ ] Create authentication flow
  - Login/signup screens
  - JWT token storage (SecureStore)
  - Auth context/hooks
- [ ] Implement file management
  - File list screen
  - File editor with markdown support
  - Create/edit/delete operations
- [ ] Add offline support
  - Local database (SQLite)
  - Sync mechanism with `/api/sync`
  - Conflict resolution
- [ ] Folder navigation
- [ ] Search functionality
- [ ] Tag support

#### Key Decisions
- **Markdown Editor**: react-native-markdown-editor or custom TextInput
- **Preview**: react-native-markdown-display
- **Local Storage**: expo-sqlite
- **Styling**: NativeWind (TailwindCSS for React Native)

---

### Phase 6 - Advanced Features ✅ (Complete)

**Completed on `main`** (PRs #14–#19, wiki links #32, realtime #33)

- [x] **Internal Links**: `[[filename]]`, autocomplete, backlinks, broken-link detection
- [x] **Real-time Sync**: SSE (`/api/events`) + connection status in UI
- [x] **Graph View**: Force-directed graph, tag/folder filters
- [x] **Export/Import**: HTML export, markdown import
- [x] **Attachments**: Upload API + local storage (images/PDF)
- [x] **Editor**: Optional Vim keybindings toggle

#### Future enhancements (not scoped)
- [ ] Command palette (Cmd+P)
- [ ] KaTeX math, WYSIWYG tables
- [ ] S3-backed attachments, drag-drop in editor
- [ ] CRDT / OT for multi-user collaboration

---

### Phase 7 - Desktop App (Electron)

**Priority: Low** | **Effort: Medium** | **Time: 1-2 weeks**

#### Tasks
- [ ] Set up Electron app with TypeScript
- [ ] Reuse web UI via a desktop shell
- [ ] Desktop auth flow (JWT + secure storage)
- [ ] File management (list, edit, create, delete)
- [ ] Offline-first storage (SQLite)
- [ ] Sync with `/api/sync`
- [ ] Desktop packaging (macOS, Windows, Linux)
- [ ] CI release pipeline (build + upload artifacts to GitHub Releases)

#### Key Decisions
- **Framework**: Electron Forge
- **CI**: GitHub Actions release workflow
- **Publishing**: `@electron-forge/publisher-github`
- **Packaging**: Forge makers (Squirrel/Zip/Deb/Rpm)
- **Local Storage**: SQLite + encrypted store for tokens
- **Updates**: Auto-update strategy (optional)

---

## Quick Start

### Development
```bash
# Install dependencies
pnpm install

# Start database
docker-compose up -d

# Generate client and run migrations
pnpm --filter @redstone/database db:generate
pnpm --filter @redstone/database db:migrate

# Start web app
pnpm dev:web

# Access at http://localhost:3000
# Test user: test@redstone.app / password123
```

### Build & CI
```bash
# Build for production (runs prisma generate via workspace deps)
pnpm build

# Lint
pnpm lint

# API integration tests (requires Postgres + seed)
pnpm --filter @redstone/database db:migrate:deploy
pnpm --filter @redstone/database db:seed
pnpm test
```

CI runs the same steps on every push/PR to `main` (see `.github/workflows/ci.yml`).

---

## Documentation

### Reference Docs
- [COMPLETED.md](COMPLETED.md) - Archived completed phases (Phases 1-4 core)
- [IMPROVEMENTS.md](IMPROVEMENTS.md) - Code quality improvements log
- [README.md](README.md) - Project overview and setup

### Key Files
- [packages/database/prisma/schema.prisma](packages/database/prisma/schema.prisma) - Database schema
- [apps/web/lib/types.ts](apps/web/lib/types.ts) - TypeScript type definitions
- [apps/web/lib/api-client.ts](apps/web/lib/api-client.ts) - API client functions
- [apps/web/lib/hooks/](apps/web/lib/hooks/) - SWR data fetching hooks

---

## Development Practices

### Code Quality
- **TypeScript**: Strict mode, no `any` types
- **Type Safety**: Comprehensive type definitions for all API interactions
- **Error Handling**: User-friendly error messages throughout
- **Accessibility**: Keyboard navigation, ARIA labels, focus management
- **Testing**: Vitest API integration tests + production build must pass in CI

### Git Workflow
- Keep commits atomic and well-described
- Update PLAN.md when starting new phases
- Document major changes in IMPROVEMENTS.md
- Archive completed work to COMPLETED.md

### Performance
- **Database**: Indexed queries, connection pooling
- **API**: Pagination for large lists, response caching
- **Frontend**: Code splitting, lazy loading, optimistic updates
- **Mobile**: Local caching, incremental sync

### Security
- HTTP-only cookies for web auth
- JWT tokens in secure storage for mobile
- Input validation with Zod
- Prisma for SQL injection prevention
- Sanitized markdown rendering
- Rate limiting on API endpoints

---

**Last Updated:** 2026-05-18
**Current Phase:** Pre-Mobile Hardening
**Next Milestone:** Expand test coverage and stabilize CI, then Phase 5 (Mobile App)
