import { h, Helmet } from "nano-jsx";
import { Seperator } from "./separator.js";
import {Exports} from './exports.js';

function Aside({ license, files, name, version, exports }) {
  return (
    <jspm-package-aside>
      <aside>
        <div>
          <h3>License</h3>
          <jspm-package-license>{license}</jspm-package-license>
          <Seperator />
        </div>
        <Exports exports={exports} name={name} />
        <ul class="package-files">
          {files?.map(
            (file) => (
              <li>
                <a
                  target="_blank"
                  href={`https://ga.jspm.io/npm:${name}@${version}/${file}`}
                  class="package-file"
                >
                  {file}
                </a>
              </li>
            ),
          )}
        </ul>
      </aside>
      <Helmet>
        <style data-page="package-files">
          {`
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
        `}
        </style>
      </Helmet>
    </jspm-package-aside>
  );
}

export { Aside };
