/** @jsx h */
import nano, { h } from "nano-jsx";
import { Readme } from "@jspm/packages/readme";
import { Aside } from "@jspm/packages/aside";
import { Header } from "@jspm/packages/header";
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
      </Helmet>
    </jspm-package>
  );
}

export { Package };
