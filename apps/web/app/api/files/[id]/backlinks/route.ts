import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@redstone/database';
import { getUserId } from '@/lib/api-middleware';

interface RouteParams {
  params: Promise<{ id: string }>;
}

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

    const targetFile = await prisma.file.findFirst({
      where: {
        id,
        userId,
        deletedAt: null,
      },
      select: { id: true, title: true },
    });

    if (!targetFile) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const allFiles = await prisma.file.findMany({
      where: {
        userId,
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        content: true,
      },
    });

    const wikiLinkPattern = new RegExp(
      `\\[\\[(${targetFile.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\]\\]`,
      'i'
    );

    const backlinks = allFiles
      .filter((file) => file.id !== targetFile.id && wikiLinkPattern.test(file.content))
      .map((file) => ({
        id: file.id,
        title: file.title,
      }));

    return NextResponse.json({
      file: targetFile,
      backlinks,
    });
  } catch (error) {
    console.error('Error fetching backlinks:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
