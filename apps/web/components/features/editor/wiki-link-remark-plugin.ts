import { visit } from "unist-util-visit";
import type { Plugin } from "unified";

interface WikiLinkOptions {
  onLinkClick?: (title: string) => void;
}

const wikiLinkPlugin: Plugin<[WikiLinkOptions], any> = function () {
  const transformer = (tree: any) => {
    visit(tree, "text", (node: any, index, parent) => {
      if (!parent || !index) return;

      const value = node.value;
      const parts: any[] = [];
      const regex = /\[\[([^\]]+)\]\]/g;
      let lastIndex = 0;
      let match;

      while ((match = regex.exec(value)) !== null) {
        if (match.index > lastIndex) {
          parts.push({
            type: "text",
            value: value.slice(lastIndex, match.index),
          });
        }

        parts.push({
          type: "link",
          url: `#wiki-link:${encodeURIComponent(match[1])}`,
          children: [
            {
              type: "text",
              value: match[1],
            },
          ],
        });

        lastIndex = regex.lastIndex;
      }

      if (parts.length > 0) {
        if (lastIndex < value.length) {
          parts.push({
            type: "text",
            value: value.slice(lastIndex),
          });
        }
        parent.children.splice(index, 1, ...parts);
      }
    });
  };

  return transformer;
};

export default wikiLinkPlugin;
