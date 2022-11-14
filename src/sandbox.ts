/// <reference lib="dom" />

import { basicSetup, EditorView } from "codemirror";
import type { ViewUpdate } from "@codemirror/view";
import { Compartment, EditorState } from "@codemirror/state";
import { language } from "@codemirror/language";
import { html, htmlLanguage } from "@codemirror/lang-html";
import { javascript } from "@codemirror/lang-javascript";
import { Generator } from "@jspm/generator";
import { jspmDark } from "#theme-codemirror-jspm-dark";

const generator = new Generator({
  env: ["browser", "production"],
  defaultProvider: "jspm.cachefly",
});

async function getExampleInputCode() {
  const docTemplate = await fetch("/example-browser-input.html");
  return docTemplate.text();
}

async function getExampleOutputCode() {
  const docTemplate = await fetch("/example-browser-output.html");
  return docTemplate.text();
}

function getDoc(htmlSource: string) {
  return generator.htmlInject(htmlSource, {
    preload: true,
    integrity: true, // erring ATM
    whitespace: true,
    esModuleShims: true,
    comment: true,
    trace: true,
  });
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
    "jspm-packages-example-render > iframe"
  ) as HTMLIFrameElement | null;
  if (iframe) {
    const needsShim = !source.match(/es-module-shims(\.min)?\.js/);
    const blobUrl = URL.createObjectURL(
      new Blob(
        [
          `
        <script>self.esmsInitOptions = { onerror: e=>{window.parent.jspmSandboxError(e.message || e, '', '', '', e)} };</script>
        ${
          needsShim
            ? `<script async src="https://ga.jspm.io/npm:es-module-shims@0.10.1/dist/es-module-shims.min.js"><${""}/script>`
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
        { type: "text/html" }
      )
    );
    iframe.src = blobUrl;

    // const renderElement = document.querySelector("jspm-packages-example-render")  as HTMLElement | null;
    // renderElement.innerHTML = "";
    // renderElement.appendChild(iframe);

    let started = false;
    let running = false;
    window.jspmSandboxStarted = () => (started = true);
    window.jspmSandboxFinished = () => {
      if (!started) {
        if (running) {
          console.log(
            "Network error loading modules. Check the browser network panel."
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

let outputEditor: EditorView;

async function renderOutput() {
  const outputEditorMountElement = document.querySelector(
    "jspm-packages-example-browser-output"
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
    outputEditor = editor;
    return editor;
  }
}

async function updateDoc(viewUpdate: ViewUpdate) {
  const insert = await getDoc(viewUpdate.state.doc.toString());
  outputEditor?.dispatch({
    changes: {
      from: 0,
      to: outputEditor.state.doc.length,
      insert,
    },
  });
  renderExample(insert);
}

async function renderInput() {
  const inputEditorMountElement = document.querySelector(
    "jspm-packages-example-browser-input"
  ) as HTMLElement | null;

  if (inputEditorMountElement) {
    const { input } = inputEditorMountElement.dataset;
    const htmlSource = input || (await getExampleInputCode());

    inputEditorMountElement.innerHTML = "";

    const editor = new EditorView({
      doc: htmlSource,
      extensions: [
        basicSetup,
        languageConf.of(javascript()),
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
  Promise.all([renderInput(), renderOutput()]);
}

export { main };
