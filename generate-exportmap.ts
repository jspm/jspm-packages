import { Generator } from "@jspm/generator";
import { readFile, writeFile } from "node:fs/promises";
import mkdirp from "mkdirp";
import { dirname, parse } from "path";

const generator = new Generator({
  env: ["browser", "production"],
});

const dependencyMap = await generator.traceInstall("@jspm/packages");

mkdirp.sync(dirname(process.env.TARGET));

const { dir: CURRENT_DIRECTORY } = parse(import.meta.url);

const { staticDeps, dynamicDeps } = dependencyMap;

const packageJSON = await readFile("package.json", "utf-8");
const parsedPackageJSON = JSON.parse(packageJSON);
const { exports } = parsedPackageJSON;

const OUTPUT_DIR = "lib";
const DEST_PREFIX = `${CURRENT_DIRECTORY}/${OUTPUT_DIR}`;

[...staticDeps, ...dynamicDeps].filter((dependency) =>
  dependency.startsWith(CURRENT_DIRECTORY)
).sort().forEach((dependency) => {
  const { ext } = parse(dependency);

  const modulePath = dependency.replace(CURRENT_DIRECTORY, ".");
  const subpath = dependency.replace(DEST_PREFIX, ".");
  const exportPath = subpath.slice(0, subpath.length - ext.length);

  exports[exportPath] = {
    ...exports[exportPath],
    "browser": modulePath,
  };
});

const sortedExports = {};

Object.keys(exports).sort().forEach((key) => {
  sortedExports[key] = exports[key];
});

await writeFile(
  'package.json',
  JSON.stringify({ ...parsedPackageJSON, exports: sortedExports }, null, 2),
);
