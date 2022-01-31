import { h, Helmet } from "nano-jsx";
function Readme(param) {
    var __html = param.__html;
    return(/*#__PURE__*/ h("jspm-readme", null, /*#__PURE__*/ h("div", {
        innerHTML: {
            __dangerousHtml: __html
        }
    }), /*#__PURE__*/ h(Helmet, null, /*#__PURE__*/ h("style", {
        "data-component-name": "jspm-readme"
    }, "\n            jspm-readme img {\n              max-width: 100%;\n            }\n          "))));
}
export { Readme };


//# sourceMappingURL=readme.js.map