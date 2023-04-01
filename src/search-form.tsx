/** @jsx h */
import { h } from "nano-jsx";
import { FEATURED_PACKAGES } from "#featured-packages-list";

type Props = {
  onSubmit?: SubmitEvent;
  onInput?: (event: InputEvent) => void;
  value?: string;
};

function SearchForm({ onSubmit, onInput, value }: Props) {
  return (
    <form method="GET" action="/search" onSubmit={onSubmit}>
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
        onInput={onInput}
        value={value || ''}
      />

      <button type="submit">Search</button>
    </form>
  );
}

export { SearchForm };
export type { Props as SearchFormProps };
