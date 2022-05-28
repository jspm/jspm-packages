/** @jsx h */
import { h, hydrate } from "nano-jsx";
import { ImportMapDialog } from "@jspm/packages/importmap-dialog";
import { ImportmapToggleButton } from "@jspm/packages/importmap-toggle-button";

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

if (typeof globalThis.document !== "undefined") {
  hydrateImportmapToggleButton();
  hydrateImportMapDialog();
}
