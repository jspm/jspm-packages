/** @jsx h */

/// <reference lib="dom" />
/// <reference types="https://deno.land/x/nano_jsx@v0.0.33/types.d.ts" />

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
      const {
        selectedDeps,
        jspmGeneratorState: { env = ["production", "browser", "module"] },
      } = this.store.state;

      const { Generator } = await import("@jspm/generator");

      const generator = new Generator({
        mapUrl: import.meta.url,
        env: Object.keys(env).filter((key) => env[key]),
      });

      await generator.install(dependency || selectedDeps);
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

  generateHash = async () => {
    if (typeof globalThis.document !== "undefined") {
      const { getStateHash } = await import(
        "@jspm/packages/generate-statehash"
      );

      const { jspmGeneratorState } = this.store.state;

      const generatorHash = await getStateHash({
        jspmGeneratorState,
      });

      if (generatorHash) {
        this.store.setState({ ...this.store.state, generatorHash });
      }
    }
  };
  // TODO tackle duplicate src/package-export-add-to-importmap-toggle.tsx#l25
  toggleExportSelection = (event: Event) => {
    event.preventDefault();

    const { value } = event.currentTarget;
    const { selectedExports, jspmGeneratorState } = this.store.state;

    selectedExports[value] = !selectedExports[value];

    const selectedDeps = Object.keys(selectedExports).filter(
      (subpath) => selectedExports[subpath] === true
    );

    const deps = selectedDeps.map((subpath) => [subpath, !!subpath]);

    this.store.setState({
      ...this.store.state,
      jspmGeneratorState: { ...jspmGeneratorState, deps },
      selectedDeps,
      selectedExports,
    });

    if (typeof globalThis.document !== "undefined") {
      this.generateHash();
      this.generateImportmap();
    }
  };

  togglePagewidth = (openImportmapDialog: boolean) => {
    // const dialogRef = document.getElementById("importmap-dialog");
    // const dialogWidth = dialogRef?.offsetWidth || 0;

    // const packagePageRef = document.getElementById("packages-page");
    // const pageWidth = packagePageRef?.offsetWidth || 0;
    // if (packagePageRef) {
    //   packagePageRef.style.width = openImportmapDialog
    //     ? `${pageWidth - dialogWidth}px`
    //     : "";
    // }

    const packagePageRef = document.getElementById("packages-page");
    if (openImportmapDialog) {
      packagePageRef?.classList.add("shrink");
    } else {
      packagePageRef?.classList.remove("shrink");
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

    const { generatorHash, importMap, openImportmapDialog } = this.store.state;

    if (typeof globalThis.document !== "undefined") {
      this.generateImportmap();

      if (!generatorHash) {
        this.generateHash();
      }
      if (!importMap) {
        this.generateImportmap();
      }
    }
    this.togglePagewidth(openImportmapDialog);
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
    selectedDeps.forEach((dependency: string) => {
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
