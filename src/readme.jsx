import { h, Helmet } from "nano-jsx";

function Readme({__html}) {
  return (
    <jspm-package-readme>
      <div innerHTML={{ __dangerousHtml: __html }} />
      <Helmet>
        <style data-page-name="jspm-package-readme">
          {`
            jspm-package-readme img {
              max-width: 100%;
            }
          `}
        </style>
      </Helmet>
    </jspm-package-readme>
  );
}

export { Readme };
