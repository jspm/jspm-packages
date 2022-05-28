import { Generator } from "@jspm/generator";
import { readdir, writeFile } from "node:fs/promises";
import mkdirp from "mkdirp";
import { dirname, parse } from "path";

const generator = new Generator({
  env: ["browser", "production"],
});

async function generateStaticResourceMap(entryModule) {
  const dependencyMap = await generator.traceInstall(entryModule);

  mkdirp.sync(dirname(process.env.TARGET));

  const { dir: CURRENT_DIRECTORY } = parse(import.meta.url);

  const { staticDeps, dynamicDeps } = dependencyMap;

  const OUTPUT_DIR = "lib";
  const DEST_PREFIX = `${CURRENT_DIRECTORY}/${OUTPUT_DIR}`;
  const staticResources = {};

  [...staticDeps, ...dynamicDeps].filter((dependency) =>
    dependency.startsWith(CURRENT_DIRECTORY)
  ).sort().forEach((dependency) => {
    const modulePath = dependency.replace(CURRENT_DIRECTORY, ".");
    const subpath = dependency.replace(DEST_PREFIX, "");

    staticResources[subpath] = modulePath;

    /**
     * @todo validate if sourcemap exists
     */
    staticResources[`${subpath}.map`] = `${modulePath}.map`;
  });

  const files = await readdir("images");
  for (const file of files) {
    staticResources[`/${file}`] = `./images/${file}`;
  }

  return staticResources;
}

const staticResources = {
  ...await generateStaticResourceMap("@jspm/packages/dom"), 
  ...await generateStaticResourceMap("@jspm/packages/package-dom")
}
const sortedStaticResources = {};

Object.keys(staticResources).sort().forEach((key) => {
  sortedStaticResources[key] = staticResources[key];
});

await writeFile(
  process.env.TARGET,
  JSON.stringify(sortedStaticResources, null, 2),
);
