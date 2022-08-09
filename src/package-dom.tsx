/** @jsx h */

/// <reference lib="dom" />
/// <reference types="https://deno.land/x/nano_jsx@v0.0.33/types.d.ts" />

import { h, hydrate, Component } from "nano-jsx";
import { store } from "@jspm/packages/store";
import { toPkgStr, sortArray } from "@jspm/packages/functions";
import { ImportmapToggleButton } from "@jspm/packages/importmap-toggle-button";
import type { ImportmapToggleButtonProp } from "@jspm/packages/importmap-toggle-button";
import { ImportMapDialog } from "@jspm/packages/importmap-dialog";
import type { ImportMapDialogProp } from "@jspm/packages/importmap-dialog";
import { PackageExportAddToImportmapToggle } from "@jspm/packages/package-export-add-to-importmap-toggle";
import type { PackageExportAddToImportmapToggleProp } from "@jspm/packages/package-export-add-to-importmap-toggle";
import { GeneratorLink } from "@jspm/packages/generator-link";
import type { GeneratorLinkProp } from "@jspm/packages/generator-link";

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
        importMap={importMap}
        importmapShareLink={importmapShareLink}
        importmapDialogOpenDependencyDetails={importmapDialogOpenDependencyDetails}
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

function hydrateAll({
  state,
  toggleExportSelection,
  toggleImportmapDialog,
  toggleDependencyDetail,
}: {
  state: {
    generatorHash: string;
    dependencies: string[];
    dialogOpen: boolean;
    importMap: string;
    importmapShareLink: string;
    importmapDialogOpenDependencyDetails: { [key: string]: boolean };
  };
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
    //generateSandboxURLs()
  ]);
}
class DOM extends Component {
  store = store.use();

  toggleImportmapDialog = () => {
    const { dialogOpen } = this.store.state;

    this.store.setState({
      ...this.store.state,
      dialogOpen: !dialogOpen,
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
    const { stateToHash } = await import("@jspm/packages/statehash");
    const generatorHash = await stateToHash(state);

    this.store.setState({
      ...this.store.state,
      generatorHash,
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

    this.store.setState({
      ...this.store.state,
      dependencies: sortArray(updatedDependencies),
    });
  };

  didMount() {
    console.log("mounted");
    hydrateAll({
      state: this.store.state,
      toggleExportSelection: this.toggleExportSelection,
      toggleImportmapDialog: this.toggleImportmapDialog,
      toggleDependencyDetail: this.toggleDependencyDetail,
    });
    // this.generateSandboxURL();
    // subscribe to store changes
    this.store.subscribe((newState, prevState) => {
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
        newState.generatorHash !== prevState.generatorHash ||
        JSON.stringify(newState.dependencies) !==
          JSON.stringify(prevState.dependencies) ||
        newState.dialogOpen !== prevState.dialogOpen ||
        newState.importMap !== prevState.importMap ||
        newState.importmapShareLink !== prevState.importmapShareLink ||
        JSON.stringify(newState.importmapDialogOpenDependencyDetails) !==
          JSON.stringify(prevState.importmapDialogOpenDependencyDetails)
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
