import { h, Helmet } from "nano-jsx";
import { Seperator } from "./separator.js";
import { Exports } from "./exports.js";

function Aside({ license, name, version, exports }) {
  return (
    <jspm-package-aside>
      <aside>
        <div>
          <h3>License</h3>
          <jspm-package-license>{license}</jspm-package-license>
          <Seperator />
        </div>
        <jspm-package-aside-exports
          data-exports={JSON.stringify(exports)}
          data-name={name}
          data-version={version}
        >
          <Exports exports={exports} name={name} version={version} />
        </jspm-package-aside-exports>
      </aside>
    </jspm-package-aside>
  );
}

export { Aside };
