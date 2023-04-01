/** @jsx h */
import { h } from "nano-jsx";
import {
  EXAMPLES_CODE_TAB,
  EXAMPLES_GENERATED_CODE_HTML_BROWSER,
  EXAMPLES_GENERATED_CODE_IMPORTMAP_BROWSER,
  EXAMPLES_SOURCE_CODE_HTML_BROWSER,
} from "#constants";

type Prop = {
  changeCodeBlockTab: (event: MouseEvent) => void;
  examplesCodeBlockActiveTab: string;
  id: string;
};

function ExamplesCodeBlockTabs(
  { changeCodeBlockTab, id, examplesCodeBlockActiveTab }: Prop,
) {
  return (
    <aside>
      <form action="#">
        <ul>
          <li>
            <label for={`${EXAMPLES_SOURCE_CODE_HTML_BROWSER}${id}`}>
              source/browser.html
            </label>
            <input
              onchange={changeCodeBlockTab}
              type="radio"
              name={EXAMPLES_CODE_TAB}
              value={EXAMPLES_SOURCE_CODE_HTML_BROWSER}
              id={`${EXAMPLES_SOURCE_CODE_HTML_BROWSER}${id}`}
              {...(examplesCodeBlockActiveTab ===
                  EXAMPLES_SOURCE_CODE_HTML_BROWSER
                ? { checked: true }
                : {})}
            />
          </li>
          <li>
            <label for={`${EXAMPLES_GENERATED_CODE_HTML_BROWSER}${id}`}>
              dist/browser.html
            </label>
            <input
              onchange={changeCodeBlockTab}
              type="radio"
              name={EXAMPLES_CODE_TAB}
              value={EXAMPLES_GENERATED_CODE_HTML_BROWSER}
              id={`${EXAMPLES_GENERATED_CODE_HTML_BROWSER}${id}`}
              {...(examplesCodeBlockActiveTab ===
                  EXAMPLES_GENERATED_CODE_HTML_BROWSER
                ? { checked: true }
                : {})}
            />
          </li>

          <li>
            <label for={`${EXAMPLES_GENERATED_CODE_IMPORTMAP_BROWSER}${id}`}>
              dist/browser.importmap
            </label>
            <input
              onchange={changeCodeBlockTab}
              type="radio"
              name={EXAMPLES_CODE_TAB}
              value={EXAMPLES_GENERATED_CODE_IMPORTMAP_BROWSER}
              id={`${EXAMPLES_GENERATED_CODE_IMPORTMAP_BROWSER}${id}`}
              {...(examplesCodeBlockActiveTab ===
                  EXAMPLES_GENERATED_CODE_IMPORTMAP_BROWSER
                ? { checked: true }
                : {})}
            />
          </li>
        </ul>
      </form>
    </aside>
  );
}

export { ExamplesCodeBlockTabs };
export type { Prop as ExamplesCodeBlockTabsProp };
