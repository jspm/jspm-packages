/** @jsx h */
import nano, { h } from "nano-jsx";

const { Helmet } = nano;

function Readme({ __html }) {
  return (
    <jspm-readme>
      <div innerHTML={{ __dangerousHtml: __html }} />
      <Helmet>
        <style data-component-name="jspm-readme">
          {`
            jspm-readme img {
              max-width: 100%;
            }
          `}
        </style>
      </Helmet>
    </jspm-readme>
  );
}

export { Readme };
