/** @jsx h */
import { h } from "nano-jsx";
type Prop = {
  name: string;
  subpaths: string[];
  version: string;
};

function PackageExports({ subpaths, name, version }: Prop) {
  return (
    <section>
      <ul class="code">
        {subpaths.map((subpath) => {
          const subpathName = subpath.slice(1);
          // const packageBase = `${name}@${version}`;
          // const packageExportTarget = `${packageBase}${subpathName}`;
          // const addedToImportMap = selectedDeps?.includes(packageExport);
          // const filePath =
          //   typeof exports[subpath] === "string"
          //     ? exports[subpath].slice(1)
          //     : "";
          // const fileURL = filePath
          //   ? `${NPM_PROVIDER_URL}${packageBase}${filePath}`
          //   : "";
          return (
            <li>
              <span class="export-name">
                {subpathName && <span>{name}</span>}
                <span class="export-subpath">{subpathName || name}</span>
              </span>
              <jspm-packages-package-export-add-to-importmap-toggle
                data-name={name}
                data-version={version}
                data-subpath={subpath}
              ></jspm-packages-package-export-add-to-importmap-toggle>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export { PackageExports };
