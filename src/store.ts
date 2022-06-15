import { Store } from "nano-jsx";

const store = new Store(
  {
    selectedExports: {},
    selectedDeps: [],
    generatorHash: "",
    openImportmapDialog: false,
    openVersionSelector: false,
    sandboxHashes: {},
  },
  "@jspm/packages/store",
  "local",
);

export { store };
