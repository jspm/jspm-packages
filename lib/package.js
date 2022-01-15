import { h, Helmet } from "nano-jsx";
import { PackageHeader } from "./package-header.js";
import { Readme } from "./readme.js";
import { Aside } from "./aside.js";
import { Header } from "./header.js";
import { Footer } from "./footer.js";
function Package(props) {
    var name = props.name, description = props.description, keywords = props.keywords, version = props.version, homepage = props.homepage, license = props.license, files = props.files, exports = props.exports, readme = props.readme;
    return(/*#__PURE__*/ h("div", null, /*#__PURE__*/ h(Header, null), /*#__PURE__*/ h("jspm-package", null, /*#__PURE__*/ h(PackageHeader, {
        homepage: homepage || "",
        name: name,
        description: description,
        version: version
    }), /*#__PURE__*/ h("jspm-package-content", null, /*#__PURE__*/ h(Readme, {
        __html: readme
    }), /*#__PURE__*/ h(Aside, {
        version: version,
        name: name,
        license: license,
        files: files,
        exports: exports,
        keywords: keywords
    }))), /*#__PURE__*/ h(Footer, null), /*#__PURE__*/ h(Helmet, null, /*#__PURE__*/ h("style", {
        "data-page": "package-details"
    }, "\n        jspm-package-content {\n          display: flex;\n          flex-direction: row;\n          flex-wrap: wrap;\n        }\n        \n        jspm-package-readme {\n          display: block;\n          width: 800px;\n          padding: var(--dl-space-space-oneandhalfunits);\n        }\n        \n        jspm-package-aside {\n          width: 300px;\n          padding-left: var(--dl-space-space-unit);\n        }\n        \n        jspm-package-name,\n        jspm-package-version,\n        jspm-package-description,\n        jspm-package-license {\n          display: block;\n        }\n        \n        jspm-package-name h1 {\n          font-family: \"Major Mono Display\", monospace;\n          font-size: var(--step-5);\n        }\n        \n        jspm-package-name h1 a {\n          color: black;\n        }\n\n        @media(max-width: 767px) {\n          jspm-package-content {\n            justify-content: space-between;\n          }\n\n          jspm-package-readme {\n            width: 100%;\n          }\n        }\n        "))));
}
export { Package };


//# sourceMappingURL=package.js.map