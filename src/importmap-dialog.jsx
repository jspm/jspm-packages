/** @jsx h */
import { h } from "nano-jsx";

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
    </jspm-importmap-dialog>
  );
}

export { ImportMapDialog };
