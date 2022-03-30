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
  updated,
  version,
}) {
  return (
    <jspm-package-root
      data-name={name}
      data-version={version}
      data-exports={JSON.stringify(exports)}
      data-features={JSON.stringify(features)}
      data-links={JSON.stringify(links)}
      data-maintainers={JSON.stringify(maintainers)}
      data-readme={readme}
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
        updated={updated}
        version={version}
      />
    </jspm-package-root>
  );
}

export { SsrRoot };
