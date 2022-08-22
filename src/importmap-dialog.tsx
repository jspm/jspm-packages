/** @jsx h */

import { h } from "nano-jsx";
import Prism from "prismjs";
import "prismjs/components/prism-json";
import {
  fromPkgStr,
  sortArray,
  copyToClipboard,
} from "@jspm/packages/functions";

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
      [key: string]: string[];
    };
  };
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
        <h4>My Importmap</h4>
        <button class="icon-close" onClick={toggleImportmapDialog}>
          ✕
        </button>
        {importmapShareLink && <a href={importmapShareLink}>importmap</a>}
      </header>
      {generatorHash && (
        <a
          class="jspm-packages-importmap-dialog-generator-link"
          target="_blank"
          href={`https://generator.jspm.io/${generatorHash}`}
        >
          Customize importmap at JSPM Generator
        </a>
      )}
      <section class="selected-dependencies">
        {sortArray(Object.keys(map)).map((name) => {
          const versions = map[name];
          const mapEntries = Object.entries(versions);

          if (mapEntries.length === 1) {
            const [version, subpaths] = mapEntries[0];
            if (subpaths.length === 1) {
              return (
                <article class="details">
                  <div class="summary">
                    <div class="package-name-version">
                      <a href={`/package/${name}`}>
                        <strong>{name}</strong>
                      </a>

                      <a href={`/package/${name}@${version}`}>
                        <span class="code">v{version}</span>
                      </a>
                    </div>
                    <button
                      onClick={toggleExportSelection}
                      value={`${name}@${version}${subpaths[0].slice(1)}`}
                    >
                      &minus;
                    </button>
                  </div>
                </article>
              );
            }
            const detailId = `importmap-dialog-dependency-detail-${name}@${version}`;
            const shouldOpen = importmapDialogOpenDependencyDetails[detailId];
            const detailOpen = shouldOpen ? { open: shouldOpen } : {};
            return (
              <details
                id={detailId}
                onToggle={toggleDependencyDetail}
                {...detailOpen}
              >
                <summary>
                  <div class="package-name-version">
                    <a href={`/package/${name}`}>
                      <strong>{name}</strong>
                    </a>

                    <a href={`/package/${name}@${version}`}>
                      <span class="code">v{version}</span>
                    </a>
                  </div>
                </summary>
                <ol>
                  {sortArray(subpaths).map((subpath) => (
                    <li>
                      <span class="code export-name">
                        {subpath.slice(1) && <span>{name}</span>}
                        <span class="export-subpath">
                          {subpath.slice(1) || name}
                        </span>
                      </span>
                      <button
                        onClick={toggleExportSelection}
                        value={`${name}@${version}${subpath.slice(1)}`}
                      >
                        &minus;
                      </button>
                    </li>
                  ))}
                </ol>
              </details>
            );
          }

          const multipleVersionDetailId = `importmap-dialog-dependency-detail-${name}-[${mapEntries.length}]-muilti`;
          const shouldOpenMultipleVersion =
            importmapDialogOpenDependencyDetails[multipleVersionDetailId];
          const multipleVersionDetailOpen = shouldOpenMultipleVersion
            ? { open: shouldOpenMultipleVersion }
            : {};

          return (
            <details
              id={multipleVersionDetailId}
              onToggle={toggleDependencyDetail}
              {...multipleVersionDetailOpen}
            >
              <summary>
                <span>
                  <a href={`/package/${name}`}>{name}</a>
                </span>
                <span class="code">[{mapEntries.length} versions]</span>
              </summary>

              {mapEntries.map(([version, subpaths]) => {
                const detailId = `importmap-dialog-dependency-detail-${name}@${version}`;
                const shouldOpen =
                  importmapDialogOpenDependencyDetails[multipleVersionDetailId];
                const detailOpen = shouldOpen ? { open: shouldOpen } : {};

                return (
                  <details
                    id={detailId}
                    onToggle={toggleDependencyDetail}
                    {...detailOpen}
                  >
                    <summary>
                      <span class="code">v{version}</span>
                    </summary>
                    <ol>
                      {sortArray(subpaths).map((subpath) => (
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

      {importMap && (
        <section class="importmap-text">
          <button
            class="link-button"
            onClick={() => copyToClipboard(importMap)}
          >
            Copy Importmap
          </button>
          <div class="highlight highlight-source-json">
            <pre
              class="language-${language}"
              innerHTML={{
                __dangerousHtml: Prism?.highlight(
                  importMap,
                  Prism?.languages.json,
                  "json"
                ),
              }}
            />
          </div>
        </section>
      )}
    </dialog>
  );
}
export { ImportMapDialog };
export type { Prop as ImportMapDialogProp };
