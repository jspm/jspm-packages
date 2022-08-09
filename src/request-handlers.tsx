/** @jsx h */

/// <reference no-default-lib="true" />
/// <reference lib="dom" />
/// <reference lib="deno.ns" />
/// <reference lib="deno.unstable" />
/// <reference types="https://deno.land/x/nano_jsx@v0.0.33/types.d.ts" />

import { contentType } from "https://deno.land/std@0.150.0/media_types/mod.ts";
import { extname } from "https://deno.land/std@0.150.0/path/mod.ts";
import { h, renderSSR, Helmet } from "nano-jsx";
import dayjs from "dayjs";
import dayjsPluginRelativeTime from "dayjs/plugin/relativeTime";
import { Semver } from "sver";
import {
  MAYBE_README_FILES,
  NPM_PROVIDER_URL,
  PACKAGE_BASE_PATH,
} from "@jspm/packages/constants";
import {
  parsePackageNameVersion,
  removeSlashes,
} from "@jspm/packages/functions";
import { HomeSSR } from "@jspm/packages/home-ssr";
import { SearchResultsSSR } from "@jspm/packages/search-results-ssr";
import type { Results } from "@jspm/packages/search-results";
import { PackageSSR } from "@jspm/packages/package-ssr";
import { features } from "@jspm/packages/package-quality-check";
import { render } from "@jspm/packages/renderer";

const staticResourcesFile = await Deno.readTextFile(
  "./lib/static-resources.json"
);

const staticResources = {
  "/custom-properties.css": "./src/custom-properties.css",
  "/style.css": "./src/style.css",
  "/package.css": "./src/package.css",
  "/home.css": "./src/home.css",
  "/search.css": "./src/search.css",
  "/search.html": "./lib/search.html",
  "/favicon.ico": "./favicon.ico",
  "/package.json": "./package.json",
  ...JSON.parse(staticResourcesFile),
};

const pageServingHeaders = {
  "content-type": "text/html; charset=UTF-8",
  "Cache-Control":
    "s-maxage=1500, public, immutable, stale-while-revalidate=1501",
  Link:
    `<https://ga.jspm.io>; rel="preconnect",<https://fonts.googleapis.com>; rel="preconnect", <https://ga.jspm.io/npm:normalize.css@8.0.1/normalize.css>; rel="preload"; as="style", <https://fonts.googleapis.com/css2?family=Abril+Fatface&family=Bebas+Neue&family=Major+Mono+Display&family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,700&family=Source+Code+Pro&family=Vollkorn&family=Inter:wght@200;400;800&display=swap>; rel="preload"; as="style"`,
};

async function generateHTML(
  {
    template,
    body,
    head,
    footer,
  }: {
    template: string;
    body?: string;
    head?: HTMLElement[];
    footer?: HTMLElement[];
  } = { template: "./shell.html" }
): Promise<string> {
  const content = await Deno.readTextFile(template);
  const [START, AFTER_HEADER_BEFORE_CONTENT, DOM_SCRIPT, END] =
    content.split(/<!-- __[A-Z]*__ -->/i);
  return [
    START,
    head?.join("\n"),
    AFTER_HEADER_BEFORE_CONTENT,
    body,
    DOM_SCRIPT,
    footer?.join("\n"),
    END,
  ].join("\n");
}

async function requestHandlerHome() {
  const indexPage = renderSSR(<HomeSSR />);

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

async function redirectToJSPMPackageVersion(packageName: string) {
  const npmPackageProbe = await fetch(`${NPM_PROVIDER_URL}${packageName}`);
  const npmPackageVersion = await npmPackageProbe.text();

  if (npmPackageVersion) {
    return new Response(packageName, {
      status: 302,
      headers: {
        Location: `/package/${packageName}@${npmPackageVersion}`,
      },
    });
  }
  return new Response("404", { status: 404 });
}

async function getPackageJSON(baseURL: string) {
  const packageJSON = await fetch(`${baseURL}/package.json`);
  return packageJSON.json();
}

async function getReadmeContent(baseURL: string) {
  const [READMEFile, readmeFile] = await Promise.all(
    MAYBE_README_FILES.map((file) => fetch(`${baseURL}/${file}`))
  );

  const validReadmeFileContent = await [READMEFile, readmeFile].find(
    (readmeFile) => readmeFile.status === 200 || readmeFile.status === 304
  );
  return validReadmeFileContent?.text();
}

async function getWeeklyDownloads(name: string) {
  // https://github.com/npm/registry/blob/master/docs/download-counts.md
  const weeklyDownloadsResponse = await fetch(
    `https://api.npmjs.org/downloads/point/last-week/${name}`
  );

  return weeklyDownloadsResponse.json();
}

async function getPackageMetaData(name: string) {
  // https://github.com/npm/registry
  const packageMetaData = await fetch(`https://registry.npmjs.org/${name}`);
  return packageMetaData.json();
}

async function getPackageScore(name: string) {
  const packageScoreResponse = await fetch(
    `https://registry.npmjs.org/-/v1/search?text=${name}&size=1`
  );
  return packageScoreResponse.json();
}

async function getPackageComponentProps(packageNameVersion: {
  name: string;
  version: string;
}) {
  const baseURL = `${NPM_PROVIDER_URL}${packageNameVersion.name}@${packageNameVersion.version}`;

  const [
    packageJson,
    readmeFileContent,
    weeklyDownloads,
    packageMetaData,
    packageScore,
  ] = await Promise.all([
    getPackageJSON(baseURL),
    getReadmeContent(baseURL),
    getWeeklyDownloads(packageNameVersion.name),
    getPackageMetaData(packageNameVersion.name),
    getPackageScore(packageNameVersion.name),
  ]);

  const {
    dependencies,
    description,
    exports,
    files,
    keywords,
    license,
    name,
    type,
    types,
    version,
  } = packageJson;

  const { maintainers, readme, time, versions } = packageMetaData;
  const { created: createdISO } = time;

  dayjs.extend(dayjsPluginRelativeTime);

  const updatedTime = time[version];
  const updated = dayjs(updatedTime).fromNow();
  const created = dayjs(createdISO).fromNow();

  const {
    score,
    package: { links },
  } = packageScore.objects[0];

  // `readme` is preferred here but this content always refers to the latest version
  // hence using it as fallback
  const readmeHTML = render(readmeFileContent || readme);
  // https://github.com/jspm/generator.jspm.io/blob/main/src/api.js#L137
  const filteredExport = Object.keys(exports)
    .filter(
      (expt) =>
        !expt.endsWith("!cjs") &&
        !expt.endsWith("/") &&
        expt.indexOf("*") === -1
    )
    .sort();

  const sortedVersions = Object.keys(versions).sort(Semver.compare).reverse();
  const nativePackageExports = versions[version].exports;

  return {
    name,
    dependencies,
    description,
    version,
    versions: sortedVersions,
    license,
    files,
    subpaths: filteredExport,
    exports,
    readme: readmeHTML,
    keywords,
    downloads: weeklyDownloads.downloads,
    created,
    updated,
    createdTime: createdISO,
    updatedTime,
    type,
    types,
    features: features(packageJson),
    links,
    maintainers,
    score,
    jspmExports: !nativePackageExports,
  };
}

async function renderPackagePage(packageNameVersion: {
  name: string;
  version: string;
}) {
  const {
    name,
    dependencies,
    description,
    version,
    versions,
    license,
    files,
    subpaths,
    exports,
    readme,
    keywords,
    downloads,
    created,
    updated,
    createdTime,
    updatedTime,
    type,
    types,
    features,
    links,
    maintainers,
    score,
    jspmExports,
  } = await getPackageComponentProps(packageNameVersion);

  const app = renderSSR(
    <PackageSSR
      name={name}
      dependencies={dependencies}
      description={description}
      version={version}
      versions={versions}
      license={license}
      files={files}
      subpaths={subpaths}
      exports={exports}
      readme={readme}
      keywords={keywords}
      downloads={downloads}
      created={created}
      updated={updated}
      createdTime={createdTime}
      updatedTime={updatedTime}
      type={type}
      types={types}
      features={features}
      links={links}
      maintainers={maintainers}
      score={score}
      jspmExports={jspmExports}
    />
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

function requestHandlerPackage(request: Request): Promise<Response> {
  const { pathname } = new URL(request.url);
  const [, packagePath] = pathname.split(PACKAGE_BASE_PATH);

  const packageNameVersion = parsePackageNameVersion(packagePath);

  if (!packageNameVersion.version && packageNameVersion.name) {
    return redirectToJSPMPackageVersion(packageNameVersion.name);
  }
  return renderPackagePage(packageNameVersion);
}

// https://github.com/npm/registry/blob/master/docs/REGISTRY-API.md#get-v1search
const PAGE_SIZE = 20;
async function getSearchResult(q = "", keyword = "", page = 1) {
  const response = await fetch(
    `https://registry.npmjs.org/-/v1/search?text=${q}${
      q ? "&" : ""
    }keywords:${keyword}&not:insecure&maintenance=1.0&quality=1.0&popularity=1.0${
      page > 1 ? `&from=${(page - 1) * PAGE_SIZE}` : ""
    }`
  );
  return response.json();
}

const __SEARCH_RESULT_PLACEHOLDER__ = "<!-- __SEARCH_RESULT__ -->";

async function requestHandlerSearch(request: Request): Promise<Response> {
  try {
    const { pathname, searchParams } = new URL(request.url);

    const searchTerm = searchParams.get("q") || "";
    const searchKeyword = searchParams.get("keyword") || "";
    const page = searchParams.get("page") || "";
    const maintainer = searchParams.get("maintainer") || "";

    const results: Results =
      searchTerm || searchKeyword
        ? await getSearchResult(searchTerm, searchKeyword, parseInt(page))
        : { objects: [], total: 0, time: new Date(Date.now()) };

    const searchResults = renderSSR(
      <SearchResultsSSR
        {...results}
        size={PAGE_SIZE}
        searchTerm={searchTerm}
        searchKeyword={searchKeyword}
        page={parseInt(page)}
      />
    );

    const { body, head, footer } = Helmet.SSR(searchResults);
    const html = await generateHTML({
      template: "./lib/search.html",
      body,
      head,
      footer,
    });

    return new Response(html, {
      headers: pageServingHeaders,
    });
  } catch (error) {
    return new Response(error.message || error.toString(), { status: 500 });
  }
}

type RequestHandler = {
  "/": () => Promise<Response>;
  "/search": (request: Request) => Promise<Response>;
};

const requestHandlers: RequestHandler = {
  "/": requestHandlerHome,
  "/search": requestHandlerSearch,
};

/**
 * @param {request} Request
 * @returns Response
 */
async function requestHandler(request: { url: string }) {
  try {
    const { pathname } = new URL(request.url);

    const pathSegments = removeSlashes(pathname).split("/");

    const staticResource =
      staticResources[`/${pathSegments[pathSegments.length - 1]}`];

    if (staticResource) {
      const response = await Deno.readFile(staticResource);

      return new Response(response, {
        headers: { "content-type": contentType(extname(staticResource)) },
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
