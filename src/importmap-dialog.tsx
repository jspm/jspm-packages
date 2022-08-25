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
        <section class="title">
          <h4>My Importmap</h4>
          <button class="icon-close" onClick={toggleImportmapDialog}>
            ✕
          </button>
        </section>
        <section>
          {importmapShareLink && <a href={importmapShareLink}>importmap</a>}
        </section>
      </header>
      <main>
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
                    importmapDialogOpenDependencyDetails[
                      multipleVersionDetailId
                    ];
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

        <section class="jspm-packages-importmap-dialog-links">
          {generatorHash && (
            <a
              target="_blank"
              href={`https://generator.jspm.io/${generatorHash}`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="icon icon-tabler icon-tabler-adjustments-alt"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                stroke-width="2"
                stroke="currentColor"
                fill="none"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                <rect x="4" y="8" width="4" height="4"></rect>
                <line x1="6" y1="4" x2="6" y2="8"></line>
                <line x1="6" y1="12" x2="6" y2="20"></line>
                <rect x="10" y="14" width="4" height="4"></rect>
                <line x1="12" y1="4" x2="12" y2="14"></line>
                <line x1="12" y1="18" x2="12" y2="20"></line>
                <rect x="16" y="5" width="4" height="4"></rect>
                <line x1="18" y1="4" x2="18" y2="5"></line>
                <line x1="18" y1="9" x2="18" y2="20"></line>
              </svg>
              Customize
            </a>
          )}
          {importMap && (
            <a
              href={URL.createObjectURL(new Blob([importMap]))}
              download="dependencies.importmap"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="icon icon-tabler icon-tabler-file-download"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                stroke-width="2"
                stroke="currentColor"
                fill="none"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                <path d="M14 3v4a1 1 0 0 0 1 1h4"></path>
                <path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z"></path>
                <path d="M12 17v-6"></path>
                <path d="M9.5 14.5l2.5 2.5l2.5 -2.5"></path>
              </svg>
              Download
            </a>
          )}
        </section>
        {importMap && (
          <section class="importmap-text">
            <button
              class="link-copy"
              onClick={() => copyToClipboard(importMap)}
            >
              Copy
            </button>
            <div class="highlight highlight-source-json">
              <pre
                class="language-json"
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
      </main>
    </dialog>
  );
}
export { ImportMapDialog };
export type { Prop as ImportMapDialogProp };
