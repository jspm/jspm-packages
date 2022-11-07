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
  SEARCH_RESULT_DEFAULT_PAGE_SIZE as PAGE_SIZE,
} from "#constants";
import {
  parsePackageNameVersion,
  removeSlashes,
  getSearchResult,
} from "#functions";
import { HomeSSR } from "#home-ssr";
import { NotFoundSSR } from "#404-ssr";
import { ServerErrorSSR } from "#500-ssr";
import { SearchResultsSSR } from "#search-results-ssr";
import type { Results } from "#search-results";
import { PackageSSR } from "#package-ssr";
import { features } from "#package-quality-check";
import { render } from "#renderer";

const staticResourcesFile = await Deno.readTextFile(
  "./lib/static-resources.json"
);

const staticResources = {
  "/custom-properties.css": "./src/custom-properties.css",
  "/style.css": "./src/style.css",
  "/package.css": "./src/package.css",
  "/home.css": "./src/home.css",
  "/search.css": "./src/search.css",
  "/404.css": "./src/404.css",
  "/search.html": "./lib/search.html",
  "/example-browser.html": "./lib/example-browser.html",
  "/favicon.ico": "./favicon.ico",
  "/package.json": "./package.json",
  ...JSON.parse(staticResourcesFile),
};

const pageServingHeaders = {
  "content-type": "text/html; charset=UTF-8",
  "Cache-Control":
    "s-maxage=1500, public, immutable, stale-while-revalidate=1501",
  Link: `<https://ga.jspm.io>; rel="preconnect",<https://fonts.googleapis.com>; rel="preconnect", <https://ga.jspm.io/npm:normalize.css@8.0.1/normalize.css>; rel="preload"; as="style", <https://fonts.googleapis.com/css2?family=Abril+Fatface&family=Bebas+Neue&family=Major+Mono+Display&family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,700&family=Source+Code+Pro&family=Vollkorn&family=Inter:wght@200;400;800&display=swap>; rel="preload"; as="style"`,
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
  try {
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
  } catch (error) {
    throw error;
  }
}

async function requestHandlerHome() {
  try {
    const templateURL = new URL("../lib/home.html", import.meta.url);
    const templateFileResponse = await fetch(templateURL);

    const response = templateFileResponse.body
      .pipeThrough(new TextDecoderStream())
      .pipeThrough(
        new TransformStream({
          transform: async (chunk, controller) => {
            const PLACEHOLDER = "<!-- __CONTENT__ -->";

            if (chunk.includes(PLACEHOLDER)) {
              const templatePropExampleBrowserInputFileURL = new URL(
                "example-browser.html",
                import.meta.url
              );

              const templatePropExampleBrowserOutputFileURL = new URL(
                "../lib/example-browser.html",
                import.meta.url
              );

              const [
                templatePropExampleBrowserInputFileResponse,
                templatePropExampleBrowserOutputFileResponse,
              ] = await Promise.all([
                fetch(templatePropExampleBrowserInputFileURL),
                fetch(templatePropExampleBrowserOutputFileURL),
              ]);

              const templatePropExampleBrowserInput =
                await templatePropExampleBrowserInputFileResponse.text();
              const templatePropExampleBrowserOutput =
                await templatePropExampleBrowserOutputFileResponse.text();

              const content = renderSSR(
                <HomeSSR
                  exampleBrowser={{
                    input: templatePropExampleBrowserInput,
                    output: templatePropExampleBrowserOutput,
                  }}
                />
              );
              controller.enqueue(chunk.replace(PLACEHOLDER, content));
            } else {
              controller.enqueue(chunk);
            }
          },
        })
      )
      .pipeThrough(new TextEncoderStream());

    return new Response(response, {
      status: templateFileResponse.status,
      headers: { ...templateFileResponse.headers, ...pageServingHeaders },
    });
  } catch (error) {
    throw error;
  }
}

async function requestHandler404(request?: Request) {
  try {
    const templateURL = new URL("../lib/404.html", import.meta.url);
    const templateFileResponse = await fetch(templateURL);

    const response = templateFileResponse.body
      .pipeThrough(new TextDecoderStream())
      .pipeThrough(
        new TransformStream({
          transform: (chunk, controller) => {
            const PLACEHOLDER = "<!-- __CONTENT__ -->";

            if (chunk.includes(PLACEHOLDER)) {
              const content = renderSSR(<NotFoundSSR />);
              controller.enqueue(chunk.replace(PLACEHOLDER, content));
            } else {
              controller.enqueue(chunk);
            }
          },
        })
      )
      .pipeThrough(new TextEncoderStream());

    return new Response(response, {
      status: 404,
      headers: { ...templateFileResponse.headers, ...pageServingHeaders },
    });
  } catch (error) {
    console.error(error.message || error.toString());
    return requestHandler500(request);
  }
}

async function requestHandler500(request?: Request) {
  try {
    const templateURL = new URL("../lib/500.html", import.meta.url);
    const templateFileResponse = await fetch(templateURL);

    const response = templateFileResponse.body
      .pipeThrough(new TextDecoderStream())
      .pipeThrough(
        new TransformStream({
          transform: (chunk, controller) => {
            const PLACEHOLDER = "<!-- __CONTENT__ -->";

            if (chunk.includes(PLACEHOLDER)) {
              const content = renderSSR(<ServerErrorSSR />);
              controller.enqueue(chunk.replace(PLACEHOLDER, content));
            } else {
              controller.enqueue(chunk);
            }
          },
        })
      )
      .pipeThrough(new TextEncoderStream());

    return new Response(response, {
      status: 500,
      headers: { ...templateFileResponse.headers, ...pageServingHeaders },
    });
  } catch (error) {
    throw error;
  }
}

// gratefully taken from https://github.com/jspm/generator/blob/main/src/providers/jspm.ts#L59-L71
async function checkBuildOrError(
  pkgUrl: string,
  fetchOpts?: any
): Promise<boolean> {
  const pjsonRes = await fetch(`${pkgUrl}/package.json`, fetchOpts);
  if (pjsonRes.ok) return true;
  // no package.json! Check if there's a build error:
  const errLogRes = await fetch(`${pkgUrl}/_error.log`, fetchOpts);
  if (errLogRes.ok) {
    const errLog = await errLogRes.text();
    throw new Error(
      `Resolved dependency ${pkgUrl} with error:\n\n${errLog}\nPlease post an issue at jspm/project on GitHub, or by following the link below:\n\nhttps://github.com/jspm/project/issues/new?title=CDN%20build%20error%20for%20${encodeURIComponent(
        pkgUrl
      )}&body=_Reporting%20CDN%20Build%20Error._%0A%0A%3C!--%20%20No%20further%20description%20necessary,%20just%20click%20%22Submit%20new%20issue%22%20--%3E`
    );
  }
  console.error(
    `Unable to request ${pkgUrl}/package.json - ${pjsonRes.status} ${
      pjsonRes.statusText || "returned"
    }`
  );
  return false;
}

export async function getLatestBuiltVersion(name: string) {
  const response = await fetch(
    `https://npmlookup.jspm.io/${encodeURIComponent(name)}`
  );

  if (!response.ok) {
    console.error(
      `Error: Unable to get version list for ${name} (${response.status})`
    );
    return [];
  }

  const json = await response.json();

  const sortedVersions = Object.keys(json.versions)
    .sort(Semver.compare)
    .reverse();

  for await (const version of sortedVersions) {
    const buildExist = await checkBuildOrError(
      `${NPM_PROVIDER_URL}${name}@${version}`
    );
    if (buildExist) {
      return version;
    }
  }

  return false;
}

async function redirectToJSPMPackageVersion(packageName: string) {
  try {
    const version = await getLatestBuiltVersion(packageName);

    if (version) {
      return new Response(packageName, {
        status: 302,
        headers: {
          Location: `/package/${packageName}@${version}`,
        },
      });
    }
    return requestHandler404();
  } catch (error) {
    throw error;
  }
}

async function getPackageJSON(baseURL: string) {
  try {
    const packageJSON = await fetch(`${baseURL}/package.json`);
    return packageJSON.json();
  } catch (error) {
    throw error;
  }
}

async function getReadmeContent(baseURL: string) {
  try {
    const [READMEFile, readmeFile] = await Promise.all(
      MAYBE_README_FILES.map((file: string) => fetch(`${baseURL}/${file}`))
    );

    const validReadmeFileContent = await [READMEFile, readmeFile].find(
      (readme) => {
        return readme.status === 200 || readme.status === 304;
      }
    );
    return validReadmeFileContent?.text() || "";
  } catch (error) {
    throw error;
  }
}

async function getWeeklyDownloads(name: string) {
  try {
    // https://github.com/npm/registry/blob/master/docs/download-counts.md
    const weeklyDownloadsResponse = await fetch(
      `https://api.npmjs.org/downloads/point/last-week/${name}`
    );

    return weeklyDownloadsResponse.json();
  } catch (error) {
    throw error;
  }
}

async function getPackageMetaData(name: string) {
  try {
    // https://github.com/npm/registry
    const packageMetaData = await fetch(`https://registry.npmjs.org/${name}`);
    return packageMetaData.json();
  } catch (error) {
    throw error;
  }
}

async function getPackageScore(name: string) {
  try {
    const packageScoreResponse = await fetch(
      `https://registry.npmjs.org/-/v1/search?text=${name}&size=1`
    );
    return packageScoreResponse.json();
  } catch (error) {
    throw error;
  }
}

async function getPackageComponentProps(packageNameVersion: {
  name: string;
  version: string;
}) {
  try {
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
    ]).catch((reason) => {
      throw reason;
    });

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
    const nativePackageExports = versions[version]?.exports;

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
  } catch (error) {
    throw error;
  }
}

async function renderPackagePage(packageNameVersion: {
  name: string;
  version: string;
}) {
  try {
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
  } catch (error) {
    throw error;
  }
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

async function requestHandlerSearch(request: Request): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url);

    const searchTerm = searchParams.get("q") || "";
    const searchKeyword = searchParams.get("keyword") || "";
    const page = searchParams.get("page") || "1";

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
    console.error(error.message || error.toString());
    return requestHandler500(request);
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

async function requestHandler(request: Request) {
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

    if (pathname in requestHandlers) {
      return requestHandlers[pathname](request);
    }

    if (pathname.startsWith(PACKAGE_BASE_PATH)) {
      return requestHandlerPackage(request);
    }

    return requestHandler404(request);
  } catch (error) {
    console.error(error.message || error.toString());
    return requestHandler500(request);
  }
}

export { requestHandler };
