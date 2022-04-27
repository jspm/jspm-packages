/** @jsx h */
import { h, hydrate } from "nano-jsx";

async function hydrateRoot() {
  const mountElement = document.querySelector("jspm-package-root");

  if (mountElement) {
    const { created, downloads, exports, features, license, links, maintainers, name, readme, types, updated, version } =
      mountElement.dataset;
    const parsedExports = exports ? JSON.parse(exports) : [];
    const { DomRoot } = await import("@jspm/packages/dom-root");

    hydrate(
      <DomRoot
        created={created}
        downloads={downloads}
        exports={parsedExports}
        features={JSON.parse(features)}
        license={license}
        links={JSON.parse(links)}
        name={name}
        readme={readme}
        maintainers={JSON.parse(maintainers)}
        types={types}
        updated={updated}
        version={version}
      />,
      mountElement,
    );
  }
}

if (typeof globalThis.document !== "undefined") {
  hydrateRoot();
}
