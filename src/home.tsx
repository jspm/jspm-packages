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
              {
                /* A CDN to serve NPM packages as standard ECMA Script &amp;
              Importmaps. */
              }
              {/* JSPM CDN: Unleashing the true power of JavaScript development with import maps, ESM and pre-optimized NPM modules, at scale */}
              Unleashing the future of JavaScript development.
            </h2>

            {
              /* <jspm-packages-search>
              <Search />
            </jspm-packages-search> */
            }

            <jspm-packages-examples>
              <Examples browser={exampleBrowser} />
            </jspm-packages-examples>

            <section class="jspm-packages-home-features">
              <jspm-packages-featured-feature>
                <article>
                  <h3>What is an &ldquo;importmap&rdquo;?</h3>
                  <jspm-packages-featured-feature-content>
                    <p>
                      Importmap(s) simplify the management of JavaScript module
                      dependencies, making it easier to import modules from
                      different locations without specifying the entire URL each
                      time.
                    </p>
                    <p>
                      While not yet widely supported by all browsers, it can be
                      used with{" "}
                      <a
                        class="code"
                        href="https://github.com/guybedford/es-module-shims"
                      >
                        es-module-shims
                      </a>.
                    </p>
                    <p>
                      As the web continues to evolve, importmap(s) are likely to
                      become an increasingly important tool for web developers.
                    </p>
                  </jspm-packages-featured-feature-content>
                </article>
              </jspm-packages-featured-feature>
              <jspm-packages-cdn-features>
                <h3>Advantage of JSPM CDN</h3>
                <jspm-packages-cdn-features-content>
                  <article>
                    <h4>Comprehensive</h4>
                    <p>Every NPM package, Every Version, in real time.</p>
                  </article>

                  <article>
                    <h4>Pre-transpiled</h4>
                    <p>
                      Common JS modules, pre-transpiled to ESM, using JSPM
                      builder.
                    </p>
                  </article>

                  <article>
                    <h4>Edge caching</h4>
                    <p>
                      Production ready, extreamly performant edge caching to
                      serve request closer to user.
                    </p>
                  </article>

                  <article>
                    <h4>Module water-fall optimization</h4>
                    <p>
                      Dependencies are deduped and statically analysed to avoid
                      delayed discovery and roundtrips to server.
                    </p>
                  </article>
                </jspm-packages-cdn-features-content>
              </jspm-packages-cdn-features>
            </section>
          </main>
        </section>
      </section>
    </Fragment>
  );
}

export { Home };
export type { Prop as HomeProp };
