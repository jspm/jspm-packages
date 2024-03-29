/// <reference no-default-lib="true" />
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />
/// <reference lib="deno.unstable" />

import he from "he";
import Prism from "prismjs";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-markup";
import "prismjs/components/prism-json";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-shell-session";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-typescript";
// import sanitizeHtml from "sanitize-html";
// import sanitizeHtml from "https://jspm.dev/sanitize-html";

import { emojify } from "https://deno.land/x/emoji@0.1.2/mod.ts";
import { marked } from "marked";
import type { Slugger } from "marked";

class Renderer extends marked.Renderer {
  heading(
    text: string,
    level: 1 | 2 | 3 | 4 | 5 | 6,
    raw: string,
    slugger: Slugger
  ): string {
    const slug = slugger.slug(raw);
    return `<h${level} id="${slug}"><a class="anchor" aria-hidden="true" tabindex="-1" href="#${slug}"><svg class="octicon octicon-link" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M7.775 3.275a.75.75 0 001.06 1.06l1.25-1.25a2 2 0 112.83 2.83l-2.5 2.5a2 2 0 01-2.83 0 .75.75 0 00-1.06 1.06 3.5 3.5 0 004.95 0l2.5-2.5a3.5 3.5 0 00-4.95-4.95l-1.25 1.25zm-4.69 9.64a2 2 0 010-2.83l2.5-2.5a2 2 0 012.83 0 .75.75 0 001.06-1.06 3.5 3.5 0 00-4.95 0l-2.5 2.5a3.5 3.5 0 004.95 4.95l1.25-1.25a.75.75 0 00-1.06-1.06l-1.25 1.25a2 2 0 01-2.83 0z"></path></svg></a>${text}</h${level}>`;
  }

  code(code: string, language?: string) {
    // a language of `ts, ignore` should really be `ts`
    // language = language?.split(",")?.[0];
    language = (language || "").match(/\S*/)[0].toLowerCase();
    const grammar =
      language && Object.hasOwnProperty.call(Prism.languages, language)
        ? Prism.languages[language]
        : undefined;
    if (grammar === undefined) {
      return `<pre><code class="language-${language}">${he.escape(
        code
      )}</code></pre>`;
    }
    const html = Prism.highlight(code, grammar, language!);
    return `<div class="highlight highlight-source-${language}"><pre class="language-${language}">${html}</pre></div>`;
  }

  link(href: string, title: string, text: string) {
    if (href.startsWith("#")) {
      return `<a href="${href}" title="${title}">${text}</a>`;
    }
    return `<a href="${href}" title="${title}" rel="noopener noreferrer">${text}</a>`;
  }
}

interface RenderOptions {
  baseUrl?: string;
  allowIframes?: boolean;
}

function render(markdown: string, opts: RenderOptions = {}) {
  markdown = emojify(markdown);

  const html = marked(markdown, {
    baseUrl: opts.baseUrl,
    gfm: true,
    renderer: new Renderer(),
  });

  return html;

  // const allowedTags = sanitizeHtml.defaults.allowedTags.concat([
  //   "img",
  //   "video",
  //   "svg",
  //   "path",
  // ]);
  // if (opts.allowIframes) {
  //   allowedTags.push("iframe");
  // }

  // const sanitizedHTML = sanitizeHtml(html, {
  //   allowedTags,
  //   allowedAttributes: {
  //     ...sanitizeHtml.defaults.allowedAttributes,
  //     img: ["src", "alt", "height", "width", "align"],
  //     video: [
  //       "src",
  //       "alt",
  //       "height",
  //       "width",
  //       "autoplay",
  //       "muted",
  //       "loop",
  //       "playsinline",
  //     ],
  //     a: ["id", "aria-hidden", "href", "tabindex", "rel"],
  //     svg: ["viewbox", "width", "height", "aria-hidden"],
  //     path: ["fill-rule", "d"],
  //     h1: ["id"],
  //     h2: ["id"],
  //     h3: ["id"],
  //     h4: ["id"],
  //     h5: ["id"],
  //     h6: ["id"],
  //     iframe: ["src", "width", "height"], // Only used when iframe tags are allowed in the first place.
  //   },
  //   allowedClasses: {
  //     div: ["highlight", "highlight-source-*"],
  //     span: [
  //       "token",
  //       "keyword",
  //       "operator",
  //       "number",
  //       "boolean",
  //       "function",
  //       "string",
  //       "comment",
  //       "class-name",
  //       "regex",
  //       "regex-delimiter",
  //       "tag",
  //       "attr-name",
  //       "punctuation",
  //       "script-punctuation",
  //       "script",
  //       "plain-text",
  //       "property",
  //     ],
  //     a: ["anchor"],
  //     svg: ["octicon", "octicon-link"],
  //   },
  //   allowProtocolRelative: false,
  // });
  // return sanitizedHTML;
}

export { render };
