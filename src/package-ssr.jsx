/** @jsx h */
import { h } from "nano-jsx";
import { Package } from "@jspm/packages/package";

function PackageSSR({
  created,
  description,
  downloads,
  exports,
  features,
  license,
  links,
  maintainers,
  name,
  readme,
  score,
  types,
  updated,
  createdTime,
  updatedTime,
  version,
  versions,
}) {
  return (
    <jspm-packages-package
      data-name={name}
      data-version={version}
    >
      <Package
        created={created}
        description={description}
        downloads={downloads}
        exports={exports}
        features={features}
        license={license}
        links={links}
        maintainers={maintainers}
        name={name}
        readme={readme}
        score={score}
        types={types}
        updated={updated}
        createdTime={createdTime}
        updatedTime={updatedTime}
        version={version}
        versions={versions}
      />
    </jspm-packages-package>
  );
}

export { PackageSSR };
