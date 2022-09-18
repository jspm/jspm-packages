/** @jsx h */

import { h } from "nano-jsx";
import { NotFound } from "#404";

function NotFoundSSR() {
  return (
    <jspm-packages-404>
      <NotFound />
    </jspm-packages-404>
  );
}

export { NotFoundSSR };
