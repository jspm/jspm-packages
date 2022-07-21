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
  showImportmapShareLink = false;
  importmapShareLink = "";

  toggleImportmapDialog = (event: Event) => {
    event.preventDefault();
    const { openImportmapDialog } = this.store.state;
    this.store.setState({
      ...this.store.state,
      openImportmapDialog: !openImportmapDialog,
    });
  };

  generateImportmap = async (dependency?: string | string[]) => {
    if (typeof globalThis.document !== "undefined") {
      const { deps = [], env = ["production", "browser", "module"] } =
        this.store.state.jspmGeneratorState;

      const { Generator } = await import("@jspm/generator");

      const generator = new Generator({
        env: Object.keys(env).filter((key) => env[key]),
      });
      const dependencies = deps.map(([dependency]) => dependency);
      await generator.install(dependency || dependencies);
      const importMap = generator.getMap();

      this.store.setState({ ...this.store.state, importMap: importMap });
      return importMap;
    }
  };

  generateImportmapShareLink = () => {
    this.importmapShareLink = "";
  };

  toggleImportmapShareLink = () => {
    this.showImportmapShareLink = !this.showImportmapShareLink;
    if (this.showImportmapShareLink === true) {
      this.generateImportmapShareLink();
    }
    this.update();
  };

  // TODO tackle duplicate src/package-export-add-to-importmap-toggle.tsx#l25
  toggleExportSelection = (event: Event) => {
    event.preventDefault();

    const { value } = event.target;
    const { selectedExports, jspmGeneratorState } = this.store.state;

    selectedExports[value] = !selectedExports[value];

    const deps = Object.keys(selectedExports)
      .filter((subpath) => selectedExports[subpath] === true)
      .map((subpath) => [subpath, !!subpath]);

    this.store.setState({
      ...this.store.state,
      selectedExports,
      jspmGeneratorState: { ...jspmGeneratorState, deps },
    });

    if (typeof globalThis.document !== "undefined") {
      this.generateImportmap();
    }
  };

  togglePagewidth = (openImportmapDialog: boolean) => {
    const dialogRef = document.getElementById("importmap-dialog");
    const dialogWidth = dialogRef?.offsetWidth || 0;

    const packagePageRef = document.getElementById("packages-page");
    const pageWidth = packagePageRef?.offsetWidth || 0;
    if (packagePageRef) {
      packagePageRef.style.width = openImportmapDialog
        ? `${pageWidth - dialogWidth}px`
        : "";
    }
  };

  didMount() {
    // subscribe to store changes
    this.store.subscribe((newState, prevState) => {
      // check if you need to update your component or not
      if (JSON.stringify(newState) !== JSON.stringify(prevState)) {
        this.update();
        this.togglePagewidth(newState.openImportmapDialog);
      }
    });

    if (typeof globalThis.document !== "undefined") {
      this.generateImportmap();
    }
    this.togglePagewidth(this.store.state.openImportmapDialog);
  }

  didUnmount() {
    // cancel the store subscription
    this.store.cancel();
  }

  render() {
    const {
      generatorHash = "",
      openImportmapDialog: dialogOpen,
      importMap,
      jspmGeneratorState: { deps },
    } = this.store.state;

    const shouldOpen = dialogOpen && deps.length > 0;
    const open = shouldOpen ? { open: shouldOpen } : {};
    const map = {};
    deps
      .map(([dependency]) => dependency)
      .forEach((dependency: string) => {
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
      <dialog id="importmap-dialog" {...open}>
        <header>
          <h4>Selected dependencies</h4>
          <button class="icon-share" onClick={this.toggleImportmapShareLink}>
            Share
          </button>
          <button class="icon-close" onClick={this.toggleImportmapDialog}>
            ✕
          </button>
          {this.showImportmapShareLink && (
            <a href={this.importmapShareLink}>importmap</a>
          )}
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

        <h3>Copy Importmap</h3>
        <section class="importmap-text">
          <pre class="code">{JSON.stringify(importMap, null, 2)}</pre>
        </section>
      </dialog>
    );
  }
}

export { ImportMapDialog };
