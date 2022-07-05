/** @jsx h */

import { Fragment, Helmet, h } from "nano-jsx";
import { Readme } from "@jspm/packages/readme";
import { Aside } from "@jspm/packages/aside";
import { Header } from "@jspm/packages/header";
import { Hero } from "@jspm/packages/hero";
import { ImportMapDialog } from "@jspm/packages/importmap-dialog";
import { PackageExports } from "@jspm/packages/package-exports";

import type { Maintainer, ExportsTarget } from "@jspm/packages/types";

type ExportsTarget =
  | string
  | null
  | { [condition: string]: ExportsTarget }
  | ExportsTarget[];

type Prop = {
  created: string;
  dependencies: Record<string, string>;
  description: string;
  downloads: string;
  exports: ExportsTarget | Record<string, ExportsTarget>;
  features: Record<string, boolean>;
  files: string[];
  keywords: string[];
  license: string;
  links: { homepage: string; repository: string; issues: string; npm: string };
  maintainers: Maintainer[];
  name: string;
  readme: string;
  score: {
    final: number;
    detail: {
      quality: number;
      popularity: number;
      maintenance: number;
    };
  };
  type: "commonjs" | "module";
  types: string;
  updated: string;
  updatedTime: string;
  version: string;
  versions: string[];
};

function Package({
  created,
  dependencies,
  description,
  downloads,
  exports,
  features,
  files,
  keywords,
  license,
  links,
  maintainers,
  name,
  readme,
  score,
  type,
  types,
  updated,
  updatedTime,
  version,
  versions,
}: Prop) {
  return (
    <Fragment>
      <jspm-packages-importmap-dialog>
        <ImportMapDialog />
      </jspm-packages-importmap-dialog>
      <jspm-packages-header>
        <Header search />
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
          links={links}
          updatedTime={updatedTime}
          score={score}
        />
      </jspm-packages-hero>
      <section>
        <aside class="secondary-aside">
          {keywords && (
            <div class="keywords">
              <h3>Keywords</h3>
              <ul>
                {keywords.map((keyword) => (
                  <li>
                    <a href={`/search?keyword=${keyword}`}>#{keyword}</a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {dependencies && Object.entries(dependencies).length > 0 && (
            <div>
              <h3>Dependencies</h3>
              <ul>
                {Object.entries(dependencies).map(([dependency, version]) => (
                  <li>
                    <a href={`/package/${dependency}`}>{dependency}</a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
        <main>
          <jspm-packages-package-exports
            data-name={name}
            data-version={version}
          >
            {/* <Exports exports={exports} name={name} version={version} selectedDeps={selectedDeps} toggleExportSelection={toggleExportSelection} /> */}
            <PackageExports name={name} version={version} exports={exports} />
          </jspm-packages-package-exports>
          <jspm-packages-readme>
            <Readme __html={readme} />
          </jspm-packages-readme>
        </main>
        <jspm-packages-aside>
          <Aside
            created={created}
            updated={updated}
            dependencies={dependencies}
            downloads={downloads}
            version={version}
            versions={versions}
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
      </section>
      <Helmet>
        <title>
          JSPM &ndash; {name}@{version}
        </title>
        <meta name="description" content={description} />
      </Helmet>
    </Fragment>
  );
}

export { Package };
