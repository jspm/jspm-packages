/** @jsx h */ import nano, { h } from "nano-jsx";
import { Readme } from "./readme.js";
import { Aside } from "./aside.js";
import { Header } from "./header.js";
import { Footer } from "./footer.js";
import { ImportMapDialog } from "./importmap-dialog.js";
const { Helmet  } = nano;
function Package({ name , description , keywords , version , homepage , license , files , exports , readme , generatorHash , selectedDeps , downloads , created , updated , type , types , features , links , maintainers , toggleExportSelection , openImportmapDialog , toggleImportmapDialog ,  }) {
    return /*#__PURE__*/ h("jspm-package", null, /*#__PURE__*/ h(ImportMapDialog, {
        generatorHash: generatorHash,
        dependencies: selectedDeps,
        open: openImportmapDialog,
        toggleImportmapDialog: toggleImportmapDialog,
        toggleExportSelection: toggleExportSelection
    }), /*#__PURE__*/ h(Header, {
        generatorHash: generatorHash,
        dependencies: selectedDeps,
        open: openImportmapDialog,
        toggleImportmapDialog: toggleImportmapDialog
    }), /*#__PURE__*/ h("jspm-package-hero", {
        "data-exports": JSON.stringify(exports),
        "data-name": name,
        "data-version": version,
        "data-description": description,
        "data-updated": updated,
        "data-types": types
    }, /*#__PURE__*/ h("jspm-highlight", null, /*#__PURE__*/ h("h2", null, name), /*#__PURE__*/ h("div", null, /*#__PURE__*/ h("span", null, version), "\u2022", /*#__PURE__*/ h("span", null, "Published ", updated)), /*#__PURE__*/ h("div", null), /*#__PURE__*/ h("h3", null, description))), /*#__PURE__*/ h("jspm-content", null, /*#__PURE__*/ h("main", null, /*#__PURE__*/ h("jspm-package-exports", null, /*#__PURE__*/ h("h4", null, "Package exports"), /*#__PURE__*/ h("ul", {
        class: "code"
    }, exports.map((subpath)=>{
        const packageExport = `${name}@${version}${subpath.slice(1)}`;
        const addedToImportMap = selectedDeps === null || selectedDeps === void 0 ? void 0 : selectedDeps.includes(packageExport);
        return /*#__PURE__*/ h("li", null, `${name}${subpath.slice(1)}`, toggleExportSelection && /*#__PURE__*/ h("button", {
            type: "button",
            onClick: toggleExportSelection,
            value: packageExport
        }, addedToImportMap ? "− Remove from importmap" : "+ Add to importmap"));
    }))), /*#__PURE__*/ h(Readme, {
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
    })), /*#__PURE__*/ h(Footer, null), /*#__PURE__*/ h(Helmet, null, /*#__PURE__*/ h("link", {
        rel: "stylesheet",
        href: "https://ga.jspm.io/npm:prismjs@1.25.0/themes/prism.css"
    }), /*#__PURE__*/ h("style", {
        "data-page": "package-details"
    }, `
          jspm-package{
            display: block;
            max-width: 1140px;
            margin: 0 auto;
          }
          jspm-highlight{
            text-align: center;
          }
          jspm-highlight h2{
            font-family: 'Source Sans Pro', sans-serif;
          }
        jspm-content {
          display: grid;
          grid-template-columns: minmax(800px, 1fr) minmax(350px, 1fr);
          grid-gap: 1rem;
        }
        
        jspm-readme {
          min-width: 800px;
          display: block;
          padding: var(--dl-space-space-oneandhalfunits);
        }
        
        jspm-aside {
          padding: var(--dl-space-space-oneandhalfunits);
        }
        
        jspm-name,
        jspm-version,
        jspm-description,
        jspm-license {
          display: block;
        }
        
        jspm-name h1 {
          font-family: "Major Mono Display", monospace;
          font-size: var(--step-5);
        }
        
        jspm-name h1 a {
          color: black;
        }

        @media(max-width: 767px) {
          jspm-content {
            justify-content: space-between;
          }

          jspm-readme {
            width: 100%;
          }
        }
        jspm-package-exports ul{
          margin: 0;
          padding: 0;
        }
        jspm-package-exports ul li{
          display: flex;
          align-content: center;
          justify-content: space-between;
          align-items: center;
          padding: 5px;
          margin: 10px;
          border-bottom: 1px dotted #ccc;
        }
        jspm-package-exports ul li button{
          background: var(--dl-color-primary-js-primary);
          color: black;
          padding: 10px;
          display: inline-block;
          border: 3px solid black;
          min-width: 250px;
          font-family: "Bebas Neue", cursive;
        }
        `)));
}
export { Package };


//# sourceMappingURL=package.js.map