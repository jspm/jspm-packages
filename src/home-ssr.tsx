/** @jsx h */

import { h } from "nano-jsx";
import { Home } from "#home";
import type { HomeProp } from "#home";

function HomeSSR({ exampleBrowser }: HomeProp) {
  return (
    <jspm-packages-home>
      <Home exampleBrowser={exampleBrowser} />
    </jspm-packages-home>
  );
}

export { HomeSSR };
