import { h, Helmet } from "nano-jsx";
import { Header } from "./header.js";
import { FeaturedPackages } from "./featured-packages.js";
function Home(param) {
    var packages = param.packages;
    return(/*#__PURE__*/ h("jspm-package-home", null, /*#__PURE__*/ h("jspm-package-home-header", null, /*#__PURE__*/ h(Header, null)), /*#__PURE__*/ h("jspm-package-home-main", null, /*#__PURE__*/ h("main", null, /*#__PURE__*/ h(FeaturedPackages, {
        packages: packages
    }))), /*#__PURE__*/ h("jspm-package-home-footer", null, /*#__PURE__*/ h("footer", null)), /*#__PURE__*/ h(Helmet, null, /*#__PURE__*/ h("style", {
        "data-page-name": "jspm-package-home"
    }, "\n          \n        "))));
}
export { Home };


//# sourceMappingURL=home.js.map