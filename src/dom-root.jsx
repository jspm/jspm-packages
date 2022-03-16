/** @jsx h */
import nano, { Component, h } from "nano-jsx";
import { Package } from "./package.js";

class DomRoot extends Component {
  constructor(props) {
    super(props);
    // const selectedExports = {};
    // if (props.selectedExports) {
    //   Object.entries(props.selectedExports).forEach(([subpath, selected]) => {
    //     if (selected === true) {
    //       selectedExports[subpath] = selected;
    //     }
    //   });
    // }
    this.selectedExports = localStorage.getItem('selectedExports') ? JSON.parse(localStorage.getItem('selectedExports')) : this.selectedExports;
    this.selectedDeps = localStorage.getItem('selectedDeps') ? JSON.parse(localStorage.getItem('selectedDeps')) : this.selectedDeps;
    this.generatorHash = localStorage.getItem('generatorHash') || this.generatorHash;
  }

  selectedExports = {};
  selectedDeps = [];
  generatorHash = '';

  generateHash = async () => {
    if (typeof globalThis.document !== "undefined") {

      const { getStateHash } = await import("./generate-statehash.js");
      const selectedDeps = this.selectedDeps.map((
        subpath,
      ) => [subpath, !!subpath]);

      const generatorHash = await getStateHash({ selectedDeps });

      if (generatorHash) {
        this.generatorHash = generatorHash;
        this.update();
      }
    }
  };

  toggleExportSelection = (event) => {
    event.preventDefault();
    console.log(event);
    this.selectedExports[event.target.value] = !this
      .selectedExports[event.target.value];
    console.log(event.target.value);
    this.selectedDeps = Object.keys(this.selectedExports).filter((subpath) =>
      this.selectedExports[subpath] === true
    );
    this.generateHash();
    console.log(JSON.stringify(this.selectedExports));
    this.update();
  };

  didMount() {
    if (!this.generatorHash) {
      this.generateHash();
    }
  }
  didUpdate() {
    localStorage.setItem('selectedExports', JSON.stringify(this.selectedExports));
    localStorage.setItem('selectedDeps', JSON.stringify(this.selectedDeps));
    localStorage.setItem('generatorHash', this.generatorHash);
  }
  render() {
    const {
      created,
      downloads,
      exports,
      features,
      license,
      links,
      maintainers,
      name,
      readme,
      updated,
      version,
    } = this.props;

    return (
      <Package
        created={created}
        downloads={downloads}
        exports={exports}
        features={features}
        license={license}
        links={links}
        name={name}
        readme={readme}
        toggleExportSelection={this.toggleExportSelection}
        maintainers={maintainers}
        updated={updated}
        version={version}
        generatorHash={this.generatorHash}
        selectedDeps={this.selectedDeps}
      />
    );
  }
}

export { DomRoot };
