/** @jsx h */
import { h } from "nano-jsx";
import { EXAMPLES_CODE_TAB, EXAMPLES_RENDER_TAB } from "#constants";

type Prop = {
  browser?: {
    input: string;
    output: string;
  };
};

function BrowserControl() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="54"
      height="14"
      viewBox="0 0 54 14"
    >
      <g fill="none" fill-rule="evenodd" transform="translate(1 1)">
        <circle
          cx="6"
          cy="6"
          r="6"
          fill="#FF5F56"
          stroke="#E0443E"
          stroke-width=".5"
        >
        </circle>
        <circle
          cx="26"
          cy="6"
          r="6"
          fill="#FFBD2E"
          stroke="#DEA123"
          stroke-width=".5"
        >
        </circle>
        <circle
          cx="46"
          cy="6"
          r="6"
          fill="#27C93F"
          stroke="#1AAB29"
          stroke-width=".5"
        >
        </circle>
      </g>
    </svg>
  );
}
function Examples({ browser }: Prop) {
  return (
    <section class="examples">
      <p class="example-copy">
        Effortlessly access pre-optimized NPM modules as importmaps & ESM,
        directly in the browser at unmatched scale.
      </p>

      <article class="example">
        <jspm-packages-render-blocks>
          <jspm-packages-examples-render-block-tabs>
          </jspm-packages-examples-render-block-tabs>
          <jspm-packages-examples-render-block-tabs-content>
            <jspm-packages-render-block
              class={`${EXAMPLES_RENDER_TAB} active`}
            >
              <jspm-packages-examples-render-domtree>
                <figure id="domtree" />
              </jspm-packages-examples-render-domtree>
            </jspm-packages-render-block>
            <jspm-packages-render-block
              class={`${EXAMPLES_RENDER_TAB}`}
            >
              <jspm-packages-examples-render-html-browser>
                <iframe
                  frameborder="0"
                  margin="0"
                  padding="0"
                  borderStyle="none"
                  height="100%"
                  width="100%"
                  marginBottom="-5px"
                  overflow="scroll"
                >
                </iframe>
              </jspm-packages-examples-render-html-browser>
            </jspm-packages-render-block>
          </jspm-packages-examples-render-block-tabs-content>
        </jspm-packages-render-blocks>
        <jspm-packages-code-blocks>
          <jspm-packages-examples-code-block-tabs>
          </jspm-packages-examples-code-block-tabs>
          <jspm-packages-examples-code-block-tabs-content>
            <jspm-packages-code-block
              class={`${EXAMPLES_CODE_TAB} active`}
            >
              <jspm-packages-browser-control>
                <BrowserControl />
              </jspm-packages-browser-control>
              <jspm-packages-examples-source-code-html-browser>
                <pre>
      <code class="language-markup">{browser?.input}</code>
                </pre>
              </jspm-packages-examples-source-code-html-browser>
            </jspm-packages-code-block>

            <jspm-packages-code-block
              class={EXAMPLES_CODE_TAB}
            >
              <jspm-packages-browser-control>
                <BrowserControl />
              </jspm-packages-browser-control>

              <jspm-packages-examples-generated-code-html-browser>
                <pre>
                <code class="language-markup">{browser?.output}</code>
                </pre>
              </jspm-packages-examples-generated-code-html-browser>
            </jspm-packages-code-block>

            <jspm-packages-code-block
              class={EXAMPLES_CODE_TAB}
            >
              <jspm-packages-browser-control>
                <BrowserControl />
              </jspm-packages-browser-control>

              <jspm-packages-examples-generated-code-importmap-browser>
                <pre>
                <code class="language-json">{{}}</code>
                </pre>
              </jspm-packages-examples-generated-code-importmap-browser>
            </jspm-packages-code-block>
          </jspm-packages-examples-code-block-tabs-content>
        </jspm-packages-code-blocks>
      </article>
    </section>
  );
}

export { Examples };

export type { Prop as ExamplesProp };
