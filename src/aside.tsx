/** @jsx h */

import { h } from "nano-jsx";

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
      <div>
        <h3>Created</h3>
        <p>{created}</p>
      </div>
      <div>
        <h3>Updated</h3>
        <span>{updated}</span>
      </div>
      <div>
        <h3>Downloads (weekly)</h3>
        <span>{downloads}</span>
      </div>
      {features && (
        <div>
          <h3>Features</h3>
          <ul>
            {Object.entries(features).map(([feature, supported]) => (
              <li data-feature-supported={supported}>{feature}</li>
            ))}
          </ul>
        </div>
      )}
      <div class="maintainers">
        <h3>Collaborators</h3>
        <ul>
          {maintainers.map(({ name, email }) => (
            <li>
              <a href={`https://www.github.com/${name}`}>
                <figure>
                  <img src={`https://unavatar.io/${email}`} alt={name} />
                </figure>
              </a>
            </li>
          ))}
        </ul>
      </div>

    </aside>
  );
}

export { Aside };
