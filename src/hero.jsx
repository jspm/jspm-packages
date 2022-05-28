/** @jsx h */
import { Fragment, h } from "nano-jsx";

function Hero(
  { name, version, versions, license, updated, types, description },
) {
  return (
    <Fragment>
      <div>
        <h2>{name}</h2>

        <select value={version} class="package-version-selector">
          {versions?.map((v) => (
            <option data-active={v === version}>
              <a href={`/package/${name}@${v}`}>{v}</a>
            </option>
          ))}
        </select>

        {
          /* <jspm-package-version>
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
      </jspm-package-version> */
        }
      </div>
      <div>
        <span>{license}</span> | <span>Published {updated}</span>
        {types && <img height="20" src="/icon-typescript-logo.svg" />}
      </div>
      <p>{description}</p>
    </Fragment>
  );
}

export { Hero };
