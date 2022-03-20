/** @jsx h */
import nano, { h } from "nano-jsx";

const { Helmet } = nano;

function fromPkgStr(pkg) {
  const versionIndex = pkg.indexOf("@", 1);
  const name = pkg.slice(0, versionIndex);
  let subpathIndex = pkg.indexOf("/", versionIndex);
  if (subpathIndex === -1) {
    subpathIndex = pkg.length;
  }
  const version = pkg.slice(versionIndex + 1, subpathIndex);
  const subpath = "." + pkg.slice(name.length + version.length + 1);
  return { name, version, subpath };
}

function ImportMapDialog(
  {
    generatorHash = "",
    dependencies = [],
    open: dialogOpen,
    toggleImportmapDialog,
    toggleExportSelection,
  },
) {
  const shouldOpen = dialogOpen && dependencies.length > 0;
  const open = shouldOpen ? { open: shouldOpen } : {};
  let map = {};
  dependencies.forEach((dependency) => {
    const { name, version, subpath } = fromPkgStr(dependency);
    if (typeof map[name] === "undefined") {
      map[name] = { [version]: [] };
    }
    if (typeof map[name][version] === "undefined") {
      map[name][version] = [];
    }
    map[name][version] = [...map[name][version], subpath];
  });
  return (
    <jspm-importmap-dialog>
      <dialog {...open}>
        <button class="icon-close" onClick={toggleImportmapDialog}>✕</button>
        {generatorHash && (
          <h4>
            <a
              target="_blank"
              href={`https://generator.jspm.io/${generatorHash}`}
            >
              Customize importmap at JSPM Generator
            </a>
          </h4>
        )}

        {Object.entries(map).map(([name, versions]) => {
          const mapEntries = Object.entries(versions);
          if (mapEntries.length === 1) {
            const [version, subpaths] = mapEntries[0];
            return (
              <details>
                <summary>
                  <span>{name}</span>
                  <span>{version}</span>
                </summary>
                <ol>
                  {subpaths.map((subpath) => (
                    <li>
                      {subpath}
                      <button
                        onClick={toggleExportSelection}
                        value={`${name}@${version}${subpath.slice(1)}`}
                      >
                        &minus; Remove
                      </button>
                    </li>
                  ))}
                </ol>
              </details>
            );
          }
          return (
            <details>
              <summary>{name}</summary>

              {mapEntries.map(([version, subpaths]) => {
                return (
                  <details>
                    <summary>{version}</summary>
                    <ol>
                      {subpaths.map((subpath) => (
                        <li>
                          {subpath}
                          <button
                            onClick={toggleExportSelection}
                            value={`${name}@${version}${subpath.slice(1)}`}
                          >
                            &minus; Remove
                          </button>
                        </li>
                      ))}
                    </ol>
                  </details>
                );
              })}
            </details>
          );
        })}
      </dialog>
      <Helmet>
        <style data-component-name="jspm-importmap-dialog">
          {`
          jspm-importmap-dialog dialog  {
            min-height: 100vh;
            min-width: 350px;
            background: white;
            left: unset;
            border: 0 solid black;

            
            border-radius: 0;
            /*background: linear-gradient(225deg, #e6e6e6, #ffffff);*/
            /*box-shadow:  -5px 5px 10px #d9d9d9, 5px -5px 10px #ffffff;*/
            box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px;
          }
          jspm-importmap-dialog dialog details  {
            margin: 15px;
            padding: 10px;
            -webkit-border-radius: 50px;
            border-radius: 10px;
            background: #ffffff;
            -webkit-box-shadow: 12px 12px 24px #d9d9d9, -12px -12px 24px #ffffff;
            box-shadow: -12px 12px 24px #d9d9d9, -12px -12px 24px #ffffff;
          }
          jspm-importmap-dialog dialog details summary{
            padding: 10px;
          }
          jspm-importmap-dialog dialog .icon-close{
            background: white;
            border: 2px solid black;
            background: black;
            color: var(--dl-color-primary-js-primary);
            cursor: pointer;
          }
          `}
        </style>
      </Helmet>
    </jspm-importmap-dialog>
  );
}

export { ImportMapDialog };
