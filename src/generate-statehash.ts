import { createContext } from 'nano-jsx'

const JSPMGeneratorContext = createContext('');

async function getStateHash({ name, version, subpath, exports, deps }) {
  const { stateToHash } = await import(
    "@jspm/packages/statehash"
  );

  let dependencies = [];
  
  if(deps){
    dependencies = deps;
  } else if (exports && exports.length > 0) {
    dependencies = exports.map((subpath) => {
      const importPath = `${name}@${version}${subpath.slice(1)}`;
      return [importPath, !!subpath];
    });
  } else if (subpath) {
    const importPath = `${name}@${version}${subpath.slice(1)}`;
    dependencies = [[importPath, !!subpath]];
  }

  const state = {
    name: "Untitled",
    deps: dependencies,
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

  const stateHash = await stateToHash(state);
  JSPMGeneratorContext.set(stateHash)
  return stateHash;
}

export { getStateHash, JSPMGeneratorContext };
