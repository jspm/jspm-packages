/** @jsx h */
/// <reference types="https://deno.land/x/nano_jsx@v0.0.33/types.d.ts" />

import { Component, h } from "nano-jsx";
import { store } from "@jspm/packages/store";

type Store = { generatorHash: string };

class GeneratorLink extends Component {
  // use the store in your component
  store = store.use();

  didMount() {
    // subscribe to store changes
    this.store.subscribe((newState: Store, prevState: Store) => {
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
    // display the name property of your store's state
    return (
      <a
        target="_blank"
        href={`https://generator.jspm.io/${this.store.state.generatorHash}`}
      >
        Generator
      </a>
    );
  }
}

export { GeneratorLink };
