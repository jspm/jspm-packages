/** @jsx h */
import { h, Fragment } from "nano-jsx";

type Prop = {
  browser?: {
    input: string;
    output: string;
  };
};

function Examples({ browser }: Prop) {
  return (
    <section class="examples">
      <h1>Liberate your modules with JSPM CDN.</h1>
      <article class="example">
        <jspm-packages-example-browser data-input={browser?.input}>
          <div class="example-browser-input">
            <pre>
              <code class="language-markup">{browser?.output}</code>
            </pre>
          </div>
        </jspm-packages-example-browser>

        <jspm-packages-generator-button>
          <button></button>
        </jspm-packages-generator-button>
        <jspm-packages-example-render id="container">Render</jspm-packages-example-render>
      </article>
    </section>
  );
}

export { Examples };

export type { Prop as ExamplesProp };
