import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@redstone/database';
import { getUserId } from '@/lib/api-middleware';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/files/:id - Get a specific file
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

    const file = await prisma.file.findFirst({
      where: {
        id,
        userId,
        deletedAt: null,
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
    });

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    return NextResponse.json({ file });
  } catch (error) {
    console.error('Error fetching file:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/files/:id - Update a file
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  const userId = await getUserId(request);

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { title, content, folderId } = body;

    // Check if file exists and belongs to user
    const existingFile = await prisma.file.findFirst({
      where: {
        id,
        userId,
        deletedAt: null,
      },
    });

    if (!existingFile) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Create a version if content changed
    if (content !== undefined && content !== existingFile.content) {
      await prisma.fileVersion.create({
        data: {
          fileId: id,
          content: existingFile.content,
        },
      });
    }

    // Update file
    const file = await prisma.file.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(folderId !== undefined && { folderId }),
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
    });

    return NextResponse.json({ file });
  } catch (error) {
    console.error('Error updating file:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/files/:id - Delete a file (soft delete)
export async function DELETE(
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
    const existingFile = await prisma.file.findFirst({
      where: {
        id,
        userId,
        deletedAt: null,
      },
    });

    if (!existingFile) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Soft delete
    await prisma.file.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
