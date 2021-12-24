import { serve } from "https://deno.land/std@0.118.0/http/server.ts";
import { emojify } from "https://deno.land/x/emoji@0.1.2/mod.ts";
import he from "https://ga.jspm.io/npm:he@1.2.0/he.js";
import { marked } from "https://ga.jspm.io/npm:marked@4.0.5/lib/marked.esm.js";
import Prism from "https://ga.jspm.io/npm:prismjs@1.25.0/prism.js";
//import DOMPurify from "https://ga.jspm.io/npm:dompurify@2.3.4/dist/purify.js";
import {
  Helmet,
  jsx,
  renderSSR,
} from "https://ga.jspm.io/npm:nano-jsx@0.0.25/lib/index.js";

class Renderer extends marked.Renderer {
  heading(
    text,
    level,
    raw,
    slugger,
  ) {
    const slug = slugger.slug(raw);
    return `<h${level} id="${slug}"><a class="anchor" aria-hidden="true" tabindex="-1" href="#${slug}"><svg class="octicon octicon-link" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M7.775 3.275a.75.75 0 001.06 1.06l1.25-1.25a2 2 0 112.83 2.83l-2.5 2.5a2 2 0 01-2.83 0 .75.75 0 00-1.06 1.06 3.5 3.5 0 004.95 0l2.5-2.5a3.5 3.5 0 00-4.95-4.95l-1.25 1.25zm-4.69 9.64a2 2 0 010-2.83l2.5-2.5a2 2 0 012.83 0 .75.75 0 001.06-1.06 3.5 3.5 0 00-4.95 0l-2.5 2.5a3.5 3.5 0 004.95 4.95l1.25-1.25a.75.75 0 00-1.06-1.06l-1.25 1.25a2 2 0 01-2.83 0z"></path></svg></a>${text}</h${level}>`;
  }

  code(code, language) {
    // a language of `ts, ignore` should really be `ts`
    language = language.split(",")[0];
    const grammar = Object.hasOwnProperty.call(Prism.languages, language)
      ? Prism.languages[language]
      : undefined;
    if (grammar === undefined) {
      return `<pre><code>${he.escape(code)}</code></pre>`;
    }
    const html = Prism.highlight(code, grammar, language);
    return `<div class="highlight highlight-source-${language}"><pre>${html}</pre></div>`;
  }

  link(href, title, text) {
    if (href.startsWith("#")) {
      return `<a href="${href}" title="${title}">${text}</a>`;
    }
    return `<a href="${href}" title="${title}" rel="noopener noreferrer">${text}</a>`;
  }
}

function render(markdown, opts = {}) {
  markdown = emojify(markdown);

  return marked(markdown, {
    gfm: true,
    renderer: new Renderer(),
  });

  //return DOMPurify.sanitize(html);
}

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

function Logo({ name, version }) {
  return jsx`
  <jspm-package-logo>
    <div class="scene">
  <div class="cube show-top">
    <div class="cube__face cube__face--front">${name}</div>
    <div class="cube__face cube__face--back"></div>
    <div class="cube__face cube__face--right">${version}</div>
    <div class="cube__face cube__face--left">left</div>
    <div class="cube__face cube__face--top"><a href="/">JSPM</a></div>
    <div class="cube__face cube__face--bottom"></div>
  </div>
</div>
</jspm-package-logo>
    `;
}
function Header({ homepage, name, version, description }) {
  return jsx`
 <jspm-package-header>
    <${Logo} name=${name} version=${version} />
    <jspm-package-information>
    <jspm-package-name>
   <h1><a href=${homepage}>${name}</a></h1>
 </jspm-package-name>
 <jspm-package-version>${version}</jspm-package-version>
 <jspm-package-description>${description}</jspm-package-description>
 </jspm-package-information>
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
      "Link":
        `<https://ga.jspm.io>; rel="preconnect", <https://fonts.googleapis.com>; rel="preconnect", </package/style.css>; rel="preload"; as="style", <https://ga.jspm.io/npm:the-new-css-reset@1.4.4/css/reset.css>; rel="preload"; as="style", <https://fonts.googleapis.com/css2?family=Abril+Fatface&family=Bebas+Neue&family=Major+Mono+Display&family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,700&family=Source+Code+Pro&family=Vollkorn&display=swap>; rel="preload"; as="style"`,
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

        const readmeHTML = render(readmeFileContent);

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
        <link rel="stylesheet" href="https://ga.jspm.io/npm:normalize.css@8.0.1/normalize.css" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Abril+Fatface&family=Bebas+Neue&family=Major+Mono+Display&family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,700&family=Source+Code+Pro&family=Vollkorn&display=swap" />
        <link rel="stylesheet" href="https://ga.jspm.io/npm:prismjs@1.25.0/themes/prism.css" />
        <link rel="stylesheet" href="./style.css" />
        
        ${head.join("\n")}
        <srcipt src="https://ga.jspm.io/npm:prismjs@1.25.0/prism.js"></script>
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
