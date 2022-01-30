import { h, Helmet } from "nano-jsx";
import { Seperator } from "./separator.js";
import { Exports } from "./exports.js";
function _arrayLikeToArray(arr, len) {
    if (len == null || len > arr.length) len = arr.length;
    for(var i = 0, arr2 = new Array(len); i < len; i++)arr2[i] = arr[i];
    return arr2;
}
function _arrayWithHoles(arr) {
    if (Array.isArray(arr)) return arr;
}
function _iterableToArrayLimit(arr, i) {
    var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"];
    if (_i == null) return;
    var _arr = [];
    var _n = true;
    var _d = false;
    var _s, _e;
    try {
        for(_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true){
            _arr.push(_s.value);
            if (i && _arr.length === i) break;
        }
    } catch (err) {
        _d = true;
        _e = err;
    } finally{
        try {
            if (!_n && _i["return"] != null) _i["return"]();
        } finally{
            if (_d) throw _e;
        }
    }
    return _arr;
}
function _nonIterableRest() {
    throw new TypeError("Invalid attempt to destructure non-iterable instance.\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _slicedToArray(arr, i) {
    return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest();
}
function _unsupportedIterableToArray(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return _arrayLikeToArray(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(n);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
}
function Aside(param1) {
    var license = param1.license, name = param1.name, version = param1.version, exports = param1.exports, downloads = param1.downloads, updated = param1.updated, type = param1.type, types = param1.types, features = param1.features, created = param1.created, links = param1.links;
    return(/*#__PURE__*/ h("jspm-package-aside", null, /*#__PURE__*/ h("aside", null, /*#__PURE__*/ h("jspm-package-created", null, /*#__PURE__*/ h("h3", null, "Created"), created), /*#__PURE__*/ h("jspm-package-weekly-updated", null, /*#__PURE__*/ h("h3", null, "Updated"), updated), /*#__PURE__*/ h("jspm-package-weekly-downloads", null, /*#__PURE__*/ h("h3", null, "Downloads (weekly)"), downloads), /*#__PURE__*/ h("jspm-package-features", null, /*#__PURE__*/ h("h3", null, "Features"), Object.entries(features).map(function(param) {
        var _param = _slicedToArray(param, 2), feature = _param[0], supported = _param[1];
        /*#__PURE__*/ return h("ul", null, /*#__PURE__*/ h("li", {
            "data-feature-supported": supported
        }, feature));
    })), /*#__PURE__*/ h("div", null, /*#__PURE__*/ h("h3", null, "License"), /*#__PURE__*/ h("jspm-package-license", null, license), /*#__PURE__*/ h(Seperator, null)), /*#__PURE__*/ h("jspm-package-aside-exports", {
        "data-exports": JSON.stringify(exports),
        "data-name": name,
        "data-version": version
    }, /*#__PURE__*/ h(Exports, {
        exports: exports,
        name: name,
        version: version
    })), /*#__PURE__*/ h("jspm-package-links", null, /*#__PURE__*/ h("h3", null, "Links"), Object.entries(links).map(function(param) {
        var _param = _slicedToArray(param, 2), text = _param[0], link = _param[1];
        return link && /*#__PURE__*/ h("jspm-package-link", null, /*#__PURE__*/ h("h5", null, text), /*#__PURE__*/ h("a", {
            href: link
        }, link));
    }))), /*#__PURE__*/ h(Helmet, null, /*#__PURE__*/ h("style", {
        "data-page-name": "jspm-package-aside"
    }, "\n          jspm-package-features li{\n            padding-inline-start: 1ch;\n          }\n          jspm-package-features li[data-feature-supported=\"true\"]{\n            list-style-type: '✔';\n          }\n          jspm-package-features li[data-feature-supported=\"false\"]{\n            list-style-type: '✖';\n          }\n          "))));
}
export { Aside };


//# sourceMappingURL=aside.js.map