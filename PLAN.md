# Redstone - Obsidian-like Application Development Plan

## Overview
Redstone is a knowledge management application similar to Obsidian, featuring markdown file storage, editing, and synchronization across web and mobile platforms.

## Architecture Decision

**Recommended Approach: Next.js Full-Stack with Separate Mobile App**

We'll use Next.js for both frontend and backend (using API routes) to simplify deployment and reduce infrastructure complexity. The mobile app will be a separate Expo application that consumes the same API.

**Rationale:**
- Single deployment target (redstone.citadel.red) simplifies Docker Swarm setup
- Shared code between web frontend and API routes
- Easier to maintain and deploy
- Next.js API routes are sufficient for this use case
- Can always extract to separate NestJS service later if needed

## Monorepo Structure

```
redstone/
├── apps/
│   ├── web/                 # Next.js web application
│   └── mobile/              # Expo React Native app
├── packages/
│   ├── shared/              # Shared TypeScript types and utilities
│   ├── database/            # Database schema, migrations, Prisma client
│   ├── api-client/          # Shared API client for web and mobile
│   └── markdown/            # Shared markdown processing utilities
├── docker/
│   ├── Dockerfile.web       # Next.js production Dockerfile
│   ├── docker-compose.yml   # Local development
│   └── docker-compose.prod.yml  # Production Docker Swarm config
├── .github/
│   └── workflows/           # CI/CD pipelines
├── package.json             # Root package.json (workspace config)
├── pnpm-workspace.yaml      # pnpm workspace configuration
├── turbo.json               # Turborepo configuration (optional)
└── PLAN.md                  # This file
```

## Monorepo Setup

### Package Manager: pnpm (Recommended)

**Why pnpm:**
- ✅ Fast and efficient (uses hard links, saves disk space)
- ✅ Strict dependency resolution (prevents phantom dependencies)
- ✅ Better monorepo support
- ✅ Works seamlessly with Expo SDK 52+

### Root Configuration

**Root `package.json`:**
```json
{
  "name": "redstone",
  "private": true,
  "scripts": {
    "dev": "turbo run dev",
    "dev:web": "turbo run dev --filter=web",
    "dev:mobile": "turbo run dev --filter=mobile",
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "clean": "turbo run clean"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "^5.0.0"
  },
  "engines": {
    "node": ">=18.0.0",
    "pnpm": ">=8.0.0"
  }
}
```

**`pnpm-workspace.yaml`:**
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

**`turbo.json` (Optional but recommended):**
```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**", "build/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "test": {
      "dependsOn": ["^build"]
    }
  }
}
```

### Expo Configuration (SDK 52+)

**Expo SDK 52+ has automatic monorepo support!**

**`apps/mobile/metro.config.js`:**
```javascript
const { getDefaultConfig } = require('expo/metro-config');

// SDK 52+ automatically configures monorepo support
const config = getDefaultConfig(__dirname);

module.exports = config;
```

**For SDK < 52 (manual configuration):**
```javascript
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch all files in the monorepo
config.watchFolders = [workspaceRoot];

// Let Metro know where to resolve packages
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Ensure Metro can resolve packages from workspace
config.resolver.disableHierarchicalLookup = false;

module.exports = config;
```

**`apps/mobile/app.json` or `app.config.js`:**
```json
{
  "expo": {
    "name": "Redstone Mobile",
    "slug": "redstone-mobile",
    "version": "1.0.0",
    "sdkVersion": "52.0.0"
  }
}
```

### Next.js Configuration

**`apps/web/next.config.js`:**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@redstone/shared',
    '@redstone/api-client',
    '@redstone/markdown',
  ],
  experimental: {
    // Enable if using shared packages that need transpilation
    serverComponentsExternalPackages: ['@redstone/database'],
  },
};

module.exports = nextConfig;
```

**`apps/web/tsconfig.json`:**
```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@redstone/shared": ["../../packages/shared/src"],
      "@redstone/api-client": ["../../packages/api-client/src"],
      "@redstone/markdown": ["../../packages/markdown/src"],
      "@redstone/database": ["../../packages/database/src"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"]
}
```

### Shared Package Setup

Each shared package should have its own `package.json`:

**`packages/shared/package.json`:**
```json
{
  "name": "@redstone/shared",
  "version": "0.0.1",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "lint": "eslint src",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  }
}
```

**`packages/shared/tsconfig.json`:**
```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

### Initial Setup Steps

1. **Initialize monorepo:**
   ```bash
   mkdir redstone && cd redstone
   pnpm init
   ```

2. **Create workspace configuration:**
   ```bash
   # Create pnpm-workspace.yaml (see above)
   # Create turbo.json (optional)
   ```

3. **Create Next.js app:**
   ```bash
   cd apps
   pnpm create next-app@latest web --typescript --tailwind --app --no-src-dir
   cd web
   # Update next.config.js (see above)
   ```

4. **Create Expo app:**
   ```bash
   cd apps
   pnpm create expo-app@latest mobile --template blank-typescript
   cd mobile
   # Ensure metro.config.js uses expo/metro-config (SDK 52+)
   ```

5. **Create shared packages:**
   ```bash
   mkdir -p packages/shared/src packages/database packages/api-client/src packages/markdown/src
   # Add package.json to each (see example above)
   ```

6. **Install dependencies:**
   ```bash
   # From root
   pnpm install
   ```

7. **Link packages in apps:**
   ```bash
   # In apps/web/package.json and apps/mobile/package.json
   # Add dependencies:
   {
     "dependencies": {
       "@redstone/shared": "workspace:*",
       "@redstone/api-client": "workspace:*",
       "@redstone/markdown": "workspace:*"
     }
   }
   ```

8. **Run development:**
   ```bash
   pnpm dev  # Runs all apps
   # or
   pnpm dev:web
   pnpm dev:mobile
   ```

### TypeScript Configuration

**Root `tsconfig.json`:**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowJs": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true,
    "incremental": true,
    "jsx": "preserve",
    "baseUrl": ".",
    "paths": {
      "@redstone/*": ["packages/*/src"]
    }
  },
  "exclude": ["node_modules", "dist", "build", ".next"]
}
```

### Workspace Commands

**Using pnpm workspace commands:**
```bash
# Run command in specific workspace
pnpm --filter web dev
pnpm --filter mobile start
pnpm --filter @redstone/shared build

# Run command in all workspaces
pnpm -r build

# Add dependency to specific workspace
pnpm --filter web add react-query
pnpm --filter @redstone/shared add zod

# Add dev dependency to root
pnpm add -w -D typescript
```

### Important Notes

1. **Expo SDK 52+**: Automatic monorepo support - no manual Metro config needed
2. **Next.js**: Must transpile shared packages in `next.config.js`
3. **TypeScript**: Use path aliases for better DX
4. **Dependencies**: Use `workspace:*` protocol for internal packages
5. **Turborepo**: Optional but recommended for better build caching and task orchestration

### Troubleshooting Common Issues

**Issue: Metro can't find packages**
- Ensure you're using Expo SDK 52+ with `expo/metro-config`
- For older SDKs, check `metro.config.js` has correct `watchFolders` and `nodeModulesPaths`
- Run `pnpm install` from root to ensure all dependencies are linked

**Issue: Next.js can't resolve shared packages**
- Add package to `transpilePackages` in `next.config.js`
- Check TypeScript path aliases in `tsconfig.json`
- Ensure shared packages have proper `package.json` with `main` and `types` fields

**Issue: TypeScript errors in shared packages**
- Ensure root `tsconfig.json` has correct `paths` configuration
- Check each package's `tsconfig.json` extends root config
- Run `pnpm type-check` to see all type errors

**Issue: Workspace dependencies not found**
- Use `workspace:*` protocol: `"@redstone/shared": "workspace:*"`
- Run `pnpm install` after adding new workspace dependencies
- Check `pnpm-workspace.yaml` includes the package directory

**Issue: Build fails in CI/CD**
- Ensure CI installs dependencies from root: `pnpm install --frozen-lockfile`
- Check Docker build context includes all necessary files
- Verify Prisma generate runs before builds that need it

## Technology Stack

### Backend & Web
- **Framework:** Next.js 14+ (App Router)
- **API:** Next.js API Routes
- **Database:** PostgreSQL 15+
- **ORM:** Prisma
- **Authentication:** NextAuth.js (or custom JWT)
- **File Storage:** Database (text) + optional S3 for attachments
- **Real-time:** Server-Sent Events (SSE) or WebSockets for live sync

### Mobile
- **Framework:** Expo (React Native)
- **Navigation:** Expo Router
- **State Management:** Zustand or React Query
- **Styling:** NativeWind (TailwindCSS for React Native) to share styles with Web
- **Markdown Editor:** react-native-markdown-editor or custom
- **API Client:** Axios/Fetch with shared types

### Shared
- **Package Manager:** pnpm 8+ (recommended) or npm/yarn
- **TypeScript:** Strict mode across all packages
- **Monorepo Tool:** Turborepo (recommended) for task orchestration and caching
- **Build System:** Native pnpm workspaces + Turborepo for task running

## Markdown Editing & Previewing

### Web Application

#### Markdown Editor
**Recommended: CodeMirror 6** (`@codemirror/lang-markdown`, `@codemirror/view`, `@codemirror/state`)

**Why CodeMirror 6:**
- ✅ Professional-grade editor used by many markdown tools
- ✅ Excellent performance with large files
- ✅ Highly extensible (syntax highlighting, autocomplete, keybindings)
- ✅ Split-view support (editor + preview side-by-side)
- ✅ Vim/Emacs keybindings support
- ✅ Good TypeScript support
- ✅ Active development and community

**Alternative Options:**
- **Monaco Editor** (`@monaco-editor/react`) - VS Code editor, heavier but more powerful
- **MDX Editor** (`@mdxeditor/editor`) - React-based, good for MDX but may be overkill
- **react-markdown-editor-lite** - Simpler but less customizable

**CodeMirror 6 Setup:**
```typescript
// Key packages needed:
- @codemirror/lang-markdown
- @codemirror/view
- @codemirror/state
- @codemirror/commands
- @codemirror/theme-one-dark (for dark mode)
- @uiw/react-codemirror (React wrapper)
```

#### Markdown Preview
**Recommended: `react-markdown` + `remark`/`rehype` ecosystem**

**Why react-markdown:**
- ✅ Most popular React markdown renderer
- ✅ Secure by default (sanitizes HTML)
- ✅ Plugin ecosystem (remark/rehype)
- ✅ Supports GitHub Flavored Markdown
- ✅ Syntax highlighting with `remark-prism` or `rehype-highlight`
- ✅ Math support with `remark-math` and `rehype-katex`
- ✅ Link validation and transformation

**Key Packages:**
```typescript
- react-markdown
- remark-gfm (GitHub Flavored Markdown)
- remark-prism (syntax highlighting)
- rehype-raw (for HTML in markdown)
- rehype-sanitize (security)
- rehype-autolink-headings (auto-link headings)
- remark-wiki-link (for [[internal links]] - Obsidian-style)
```

**Preview Features to Implement:**
- Syntax highlighting for code blocks
- Math equation rendering (KaTeX)
- Internal link resolution (`[[filename]]` → clickable links)
- Table of contents generation
- Image optimization and lazy loading
- Scroll sync between editor and preview

### Mobile Application

#### Markdown Editor
**Recommended: Custom solution with `react-native-text-input-mask` or `@react-native-community/text-input`**

**Why Custom:**
- Better control over mobile UX
- Native feel and performance
- Easier to implement mobile-specific features (toolbar, shortcuts)

**Alternative:**
- **react-native-markdown-editor** - Basic but may need customization
- **react-native-super-grid** - For layout, not specifically for markdown

**Mobile Editor Features:**
- Toolbar with formatting buttons (bold, italic, link, etc.)
- Syntax highlighting (limited on mobile)
- Auto-save on blur/change
- Undo/redo support
- Keyboard shortcuts (iOS/Android)

#### Markdown Preview
**Recommended: `react-native-markdown-display`**

**Why react-native-markdown-display:**
- ✅ Native React Native component (not webview)
- ✅ Good performance
- ✅ Customizable styles
- ✅ Supports most markdown features
- ✅ Active maintenance

**Alternative:**
- **react-native-render-html** + markdown parser - More flexible but more setup

**Key Packages:**
```typescript
- react-native-markdown-display
- react-native-syntax-highlighter (for code blocks)
- react-native-webview (fallback for complex rendering)
```

**Mobile Preview Features:**
- Responsive typography
- Touch-friendly links
- Code block syntax highlighting
- Image viewing (fullscreen on tap)
- Scroll position preservation

### Shared Markdown Processing

Consider creating a shared package `packages/markdown` for:
- Markdown parsing utilities
- Link extraction and validation
- Internal link resolution (`[[filename]]`)
- Table of contents generation
- Markdown sanitization rules
- Common markdown extensions

### Editor Features to Implement

**Phase 1 (Core):**
- [ ] Basic markdown editing
- [ ] Live preview (split view on web)
- [ ] Syntax highlighting
- [ ] Auto-save
- [ ] Undo/redo

**Phase 2 (Enhanced):**
- [ ] Vim/Emacs keybindings (web)
- [ ] Command palette (Cmd/Ctrl+P)
- [ ] Find & replace
- [ ] Line numbers
- [ ] Foldable sections
- [ ] Word count

**Phase 3 (Advanced):**
- [ ] Internal link autocomplete (`[[`)
- [ ] Tag autocomplete (`#`)
- [ ] Table editor (WYSIWYG)
- [ ] Math equation editor
- [ ] Image drag & drop
- [ ] Code block language detection
- [ ] Markdown export (PDF, HTML)

## Database Schema

### Core Tables

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  files     File[]
  folders   Folder[]
}

model Folder {
  id        String   @id @default(cuid())
  name      String
  parentId  String?  // For nested folders
  userId    String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime? // For soft deletes (sync)
  
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  parent    Folder?  @relation("FolderTree", fields: [parentId], references: [id])
  children  Folder[] @relation("FolderTree")
  files     File[]
}

model File {
  id          String   @id @default(cuid())
  title       String
  content     String   @db.Text // Markdown content
  folderId    String?
  userId      String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  deletedAt   DateTime? // For soft deletes (sync)
  lastSynced  DateTime @default(now())
  
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  folder      Folder?  @relation(fields: [folderId], references: [id], onDelete: SetNull)
  
  @@index([userId, folderId])
  @@index([userId, updatedAt])
}

model FileVersion {
  id        String   @id @default(cuid())
  fileId    String
  content   String   @db.Text
  createdAt DateTime @default(now())
  
  file      File     @relation(fields: [fileId], references: [id], onDelete: Cascade)
  
  @@index([fileId, createdAt])
}

model Tag {
  id        String   @id @default(cuid())
  name      String
  userId    String
  createdAt DateTime @default(now())
  
  files     File[]   @relation("FileTags")
  
  @@unique([name, userId])
}

model FileTag {
  fileId    String
  tagId     String
  
  file      File     @relation("FileTags", fields: [fileId], references: [id], onDelete: Cascade)
  tag       Tag      @relation(fields: [tagId], references: [id], onDelete: Cascade)
  
  @@id([fileId, tagId])
}
```

## API Design

### Base URL
- **Production:** `https://redstone.citadel.red/api`
- **Development:** `http://localhost:3000/api`

### Authentication
### Authentication
- **Web:** JWT tokens stored in HTTP-only cookies via NextAuth.js
- **Mobile:** Raw JWT tokens stored in secure storage (Expo SecureStore) sent in `Authorization: Bearer` header
- Endpoints: `/api/auth/login`, `/api/auth/register`, `/api/auth/refresh`

### Core Endpoints

```
GET    /api/files              # List all files (with pagination, filters)
POST   /api/files              # Create new file
GET    /api/files/:id          # Get file by ID
PUT    /api/files/:id          # Update file
DELETE /api/files/:id          # Delete file
GET    /api/files/:id/versions # Get file version history

GET    /api/folders            # List folders (tree structure)
POST   /api/folders            # Create folder
PUT    /api/folders/:id        # Update folder
DELETE /api/folders/:id        # Delete folder

GET    /api/search?q=...       # Search files by content/title
GET    /api/tags               # List all tags
POST   /api/files/:id/tags     # Add tag to file
DELETE /api/files/:id/tags/:tagId  # Remove tag

GET    /api/sync?since=...     # Sync endpoint for mobile (get changes since timestamp)
                               # Returns created/updated files AND deleted files (via soft deletes)

### Synchronization Strategy
- **Deletions:** Uses Soft Deletes (`deletedAt`) to propagate deletions to clients.
- **Conflict Resolution:** "Last Write Wins" (LWW) based on server timestamp initially.
  - Future: "Conflict Copies" (e.g., "File (Conflicted Copy 2025-10-10).md")

```

## Shared Packages

### `packages/shared`
**Purpose:** Core shared types and utilities used across all apps

**Contents:**
- TypeScript types/interfaces (User, File, Folder, etc.)
- Validation schemas (Zod)
- Constants (API endpoints, error messages)
- Utility functions (date formatting, string helpers)
- Common enums and types

**Package name:** `@redstone/shared`
**Dependencies:** `zod`, `typescript`

### `packages/database`
**Purpose:** Database schema, Prisma client, and database utilities

**Contents:**
- Prisma schema (`schema.prisma`)
- Generated Prisma client
- Migration scripts
- Seed scripts
- Database helper functions
- Type exports from Prisma

**Package name:** `@redstone/database`
**Dependencies:** `@prisma/client`, `prisma`
**Note:** Other packages import types from here, but only web app uses Prisma client directly

### `packages/api-client`
**Purpose:** Type-safe API client for web and mobile

**Contents:**
- API client class/function
- Request/response types (generated from shared types)
- Error handling utilities
- Authentication helpers (token management)
- API endpoint constants
- Request interceptors

**Package name:** `@redstone/api-client`
**Dependencies:** `@redstone/shared`, `axios` or `fetch` wrapper
**Used by:** `apps/web`, `apps/mobile`

### `packages/markdown`
**Purpose:** Shared markdown processing utilities

**Contents:**
- Markdown parsing utilities
- Link extraction and validation
- Internal link resolution (`[[filename]]` → file ID)
- Table of contents generation
- Markdown sanitization rules
- Common markdown extensions

**Package name:** `@redstone/markdown`
**Dependencies:** `remark`, `rehype`, `unified`
**Used by:** `apps/web`, `apps/mobile`

## Development Workflow

### Local Development Setup

1. **Prerequisites:**
   ```bash
   - Node.js 18+
   - pnpm 8+ (recommended) or npm/yarn
   - Docker & Docker Compose (for local PostgreSQL)
   - Expo CLI (optional, can use npx)
   ```

2. **Initial Setup:**
   ```bash
   # Clone and install dependencies
   pnpm install
   
   # Set up database (if using Docker)
   docker-compose up -d postgres
   
   # Run database migrations
   pnpm --filter @redstone/database prisma migrate dev
   pnpm --filter @redstone/database prisma generate
   
   # Generate Prisma client for all packages that need it
   pnpm --filter @redstone/database prisma generate
   
   # Start all apps in development mode
   pnpm dev
   ```

3. **Development Commands:**
   ```bash
   # Run all apps (using Turborepo)
   pnpm dev
   
   # Run specific apps
   pnpm dev:web          # Next.js web app (http://localhost:3000)
   pnpm dev:mobile       # Expo mobile app (opens Expo Dev Tools)
   
   # Using pnpm workspace commands
   pnpm --filter web dev
   pnpm --filter mobile start
   
   # Build all apps
   pnpm build
   
   # Run tests
   pnpm test
   
   # Lint all packages
   pnpm lint
   
   # Type check all packages
   pnpm type-check
   ```

4. **Expo Development:**
   ```bash
   # Start Expo dev server
   cd apps/mobile
   pnpm start
   # or
   pnpm --filter mobile start
   
   # Run on iOS simulator
   pnpm --filter mobile ios
   
   # Run on Android emulator
   pnpm --filter mobile android
   ```

5. **Next.js Development:**
   ```bash
   # Start Next.js dev server
   cd apps/web
   pnpm dev
   # or
   pnpm --filter web dev
   
   # Build for production
   pnpm --filter web build
   pnpm --filter web start
   ```

### Environment Variables

**Web (.env.local):**
```env
DATABASE_URL=postgresql://user:password@localhost:5432/redstone
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000
JWT_SECRET=your-jwt-secret
```

**Mobile (.env):**
```env
API_URL=http://localhost:3000/api
# or for production: https://redstone.citadel.red/api
```

## Deployment Strategy

### Docker Swarm Configuration

**docker-compose.prod.yml:**
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: redstone
      POSTGRES_USER: redstone
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - redstone-network
    deploy:
      replicas: 1
      placement:
        constraints:
          - node.role == manager

  web:
    image: redstone-web:latest
    ports:
      - "80:3000"
      - "443:3000"
    environment:
      DATABASE_URL: postgresql://redstone:${POSTGRES_PASSWORD}@postgres:5432/redstone
      NEXTAUTH_URL: https://redstone.citadel.red
      NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
      NODE_ENV: production
    depends_on:
      - postgres
    networks:
      - redstone-network
    deploy:
      replicas: 2
      update_config:
        parallelism: 1
        delay: 10s

volumes:
  postgres_data:

networks:
  redstone-network:
    driver: overlay
```

### Deployment Steps

1. **Build Docker Image:**
   ```bash
   docker build -f docker/Dockerfile.web -t redstone-web:latest .
   ```

2. **Deploy to Swarm:**
   ```bash
   docker stack deploy -c docker/docker-compose.prod.yml redstone
   ```

3. **SSL/TLS:** Use Traefik or nginx reverse proxy for HTTPS

### Domain Configuration

- **Web App:** `https://redstone.citadel.red` (serves both frontend and API at `/api`)
- **API:** Accessible at `https://redstone.citadel.red/api`
- **Mobile:** Connects to `https://redstone.citadel.red/api`

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [x] Initialize monorepo root (package.json, pnpm-workspace.yaml, turbo.json)
- [x] Set up root TypeScript configuration
- [x] Create Next.js app in `apps/web` with TypeScript and App Router
- [x] Configure Next.js for monorepo (next.config.js, tsconfig.json)
- [x] Create Expo app in `apps/mobile` with TypeScript template
- [x] Configure Expo Metro for monorepo (metro.config.js - automatic in SDK 52+)
- [x] Set up shared packages structure:
  - [x] `packages/shared` - types and utilities
  - [x] `packages/database` - Prisma setup
  - [x] `packages/api-client` - API client skeleton
  - [x] `packages/markdown` - markdown utilities skeleton
- [x] Configure package.json for each shared package
- [x] Set up TypeScript path aliases
- [x] Set up PostgreSQL database (Docker Compose)
- [x] Configure Prisma schema in `packages/database`
- [x] Set up database migrations
- [x] Test workspace linking and imports
- [x] Set up Docker development environment (docker-compose.yml)
- [x] Configure development scripts (dev, build, test, lint)

### Phase 2: Core Backend (Week 2-3)
- [x] Implement authentication (NextAuth.js or custom JWT)
- [x] Create file CRUD API endpoints
- [x] Implement folder management
- [x] Add file versioning
- [x] Set up database migrations

### Phase 3: Web Frontend (Mock Data UI) (Week 3-4)
- [x] Design and implement UI components
- [x] Create file list/browser view
- [x] Implement markdown editor (CodeMirror 6) with split-view preview
- [x] Set up react-markdown for preview rendering
- [x] Add file creation/editing interface
- [x] Implement folder navigation
- [ ] Add search functionality (Postgres `tsvector` full-text search)
- [ ] Implement tag system
- Note: Uses mock data for folders/files; real API wiring moves to Phase 4.

### Phase 4: Web Frontend API Integration (Week 4-5)
- [ ] Replace mock folder/file data with live API calls
- [ ] Wire file CRUD (list/create/update/delete) to `/api/files`
- [ ] Hook folder navigation to `/api/folders` tree
- [ ] Connect editor Save/New actions to persistence and versioning
- [ ] Implement search against `/api/search`
- [ ] Surface tags from `/api/tags` and enable add/remove
- [ ] Handle auth state (NextAuth/JWT) in client requests

### Phase 5: Mobile App (Week 5-6)
- [ ] Initialize Expo project
- [ ] Set up navigation
- [ ] Create file list screen
- [ ] Implement markdown editor (custom or react-native-markdown-editor)
- [ ] Set up react-native-markdown-display for preview
- [ ] Add offline support (local storage)
- [ ] Implement sync mechanism
- [ ] Add authentication flow

### Phase 6: Advanced Features (Week 6-7)
- [ ] Real-time sync (SSE or WebSockets)
- [ ] File version history UI
- [ ] Link between files (wiki-style)
- [ ] File attachments support
- [ ] Export/import functionality

### Phase 7: Polish & Deployment (Week 7-8)
- [ ] Performance optimization
- [ ] Error handling and logging
- [ ] Testing (unit, integration, E2E)
- [ ] Docker production setup
- [ ] CI/CD pipeline
- [ ] Documentation
- [ ] Security audit

## Key Features to Implement

### Core Features
- ✅ Markdown file creation, editing, deletion
- ✅ Folder organization
- ✅ File search
- ✅ Tag system
- ✅ File versioning/history
- ✅ User authentication
- ✅ Multi-device sync

### Advanced Features (Future)
- 🔗 Internal linking between files (wiki-style)
- 📎 File attachments
- 🔍 Full-text search with highlighting
- 📊 Graph view of file connections
- 🌙 Dark mode
- 📱 Offline-first mobile experience
- 👥 Collaboration (shared files)
- 🔌 Plugin system

## Security Considerations

1. **Authentication:** Secure JWT tokens, HTTP-only cookies
2. **Authorization:** User-scoped data access
3. **Input Validation:** Validate all API inputs (Zod)
4. **SQL Injection:** Use Prisma (parameterized queries)
5. **XSS:** Sanitize markdown output
6. **Rate Limiting:** Implement on API endpoints
7. **HTTPS:** Enforce in production
8. **CORS:** Configure properly for mobile app

## Performance Optimizations

1. **Database:**
   - Indexes on frequently queried fields
   - Connection pooling
   - Query optimization

2. **API:**
   - Response caching where appropriate
   - Pagination for large lists
   - Compression (gzip)

3. **Frontend:**
   - Code splitting
   - Lazy loading
   - Image optimization
   - Service worker for offline

4. **Mobile:**
   - Local caching
   - Incremental sync
   - Optimistic updates

## Testing Strategy

- **Unit Tests:** Jest for utilities and components
- **Integration Tests:** API endpoint testing
- **E2E Tests:** Playwright for web, Detox for mobile
- **Database Tests:** Test migrations and seeds

## Monitoring & Logging

- Application logs (structured logging)
- Error tracking (Sentry or similar)
- Performance monitoring
- Database query monitoring
- Uptime monitoring

## Phase 2 Implementation Details

### Database Setup ✅
- **Prisma Schema**: Configured with User, File, Folder, FileVersion, Tag, and FileTag models
- **Migrations**: Initial migration created and applied (`20251217153754_initial_schema`)
- **Seed Data**: Test user (`test@redstone.app` / `password123`), sample folder, file, and tag
- **Location**: [packages/database/prisma/schema.prisma](packages/database/prisma/schema.prisma)

### Authentication ✅
- **NextAuth.js**: Configured for web with credentials provider
- **JWT Auth**: Implemented for mobile API access
- **Endpoints**:
  - `POST /api/auth/login` - JWT login for mobile
  - `POST /api/auth/register` - User registration
  - `GET/POST /api/auth/[...nextauth]` - NextAuth routes for web
- **Middleware**: Dual authentication support (NextAuth session + JWT tokens)
- **Location**: [apps/web/lib/auth.ts](apps/web/lib/auth.ts), [apps/web/lib/auth-utils.ts](apps/web/lib/auth-utils.ts)

### File Management API ✅
- **Endpoints**:
  - `GET /api/files` - List files with pagination, search, and folder filtering
  - `POST /api/files` - Create new file
  - `GET /api/files/:id` - Get file details
  - `PUT /api/files/:id` - Update file (auto-creates version on content change)
  - `DELETE /api/files/:id` - Soft delete file
  - `GET /api/files/:id/versions` - Get file version history
- **Features**: Pagination, search, soft deletes, automatic versioning
- **Location**: [apps/web/app/api/files/](apps/web/app/api/files/)

### Folder Management API ✅
- **Endpoints**:
  - `GET /api/folders` - List folders with tree structure
  - `POST /api/folders` - Create new folder
  - `GET /api/folders/:id` - Get folder with children and files
  - `PUT /api/folders/:id` - Update folder (rename or move)
  - `DELETE /api/folders/:id` - Delete empty folder
- **Features**: Nested folders, file counts, tree structure building
- **Location**: [apps/web/app/api/folders/](apps/web/app/api/folders/)

### Tag System ✅
- **Endpoints**:
  - `GET /api/tags` - List all user tags with file counts
  - `POST /api/files/:id/tags` - Add tag to file
  - `DELETE /api/files/:id/tags/:tagId` - Remove tag from file
- **Features**: Auto-create tags, tag reuse across files
- **Location**: [apps/web/app/api/tags/](apps/web/app/api/tags/)

### Additional Features ✅
- **Search**: `GET /api/search?q=query` - Full-text search across titles and content
- **Sync**: `GET /api/sync?since=timestamp` - Mobile sync endpoint with incremental updates
- **Soft Deletes**: All deletions are soft (preserve data for sync)

## Next Steps

1. **Phase 4 - Web Frontend API Integration**: Replace mock data with live API wiring for folders, files, search, and tags
2. **Phase 5 - Mobile App**: Set up Expo app with authentication and file management
3. **Phase 6 - Advanced Features**: Real-time sync, internal links, export functionality

---

**Last Updated:** 2025-12-17
**Status:** Phase 3 Complete (Mock Data Web UI). Next: Phase 4 (Web Frontend API Integration).
