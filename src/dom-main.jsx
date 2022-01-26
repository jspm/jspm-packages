import { h, hydrate } from "nano-jsx";
import { Exports } from "./exports.js";

async function getStateHash({ name, version, subpath }) {
  const { stateToHash } = await import(
    "https://generator.jspm.io/src/statehash.js"
  );
  // U2VhYGBkDM0rySzJSU1hcMgqLsjVz8wtyC8q0c1NLHAw0DPWMwYAt5WJsiUA
  const importPath = `${name}@${version}${subpath.slice(1)}`;
  const deps = [importPath, !!subpath];

  console.log("deps: ", JSON.stringify(deps));
  const state = {
    name: "Untitled",
    deps,
    env: {
      development: true,
      production: true,
      browser: true,
      node: false,
      module: true,
      deno: false,
    },
    output: {
      system: false,
      boilerplate: true,
      minify: false,
      json: false,
      integrity: false,
      preload: false,
    },
  };

  console.table(state);
  const stateHash = await stateToHash(state);
  console.log("stateHash", stateHash);

  return stateHash;
}

if (typeof globalThis.document !== "undefined") {
  const mountElement = document.querySelector("jspm-package-aside-exports");
  const { exports, name, version } = mountElement.dataset;
  const parsedExports = JSON.parse(exports);

  const exportHashesMap = {};
  const exportHashes = await Promise.all(parsedExports.map(async (subpath) => {
    const stateHash = await getStateHash({ name, version, subpath });
    console.log("stateHash: ", stateHash);
    exportHashesMap[subpath] = `https://generator.jspm.io/${stateHash}`;
    return {
      [subpath]: `https://generator.jspm.io/${stateHash}`,
    };
  }));
  exportHashes.forEach((entry) => Object.entries(entry));
  hydrate(
    <Exports
      exports={parsedExports}
      name={name}
      version={version}
      exportHashes={exportHashesMap}
    />,
    mountElement,
  );
}
