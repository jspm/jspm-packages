import { h, Helmet } from "nano-jsx";

function Logo({ name, version }) {
  return (
    <jspm-package-logo>
      <h1>
        <a href="/">JSPM</a>
      </h1>
      <Helmet>
        <style data-page-name="header">
          {`
            jspm-package-logo {
              margin-right: var(--dl-space-space-unit);
            }

            jspm-package-logo h1 a {
              background: url(https://jspm.org/jspm.png) no-repeat left center;
              color: var(--dl-color-gray-black);
              background-size: contain;
              padding-left: 2.5rem;
            }
          `}
        </style>
      </Helmet>
    </jspm-package-logo>
  );
}
export { Logo };
