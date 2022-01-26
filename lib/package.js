import { h, Helmet } from "nano-jsx";
import { Readme } from "./readme.js";
import { Aside } from "./aside.js";
import { Header } from "./header.js";
import { Footer } from "./footer.js";
function Package(param) {
    var name = param.name, description = param.description, keywords = param.keywords, version = param.version, homepage = param.homepage, license = param.license, files = param.files, exports = param.exports, readme = param.readme, stateHash = param.stateHash;
    return(/*#__PURE__*/ h("div", null, /*#__PURE__*/ h(Header, null), /*#__PURE__*/ h("jspm-package", null, /*#__PURE__*/ h("jspm-package-content", null, /*#__PURE__*/ h(Readme, {
        __html: readme
    }), /*#__PURE__*/ h(Aside, {
        version: version,
        name: name,
        license: license,
        files: files,
        exports: exports,
        keywords: keywords
    }))), /*#__PURE__*/ h(Footer, null), /*#__PURE__*/ h(Helmet, null, /*#__PURE__*/ h("link", {
        rel: "stylesheet",
        href: "https://ga.jspm.io/npm:prismjs@1.25.0/themes/prism.css"
    }), /*#__PURE__*/ h("style", {
        "data-page": "package-details"
    }, "\n        jspm-package-content {\n          display: grid;\n          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));\n          grid-gap: 1rem;\n        }\n        \n        jspm-package-readme {\n          display: block;\n          padding: var(--dl-space-space-oneandhalfunits);\n        }\n        \n        jspm-package-aside {\n          padding: var(--dl-space-space-oneandhalfunits);\n        }\n        \n        jspm-package-name,\n        jspm-package-version,\n        jspm-package-description,\n        jspm-package-license {\n          display: block;\n        }\n        \n        jspm-package-name h1 {\n          font-family: \"Major Mono Display\", monospace;\n          font-size: var(--step-5);\n        }\n        \n        jspm-package-name h1 a {\n          color: black;\n        }\n\n        @media(max-width: 767px) {\n          jspm-package-content {\n            justify-content: space-between;\n          }\n\n          jspm-package-readme {\n            width: 100%;\n          }\n        }\n        "))));
}
export { Package };


//# sourceMappingURL=package.js.map