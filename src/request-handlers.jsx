/** @jsx h */

import {
  contentType,
  lookup,
} from "https://deno.land/x/media_types@v2.12.3/mod.ts";
import nano, { h, renderSSR } from "nano-jsx";
import dayjs from "dayjs";
import dayjsPluginRelativeTime from "dayjs/plugin/relativeTime";
import { Semver } from "sver";
import {
  MAYBE_README_FILES,
  NPM_PROVIDER_URL,
  PACKAGE_BASE_PATH,
} from "@jspm/packages/constants";
import {
  packageDetail,
  pageServingHeaders,
  removeSlashes,
} from "@jspm/packages/functions";
import { HomeSSR } from "@jspm/packages/home-ssr";
import { PackageSSR } from "@jspm/packages/package-ssr";
import { features, parseURL } from "@jspm/packages/package-quality-check";
import { render } from "@jspm/packages/renderer";

const { Helmet } = nano;

const staticResourcesFile = await Deno.readTextFile(
  "./lib/static-resources.json",
);

const staticResources = {
  "/custom-properties.css": "./src/custom-properties.css",
  "/style.css": "./src/style.css",
  "/package.css": "./src/package.css",
  "/home.css": "./src/home.css",
  "/favicon.ico": "./favicon.ico",
  ...JSON.parse(staticResourcesFile),
};

async function generateHTML(
  { template, body, head, footer } = { template: "./shell.html" },
) {
  const content = await Deno.readTextFile(template);
  const [START, AFTER_HEADER_BEFORE_CONTENT, DOM_SCRIPT, END] = content
    .split(/<!-- __[A-Z]*__ -->/i);
  return [
    START,
    head.join("\n"),
    AFTER_HEADER_BEFORE_CONTENT,
    body,
    DOM_SCRIPT,
    footer.join("\n"),
    END,
  ].join("\n");
}

async function requestHandlerHome() {
  const indexPage = renderSSR(
    <HomeSSR />,
  );

  const { body, head, footer } = Helmet.SSR(indexPage);
  const html = await generateHTML({
    template: "./lib/home.html",
    body,
    head,
    footer,
  });

  return new Response(html, {
    headers: pageServingHeaders,
  });
}

async function redirectToJSPMPackageVersion(packageName) {
  const npmPackageProbe = await fetch(`${NPM_PROVIDER_URL}${packageName}`);
  const npmPackageVersion = await npmPackageProbe.text();

  if (npmPackageVersion) {
    return new Response(packageName, {
      status: 302,
      headers: {
        "Location": `/package/${packageName}@${npmPackageVersion}`,
      },
    });
  }
  return new Response("404", { status: 404 });
}

async function requestHandlerPackage(request) {
  const { pathname } = new URL(request.url);
  const [, packagePath] = pathname.split(PACKAGE_BASE_PATH);

  const packageInfo = packageDetail(packagePath);

  if (!packageInfo.version && packageInfo.name) {
    return redirectToJSPMPackageVersion(packageInfo.name);
  }

  const baseURL =
    `${NPM_PROVIDER_URL}${packageInfo.name}@${packageInfo.version}`;
  const filesToFetch = ["package.json", ...MAYBE_README_FILES];

  const [jspmPackage, READMEFile, readmeFile] = await Promise.all(
    filesToFetch.map((file) => fetch(`${baseURL}/${file}`)),
  );
  const packageJson = await jspmPackage.json();
  const {
    name,
    description,
    keywords,
    version,
    license,
    files,
    exports,
    types,
    type,
    homepage,
    repository,
    bugs,
  } = packageJson;

  const readmeFileContent = await [READMEFile, readmeFile]
    .find(
      (readmeFile) => readmeFile.status === 200 || readmeFile.status === 304,
    )
    .text();
  // https://github.com/npm/registry/blob/master/docs/download-counts.md
  const weeklyDownloadsResponse = await fetch(
    `https://api.npmjs.org/downloads/point/last-week/${name}`,
  );

  const { downloads } = await weeklyDownloadsResponse.json();
  // https://github.com/npm/registry
  const packageMetaData = await fetch(
    `https://registry.npmjs.org/${name}`,
  );
  const packageMetaDataJson = await packageMetaData.json();
  const { maintainers, readme, time, versions } = packageMetaDataJson;
  const { created: createdISO, modified } = time;
  dayjs.extend(dayjsPluginRelativeTime);
  const updatedTime = time[version];
  const updated = dayjs(updatedTime).fromNow();
  const created = dayjs(createdISO).fromNow();

  const packageScoreResponse = await fetch(`https://registry.npmjs.org/-/v1/search?text=${name}&size=1`);
  const packageScoreJson = await packageScoreResponse.json();
  const {score} = packageScoreJson.objects[0]

  // `readme` is preferred here but this content always refers to the latest version
  // hence using it as fallback
  const readmeHTML = render(readmeFileContent || readme);
  // https://github.com/jspm/generator.jspm.io/blob/main/src/api.js#L137
  const filteredExport = Object.keys(exports).filter((expt) =>
    !expt.endsWith("!cjs") && !expt.endsWith("/") &&
    expt.indexOf("*") === -1
  ).sort();

  const links = {
    homepage,
    repository: parseURL(repository),
    issues: parseURL(bugs),
  };

  const sortedVersions = Object.keys(versions).sort(Semver.compare)
    .reverse();
  const app = renderSSR(
    <PackageSSR
      name={name}
      description={description}
      version={version}
      versions={sortedVersions}
      homepage={homepage}
      license={license}
      files={files}
      exports={filteredExport}
      readme={readmeHTML}
      keywords={keywords}
      downloads={downloads}
      created={created}
      updated={updated}
      createdTime={createdISO}
      updatedTime={updatedTime}
      type={type}
      types={types}
      features={features(packageJson)}
      links={links}
      maintainers={maintainers}
      score={score}
    />,
  );
  const { body, head, footer } = Helmet.SSR(app);
  /* Hack to SSR readme :! */
  const html = await generateHTML({
    template: "./lib/package.html",
    body,
    head,
    footer,
  });

  return new Response(html, {
    headers: pageServingHeaders,
  });
}

const requestHandlers = {
  "/": requestHandlerHome,
};

async function requestHandler(request) {
  try {
    const { pathname, searchParams } = new URL(request.url);

    const packageName = searchParams.get("q");

    if (packageName) {
      return redirectToJSPMPackageVersion(packageName);
    }

    const pathSegments = removeSlashes(pathname).split("/");

    const staticResource =
      staticResources[`/${pathSegments[pathSegments.length - 1]}`];

    if (staticResource) {
      const response = await Deno.readFile(staticResource);

      return new Response(response, {
        headers: { "content-type": contentType(lookup(staticResource)) },
      });
    }

    const requestHandler = requestHandlers[pathname];

    if (requestHandler) {
      return requestHandler(request);
    }

    if (pathname.startsWith(PACKAGE_BASE_PATH)) {
      return requestHandlerPackage(request);
    }

    return new Response("404", { status: 404 });
  } catch (error) {
    return new Response(error.message || error.toString(), { status: 500 });
  }
}

export { requestHandler };
