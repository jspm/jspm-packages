/** @jsx h */
import nano, { h } from "nano-jsx";
import { Readme } from "@jspm/packages/readme";
import { Aside } from "@jspm/packages/aside";
import { Header } from "@jspm/packages/header";
import { Footer } from "@jspm/packages/footer";
import { ImportMapDialog } from "@jspm/packages/importmap-dialog";

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
    <jspm-package data-meta={JSON.stringify(import.meta)}>
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
      <jspm-package-hero>
        <jspm-highlight>
          <jspm-package-title>
            <h2>{name}</h2>
            <h3>v{version}</h3>
          </jspm-package-title>
          <jspm-summary>
            <span>{version}</span>
            <span>Published {updated}</span>
            {types && <img height="20" src="/icon-typescript-logo.svg" />}
          </jspm-summary>
          <p>{description}</p>
        </jspm-highlight>
      </jspm-package-hero>
      <jspm-content>
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
                        data-selected={addedToImportMap}
                        type="button"
                        onClick={toggleExportSelection}
                        value={packageExport}
                      >
                        {addedToImportMap
                          ? "− Remove from importmap"
                          : "+ Add to importmap"}
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

      <Helmet>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/PrismJS/prism-themes@master/themes/prism-gruvbox-light.css"
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
          grid-template-columns: 1fr 0.618fr;
          grid-gap: 1rem;
        }
        
        jspm-readme {
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
        jspm-summary{
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 15px;
        }
        jspm-package-title{
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 15px;
        }
        
        jspm-name h1 a {
          color: black;
        }

        @media(max-width: 767px) {
          jspm-content {
            justify-content: space-between;
            grid-template-columns: 1fr;
          }

          jspm-readme {
            width: 100%;
          }
        }
        jspm-package-exports {
          display: block;
          max-height: 500px;
          overflow: scroll;
        }

        jspm-package-exports h4 {
          position: sticky;
          top: 0;
          background: white;
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
          padding: 5px 0;
          margin: 10px 0;
        }
        jspm-package-exports ul li button{
          color: black;
          padding: 10px;
          display: inline-block;
          border: none;
          min-width: 155px;
          font-family: "Bebas Neue", cursive;
        }
        jspm-package-exports ul li button[data-selected='false']{
          background: var(--dl-color-primary-js-primary);
        }
        `}
        </style>
      </Helmet>
    </jspm-package>
  );
}

export { Package };
