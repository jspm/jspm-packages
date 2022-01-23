import { h, Helmet } from "nano-jsx";
export function Seperator() {
    return(/*#__PURE__*/ h("div", null, /*#__PURE__*/ h("div", {
        class: "seperator-seperator"
    }, /*#__PURE__*/ h("div", {
        class: "seperator-container"
    }), /*#__PURE__*/ h("div", {
        class: "seperator-container1"
    }), /*#__PURE__*/ h("div", {
        class: "seperator-container2"
    }), /*#__PURE__*/ h("div", {
        class: "seperator-container3"
    })), /*#__PURE__*/ h(Helmet, null, /*#__PURE__*/ h("style", {
        "data-page-name": "seperator"
    }, "\n        .seperator-seperator {\n            flex: 0 0 auto;\n            width: 100%;\n            height: auto;\n            display: flex;\n            margin-top: var(--dl-space-space-unit);\n            align-items: center;\n            margin-bottom: var(--dl-space-space-unit);\n          }\n          .seperator-container {\n            flex: 0 0 auto;\n            width: 50px;\n            height: 8px;\n            display: flex;\n            align-items: flex-start;\n            background-color: var(--dl-color-jspm-500);\n            border-top-left-radius: var(--dl-radius-radius-radius8);\n            border-bottom-left-radius: var(--dl-radius-radius-radius8);\n          }\n          .seperator-container1 {\n            flex: 0 0 auto;\n            width: 50px;\n            height: 8px;\n            display: flex;\n            align-items: flex-start;\n            background-color: var(--dl-color-jspm-400);\n          }\n          .seperator-container2 {\n            flex: 0 0 auto;\n            width: 50px;\n            height: 8px;\n            display: flex;\n            align-items: flex-start;\n            background-color: var(--dl-color-jspm-300);\n          }\n          .seperator-container3 {\n            flex: 0 0 auto;\n            width: 50px;\n            height: 8px;\n            display: flex;\n            align-items: flex-start;\n            background-color: var(--dl-color-jspm-200);\n            border-top-right-radius: var(--dl-radius-radius-radius8);\n            border-bottom-right-radius: var(--dl-radius-radius-radius8);\n          }\n        "))));
}


//# sourceMappingURL=separator.js.map