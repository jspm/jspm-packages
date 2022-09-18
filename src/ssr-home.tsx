/** @jsx h */
import { h } from "nano-jsx";
import { FEATURED_PACKAGES } from "#featured-packages-list";
import { Home } from "#home";

function SSRHome() {
  return (
      <jspm-packages-home>
        <Home packages={FEATURED_PACKAGES} />
      </jspm-packages-home>
  );
}

export { SSRHome };
