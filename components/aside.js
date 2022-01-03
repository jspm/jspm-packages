import {
  jsx,
  Helmet,
} from "https://ga.jspm.io/npm:nano-jsx@0.0.27/lib/index.js";
import { Seperator } from "./seperator.js";

function Aside({ license, files, name, version }) {
  return jsx`<jspm-package-aside>
  <aside>
        <div>
        <h3>License</h3>
        <jspm-package-license>${license}</jspm-package-license>
        <${Seperator} />
        </div>
        <ul class="package-files">
          ${files?.map(
            (file) =>
              jsx`
                <li>
                  <a target="_blank" href=${`https://ga.jspm.io/npm:${name}@${version}/${file}`} class="package-file">${file}</a>
                </li>
              `
          )}
        </ul>
      </aside>
  </jspm-package-aside>
  <${Helmet}>
    <style data-page="package-files">
      .package-file {
        display: block;
        line-height: 1.3;
      }

      .package-files {
        list-style: none;
        padding-left: 0px;
        height: 500px;
        overflow: scroll;
      }

      .package-files li {
        line-height: 1.3;
      }
    </style>
  </${Helmet}>
  `;
}

export { Aside };
