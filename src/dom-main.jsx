/** @jsx h */
import { h, hydrate } from "nano-jsx";
import dayjs from "dayjs";
import dayjsPluginRelativeTime from "dayjs/plugin/relativeTime";
import { Semver } from "sver";
import { features, parseURL } from "@jspm/packages/package-quality-check";
import { render } from "@jspm/packages/renderer";
import { DomRoot } from "@jspm/packages/dom-root";

async function hydrateRoot() {
  const mountElement = document.querySelector("jspm-package-root");

  if (mountElement) {
    const {
      name,
      version,
    } = mountElement.dataset;

    const packageMetaData = await import(
      `https://registry.npmjs.org/${name}`,
      { assert: { type: "json" } }
    );
    const { maintainers, readme, time, versions } = packageMetaData.default;
    const { created: createdISO, modified } = time;
    dayjs.extend(dayjsPluginRelativeTime);
    const updated = dayjs(time[version]).fromNow();
    const created = dayjs(createdISO).fromNow();
    const sortedVersions = Object.keys(versions).sort(Semver.compare)
      .reverse();
    const jspmPackage = await import(
      `https://ga.jspm.io/npm:${name}@${version}/package.json`,
      {
        assert: { type: "json" },
      }
    );

    const {
      description,
      keywords,
      license,
      files,
      exports,
      types,
      type,
      homepage,
      repository,
      bugs,
    } = jspmPackage.default;

    const filteredExports = Object.keys(exports).filter((expt) =>
      !expt.endsWith("!cjs") && !expt.endsWith("/") &&
      expt.indexOf("*") === -1
    ).sort();

    const weeklyPackageDownloads = await import(
      `https://api.npmjs.org/downloads/point/last-week/${name}`,
      { assert: { type: "json" } }
    );
    const { downloads } = weeklyPackageDownloads.default;

    const NPM_PROVIDER_URL = "https://ga.jspm.io/npm:";
    const baseURL = `${NPM_PROVIDER_URL}${name}@${version}`;

    const [READMEFile, readmeFile] = await Promise.all(
      ["README.md", "readme.md"].map((file) => fetch(`${baseURL}/${file}`)),
    );
    const readmeFileContent = await [READMEFile, readmeFile]
      .find(
        (readmeFile) => readmeFile.status === 200 || readmeFile.status === 304,
      )
      .text();

    const readmeHTML = render(readmeFileContent || readme);
    const unpkgJSON = await import(
      `https://unpkg.com/${name}@${version}/package.json`,
      { assert: { type: "json" } }
    );

    const links = {
      homepage: unpkgJSON.default.homepage,
      repository: parseURL(unpkgJSON.default.repository),
      issues: parseURL(unpkgJSON.default.bugs),
    };
    hydrate(
      <DomRoot
        created={created}
        description={description}
        downloads={downloads}
        exports={filteredExports}
        features={features(unpkgJSON.default)}
        license={license}
        links={links}
        name={name}
        readme={readmeHTML}
        maintainers={maintainers}
        types={types}
        updated={updated}
        version={version}
        versions={sortedVersions}
      />,
      mountElement,
    );
  }
}

if (typeof globalThis.document !== "undefined") {
  hydrateRoot();
}
