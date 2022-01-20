import { h, Helmet } from "nano-jsx";
import { Logo } from "./logo.js";
import { Search } from "./search.js";
import { Nav } from "./nav.js";
function Header() {
    return(/*#__PURE__*/ h("div", null, /*#__PURE__*/ h("header", {
        class: "header"
    }, /*#__PURE__*/ h("div", {
        class: "header"
    }, /*#__PURE__*/ h(Logo, null), /*#__PURE__*/ h(Search, null)), /*#__PURE__*/ h(Nav, null)), /*#__PURE__*/ h(Helmet, null, /*#__PURE__*/ h("style", {
        "data-page-name": "header"
    }, "\n            .header {\n              display: flex;\n              justify-content: space-between;\n              align-items: center;\n              flex-wrap: wrap;\n              align-content: center;\n            }\n\n            @media(max-width: 768px) {\n              .header {\n                justify-content: center;\n              }\n            }\n          "))));
}
export { Header };


//# sourceMappingURL=header.js.map