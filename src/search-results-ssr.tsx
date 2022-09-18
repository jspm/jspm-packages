/** @jsx h */
import { h } from "nano-jsx";
import { SearchResults } from "#search-results";
import type { SearchResultsProp } from "#search-results";

function SearchResultsSSR({
  objects,
  total,
  size,
  searchTerm,
  searchKeyword,
  page,
}: SearchResultsProp) {
  return (
    <jspm-packages-search-results>
      <SearchResults
        objects={objects}
        total={total}
        size={size}
        searchTerm={searchTerm}
        searchKeyword={searchKeyword}
        page={page}
      />
    </jspm-packages-search-results>
  );
}

export { SearchResultsSSR };
