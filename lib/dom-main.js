import { h, hydrate } from "nano-jsx";
//import { Exports } from "./exports.js";
if (typeof globalThis.document !== "undefined") {
    var mountElement = document.querySelector("jspm-package-aside-exports");
    var _dataset = mountElement.dataset, exports = _dataset.exports, name = _dataset.name, version = _dataset.version;
// hydrate(
//   <Exports exports={JSON.parse(exports)} name={name} version={version} />,
//   mountElement,
// );
}


//# sourceMappingURL=dom-main.js.map