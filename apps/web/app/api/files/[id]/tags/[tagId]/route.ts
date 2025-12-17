import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@redstone/database';
import { getUserId } from '@/lib/api-middleware';

interface RouteParams {
  params: Promise<{ id: string; tagId: string }>;
}

// DELETE /api/files/:id/tags/:tagId - Remove tag from file
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  const userId = await getUserId(request);

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id: fileId, tagId } = await params;

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

    // Check if tag belongs to user
    const tag = await prisma.tag.findFirst({
      where: {
        id: tagId,
        userId,
      },
    });

    if (!tag) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    }

    // Remove tag from file
    await prisma.fileTag.delete({
      where: {
        fileId_tagId: {
          fileId,
          tagId,
        },
      },
    });

    return NextResponse.json({ message: 'Tag removed from file' });
  } catch (error) {
    console.error('Error removing tag from file:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
