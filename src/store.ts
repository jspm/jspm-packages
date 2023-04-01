import { Store } from "nano-jsx";
import {
  EXAMPLES_SOURCE_CODE_HTML_BROWSER,
  EXAMPLES_RENDER_DOMTREE
} from "#constants";

const env = {
  development: true,
  production: false,
  browser: true,
  node: false,
  module: true,
  deno: false,
};
type ENV = typeof env;

const deps: string[] | [string, boolean] = [];

const jspmGeneratorState = {
  name: "Untitled",
  deps,
  env: env,
  output: {
    system: false,
    boilerplate: false,
    minify: false,
    json: true,
    integrity: false,
    preload: false,
  },
};

const initialState = {
  dependencies: [],
  generatorHash: "",
  dialogOpen: false,
  openVersionSelector: false,
  sandboxHashes: {},
  importMap: {},
  importmapDialogOpenDependencyDetails: [],
  jspmGeneratorState,
  npmSearch: {},
  examplesCodeBlockActiveTab: EXAMPLES_SOURCE_CODE_HTML_BROWSER,
  examplesRenderBlockActiveTab: EXAMPLES_RENDER_DOMTREE
};

type Store = typeof initialState;

const store = new Store(initialState, "@jspm/packages/store", "local");

export { store };
export type { ENV, Store };
