import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@redstone/database';
import { getUserId } from '@/lib/api-middleware';

export async function POST(request: NextRequest) {
  const userId = await getUserId(request);

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!file.name.endsWith('.md')) {
      return NextResponse.json(
        { error: 'Only .md files are supported' },
        { status: 400 }
      );
    }

    const content = await file.text();
    const title = file.name.replace(/\.md$/, '');

    const existingFile = await prisma.file.findFirst({
      where: {
        title,
        userId,
        deletedAt: null,
      },
    });

    if (existingFile) {
      return NextResponse.json(
        { error: 'File with this title already exists' },
        { status: 409 }
      );
    }

    const createdFile = await prisma.file.create({
      data: {
        title,
        content,
        userId,
      },
    });

    return NextResponse.json(
      { file: createdFile },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error importing file:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
