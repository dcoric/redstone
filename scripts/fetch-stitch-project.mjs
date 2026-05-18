import { stitch } from '@google/stitch-sdk';
import fs from 'fs/promises';
import path from 'path';

const projectId = process.argv[2] || '17541452071519782034';
const outDir = path.join(process.cwd(), '.stitch-export', projectId);

const project = stitch.project(projectId);
const screens = await project.screens();

await fs.mkdir(outDir, { recursive: true });

const manifest = [];

for (const screen of screens) {
  const [htmlUrl, imageUrl] = await Promise.all([
    screen.getHtml().catch(() => null),
    screen.getImage().catch(() => null),
  ]);

  const entry = {
    screenId: screen.screenId,
    id: screen.id,
    htmlUrl,
    imageUrl,
  };
  manifest.push(entry);

  const safeName = screen.screenId || screen.id || `screen-${manifest.length}`;
  const dir = path.join(outDir, safeName);
  await fs.mkdir(dir, { recursive: true });

  if (htmlUrl) {
    const res = await fetch(htmlUrl);
    const html = await res.text();
    await fs.writeFile(path.join(dir, 'screen.html'), html);
    entry.htmlFile = `screen.html`;
  }

  if (imageUrl) {
    const res = await fetch(imageUrl);
    const buf = Buffer.from(await res.arrayBuffer());
    await fs.writeFile(path.join(dir, 'screenshot.png'), buf);
    entry.imageFile = 'screenshot.png';
  }

  console.log(JSON.stringify(entry));
}

await fs.writeFile(
  path.join(outDir, 'manifest.json'),
  JSON.stringify({ projectId, screens: manifest }, null, 2)
);

console.error(`Exported ${manifest.length} screens to ${outDir}`);
