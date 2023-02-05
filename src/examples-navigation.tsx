/** @jsx h */
import { h } from "nano-jsx";

type Prop = {
  activate: (event: MouseEvent) => void;
};

function ExamplesNavigation({ activate }: Prop) {
  return (
    <aside>
      <ul>
        <li id="sandbox-input" onClick={activate}>Input Source</li>
        <li id="sandbox-output" onClick={activate}>Output Source</li>
        <li id="sandbox-render-html" onClick={activate}>Render</li>
        <li id="sandbox-render-importmap" onClick={activate}>Importmap</li>
      </ul>
    </aside>
  );
}

export { ExamplesNavigation };
export type { Prop as ExamplesNavigationProp };
