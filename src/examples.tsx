/** @jsx h */
import { Fragment, h } from "nano-jsx";

type Prop = {
  browser?: {
    input: string;
    output: string;
  };
  sandboxActiveTab?: "nft" | "render";
};

function Examples({ browser, sandboxActiveTab = "nft" }: Prop) {
  return (
    <section class="examples">
      <p class="example-copy">
        Effortlessly access pre-optimized NPM modules as importmaps & ESM,
        directly in the browser at unmatched scale.
      </p>
      <aside>
        <ul>
          <li>Overview</li>
          <li>Render</li>
          <li>Source</li>
        </ul>
      </aside>
      <article class="example">
        <jspm-packages-code-blocks>
          <jspm-packages-code-block>
            <jspm-packages-browser-control>
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
            </jspm-packages-browser-control>
            <jspm-packages-example-browser-output>
              <pre>
                <code class="language-markup">{browser?.output}</code>
              </pre>
            </jspm-packages-example-browser-output>
          </jspm-packages-code-block>

          <jspm-packages-code-block class="high">
            <jspm-packages-browser-control>
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
            </jspm-packages-browser-control>
            <jspm-packages-example-browser-input>
              <pre>
                <code class="language-markup">{browser?.input}</code>
              </pre>
            </jspm-packages-example-browser-input>
          </jspm-packages-code-block>
        </jspm-packages-code-blocks>
        <jspm-packages-generator-button>
          <button></button>
        </jspm-packages-generator-button>

        <jspm-packages-example-render id="container">
          <section id="domtree">
          </section>
          <iframe
            frameborder="0"
            margin="0"
            padding="0"
            borderStyle="none"
            height="100%"
            width="100%"
            marginBottom="-5px"
            overflow="scroll"
          />
          {
            /*  <jspm-packages-tabs>
            {sandboxActiveTab === "nft" && (
              <jspm-packages-tab>
                <section id="domtree">
                </section>
              </jspm-packages-tab>
            )}
            {sandboxActiveTab === "nft" && (
              <jspm-packages-tab>
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
              </jspm-packages-tab>
            )}
          </jspm-packages-tabs> */
          }
        </jspm-packages-example-render>
      </article>
    </section>
  );
}

export { Examples };

export type { Prop as ExamplesProp };
