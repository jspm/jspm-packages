/** @jsx h */
import { h } from "nano-jsx";

type Prop = {
  browser?: {
    input: string;
    output: string;
  };
};

function Examples({ browser }: Prop) {
  return (
    <section class="example">
      <div>
        <h3>
          <a href="https://marketplace.visualstudio.com/items?itemName=JSPM.jspm-vscode">
            JSPM Generator VS Code plugin
          </a>{" "}
        </h3>
        <p>
          scans HTML for javascipt and injects updated importmap and a shim for
          browsers without importmap support.
        </p>
        <pre>
          <code class="language-markup">{browser?.input}</code>
        </pre>
      </div>
      <div class="generator-button">
        <button class="generate"></button>
      </div>
      <div>
        <pre>
          <code class="language-markup">{browser?.output}</code>
        </pre>
      </div>
    </section>
  );
}

export { Examples };

export type { Prop as ExamplesProp };
