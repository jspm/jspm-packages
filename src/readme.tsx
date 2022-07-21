/** @jsx h */
import { h } from "nano-jsx";

function Readme({ __html }) {
  return <section innerHTML={{ __dangerousHtml: __html }} />;
}

export { Readme };
