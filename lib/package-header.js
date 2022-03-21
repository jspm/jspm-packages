import { h, Helmet } from "nano-jsx";
function PackageHeader({ homepage , name , version , description  }) {
    return /*#__PURE__*/ h("div", null, /*#__PURE__*/ h("div", {
        class: "package-header"
    }, /*#__PURE__*/ h("div", {
        class: "package-info"
    }, /*#__PURE__*/ h("jspm-name", null, /*#__PURE__*/ h("h1", null, /*#__PURE__*/ h("a", {
        href: homepage
    }, name))), /*#__PURE__*/ h("jspm-version", null, version), /*#__PURE__*/ h("jspm-description", null, description))), /*#__PURE__*/ h(Helmet, null, /*#__PURE__*/ h("style", {
        "data-page": "package-header"
    }, `
        .package-header {
          display: flex;
          font-family: "Major Mono Display", monospace;
          flex-wrap: wrap;
          justify-content: center;
          align-items: center;
        }
        @media(max-width: 479px) {
          .package-info {
            text-align: center;
          }
        }
        `)));
}
export { PackageHeader };


//# sourceMappingURL=package-header.js.map