/** @jsx h */
import { Component, h } from "nano-jsx";
import { store } from "@jspm/packages/store";

//const machine = interpret(toggleMachine);
class ImportmapToggleButton extends Component {
  // use the store in your component
  store = store.use();

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
