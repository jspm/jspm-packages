import nano, { h } from "nano-jsx";
const { Helmet  } = nano;
function Readme({ __html  }) {
    return /*#__PURE__*/ h("jspm-readme", null, /*#__PURE__*/ h("div", {
        innerHTML: {
            __dangerousHtml: __html
        }
    }), /*#__PURE__*/ h(Helmet, null, /*#__PURE__*/ h("style", {
        "data-component-name": "jspm-readme"
    }, `
            jspm-readme img {
              max-width: 100%;
            }
          `)));
}
export { Readme };


//# sourceMappingURL=readme.js.map