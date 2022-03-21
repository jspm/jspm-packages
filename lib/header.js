/** @jsx h */ import nano, { h } from "nano-jsx";
import { Logo } from "./logo.js";
import { Search } from "./search.js";
import { Nav } from "./nav.js";
const { Helmet  } = nano;
function Header({ generatorHash ="" , dependencies =[] , open , toggleImportmapDialog  }) {
    return /*#__PURE__*/ h("jspm-header", null, /*#__PURE__*/ h("header", {
        class: "header"
    }, /*#__PURE__*/ h("div", {
        class: "header"
    }, /*#__PURE__*/ h(Logo, null), /*#__PURE__*/ h(Search, null)), /*#__PURE__*/ h(Nav, {
        generatorHash: generatorHash,
        dependencies: dependencies,
        open: open,
        toggleImportmapDialog: toggleImportmapDialog
    })), /*#__PURE__*/ h(Helmet, null, /*#__PURE__*/ h("style", {
        "data-component-name": "header"
    }, `
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              flex-wrap: wrap;
              align-content: center;
            }

            @media(max-width: 768px) {
              .header {
                justify-content: center;
              }
            }
          `)));
}
export { Header };


//# sourceMappingURL=header.js.map