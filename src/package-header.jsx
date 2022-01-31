import { h, Helmet } from "nano-jsx";

function PackageHeader({ homepage, name, version, description }) {
  return (
    <div>
      <div class="package-header">
        <div class="package-info">
          <jspm-name>
            <h1>
              <a href={homepage}>{name}</a>
            </h1>
          </jspm-name>
          <jspm-version>{version}</jspm-version>
          <jspm-description>{description}</jspm-description>
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
