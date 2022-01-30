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

function Exports(
  { exports, name, version, exportHashes },
) {
  return (
    <jspm-package-exports>
      {
        <ul class="package-files">
          {exportHashes && exports?.map(
            (subpath) => {
              const href = exportHashes[subpath];
              return (
              <li>
                <a
                  target="_blank"
                  href={href}
                  class="package-file"
                >
                  {`${name}${subpath.slice(1)}`}
                </a>
              </li>
            )},
          )}
        </ul>
      }
      <Helmet>
        <style data-page="package-details">
          {`
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
            `}
        </style>
      </Helmet>
    </jspm-package-exports>
  );
}
export { Exports };
