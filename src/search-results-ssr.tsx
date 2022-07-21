/** @jsx h */
import { h } from "nano-jsx";
import { SearchResults } from "@jspm/packages/search-results";
import type { SearchResultsProp } from "@jspm/packages/search-results";

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
