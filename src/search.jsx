/** @jsx h */
import { h } from "nano-jsx";
import { FEATURED_PACKAGES } from "./featured-packages-list.js";

function Search() {
  return (
    <jspm-search>
      <form>
        <datalist id="featured-packages">
          {FEATURED_PACKAGES.map(FEATURED_PACKAGE => (
            <option value={FEATURED_PACKAGE} />
          ))}
        </datalist>
        <input
          type="search"
          list="featured-packages"
          autofocus="true"
          placeholder="Package"
          autocomplete="on"
          class="header-textinput search_input"
          name="q"
        />
        <button class="search_button">
          <span>Import</span>
        </button>
      </form>
    </jspm-search>
  );
}

export { Search };
