/** @jsx h */ import { h, Helmet, useContext } from "nano-jsx";
import { JSPMGeneratorContext } from './generate-statehash.js';
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
//     <jspm-exports-subpath-importmap>
//       <ImportMap target={`${name}@${version}`} subpaths={[subpath]} />
//     </jspm-exports-subpath-importmap>
//   );
// }
// function Subpath({ importPath }) {
//   return (
//     <jspm-exports-subpath>
//       {importPath}
//     </jspm-exports-subpath>
//   );
// }
function Exports({ exports , name , version  }) {
    const generatorHash = useContext(JSPMGeneratorContext);
    return /*#__PURE__*/ h("jspm-exports", null, "generatorHash: ", generatorHash, /*#__PURE__*/ h("ul", {
        class: "package-files"
    }, exports === null || exports === void 0 ? void 0 : exports.map((subpath)=>{
        return /*#__PURE__*/ h("li", null, `${name}${subpath.slice(1)}`);
    })), /*#__PURE__*/ h(Helmet, null, /*#__PURE__*/ h("style", {
        "data-page": "package-details"
    }, `
            .package-file {
              display: block;
              line-height: 1.3;
            }
            .package-files {
              list-style: none;
              padding-left: 0px;
              max-height: 500px;
              overflow: scroll;
            }
            .package-files li {
              line-height: 1.3;
            }
            `)));
}
export { Exports };


//# sourceMappingURL=exports.js.map