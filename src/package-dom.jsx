/** @jsx h */
import { h, hydrate } from "nano-jsx";
import { ImportmapToggleButton } from "@jspm/packages/importmap-toggle-button";
// import { PackageExports } from "@jspm/packages/package-exports";
import { ImportMapDialog } from "@jspm/packages/importmap-dialog";
import {PackageExportAddToImportmapToggle} from "@jspm/packages/package-export-add-to-importmap-toggle"

function hydrateImportmapToggleButton() {
  const mountElement = document.querySelector(
    "jspm-packages-importmap-toggle-button",
  );

  if (mountElement) {
    hydrate(
      <ImportmapToggleButton />,
      mountElement,
    );
  }
}

function hydrateImportMapDialog() {
  const mountElement = document.querySelector(
    "jspm-packages-importmap-dialog",
  );

  if (mountElement) {
    hydrate(
      <ImportMapDialog />,
      mountElement,
    );
  }
}

async function hydratePackageExports() {
  const mountElement = document.querySelector("jspm-packages-package-exports");

  if (mountElement) {
    const {
      name,
      version,
    } = mountElement.dataset;

    const jspmPackage = await import(
      `https://ga.jspm.io/npm:${name}@${version}/package.json`,
      {
        assert: { type: "json" },
      }
    );

    const {
      description,
      keywords,
      license,
      files,
      exports,
      types,
      type,
      homepage,
      repository,
      bugs,
    } = jspmPackage.default;

    const filteredExports = Object.keys(exports).filter((expt) =>
      !expt.endsWith("!cjs") && !expt.endsWith("/") &&
      expt.indexOf("*") === -1
    ).sort();

    hydrate(
      <PackageExports
        name={name}
        version={version}
        exports={filteredExports}
      />,
      mountElement,
    );
  }
}

function hydratePackageExportAddToImportmapToggles() {
  const mountElements = document.querySelectorAll(
    "jspm-packages-package-export-add-to-importmap-toggle",
  );
  mountElements.forEach((mountElement) => {
    const {
      packageExport,
    } = mountElement.dataset;

    hydrate(
      <PackageExportAddToImportmapToggle
        packageExport={packageExport}
      />,
      mountElement,
    );
  });
}

if (typeof globalThis.document !== "undefined") {
  hydrateImportmapToggleButton();
  //hydratePackageExports();
  hydrateImportMapDialog();
  hydratePackageExportAddToImportmapToggles();
}