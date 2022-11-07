/** @jsx h */

import { h } from "nano-jsx";
import { SearchSuggestion } from "#search-suggestion";
import type { Suggestion } from "#search-suggestion";

type Suggestions = {
  objects: Suggestion[];
  total: number;
};

type Prop = Suggestions & {
  size: number;
  searchTerm: string;
  searchKeyword: string;
  page: number;
};

function SearchSuggestions({ objects }: Prop) {
  const open = objects.length > 0 ? { open: true } : {};
  return (
    <dialog {...open}>
      {objects.map((suggestion) => (
        <jspm-packages-search-suggestion>
          <SearchSuggestion suggestion={suggestion} />
        </jspm-packages-search-suggestion>
      ))}
    </dialog>
  );
}

export { SearchSuggestions };
export type { Suggestions, Prop as SearchSuggestionsProps };
