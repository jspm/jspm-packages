/** @jsx h */

/// <reference lib="dom" />
/// <reference types="https://deno.land/x/nano_jsx@v0.0.33/types.d.ts" />

import { h, hydrate } from "nano-jsx";
import { ImportmapToggleButton } from "@jspm/packages/importmap-toggle-button";
import { ImportMapDialog } from "@jspm/packages/importmap-dialog";
import { PackageExportAddToImportmapToggle } from "@jspm/packages/package-export-add-to-importmap-toggle";
import { GeneratorLink } from "@jspm/packages/generator-link";

function generateSandboxURLs() {
  if (typeof globalThis.document !== "undefined") {
    const codeBlocks = document.querySelectorAll(
      ".highlight-source-javascript pre, .highlight-source-js pre"
    );

    codeBlocks.forEach(async (codeBlock, index) => {
      const { Generator } = await import("@jspm/generator");

      const generator = new Generator({
        env: ["production", "browser", "module"],
      });

      const outHtml = await generator.addMappings(
        `
        <!doctype html>
        <script type="module">
        ${codeBlock.textContent}
        </script>
      `,
        { esModuleShims: true }
      );

      const { getSandboxHash } = await import("@jspm/packages/statehash");
      const hash = await getSandboxHash(outHtml);
      const sandboxURL = `https://jspm.org/sandbox${hash}`;
      const sandboxLink = document.createElement("a");
      sandboxLink.href = sandboxURL;
      sandboxLink.innerText = "Run in JSPM Sandbox";
      sandboxLink.target = "_blank";
      codeBlock.parentNode.prepend(sandboxLink);
    });
  }
}

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

function hydratePackageExportAddToImportmapToggles() {
  const mountElements = document.querySelectorAll(
    "jspm-packages-package-export-add-to-importmap-toggle"
  );
  mountElements.forEach((mountElement) => {
    const { packageExport } = mountElement.dataset;

    hydrate(
      <PackageExportAddToImportmapToggle packageExport={packageExport} />,
      mountElement
    );
  });
}

if (typeof globalThis.document !== "undefined") {
  Promise.all([
    hydrateImportmapToggleButton(),
    hydrateGeneratorLink(),
    hydrateImportMapDialog(),
    hydratePackageExportAddToImportmapToggles(),
    generateSandboxURLs()
  ]);
}
