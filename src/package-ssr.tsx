/** @jsx h */

import { h } from "nano-jsx";
import { Package } from "#package";
import type { Maintainer, ExportsTarget } from "#types";

type Prop = {
  created: string;
  createdTime: string;
  dependencies: Record<string, string>;
  description: string;
  downloads: string;
  subpaths: string[];
  exports: ExportsTarget | Record<string, ExportsTarget>;
  features: Record<string, boolean>;
  files: string[];
  keywords: string[];
  license: string;
  links: { homepage: string; repository: string; bugs: string; npm: string };
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

function PackageSSR({
  created,
  createdTime,
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
    <jspm-packages-package data-name={name} data-version={version}>
      <Package
        createdTime={createdTime}
        created={created}
        dependencies={dependencies}
        description={description}
        downloads={downloads}
        subpaths={subpaths}
        exports={exports}
        features={features}
        files={files}
        keywords={keywords}
        license={license}
        links={links}
        maintainers={maintainers}
        name={name}
        readme={readme}
        score={score}
        type={type}
        types={types}
        updated={updated}
        updatedTime={updatedTime}
        version={version}
        versions={versions}
        jspmExports={jspmExports}
      />
    </jspm-packages-package>
  );
}

export { PackageSSR };
