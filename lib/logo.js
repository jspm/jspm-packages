import { h, Helmet } from "nano-jsx";
function Logo(param) {
    var name = param.name, version = param.version;
    return(/*#__PURE__*/ h("jspm-package-logo", null, /*#__PURE__*/ h("h1", null, /*#__PURE__*/ h("a", {
        href: "/"
    }, "JSPM")), /*#__PURE__*/ h(Helmet, null, /*#__PURE__*/ h("style", {
        "data-page-name": "header"
    }, "\n          jspm-package-logo h1 a {\n            background: url(https://jspm.org/jspm.png) no-repeat left center;\n            color: var(--dl-color-gray-black);\n            background-size: contain;\n            padding-left: 2.5rem;\n          }\n          "))));
}
export { Logo };


//# sourceMappingURL=logo.js.map