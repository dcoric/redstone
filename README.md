# Redstone

An Obsidian-like knowledge management application with markdown support, folder organization, and multi-device sync.

## Tech Stack

- **Monorepo**: pnpm workspaces + Turborepo
- **Web**: Next.js 14+ (App Router) with TypeScript
- **Mobile**: Expo React Native (planned)
- **Database**: PostgreSQL 15+ with Prisma ORM
- **Authentication**: NextAuth.js (web) + JWT (mobile)

## Project Structure

```
redstone/
├── apps/
│   ├── web/              # Next.js web application
│   └── mobile/           # Expo mobile app (planned)
├── packages/
│   ├── shared/           # Shared TypeScript types and utilities
│   ├── database/         # Prisma schema and client
│   ├── api-client/       # Shared API client (planned)
│   └── markdown/         # Markdown utilities (planned)
├── docker/               # Docker configuration
│   └── docker-compose.yml
├── PLAN.md              # Detailed development plan
└── API.md               # API documentation
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+
- Docker & Docker Compose (for PostgreSQL)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd redstone
```

2. Install dependencies:
```bash
pnpm install
```

3. Start PostgreSQL database:
```bash
cd docker && docker-compose up -d
```

4. Set up environment variables:
```bash
cp .env.example apps/web/.env.local
# Edit apps/web/.env.local if needed
```

5. Run database migrations and seed:
```bash
pnpm --filter @redstone/database db:generate
pnpm --filter @redstone/database db:migrate
pnpm --filter @redstone/database db:seed
```

6. Start the development server:
```bash
pnpm dev:web
```

The web app will be available at [http://localhost:3000](http://localhost:3000)

## Test Credentials

After running the seed script, you can use:
- **Email**: `test@redstone.app`
- **Password**: `password123`

## Development Commands

```bash
# Run all apps
pnpm dev

# Run specific apps
pnpm dev:web          # Next.js web app
pnpm dev:mobile       # Expo mobile app (when ready)

# Database commands
pnpm --filter @redstone/database db:generate    # Generate Prisma client
pnpm --filter @redstone/database db:migrate     # Run migrations
pnpm --filter @redstone/database db:seed        # Seed database
pnpm --filter @redstone/database db:studio      # Open Prisma Studio

# Build
pnpm build            # Build all apps

# Test
pnpm test             # Run tests

# Lint
pnpm lint             # Lint all packages
```

## Features

### Implemented ✅

- **Authentication**
  - User registration and login
  - NextAuth.js for web (cookie-based)
  - JWT tokens for mobile API access

- **File Management**
  - Create, read, update, delete files
  - Markdown content support
  - Automatic versioning on content changes
  - Search by title and content
  - Soft deletes for sync

- **Folder Organization**
  - Create nested folders
  - Move files between folders
  - Tree structure with file counts

- **Tag System**
  - Add/remove tags from files
  - Auto-create tags
  - Tag-based organization

- **Sync API**
  - Incremental sync for mobile
  - Change tracking since timestamp

### Implemented (Frontend) ✅

- **Authentication UI**
  - Login and signup pages
  - Session management with NextAuth
  - Route protection middleware
  - User menu with logout

- **API Client & Hooks**
  - Typed API client with authenticated requests
  - SWR hooks for data fetching (useFiles, useFolders, useAuth)
  - Automatic cookie handling for NextAuth sessions

- **UI Components**
  - File browser interface
  - Markdown editor with live preview (CodeMirror 6)
  - Folder navigation sidebar
  - Search interface (UI ready)

### Planned 🚧

- **Web Frontend** (Phase 4 - In Progress)
  - Replace mock data with live API calls
  - Wire file CRUD operations
  - Connect folder navigation to API
  - Implement search functionality
  - Add tag management UI

- **Mobile App** (Phase 5)
  - Expo React Native app
  - Offline support
  - Mobile-optimized editor

- **Advanced Features** (Phase 6)
  - Real-time sync (WebSockets/SSE)
  - Internal linking between files
  - File attachments
  - Export to PDF/HTML
  - Graph view of connections

## API Documentation

See [API.md](API.md) for complete API documentation.

Quick example:
```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@redstone.app","password":"password123"}'

# Get files (use token from login response)
curl -X GET http://localhost:3000/api/files \
  -H "Authorization: Bearer <your-token>"
```

## Database Schema

Key models:
- **User**: User accounts
- **File**: Markdown files with content
- **Folder**: Nested folder structure
- **FileVersion**: Version history for files
- **Tag**: User-created tags
- **FileTag**: Many-to-many relationship between files and tags

See [packages/database/prisma/schema.prisma](packages/database/prisma/schema.prisma) for the complete schema.

## Project Status

✅ **Phase 1 Complete**: Monorepo setup
✅ **Phase 2 Complete**: Core backend API
✅ **Phase 3 Complete**: Web frontend UI components
🚧 **Phase 4 In Progress**: Web frontend API integration
  - ✅ Authentication flow and API client setup
  - ⏳ Data integration (replacing mock data)
⏳ **Phase 5 Planned**: Mobile app
⏳ **Phase 6 Planned**: Advanced features

See [PLAN.md](PLAN.md) for detailed implementation plan and progress.

## License

[Your License Here]
