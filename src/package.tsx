/** @jsx h */

import { Fragment, Helmet, h } from "nano-jsx";
import { Readme } from "@jspm/packages/readme";
// import { Aside } from "@jspm/packages/aside";
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
  createdTime: string;
  created: string;
  dependencies: Record<string, string>;
  description: string;
  downloads: string;
  subpaths: string[];
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
  jspmExports: boolean;
};

function Package({
  createdTime,
  created,
  dependencies,
  description,
  downloads,
  subpaths,
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
  jspmExports,
}: Prop) {
  return (
    <Fragment>
      <section>
        <jspm-packages-importmap-dialog>
          <ImportMapDialog />
        </jspm-packages-importmap-dialog>
      </section>
      
      <section id="packages-page">
        <section>
          <jspm-packages-header>
            <Header search />
          </jspm-packages-header>

          <jspm-packages-hero>
            <Hero
              createdTime={createdTime}
              created={created}
              downloads={downloads}
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
              features={features}
            />
          </jspm-packages-hero>
        </section>
        <section>
          <main>
            <details class="package-exports" open>
              <summary>
                <h3>Package Exports</h3>
              </summary>
              <jspm-packages-package-exports
                data-name={name}
                data-version={version}
              >
                <PackageExports
                  name={name}
                  version={version}
                  exports={exports}
                  subpaths={subpaths}
                />
              </jspm-packages-package-exports>
              {jspmExports && (
                <section>
                  <p>
                    This package does not declare an{" "}
                    <a href="https://jspm.org/docs/cdn#exports-field">
                      exports
                    </a>{" "}
                    field, so the exports above have been automatically detected
                    and optimized by <em>JSPM</em> instead. If any package
                    subpath is missing, it is recommended to{" "}
                    <a
                      href={
                        links.issues ||
                        links.repository ||
                        links.homepage ||
                        links.npm
                      }
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                    >
                      post an issue
                    </a>{" "}
                    to the{" "}
                    <a
                      href={links.homepage || links.repository || links.npm}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                    >
                      original package ({name})
                    </a>{" "}
                    to support the "exports" field. If that is not possible,{" "}
                    <a
                      href="https://github.com/jspm/overrides"
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                    >
                      create a JSPM override
                    </a>{" "}
                    to customize the exports field for this package.
                  </p>
                </section>
              )}
            </details>
            <details>
              <summary>
                <h3>Readme</h3>
              </summary>
              <jspm-packages-readme>
                <Readme __html={readme} />
              </jspm-packages-readme>
            </details>
          </main>
          {/* <jspm-packages-aside>
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
        </jspm-packages-aside> */}
        </section>
        <footer>
          <section class="maintainers">
            <h3>Collaborators</h3>
            <ul>
              {maintainers.map(({ name, email }) => (
                <li>
                  <a href={`https://www.github.com/${name}`}>
                    <figure>
                      <img
                        height="75"
                        width="75"
                        src={`https://unavatar.io/${email}`}
                        alt={name}
                        loading="lazy"
                      />
                    </figure>
                  </a>
                </li>
              ))}
            </ul>
          </section>
          {keywords && (
            <section class="keywords">
              <h3>Keywords</h3>
              <ul>
                {keywords.map((keyword) => (
                  <li>
                    <a href={`/search?keyword=${keyword}`}>#{keyword}</a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {dependencies && Object.entries(dependencies).length > 0 && (
            <section>
              <h3>Dependencies</h3>
              <ul>
                {Object.entries(dependencies).map(([dependency, version]) => (
                  <li>
                    <a href={`/package/${dependency}`}>{dependency}</a>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </footer>
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
