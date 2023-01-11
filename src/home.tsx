/** @jsx h */
import { Fragment, h } from "nano-jsx";
import { Header } from "#header";
import { Search } from "#search";
import { Examples } from "#examples";

type Prop = {
  exampleBrowser?: { input: string; output: string };
};

function Home({ exampleBrowser }: Prop) {
  return (
    <Fragment>
      <section>
        <jspm-packages-importmap-dialog></jspm-packages-importmap-dialog>
      </section>

      <section id="packages-page">
        <section>
          <jspm-packages-header>
            <Header search={false} />
          </jspm-packages-header>
        </section>

        <section>
          <main class="jspm-packages-home-main">
            <h2>
              {/* A CDN to serve NPM packages as standard ECMA Script &amp;
              Importmaps. */}
              {/* JSPM CDN: Unleashing the true power of JavaScript development with import maps, ESM and pre-optimized NPM modules, at scale */}
              JSPM CDN: Unleashing the future of JavaScript development.
            </h2>

            <jspm-packages-search>
              <Search />
            </jspm-packages-search>

            <jspm-packages-examples>
              <Examples browser={exampleBrowser} />
            </jspm-packages-examples>

            <section class="jspm-packages-home-features">
              <article>
                <h3>Importmap</h3>
                <ol>
                  <li>Find NPM package</li>
                  <li>Add package exports to Importmap</li>
                  <li>Download and use the Importmap</li>
                </ol>
              </article>

              <article>
                <h3>Pre-transpiled</h3>
                <p>Common JS pre-transpiled to ESM</p>
              </article>

              <article>
                <h3>Edge caching</h3>
                <p>
                  Production ready, extreamly performant edge caching to serve
                  request closer to user.
                </p>
              </article>

              <article>
                <h3>Module water-fall optimization</h3>
                <p>
                  Dependencies are deduped and statically analysed to avoid
                  delayed discovery and roundtrips to server.
                </p>
              </article>
            </section>
          </main>
        </section>
      </section>
    </Fragment>
  );
}

export { Home };
export type { Prop as HomeProp };
