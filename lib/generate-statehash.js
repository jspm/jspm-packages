import { createContext } from 'nano-jsx'

const JSPMGeneratorContext = createContext('');

async function getStateHash({ name, version, subpath, exports, selectedDeps }) {
  const { stateToHash } = await import(
    "./statehash.js"
  );

  let deps = [];
  
  if(selectedDeps){
    deps = selectedDeps;
  } else if (exports && exports.length > 0) {
    deps = exports.map((subpath) => {
      const importPath = `${name}@${version}${subpath.slice(1)}`;
      return [importPath, !!subpath];
    });
  } else if (subpath) {
    const importPath = `${name}@${version}${subpath.slice(1)}`;
    deps = [[importPath, !!subpath]];
  }

  console.log("dependency: ", JSON.stringify(deps));

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
  JSPMGeneratorContext.set(stateHash)
  return stateHash;
}

export { getStateHash, JSPMGeneratorContext };
