import { h, hydrate } from "nano-jsx";
//import { Exports } from "./exports.js";

if (typeof globalThis.document !== "undefined") {
  const mountElement = document.querySelector("jspm-package-aside-exports");
  const { exports, name, version } = mountElement.dataset;
  // hydrate(
  //   <Exports exports={JSON.parse(exports)} name={name} version={version} />,
  //   mountElement,
  // );
}
