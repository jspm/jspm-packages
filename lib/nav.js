import nano, { h } from "nano-jsx";
const { Helmet  } = nano;
function Nav({ generatorHash ="" , dependencies =[] , open , toggleImportmapDialog  }) {
    return /*#__PURE__*/ h("div", null, /*#__PURE__*/ h("nav", null, /*#__PURE__*/ h("ul", {
        class: "nav-list-style"
    }, /*#__PURE__*/ h("li", {
        class: "nav-list-item"
    }, /*#__PURE__*/ h("a", {
        target: "_blank",
        href: `https://generator.jspm.io/${generatorHash}`
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
    }, "Github")), /*#__PURE__*/ h("li", {
        class: "nav-list-item"
    }, /*#__PURE__*/ h("button", {
        class: "toggle-dialog",
        title: "Explore Importmap",
        onClick: toggleImportmapDialog
    }, "[", dependencies === null || dependencies === void 0 ? void 0 : dependencies.length, "]")))), /*#__PURE__*/ h(Helmet, null, /*#__PURE__*/ h("style", {
        "data-component-name": "jspm-nav"
    }, `
          .nav-list-style {
              display: flex;
              list-style: none;
          }

          .nav-list-item {
              margin-right: var(--dl-space-space-twounits);
          }
          .nav-list-item .toggle-dialog{
            background: transparent url('/icon-distributed.png') left center no-repeat;
            background-size: contain;
            padding-left: 25px;
            border: 0;
            cursor: pointer;
            color: crimson;
          }
          `)));
}
export { Nav };


//# sourceMappingURL=nav.js.map