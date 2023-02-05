/** @jsx h */

/// <reference lib="dom" />
/// <reference types="https://deno.land/x/nano_jsx@v0.0.35/types.ts" />

import { Component, h, hydrate } from "nano-jsx";
import { Generator } from "@jspm/generator";
import { store } from "#store";
import type { ENV, Store } from "#store";
import { fromPkgStrToPin, getSearchResult, sortArray } from "#functions";
import { ImportmapToggleButton } from "#importmap-toggle-button";
import type { ImportmapToggleButtonProp } from "#importmap-toggle-button";
import { ImportMapDialog } from "#importmap-dialog";
import type { ImportMapDialogProp } from "#importmap-dialog";
import { GeneratorLink } from "#generator-link";
import type { GeneratorLinkProp } from "#generator-link";
import { SearchForm } from "#search-form";
import type { SearchFormProps } from "#search-form";
import { SearchSuggestions } from "#search-suggestions";
import type { SearchSuggestionsProps } from "#search-suggestions";
import { ExamplesNavigation } from "#examples-navigation";
import type { ExamplesNavigationProp } from "#examples-navigation";
import { ExampleSandbox } from "#example-sandbox";
import type { ExampleSandboxProp } from "#example-sandbox";
function hydrateImportmapToggleButton({
  dependencyCount,
  toggleImportmapDialog,
}: ImportmapToggleButtonProp) {
  const mountElement = document.querySelector(
    "jspm-packages-importmap-toggle-button",
  );

  if (mountElement) {
    return hydrate(
      <ImportmapToggleButton
        dependencyCount={dependencyCount}
        toggleImportmapDialog={toggleImportmapDialog}
      />,
      mountElement,
    );
  }
  return false;
}

function hydrateExamplesNavigation({
  activate,
}: ExamplesNavigationProp) {
  const mountElement = document.querySelector(
    "jspm-packages-example-navigation",
  );

  if (mountElement) {
    return hydrate(
      <ExamplesNavigation
        activate={activate}
      />,
      mountElement,
    );
  }
  return false;
}

function hydrateExampleSandbox({
  sandboxActiveTab,
}: ExampleSandboxProp) {
  const mountElement = document.querySelector(
    "jspm-packages-example-sandbox",
  );

  if (mountElement) {
    return hydrate(
      <ExampleSandbox
        sandboxActiveTab={sandboxActiveTab}
      />,
      mountElement,
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
        importmapDialogOpenDependencyDetails={importmapDialogOpenDependencyDetails}
        toggleImportmapDialog={toggleImportmapDialog}
        toggleExportSelection={toggleExportSelection}
        toggleDependencyDetail={toggleDependencyDetail}
      />,
      mountElement,
    );
  }
}

function hydrateGeneratorLink({ generatorHash }: GeneratorLinkProp) {
  const mountElement = document.querySelector("jspm-packages-generator-link");

  if (mountElement) {
    return hydrate(
      <GeneratorLink generatorHash={generatorHash} />,
      mountElement,
    );
  }
}

function hydrateSearchForm({ onInput, value }: SearchFormProps) {
  const mountElement = document.querySelector("jspm-packages-search-form");

  if (mountElement) {
    return hydrate(
      <SearchForm onInput={onInput} value={value} />,
      mountElement,
    );
  }
}

function hydrateSearchSuggestion(searchResult: SearchSuggestionsProps) {
  const mountElement = document.querySelector(
    "jspm-packages-search-suggestions",
  );

  if (mountElement && searchResult?.objects) {
    return hydrate(
      <SearchSuggestions objects={searchResult?.objects} />,
      mountElement,
    );
  }
}

function hydrateAll({
  state,
  toggleExportSelection,
  toggleImportmapDialog,
  toggleDependencyDetail,
  handleNPMSearch,
  activateSandboxTab,
}: {
  state: Store;
  toggleExportSelection: (event: MouseEvent) => void;
  toggleImportmapDialog: (event: MouseEvent) => void;
  toggleDependencyDetail: (event: MouseEvent) => void;
  handleNPMSearch: (Event: InputEvent) => void;
  activateSandboxTab: (event: MouseEvent) => void;
}) {
  const {
    dependencies,
    generatorHash,
    dialogOpen,
    importMap,
    importmapShareLink,
    importmapDialogOpenDependencyDetails,
    npmSearch,
    searchTerm,
    sandboxActiveTab,
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
    hydrateSearchForm({ onInput: handleNPMSearch, value: searchTerm }),
    hydrateSearchSuggestion(npmSearch[searchTerm]),
    hydrateExampleSandbox({ sandboxActiveTab }),
    hydrateExamplesNavigation({ activate: activateSandboxTab }),
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
  activateSandboxTab = (event: MouseEvent) => {
    const { id } = event.currentTarget;
    this.store.setState({
      ...this.store.state,
      sandboxActiveTab: id,
    });
  };

  toggleDependencyDetail = (event: MouseEvent) => {
    const { open, id } = event.currentTarget;
    const { importmapDialogOpenDependencyDetails } = this.store.state;

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
    env: ENV = this.store?.state?.jspmGeneratorState?.env,
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

  handleNPMSearch = async (event: InputEvent) => {
    const { value } = event?.currentTarget;
    console.log(value);

    const { npmSearch } = this.store.state;

    if (value in npmSearch) {
      this.store.setState({
        ...this.store.state,
        searchTerm: value,
      });
      return npmSearch[value];
    }

    const result = await getSearchResult(value);

    this.store.setState({
      ...this.store.state,
      searchTerm: value,
      npmSearch: { ...npmSearch, [value]: result },
    });

    return result;
  };

  didMount() {
    Promise.all([
      this.togglePagewidth(),
      hydrateAll({
        state: this.store.state,
        toggleExportSelection: this.toggleExportSelection,
        toggleImportmapDialog: this.toggleImportmapDialog,
        toggleDependencyDetail: this.toggleDependencyDetail,
        handleNPMSearch: this.handleNPMSearch,
        activateSandboxTab: this.activateSandboxTab,
      }),
      this.reinstallImportmap(),
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

      if (newState.sandboxActiveTab !== prevState.sandboxActiveTab) {
        hydrateExampleSandbox({ sandboxActiveTab: newState.sandboxActiveTab });
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
      if (
        JSON.stringify(newState.npmSearch[newState.searchTerm]) !==
          JSON.stringify(prevState.npmSearch[prevState.searchTerm])
      ) {
        hydrateSearchSuggestion(newState.npmSearch[newState.searchTerm]);
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
