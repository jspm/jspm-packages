/** @jsx h */ import nano, { h } from "nano-jsx";
import { Seperator } from "./separator.js";
const { Helmet  } = nano;
function Aside({ license , name: name1 , version , exports , downloads , updated , type , types , features , created , links , maintainers ,  }) {
    return /*#__PURE__*/ h("jspm-aside", null, /*#__PURE__*/ h("aside", null, /*#__PURE__*/ h("jspm-created", null, /*#__PURE__*/ h("h3", null, "Created"), created), /*#__PURE__*/ h("jspm-weekly-updated", null, /*#__PURE__*/ h("h3", null, "Updated"), updated), /*#__PURE__*/ h("jspm-weekly-downloads", null, /*#__PURE__*/ h("h3", null, "Downloads (weekly)"), downloads), /*#__PURE__*/ h("jspm-features", null, /*#__PURE__*/ h("h3", null, "Features"), Object.entries(features).map(([feature, supported])=>/*#__PURE__*/ h("ul", null, /*#__PURE__*/ h("li", {
            "data-feature-supported": supported
        }, feature))
    )), /*#__PURE__*/ h("div", null, /*#__PURE__*/ h("h3", null, "License"), /*#__PURE__*/ h("jspm-license", null, license), /*#__PURE__*/ h(Seperator, null)), /*#__PURE__*/ h("jspm-links", null, /*#__PURE__*/ h("h3", null, "Links"), Object.entries(links).map(([text, link])=>link && /*#__PURE__*/ h("jspm-link", null, /*#__PURE__*/ h("h5", null, text), /*#__PURE__*/ h("a", {
            href: link
        }, link))
    )), /*#__PURE__*/ h("jspm-maintainers", null, /*#__PURE__*/ h("h3", null, "Collaborators"), maintainers.map(({ name , email  })=>/*#__PURE__*/ h("jspm-maintainer", null, /*#__PURE__*/ h("figure", null, /*#__PURE__*/ h("img", {
            src: `https://unavatar.io/${email}`
        })), name)
    ))), /*#__PURE__*/ h(Helmet, null, /*#__PURE__*/ h("style", {
        "data-component-name": "jspm-aside"
    }, `
          jspm-features li{
            padding-inline-start: 1ch;
          }
          jspm-features li[data-feature-supported="true"]{
            list-style-type: '✔';
          }
          jspm-features li[data-feature-supported="false"]{
            list-style-type: '✖';
          }
          jspm-maintainer {
            display: flex;
            justify-content: space-between;
            flex-wrap: nowrap;
            align-content: center;
            align-items: center;
          }
          jspm-maintainer figure{
            width: 80px;
            display: inline-block;
          }
          jspm-maintainer figure img{
            width: 100%;
            display: block;
          }
          `)));
}
export { Aside };


//# sourceMappingURL=aside.js.map