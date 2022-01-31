/** @jsx h */ import { h, Helmet } from "nano-jsx";
function Logo(param) {
    var name = param.name, version = param.version;
    return(/*#__PURE__*/ h("jspm-logo", null, /*#__PURE__*/ h("h1", null, /*#__PURE__*/ h("a", {
        href: "/"
    }, "JSPM")), /*#__PURE__*/ h(Helmet, null, /*#__PURE__*/ h("style", {
        "data-component-name": "header"
    }, "\n            jspm-logo {\n              margin-right: var(--dl-space-space-unit);\n            }\n\n            jspm-logo h1 a {\n              background: url(https://jspm.org/jspm.png) no-repeat left center;\n              color: var(--dl-color-gray-black);\n              background-size: contain;\n              padding-left: 2.5rem;\n            }\n          "))));
}
export { Logo };


//# sourceMappingURL=logo.js.map