/** @jsx h */
import { h, hydrate } from "nano-jsx";



async function hydrateRoot() {
  const mountElement = document.querySelector("jspm-package-root");

  if (mountElement) {
    const { exports, name, version, features, links, maintainers, readme } = mountElement.dataset;
    const parsedExports = exports ? JSON.parse(exports) : [];
    const { DomRoot } = await import("@jspm/packages/dom-root");
    
    hydrate(
      <DomRoot name={name} version={version} exports={parsedExports} features={JSON.parse(features)} links={JSON.parse(links)} maintainers={JSON.parse(maintainers)} readme={readme} />,
      mountElement,
    );
  }
}

if (typeof globalThis.document !== "undefined") {
  hydrateRoot();
}
