import { chromium } from 'playwright';
import { mkdir } from 'fs/promises';
import path from 'path';

const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
const outDir = path.join(process.cwd(), 'docs/screenshots');

async function shot(page, name, options = {}) {
  const file = path.join(outDir, name);
  await page.screenshot({ path: file, ...options });
  console.log('Wrote', file);
}

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  colorScheme: 'dark',
});
const page = await context.newPage();

await mkdir(outDir, { recursive: true });

const goto = (url) => page.goto(url, { waitUntil: 'domcontentloaded' });

await goto(`${baseUrl}/auth/signin`);
await page.waitForTimeout(500);
await shot(page, '01-signin.png');

await goto(`${baseUrl}/auth/signup`);
await page.waitForTimeout(500);
await shot(page, '05-signup.png');

await goto(`${baseUrl}/auth/signin`);
await page.waitForSelector('#email');
await page.fill('#email', 'test@redstone.app');
await page.fill('#password', 'password123');
await Promise.all([
  page.waitForSelector('[placeholder="Search knowledge..."]', { timeout: 20000 }),
  page.click('button[type="submit"]'),
]);
await page.waitForTimeout(1000);
await shot(page, '02-home.png', { fullPage: true });

const fileLink = page.getByRole('button', { name: /Open / }).first();
if (await fileLink.count()) {
  await fileLink.click();
  await page.waitForTimeout(1500);
  await shot(page, '03-file-editor.png', { fullPage: true });
}

await goto(`${baseUrl}/graph`);
await page.waitForTimeout(2000);
await shot(page, '04-graph-view.png');

await browser.close();
