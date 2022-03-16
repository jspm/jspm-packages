/** @jsx h */
import nano, { h } from "nano-jsx";

const { Helmet } = nano;

function fromPkgStr(pkg) {
  const versionIndex = pkg.indexOf("@", 1);
  const name = pkg.slice(0, versionIndex);
  let subpathIndex = pkg.indexOf("/", versionIndex);
  if (subpathIndex === -1) {
    subpathIndex = pkg.length;
  }
  const version = pkg.slice(versionIndex + 1, subpathIndex);
  const subpath = "." + pkg.slice(name.length + version.length + 1);
  return { name, version, subpath };
}

function ImportMapDialog({ generatorHash = "", dependencies = [] }) {
  const shouldOpen = dependencies.length > 0;
  const open = shouldOpen ? { open: shouldOpen } : {};
  let map = {};
  dependencies.forEach((dependency) => {
    const { name, version, subpath } = fromPkgStr(dependency);
    if (typeof map[name] === "undefined") {
      map[name] = { [version]: [] };
    }
    if (typeof map[name][version] === "undefined") {
      map[name][version] = [];
    }
    map[name][version] = [...map[name][version], subpath];
  });
  return (
    <jspm-importmap-dialog>
      <dialog {...open}>
        {
          /* {generatorHash && (
          <a
            target="_blank"
            href={`https://generator.jspm.io/${generatorHash}`}
          >
            JSPM Generator
          </a>
        )} */
        }

        {Object.entries(map).map(([name, versions]) => {
          return (
            <details>
              <summary>{name}</summary>

              {Object.entries(versions).map(([version, subpaths]) => {
                return (
                  <details>
                    <summary>{version}</summary>
                    <ol>
                      {subpaths.map((subpath) => <li>{subpath}</li>)}
                    </ol>
                  </details>
                );
              })}
            </details>
          );
        })}
      </dialog>
      <Helmet>
        <style data-component-name="jspm-importmap-dialog">
          {`
          jspm-importmap-dialog dialog  {
              min-height: 100vh;
              min-width: 350px;
              background: white;
              left: unset;
          }
          `}
        </style>
      </Helmet>
    </jspm-importmap-dialog>
  );
}

export { ImportMapDialog };
