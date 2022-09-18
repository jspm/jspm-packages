/** @jsx h */

/// <reference lib="dom" />
/// <reference types="https://deno.land/x/nano_jsx@v0.0.33/types.d.ts" />

import { h, hydrate, Component } from "nano-jsx";
import { store } from "#store";
import type { ENV, Store } from "#store";
import { fromPkgStrToPin, toPkgStr, sortArray } from "#functions";
import { ImportmapToggleButton } from "#importmap-toggle-button";
import type { ImportmapToggleButtonProp } from "#importmap-toggle-button";
import { ImportMapDialog } from "#importmap-dialog";
import type { ImportMapDialogProp } from "#importmap-dialog";
import { PackageExportAddToImportmapToggle } from "#package-export-add-to-importmap-toggle";
import type { PackageExportAddToImportmapToggleProp } from "#package-export-add-to-importmap-toggle";
import { GeneratorLink } from "#generator-link";
import type { GeneratorLinkProp } from "#generator-link";
import { Generator } from "@jspm/generator";

function hydrateImportmapToggleButton({
  dependencyCount,
  toggleImportmapDialog,
}: ImportmapToggleButtonProp) {
  const mountElement = document.querySelector(
    "jspm-packages-importmap-toggle-button"
  );

  if (mountElement) {
    return hydrate(
      <ImportmapToggleButton
        dependencyCount={dependencyCount}
        toggleImportmapDialog={toggleImportmapDialog}
      />,
      mountElement
    );
  }
  return false;
}

function hydrateImportMapDialog({
  generatorHash,
  dependencies,
  dialogOpen,
  importMap,
  importmapShareLink,
  importmapDialogOpenDependencyDetails,
  toggleImportmapDialog,
  toggleExportSelection,
  toggleDependencyDetail,
}: ImportMapDialogProp) {
  const mountElement = document.querySelector("jspm-packages-importmap-dialog");

  if (mountElement) {
    hydrate(
      <ImportMapDialog
        generatorHash={generatorHash}
        dependencies={dependencies}
        dialogOpen={dialogOpen}
        importMap={JSON.stringify(importMap, null, 2)}
        importmapShareLink={importmapShareLink}
        importmapDialogOpenDependencyDetails={
          importmapDialogOpenDependencyDetails
        }
        toggleImportmapDialog={toggleImportmapDialog}
        toggleExportSelection={toggleExportSelection}
        toggleDependencyDetail={toggleDependencyDetail}
      />,
      mountElement
    );
  }
}

function hydrateGeneratorLink({ generatorHash }: GeneratorLinkProp) {
  const mountElement = document.querySelector("jspm-packages-generator-link");

  if (mountElement) {
    return hydrate(
      <GeneratorLink generatorHash={generatorHash} />,
      mountElement
    );
  }
}

function hydratePackageExportAddToImportmapToggles({
  dependencies,
  toggleExportSelection,
}: Omit<PackageExportAddToImportmapToggleProp, "selected">) {
  const mountElements = document.querySelectorAll(
    "jspm-packages-package-export-add-to-importmap-toggle"
  );

  return mountElements?.forEach((mountElement) => {
    const { name, version, subpath } = mountElement.dataset;

    const dependency = toPkgStr({ name, version, subpath });
    const addedToImportMap = dependencies.includes(dependency);

    hydrate(
      <PackageExportAddToImportmapToggle
        dependency={dependency}
        selected={addedToImportMap}
        toggleExportSelection={toggleExportSelection}
      />,
      mountElement
    );
  });
}

function generateSandboxURLs() {
  if (typeof globalThis.document !== "undefined") {
    const codeBlocks = document.querySelectorAll(
      ".highlight-source-javascript pre, .highlight-source-js pre"
    );

    codeBlocks.forEach(async (codeBlock, index) => {
      //const { Generator } = await import("@jspm/generator");

      const generator = new Generator({
        env: ["production", "browser", "module"],
      });

      const outHtml = await generator.htmlInject(
        `
        <!doctype html>
        <script type="module">
        ${codeBlock.textContent}
        </script>
      `,
        { esModuleShims: true }
      );

      const { getSandboxHash } = await import("#statehash");
      const hash = await getSandboxHash(outHtml);
      const sandboxURL = `https://jspm.org/sandbox${hash}`;
      const sandboxLink = document.createElement("a");
      sandboxLink.href = sandboxURL;
      sandboxLink.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-3d-cube-sphere" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
      <path d="M6 17.6l-2 -1.1v-2.5"></path>
      <path d="M4 10v-2.5l2 -1.1"></path>
      <path d="M10 4.1l2 -1.1l2 1.1"></path>
      <path d="M18 6.4l2 1.1v2.5"></path>
      <path d="M20 14v2.5l-2 1.12"></path>
      <path d="M14 19.9l-2 1.1l-2 -1.1"></path>
      <line x1="12" y1="12" x2="14" y2="10.9"></line>
      <line x1="18" y1="8.6" x2="20" y2="7.5"></line>
      <line x1="12" y1="12" x2="12" y2="14.5"></line>
      <line x1="12" y1="18.5" x2="12" y2="21"></line>
      <path d="M12 12l-2 -1.12"></path>
      <line x1="6" y1="8.6" x2="4" y2="7.5"></line>
   </svg> Play in Sandbox`;
      sandboxLink.target = "_blank";
      sandboxLink.classList.add("button-run-jspm-sandbox");
      codeBlock.parentNode.prepend(sandboxLink);
    });
  }
}

function hydrateAll({
  state,
  toggleExportSelection,
  toggleImportmapDialog,
  toggleDependencyDetail,
}: {
  state: Store;
  toggleExportSelection: (event: MouseEvent) => void;
  toggleImportmapDialog: (event: MouseEvent) => void;
  toggleDependencyDetail: (event: MouseEvent) => void;
}) {
  const {
    dependencies,
    generatorHash,
    dialogOpen,
    importMap,
    importmapShareLink,
    importmapDialogOpenDependencyDetails,
  } = state;

  Promise.all([
    hydrateImportmapToggleButton({
      dependencyCount: dependencies.length,
      toggleImportmapDialog,
    }),
    hydrateGeneratorLink({ generatorHash }),
    hydrateImportMapDialog({
      dependencies,
      generatorHash,
      dialogOpen,
      importMap,
      importmapShareLink,
      importmapDialogOpenDependencyDetails,
      toggleImportmapDialog,
      toggleExportSelection,
      toggleDependencyDetail,
    }),
    hydratePackageExportAddToImportmapToggles({
      toggleExportSelection,
      dependencies,
      generatorHash,
    }),
  ]);
}

class DOM extends Component {
  store = store.use();

  static generator = new Generator();

  togglePagewidth = (dialogOpen: boolean = this.store.state.dialogOpen) => {
    const dialogRef = document.getElementById("importmap-dialog");
    const dialogWidth = dialogRef?.offsetWidth || 520;

    const packagePageRef = document.getElementById("packages-page");
    if (packagePageRef) {
      packagePageRef.style["margin-right"] = dialogOpen
        ? `${dialogWidth}px`
        : "0";
    }
  };

  toggleImportmapDialog = () => {
    const { dialogOpen, dependencies } = this.store.state;

    this.store.setState({
      ...this.store.state,
      dialogOpen: dependencies.length > 0 ? !dialogOpen : false,
    });
  };

  toggleDependencyDetail = (event: MouseEvent) => {
    const { open, id } = event.currentTarget;
    const { importmapDialogOpenDependencyDetails } = this.store.state;
    console.log(open, id);

    this.store.setState({
      ...this.store.state,
      importmapDialogOpenDependencyDetails: {
        ...importmapDialogOpenDependencyDetails,
        [id]: open,
      },
    });
  };

  generateJSPMGeneratorHash = async (state) => {
    const { stateToHash } = await import("#statehash");
    const generatorHash = await stateToHash(state);

    this.store.setState({
      ...this.store.state,
      generatorHash,
    });
  };

  installDependency = async (dependency: string) => {
    await DOM.generator.install(dependency);

    const importMap = await DOM.generator.getMap();

    this.store.setState({
      ...this.store.state,
      importMap,
    });

    return importMap;
  };

  unInstallDependency = async (dependency: string) => {
    const pin = fromPkgStrToPin(dependency);
    await DOM.generator.uninstall(pin);

    const importMap = await DOM.generator.getMap();

    this.store.setState({
      ...this.store.state,
      importMap,
    });
  };

  reinstallImportmap = async (
    env: ENV = this.store?.state?.jspmGeneratorState?.env
  ) => {
    const { importMap } = this.store.state;

    const generator = new Generator({
      env: Object.keys(env).filter((key) => env[key]),
      inputMap: importMap,
    });

    await generator.reinstall();

    const updatedImportMap = await generator.getMap();

    this.store.setState({
      ...this.store.state,
      importMap: updatedImportMap,
    });

    DOM.generator = generator;
  };

  updateJSPMGeneratorEnv = (env: ENV) => {
    const { jspmGeneratorState } = this.store.state;
    this.store.setState({
      ...this.store.state,
      jspmGeneratorState: { ...jspmGeneratorState, env },
    });
  };

  updateJSPMGeneratorDependencies = (dependencies: string[]) => {
    const { jspmGeneratorState } = this.store.state;

    const deps = dependencies.map((dependency: string) => [dependency, true]);

    this.store.setState({
      ...this.store.state,
      jspmGeneratorState: { ...jspmGeneratorState, deps },
    });
  };

  toggleExportSelection = (event: MouseEvent) => {
    event.preventDefault();

    const { value } = event.currentTarget as HTMLInputElement;

    const { dependencies } = this.store.state;

    const existingDependency = dependencies?.includes(value);

    const updatedDependencies = existingDependency
      ? dependencies.filter((dependency: string) => dependency !== value)
      : [...dependencies, value];

    existingDependency
      ? this.unInstallDependency(value)
      : this.installDependency(value);

    this.store.setState({
      ...this.store.state,
      dependencies: sortArray(updatedDependencies),
    });
  };

  didMount() {
    console.log("mounted");
    Promise.all([
      this.togglePagewidth(),
      hydrateAll({
        state: this.store.state,
        toggleExportSelection: this.toggleExportSelection,
        toggleImportmapDialog: this.toggleImportmapDialog,
        toggleDependencyDetail: this.toggleDependencyDetail,
      }),
      this.reinstallImportmap(),

      generateSandboxURLs(),
    ]);
    // this.generateSandboxURL();
    // subscribe to store changes
    this.store.subscribe((newState: Store, prevState: Store) => {
      // check if you need to update your component or not
      const prevDependencyCount = prevState.dependencies.length;

      const newDependencyCount = newState.dependencies.length;

      if (newDependencyCount !== prevDependencyCount) {
        hydrateImportmapToggleButton({
          toggleImportmapDialog: this.toggleImportmapDialog,
          dependencyCount: newDependencyCount,
        });
      }

      if (
        JSON.stringify(newState.dependencies) !==
        JSON.stringify(prevState.dependencies)
      ) {
        Promise.all([
          hydratePackageExportAddToImportmapToggles({
            toggleExportSelection: this.toggleExportSelection,
            dependencies: newState.dependencies,
          }),
          this.updateJSPMGeneratorDependencies(newState.dependencies),
        ]);
      }

      if (
        JSON.stringify(newState.jspmGeneratorState) !==
        JSON.stringify(prevState.jspmGeneratorState)
      ) {
        Promise.all([
          this.generateJSPMGeneratorHash(newState.jspmGeneratorState),
        ]);
      }

      if (newState.generatorHash !== prevState.generatorHash) {
        hydrateGeneratorLink({ generatorHash: newState.generatorHash });
      }

      if (
        JSON.stringify(newState.jspmGeneratorState.env) !==
        JSON.stringify(prevState.jspmGeneratorState.env)
      ) {
        Promise.all([this.reinstallImportmap(newState.jspmGeneratorState.env)]);
      }

      if (newState.dialogOpen !== prevState.dialogOpen) {
        this.togglePagewidth(newState.dialogOpen);
      }

      if (
        newState.generatorHash !== prevState.generatorHash ||
        JSON.stringify(newState.dependencies) !==
          JSON.stringify(prevState.dependencies) ||
        newState.dialogOpen !== prevState.dialogOpen ||
        newState.importMap !== prevState.importMap ||
        newState.importmapShareLink !== prevState.importmapShareLink ||
        JSON.stringify(newState.importmapDialogOpenDependencyDetails) !==
          JSON.stringify(prevState.importmapDialogOpenDependencyDetails) ||
        JSON.stringify(newState.importMap) !==
          JSON.stringify(prevState.importMap)
      ) {
        hydrateImportMapDialog({
          dependencies: newState.dependencies,
          generatorHash: newState.generatorHash,
          dialogOpen: newState.dialogOpen,
          importMap: newState.importMap,
          importmapShareLink: newState.importmapShareLink,
          importmapDialogOpenDependencyDetails:
            newState.importmapDialogOpenDependencyDetails,
          toggleImportmapDialog: this.toggleImportmapDialog,
          toggleExportSelection: this.toggleExportSelection,
          toggleDependencyDetail: this.toggleDependencyDetail,
        });
      }
    });
  }

  didUnmount() {
    console.log("unmounted");
    // cancel the store subscription
    this.store.cancel();
  }
}

if (typeof globalThis.document !== "undefined") {
  hydrate(<DOM />);
}
