/** @jsx h */
import { serve } from "https://deno.land/std@0.118.0/http/server.ts";
import {
  contentType,
  lookup,
} from "https://deno.land/x/media_types@v2.11.1/mod.ts";
import { h, Helmet, renderSSR } from "nano-jsx";
import { Package } from "./lib/package.js";
import { FeaturedPackages } from "./lib/featured-packages.js";
import {
  getRecentPackages,
  pageServingHeaders,
  renderMarkdownContent,
} from "./utils.js";

const staticResources = {
  "/style.css": "./style.css",
  "/dom-main.js": "./lib/dom-main.js",
  "/header.js": "./lib/header.js",
};

async function requestHandler(request) {
  try {
    const { pathname } = new URL(request.url);
    const staticResource = staticResources[pathname];

    if (staticResource) {
      const response = await Deno.readFile(staticResource);

      return new Response(response, {
        headers: { "content-type": contentType(lookup(staticResource)) },
      });
    }

    if (pathname === "/") {
      const { objects = [] } = (await getRecentPackages()) || {};
      const indexPage = renderSSR(<FeaturedPackages packages={objects} />);
      const { body, head, footer } = Helmet.SSR(indexPage);

      const content = await Deno.readTextFile("./lib/shell.html");
      const [START, AFTER_HEADER_BEFORE_CONTENT, DOM_SCRIPT, END] = content
        .split(/<!-- __[A-Z]*__ -->/i);
      const html = [
        START,
        head.join("\n"),
        AFTER_HEADER_BEFORE_CONTENT,
        body,
        DOM_SCRIPT,
        footer.join("\n"),
        END,
      ].join("\n");

      return new Response(html, {
        headers: pageServingHeaders,
      });
    }

    const BASE_PATH = "/package/";
    const NPM_PROVIDER_URL = "https://ga.jspm.io/npm:";
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
          const pieces = body.split("<package-readme-placeholder>");

          const html = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <title>${name}@${version} - JSPM</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width,initial-scale=1.0">
          <meta name="description" content=${description}>
          <link rel="stylesheet" href="https://ga.jspm.io/npm:normalize.css@8.0.1/normalize.css" />
          <link rel="stylesheet" href="./style.css" />
          <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Abril+Fatface&family=Bebas+Neue&family=Major+Mono+Display&family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,700&family=Source+Code+Pro&family=Vollkorn&family=Inter:wght@200;400;800&display=swap" />
          <link rel="stylesheet" href="https://ga.jspm.io/npm:prismjs@1.25.0/themes/prism.css" />
          ${head.join("\n")}
        </head>
        <body>
          ${pieces[0]}
          ${readmeHTML}
          ${pieces[1]}
          ${footer.join("\n")}
        </body>
      </html>`;

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

  await serve(requestHandler);
}
