import { h, Helmet } from "nano-jsx";
function Header() {
    return(/*#__PURE__*/ h("div", null, /*#__PURE__*/ h("div", {
        class: "header-header",
        id: "app-header"
    }, /*#__PURE__*/ h("div", {
        class: "header-container"
    }, /*#__PURE__*/ h("a", {
        href: "/",
        class: "header-logo"
    }), /*#__PURE__*/ h("img", {
        alt: "image",
        src: "https://jspm-registry.teleporthq.app/playground_assets/jspm.png",
        class: "header-image"
    }), /*#__PURE__*/ h("h1", {
        class: "jspmheaderlogo"
    }, /*#__PURE__*/ h("span", null, "JSPM"))), /*#__PURE__*/ h("div", {
        class: "header-search"
    }, /*#__PURE__*/ h("input", {
        type: "text",
        autofocus: "true",
        placeholder: "Search for packages...",
        autocomplete: "on",
        class: "header-textinput search_input"
    }), /*#__PURE__*/ h("button", {
        class: "search_button"
    }, /*#__PURE__*/ h("span", null, "Search")))), /*#__PURE__*/ h("div", {
        class: "header-container1"
    }, /*#__PURE__*/ h("span", {
        class: "header-text1"
    }, /*#__PURE__*/ h("span", null, "Generator")), /*#__PURE__*/ h("span", {
        class: "header-text2"
    }, /*#__PURE__*/ h("span", null, "Docs")), /*#__PURE__*/ h("span", {
        class: "header-text3"
    }, /*#__PURE__*/ h("span", null, "Faq")), /*#__PURE__*/ h("img", {
        alt: "image",
        src: "https://jspm-registry.teleporthq.app/playground_assets/github.svg",
        class: "header-image1"
    })), /*#__PURE__*/ h(Helmet, null, /*#__PURE__*/ h("style", {
        "data-page-name": "header"
    }, "\n          .search_button {\n              color: var(--dl-color-gray-black);\n              display: inline-block;\n              padding: 0.5rem 1rem;\n              border-color: var(--dl-color-gray-black);\n              border-width: 1px;\n              height: 40px;\n              display: flex;\n              align-items: center;\n              border-width: 0px;\n              padding-left: var(--dl-space-space-oneandhalfunits);\n              padding-right: var(--dl-space-space-oneandhalfunits);\n              background-color: var(--dl-color-primary-js-primary);\n              border-top-left-radius: none;\n              border-top-right-radius: var(--dl-radius-radius-radius8);\n              border-bottom-left-radius: none;\n              border-bottom-right-radius: var(--dl-radius-radius-radius8);\n          }\n            \n            .search_input {\n              color: var(--dl-color-gray-black);\n              cursor: auto;\n              padding: 0.5rem 1rem;\n              border-color: var(--dl-color-gray-black);\n              border-width: 1px;\n              background-color: var(--dl-color-gray-white);\n              height: 40px;\n              padding: var(--dl-space-space-halfunit);\n              max-width: 500px;\n              border-color: var(--dl-color-jspm-placeholder);\n              background-color: var(--dl-color-jspm-placeholder);\n              border-top-left-radius: var(--dl-radius-radius-radius8);\n              border-bottom-left-radius: var(--dl-radius-radius-radius8);\n            }\n\n          .header-header {\n              width: 100%;\n              display: flex;\n              margin-top: var(--dl-space-space-oneandhalfunits);\n              align-items: center;\n              margin-bottom: var(--dl-space-space-oneandhalfunits);\n              flex-direction: row;\n              justify-content: space-between;\n            }\n            .header-container {\n              display: flex;\n              align-items: center;\n              flex-direction: row;\n              justify-content: center;\n            }\n\n            .header-logo {\n              display: flex;\n              align-items: center;\n              margin-right: var(--dl-space-space-unit);\n              flex-direction: row;\n              justify-content: center;\n              text-decoration: none;\n              color: var(--dl-color-gray-black);\n            }\n\n            .header-logo:visited {\n              text-decoration: none;\n            }\n\n            .header-image {\n              width: 32px;\n              object-fit: cover;\n            }\n            .header-search {\n              display: flex;\n              align-items: center;\n              flex-direction: row;\n              justify-content: center;\n            }\n            .header-textinput {\n              width: 300px;\n            }\n            .header-container1 {\n              display: flex;\n              align-items: center;\n              flex-direction: row;\n              justify-content: center;\n            }\n            .header-text1 {\n              margin-left: var(--dl-space-space-unit);\n              margin-right: var(--dl-space-space-unit);\n            }\n            .header-text2 {\n              margin-left: var(--dl-space-space-unit);\n              margin-right: var(--dl-space-space-unit);\n            }\n            .header-text3 {\n              margin-left: var(--dl-space-space-unit);\n              margin-right: var(--dl-space-space-unit);\n            }\n            .header-image1 {\n              width: 35px;\n              object-fit: cover;\n            }\n            @media(max-width: 767px) {\n              .header-header {\n                flex-wrap: wrap;\n                flex-direction: column;\n              }\n              .header-container {\n                margin-bottom: var(--dl-space-space-unit);\n              }\n              .header-container1 {\n                margin-top: var(--dl-space-space-unit);\n              }\n              .header-container {\n                width: 100%;\n              }\n            }\n            @media(max-width: 479px) {\n              .header-container {\n                flex-wrap: wrap;\n              }\n              .header-logo {\n                margin-left: var(--dl-space-space-unit);\n                margin-right: var(--dl-space-space-unit);\n                margin-bottom: var(--dl-space-space-unit);\n              }\n              .header-search {\n                margin-bottom: var(--dl-space-space-unit);\n              }\n              .header-textinput {\n                width: auto;\n              }\n            }\n          "))));
}
export { Header };


//# sourceMappingURL=header.js.map