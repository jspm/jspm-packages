/** @jsx h */
import nano, { h } from "nano-jsx";
import { Readme } from "./readme.js";
import { Aside } from "./aside.js";
import { Header } from "./header.js";
import { Footer } from "./footer.js";
import { ImportMapDialog } from "./importmap-dialog.js";
import { Seperator } from "./separator.js";

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
  openImportmapDialog,
  toggleImportmapDialog,
}) {
  return (
    <jspm-package>
      <ImportMapDialog
        generatorHash={generatorHash}
        dependencies={selectedDeps}
        open={openImportmapDialog}
        toggleImportmapDialog={toggleImportmapDialog}
        toggleExportSelection={toggleExportSelection}
      />
      <Header
        generatorHash={generatorHash}
        dependencies={selectedDeps}
        open={openImportmapDialog}
        toggleImportmapDialog={toggleImportmapDialog}
      />
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
          <Seperator />
          <div>
            <span>{version}</span>•<span>Published {updated}</span>
          </div>
          <div></div>
          <h3>{description}</h3>
        </jspm-highlight>
      </jspm-package-hero>
      <jspm-content class="content">
        <main>
          <jspm-package-exports>
            <h4>Package exports</h4>
            <ul class="code">
              {exports.map((subpath) => {
                const packageExport = `${name}@${version}${subpath.slice(1)}`;
                const addedToImportMap = selectedDeps?.includes(packageExport);
                return (
                  <li>
                    {`${name}${subpath.slice(1)}`}
                    {toggleExportSelection && (
                      <button
                        type="button"
                        onClick={toggleExportSelection}
                        value={packageExport}
                      >
                        {addedToImportMap
                          ? "−"
                          : "+"}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </jspm-package-exports>
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
            padding: 0 6px;
          }
          jspm-highlight{
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          jspm-highlight h2{
            font-family: 'Source Sans Pro', sans-serif;
            margin-bottom: 6px;
          }
        
        .content {
          display: flex;
          gap: 1rem;
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
        jspm-license,
        jspm-content {
          display: block;
        }
        
        jspm-name h1 {
          font-family: "Major Mono Display", monospace;
          font-size: var(--step-5);
        }
        
        jspm-name h1 a {
          color: black;
        }

        jspm-package-exports ul{
          margin: 0;
          padding: 0;
        }
        jspm-package-exports ul li{
          display: flex;
          align-content: center;
          justify-content: space-between;
          align-items: center;
          padding: 5px;
          margin: 10px;
          border-bottom: 1px dotted #ccc;
        }
        jspm-package-exports ul li button{
          background: var(--dl-color-primary-js-primary);
          color: black;
          padding: 4px 8px;
          display: inline-block;
          font-family: "Bebas Neue", cursive;
          border-style: none;
        }

        @media(max-width: 767px) {
          .content {
            flex-wrap: wrap;
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
