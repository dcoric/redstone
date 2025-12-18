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

**✅ Phase 4 Core Complete** - File CRUD operations fully functional

### What's Working
- ✅ Full-stack authentication (web + mobile-ready API)
- ✅ File management (create, read, update, delete, version history)
- ✅ Folder organization with nested structure
- ✅ Real-time UI updates with SWR
- ✅ Markdown editor with live preview (CodeMirror 6)
- ✅ Type-safe API client with comprehensive types
- ✅ Keyboard accessibility throughout UI
- ✅ Production build passing with zero errors

### What's Next
- [ ] Search functionality UI (API ready)
- [ ] Tag management UI (API ready)
- [ ] Folder creation/deletion UI (API ready)
- [ ] Mobile app (Phase 5)
- [ ] Advanced features (Phase 6)

---

## Architecture

### Stack
- **Frontend**: Next.js 14+ (App Router), React, TypeScript
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
│   └── mobile/              # Expo app (planned)
├── packages/
│   ├── shared/              # Shared types and utilities
│   ├── database/            # Prisma schema and client
│   ├── api-client/          # API client (planned)
│   └── markdown/            # Markdown utilities (planned)
├── PLAN.md                  # This file (current plan)
├── COMPLETED.md             # Completed phases archive
└── IMPROVEMENTS.md          # Code quality improvements log
```

### Database Schema
**Core Models**: User, File, Folder, FileVersion, Tag, FileTag

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

---

## Remaining Work

### Phase 4 - Web Frontend (Remaining)

**Priority: High** | **Effort: Medium** | **Time: 1-2 days**

#### Tasks
- [ ] **Search UI**: Wire search input to `/api/search`
  - Add search results view
  - Highlight matching text
  - Show search in context (file + folder)
  - Clear search functionality

- [ ] **Tag Management UI**: Connect to `/api/tags`
  - Tag picker component
  - Add/remove tags on files
  - Tag-based filtering
  - Tag autocomplete

- [ ] **Folder Management UI**: Add folder CRUD operations
  - "New Folder" button
  - Folder rename (inline editing)
  - Folder delete (with empty check)
  - Folder move/reorganize (drag-drop future enhancement)

#### Files to Modify
- `apps/web/app/page.tsx` - Add search functionality
- `apps/web/components/features/file-browser/sidebar.tsx` - Add folder creation
- `apps/web/app/files/[id]/page.tsx` - Add tag management

---

### Phase 5 - Mobile App

**Priority: Medium** | **Effort: High** | **Time: 1-2 weeks**

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

### Phase 6 - Advanced Features

**Priority: Low** | **Effort: High** | **Time: 2-3 weeks**

#### Planned Features
- [ ] **Internal Links**: Wiki-style `[[filename]]` links
  - Link autocomplete
  - Backlinks view
  - Link validation
  - Navigation between linked files

- [ ] **Real-time Sync**: Live updates across devices
  - WebSockets or Server-Sent Events (SSE)
  - Operational transformation or CRDT for conflicts
  - Live collaboration (future)

- [ ] **Graph View**: Visualize file connections
  - Interactive network graph
  - Filter by tags/folders
  - Node clustering

- [ ] **Export/Import**:
  - Export to PDF/HTML
  - Import from Obsidian/Markdown files
  - Batch operations

- [ ] **Attachments**: Image and file support
  - Upload to S3 or local storage
  - Drag-drop upload
  - Image preview and optimization
  - Attachment management

- [ ] **Advanced Editor Features**:
  - Vim/Emacs keybindings
  - Command palette (Cmd+P)
  - Table editor (WYSIWYG)
  - Math equations (KaTeX)
  - Code block language detection

---

## Quick Start

### Development
```bash
# Install dependencies
pnpm install

# Start database
docker-compose up -d

# Run migrations
pnpm --filter @redstone/database prisma migrate dev

# Start web app
pnpm dev:web

# Access at http://localhost:3000
# Test user: test@redstone.app / password123
```

### Build
```bash
# Build for production
pnpm build

# Check TypeScript
pnpm type-check

# Lint
pnpm lint
```

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
- **Testing**: Production build must pass with zero errors

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

**Last Updated:** 2025-12-18
**Current Phase:** Phase 4 (Core Complete) → Remaining Features
**Next Milestone:** Complete search/tags/folder UI, then Phase 5 (Mobile App)
