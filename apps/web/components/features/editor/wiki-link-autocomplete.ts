import {
  autocompletion,
  completeFromList,
  CompletionContext,
  CompletionSource,
} from "@codemirror/autocomplete";
import { Extension, Prec } from "@codemirror/state";

interface WikiLinkFile {
  id: string;
  title: string;
}

function createWikiLinkSource(files: WikiLinkFile[]): CompletionSource {
  const completions = files.map((file) => ({
    label: `[[${file.title}]]`,
    type: "link" as const,
  }));

  return (context: CompletionContext) => {
    const before = context.matchBefore(/\[\[\w*/);
    if (!before) return null;

    return {
      from: before.from,
      options: completions,
    };
  };
}

function wikiLinkAutocomplete(files: WikiLinkFile[]): Extension {
  return Prec.highest(autocompletion({ override: [createWikiLinkSource(files)] }));
}

export { wikiLinkAutocomplete };
export type { WikiLinkFile };
