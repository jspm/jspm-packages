/** @jsx h */
import { h, hydrate } from "nano-jsx";
import { ImportmapToggleButton } from "@jspm/packages/importmap-toggle-button";
import { ImportMapDialog } from "@jspm/packages/importmap-dialog";
import { GeneratorLink } from "@jspm/packages/generator-link";

function hydrateImportmapToggleButton() {
  const mountElement = document.querySelector(
    "jspm-packages-importmap-toggle-button"
  );

  if (mountElement) {
    hydrate(<ImportmapToggleButton />, mountElement);
  }
}

function hydrateImportMapDialog() {
  const mountElement = document.querySelector("jspm-packages-importmap-dialog");

  if (mountElement) {
    hydrate(<ImportMapDialog />, mountElement);
  }
}

function hydrateGeneratorLink() {
  const mountElement = document.querySelector("jspm-packages-generator-link");

  if (mountElement) {
    hydrate(<GeneratorLink />, mountElement);
  }
}

if (typeof globalThis.document !== "undefined") {
  hydrateImportmapToggleButton();
  hydrateGeneratorLink();
  hydrateImportMapDialog();
}
