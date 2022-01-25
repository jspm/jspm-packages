import { Component, h, Helmet } from "nano-jsx";
import {
  getCleanPath,
  main as importMapGenerator,
} from "./importmap-generator.js";

class ImportMap extends Component {
  constructor(props) {
    super(props);
  }

  importMaps;

  async didMount() {
    if (!this.importMaps) {
      const { target, subpaths } = this.props;
      const importMap = await importMapGenerator({ target, subpaths });

      if (importMap) {
        this.importMaps = importMap;
        this.update();
      }
    }
  }

  render() {
    if (this.importMaps) {
      return (
        <pre>
          <code
            innerHTML={{
              __dangerousHtml: JSON.stringify(this.importMaps, null, 2),
            }}
          />
        </pre>
      );
    } else {
      return <div>{this.props.subpath}</div>;
    }
  }
}

function SubpathImportMap(
  { importMap },
) {
  return (
    <jspm-package-exports-subpath-importmap>
      <pre>
          <code
            innerHTML={{
              __dangerousHtml: JSON.stringify(importMap, null, 2),
            }}
          />
        </pre>
    </jspm-package-exports-subpath-importmap>
  );
}

function Subpath({ importPath }) {
  return (
    <jspm-package-exports-subpath>
      {importPath}
    </jspm-package-exports-subpath>
  );
}

function Exports(
  { exports, name, version, importMaps },
) {
  return (
    <jspm-package-exports>
      {exports.map((subpath) => {
        return (
          <jspm-package-exports-entry>
            <details
              data-subpath={subpath}
              data-dependency={`${name}@${version}${getCleanPath(subpath)}`}
            >
              <summary>
                <Subpath
                  subpath={subpath}
                  name={name}
                  version={version}
                  importPath={`${name}${getCleanPath(subpath)}`}
                />
              </summary>
              <SubpathImportMap
                subpath={subpath}
                name={name}
                version={version}
                importMap={importMaps[subpath]}
              />
            </details>
          </jspm-package-exports-entry>
        );
      })}
      <Helmet>
        <style data-page="package-details">
          {`
            jspm-package-exports-entry {
                display: flex;
                display: block;
                padding-left: 10px;
            }
            jspm-package-exports-target{
                margin-left: 20px;
                display: block;
            }
            
            `}
        </style>
      </Helmet>
    </jspm-package-exports>
  );
}
export { Exports };
