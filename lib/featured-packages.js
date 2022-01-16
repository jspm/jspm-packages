import { h, Helmet } from "nano-jsx";
function FeaturedPackages(param1) {
    var _packages = param1.packages, packages = _packages === void 0 ? [] : _packages;
    return(/*#__PURE__*/ h("div", {
        id: "featured-packages"
    }, /*#__PURE__*/ h("ul", {
        class: "list-style"
    }, packages.map(function(param) {
        var name = param.name, description = param.description, version = param.version;
        return(/*#__PURE__*/ h("li", {
            class: "package-item-wrapper"
        }, /*#__PURE__*/ h("a", {
            class: "package-name",
            href: "/package/".concat(name, "@").concat(version)
        }, name, " ", /*#__PURE__*/ h("span", {
            class: "package-version"
        }, version)), /*#__PURE__*/ h("span", {
            class: "description"
        }, description)));
    })), /*#__PURE__*/ h(Helmet, null, /*#__PURE__*/ h("style", {
        "data-page-name": "featured-packages"
    }, "\n          .list-style {\n            list-style: none;\n            padding-left: var(--dl-space-space-unit);\n            margin: 0px;\n            width: 100%;\n          }\n          \n          .package-item-wrapper {\n            font-weight: 200;\n            margin-top: var(--dl-space-space-oneandhalfunits);\n          }\n\n          .package-version {\n            font-weight: 200;\n            font-size: var(--dl-space-space-unit);\n          }\n\n          .package-name {\n            display: block;\n            font-size: var(--dl-space-space-oneandhalfunits);\n            font-family: 'Inter';\n            font-weight: 400;\n            margin-bottom: var(--dl-space-space-halfunit);\n          }\n\n          .description {\n            overflow: hidden;\n            white-space: normal;\n            word-break: break-word;\n            line-height: 1.5;\n          }\n\n        "))));
}
export { FeaturedPackages };


//# sourceMappingURL=featured-packages.js.map