/** @jsx h */
import { h, Helmet } from "nano-jsx";

function Logo({ name, version }) {
  return (
    <jspm-logo>
      <h1>
        <a href="/">JSPM</a>
      </h1>
      <Helmet>
        <style data-component-name="header">
          {`
            jspm-logo {
              margin-right: var(--dl-space-space-unit);
            }

            jspm-logo h1 a {
              background: url(https://jspm.org/jspm.png) no-repeat left center;
              color: var(--dl-color-gray-black);
              background-size: contain;
              padding-left: 2.5rem;
            }
          `}
        </style>
      </Helmet>
    </jspm-logo>
  );
}
export { Logo };
