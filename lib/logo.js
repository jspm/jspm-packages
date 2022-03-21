/** @jsx h */ import nano, { h } from "nano-jsx";
const { Helmet  } = nano;
function Logo({ name , version  }) {
    return /*#__PURE__*/ h("jspm-logo", null, /*#__PURE__*/ h("h1", null, /*#__PURE__*/ h("a", {
        href: "/"
    }, "JSPM")), /*#__PURE__*/ h(Helmet, null, /*#__PURE__*/ h("style", {
        "data-component-name": "header"
    }, `
            jspm-logo {
              margin-right: var(--dl-space-space-unit);
            }

            jspm-logo h1 a {
              background: url(https://jspm.org/jspm.png) no-repeat left center;
              color: var(--dl-color-gray-black);
              background-size: contain;
              padding-left: 2.5rem;
            }
          `)));
}
export { Logo };


//# sourceMappingURL=logo.js.map