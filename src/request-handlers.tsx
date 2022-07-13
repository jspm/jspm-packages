/** @jsx h */

/// <reference no-default-lib="true" />
/// <reference lib="dom" />
/// <reference lib="deno.ns" />
/// <reference lib="deno.unstable" />
/// <reference types="https://unpkg.com/nano-jsx@0.0.32/lib/index.d.ts" />

import {
  contentType,
  lookup,
} from "https://deno.land/x/media_types@v2.12.3/mod.ts";
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
  packageDetail,
  pageServingHeaders,
  removeSlashes,
} from "@jspm/packages/functions";
import { HomeSSR } from "@jspm/packages/home-ssr";
import { SearchResultsSSR } from "@jspm/packages/search-results-ssr";
import type { Results } from "@jspm/packages/search-results";
import { PackageSSR } from "@jspm/packages/package-ssr";
import { features, parseURL } from "@jspm/packages/package-quality-check";
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
  ...JSON.parse(staticResourcesFile),
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

async function requestHandlerPackage(request: Request): Promise<Response> {
  const { pathname } = new URL(request.url);
  const [, packagePath] = pathname.split(PACKAGE_BASE_PATH);

  const packageInfo = packageDetail(packagePath);

  if (!packageInfo.version && packageInfo.name) {
    return redirectToJSPMPackageVersion(packageInfo.name);
  }

  const baseURL = `${NPM_PROVIDER_URL}${packageInfo.name}@${packageInfo.version}`;
  const filesToFetch = ["package.json", ...MAYBE_README_FILES];

  const [jspmPackage, READMEFile, readmeFile] = await Promise.all(
    filesToFetch.map((file) => fetch(`${baseURL}/${file}`))
  );
  const packageJson = await jspmPackage.json();
  const {
    bugs,
    dependencies,
    description,
    exports,
    files,
    homepage,
    keywords,
    license,
    name,
    repository,
    type,
    types,
    version,
  } = packageJson;

  const readmeFileContent = await [READMEFile, readmeFile]
    .find(
      (readmeFile) => readmeFile.status === 200 || readmeFile.status === 304
    )
    .text();
  // https://github.com/npm/registry/blob/master/docs/download-counts.md
  const weeklyDownloadsResponse = await fetch(
    `https://api.npmjs.org/downloads/point/last-week/${name}`
  );

  const { downloads } = await weeklyDownloadsResponse.json();
  // https://github.com/npm/registry
  const packageMetaData = await fetch(`https://registry.npmjs.org/${name}`);
  const packageMetaDataJson = await packageMetaData.json();
  const { maintainers, readme, time, versions } = packageMetaDataJson;
  const { created: createdISO, modified } = time;
  dayjs.extend(dayjsPluginRelativeTime);
  const updatedTime = time[version];
  const updated = dayjs(updatedTime).fromNow();
  const created = dayjs(createdISO).fromNow();

  const packageScoreResponse = await fetch(
    `https://registry.npmjs.org/-/v1/search?text=${name}&size=1`
  );
  const packageScoreJson = await packageScoreResponse.json();
  const { score } = packageScoreJson.objects[0];

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

  const links = {
    homepage: homepage || "",
    repository: parseURL(repository) || "",
    issues: parseURL(bugs) || "",
  };

  const sortedVersions = Object.keys(versions).sort(Semver.compare).reverse();
  const nativePackageExports = versions[version].exports;
  const app = renderSSR(
    <PackageSSR
      name={name}
      dependencies={dependencies}
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
      jspmExports={!nativePackageExports}
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

    // const packageName = searchParams.get("q");

    // if (packageName && pathname === "/search") {
    //   return requestHandlerSearch(request);
    // }

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
