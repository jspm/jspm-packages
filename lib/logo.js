import { h } from "nano-jsx";
function Logo(param) {
    var name = param.name, version = param.version;
    return(/*#__PURE__*/ h("jspm-package-logo", null, /*#__PURE__*/ h("div", {
        class: "scene"
    }, /*#__PURE__*/ h("div", {
        class: "cube show-top"
    }, /*#__PURE__*/ h("div", {
        class: "cube__face cube__face--front"
    }, name), /*#__PURE__*/ h("div", {
        class: "cube__face cube__face--back"
    }), /*#__PURE__*/ h("div", {
        class: "cube__face cube__face--right"
    }, version), /*#__PURE__*/ h("div", {
        class: "cube__face cube__face--left"
    }), /*#__PURE__*/ h("div", {
        class: "cube__face cube__face--top"
    }, /*#__PURE__*/ h("a", {
        href: "/"
    }, "JSPM")), /*#__PURE__*/ h("div", {
        class: "cube__face cube__face--bottom"
    })))));
}
export { Logo };


//# sourceMappingURL=logo.js.map