import { jsx } from "nano-jsx";
import { Seperator } from "./seperator.js";

export const Aside = ({ license, files }) => {
  return jsx`<jspm-package-aside>
  <aside>
        <div>
        <h3>License</h3>
        <jspm-package-license>${license}</jspm-package-license>
        <${Seperator} />
        </div>
        <jspm-package-files>
          ${files?.map(
            (file) => jsx`<jspm-package-file>${file}</jspm-package-file>`
          )}
        </jspm-package-files>
      </aside>
  </jspm-package-aside>`;
};
