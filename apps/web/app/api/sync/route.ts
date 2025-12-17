import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@redstone/database';
import { getUserId } from '@/lib/api-middleware';

// GET /api/sync?since=timestamp - Sync endpoint for mobile
// Returns all files and folders created/updated/deleted since timestamp
export async function GET(request: NextRequest) {
  const userId = await getUserId(request);

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const sinceParam = searchParams.get('since');

    if (!sinceParam) {
      return NextResponse.json(
        { error: 'since parameter is required (ISO timestamp)' },
        { status: 400 }
      );
    }

    const since = new Date(sinceParam);

    if (isNaN(since.getTime())) {
      return NextResponse.json(
        { error: 'Invalid timestamp format' },
        { status: 400 }
      );
    }

    // Get all files updated since timestamp (including deleted ones)
    const files = await prisma.file.findMany({
      where: {
        userId,
        updatedAt: {
          gte: since,
        },
      },
      include: {
        folder: {
          select: { id: true, name: true },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
      orderBy: { updatedAt: 'asc' },
    });

    // Get all folders updated since timestamp (including deleted ones)
    const folders = await prisma.folder.findMany({
      where: {
        userId,
        updatedAt: {
          gte: since,
        },
      },
      orderBy: { updatedAt: 'asc' },
    });

    // Split into created/updated and deleted
    const syncData = {
      files: {
        upserted: files.filter((f) => !f.deletedAt),
        deleted: files.filter((f) => f.deletedAt).map((f) => f.id),
      },
      folders: {
        upserted: folders.filter((f) => !f.deletedAt),
        deleted: folders.filter((f) => f.deletedAt).map((f) => f.id),
      },
      syncedAt: new Date().toISOString(),
    };

    return NextResponse.json(syncData);
  } catch (error) {
    console.error('Error syncing:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
