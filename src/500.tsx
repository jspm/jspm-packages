/** @jsx h */
import { Fragment, h } from "nano-jsx";
import { Header } from "#header";
import { Search } from "#search";

function ServerError() {
  return (
    <Fragment>
      <section>
        <jspm-packages-importmap-dialog></jspm-packages-importmap-dialog>
      </section>

      <section id="packages-page">
        <section>
          <jspm-packages-header>
            <Header />
          </jspm-packages-header>
        </section>

        <section>
          <main class="jspm-packages-500-main">
            <h1>Page not found</h1>
            <jspm-packages-search>
              <Search />
            </jspm-packages-search>
            <div class="message-500">
              <p>The page you are looking for is not found.</p>
              <p>
                Please go to <a href="/">Home page</a> or search for another
                package...
              </p>
            </div>
          </main>
        </section>
      </section>
    </Fragment>
  );
}

export { ServerError };
