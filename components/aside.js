import { jsx } from "nano-jsx";

export const Aside = ({ license, files }) => {
  return jsx`<jspm-package-aside>
  <aside>
        <jspm-package-license>${license}</jspm-package-license>
  
        <jspm-package-files>
          ${files?.map(
            (file) => jsx`<jspm-package-file>${file}</jspm-package-file>`
          )}
        </jspm-package-files>
      </aside>
  </jspm-package-aside>`;
};
