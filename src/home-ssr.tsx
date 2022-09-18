/** @jsx h */

import { h } from "nano-jsx";
import { Home } from "#home";

function HomeSSR() {
  return (
    <jspm-packages-home>
      <Home />
    </jspm-packages-home>
  );
}

export { HomeSSR };
