/** @jsx h */
import { Component, h } from "nano-jsx";
import { store } from "@jspm/packages/store";

class PackageExportAddToImportmapToggle extends Component {
  // use the store in your component
  store = store.use();

  generateHash = async () => {
    if (typeof globalThis.document !== "undefined") {
      const { getStateHash } = await import("@jspm/packages/generate-statehash");

      const { deps } = this.store.state.jspmGeneratorState;

      const generatorHash = await getStateHash({
        deps,
      });

      if (generatorHash) {
        this.store.setState({ ...this.store.state, generatorHash });
      }
    }
  };

  toggleExportSelection = (event) => {
    event.preventDefault();

    const { value } = event.target;
    const { selectedExports, jspmGeneratorState } = this.store.state;

    selectedExports[value] = !selectedExports[value];

    const deps = Object.keys(selectedExports).filter((subpath) =>
      selectedExports[subpath] === true
    ).map((
      subpath,
    ) => [subpath, !!subpath]);

    this.store.setState({ ...this.store.state, jspmGeneratorState: {...jspmGeneratorState, deps}, selectedExports });
    this.generateHash();
  };

  didMount() {
    const { generatorHash } = this.store.state;

    if (!generatorHash) {
      this.generateHash();
    }
    // this.generateSandboxURL();
    // subscribe to store changes
    this.store.subscribe((newState, prevState) => {
      // check if you need to update your component or not
      if (newState.generatorHash !== prevState.generatorHash) {
        this.update();
      }
    });
  }

  didUnmount() {
    // cancel the store subscription
    this.store.cancel();
  }

  render() {
    const {
      packageExport,
    } = this.props;

    const { deps } = this.store.state.jspmGeneratorState;
    
    const addedToImportMap = deps?.includes(packageExport);

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
