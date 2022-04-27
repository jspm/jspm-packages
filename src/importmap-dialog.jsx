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
        <header>
          <jspm-importmap-dialog-close-button>
            <button class="icon-close" onClick={toggleImportmapDialog}>
              ✕
            </button>
          </jspm-importmap-dialog-close-button>
          <jspm-importmap-dialog-title>
            <h4>Importmap Dependencies</h4>
          </jspm-importmap-dialog-title>
        </header>
        {generatorHash && (
          <jspm-generator-link>
            <a
              target="_blank"
              href={`https://generator.jspm.io/${generatorHash}`}
            >
              Customize importmap at JSPM Generator
            </a>
          </jspm-generator-link>
        )}

        {Object.entries(map).map(([name, versions]) => {
          const mapEntries = Object.entries(versions);
          if (mapEntries.length === 1) {
            const [version, subpaths] = mapEntries[0];
            return (
              <details>
                <summary>
                  <jspm-importmap-entry-summary>
                    <jspm-importmap-entry-name>
                      {name}
                    </jspm-importmap-entry-name>
                    <jspm-importmap-entry-version class="code">
                      v{version}
                    </jspm-importmap-entry-version>
                  </jspm-importmap-entry-summary>
                </summary>
                <ol>
                  {subpaths.map((subpath) => (
                    <li>
                      <jspm-importmap-entry>
                        <jspm-importmap-entry-subpath class="code">
                          {subpath}
                        </jspm-importmap-entry-subpath>
                        <button
                          onClick={toggleExportSelection}
                          value={`${name}@${version}${subpath.slice(1)}`}
                        >
                          &minus; Remove
                        </button>
                      </jspm-importmap-entry>
                    </li>
                  ))}
                </ol>
              </details>
            );
          }
          return (
            <details>
              <summary>
                <jspm-importmap-entry-summary>
                  <jspm-importmap-entry-name>
                    {name}
                  </jspm-importmap-entry-name>
                  <jspm-importmap-entry-version class="code">
                    [{mapEntries.length} versions]
                  </jspm-importmap-entry-version>
                </jspm-importmap-entry-summary>
              </summary>

              {mapEntries.map(([version, subpaths]) => {
                return (
                  <details>
                    <summary>
                      <jspm-importmap-entry-version class="code">
                        v{version}
                      </jspm-importmap-entry-version>
                    </summary>
                    <ol>
                      {subpaths.map((subpath) => (
                        <li>
                          <jspm-importmap-entry>
                            {subpath}
                            <button
                              onClick={toggleExportSelection}
                              value={`${name}@${version}${subpath.slice(1)}`}
                            >
                              &minus; Remove
                            </button>
                          </jspm-importmap-entry>
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
            z-index: 2;
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

          jspm-importmap-dialog dialog header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
          }

          jspm-importmap-dialog dialog header h4{
            margin: 0;
          }

          jspm-importmap-dialog dialog jspm-generator-link {
            display: inline-block;
            margin-bottom: 1rem;
          }

          jspm-importmap-dialog dialog jspm-generator-link a{
            display: inline-block;
            margin-bottom: 1rem;
            background: url(/images/icon-external-link.png) no-repeat right center;
            background-size: contain;
            padding-right: 25px;
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

          jspm-importmap-dialog dialog details summary, jspm-importmap-entry-summary{
            padding: 10px;
            cursor: pointer;
            display: flex;
            align-content: center;
            justify-content: space-between;
            align-items: center;
          }

          jspm-importmap-dialog dialog details summary:after{
            content: '›';
            margin-right: 10px;
            font-weight: 700;
            font-size: 1.2rem;
          }

          jspm-importmap-dialog dialog details[open] summary:after{
            content: '⌄';
          }

          jspm-importmap-entry-name{
            font-weight: 700;
          }

          jspm-importmap-entry-version{
            margin-left: 10px;
          }

          jspm-importmap-dialog dialog .icon-close{
            background: white;
            border: none;
            background: transparent;
            font-size: var(--step-0);
            cursor: pointer;
          }

          jspm-importmap-entry{
            display: flex;
            align-content: center;
            justify-content: space-between;
            align-items: center;
          }

          jspm-importmap-entry button{
            background: white;
            border: none;
            cursor: pointer;
            color: crimson;
          }
          `}
        </style>
      </Helmet>
    </jspm-importmap-dialog>
  );
}

export { ImportMapDialog };
