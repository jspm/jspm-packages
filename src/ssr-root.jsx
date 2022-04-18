/** @jsx h */
import nano, { h } from "nano-jsx";
import { Package } from "@jspm/packages/package";

function SsrRoot({
  created,
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
}) {
  return (
    <jspm-package-root
      data-created={created}
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
    >
      <Package
        created={created}
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
      />
    </jspm-package-root>
  );
}

export { SsrRoot };
