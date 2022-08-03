import { Store } from "nano-jsx";

const jspmGeneratorState = {
  name: "Untitled",
  deps: [],
  env: {
    development: true,
    production: false,
    browser: true,
    node: false,
    module: true,
    deno: false,
  },
  output: {
    system: false,
    boilerplate: false,
    minify: false,
    json: true,
    integrity: false,
    preload: false,
  },
};

const store = new Store(
  {
    selectedExports: {},
    selectedDeps: [],
    generatorHash: "",
    openImportmapDialog: false,
    openVersionSelector: false,
    sandboxHashes: {},
    importMap: {},
    jspmGeneratorState
  },
  "@jspm/packages/store",
  "local",
);

export { store };
