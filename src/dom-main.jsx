/** @jsx h */
import { h, hydrate } from "nano-jsx";

async function hydrateRoot() {
  const mountElement = document.querySelector("jspm-package-root");

  if (mountElement) {
    const { created, description, downloads, exports, features, license, links, maintainers, name, readme, types, updated, version, versions } =
      mountElement.dataset;
    const parsedExports = exports ? JSON.parse(exports) : [];
    const parsedVersions = versions ? JSON.parse(versions) : [];
    const { DomRoot } = await import("@jspm/packages/dom-root");

    hydrate(
      <DomRoot
        created={created}
        description={description}
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
        versions={parsedVersions}
      />,
      mountElement,
    );
  }
}

if (typeof globalThis.document !== "undefined") {
  hydrateRoot();
}
