import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from './auth-utils';
import { auth } from './auth';

export interface AuthenticatedRequest extends NextRequest {
  userId?: string;
}

/**
 * Middleware to authenticate API requests
 * Supports both NextAuth session (web) and JWT tokens (mobile)
 */
export async function authenticateRequest(
  request: NextRequest
): Promise<{ userId: string } | NextResponse> {
  // Try NextAuth session first (for web)
  const session = await auth();
  if (session?.user?.id) {
    return { userId: session.user.id };
  }

  // Try JWT token (for mobile)
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const payload = verifyJWT(token);

    if (payload) {
      return { userId: payload.userId };
    }
  }

  return NextResponse.json(
    { error: 'Unauthorized' },
    { status: 401 }
  );
}

/**
 * Helper to get user ID from request
 */
export async function getUserId(request: NextRequest): Promise<string | null> {
  // Try NextAuth session
  const session = await auth();
  if (session?.user?.id) {
    return session.user.id;
  }

  // Try JWT token
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const payload = verifyJWT(token);
    return payload?.userId || null;
  }

  return null;
}
