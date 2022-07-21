/** @jsx h */
import { h } from "nano-jsx";
import { FEATURED_PACKAGES } from "@jspm/packages/featured-packages-list";
import { Home } from "@jspm/packages/home";

function SSRHome() {
  return (
      <jspm-packages-home>
        <Home packages={FEATURED_PACKAGES} />
      </jspm-packages-home>
  );
}

export { SSRHome };
