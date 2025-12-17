import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@redstone/database';
import { getUserId } from '@/lib/api-middleware';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/files/:id/versions - Get file version history
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  const userId = await getUserId(request);

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    // Check if file exists and belongs to user
    const file = await prisma.file.findFirst({
      where: {
        id,
        userId,
        deletedAt: null,
      },
    });

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const versions = await prisma.fileVersion.findMany({
      where: { fileId: id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ versions });
  } catch (error) {
    console.error('Error fetching file versions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
