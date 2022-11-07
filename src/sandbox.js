import { basicSetup, EditorView } from "codemirror";
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

async function getSampleCode() {
  const docTemplate = await fetch("/example-browser.html");
  return docTemplate.text();
}

function getDoc(htmlSource) {
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

const mountElement = document.querySelector("jspm-packages-example-browser");

const { input } = mountElement.dataset;
const htmlSource = input || await getSampleCode();

const doc = await getDoc(htmlSource);

mountElement.innerHTML = "";

const editor = new EditorView({
  doc,
  extensions: [
    basicSetup,
    languageConf.of(javascript()),
    autoLanguage,
    jspmDark,
    EditorView.theme({}, { dark: true }),
    //   EditorView.updateListener.of((viewUpdate) => {
    //     updateDoc(viewUpdate);
    //   }),
  ],
  parent: mountElement,
});

function renderExample(source) {
  const iframe = document.createElement("iframe");
  Object.assign(iframe.style, {
    margin: "0",
    padding: "0",
    borderStyle: "none",
    height: "100%",
    width: "100%",
    marginBottom: "-5px", // no idea, but it works
    overflow: "scroll",
  });
  const needsShim = !source.match(/es-module-shims(\.min)?\.js/);
  const blobUrl = URL.createObjectURL(
    new Blob([`
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
    `], { type: "text/html" }),
  );
  iframe.src = blobUrl;
  const renderElement = document.querySelector("jspm-packages-example-render");
  renderElement.innerHTML = "";
  renderElement.appendChild(iframe);

  let started = false;
  let running = false;
  window.jspmSandboxStarted = () => started = true;
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
async function updateDoc() {
  const insert = await getDoc(editor.state.doc.toString());
  editor.dispatch({
    changes: {
      from: 0,
      to: editor.state.doc.length,
      insert,
    },
  });
  renderExample(insert);
}
document.querySelector("jspm-packages-generator-button > button")
  .addEventListener("click", updateDoc);
export { updateDoc };
