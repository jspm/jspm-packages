/** @jsx h */
import { h } from "nano-jsx";

function Readme({ __html }) {
  return (
    <jspm-readme>
      <div innerHTML={{ __dangerousHtml: __html }} />
    </jspm-readme>
  );
}

export { Readme };
