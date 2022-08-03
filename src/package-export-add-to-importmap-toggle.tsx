/** @jsx h */
import { Component, h } from "nano-jsx";
import { store } from "@jspm/packages/store";

class PackageExportAddToImportmapToggle extends Component {
  // use the store in your component
  store = store.use();

  generateImportmap = async (dependency?: string | string[]) => {
    if (typeof globalThis.document !== "undefined") {
      const { deps = [], env = ["production", "browser", "module"] } =
        this.store.state.jspmGeneratorState;

      const { Generator } = await import("@jspm/generator");

      const generator = new Generator({
        env: Object.keys(env).filter((key) => env[key]),
      });
      const dependencies = deps.map(([dependency]) => dependency);
      await generator.install(dependency || dependencies);
      const importMap = generator.getMap();

      this.store.setState({ ...this.store.state, importMap: importMap });
      return importMap;
    }
  };

  generateHash = async () => {
    if (typeof globalThis.document !== "undefined") {
      const { getStateHash } = await import(
        "@jspm/packages/generate-statehash"
      );

      const { jspmGeneratorState } = this.store.state;

      const generatorHash = await getStateHash({
        jspmGeneratorState,
      });

      if (generatorHash) {
        this.store.setState({ ...this.store.state, generatorHash });
      }
    }
  };

  toggleExportSelection = (event) => {
    event.preventDefault();

    const { value } = event.currentTarget;
    const { selectedExports, jspmGeneratorState } = this.store.state;

    selectedExports[value] = !selectedExports[value];

    const selectedDeps = Object.keys(selectedExports).filter(
      (subpath) => selectedExports[subpath] === true
    );

    const deps = selectedDeps.map((subpath) => [subpath, !!subpath]);

    this.store.setState({
      ...this.store.state,
      jspmGeneratorState: { ...jspmGeneratorState, deps },
      selectedDeps,
      selectedExports,
    });

    if (typeof globalThis.document !== "undefined") {
      this.generateHash();
      this.generateImportmap();
    }
  };

  didMount() {
    // this.generateSandboxURL();
    // subscribe to store changes
    this.store.subscribe((newState, prevState) => {
      // check if you need to update your component or not
      if (newState.generatorHash !== prevState.generatorHash) {
        this.update();
      }
    });

    const { generatorHash, importMap } = this.store.state;

    if (typeof globalThis.document !== "undefined") {
      this.generateImportmap();

      if (!generatorHash) {
        this.generateHash();
      }
      if (!importMap) {
        this.generateImportmap();
      }
    }
  }

  didUnmount() {
    // cancel the store subscription
    this.store.cancel();
  }

  render() {
    const { packageExport } = this.props;

    const { selectedDeps } = this.store.state;

    const addedToImportMap = selectedDeps?.includes(packageExport);

    return (
      <button
        data-selected={addedToImportMap}
        type="button"
        onClick={this.toggleExportSelection}
        value={packageExport}
      >
        {addedToImportMap ? "−" : "+"}
      </button>
    );
  }
}

export { PackageExportAddToImportmapToggle };
