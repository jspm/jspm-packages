/** @jsx h */
import { h } from "nano-jsx";
import { Seperator } from "@jspm/packages/separator";

function Aside(
  {
    license,
    downloads,
    updated,
    features,
    created,
    links,
    maintainers,
  },
) {
  return (
    <jspm-aside>
      <aside>
        <jspm-created>
          <h3>Created</h3>
          <p>{created}</p>
        </jspm-created>
        <jspm-weekly-updated>
          <h3>Updated</h3>
          <span>{updated}</span>
        </jspm-weekly-updated>
        <jspm-weekly-downloads>
          <h3>Downloads (weekly)</h3>
          <span>{downloads}</span>
        </jspm-weekly-downloads>
        {features && (
          <jspm-features>
            <h3>Features</h3>
            <ul>
              {Object.entries(features).map(([feature, supported]) => (
                <li data-feature-supported={supported}>{feature}</li>
              ))}
            </ul>
          </jspm-features>
        )}
        <Seperator />
        <h3>Collaborators</h3>
        <jspm-maintainers>
          {maintainers.map(({ name, email }) => (
            <a href={`https://www.github.com/${name}`}>
              <jspm-maintainer>
                <figure>
                  <img src={`https://unavatar.io/${email}`} alt={name} />
                </figure>
              </jspm-maintainer>
            </a>
          ))}
        </jspm-maintainers>
      </aside>
    </jspm-aside>
  );
}

export { Aside };
