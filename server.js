import { serve } from "https://deno.land/std@0.118.0/http/server.ts";
import { parse, relative } from "https://deno.land/std@0.119.0/path/mod.ts";
import { Helmet, jsx, renderSSR } from "nano-jsx";
import { Package } from "./components/package.js";
import { FeaturedPackages } from "./components/featured-packages.js";
import { pageServingHeaders, renderMarkdownContent } from "./utils.js";
const importMap = JSON.parse(Deno.readTextFileSync("./importmap.json"));

let bundleFiles = {};

/* The reason for this patch-work :D is to serve the files as es modules.
  Deno doesn't allow, files to be undled without including the dependencies.
  And we don't have code splitting and fancy at the moment. So,
  - If we use Deno.emit('', { bundle: 'module' }) this includes the deps
  into every single individual module.
  - This just duplicates the code every-where, So, just serve the files as
  individual modules.
  - This allows, us to hydrate components only that are needed.
*/
try {
  for await (const file of Deno.readDir("hydrations")) {
    const { files } = await Deno.emit(`./hydrations/${file.name}`);
    const dirname = parse(import.meta.url).dir;
    Object.keys(files).forEach((fileId) => {
      bundleFiles[`/${relative(dirname, fileId)}`] = files[fileId];
    });
  }
} catch (e) {
  console.error(`Failed to generate client builds`);
  console.error(e);
}

async function requestHandler(request) {
  try {
    const { pathname } = new URL(request.url);

    if (pathname === "/") {
      const packages = await FeaturedPackages.fetchPackages();
      const indexPage = renderSSR(
        jsx`<${FeaturedPackages} packages=${packages}  />`
      );
      const { body, head, footer } = Helmet.SSR(indexPage);

      const html = `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <title>JSPM Packages</title>
            <meta charset="UTF-8">
            <link rel="stylesheet" href="https://ga.jspm.io/npm:normalize.css@8.0.1/normalize.css" />
            <link rel="stylesheet" href="./style.css" />
            <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Abril+Fatface&family=Bebas+Neue&family=Major+Mono+Display&family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,700&family=Source+Code+Pro&family=Vollkorn&family=Inter:wght@200;400;800&display=swap" />
            ${head.join("\n")}
            <script type="importmap">
              ${JSON.stringify(importMap, null, 2)}
            </script>
            </head>
            <body>
            ${body}
            ${footer.join("\n")}
          </body>
        </html>`;

      return new Response(html, {
        headers: pageServingHeaders,
      });
    }

    if (pathname === "/package/style.css" || pathname === "/style.css") {
      const response = await Deno.readFile("./style.css");

      return new Response(response, {
        headers: { "content-type": "text/css; charset=utf-8" },
      });
    }

    if (bundleFiles[pathname]) {
      return new Response(bundleFiles[pathname], {
        headers: { "content-type": "application/javascript; charset=utf-8" },
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
          filesToFetch.map((file) => fetch(`${baseURL}/${file}`))
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
              readmeFile.status === 200 || readmeFile.status === 304
          )
          .text();

        try {
          const readmeHTML = renderMarkdownContent(readmeFileContent);
          const app = renderSSR(
            jsx`<${Package} name=${name} description=${description} version=${version} homepage=${homepage} license=${license} files=${files} exports=${exports} readme=${readmeHTML} keywords=${keywords} />`
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
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta name="description" content=${description}>
          <link rel="stylesheet" href="https://ga.jspm.io/npm:normalize.css@8.0.1/normalize.css" />
          <link rel="stylesheet" href="./style.css" />
          <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Abril+Fatface&family=Bebas+Neue&family=Major+Mono+Display&family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,700&family=Source+Code+Pro&family=Vollkorn&family=Inter:wght@200;400;800&display=swap" />
          <link rel="stylesheet" href="https://ga.jspm.io/npm:prismjs@1.25.0/themes/prism.css" />
          ${head.join("\n")}
          <srcipt src="https://ga.jspm.io/npm:prismjs@1.25.0/prism.js"></script>
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
