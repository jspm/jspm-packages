/** @jsx h */
import { Fragment, h } from "nano-jsx";
import { Header } from "@jspm/packages/header";
import { ImportMapDialog } from "@jspm/packages/importmap-dialog";
import { Search } from "@jspm/packages/search";

function Home() {
  const features = [
    "Import-maps",
    "Edge caching",
    "Pre-transpiled",
    "Module water-fall optimization",
  ];

  return (
    <Fragment>
      <jspm-packages-importmap-dialog>
        <ImportMapDialog />
      </jspm-packages-importmap-dialog>
      <jspm-packages-header>
        <Header search={false} />
      </jspm-packages-header>
      <main>
        <h1>
          A CDN to serve NPM packages as standard ECMA Script &amp; Importmaps.
        </h1>
        <jspm-packages-search>
          <Search />
        </jspm-packages-search>
        <ul class="jspm-features">
          {features.map((feat) => (
            <li>
              <svg viewBox="0 0 877.7142857142857 1024" class="check-icon">
                <path d="M733.714 419.429c0-9.714-3.429-19.429-10.286-26.286l-52-51.429c-6.857-6.857-16-10.857-25.714-10.857s-18.857 4-25.714 10.857l-233.143 232.571-129.143-129.143c-6.857-6.857-16-10.857-25.714-10.857s-18.857 4-25.714 10.857l-52 51.429c-6.857 6.857-10.286 16.571-10.286 26.286s3.429 18.857 10.286 25.714l206.857 206.857c6.857 6.857 16.571 10.857 25.714 10.857 9.714 0 19.429-4 26.286-10.857l310.286-310.286c6.857-6.857 10.286-16 10.286-25.714zM877.714 512c0 242.286-196.571 438.857-438.857 438.857s-438.857-196.571-438.857-438.857 196.571-438.857 438.857-438.857 438.857 196.571 438.857 438.857z">
                </path>
              </svg>
              {feat}
            </li>
          ))}
        </ul>
      </main>
    </Fragment>
  );
}

export { Home };
