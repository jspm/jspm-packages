/** @jsx h */

import { h } from "nano-jsx";
import { ServerError } from "#500";

function ServerErrorSSR() {
  return (
    <jspm-packages-500>
      <ServerError />
    </jspm-packages-500>
  );
}

export { ServerErrorSSR };
