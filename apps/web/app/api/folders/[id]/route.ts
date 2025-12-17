import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@redstone/database';
import { getUserId } from '@/lib/api-middleware';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/folders/:id - Get a specific folder
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

    const folder = await prisma.folder.findFirst({
      where: {
        id,
        userId,
        deletedAt: null,
      },
      include: {
        children: {
          where: { deletedAt: null },
          include: {
            _count: {
              select: {
                files: { where: { deletedAt: null } },
                children: { where: { deletedAt: null } },
              },
            },
          },
        },
        files: {
          where: { deletedAt: null },
          orderBy: { updatedAt: 'desc' },
        },
        _count: {
          select: {
            files: { where: { deletedAt: null } },
            children: { where: { deletedAt: null } },
          },
        },
      },
    });

    if (!folder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    return NextResponse.json({ folder });
  } catch (error) {
    console.error('Error fetching folder:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/folders/:id - Update a folder
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
    const { name, parentId } = body;

    // Check if folder exists and belongs to user
    const existingFolder = await prisma.folder.findFirst({
      where: {
        id,
        userId,
        deletedAt: null,
      },
    });

    if (!existingFolder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    // If moving to a different parent, verify parent exists
    if (parentId !== undefined && parentId !== existingFolder.parentId) {
      if (parentId) {
        // Check parent exists and belongs to user
        const parentFolder = await prisma.folder.findFirst({
          where: {
            id: parentId,
            userId,
            deletedAt: null,
          },
        });

        if (!parentFolder) {
          return NextResponse.json(
            { error: 'Parent folder not found' },
            { status: 404 }
          );
        }

        // Prevent moving folder into itself or its descendants
        if (parentId === id) {
          return NextResponse.json(
            { error: 'Cannot move folder into itself' },
            { status: 400 }
          );
        }
      }
    }

    const folder = await prisma.folder.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(parentId !== undefined && { parentId }),
      },
      include: {
        _count: {
          select: {
            files: { where: { deletedAt: null } },
            children: { where: { deletedAt: null } },
          },
        },
      },
    });

    return NextResponse.json({ folder });
  } catch (error) {
    console.error('Error updating folder:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/folders/:id - Delete a folder (soft delete)
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

    // Check if folder exists and belongs to user
    const existingFolder = await prisma.folder.findFirst({
      where: {
        id,
        userId,
        deletedAt: null,
      },
      include: {
        _count: {
          select: {
            files: { where: { deletedAt: null } },
            children: { where: { deletedAt: null } },
          },
        },
      },
    });

    if (!existingFolder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    // Check if folder is empty
    const isEmpty =
      existingFolder._count.files === 0 && existingFolder._count.children === 0;

    if (!isEmpty) {
      return NextResponse.json(
        { error: 'Cannot delete non-empty folder. Please move or delete its contents first.' },
        { status: 400 }
      );
    }

    // Soft delete
    await prisma.folder.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ message: 'Folder deleted successfully' });
  } catch (error) {
    console.error('Error deleting folder:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
