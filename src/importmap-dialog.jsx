/** @jsx h */
import nano, { h } from "nano-jsx";

const { Helmet } = nano;

function ImportMapDialog({ generatorHash, dependencies }) {
  return (
    <jspm-importmap-dialog>
      <dialog open>
        {generatorHash && (
          <a
            target="_blank"
            href={`https://generator.jspm.io/${generatorHash}`}
          >
            JSPM Generator
          </a>
        )}
        {dependencies?.length > 0 && (
          <ul>{dependencies.map((dependency) => <li>{dependency}</li>)}</ul>
        )}
      </dialog>
      <Helmet>
        <style data-component-name="jspm-importmap-dialog">
          {`
          jspm-importmap-dialog dialog  {
              min-height: 100vh;
              min-width: 350px;
              background: white;
          }
          `}
        </style>
      </Helmet>
    </jspm-importmap-dialog>
  );
}

export { ImportMapDialog };
