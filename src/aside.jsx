/** @jsx h */
import { h, Helmet } from "nano-jsx";
import { Seperator } from "./separator.js";
import { Exports } from "./exports.js";

function Aside(
  {
    license,
    name,
    version,
    exports,
    downloads,
    updated,
    type,
    types,
    features,
    created,
    links,
    maintainers,
  },
) {
  return (
    <jspm-aside>
      <aside>
        {/* <jspm-aside-exports
          data-exports={JSON.stringify(exports)}
          data-name={name}
          data-version={version}
        >
          <Exports exports={exports} name={name} version={version} />
        </jspm-aside-exports> */}
        <jspm-created>
          <h3>Created</h3>
          {created}
        </jspm-created>
        <jspm-weekly-updated>
          <h3>Updated</h3>
          {updated}
        </jspm-weekly-updated>
        <jspm-weekly-downloads>
          <h3>Downloads (weekly)</h3>
          {downloads}
        </jspm-weekly-downloads>
        <jspm-features>
          <h3>Features</h3>
          {Object.entries(features).map(([feature, supported]) => (
            <ul>
              <li data-feature-supported={supported}>{feature}</li>
            </ul>
          ))}
        </jspm-features>
        <div>
          <h3>License</h3>
          <jspm-license>{license}</jspm-license>
          <Seperator />
        </div>
        <jspm-links>
          <h3>Links</h3>
          {Object.entries(links).map(([text, link]) =>
            link && (
              <jspm-link>
                <h5>{text}</h5>
                <a href={link}>{link}</a>
              </jspm-link>
            )
          )}
        </jspm-links>
        <jspm-maintainers>
          <h3>Collaborators</h3>
          {maintainers.map(({ name, email }) => (
            <jspm-maintainer>
              <figure>
                <img src={`https://unavatar.io/${email}`} />
              </figure>
              {name}
            </jspm-maintainer>
          ))}
        </jspm-maintainers>
      </aside>

      <Helmet>
        <style data-component-name="jspm-aside">
          {`
          jspm-features li{
            padding-inline-start: 1ch;
          }
          jspm-features li[data-feature-supported="true"]{
            list-style-type: '✔';
          }
          jspm-features li[data-feature-supported="false"]{
            list-style-type: '✖';
          }
          jspm-maintainer {
            display: flex;
            justify-content: space-between;
            flex-wrap: nowrap;
            align-content: center;
            align-items: center;
          }
          jspm-maintainer figure{
            width: 80px;
            display: inline-block;
          }
          jspm-maintainer figure img{
            width: 100%;
            display: block;
          }
          `}
        </style>
      </Helmet>
    </jspm-aside>
  );
}

export { Aside };
