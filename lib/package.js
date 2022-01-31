/** @jsx h */ import { h, Helmet } from "nano-jsx";
import { Readme } from "./readme.js";
import { Aside } from "./aside.js";
import { Header } from "./header.js";
import { Footer } from "./footer.js";
function Package(param) {
    var name = param.name, description = param.description, keywords = param.keywords, version = param.version, homepage = param.homepage, license = param.license, files = param.files, exports = param.exports, readme = param.readme, stateHash = param.stateHash, downloads = param.downloads, created = param.created, updated = param.updated, type = param.type, types = param.types, features = param.features, links = param.links, maintainers = param.maintainers;
    return(/*#__PURE__*/ h("jspm-package", null, /*#__PURE__*/ h(Header, null), /*#__PURE__*/ h("jspm-package-hero", {
        "data-exports": JSON.stringify(exports),
        "data-name": name,
        "data-version": version,
        "data-description": description,
        "data-updated": updated,
        "data-types": types
    }, /*#__PURE__*/ h("jspm-highlight", null, /*#__PURE__*/ h("h2", null, name), /*#__PURE__*/ h("div", null, /*#__PURE__*/ h("span", null, version), "•", /*#__PURE__*/ h("span", null, "Published ", updated)), /*#__PURE__*/ h("div", null), /*#__PURE__*/ h("h3", null, description))), /*#__PURE__*/ h("jspm-package", null, /*#__PURE__*/ h("jspm-content", null, /*#__PURE__*/ h("main", null, /*#__PURE__*/ h(Readme, {
        __html: readme
    })), /*#__PURE__*/ h(Aside, {
        created: created,
        updated: updated,
        downloads: downloads,
        version: version,
        name: name,
        license: license,
        files: files,
        exports: exports,
        keywords: keywords,
        type: type,
        types: types,
        features: features,
        links: links,
        maintainers: maintainers
    }))), /*#__PURE__*/ h(Footer, null), /*#__PURE__*/ h(Helmet, null, /*#__PURE__*/ h("link", {
        rel: "stylesheet",
        href: "https://ga.jspm.io/npm:prismjs@1.25.0/themes/prism.css"
    }), /*#__PURE__*/ h("style", {
        "data-page": "package-details"
    }, "\n          jspm-package{\n            display: block;\n            max-width: 1140px;\n            margin: 0 auto;\n          }\n          jspm-highlight{\n            text-align: center;\n          }\n          jspm-highlight h2{\n            font-family: 'Source Sans Pro', sans-serif;\n          }\n        jspm-content {\n          display: grid;\n          grid-template-columns: minmax(800px, 1fr) minmax(350px, 1fr);\n          grid-gap: 1rem;\n        }\n        \n        jspm-readme {\n          min-width: 800px;\n          display: block;\n          padding: var(--dl-space-space-oneandhalfunits);\n        }\n        \n        jspm-aside {\n          padding: var(--dl-space-space-oneandhalfunits);\n        }\n        \n        jspm-name,\n        jspm-version,\n        jspm-description,\n        jspm-license {\n          display: block;\n        }\n        \n        jspm-name h1 {\n          font-family: \"Major Mono Display\", monospace;\n          font-size: var(--step-5);\n        }\n        \n        jspm-name h1 a {\n          color: black;\n        }\n\n        @media(max-width: 767px) {\n          jspm-content {\n            justify-content: space-between;\n          }\n\n          jspm-readme {\n            width: 100%;\n          }\n        }\n        "))));
}
export { Package };


//# sourceMappingURL=package.js.map