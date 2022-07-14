/** @jsx h */
import { h, Component } from "nano-jsx";
import { store } from "@jspm/packages/store";

function fromPkgStr(pkg: string) {
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
class ImportMapDialog extends Component {
  store = store.use();

  toggleImportmapDialog = (event: Event) => {
    event.preventDefault();
    const { openImportmapDialog } = this.store.state;
    this.store.setState({
      ...this.store.state,
      openImportmapDialog: !openImportmapDialog,
    });
  };

  generateImportmap = async (dependency) => {
    if (typeof globalThis.document !== "undefined") {
      const {
        generatorHash = "",
        selectedDeps = [],
        openImportmapDialog: dialogOpen,
      } = this.store.state;

      const { Generator } = await import("@jspm/generator");
      const generator = new Generator({
        //mapUrl: import.meta.url,
        env: ["production", "browser", "module"],
      });

      await generator.install(dependency || selectedDeps);
      const importMap = generator.getMap();

      this.store.setState({ ...this.store.state, importMap: importMap });
      return importMap;
    }
  };

  toggleExportSelection = (event: Event) => {
    event.preventDefault();

    const { value } = event.target;
    const { selectedExports } = this.store.state;

    selectedExports[value] = !selectedExports[value];

    const selectedDeps = Object.keys(selectedExports).filter(
      (subpath) => selectedExports[subpath] === true
    );

    this.store.setState({ ...this.store.state, selectedDeps, selectedExports });
  };

  didMount() {
    // subscribe to store changes
    this.store.subscribe((newState, prevState) => {
      // check if you need to update your component or not
      if (JSON.stringify(newState) !== JSON.stringify(prevState)) {
        this.update();
      }
    });

    this.generateImportmap();
  }

  didUnmount() {
    // cancel the store subscription
    this.store.cancel();
  }

  render() {
    const {
      generatorHash = "",
      selectedDeps = [],
      openImportmapDialog: dialogOpen,
      importMap,
    } = this.store.state;

    const shouldOpen = dialogOpen && selectedDeps.length > 0;
    const open = shouldOpen ? { open: shouldOpen } : {};
    const map = {};
    selectedDeps.forEach((dependency) => {
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
      <dialog {...open}>
        <header>
          <h4>Dependencies from import-map</h4>
          <button class="icon-close" onClick={this.toggleImportmapDialog}>
            ✕
          </button>
        </header>
        {generatorHash && (
          <a
            target="_blank"
            href={`https://generator.jspm.io/${generatorHash}`}
          >
            Customize importmap at JSPM Generator
          </a>
        )}
        <section class="selected-dependencies">
          {Object.entries(map).map(([name, versions]) => {
            const mapEntries = Object.entries(versions);
            if (mapEntries.length === 1) {
              const [version, subpaths] = mapEntries[0];
              return (
                <details>
                  <summary>
                    <span>{name}</span>
                    <span class="code">v{version}</span>
                  </summary>
                  <ol>
                    {subpaths.map((subpath) => (
                      <li>
                        <span>
                          <span class="code">{subpath}</span>
                          <button
                            onClick={this.toggleExportSelection}
                            value={`${name}@${version}${subpath.slice(1)}`}
                          >
                            &minus;
                          </button>
                        </span>
                      </li>
                    ))}
                  </ol>
                </details>
              );
            }
            return (
              <details>
                <summary>
                  <span>{name}</span>
                  <span class="code">[{mapEntries.length} versions]</span>
                </summary>

                {mapEntries.map(([version, subpaths]) => {
                  return (
                    <details>
                      <summary>
                        <span class="code">v{version}</span>
                      </summary>
                      <ol>
                        {subpaths.map((subpath) => (
                          <li>
                            <span>
                              {subpath}
                              <button
                                onClick={this.toggleExportSelection}
                                value={`${name}@${version}${subpath.slice(1)}`}
                              >
                                &minus;
                              </button>
                            </span>
                          </li>
                        ))}
                      </ol>
                    </details>
                  );
                })}
              </details>
            );
          })}
        </section>

        <section class="importmap-text">
          <h3>Copy Importmap</h3>
          <pre class="code">{JSON.stringify(importMap, null, 2)}</pre>
        </section>
      </dialog>
    );
  }
}

export { ImportMapDialog };
