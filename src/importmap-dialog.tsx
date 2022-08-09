/** @jsx h */

import { h } from "nano-jsx";
import { fromPkgStr } from "@jspm/packages/functions";

type Prop = {
  generatorHash: string;
  dependencies: string[];
  dialogOpen: boolean;
  importMap: string;
  importmapShareLink: string;
  importmapDialogOpenDependencyDetails: { [key: string]: boolean };
  toggleImportmapDialog: (event: MouseEvent) => void;
  toggleExportSelection: (event: MouseEvent) => void;
  toggleDependencyDetail: (event: MouseEvent) => void;
};

function ImportMapDialog({
  generatorHash = "",
  dependencies = [],
  dialogOpen,
  importMap,
  importmapShareLink,
  importmapDialogOpenDependencyDetails,
  toggleImportmapDialog,
  toggleExportSelection,
  toggleDependencyDetail,
}: Prop) {
  const shouldOpen = dialogOpen && dependencies.length > 0;
  const open = shouldOpen ? { open: shouldOpen } : {};
  type Map = {
    [key: string]: {
      [key: string]: string[],
     },
   }
  const map: Map = {};

  dependencies.forEach((dependency: string) => {
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
        <button class="icon-close" onClick={toggleImportmapDialog}>
          ✕
        </button>
        {importmapShareLink && <a href={importmapShareLink}>importmap</a>}
      </header>
      {generatorHash && (
        <a target="_blank" href={`https://generator.jspm.io/${generatorHash}`}>
          Customize importmap at JSPM Generator
        </a>
      )}
      <section class="selected-dependencies">
        {Object.entries(map).map(([name, versions]) => {
          const mapEntries = Object.entries(versions);
          
          if (mapEntries.length === 1) {
            const [version, subpaths] = mapEntries[0];

            const detailId = `importmap-dialog-dependency-detail-${name}@${version}`;
            const shouldOpen = importmapDialogOpenDependencyDetails[detailId]
            const detailOpen = shouldOpen ? { open: shouldOpen } : {};
            return (
              <details id={detailId} onToggle={toggleDependencyDetail} {...detailOpen}>
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
                          onClick={toggleExportSelection}
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


          const multipleVersionDetailId = `importmap-dialog-dependency-detail-${name}-[${mapEntries.length}]-muilti`;
          const shouldOpenMultipleVersion = importmapDialogOpenDependencyDetails[multipleVersionDetailId]
          const multipleVersionDetailOpen = shouldOpenMultipleVersion ? { open: shouldOpenMultipleVersion } : {};
          return (
            <details id={multipleVersionDetailId} onToggle={toggleDependencyDetail} {...multipleVersionDetailOpen}>
              <summary>
                <span>{name}</span>
                <span class="code">[{mapEntries.length} versions]</span>
              </summary>

              {mapEntries.map(([version, subpaths]) => {
                const detailId = `importmap-dialog-dependency-detail-${name}@${version}`;
                const shouldOpen = importmapDialogOpenDependencyDetails[multipleVersionDetailId]
                const detailOpen = shouldOpen ? { open: shouldOpen } : {};
                
                return (
                  <details id={detailId} onToggle={toggleDependencyDetail} {...detailOpen}>
                    <summary>
                      <span class="code">v{version}</span>
                    </summary>
                    <ol>
                      {subpaths.map((subpath) => (
                        <li>
                          <span>
                            {subpath}
                            <button
                              onClick={toggleExportSelection}
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
        <pre class="code">{importMap}</pre>
      </section>
    </dialog>
  );
}
export { ImportMapDialog };
export type { Prop as ImportMapDialogProp };
