/** @jsx h */
import { h, Fragment } from "nano-jsx";
import { SearchForm } from "#search-form";

function Search() {
  return (
    <Fragment>
      <jspm-packages-search-form>
        <SearchForm />
      </jspm-packages-search-form>
      <jspm-packages-search-suggestions></jspm-packages-search-suggestions>
    </Fragment>
  );
}

export { Search };
