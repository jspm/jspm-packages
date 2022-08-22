/** @jsx h */
import { h } from "nano-jsx";
import { FEATURED_PACKAGES } from "@jspm/packages/featured-packages-list";

function Search() {
  return (
    <form method="GET" action="/search">
      <datalist id="featured-packages">
        {FEATURED_PACKAGES.map((FEATURED_PACKAGE) => (
          <option value={FEATURED_PACKAGE} />
        ))}
      </datalist>
      <input
        type="search"
        list="featured-packages"
        autofocus="true"
        placeholder="Package"
        autocomplete="on"
        pattern="(\w+:)?(@[^\/:\\]+\/)?[^\/:\\]+(@[^\/:]+)?(\/.*[^\/])?"
        name="q"
      />
      <button type="submit">
        Search
      </button>
    </form>
  );
}

export { Search };
