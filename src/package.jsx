/** @jsx h */
import nano, { h } from "nano-jsx";
import { Readme } from "./readme.js";
import { Aside } from "./aside.js";
import { Header } from "./header.js";
import { Footer } from "./footer.js";
import {ImportMapDialog} from './importmap-dialog.js';

const { Helmet } = nano;

function Package({
  name,
  description,
  keywords,
  version,
  homepage,
  license,
  files,
  exports,
  readme,
  generatorHash,
  selectedDeps,
  downloads,
  created,
  updated,
  type,
  types,
  features,
  links,
  maintainers,
  toggleExportSelection,
}) {
  return (
    <jspm-package>
      <ImportMapDialog generatorHash={generatorHash} dependencies={selectedDeps} />
      <Header generatorHash={generatorHash} dependencies={selectedDeps} />
      <jspm-package-hero
        data-exports={JSON.stringify(exports)}
        data-name={name}
        data-version={version}
        data-description={description}
        data-updated={updated}
        data-types={types}
      >
        <jspm-highlight>
          <h2>{name}</h2>
          <div>
            <span>{version}</span>•<span>Published {updated}</span>
          </div>
          <div></div>
          <h3>{description}</h3>
        </jspm-highlight>
      </jspm-package-hero>
      <jspm-content>
        <main>
          <table>
            <thead>
              <tr colspan="2">
                <th>Package exports</th>
              </tr>
            </thead>
            <tbody>
              {exports.map((subpath) => (
                <tr>
                  <td>{`${name}${subpath.slice(1)}`}</td>
                  <td>
                    {toggleExportSelection && (
                      <button
                        type="button"
                        class="code"
                        onClick={toggleExportSelection}
                        value={`${name}@${version}${subpath.slice(1)}`}
                      >
                        + Add to importmap
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Readme __html={readme} />
        </main>
        <Aside
          created={created}
          updated={updated}
          downloads={downloads}
          version={version}
          name={name}
          license={license}
          files={files}
          exports={exports}
          keywords={keywords}
          type={type}
          types={types}
          features={features}
          links={links}
          maintainers={maintainers}
        />
      </jspm-content>

      <Footer />

      <Helmet>
        <link
          rel="stylesheet"
          href="https://ga.jspm.io/npm:prismjs@1.25.0/themes/prism.css"
        />
        <style data-page="package-details">
          {`
          jspm-package{
            display: block;
            max-width: 1140px;
            margin: 0 auto;
          }
          jspm-highlight{
            text-align: center;
          }
          jspm-highlight h2{
            font-family: 'Source Sans Pro', sans-serif;
          }
        jspm-content {
          display: grid;
          grid-template-columns: minmax(800px, 1fr) minmax(350px, 1fr);
          grid-gap: 1rem;
        }
        
        jspm-readme {
          min-width: 800px;
          display: block;
          padding: var(--dl-space-space-oneandhalfunits);
        }
        
        jspm-aside {
          padding: var(--dl-space-space-oneandhalfunits);
        }
        
        jspm-name,
        jspm-version,
        jspm-description,
        jspm-license {
          display: block;
        }
        
        jspm-name h1 {
          font-family: "Major Mono Display", monospace;
          font-size: var(--step-5);
        }
        
        jspm-name h1 a {
          color: black;
        }

        @media(max-width: 767px) {
          jspm-content {
            justify-content: space-between;
          }

          jspm-readme {
            width: 100%;
          }
        }
        `}
        </style>
      </Helmet>
    </jspm-package>
  );
}

export { Package };
