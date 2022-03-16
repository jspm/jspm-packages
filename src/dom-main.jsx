/** @jsx h */
import { h, hydrate } from "nano-jsx";

async function hydrateHero() {
  const mountElement = document.querySelector("jspm-package-hero");

  if (mountElement) {
    const { exports, name, version, description, updated, types } = mountElement.dataset;
    const parsedExports = exports ? JSON.parse(exports) : [];
    const { Hero } = await import("./hero.js");
    hydrate(
      <Hero
        exports={parsedExports}
        name={name}
        version={version}
        description={description}
        updated={updated}
        types={types}
      />,
      mountElement,
    );
  }
}

async function hydrateExports() {
  const mountElement = document.querySelector("jspm-aside-exports");

  if (mountElement) {
    const { exports, name, version } = mountElement.dataset;
    const parsedExports = exports ? JSON.parse(exports) : [];
    const { Exports } = await import("./exports.js");
    hydrate(
      <Exports
        exports={parsedExports}
        name={name}
        version={version}
      />,
      mountElement,
    );
  }
}

async function hydrateRoot() {
  const mountElement = document.querySelector("jspm-package-root");

  if (mountElement) {
    const { exports, name, version, features, links, maintainers } = mountElement.dataset;
    const parsedExports = exports ? JSON.parse(exports) : [];
    const { DomRoot } = await import("./dom-root.js");
    
    hydrate(
      <DomRoot name={name} version={version} exports={parsedExports} features={JSON.parse(features)} links={JSON.parse(links)} maintainers={JSON.parse(maintainers)} />,
      mountElement,
    );
  }
}

if (typeof globalThis.document !== "undefined") {
  hydrateRoot();
}
