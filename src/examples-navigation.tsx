/** @jsx h */
import { h } from "nano-jsx";

type Prop = {
  activate: (event: MouseEvent) => void;
};

function ExamplesNavigation({ activate }: Prop) {
  return (
    <aside>
      <ul>
        <li data-href="sandbox-input" onClick={activate}>Input Source</li>
        <li data-href="sandbox-output" onClick={activate}>Output Source</li>
        <li data-href="sandbox-render-importmap" onClick={activate}>Importmap</li>
        <li data-href="sandbox-render-html" onClick={activate}>Render</li>
      </ul>
    </aside>
  );
}

export { ExamplesNavigation };
export type { Prop as ExamplesNavigationProp };
