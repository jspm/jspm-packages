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
          <div class="browser-control">
            <svg xmlns="http://www.w3.org/2000/svg" width="54" height="14" viewBox="0 0 54 14"><g fill="none" fill-rule="evenodd" transform="translate(1 1)"><circle cx="6" cy="6" r="6" fill="#FF5F56" stroke="#E0443E" stroke-width=".5"></circle><circle cx="26" cy="6" r="6" fill="#FFBD2E" stroke="#DEA123" stroke-width=".5"></circle><circle cx="46" cy="6" r="6" fill="#27C93F" stroke="#1AAB29" stroke-width=".5"></circle></g></svg>
          </div>
          <div class="example-browser-input">
            <pre>
              <code class="language-markup">{browser?.input}</code>
            </pre>
          </div>
        </jspm-packages-example-browser>

        {/* <jspm-packages-generator-button>
          <button></button>
        </jspm-packages-generator-button> */}

        <jspm-packages-example-render id="container">

          <iframe frameborder="0" margin="0" padding="0" borderStyle="none" height="100%" width="100%" marginBottom="-5px" overflow="scroll"></iframe>
        </jspm-packages-example-render>

        <jspm-packages-example-browser data-output={browser?.output}>
          <div class="browser-control">
            <svg xmlns="http://www.w3.org/2000/svg" width="54" height="14" viewBox="0 0 54 14"><g fill="none" fill-rule="evenodd" transform="translate(1 1)"><circle cx="6" cy="6" r="6" fill="#FF5F56" stroke="#E0443E" stroke-width=".5"></circle><circle cx="26" cy="6" r="6" fill="#FFBD2E" stroke="#DEA123" stroke-width=".5"></circle><circle cx="46" cy="6" r="6" fill="#27C93F" stroke="#1AAB29" stroke-width=".5"></circle></g></svg>
          </div>
          <div class="example-browser-output">
            <pre>
              <code class="language-markup">{browser?.output}</code>
            </pre>
          </div>
        </jspm-packages-example-browser>
      </article>
    </section>
  );
}

export { Examples };

export type { Prop as ExamplesProp };
