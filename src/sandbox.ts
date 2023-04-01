/// <reference lib="dom" />

import { basicSetup, EditorView } from "codemirror";
import type { ViewUpdate } from "@codemirror/view";
import { Compartment, EditorState } from "@codemirror/state";
import { language } from "@codemirror/language";
import { html, htmlLanguage } from "@codemirror/lang-html";
import { javascript } from "@codemirror/lang-javascript";
import { Generator } from "@jspm/generator";
import { jspmDark } from "#theme-codemirror-jspm-dark";
import { generateTreeFromDOM } from "#domtree";
import {
  EXAMPLES_GENERATED_CODE_HTML_BROWSER,
  EXAMPLES_GENERATED_CODE_IMPORTMAP_BROWSER,
  EXAMPLES_RENDER_HTML_BROWSER,
  EXAMPLES_RENDER_DOMTREE,
  DEFAULT_EXAMPLES_CODE_ACTIVE_TAB
} from "#constants";

const generator = new Generator({
  env: ["browser", "production"]
});

async function getExampleInputCode() {
  const docTemplate = await fetch("/example-browser-input.html");
  return docTemplate.text();
}

let examplesGeneratedCodeImportmapBrowserEditor: EditorView;

let examplesGeneratedCodeHTMLBrowserEditor: EditorView;

let examplesSourceCodeHTMLBrowserEditor: EditorView;

function jspmGeneratedHTML(htmlSource: string) {
  return generator.htmlInject(htmlSource, {
    preload: true,
    // integrity: true, // erring ATM
    whitespace: true,
    esModuleShims: true,
    comment: true,
    trace: true,
  });
}

async function getExampleOutputCode() {
  const docTemplate = await fetch("/example-browser-output.html");
  return docTemplate.text();
}

const languageConf = new Compartment();

const autoLanguage = EditorState.transactionExtender.of((tr) => {
  if (!tr.docChanged) return null;
  let docIsHTML = /^\s*</.test(tr.newDoc.sliceString(0, 100));
  let stateIsHTML = tr.startState.facet(language) == htmlLanguage;
  if (docIsHTML == stateIsHTML) return null;
  return {
    effects: languageConf.reconfigure(docIsHTML ? html() : javascript()),
  };
});

function renderExample(source: string) {
  const iframe = document.querySelector(
    "jspm-packages-examples-render-html-browser > iframe",
  ) as HTMLIFrameElement | null;
  if (iframe) {
    const needsShim = !source.match(/es-module-shims(\.min)?\.js/);
    const blobUrl = URL.createObjectURL(
      new Blob(
        [
          `
        <script>self.esmsInitOptions = { polyfillEnable: ['css-modules', 'json-modules'], onerror: e=>{window.parent.jspmSandboxError(e.message || e, '', '', '', e)} };</script>
        ${needsShim
            ? `<script async src="https://ga.jspm.io/npm:es-module-shims@1.7.0/dist/es-module-shims.min.js"><${""}/script>`
            : ""
          }
        <script>window.parent.jspmSandboxStarted()<${""}/script>
        ${source}
        <script type="module">window.parent.jspmSandboxFinished()<${""}/script>
        <script>
        window.onerror = function (msg, source, line, col, err) {
          window.parent.jspmSandboxError(msg, source, line, col, err);
        };
        window.console = window.parent.jspmConsole;
        <${""}/script>
      `,
        ],
        { type: "text/html" },
      ),
    );
    iframe.src = blobUrl;

    let started = false;
    let running = false;
    window.jspmSandboxStarted = () => (started = true);
    window.jspmSandboxFinished = () => {
      if (!started) {
        if (running) {
          console.log(
            "Network error loading modules. Check the browser network panel.",
          );
          running = false;
          iframe.contentDocument.body.style.cursor = "default";
        }
      } else {
        running = false;
        iframe.contentDocument.body.style.cursor = "default";
      }
    };
    window.jspmSandboxError = (msg, source, line, col, err) => {
      if (running) {
        running = false;
        iframe.contentDocument.body.style.cursor = "default";
      }
      let parts = (err.stack || err).split(blobUrl);
      if (parts.length === 1) {
        if (line === 1) col = col - 72;
        parts = [`${msg} sandbox:${line}:${col}`];
      }
      console.log(parts.join("sandbox"), { color: "red" });
    };
  }
}

function renderExamplesGeneratedCodeImportmapBrowser() {
  const importmapEditorMountElement = document.querySelector(
    "jspm-packages-examples-generated-code-importmap-browser",
  ) as HTMLElement | null;

  if (importmapEditorMountElement) {

    importmapEditorMountElement.innerHTML = "";

    const editor = new EditorView({
      doc: '{}',
      extensions: [basicSetup, languageConf.of(html()), autoLanguage, jspmDark],
      parent: importmapEditorMountElement,
    });
    examplesGeneratedCodeImportmapBrowserEditor = editor;
    return editor;
  }
}

async function renderExamplesGeneratedCodeHTMLBrowser() {
  const outputEditorMountElement = document.querySelector(
    "jspm-packages-examples-generated-code-html-browser",
  ) as HTMLElement | null;

  if (outputEditorMountElement) {
    const { output } = outputEditorMountElement.dataset;
    const htmlSource = output || (await getExampleOutputCode());

    outputEditorMountElement.innerHTML = "";

    const editor = new EditorView({
      doc: htmlSource,
      extensions: [basicSetup, languageConf.of(html()), autoLanguage, jspmDark],
      parent: outputEditorMountElement,
    });

    examplesGeneratedCodeHTMLBrowserEditor = editor;

    return editor;
  }
}

function renderSandbox(insert: string) {
  const store = localStorage.getItem("@jspm/packages/store");
  if (store) {
    const { examplesCodeBlockActiveTab } = JSON.parse(store);
    if (examplesCodeBlockActiveTab === "sandbox-generated-html-browser-render") {
      renderExample(insert);
    }

    if (examplesCodeBlockActiveTab === "sandbox-nft") {
      generateTreeFromDOM(insert);
      //renderImportmap(insert);
    }
  }
}

async function updateDoc(viewUpdate: ViewUpdate) {
  const insert = await jspmGeneratedHTML(viewUpdate.state.doc.toString());
  const store = localStorage.getItem("@jspm/packages/store");
  
  if (store) {
    const { examplesCodeBlockActiveTab, examplesRenderBlockActiveTab } = JSON.parse(store);
   
    switch (examplesCodeBlockActiveTab) {
      case EXAMPLES_GENERATED_CODE_HTML_BROWSER: {
        console.log(EXAMPLES_GENERATED_CODE_HTML_BROWSER);
        examplesGeneratedCodeHTMLBrowserEditor?.dispatch({
          changes: {
            from: 0,
            to: examplesGeneratedCodeHTMLBrowserEditor.state.doc.length,
            insert,
          },
        });
        break;
      }
      case EXAMPLES_GENERATED_CODE_IMPORTMAP_BROWSER: {
        console.log(EXAMPLES_GENERATED_CODE_IMPORTMAP_BROWSER);
        const parsedDOM = new DOMParser().parseFromString(insert, "text/html");
        const scripts = Array.from(parsedDOM.scripts).find((script) =>
          script.type === "importmap"
        );
        examplesGeneratedCodeImportmapBrowserEditor?.dispatch({
          changes: {
            from: 0,
            to: examplesGeneratedCodeImportmapBrowserEditor.state.doc.length,
            insert: scripts?.innerText,
          },
        });
        break;
      }
      default: {
        console.info(DEFAULT_EXAMPLES_CODE_ACTIVE_TAB);
      }
    }

    switch (examplesRenderBlockActiveTab) {
      case EXAMPLES_RENDER_DOMTREE: {
        console.log(EXAMPLES_RENDER_DOMTREE);
        generateTreeFromDOM(insert);
        break;
      }
      case EXAMPLES_RENDER_HTML_BROWSER: {
        console.log(EXAMPLES_RENDER_HTML_BROWSER);
        renderExample(insert);
        break;
      }
      default: {
        console.error(`unhandled render block case`);
      }
    }
  }
}

async function renderExamplesSourceCodeHTMLBrowserEditor() {
  const inputEditorMountElement = document.querySelector(
    "jspm-packages-examples-source-code-html-browser",
  ) as HTMLElement | null;

  if (inputEditorMountElement) {
    const { input } = inputEditorMountElement.dataset;
    const htmlSource = input || (await getExampleInputCode());

    inputEditorMountElement.innerHTML = "";

    const editor = new EditorView({
      doc: htmlSource,
      extensions: [
        basicSetup,
        languageConf.of(html()),
        autoLanguage,
        jspmDark,
        EditorView.updateListener.of(updateDoc),
      ],
      parent: inputEditorMountElement,
    });

    return editor;
  }
}

function main() {
  Promise.all([renderExamplesSourceCodeHTMLBrowserEditor(), renderExamplesGeneratedCodeHTMLBrowser(), renderExamplesGeneratedCodeImportmapBrowser()]);
}

export { main, renderExamplesSourceCodeHTMLBrowserEditor };
