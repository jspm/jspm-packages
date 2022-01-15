import { h, Helmet } from "nano-jsx";
function Footer() {
    return(/*#__PURE__*/ h("div", null, /*#__PURE__*/ h("div", {
        class: "footer-container"
    }, /*#__PURE__*/ h("footer", {
        class: "footer-footer"
    }, /*#__PURE__*/ h("div", {
        class: "footer-container1"
    }, /*#__PURE__*/ h("img", {
        alt: "image",
        src: "https://jspm-registry.teleporthq.app/playground_assets/jspm.png",
        class: "footer-image"
    }), /*#__PURE__*/ h("div", {
        class: "footer-container2"
    }, /*#__PURE__*/ h("div", {
        class: "footer-product-container"
    }, /*#__PURE__*/ h("span", {
        class: "footer-text"
    }, "Docs"), /*#__PURE__*/ h("span", {
        class: "footer-text01"
    }, "Get Started"), /*#__PURE__*/ h("span", {
        class: "footer-text02"
    }, "Workspace"), /*#__PURE__*/ h("span", {
        class: "footer-text03"
    }, ".npmrc")), /*#__PURE__*/ h("div", {
        class: "footer-company-container"
    }, /*#__PURE__*/ h("span", {
        class: "footer-text04"
    }, "Community"), /*#__PURE__*/ h("span", {
        class: "footer-text05"
    }, "Getting Started"), /*#__PURE__*/ h("span", {
        class: "footer-text06"
    }, "Workspace"), /*#__PURE__*/ h("span", {
        class: "footer-text07"
    }, ".npmrc")), /*#__PURE__*/ h("div", {
        class: "footer-company-container1"
    }, /*#__PURE__*/ h("span", {
        class: "footer-text08"
    }, "Contributing"), /*#__PURE__*/ h("span", {
        class: "footer-text09"
    }, "Getting Started"), /*#__PURE__*/ h("span", {
        class: "footer-text10"
    }, "Workspace"), /*#__PURE__*/ h("span", {
        class: "footer-text11"
    }, ".npmrc")))), /*#__PURE__*/ h("div", {
        class: "footer-separator"
    }), /*#__PURE__*/ h("div", {
        class: "footer-copyright"
    }, /*#__PURE__*/ h("span", {
        class: "footer-text12"
    }, /*#__PURE__*/ h("span", null, "Copyright \xa9 2015-2021")), /*#__PURE__*/ h("div", {
        class: "footer-socials"
    }, /*#__PURE__*/ h("span", {
        class: "footer-text14"
    }, "Follow Us"), /*#__PURE__*/ h("div", {
        class: "footer-icon-group"
    }, /*#__PURE__*/ h("img", {
        alt: "image",
        src: "https://jspm-registry.teleporthq.app/playground_assets/github.svg",
        class: "footer-image1"
    }), /*#__PURE__*/ h("svg", {
        viewBox: "0 0 950.8571428571428 1024",
        class: "footer-icon"
    }, /*#__PURE__*/ h("path", {
        d: "M925.714 233.143c-25.143 36.571-56.571 69.143-92.571 95.429 0.571 8 0.571 16 0.571 24 0 244-185.714 525.143-525.143 525.143-104.571 0-201.714-30.286-283.429-82.857 14.857 1.714 29.143 2.286 44.571 2.286 86.286 0 165.714-29.143 229.143-78.857-81.143-1.714-149.143-54.857-172.571-128 11.429 1.714 22.857 2.857 34.857 2.857 16.571 0 33.143-2.286 48.571-6.286-84.571-17.143-148-91.429-148-181.143v-2.286c24.571 13.714 53.143 22.286 83.429 23.429-49.714-33.143-82.286-89.714-82.286-153.714 0-34.286 9.143-65.714 25.143-93.143 90.857 112 227.429 185.143 380.571 193.143-2.857-13.714-4.571-28-4.571-42.286 0-101.714 82.286-184.571 184.571-184.571 53.143 0 101.143 22.286 134.857 58.286 41.714-8 81.714-23.429 117.143-44.571-13.714 42.857-42.857 78.857-81.143 101.714 37.143-4 73.143-14.286 106.286-28.571z"
    }))))))), /*#__PURE__*/ h(Helmet, null, /*#__PURE__*/ h("style", {
        "data-page-name": "footer"
    }, "\n        .footer-container {\n            width: 100%;\n            display: flex;\n            position: relative;\n            align-items: flex-start;\n            flex-direction: column;\n            background-color: var(--dl-color-jspm-footer);\n          }\n          .footer-footer {\n            width: 100%;\n            display: flex;\n            max-width: var(--dl-size-size-maxwidth);\n            align-items: center;\n            padding-top: var(--dl-space-space-twounits);\n            padding-left: var(--dl-space-space-threeunits);\n            padding-right: var(--dl-space-space-threeunits);\n            flex-direction: column;\n            padding-bottom: var(--dl-space-space-twounits);\n            justify-content: space-between;\n            background-color: var(--dl-color-gray-900);\n            margin-top: var(--dl-space-space-unit);\n          }\n          .footer-container1 {\n            width: 100%;\n            display: flex;\n            align-items: flex-start;\n            flex-direction: row;\n            justify-content: center;\n          }\n          .footer-image {\n            width: 45px;\n            object-fit: cover;\n            margin-right: var(--dl-space-space-oneandhalfunits);\n          }\n          .footer-container2 {\n            display: flex;\n            align-items: flex-start;\n            margin-right: 5rem;\n            flex-direction: row;\n            justify-content: space-between;\n            flex-wrap: wrap;\n          }\n          .footer-product-container {\n            flex: 0 0 auto;\n            display: flex;\n            align-items: flex-start;\n            margin-right: 5rem;\n            flex-direction: column;\n            justify-content: flex-start;\n          }\n          .footer-text {\n            font-weight: 700;\n            margin-bottom: var(--dl-space-space-oneandhalfunits);\n          }\n          .footer-text01 {\n            margin-bottom: var(--dl-space-space-unit);\n          }\n          .footer-text02 {\n            margin-bottom: var(--dl-space-space-unit);\n          }\n          .footer-text03 {\n            margin-bottom: var(--dl-space-space-unit);\n          }\n          .footer-company-container {\n            flex: 0 0 auto;\n            display: flex;\n            align-items: flex-start;\n            margin-right: 5rem;\n            flex-direction: column;\n            justify-content: flex-start;\n          }\n          .footer-text04 {\n            font-weight: 700;\n            margin-bottom: var(--dl-space-space-oneandhalfunits);\n          }\n          .footer-text05 {\n            margin-bottom: var(--dl-space-space-unit);\n          }\n          .footer-text06 {\n            margin-bottom: var(--dl-space-space-unit);\n          }\n          .footer-text07 {\n            margin-bottom: var(--dl-space-space-unit);\n          }\n          .footer-company-container1 {\n            flex: 0 0 auto;\n            display: flex;\n            align-items: flex-start;\n            flex-direction: column;\n            justify-content: flex-start;\n          }\n          .footer-text08 {\n            font-weight: 700;\n            margin-bottom: var(--dl-space-space-oneandhalfunits);\n          }\n          .footer-text09 {\n            margin-bottom: var(--dl-space-space-unit);\n          }\n          .footer-text10 {\n            margin-bottom: var(--dl-space-space-unit);\n          }\n          .footer-text11 {\n            margin-bottom: var(--dl-space-space-unit);\n          }\n          .footer-separator {\n            width: 100%;\n            height: 1px;\n            margin-top: var(--dl-space-space-twounits);\n            margin-bottom: var(--dl-space-space-twounits);\n            background-color: var(--dl-color-gray-900);\n          }\n          .footer-copyright {\n            flex: 0 0 auto;\n            width: 100%;\n            height: auto;\n            display: flex;\n            align-items: flex-start;\n            justify-content: space-between;\n          }\n          .footer-text12 {\n            align-self: center;\n          }\n          .footer-socials {\n            display: flex;\n            align-items: center;\n            flex-direction: row;\n            justify-content: flex-start;\n          }\n          .footer-text14 {\n            font-style: normal;\n            font-weight: 400;\n            margin-right: var(--dl-space-space-unit);\n            margin-bottom: 0px;\n          }\n          .footer-icon-group {\n            display: flex;\n            align-items: center;\n            flex-direction: row;\n            justify-content: space-between;\n          }\n          .footer-image1 {\n            width: var(--dl-size-size-xsmall);\n            height: var(--dl-size-size-xsmall);\n            object-fit: cover;\n            margin-right: var(--dl-space-space-unit);\n          }\n          .footer-icon {\n            width: var(--dl-size-size-xsmall);\n            height: var(--dl-size-size-xsmall);\n            margin-left: 0px;\n            margin-right: 0px;\n          }\n          \n          @media(max-width: 991px) {\n            .footer-footer {\n              flex-direction: column;\n            }\n            .footer-container2 {\n              margin-right: var(--dl-space-space-fourunits);\n            }\n            .footer-product-container {\n              margin-right: var(--dl-space-space-fourunits);\n            }\n          }\n          @media(max-width: 767px) {\n            .footer-footer {\n              padding-left: var(--dl-space-space-twounits);\n              padding-right: var(--dl-space-space-twounits);\n            }\n            .footer-container1 {\n              align-items: center;\n              flex-direction: column;\n              justify-content: space-between;\n            }\n            .footer-image {\n              display: none;\n            }\n            .footer-container2 {\n              margin-right: var(--dl-space-space-fourunits);\n            }\n            .footer-product-container {\n              margin-right: var(--dl-space-space-fourunits);\n            }\n          }\n          @media(max-width: 479px) {\n            .footer-footer {\n              padding: var(--dl-space-space-unit);\n            }\n            .footer-container1 {\n              align-items: center;\n              flex-direction: column;\n            }\n            .footer-container2 {\n              margin-right: 0px;\n            }\n            .footer-text12 {\n              text-align: center;\n            }\n          }          \n        "))));
}
export { Footer };


//# sourceMappingURL=footer.js.map