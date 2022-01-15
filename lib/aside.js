import { h, Helmet } from "nano-jsx";
import { Seperator } from "./separator.js";
function Aside(param) {
    var license = param.license, files = param.files, name = param.name, version = param.version;
    return(/*#__PURE__*/ h("jspm-package-aside", null, /*#__PURE__*/ h("aside", null, /*#__PURE__*/ h("div", null, /*#__PURE__*/ h("h3", null, "License"), /*#__PURE__*/ h("jspm-package-license", null, license), /*#__PURE__*/ h(Seperator, null)), /*#__PURE__*/ h("ul", {
        class: "package-files"
    }, files === null || files === void 0 ? void 0 : files.map(function(file) {
        /*#__PURE__*/ return h("li", null, /*#__PURE__*/ h("a", {
            target: "_blank",
            href: "https://ga.jspm.io/npm:".concat(name, "@").concat(version, "/").concat(file),
            class: "package-file"
        }, file));
    }))), /*#__PURE__*/ h(Helmet, null, /*#__PURE__*/ h("style", {
        "data-page": "package-files"
    }, "\n          .package-file {\n            display: block;\n            line-height: 1.3;\n          }\n          .package-files {\n            list-style: none;\n            padding-left: 0px;\n            height: 500px;\n            overflow: scroll;\n          }\n          .package-files li {\n            line-height: 1.3;\n          }\n        "))));
}
export { Aside };


//# sourceMappingURL=aside.js.map