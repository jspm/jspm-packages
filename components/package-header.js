import { jsx } from "nano-jsx";
import { Logo } from "./logo.js";

export const PackageHeader = (props) => {
  const { homepage, name, version, description } = props;

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
