/** @jsx h */
import { Component, h } from "nano-jsx";
import { store } from "@jspm/packages/store";
class PackageExports extends Component {
  // use the store in your component
  store = store.use();

  generateHash = async () => {
    if (typeof globalThis.document !== "undefined") {
      const { getStateHash } = await import(
        "@jspm/packages/generate-statehash"
      );

      const { selectedDeps } = this.store.state;

      const generatorHash = await getStateHash({
        selectedDeps: selectedDeps.map((subpath) => [subpath, !!subpath]),
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

    const selectedDeps = Object.keys(selectedExports).filter(
      (subpath) => selectedExports[subpath] === true
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
      if (JSON.stringify(newState) !== JSON.stringify(prevState)) {
        this.update();
      }
    });
  }

  didUnmount() {
    this.store.cancel();
  }

  render() {
    const { exports, name, version } = this.props;

    const { selectedDeps } = this.store.state;

    return (
      <section>
        <ul class="code">
          {exports.map((subpath) => {
            const subpathName = subpath.slice(1);
            const packageExport = `${name}@${version}${subpathName}`;
            const addedToImportMap = selectedDeps?.includes(packageExport);
            return (
              <li>
                <span class="export-name">
                  {subpathName && <span>{name}</span>}
                  <span class="export-subpath">{subpathName || name}</span>
                </span>
                <jspm-packages-package-export-add-to-importmap-toggle
                  data-package-export={packageExport}
                ></jspm-packages-package-export-add-to-importmap-toggle>
              </li>
            );
          })}
        </ul>
      </section>
    );
  }
}

export { PackageExports };
