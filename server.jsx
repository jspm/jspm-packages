/** @jsx h */

import { serve } from "https://deno.land/std@0.121.0/http/server.ts";
import { h, Helmet, renderSSR } from "nano-jsx";
import { Package } from "./lib/package.js";
import { Home } from "./lib/home.js";
import { pageServingHeaders, renderMarkdownContent } from "./utils.js";
import { FEATURED_PACKAGES } from "./lib/featured-packages-list.js";

const staticResources = {
  "/style.css": { path: "./style.css", contentType: "text/css; charset=utf-8" },
  "/dom-main.js": {
    path: "./lib/dom-main.js",
    contentType: "application/javascript; charset=utf-8",
  },
  "/header.js": {
    path: "./lib/header.js",
    contentType: "application/javascript; charset=utf-8",
  },
  "/logo.js": {
    path: "./lib/logo.js",
    contentType: "application/javascript; charset=utf-8",
  },
  "/search.js": {
    path: "./lib/search.js",
    contentType: "application/javascript; charset=utf-8",
  },
  "/nav.js": {
    path: "./lib/nav.js",
    contentType: "application/javascript; charset=utf-8",
  },
};

async function generateHTML(
  { template, body, head, footer } = { template: "./lib/shell.html" },
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
        template: "./lib/shell.html",
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

        const [jspmPackage, README, readme] = await Promise.all(
          filesToFetch.map((file) => fetch(`${baseURL}/${file}`)),
        );

        const {
          name,
          description,
          keywords,
          version,
          homepage,
          license,
          files,
          exports,
        } = await jspmPackage.json();

        const readmeFileContent = await [README, readme]
          .find(
            (readmeFile) =>
              readmeFile.status === 200 || readmeFile.status === 304,
          )
          .text();

        try {
          const readmeHTML = renderMarkdownContent(readmeFileContent);
          const app = renderSSR(
            <Package
              name={name}
              description={description}
              version={version}
              homepage={homepage}
              license={license}
              files={files}
              exports={exports}
              readme={readmeHTML}
              keywords={keywords}
            />,
          );
          const { body, head, footer } = Helmet.SSR(app);
          /* Hack to SSR readme :! */
          const html = await generateHTML({
            template: "./lib/shell.html",
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
