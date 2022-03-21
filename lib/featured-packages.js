/** @jsx h */ import nano, { h } from "nano-jsx";
const { Helmet  } = nano;
function FeaturedPackages({ packages =[]  }) {
    return /*#__PURE__*/ h("div", {
        id: "featured-packages"
    }, /*#__PURE__*/ h("ul", {
        class: "list-style"
    }, packages.map(({ name , description , version  })=>{
        return /*#__PURE__*/ h("li", {
            class: "package-item-wrapper"
        }, /*#__PURE__*/ h("a", {
            class: "package-name",
            href: `/package/${name}@${version}`
        }, name, " ", /*#__PURE__*/ h("span", {
            class: "package-version"
        }, version)), /*#__PURE__*/ h("span", {
            class: "description"
        }, description));
    })), /*#__PURE__*/ h(Helmet, null, /*#__PURE__*/ h("style", {
        "data-component-name": "featured-packages"
    }, `
          .list-style {
            list-style: none;
            padding-left: 0px;
            margin: 0px;
            width: 100%;
          }
          
          .package-item-wrapper {
            font-weight: 200;
            margin: var(--dl-space-space-unit);
          }

          .package-version {
            font-weight: 200;
            font-size: var(--dl-space-space-unit);
          }

          .package-name {
            display: block;
            font-size: var(--dl-space-space-oneandhalfunits);
            font-family: 'Inter';
            font-weight: 400;
            margin-bottom: var(--dl-space-space-halfunit);
          }

          .description {
            overflow: hidden;
            white-space: normal;
            word-break: break-word;
            line-height: 1.5;
          }

        `)));
}
export { FeaturedPackages };


//# sourceMappingURL=featured-packages.js.map