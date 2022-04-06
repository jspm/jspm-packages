/** @jsx h */

import { serve } from "https://deno.land/std@0.132.0/http/server.ts";
import nano, { h, renderSSR } from "nano-jsx";
import dayjs from "dayjs";
import dayjsPluginRelativeTime from "dayjs/plugin/relativeTime";
import { SsrRoot } from "@jspm/packages/ssr-root";
import { Home } from "@jspm/packages/home";
import { pageServingHeaders, renderMarkdownContent } from "@jspm/packages/utils";
import { FEATURED_PACKAGES } from "@jspm/packages/featured-packages-list";
import { features, parseURL } from "@jspm/packages/package-quality-check";

const { Helmet } = nano;

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
  "/main.js": {
    path: "./lib/main.js",
    contentType: "application/javascript; charset=utf-8",
  },
  "/main.js.map": {
    path: "./lib/main.js.map",
    contentType: "application/javascript; charset=utf-8",
  },
  "/dom-root.js": {
    path: "./lib/dom-root.js",
    contentType: "application/javascript; charset=utf-8",
  },
  "/dom-root.js.map": {
    path: "./lib/dom-root.js.map",
    contentType: "application/javascript; charset=utf-8",
  },
  "/importmap-dialog.js": {
    path: "./lib/importmap-dialog.js",
    contentType: "application/javascript; charset=utf-8",
  },
  "/importmap-dialog.js.map": {
    path: "./lib/importmap-dialog.js.map",
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
  "/package.js": {
    path: "./lib/package.js",
    contentType: "application/javascript; charset=utf-8",
  },
  "/package.js.map": {
    path: "./lib/package.js.map",
    contentType: "application/javascript; charset=utf-8",
  },
  "/readme.js": {
    path: "./lib/readme.js",
    contentType: "application/javascript; charset=utf-8",
  },
  "/readme.js.map": {
    path: "./lib/readme.js.map",
    contentType: "application/javascript; charset=utf-8",
  },
  "/aside.js": {
    path: "./lib/aside.js",
    contentType: "application/javascript; charset=utf-8",
  },
  "/aside.js.map": {
    path: "./lib/aside.js.map",
    contentType: "application/javascript; charset=utf-8",
  },
  "/footer.js": {
    path: "./lib/footer.js",
    contentType: "application/javascript; charset=utf-8",
  },
  "/footer.js.map": {
    path: "./lib/footer.js.map",
    contentType: "application/javascript; charset=utf-8",
  },
  "/separator.js": {
    path: "./lib/separator.js",
    contentType: "application/javascript; charset=utf-8",
  },
  "/separator.js.map": {
    path: "./lib/separator.js.map",
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
  "/icon-distributed.png": {
    path: "./images/icon-distributed.png",
    contentType: "image/png",
  },
  "/npm-n-block-32.jpeg": {
    path: "./images/npm-n-block-32.jpeg",
    contentType: "image/png",
  },
  "/npm-n-block-16.png": {
    path: "./images/npm-n-block-16.png",
    contentType: "image/png",
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

        dayjs.extend(dayjsPluginRelativeTime);
        const updated = dayjs(modified).fromNow();
        const created = dayjs(createdISO).fromNow();
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
            <SsrRoot
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
