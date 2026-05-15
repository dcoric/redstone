import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@redstone/database';
import { getUserId } from '@/lib/api-middleware';
import { extractWikiLinks } from '@/lib/wiki-links';

export async function GET(request: NextRequest) {
  const userId = await getUserId(request);

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const tagFilter = searchParams.get('tag');
    const folderFilter = searchParams.get('folder');

    const where: any = { userId, deletedAt: null };

    if (tagFilter) {
      where.tags = { some: { tag: { name: tagFilter } } };
    }

    if (folderFilter) {
      where.folderId = folderFilter;
    }

    const files = await prisma.file.findMany({
      where,
      select: {
        id: true,
        title: true,
        content: true,
        folderId: true,
        folder: { select: { id: true, name: true } },
        tags: { include: { tag: true } },
      },
    });

    const nodes = files.map((file) => ({
      id: file.id,
      label: file.title,
      folder: file.folder?.name || 'No folder',
      tags: file.tags.map((ft) => ft.tag.name),
    }));

    const edges: { source: string; target: string }[] = [];

    for (const file of files) {
      const links = extractWikiLinks(file.content);
      for (const linkTitle of links) {
        const target = files.find(
          (f) => f.title.toLowerCase() === linkTitle.toLowerCase()
        );
        if (target && target.id !== file.id) {
          edges.push({ source: file.id, target: target.id });
        }
      }
    }

    return NextResponse.json({ nodes, edges });
  } catch (error) {
    console.error('Error fetching graph data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
