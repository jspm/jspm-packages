/** @jsx h */

import { h, Fragment } from "nano-jsx";

import type { Maintainer } from "@jspm/packages/types";

type Prop = {
  created: string;
  dependencies: Record<string, string>;
  downloads: string;
  features: Record<string, boolean>;
  keywords: string[];
  license: string;
  links: { homepage: string; repository: string; issues: string };
  maintainers: Maintainer[];
  updated: string;
};

function Aside({
  created,
  dependencies,
  downloads,
  features,
  keywords,
  license,
  links,
  maintainers,
  updated,
}: Prop) {
  return (
    <aside>
      <h3>Created</h3>
      <p>{created}</p>
      <h3>Updated</h3>
      <span>{updated}</span>
      <h3>Downloads (weekly)</h3>
      <span>{downloads}</span>
      {features && (
        <Fragment>
          <h3>Features</h3>
          <ul>
            {Object.entries(features).map(([feature, supported]) => (
              <li data-feature-supported={supported}>{feature}</li>
            ))}
          </ul>
        </Fragment>
      )}
      <h3>Collaborators</h3>
      {maintainers.map(({ name, email }) => (
        <a href={`https://www.github.com/${name}`}>
          <figure>
            <img src={`https://unavatar.io/${email}`} alt={name} />
          </figure>
        </a>
      ))}

      {dependencies && (
        <Fragment>
          <h3>Dependencies</h3>
          <ul>
            {Object.entries(dependencies).map(([dependency, version]) => (
              <li>
                <a href={`/package/${dependency}`}>{dependency}</a>
              </li>
            ))}
          </ul>
        </Fragment>
      )}

      {keywords && (
        <Fragment>
          <h3>Keywords</h3>
          <ul>
            {keywords.map((keyword) => (
              <li>
                <a href={`/search?keyword=${keyword}`}>#{keyword}</a>
              </li>
            ))}
          </ul>
        </Fragment>
      )}
    </aside>
  );
}

export { Aside };
