import {
  jsx,
  Helmet,
} from "https://ga.jspm.io/npm:nano-jsx@0.0.27/lib/index.js";
import { Header } from "./header.js";
import { Footer } from "./footer.js";

function FeaturedPackages({ packages = [] }) {
  return jsx`
      <div class="featured-packages-wrapper"  id="featured-packages">
        <${Header} />
        List of some of featured packages
        <ul class="list-style">
          ${packages.map((item) => {
            const { name, description, version } = item.package;
            return jsx`
            <li class="package-item-wrapper">
              <a class="package-name" href="/package/${name}@${version}">
                ${name} <span class="package-version">${version}</span>
              </a>
              ${description}
            </li>`;
          })}
        </ul>
        <${Footer} />
        <${Helmet}>
          <style data-page-name="featured-packages">
            .featured-packages-wrapper {
              padding: var(--dl-space-space-oneandhalfunits);
            }

            .list-style {
              list-style: none;
              padding-left: 0px;
            }
            
            .package-item-wrapper {
              font-weight: 200;
              margin-top: var(--dl-space-space-oneandhalfunits);
            }

            .package-version {
              font-weight: 200;
              font-size: var(--dl-space-space-unit);
            }

            .package-name {
              display: block;
              font-size: var(--dl-space-space-oneandhalfunits);
              font-family: 'Inter';
              font-weight: 400;
              margin-bottom: var(--dl-space-space-halfunit);
            }
          </style>
        </${Helmet}>
      </div>`;
}

export { FeaturedPackages };
