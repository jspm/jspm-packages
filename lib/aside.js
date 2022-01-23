import { h, Helmet } from "nano-jsx";
import { Seperator } from "./separator.js";
import { Exports } from "./exports.js";
function Aside(param) {
    var license = param.license, name = param.name, version = param.version, exports = param.exports;
    return(/*#__PURE__*/ h("jspm-package-aside", null, /*#__PURE__*/ h("aside", null, /*#__PURE__*/ h("div", null, /*#__PURE__*/ h("h3", null, "License"), /*#__PURE__*/ h("jspm-package-license", null, license), /*#__PURE__*/ h(Seperator, null)), /*#__PURE__*/ h("jspm-package-aside-exports", {
        "data-exports": JSON.stringify(exports),
        "data-name": name,
        "data-version": version
    }, /*#__PURE__*/ h(Exports, {
        exports: exports,
        name: name,
        version: version
    })))));
}
export { Aside };


//# sourceMappingURL=aside.js.map