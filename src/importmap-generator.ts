
function getCleanPath(path) {
  if (path === ".") {
    return "";
  }
  if (path.startsWith("./")) {
    return path.slice(1);
  }
  return path;
}

async function main({ target, name, version, subpaths }) {
  // const absoluteDependency = dependency ||
  //   `${name}@${version}${getCleanPath(subpath)}`;

  const environment = typeof globalThis.document === "undefined"
    ? "deno"
    : "browser";

    const { Generator } = await import(
      `https://cdn.jsdelivr.net/gh/fusionstrings/dependencies@@jspm/generator@1.0.0-beta.22/dist/${environment}/jspm.js`
    );

  

  const generator = new Generator({
    //mapUrl: import.meta.url,
    env: ["production", "browser", "module"],
  });

  // await generator.traceInstall(absoluteDependency);
  await generator.install({ target: target || `${name}@${version}`, subpaths });
  const importMap = generator.getMap();
  return importMap;
}

export { main, getCleanPath };
