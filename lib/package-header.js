import { h, Helmet } from "nano-jsx";
function PackageHeader(param) {
    var homepage = param.homepage, name = param.name, version = param.version, description = param.description;
    return(/*#__PURE__*/ h("div", null, /*#__PURE__*/ h("div", {
        class: "package-header"
    }, /*#__PURE__*/ h("div", {
        class: "package-info"
    }, /*#__PURE__*/ h("jspm-name", null, /*#__PURE__*/ h("h1", null, /*#__PURE__*/ h("a", {
        href: homepage
    }, name))), /*#__PURE__*/ h("jspm-version", null, version), /*#__PURE__*/ h("jspm-description", null, description))), /*#__PURE__*/ h(Helmet, null, /*#__PURE__*/ h("style", {
        "data-page": "package-header"
    }, "\n        .package-header {\n          display: flex;\n          font-family: \"Major Mono Display\", monospace;\n          flex-wrap: wrap;\n          justify-content: center;\n          align-items: center;\n        }\n        @media(max-width: 479px) {\n          .package-info {\n            text-align: center;\n          }\n        }\n        "))));
}
export { PackageHeader };


//# sourceMappingURL=package-header.js.map