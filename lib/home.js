/** @jsx h */ import { h, Helmet } from "nano-jsx";
import { Header } from "./header.js";
import { FeaturedPackages } from "./featured-packages.js";
import { Footer } from "./footer.js";
function Home(param) {
    var packages = param.packages;
    return(/*#__PURE__*/ h("jspm-home", null, /*#__PURE__*/ h("jspm-home-header", null, /*#__PURE__*/ h(Header, null)), /*#__PURE__*/ h("jspm-home-main", null, /*#__PURE__*/ h("main", null, /*#__PURE__*/ h(FeaturedPackages, {
        packages: packages
    }))), /*#__PURE__*/ h("jspm-home-footer", null, /*#__PURE__*/ h(Footer, null)), /*#__PURE__*/ h(Helmet, null, /*#__PURE__*/ h("style", {
        "data-component-name": "jspm-home"
    }, "\n          \n        "))));
}
export { Home };


//# sourceMappingURL=home.js.map