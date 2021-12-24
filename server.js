import { serve } from "https://deno.land/std@0.118.0/http/server.ts";
import { marked } from "https://ga.jspm.io/npm:marked@4.0.5/lib/marked.esm.js";
import {
  Helmet,
  jsx,
  renderSSR,
} from "https://ga.jspm.io/npm:nano-jsx@0.0.25/lib/index.js";

function Aside({ license, files }) {
  return jsx`<jspm-package-aside>
<aside>
      <jspm-package-license>${license}</jspm-package-license>

      <jspm-package-files>
        ${
    files?.map((file) => (
      jsx`<jspm-package-file>${file}</jspm-package-file>`
    ))
  }
      </jspm-package-files>
    </aside>
</jspm-package-aside>`;
}

function Header({ homepage, name, version, description }) {
  return jsx`
 <jspm-package-header>
 <jspm-package-name>
   <h1><a href=${homepage}>${name}</a></h1>
 </jspm-package-name>
 <jspm-package-version>${version}</jspm-package-version>
 <jspm-package-description>${description}</jspm-package-description>

</jspm-package-header>
 `;
}

function Readme({ __html }) {
  return jsx`
  <jspm-package-readme dangerouslySetInnerHTML=${{
    __html: __html,
  }} />
  `;
}

function Package(
  {
    name,
    description,
    keywords,
    version,
    homepage,
    license,
    files,
    exports,
    readme,
  },
) {
  return jsx`
    <jspm-package>
      <${Header} homepage=${homepage} name=${name} description=${description} version=${version} />
      <jspm-package-content-grid>
      <${Readme} __html=${readme}/>
      <${Aside} license=${license} files=${files} exports=${exports} keywords=${keywords}/>
      </jspm-package-content-grid>
    </jspm-package>`;
}
async function requestHandler(request) {
  try {
    const { pathname } = new URL(request.url);
    if (pathname === "/") {
      const response = await Deno.readFile("./index.html");

      return new Response(response, {
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
    if (pathname === "/package/style.css" || pathname === "/style.css") {
      const response = await Deno.readFile("./style.css");

      return new Response(response, {
        headers: { "content-type": "text/css; charset=utf-8" },
      });
    }
    const BASE_PATH = "/package/";
    const NPM_PROVIDER_URL = "https://ga.jspm.io/npm:";
    const maybeReadmeFiles = ["README.md", "readme.md"];
    const headers = {
      "content-type": "text/html; charset=UTF-8",
      "Cache-Control":
        "s-maxage=1500, public, immutable, stale-while-revalidate=1501",
      "Link": `<https://ga.jspm.io>; rel="preconnect", <https://fonts.googleapis.com>; rel="preconnect", </package/style.css>; rel="preload"; as="style", <https://ga.jspm.io/npm:the-new-css-reset@1.4.4/css/reset.css>; rel="preload"; as="style", <https://fonts.googleapis.com/css2?family=Abril+Fatface&family=Bebas+Neue&family=Major+Mono+Display&family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,700&family=Source+Code+Pro&family=Vollkorn&display=swap>; rel="preload"; as="style"`,
    };

    if (pathname.startsWith(BASE_PATH)) {
      const [, packageName] = pathname.split(BASE_PATH);

      if (packageName) {
        const baseURL = `${NPM_PROVIDER_URL}${packageName}`;
        const filesToFetch = ["package.json", ...maybeReadmeFiles];

        const [jspmPackage, README, readme] = await Promise.all(
          filesToFetch.map((file) =>
            fetch(
              `${baseURL}/${file}`,
            )
          ),
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

        const readmeFileContent = await [README, readme].find((readmeFile) =>
          readmeFile.status === 200 || readmeFile.status === 304
        ).text();

        const readmeHTML = marked.parse(readmeFileContent);

        const app = renderSSR(
          jsx
            `<${Package} name=${name} description=${description} version=${version} homepage=${homepage} license=${license} files=${files} exports=${exports} readme=${readmeHTML} keywords=${keywords} />`,
        );

        const { body, head, footer } = Helmet.SSR(app);

        // const css = await Deno.readTextFile('./style.css');

        const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <title>${name}@${version} - JSPM</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="description" content=${description}>
        <link rel="stylesheet" href="https://ga.jspm.io/npm:the-new-css-reset@1.4.4/css/reset.css" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Abril+Fatface&family=Bebas+Neue&family=Major+Mono+Display&family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,700&family=Source+Code+Pro&family=Vollkorn&display=swap" />
        <link rel="stylesheet" href="./style.css" />
        
        ${head.join("\n")}
      </head>
      <body>
        ${body}
        ${footer.join("\n")}
      </body>
    </html>`;

        return new Response(html, {
          headers,
        });
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
  })
    .format(timestamp);

  console.log("Current Date: ", humanReadableDateTime);
  console.info(`Server Listening on http://localhost:8000`);

  await serve(requestHandler);
}
