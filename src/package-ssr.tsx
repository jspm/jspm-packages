/** @jsx h */

/// <reference no-default-lib="true" />
/// <reference types="https://unpkg.com/nano-jsx@0.0.32/lib/index.d.ts" />

import { h } from "nano-jsx";
import { Package } from "@jspm/packages/package";
import type { Maintainer, ExportsTarget } from "@jspm/packages/types";

type Prop = {
  created: string;
  createdTime: string;
  dependencies: Record<string, string>,
  description: string;
  downloads: string;
  exports: ExportsTarget | Record<string, ExportsTarget>;
  features: Record<string, boolean>;
  files: string[];
  homepage: string;
  keywords: string[];
  license: string;
  links: { homepage: string; repository: string; issues: string };
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
};

function PackageSSR({
  created,
  createdTime,
  dependencies,
  description,
  downloads,
  exports,
  features,
  files,
  homepage,
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
}: Prop) {
  return (
    <jspm-packages-package data-name={name} data-version={version}>
      <Package
        created={created}
        dependencies={dependencies}
        description={description}
        downloads={downloads}
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
      />
    </jspm-packages-package>
  );
}

export { PackageSSR };