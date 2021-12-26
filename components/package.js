import { jsx } from "nano-jsx";
import { Header } from "./header.js";
import { Readme } from "./readme.js";
import { Aside } from "./aside.js";

export const Package = ({
  name,
  description,
  keywords,
  version,
  homepage,
  license,
  files,
  exports,
  readme,
}) => {
  return jsx`
      <jspm-package>
        <${Header} homepage=${homepage} name=${name} description=${description} version=${version} />
        <jspm-package-content-grid>
        <${Readme} __html=${readme}/>
        <${Aside} license=${license} files=${files} exports=${exports} keywords=${keywords}/>
        </jspm-package-content-grid>
      </jspm-package>`;
};
