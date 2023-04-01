/** @jsx h */
import { h } from "nano-jsx";
import {
  EXAMPLES_RENDER_DOMTREE,
  EXAMPLES_RENDER_HTML_BROWSER,
  EXAMPLES_RENDER_TAB,
} from "#constants";

type Prop = {
  changeRenderBlockTab: (event: MouseEvent) => void;
  examplesRenderBlockActiveTab: string;
  id: string;
};

function ExamplesRenderBlockTabs(
  { changeRenderBlockTab, examplesRenderBlockActiveTab, id }: Prop,
) {
  return (
    <aside>
      <form action="#">
        <ul>
          <li>
            <label for={`${EXAMPLES_RENDER_DOMTREE}${id}`}>DOM Tree</label>
            <input
              onchange={changeRenderBlockTab}
              type="radio"
              name={EXAMPLES_RENDER_TAB}
              value={EXAMPLES_RENDER_DOMTREE}
              id={`${EXAMPLES_RENDER_DOMTREE}${id}`}
              {...(examplesRenderBlockActiveTab ===
                EXAMPLES_RENDER_DOMTREE
              ? { checked: true }
              : {})}
            />
          </li>
          <li>
            <label for={`${EXAMPLES_RENDER_HTML_BROWSER}${id}`}>Render</label>
            <input
              onchange={changeRenderBlockTab}
              type="radio"
              name={EXAMPLES_RENDER_TAB}
              value={EXAMPLES_RENDER_HTML_BROWSER}
              id={`${EXAMPLES_RENDER_HTML_BROWSER}${id}`}
              {...(examplesRenderBlockActiveTab ===
                EXAMPLES_RENDER_HTML_BROWSER
              ? { checked: true }
              : {})}
            />
          </li>
        </ul>
      </form>
    </aside>
  );
}

export { ExamplesRenderBlockTabs };
export type { Prop as ExamplesRenderBlockTabsProp };
