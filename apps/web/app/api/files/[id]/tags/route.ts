import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@redstone/database';
import { getUserId } from '@/lib/api-middleware';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/files/:id/tags - Add tag to file
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  const userId = await getUserId(request);

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id: fileId } = await params;
    const body = await request.json();
    const { tagName } = body;

    if (!tagName) {
      return NextResponse.json(
        { error: 'Tag name is required' },
        { status: 400 }
      );
    }

    // Check if file exists and belongs to user
    const file = await prisma.file.findFirst({
      where: {
        id: fileId,
        userId,
        deletedAt: null,
      },
    });

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Get or create tag
    const tag = await prisma.tag.upsert({
      where: {
        name_userId: {
          name: tagName,
          userId,
        },
      },
      create: {
        name: tagName,
        userId,
      },
      update: {},
    });

    // Link tag to file (ignore if already linked)
    await prisma.fileTag.upsert({
      where: {
        fileId_tagId: {
          fileId,
          tagId: tag.id,
        },
      },
      create: {
        fileId,
        tagId: tag.id,
      },
      update: {},
    });

    return NextResponse.json({ tag }, { status: 201 });
  } catch (error) {
    console.error('Error adding tag to file:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
