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
    this.selectedExports = localStorage.getItem("selectedExports")
      ? JSON.parse(localStorage.getItem("selectedExports"))
      : this.selectedExports;
    this.selectedDeps = localStorage.getItem("selectedDeps")
      ? JSON.parse(localStorage.getItem("selectedDeps"))
      : this.selectedDeps;
    this.generatorHash = localStorage.getItem("generatorHash") ||
      this.generatorHash;
  }

  selectedExports = {};
  selectedDeps = [];
  generatorHash = "";
  openImportmapDialog = false;
  openVersionSelector = false;
  sandboxHashes = {};

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

  generateSandboxURL = () => {
    if (typeof globalThis.document !== "undefined") {
      const codeBlocks = document.querySelectorAll(
        ".highlight-source-javascript pre",
        ".highlight-source-js pre",
      );

      codeBlocks.forEach(async (codeBlock, index) => {
        const { Generator } = await import("@jspm/generator");

        const generator = new Generator({
          env: ["production", "browser", "module"],
        });

        const outHtml = await generator.htmlGenerate(
          `
          <!doctype html>
          <script type="module">
          ${codeBlock.textContent}
          </script>
        `,
          { esModuleShims: true },
        );

        const { getSandboxHash } = await import("./statehash.js");
        const hash = await getSandboxHash(outHtml);
        const sandboxURL = `https://jspm.org/sandbox${hash}`;
        const sandboxLink = document.createElement("a");
        sandboxLink.href = sandboxURL;
        sandboxLink.innerText = "Run in JSPM Sandbox";
        sandboxLink.target = "_blank";
        codeBlock.parentNode.prepend(sandboxLink);
      });
    }
  };

  toggleExportSelection = (event) => {
    event.preventDefault();

    this.selectedExports[event.target.value] = !this
      .selectedExports[event.target.value];

    this.selectedDeps = Object.keys(this.selectedExports).filter((subpath) =>
      this.selectedExports[subpath] === true
    );
    this.generateHash();
    this.update();
  };

  toggleImportmapDialog = (event) => {
    event.preventDefault();
    this.openImportmapDialog = !this.openImportmapDialog;
    this.update();
  };

  toggleVersionSelector = (event) => {
    event.preventDefault();
    this.openVersionSelector = !this.openVersionSelector;
    this.update();
  };

  didMount() {
    if (!this.generatorHash) {
      this.generateHash();
    }
    this.generateSandboxURL();
  }
  didUpdate() {
    localStorage.setItem(
      "selectedExports",
      JSON.stringify(this.selectedExports),
    );
    localStorage.setItem("selectedDeps", JSON.stringify(this.selectedDeps));
    localStorage.setItem("generatorHash", this.generatorHash);
  }
  render() {
    const {
      created,
      description,
      downloads,
      exports,
      features,
      license,
      links,
      maintainers,
      types,
      name,
      readme,
      updated,
      version,
      versions,
    } = this.props;

    return (
      <Package
        created={created}
        description={description}
        downloads={downloads}
        exports={exports}
        features={features}
        license={license}
        links={links}
        name={name}
        readme={readme}
        toggleExportSelection={this.toggleExportSelection}
        maintainers={maintainers}
        types={types}
        updated={updated}
        version={version}
        versions={versions}
        generatorHash={this.generatorHash}
        selectedDeps={this.selectedDeps}
        openImportmapDialog={this.openImportmapDialog}
        toggleImportmapDialog={this.toggleImportmapDialog}
        openVersionSelector={this.openVersionSelector}
        toggleVersionSelector={this.toggleVersionSelector}
      />
    );
  }
}

export { DomRoot };
