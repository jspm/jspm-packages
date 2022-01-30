import { Component, h, Helmet } from "nano-jsx";
// import {
//   getCleanPath,
//   main as importMapGenerator,
// } from "./importmap-generator.js";
// class ImportMap extends Component {
//   constructor(props) {
//     super(props);
//   }
//   importMaps;
//   async didMount() {
//     if (!this.importMaps) {
//       const { target, subpaths } = this.props;
//       const importMap = await importMapGenerator({ target, subpaths });
//       if (importMap) {
//         this.importMaps = importMap;
//         this.update();
//       }
//     }
//   }
//   render() {
//     if (this.importMaps) {
//       return (
//         <pre>
//           <code
//             innerHTML={{
//               __dangerousHtml: JSON.stringify(this.importMaps, null, 2),
//             }}
//           />
//         </pre>
//       );
//     } else {
//       return <div>{this.props.subpath}</div>;
//     }
//   }
// }
// function SubpathImportMap(
//   { subpath, name, version },
// ) {
//   return (
//     <jspm-package-exports-subpath-importmap>
//       <ImportMap target={`${name}@${version}`} subpaths={[subpath]} />
//     </jspm-package-exports-subpath-importmap>
//   );
// }
// function Subpath({ importPath }) {
//   return (
//     <jspm-package-exports-subpath>
//       {importPath}
//     </jspm-package-exports-subpath>
//   );
// }
function Exports(param) {
    var exports = param.exports, name = param.name, version = param.version, exportHashes = param.exportHashes;
    return(/*#__PURE__*/ h("jspm-package-exports", null, /*#__PURE__*/ h("ul", {
        class: "package-files"
    }, exportHashes && (exports === null || exports === void 0 ? void 0 : exports.map(function(subpath) {
        var href = exportHashes[subpath];
        return(/*#__PURE__*/ h("li", null, /*#__PURE__*/ h("a", {
            target: "_blank",
            href: href,
            class: "package-file"
        }, "".concat(name).concat(subpath.slice(1)))));
    }))), /*#__PURE__*/ h(Helmet, null, /*#__PURE__*/ h("style", {
        "data-page": "package-details"
    }, "\n            .package-file {\n              display: block;\n              line-height: 1.3;\n            }\n            .package-files {\n              list-style: none;\n              padding-left: 0px;\n              max-height: 500px;\n              overflow: scroll;\n            }\n            .package-files li {\n              line-height: 1.3;\n            }\n            "))));
}
export { Exports };


//# sourceMappingURL=exports.js.map