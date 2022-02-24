/** @jsx h */

import { serve } from "https://deno.land/std@0.121.0/http/server.ts";
import { h, Helmet, renderSSR } from "nano-jsx";
import dayjsEsm from "dayjs/esm";
import dayjsPluginRelativeTime from "dayjs/plugin/relativeTime";
import { Package } from "./lib/package.js";
import { Home } from "./lib/home.js";
import { pageServingHeaders, renderMarkdownContent } from "./utils.js";
import { FEATURED_PACKAGES } from "./lib/featured-packages-list.js";
import { features, parseURL } from "./lib/package-quality-check.js";

const staticResources = {
  "/style.css": { path: "./style.css", contentType: "text/css; charset=utf-8" },
  "/dom-main.js": {
    path: "./lib/dom-main.js",
    contentType: "application/javascript; charset=utf-8",
  },
  "/dom-main.js.map": {
    path: "./lib/dom-main.js.map",
    contentType: "application/javascript; charset=utf-8",
  },
  "/statehash.js": {
    path: "./lib/statehash.js",
    contentType: "application/javascript; charset=utf-8",
  },
  "/statehash.js.map": {
    path: "./lib/statehash.js.map",
    contentType: "application/javascript; charset=utf-8",
  },
  "/header.js": {
    path: "./lib/header.js",
    contentType: "application/javascript; charset=utf-8",
  },
  "/header.js.map": {
    path: "./lib/header.js.map",
    contentType: "application/javascript; charset=utf-8",
  },
  "/exports.js": {
    path: "./lib/exports.js",
    contentType: "application/javascript; charset=utf-8",
  },
  "/exports.js.map": {
    path: "./lib/exports.js.map",
    contentType: "application/javascript; charset=utf-8",
  },
  "/hero.js": {
    path: "./lib/hero.js",
    contentType: "application/javascript; charset=utf-8",
  },
  "/hero.js.map": {
    path: "./lib/hero.js.map",
    contentType: "application/javascript; charset=utf-8",
  },
  "/generate-statehash.js": {
    path: "./lib/generate-statehash.js",
    contentType: "application/javascript; charset=utf-8",
  },
  "/generate-statehash.js.map": {
    path: "./lib/generate-statehash.js.map",
    contentType: "application/javascript; charset=utf-8",
  },
  "/logo.js": {
    path: "./lib/logo.js",
    contentType: "application/javascript; charset=utf-8",
  },
  "/logo.js.map": {
    path: "./lib/logo.js.map",
    contentType: "application/javascript; charset=utf-8",
  },
  "/search.js": {
    path: "./lib/search.js",
    contentType: "application/javascript; charset=utf-8",
  },
  "/search.js.map": {
    path: "./lib/search.js.map",
    contentType: "application/javascript; charset=utf-8",
  },
  "/nav.js": {
    path: "./lib/nav.js",
    contentType: "application/javascript; charset=utf-8",
  },
  "/nav.js.map": {
    path: "./lib/nav.js.map",
    contentType: "application/javascript; charset=utf-8",
  },
  "/importmap-generator.js": {
    path: "./lib/importmap-generator.js",
    contentType: "application/javascript; charset=utf-8",
  },
  "/importmap-generator.js.map": {
    path: "./lib/importmap-generator.js.map",
    contentType: "application/javascript; charset=utf-8",
  },
  "/imports-hash-store.js": {
    path: "./lib/imports-hash-store.js",
    contentType: "application/javascript; charset=utf-8",
  },
  "/icon-add.svg": {
    path: "./images/icon-add.svg",
    contentType: "image/svg+xml; charset=utf-8",
  },
  "/icon-check.svg": {
    path: "./images/icon-check.svg",
    contentType: "image/svg+xml; charset=utf-8",
  },
  "/icon-typescript-logo.svg": {
    path: "./images/icon-typescript-logo.svg",
    contentType: "image/svg+xml; charset=utf-8",
  },
  "/favicon.ico": {
    path: "./favicon.ico",
    contentType: "image/vnd.microsoft.icon",
  },
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

/**
 * @param {string} path
 * @returns {string}
 */
function removeLeadingSlash(path) {
  if (path.startsWith("/")) {
    return path.slice(1);
  }
  return path;
}

/**
 * @param {string} path
 * @returns {string}
 */
function removeTrailingSlash(path) {
  if (path.endsWith("/")) {
    return path.slice(0, -1);
  }
  return path;
}

/**
 * @param {string} path
 * @returns {string}
 */
function removeSlashes(path) {
  return removeTrailingSlash(removeLeadingSlash(path));
}

async function requestHandler(request) {
  try {
    const { pathname, searchParams } = new URL(request.url);

    const NPM_PROVIDER_URL = "https://ga.jspm.io/npm:";
    const npmPackage = searchParams.get("q");
    if (npmPackage) {
      const npmPackageProbe = await fetch(`${NPM_PROVIDER_URL}${npmPackage}`);
      const npmPackageVersion = await npmPackageProbe.text();

      if (npmPackageVersion) {
        return new Response(npmPackage, {
          status: 302,
          headers: {
            "Location": `/package/${npmPackage}@${npmPackageVersion}`,
          },
        });
      }
    }
    const pathSegments = removeSlashes(pathname).split("/");
    const staticResource =
      staticResources[`/${pathSegments[pathSegments.length - 1]}`];

    if (staticResource) {
      const response = await Deno.readFile(staticResource.path);

      return new Response(response, {
        headers: { "content-type": staticResource.contentType },
      });
    }

    if (pathname === "/") {
      const indexPage = renderSSR(
        <Home packages={FEATURED_PACKAGES} />,
      );
      const { body, head, footer } = Helmet.SSR(indexPage);
      const html = await generateHTML({
        template: "./shell.html",
        body,
        head,
        footer,
      });
      return new Response(html, {
        headers: pageServingHeaders,
      });
    }

    const BASE_PATH = "/package/";
    const maybeReadmeFiles = ["README.md", "readme.md"];

    if (pathname.startsWith(BASE_PATH)) {
      const [, packageName] = pathname.split(BASE_PATH);

      if (packageName) {
        const baseURL = `${NPM_PROVIDER_URL}${packageName}`;
        const filesToFetch = ["package.json", ...maybeReadmeFiles];

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
          bugs
        } = packageJson;

        const readmeFileContent = await [READMEFile, readmeFile]
          .find(
            (readmeFile) =>
              readmeFile.status === 200 || readmeFile.status === 304,
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
        const { maintainers, readme, time: { created: createdISO, modified } } = await packageMetaData.json();

        dayjsEsm.extend(dayjsPluginRelativeTime);
        const updated = dayjsEsm(modified).fromNow();
        const created = dayjsEsm(createdISO).fromNow();
        try {
          // `readme` is preferred here but this content always refers to the latest version
          // hence using it as fallback
          const readmeHTML = renderMarkdownContent(readmeFileContent || readme);
          // https://github.com/jspm/generator.jspm.io/blob/main/src/api.js#L137
          const filteredExport = Object.keys(exports).filter((expt) =>
            !expt.endsWith("!cjs") && !expt.endsWith("/") &&
            expt.indexOf("*") === -1
          ).sort();

          const links = {
            homepage,
            repository: parseURL(repository),
            issues: parseURL(bugs)
          }

          const app = renderSSR(
            <Package
              name={name}
              description={description}
              version={version}
              homepage={homepage}
              license={license}
              files={files}
              exports={filteredExport}
              readme={readmeHTML}
              keywords={keywords}
              downloads={downloads}
              created={created}
              updated={updated}
              type={type}
              types={types}
              features={features(packageJson)}
              links={links}
              maintainers={maintainers}
            />,
          );
          const { body, head, footer } = Helmet.SSR(app);
          /* Hack to SSR readme :! */
          const html = await generateHTML({
            template: "./shell.html",
            body,
            head,
            footer,
          });

          return new Response(html, {
            headers: pageServingHeaders,
          });
        } catch (e) {
          console.error(`Failed in generating package-page ${name}@${version}`);
          console.error(e);
          return new Response("500", { status: 500 });
        }
      }
    }

    return new Response("404", { status: 404 });
  } catch (error) {
    return new Response(error.message || error.toString(), { status: 500 });
  }
}

if (import.meta?.main) {
  const timestamp = Date.now();
  const humanReadableDateTime = new Intl.DateTimeFormat("default", {
    dateStyle: "full",
    timeStyle: "long",
  }).format(timestamp);

  console.log("Current Date: ", humanReadableDateTime);
  console.info(`Server Listening on http://localhost:8000`);

  serve(requestHandler);
}
