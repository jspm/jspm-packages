/** @jsx h */
import nano, { h } from "nano-jsx";
import { Seperator } from "@jspm/packages/separator";
// import { Exports } from "./exports.js";

const { Helmet } = nano;

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
        {
          /* <jspm-aside-exports
          data-exports={JSON.stringify(exports)}
          data-name={name}
          data-version={version}
        >
          <Exports exports={exports} name={name} version={version} />
        </jspm-aside-exports> */
        }
        <jspm-created>
          <h3>Created</h3>
          <span>{created}</span>
        </jspm-created>
        <jspm-weekly-updated>
          <h3>Updated</h3>
          <span>{updated}</span>
        </jspm-weekly-updated>
        <jspm-weekly-downloads>
          <h3>Downloads (weekly)</h3>
          <span>{downloads}</span>
        </jspm-weekly-downloads>
        {features && <jspm-features>
          <h3>Features</h3>
          <ul>
            {Object.entries(features).map(([feature, supported]) => (
              <li data-feature-supported={supported}>{feature}</li>
            ))}
          </ul>
        </jspm-features>}
        <jspm-license>
          <h3>License</h3>
          <span>{license}</span>
        </jspm-license>
        <Seperator />
        {links && <jspm-links>
          <h3>Links</h3>
          {Object.entries(links).map(([text, link]) =>
            link && (
              <jspm-link>
                <h5>{text}</h5>
                <a href={link}>{link}</a>
              </jspm-link>
            )
          )}
        </jspm-links>}
        <h3>Collaborators</h3>
        <jspm-maintainers>
          {maintainers.map(({ name, email }) => (
            <a href={`https://www.github.com/${name}`}>
              <jspm-maintainer>
                <figure>
                  <img src={`https://unavatar.io/${email}`} />
                </figure>
                {name}
              </jspm-maintainer>
            </a>
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
          jspm-created, jspm-weekly-updated, jspm-weekly-downloads, jspm-license{
            display: flex;
            align-items: center;
            gap: 15px;
            justify-content: normal;
          }
          jspm-maintainers {
            display: flex;
            flex-wrap: wrap;
            gap: 1rem;
          }
          jspm-maintainer {
            text-align: center;
          }
          jspm-maintainer figure{
            width: 80px;
            display: block;
            margin: 0;
          }
          jspm-maintainer figure img{
            width: 100%;
            display: block;
          }
          jspm-link{
            display: flex;
          }
          jspm-link h5{
            margin: 0 15px 0 0;
          }

          @media(min-width: 810px) {
            jspm-created, jspm-weekly-updated, jspm-weekly-downloads, jspm-license{
              justify-content: flex-end;
            }
            
            jspm-features{
              display: flex;
              justify-content: flex-end;
              flex-wrap: nowrap;
              align-items: flex-end;
              flex-direction: column;
            }
          }
          `}
        </style>
      </Helmet>
    </jspm-aside>
  );
}

export { Aside };
