import { h } from "nano-jsx";

function Readme({__html}) {
  return (
    <jspm-package-readme>
      <div innerHTML={{ __dangerousHtml: __html }} />
    </jspm-package-readme>
  );
}

export { Readme };
