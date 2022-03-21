/** @jsx h */ import { h } from "nano-jsx";
import { Package } from "./package.js";
function SsrRoot({ created , downloads , exports , features , license , links , maintainers , name , readme , updated , version ,  }) {
    return /*#__PURE__*/ h("jspm-package-root", {
        "data-name": name,
        "data-version": version,
        "data-exports": JSON.stringify(exports),
        "data-features": JSON.stringify(features),
        "data-links": JSON.stringify(links),
        "data-maintainers": JSON.stringify(maintainers),
        "data-readme": readme
    }, /*#__PURE__*/ h(Package, {
        created: created,
        downloads: downloads,
        exports: exports,
        features: features,
        license: license,
        links: links,
        name: name,
        readme: readme,
        maintainers: maintainers,
        updated: updated,
        version: version
    }));
}
export { SsrRoot };


//# sourceMappingURL=ssr-root.js.map