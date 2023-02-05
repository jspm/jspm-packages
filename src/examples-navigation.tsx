/** @jsx h */
import { h } from "nano-jsx";

type Prop = {
  activate: (event: MouseEvent) => void;
};

function ExamplesNavigation({ activate }: Prop) {
  return (
    <aside>
      <ul>
        <li id="sandbox-nft" onClick={activate}>Overview</li>
        <li id="sandbox-render" onClick={activate}>Render</li>
        <li id="sandbox-code" onClick={activate}>Source</li>
      </ul>
      <figure id="domtree" />
    </aside>
  );
}

export { ExamplesNavigation };
export type { Prop as ExamplesNavigationProp };