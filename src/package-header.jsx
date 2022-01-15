import { h, Helmet } from "nano-jsx";
import { Logo } from "./logo.js";

function PackageHeader({ homepage, name, version, description }) {
  return (
    <div>
      <div class="package-header">
        <Logo name={name} version={version} />
        <div class="package-info">
          <jspm-package-name>
            <h1>
              <a href={homepage}>{name}</a>
            </h1>
          </jspm-package-name>
          <jspm-package-version>{version}</jspm-package-version>
          <jspm-package-description>{description}</jspm-package-description>
        </div>
      </div>
      <Helmet>
        <style data-page="package-header">
          {`
        .package-header {
          display: flex;
          font-family: "Major Mono Display", monospace;
          flex-wrap: wrap;
          justify-content: center;
          align-items: center;
        }
        @media(max-width: 479px) {
          .package-info {
            text-align: center;
          }
        }
        `}
        </style>
      </Helmet>
    </div>
  );
}

export { PackageHeader };
