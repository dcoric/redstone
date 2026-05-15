const WIKI_LINK_REGEX = /\[\[([^\]]+)\]\]/g;

export function extractWikiLinks(content: string): string[] {
  const links: string[] = [];
  let match;
  const regex = new RegExp(WIKI_LINK_REGEX);
  while ((match = regex.exec(content)) !== null) {
    links.push(match[1]);
  }
  return links;
}

export function hasWikiLinks(content: string): boolean {
  return WIKI_LINK_REGEX.test(content);
}

export function validateWikiLinks(
  content: string,
  allFiles: { id: string; title: string }[]
): { valid: boolean; title: string }[] {
  const titles = new Set(allFiles.map((f) => f.title.toLowerCase()));
  return extractWikiLinks(content).map((title) => ({
    title,
    valid: titles.has(title.toLowerCase()),
  }));
}
