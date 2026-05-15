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
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'html';

    const file = await prisma.file.findFirst({
      where: {
        id,
        userId,
        deletedAt: null,
      },
      include: {
        folder: { select: { id: true, name: true } },
        tags: { include: { tag: true } },
      },
    });

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    if (format === 'html') {
      const html = generateHtmlExport(file);
      return new Response(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Disposition': `attachment; filename="${file.title}.html"`,
        },
      });
    }

    return NextResponse.json({ error: 'Unsupported format' }, { status: 400 });
  } catch (error) {
    console.error('Error exporting file:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateHtmlExport(file: any): string {
  const tagsHtml = file.tags
    .map((ft: any) => `<span class="tag">${ft.tag.name}</span>`)
    .join(' ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${file.title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; line-height: 1.6; color: #1a1a1a; }
    h1 { font-size: 2rem; margin-bottom: 0.5rem; }
    .meta { color: #666; font-size: 0.875rem; margin-bottom: 1rem; }
    .tags { margin-bottom: 1.5rem; }
    .tag { display: inline-block; background: #e2e8f0; padding: 0.25rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; margin-right: 0.5rem; }
    pre { background: #f1f5f9; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; }
    code { font-family: monospace; }
    blockquote { border-left: 4px solid #e2e8f0; padding-left: 1rem; color: #666; }
    hr { border: none; border-top: 1px solid #e2e8f0; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <h1>${file.title}</h1>
  <div class="meta">
    ${file.folder ? `Folder: ${file.folder.name} · ` : ''}
    Created: ${new Date(file.createdAt).toLocaleDateString()} ·
    Updated: ${new Date(file.updatedAt).toLocaleDateString()}
  </div>
  <div class="tags">${tagsHtml}</div>
  <div class="content">
    ${file.content.replace(/\n/g, '<br>')}
  </div>
</body>
</html>`;
}
