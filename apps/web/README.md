# Redstone Web App

Next.js 16 application for Redstone (App Router, TypeScript, Tailwind, shadcn/ui).

For setup, credentials, commands, and project status, see the [repository README](../../README.md).

## Local development

From the monorepo root:

```bash
pnpm dev:web
```

Or from this directory (after `pnpm install` at the root):

```bash
pnpm dev
```

Environment: copy root `.env.example` to `apps/web/.env.local` and set `DATABASE_URL` and `NEXTAUTH_SECRET`.

## Key paths

| Path | Purpose |
| --- | --- |
| `app/` | Routes (home, auth, files, graph) |
| `components/` | UI, file browser, editor, brand |
| `lib/` | Auth, hooks, API helpers |
| `app/api/` | REST API routes |

## UI screenshots

Captured into `docs/screenshots/` at the repo root:

```bash
node scripts/capture-screenshots.mjs
```
