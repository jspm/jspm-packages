import { h, hydrate } from "nano-jsx";
import { ExportsContainer } from "./exports.js";

if (typeof globalThis.document !== "undefined") {
  const mountElement = document.querySelector("jspm-package-aside-exports");
  const { exports, name, version } = mountElement.dataset;
  hydrate(
    <ExportsContainer exports={JSON.parse(exports)} name={name} version={version} />,
    mountElement,
  );
}
