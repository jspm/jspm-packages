import { h, Helmet } from "nano-jsx";
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
function ExportsValue(param) {
    var value = param.value, name = param.name;
    if (typeof value === "string") {
        return(/*#__PURE__*/ h("jspm-package-exports-target", null, value));
    } else if (Array.isArray(value)) {
        return value.map(function(target) {
            /*#__PURE__*/ return h("jspm-package-exports-target", null, target);
        });
    }
    return(/*#__PURE__*/ h(Exports, {
        exports: value,
        name: name
    }));
}
function getResolvedKey(param) {
    var key = param.key, name = param.name;
    if (key === ".") {
        return name;
    }
    if (key.startsWith("./")) {
        return "".concat(name).concat(key.slice(1));
    }
    return name ? "".concat(name, "/").concat(key) : key;
}
function ExportsKey(param) {
    var key = param.key, name = param.name;
    var resolvedKey = getResolvedKey({
        key: key,
        name: name
    });
    return(/*#__PURE__*/ h("jspm-package-exports-key", null, resolvedKey));
}
function Exports(param1) {
    var exports = param1.exports, name = param1.name;
    return(/*#__PURE__*/ h("jspm-package-exports", null, Object.entries(exports).map(function(param) {
        var _param = _slicedToArray(param, 2), key = _param[0], value = _param[1];
        return key.endsWith('!cjs') || key === 'default' ? false : /*#__PURE__*/ h("jspm-package-exports-entry", null, /*#__PURE__*/ h("details", null, /*#__PURE__*/ h("summary", null, /*#__PURE__*/ h(ExportsKey, {
            key: key,
            name: name
        })), /*#__PURE__*/ h(ExportsValue, {
            value: value,
            name: name
        })));
    }), /*#__PURE__*/ h(Helmet, null, /*#__PURE__*/ h("style", {
        "data-page": "package-details"
    }, "\n          jspm-package-exports-entry {\n              display: flex;\n              display: block;\n              padding-left: 10px;\n          }\n          jspm-package-exports-target{\n              margin-left: 20px;\n              display: block;\n          }\n          \n          "))));
}
export { Exports };


//# sourceMappingURL=exports.js.map