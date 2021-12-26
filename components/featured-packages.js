import { jsx, Component, Helmet } from "nano-jsx";
import { Header } from "./header.js";
import { Footer } from "./footer.js";
import { getRecentPackages } from "../utils.js";

export class FeaturedPackages extends Component {
  static async fetchPackages() {
    const result = await getRecentPackages();
    return result?.objects || [];
  }

  render() {
    const { packages = [] } = this.props;
    return jsx`
      <div id="featured-packages">
        <${Header} />
        List of some of featured packages
        <ul class="list-style">
          ${packages.map((item) => {
            const { name, description, version } = item.package;
            return jsx`
            <li class="package-wrapper">
              <div class="package-name">
                ${name} <span class="package-version">${version}</span>
              </div>
              ${description}
            </li>`;
          })}
        </ul>
        <${Footer} />
        <${Helmet}>
          <style>
            .list-style {
              list-style: none;
              padding-left: 0px;
            }
            
            .package-wrapper {
              font-weight: 200;
              margin-top: var(--dl-space-space-oneandhalfunits);
            }

            .package-version {
              font-weight: 200;
              font-size: var(--dl-space-space-unit);
            }

            .package-name {
              font-size: var(--dl-space-space-oneandhalfunits);
              font-family: 'Inter';
              font-weight: 400;
              margin-bottom: var(--dl-space-space-halfunit);
            }
          </style>
        </${Helmet}>
      </div>`;
  }
}
