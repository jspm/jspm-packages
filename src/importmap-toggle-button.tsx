/** @jsx h */
import { Component, h } from "nano-jsx";
import { store } from "@jspm/packages/store";

//const machine = interpret(toggleMachine);
class ImportmapToggleButton extends Component {
  // use the store in your component
  store = store.use();

  generateSandboxURL = () => {
    if (typeof globalThis.document !== "undefined") {
      const codeBlocks = document.querySelectorAll(
        ".highlight-source-javascript pre, .highlight-source-js pre",
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

        const { getSandboxHash } = await import("@jspm/packages/statehash");
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

  toggleImportmapDialog = (event) => {
    event.preventDefault();
    const {openImportmapDialog} = this.store.state;
    this.store.setState({ ...this.store.state, openImportmapDialog: !openImportmapDialog });
  };

  didMount() {
    // subscribe to store changes
    this.store.subscribe((newState, prevState) => {
      // check if you need to update your component or not
      if (JSON.stringify(newState) !== JSON.stringify(prevState)) {
        this.update();
      }
    });
    this.generateSandboxURL();
  }

  didUnmount() {
    // cancel the store subscription
    this.store.cancel();
  }

  render() {
    // display the name property of your store's state
    return (
      <button
        class="toggle-dialog"
        title="Explore Importmap"
        onClick={this.toggleImportmapDialog}
      >
        [{`${this.store.state.selectedDeps.length}`}]
      </button>
    );
  }
}

export { ImportmapToggleButton };
