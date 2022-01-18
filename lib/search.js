import { h, Helmet } from "nano-jsx";
function Search(params) {
    return(/*#__PURE__*/ h("jspm-package-search", null, /*#__PURE__*/ h("form", null, /*#__PURE__*/ h("input", {
        type: "search",
        autofocus: "true",
        placeholder: "Package",
        autocomplete: "on",
        class: "header-textinput search_input",
        name: "q"
    }), /*#__PURE__*/ h("button", {
        class: "search_button"
    }, /*#__PURE__*/ h("span", null, "Import"))), /*#__PURE__*/ h(Helmet, null, /*#__PURE__*/ h("style", {
        "data-page-name": "jspm-package-nav"
    }, "\n          jspm-package-search, jspm-package-search form{\n            display: flex;\n          }\n          .search_button {\n            color: var(--dl-color-gray-black);\n            display: inline-block;\n            padding: 0.5rem 1rem;\n            border-color: var(--dl-color-gray-black);\n            border-width: 1px;\n            height: 40px;\n            display: flex;\n            align-items: center;\n            border-width: 0px;\n            padding-left: var(--dl-space-space-oneandhalfunits);\n            padding-right: var(--dl-space-space-oneandhalfunits);\n            background-color: var(--dl-color-primary-js-primary);\n            border-top-left-radius: none;\n            border-top-right-radius: var(--dl-radius-radius-radius8);\n            border-bottom-left-radius: none;\n            border-bottom-right-radius: var(--dl-radius-radius-radius8);\n        }\n          \n          .search_input {\n            color: var(--dl-color-gray-black);\n            cursor: auto;\n            padding: 0.5rem 1rem;\n            border-color: var(--dl-color-gray-black);\n            border-width: 1px;\n            background-color: var(--dl-color-gray-white);\n            height: 40px;\n            padding: var(--dl-space-space-halfunit);\n            max-width: 500px;\n            border-color: var(--dl-color-jspm-placeholder);\n            background-color: var(--dl-color-jspm-placeholder);\n            border-top-left-radius: var(--dl-radius-radius-radius8);\n            border-bottom-left-radius: var(--dl-radius-radius-radius8);\n          }\n          jspm-package-nav nav ul {\n              display: flex;\n            list-style: none;\n          }\n          jspm-package-nav nav ul li{\n              margin: 20px;\n          }\n          "))));
}
export { Search };


//# sourceMappingURL=search.js.map