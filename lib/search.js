import nano, { h } from "nano-jsx";
const { Helmet  } = nano;
function Search(params) {
    return /*#__PURE__*/ h("jspm-search", null, /*#__PURE__*/ h("form", null, /*#__PURE__*/ h("input", {
        type: "search",
        autofocus: "true",
        placeholder: "Package",
        autocomplete: "on",
        class: "header-textinput search_input",
        name: "q"
    }), /*#__PURE__*/ h("button", {
        class: "search_button"
    }, /*#__PURE__*/ h("span", null, "Import"))), /*#__PURE__*/ h(Helmet, null, /*#__PURE__*/ h("style", {
        "data-component-name": "jspm-nav"
    }, `
          jspm-search, jspm-search form{
            display: flex;
          }
          .search_button {
            color: var(--dl-color-gray-black);
            display: inline-block;
            padding: 0.5rem 1rem;
            border-color: var(--dl-color-gray-black);
            border-width: 1px;
            height: 40px;
            display: flex;
            align-items: center;
            border-width: 0px;
            padding-left: var(--dl-space-space-oneandhalfunits);
            padding-right: var(--dl-space-space-oneandhalfunits);
            background-color: var(--dl-color-primary-js-primary);
            border-top-left-radius: none;
            border-top-right-radius: var(--dl-radius-radius-radius8);
            border-bottom-left-radius: none;
            border-bottom-right-radius: var(--dl-radius-radius-radius8);
        }
          
          .search_input {
            color: var(--dl-color-gray-black);
            cursor: auto;
            padding: 0.5rem 1rem;
            border-color: var(--dl-color-gray-black);
            border-width: 1px;
            background-color: var(--dl-color-gray-white);
            height: 40px;
            padding: var(--dl-space-space-halfunit);
            max-width: 500px;
            border-color: var(--dl-color-jspm-placeholder);
            background-color: var(--dl-color-jspm-placeholder);
            border-top-left-radius: var(--dl-radius-radius-radius8);
            border-bottom-left-radius: var(--dl-radius-radius-radius8);
          }
          jspm-nav nav ul {
              display: flex;
            list-style: none;
          }
          jspm-nav nav ul li{
              margin: 20px;
          }
          `)));
}
export { Search };


//# sourceMappingURL=search.js.map