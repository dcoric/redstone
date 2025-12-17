import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create a test user
  const hashedPassword = await bcrypt.hash('password123', 10);

  const user = await prisma.user.upsert({
    where: { email: 'test@redstone.app' },
    update: {},
    create: {
      email: 'test@redstone.app',
      password: hashedPassword,
      name: 'Test User',
    },
  });

  console.log('✅ Created test user:', user.email);

  // Create a root folder
  const rootFolder = await prisma.folder.create({
    data: {
      name: 'My Notes',
      userId: user.id,
    },
  });

  console.log('✅ Created root folder:', rootFolder.name);

  // Create a sample file
  const file = await prisma.file.create({
    data: {
      title: 'Welcome to Redstone',
      content: `# Welcome to Redstone

This is your first note! Redstone is an Obsidian-like knowledge management application.

## Features

- 📝 Markdown editing
- 📁 Folder organization
- 🏷️ Tag system
- 🔄 Multi-device sync
- 📱 Web and mobile apps

Start writing your thoughts!`,
      userId: user.id,
      folderId: rootFolder.id,
    },
  });

  console.log('✅ Created sample file:', file.title);

  // Create a sample tag
  const tag = await prisma.tag.create({
    data: {
      name: 'welcome',
      userId: user.id,
    },
  });

  // Link tag to file
  await prisma.fileTag.create({
    data: {
      fileId: file.id,
      tagId: tag.id,
    },
  });

  console.log('✅ Created and linked tag:', tag.name);

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
