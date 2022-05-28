/** @jsx h */
import nano, { Fragment, h } from "nano-jsx";
import { Readme } from "@jspm/packages/readme";
import { Aside } from "@jspm/packages/aside";
import { Header } from "@jspm/packages/header";
import { Hero } from "@jspm/packages/hero";
import { ImportMapDialog } from "@jspm/packages/importmap-dialog";
import { PackageExports } from "@jspm/packages/package-exports";

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
    <Fragment>
      <jspm-packages-importmap-dialog>
        <ImportMapDialog />
      </jspm-packages-importmap-dialog>
      <jspm-packages-header>
        <Header
          generatorHash={generatorHash}
          dependencies={selectedDeps}
          open={openImportmapDialog}
          toggleImportmapDialog={toggleImportmapDialog}
        />
      </jspm-packages-header>
      <jspm-packages-hero>
        <Hero
          name={name}
          version={version}
          versions={versions}
          license={license}
          updated={updated}
          types={types}
          description={description}
        />
      </jspm-packages-hero>
      <main>
        <jspm-packages-package-exports data-name={name} data-version={version}>
          {/* <Exports exports={exports} name={name} version={version} selectedDeps={selectedDeps} toggleExportSelection={toggleExportSelection} /> */}
          <PackageExports
            name={name}
            version={version}
            exports={exports}
          />
        </jspm-packages-package-exports>
        <jspm-packages-readme>
          <Readme __html={readme} />
        </jspm-packages-readme>
      </main>
      <jspm-packages-aside>
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
      </jspm-packages-aside>

      <Helmet>
        <title>JSPM &ndash; {name}@{version}</title>
        <meta name="description" content={description} />
      </Helmet>
    </Fragment>
  );
}

export { Package };
