/** @jsx h */
import { Fragment, h } from "nano-jsx";
import { Header } from "@jspm/packages/header";
import { Search } from "@jspm/packages/search";

function Home() {
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
            <h1>Let's Just Serve Packages and Modules</h1>
            <jspm-packages-search>
              <Search />
            </jspm-packages-search>
            <h2>
              A CDN to serve NPM packages as standard ECMA Script &amp;
              Importmaps.
            </h2>
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
