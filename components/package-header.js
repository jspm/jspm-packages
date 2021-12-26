import { jsx } from "https://ga.jspm.io/npm:nano-jsx@0.0.25/lib/index.js";
import { Logo } from "./logo.js";

export const PackageHeader = ({ homepage, name, version, description }) => {
  return jsx`
   <jspm-package-header>
      <${Logo} name=${name} version=${version} />
      <jspm-package-information>
      <jspm-package-name>
     <h1><a href=${homepage}>${name}</a></h1>
   </jspm-package-name>
   <jspm-package-version>${version}</jspm-package-version>
   <jspm-package-description>${description}</jspm-package-description>
   </jspm-package-information>
  </jspm-package-header>
   `;
};
