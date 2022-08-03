/** @jsx h */

/// <reference lib="dom" />
/// <reference types="https://deno.land/x/nano_jsx@v0.0.33/types.d.ts" />

import { Component, h } from "nano-jsx";
import { store } from "@jspm/packages/store";

class ImportmapToggleButton extends Component {
  // use the store in your component
  store = store.use();

  toggleImportmapDialog = (event: MouseEvent) => {
    event.preventDefault();
    const {openImportmapDialog} = this.store.state;
    this.store.setState({ ...this.store.state, openImportmapDialog: !openImportmapDialog });
  };

  didMount() {
    // subscribe to store changes
    this.store.subscribe((newState: { openImportmapDialog: boolean; jspmGeneratorState: { deps: string[]; }; }, prevState: { openImportmapDialog: boolean; jspmGeneratorState: { deps: string[]; }; }) => {
      // check if you need to update your component or not
      if (newState.openImportmapDialog !== prevState.openImportmapDialog || newState.jspmGeneratorState.deps.length !== prevState.jspmGeneratorState.deps.length) {
        this.update();
      }
    });
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
        [{`${this.store.state.jspmGeneratorState.deps.length}`}]
      </button>
    );
  }
}

export { ImportmapToggleButton };
