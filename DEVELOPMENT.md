# Development Guide

## Quick Start

```bash
# 1. Start database
cd docker && docker-compose up -d

# 2. Run migrations (first time only)
pnpm --filter @redstone/database db:migrate

# 3. Start dev server
pnpm dev:web
```

## Common Tasks

### Database Operations

#### Reset Database
```bash
# Stop and remove containers
cd docker && docker-compose down -v

# Start fresh
docker-compose up -d

# Wait a moment, then run migrations
pnpm --filter @redstone/database db:migrate
pnpm --filter @redstone/database db:seed
```

#### View Database
```bash
# Open Prisma Studio
pnpm --filter @redstone/database db:studio
# Opens at http://localhost:5555
```

#### Create New Migration
```bash
# After modifying schema.prisma
pnpm --filter @redstone/database db:migrate
# You'll be prompted for a migration name
```

#### Generate Prisma Client
```bash
# After schema changes
pnpm --filter @redstone/database db:generate
```

### Testing API Endpoints

#### Login and Get Token
```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@redstone.app","password":"password123"}' \
  | jq -r '.token'

# Save token to variable
export TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@redstone.app","password":"password123"}' \
  | jq -r '.token')
```

#### Test Endpoints
```bash
# List files
curl -X GET http://localhost:3000/api/files \
  -H "Authorization: Bearer $TOKEN" | jq

# Create file
curl -X POST http://localhost:3000/api/files \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"My Note","content":"# Hello"}' | jq

# Search
curl -X GET "http://localhost:3000/api/search?q=hello" \
  -H "Authorization: Bearer $TOKEN" | jq

# List folders
curl -X GET http://localhost:3000/api/folders \
  -H "Authorization: Bearer $TOKEN" | jq
```

### Adding New API Endpoints

1. Create route file in `apps/web/app/api/[your-endpoint]/route.ts`
2. Import required utilities:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@redstone/database';
import { getUserId } from '@/lib/api-middleware';
```
3. Implement handler:
```typescript
export async function GET(request: NextRequest) {
  const userId = await getUserId(request);

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Your logic here

  return NextResponse.json({ data: 'your data' });
}
```

### Working with Shared Packages

#### Update Shared Types
```bash
# Edit packages/shared/src/index.ts
# Types are automatically available in all apps
```

#### Update Database Schema
```bash
# 1. Edit packages/database/prisma/schema.prisma
# 2. Generate Prisma client
pnpm --filter @redstone/database db:generate
# 3. Create migration
pnpm --filter @redstone/database db:migrate
```

### Debugging

#### View Logs
```bash
# Next.js dev server logs (already visible in terminal)

# Database logs
docker logs docker-postgres-1 -f
```

#### Check Database Connection
```bash
# Connect to PostgreSQL directly
docker exec -it docker-postgres-1 psql -U redstone -d redstone

# List tables
\dt

# Query users
SELECT * FROM users;

# Exit
\q
```

#### Inspect Prisma Queries
Set in `.env.local`:
```
# Enable query logging
DATABASE_URL="postgresql://redstone:password@localhost:5432/redstone?connection_limit=5&socket_timeout=3"
```

### Troubleshooting

#### Port Already in Use
```bash
# Find process on port 3000
lsof -i :3000

# Kill it
kill -9 <PID>
```

#### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Restart database
cd docker && docker-compose restart postgres

# Check logs
docker logs docker-postgres-1
```

#### Prisma Client Out of Sync
```bash
# Regenerate Prisma client
pnpm --filter @redstone/database db:generate

# Restart Next.js dev server
```

#### Module Not Found Errors
```bash
# Reinstall dependencies
pnpm install

# Clear Next.js cache
rm -rf apps/web/.next

# Restart dev server
pnpm dev:web
```

## Code Style

### API Response Format
```typescript
// Success (200/201)
{
  "data": { ... },           // Single item
  "items": [ ... ],          // List of items
  "pagination": { ... }       // For paginated lists
}

// Error (4xx/5xx)
{
  "error": "Error message"
}
```

### Error Handling
```typescript
try {
  // Your logic
  return NextResponse.json({ data });
} catch (error) {
  console.error('Error description:', error);
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}
```

### Authentication Check
```typescript
const userId = await getUserId(request);

if (!userId) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

## Performance Tips

1. **Use indexes**: Add `@@index()` to frequently queried fields in Prisma schema
2. **Pagination**: Always paginate large lists
3. **Select specific fields**: Use Prisma `select` to only fetch needed data
4. **Batch operations**: Use `Promise.all()` for parallel operations
5. **Soft deletes**: Filter `deletedAt: null` in all queries

## Security Checklist

- ✅ All API routes check authentication
- ✅ User ID validated from token/session
- ✅ Passwords are hashed with bcrypt
- ✅ SQL injection prevented by Prisma
- ✅ Input validation on all endpoints
- ✅ HTTP-only cookies for web auth
- ✅ Soft deletes for data recovery

## Useful Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)
- [Turborepo Documentation](https://turbo.build/repo/docs)
