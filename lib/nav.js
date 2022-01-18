import { h, Helmet } from "nano-jsx";
function Nav() {
    return(/*#__PURE__*/ h("div", null, /*#__PURE__*/ h("nav", null, /*#__PURE__*/ h("ul", {
        class: "nav-list-style"
    }, /*#__PURE__*/ h("li", {
        class: "nav-list-item"
    }, /*#__PURE__*/ h("a", {
        href: "https://generator.jspm.io"
    }, "Generator")), /*#__PURE__*/ h("li", {
        class: "nav-list-item"
    }, /*#__PURE__*/ h("a", {
        href: "https://jspm.org/docs/cdn"
    }, "Docs")), /*#__PURE__*/ h("li", {
        class: "nav-list-item"
    }, /*#__PURE__*/ h("a", {
        href: "https://jspm.org/sandbox"
    }, "Sandbox")), /*#__PURE__*/ h("li", {
        class: "nav-list-item"
    }, /*#__PURE__*/ h("a", {
        href: "https://github.com/jspm/generator"
    }, "Github")))), /*#__PURE__*/ h(Helmet, null, /*#__PURE__*/ h("style", {
        "data-page-name": "jspm-package-nav"
    }, "\n          .nav-list-style {\n              display: flex;\n              list-style: none;\n          }\n\n          .nav-list-item {\n              margin-right: var(--dl-space-space-twounits);\n          }\n          "))));
}
export { Nav };


//# sourceMappingURL=nav.js.map