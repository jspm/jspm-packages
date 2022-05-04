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
  versions,
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
  openVersionSelector,
  toggleVersionSelector,
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

            <jspm-package-version>
              <h3>
                <button onClick={toggleVersionSelector}>v{version}</button>
              </h3>
                <ul data-open={openVersionSelector}>
                  {versions?.map((v) => (
                    <li data-active={v === version}>
                      <a href={`/package/${name}@${v}`}>{v}</a>
                    </li>
                  ))}
                </ul>
            </jspm-package-version>
          </jspm-package-title>
          <jspm-summary>
            <span>{license}</span>
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
        <title>JSPM &ndash; {name}@{version}</title>
        <meta name="description" content={description} />
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
            padding: 0 var(--dl-space-space-oneandhalfunits);
          }
          @media(min-width: 768px) {
            jspm-package{
              padding: 0;
            }
          }
          jspm-highlight{
            text-align: center;
          }
          jspm-highlight h2{
            font-family: 'Source Sans Pro', sans-serif;
          }
        
        jspm-readme {
          display: block;
        }
        
        jspm-aside {
          padding: var(--dl-space-space-oneandhalfunits);
        }
        
        jspm-name,
        jspm-version,
        jspm-description {
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
        jspm-package-version h3{
          margin: 0;
        }
        jspm-package-version ul{
          margin: -3px 0 0 0;
          position: absolute;
          background: var(--dl-color-jspm-300);
          z-index: 2;
          list-style: none;
          padding: 0;
          text-align: left;
          line-height: 2rem;
          max-height: 50vh;
          overflow: scroll;
        }
        jspm-package-version ul[data-open="false"]{
          display: none;
        }
        jspm-package-version ul li a {
          display: block;
          padding: 0.25rem 1rem;
          min-width: 124px;
        }
        jspm-package-version ul li a:hover {
          background: var(--dl-color-jspm-400);
        }
        jspm-package-version ul li[data-active="false"]{
          margin: 0;
        }

        /* <select> styles */
        jspm-package-version button, jspm-package-title select {
          /* Reset */
          appearance: none;
          border: 0;
          outline: 0;
          font: inherit;
          /* Personalize */
          height: 3em;
          padding: 0 45px 0 1em;
          background: var(--dl-color-jspm-300) url(icon-arrow-down.png)
              no-repeat right 0.8em center / 1.4em;
          border-radius: 0.25em;
          cursor: pointer;
          background-size: 7%;
        }

        /* <option> colors */
        jspm-package-title select option {
          color: inherit;
          background-color: gray;
        }
        /* Remove focus outline */
        jspm-package-title select:focus {
          outline: none;
        }
        /* Remove IE arrow */
        &::-ms-expand {
          display: none;
        }
        

        jspm-name h1 a {
          color: black;
        }

        jspm-content {
          justify-content: space-between;
          grid-template-columns: 1fr;
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
          margin: 0;
          padding: 1rem 0;
          text-align: center;
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


        @media(min-width: 810px) {
          jspm-content {
            display: grid;
            grid-template-columns: 1fr 0.618fr;
            grid-gap: 1rem;
          }
          
          jspm-readme {
            width: 100%;
          }
          
          jspm-package-exports h4{
            text-align: left;
          }
          
        }
        `}
        </style>
      </Helmet>
    </jspm-package>
  );
}

export { Package };
