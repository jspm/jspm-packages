import { Component, h, Helmet } from "nano-jsx";

function getCleanPath(path) {
  if (path === ".") {
    return "";
  }
  if (path.startsWith("./")) {
    return path.slice(1);
  }
  return path;
}

function Exports(
  { exports, name, version, importMaps, getImportMap },
) {
  return (
    <jspm-package-exports>
      {Object.entries(exports).map((
        [key, value],
      ) =>
        key.endsWith("!cjs") || key === "default"
          ? false
          : (
            <jspm-package-exports-entry>
              <details
                data-subpath={key}
                data-dependency={`${name}@${version}${getCleanPath(key)}`}
                onClick={() => {
                  getImportMap(`${name}@${version}${getCleanPath(key)}`);
                }}
              >
                <summary>
                  <ExportsKey key={key} name={name} version={version} />
                </summary>
                <ExportsValue
                  key={key}
                  value={value}
                  name={name}
                  version={version}
                  getImportMap={getImportMap}
                  importMaps={importMaps}
                  map={importMaps[`${name}@${version}${getCleanPath(key)}`]}
                />
              </details>
            </jspm-package-exports-entry>
          )
      )}
      <Helmet>
        <style data-page="package-details">
          {`
            jspm-package-exports-entry {
                display: flex;
                display: block;
                padding-left: 10px;
            }
            jspm-package-exports-target{
                margin-left: 20px;
                display: block;
            }
            
            `}
        </style>
      </Helmet>
    </jspm-package-exports>
  );
}

function ExportsValue({ key, value, name, version, getImportMap, importMaps, map }) {
  if (typeof value === "string") {
    // const map = importMaps[`${name}@${version}${getCleanPath(key)}`];
    return (
      <jspm-package-exports-target>
        {value}
        {map}
      </jspm-package-exports-target>
    );
  } else if (Array.isArray(value)) {
    return value.map((target) => (
      <jspm-package-exports-target>{target}</jspm-package-exports-target>
    ));
  }
  return (
    <Exports
      exports={value}
      name={name}
      version={version}
      getImportMap={getImportMap}
      importMaps={importMaps}
    />
  );
}

function ExportsKey({ key, name, version }) {
  return (
    <jspm-package-exports-key>
      {key}
    </jspm-package-exports-key>
  );
}
class ExportsContainer extends Component {
  constructor(props) {
    super(props);
  }

  importMaps = {};

  getImportMap = async (dependency) => {
    if (typeof document !== "undefined") {
      // const resolvedKey = getResolvedKey({ key, name, version });
      // console.log(resolvedKey);
      //consol.log(this.props);
      const { Generator } = await import("@jspm/generator");
      const generator = new Generator({
        env: ["production", "browser", "module"],
      });
      await generator.install(dependency);
      const importMap = JSON.stringify(generator.getMap(), null, 2);
      console.log(importMap);
      if (importMap) {
        this.importMaps = { ...this.importMaps, [dependency]: importMap };
        this.update();
      }
    }
  };

  render() {
    const { exports, name, version } = this.props;
    return (
      <div>
        {JSON.stringify(this.importMaps)}
        <Exports
          exports={exports}
          name={name}
          version={version}
          getImportMap={this.getImportMap}
          importMaps={this.importMaps}
        />
      </div>
    );
  }
}

class Exports2 extends Component {
  checked = true;

  toggle = (e) => {
    this.checked = !this.checked;
    this.update();
  };

  render() {
    const Text = this.checked ? <p>is checked</p> : null;

    return (
      <div>
        <input
          id="checkbox"
          type="checkbox"
          {...(this.checked ? { checked: true } : {})}
          onClick={this.toggle}
        />
        <Text />
      </div>
    );
  }
}
export { ExportsContainer };
