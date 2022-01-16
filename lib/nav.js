import { h, Helmet } from "nano-jsx";
function Nav() {
    return(/*#__PURE__*/ h("jspm-package-nav", null, /*#__PURE__*/ h("nav", null, /*#__PURE__*/ h("ul", null, /*#__PURE__*/ h("li", null, /*#__PURE__*/ h("a", {
        href: "https://generator.jspm.io"
    }, "Generator")), /*#__PURE__*/ h("li", null, /*#__PURE__*/ h("a", {
        href: "https://jspm.org/docs/cdn"
    }, "Docs")), /*#__PURE__*/ h("li", null, /*#__PURE__*/ h("a", {
        href: "https://jspm.org/sandbox"
    }, "Sandbox")), /*#__PURE__*/ h("li", null, /*#__PURE__*/ h("a", {
        href: "https://github.com/jspm/generator"
    }, "Github")))), /*#__PURE__*/ h(Helmet, null, /*#__PURE__*/ h("style", {
        "data-page-name": "jspm-package-nav"
    }, "\n          jspm-package-nav nav ul {\n              display: flex;\n            list-style: none;\n          }\n          jspm-package-nav nav ul li{\n              margin: 20px;\n          }\n          "))));
}
export { Nav };


//# sourceMappingURL=nav.js.map