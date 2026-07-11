import { visit } from "unist-util-visit";
import type { Plugin } from "unified";
import type { PhrasingContent, Root } from "mdast";

const wikiLinkPlugin: Plugin<[], Root> = function () {
  return (tree) => {
    visit(tree, "text", (node, index, parent) => {
      if (!parent || index === undefined) return;

      const value = node.value;
      const parts: PhrasingContent[] = [];
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
};

export default wikiLinkPlugin;
