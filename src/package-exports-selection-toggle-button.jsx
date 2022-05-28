/** @jsx h */
import nano, { Component, h } from "nano-jsx";
import { store } from "@jspm/packages/store";

class PackageExports extends Component {
  // use the store in your component
  store = store.use();

  generateHash = async () => {
    if (typeof globalThis.document !== "undefined") {
      const { getStateHash } = await import("./generate-statehash.js");

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

  toggleVersionSelector = (event) => {
    event.preventDefault();
    const { openVersionSelector } = this.store.state;
    this.store.setState({
      ...this.store.state,
      openVersionSelector: !openVersionSelector,
    });
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
      exports,
      name,
      version,
    } = this.props;

    const { selectedDeps } = this.store.state;
    // display the name property of your store's state
    return (
      <section>
        <h4>Package exports</h4>
        <ul class="code">
          {exports.map((subpath) => {
            const packageExport = `${name}@${version}${subpath.slice(1)}`;
            const addedToImportMap = selectedDeps?.includes(packageExport);
            return (
              <li>
                {`${name}${subpath.slice(1)}`}
                <button
                  data-selected={addedToImportMap}
                  type="button"
                  onClick={this.toggleExportSelection}
                  value={packageExport}
                >
                  {addedToImportMap
                    ? "− Remove from importmap"
                    : "+ Add to importmap"}
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    );
  }
}

export { PackageExports };
