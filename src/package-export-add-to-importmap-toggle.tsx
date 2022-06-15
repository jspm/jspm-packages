/** @jsx h */
import { Component, h } from "nano-jsx";
import { store } from "@jspm/packages/store";

class PackageExportAddToImportmapToggle extends Component {
  // use the store in your component
  store = store.use();

  generateHash = async () => {
    if (typeof globalThis.document !== "undefined") {
      const { getStateHash } = await import("@jspm/packages/generate-statehash");

      const { selectedDeps } = this.store.state;

      const generatorHash = await getStateHash({
        selectedDeps: selectedDeps.map((
          subpath,
        ) => [subpath, !!subpath]),
      });

      if (generatorHash) {
        this.store.setState({ ...this.store.state, generatorHash });
      }
    }
  };

  toggleExportSelection = (event) => {
    event.preventDefault();

    const { value } = event.target;
    const { selectedExports } = this.store.state;

    selectedExports[value] = !selectedExports[value];

    const selectedDeps = Object.keys(selectedExports).filter((subpath) =>
      selectedExports[subpath] === true
    );

    this.store.setState({ ...this.store.state, selectedDeps, selectedExports });
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
