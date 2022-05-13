/** @jsx h */
import { h } from "nano-jsx";
import { Package } from "@jspm/packages/package";

function SsrRoot({
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
  types,
  updated,
  version,
  versions
}) {
  return (
    <jspm-package-root
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
        types={types}
        updated={updated}
        version={version}
        versions={versions}
      />
    </jspm-package-root>
  );
}

export { SsrRoot };
