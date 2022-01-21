import regeneratorRuntime from "regenerator-runtime";
import { Component, h, Helmet } from "nano-jsx";
function _arrayLikeToArray(arr, len) {
    if (len == null || len > arr.length) len = arr.length;
    for(var i = 0, arr2 = new Array(len); i < len; i++)arr2[i] = arr[i];
    return arr2;
}
function _arrayWithHoles(arr) {
    if (Array.isArray(arr)) return arr;
}
function _assertThisInitialized(self) {
    if (self === void 0) {
        throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }
    return self;
}
function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
    try {
        var info = gen[key](arg);
        var value = info.value;
    } catch (error) {
        reject(error);
        return;
    }
    if (info.done) {
        resolve(value);
    } else {
        Promise.resolve(value).then(_next, _throw);
    }
}
function _asyncToGenerator(fn) {
    return function() {
        var self = this, args = arguments;
        return new Promise(function(resolve, reject) {
            var gen = fn.apply(self, args);
            function _next(value) {
                asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
            }
            function _throw(err) {
                asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
            }
            _next(undefined);
        });
    };
}
function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}
function _defineProperties(target, props) {
    for(var i = 0; i < props.length; i++){
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
    }
}
function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    return Constructor;
}
function _defineProperty(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
function _extends() {
    _extends = Object.assign || function(target) {
        for(var i = 1; i < arguments.length; i++){
            var source = arguments[i];
            for(var key in source){
                if (Object.prototype.hasOwnProperty.call(source, key)) {
                    target[key] = source[key];
                }
            }
        }
        return target;
    };
    return _extends.apply(this, arguments);
}
function _getPrototypeOf(o) {
    _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {
        return o.__proto__ || Object.getPrototypeOf(o);
    };
    return _getPrototypeOf(o);
}
function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
        throw new TypeError("Super expression must either be null or a function");
    }
    subClass.prototype = Object.create(superClass && superClass.prototype, {
        constructor: {
            value: subClass,
            writable: true,
            configurable: true
        }
    });
    if (superClass) _setPrototypeOf(subClass, superClass);
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
function _objectSpread(target) {
    for(var i = 1; i < arguments.length; i++){
        var source = arguments[i] != null ? arguments[i] : {};
        var ownKeys = Object.keys(source);
        if (typeof Object.getOwnPropertySymbols === "function") {
            ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
                return Object.getOwnPropertyDescriptor(source, sym).enumerable;
            }));
        }
        ownKeys.forEach(function(key) {
            _defineProperty(target, key, source[key]);
        });
    }
    return target;
}
function _possibleConstructorReturn(self, call) {
    if (call && (_typeof(call) === "object" || typeof call === "function")) {
        return call;
    }
    return _assertThisInitialized(self);
}
function _setPrototypeOf(o, p) {
    _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {
        o.__proto__ = p;
        return o;
    };
    return _setPrototypeOf(o, p);
}
function _slicedToArray(arr, i) {
    return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest();
}
var _typeof = function(obj) {
    "@swc/helpers - typeof";
    return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj;
};
function _unsupportedIterableToArray(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return _arrayLikeToArray(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(n);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
}
function _isNativeReflectConstruct() {
    if (typeof Reflect === "undefined" || !Reflect.construct) return false;
    if (Reflect.construct.sham) return false;
    if (typeof Proxy === "function") return true;
    try {
        Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function() {}));
        return true;
    } catch (e) {
        return false;
    }
}
function _createSuper(Derived) {
    var hasNativeReflectConstruct = _isNativeReflectConstruct();
    return function _createSuperInternal() {
        var Super = _getPrototypeOf(Derived), result;
        if (hasNativeReflectConstruct) {
            var NewTarget = _getPrototypeOf(this).constructor;
            result = Reflect.construct(Super, arguments, NewTarget);
        } else {
            result = Super.apply(this, arguments);
        }
        return _possibleConstructorReturn(this, result);
    };
}
function getCleanPath(path) {
    if (path === ".") {
        return "";
    }
    if (path.startsWith("./")) {
        return path.slice(1);
    }
    return path;
}
function Exports(param1) {
    var exports = param1.exports, name = param1.name, version = param1.version, importMaps = param1.importMaps, getImportMap = param1.getImportMap;
    return(/*#__PURE__*/ h("jspm-package-exports", null, Object.entries(exports).map(function(param) {
        var _param = _slicedToArray(param, 2), key = _param[0], value = _param[1];
        return key.endsWith("!cjs") || key === "default" ? false : /*#__PURE__*/ h("jspm-package-exports-entry", null, /*#__PURE__*/ h("details", {
            "data-subpath": key,
            "data-dependency": "".concat(name, "@").concat(version).concat(getCleanPath(key)),
            onClick: function() {
                getImportMap("".concat(name, "@").concat(version).concat(getCleanPath(key)));
            }
        }, /*#__PURE__*/ h("summary", null, /*#__PURE__*/ h(ExportsKey, {
            key: key,
            name: name,
            version: version
        })), /*#__PURE__*/ h(ExportsValue, {
            key: key,
            value: value,
            name: name,
            version: version,
            getImportMap: getImportMap,
            importMaps: importMaps
        })));
    }), /*#__PURE__*/ h(Helmet, null, /*#__PURE__*/ h("style", {
        "data-page": "package-details"
    }, "\n            jspm-package-exports-entry {\n                display: flex;\n                display: block;\n                padding-left: 10px;\n            }\n            jspm-package-exports-target{\n                margin-left: 20px;\n                display: block;\n            }\n            \n            "))));
}
function ExportsValue(param) {
    var key = param.key, value = param.value, name = param.name, version = param.version, getImportMap = param.getImportMap, importMaps = param.importMaps, map = param.map;
    if (typeof value === "string") {
        // const map = importMaps[`${name}@${version}${getCleanPath(key)}`];
        return(/*#__PURE__*/ h("jspm-package-exports-target", null, value, map));
    } else if (Array.isArray(value)) {
        return value.map(function(target) {
            /*#__PURE__*/ return h("jspm-package-exports-target", null, target);
        });
    }
    return(/*#__PURE__*/ h(Exports, {
        exports: value,
        name: name,
        version: version,
        getImportMap: getImportMap,
        importMaps: importMaps
    }));
}
function ExportsKey(param) {
    var key = param.key, name = param.name, version = param.version;
    return(/*#__PURE__*/ h("jspm-package-exports-key", null, key));
}
var ExportsContainer = /*#__PURE__*/ function(Component1) {
    "use strict";
    _inherits(ExportsContainer, Component1);
    var _super = _createSuper(ExportsContainer);
    function ExportsContainer(props) {
        _classCallCheck(this, ExportsContainer);
        var _this;
        _this = _super.call(this, props);
        _defineProperty(_assertThisInitialized(_this), "importMaps", {});
        var _this1 = _assertThisInitialized(_this);
        _defineProperty(_assertThisInitialized(_this), "getImportMap", function() {
            var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(dependency) {
                var Generator, generator, importMap;
                return regeneratorRuntime.wrap(function _callee$(_ctx) {
                    while(1)switch(_ctx.prev = _ctx.next){
                        case 0:
                            if (!(typeof document !== "undefined")) {
                                _ctx.next = 10;
                                break;
                            }
                            _ctx.next = 3;
                            return import("@jspm/generator");
                        case 3:
                            Generator = _ctx.sent.Generator;
                            generator = new Generator({
                                env: [
                                    "production",
                                    "browser",
                                    "module"
                                ]
                            });
                            _ctx.next = 7;
                            return generator.install(dependency);
                        case 7:
                            importMap = JSON.stringify(generator.getMap(), null, 2);
                            console.log(importMap);
                            if (importMap) {
                                _this1.importMaps = _objectSpread({}, _this1.importMaps, _defineProperty({}, dependency, generator.getMap()));
                                _this1.update();
                            }
                        case 10:
                        case "end":
                            return _ctx.stop();
                    }
                }, _callee);
            }));
            return function(dependency) {
                return _ref.apply(this, arguments);
            };
        }());
        return _this;
    }
    _createClass(ExportsContainer, [
        {
            key: "render",
            value: function render() {
                var _props = this.props, exports = _props.exports, name = _props.name, version = _props.version;
                return(/*#__PURE__*/ h("div", null, /*#__PURE__*/ h("pre", null, /*#__PURE__*/ h("code", {
                    innerHTML: {
                        __dangerousHtml: JSON.stringify(this.importMaps, null, 2)
                    }
                })), /*#__PURE__*/ h(Exports, {
                    exports: exports,
                    name: name,
                    version: version,
                    getImportMap: this.getImportMap,
                    importMaps: this.importMaps
                })));
            }
        }
    ]);
    return ExportsContainer;
}(Component);
var Exports2 = /*#__PURE__*/ function(Component2) {
    "use strict";
    _inherits(Exports2, Component2);
    var _super = _createSuper(Exports2);
    function Exports2() {
        _classCallCheck(this, Exports2);
        var _this;
        _this = _super.apply(this, arguments);
        _defineProperty(_assertThisInitialized(_this), "checked", true);
        _defineProperty(_assertThisInitialized(_this), "toggle", function(e) {
            _this.checked = !_this.checked;
            _this.update();
        });
        return _this;
    }
    _createClass(Exports2, [
        {
            key: "render",
            value: function render() {
                var Text = this.checked ? /*#__PURE__*/ h("p", null, "is checked") : null;
                return(/*#__PURE__*/ h("div", null, /*#__PURE__*/ h("input", _extends({
                    id: "checkbox",
                    type: "checkbox"
                }, this.checked ? {
                    checked: true
                } : {}, {
                    onClick: this.toggle
                })), /*#__PURE__*/ h(Text, null)));
            }
        }
    ]);
    return Exports2;
}(Component);
export { ExportsContainer };


//# sourceMappingURL=exports.js.map