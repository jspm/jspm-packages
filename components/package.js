import { jsx } from "https://ga.jspm.io/npm:nano-jsx@0.0.27/lib/index.js";
import { PackageHeader } from "./package-header.js";
import { Readme } from "./readme.js";
import { Aside } from "./aside.js";
import { Header } from "./header.js";
import { Footer } from "./footer.js";

function Package(props) {
  const {
    name,
    description,
    keywords,
    version,
    homepage,
    license,
    files,
    exports,
    readme,
  } = props;

  return jsx`
      <${Header} />
      <jspm-package>
        <${PackageHeader} homepage=${
    homepage || ""
  } name=${name} description=${description} version=${version} />
        <jspm-package-content-grid>
          <${Readme} __html=${readme}/>
          <${Aside} license=${license} files=${files} exports=${exports} keywords=${keywords}/>
        </jspm-package-content-grid>
      </jspm-package>
      <${Footer} />`;
}

export { Package };
