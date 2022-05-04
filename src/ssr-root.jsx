/** @jsx h */
import nano, { h } from "nano-jsx";
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
      data-created={created}
      data-description={description}
      data-downloads={downloads}
      data-exports={JSON.stringify(exports)}
      data-features={JSON.stringify(features)}
      data-license={license}
      data-links={JSON.stringify(links)}
      data-maintainers={JSON.stringify(maintainers)}
      data-readme={readme}
      data-updated={updated}
      data-name={name}
      data-types={types}
      data-version={version}
      data-versions={JSON.stringify(versions)}
    >
      <Package
        created={created}
        description={description}
        downloads={downloads}
        exports={exports}
        features={features}
        license={license}
        links={links}
        name={name}
        readme={readme}
        maintainers={maintainers}
        types={types}
        updated={updated}
        version={version}
        versions={versions}
      />
    </jspm-package-root>
  );
}

export { SsrRoot };
