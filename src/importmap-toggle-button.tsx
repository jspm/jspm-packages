/** @jsx h */

/// <reference lib="dom" />
/// <reference types="https://deno.land/x/nano_jsx@v0.0.33/types.d.ts" />

import { h } from "nano-jsx";

type Prop = {
  dependencyCount: number;
  toggleImportmapDialog: (event: MouseEvent) => void;
};

function ImportmapToggleButton({
  toggleImportmapDialog,
  dependencyCount,
}: Prop) {
  return (
    <button
      class="toggle-dialog"
      title="Explore Importmap"
      onClick={toggleImportmapDialog}
    >
      [{`${dependencyCount}`}]
    </button>
  );
}

export { ImportmapToggleButton };
export type { Prop as ImportmapToggleButtonProp };
