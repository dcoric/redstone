import { beforeAll, vi } from 'vitest';

// API route tests use JWT Bearer tokens; skip NextAuth session resolution in Vitest.
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(async () => null),
}));

beforeAll(() => {
  process.env.JWT_SECRET ??= 'test-jwt-secret';
  process.env.NEXTAUTH_SECRET ??= 'test-nextauth-secret';
  process.env.NEXTAUTH_URL ??= 'http://localhost:3000';
  process.env.DATABASE_URL ??=
    'postgresql://redstone:password@localhost:5432/redstone';
});
