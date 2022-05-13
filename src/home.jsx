/** @jsx h */
import { h } from "nano-jsx";
import { Header } from "@jspm/packages/header";
import { Search } from "@jspm/packages/search";

function Home() {
  return (
    <jspm-home>
      <jspm-home-header>
        <Header search={false} />
      </jspm-home-header>

      <jspm-home-main>
        <main>
          <jspm-home-hero>
            <h1>A CDN to serve NPM packages as standard ECMA Script &amp; Importmaps.</h1>
            <Search />
          </jspm-home-hero>
        </main>
      </jspm-home-main>
    </jspm-home>
  );
}

export { Home };
