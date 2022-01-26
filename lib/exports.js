import regeneratorRuntime from "regenerator-runtime";
import { Component, h, Helmet } from "nano-jsx";
import { getCleanPath, main as importMapGenerator } from "./importmap-generator.js";
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
var _typeof = function(obj) {
    "@swc/helpers - typeof";
    return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj;
};
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
var ImportMap = /*#__PURE__*/ function(Component1) {
    "use strict";
    _inherits(ImportMap, Component1);
    var _super = _createSuper(ImportMap);
    function ImportMap(props) {
        _classCallCheck(this, ImportMap);
        var _this;
        _this = _super.call(this, props);
        _defineProperty(_assertThisInitialized(_this), "importMaps", void 0);
        return _this;
    }
    _createClass(ImportMap, [
        {
            key: "didMount",
            value: function didMount() {
                var _this = this;
                return _asyncToGenerator(regeneratorRuntime.mark(function _callee() {
                    var _props, target, subpaths, importMap;
                    return regeneratorRuntime.wrap(function _callee$(_ctx) {
                        while(1)switch(_ctx.prev = _ctx.next){
                            case 0:
                                if (_this.importMaps) {
                                    _ctx.next = 6;
                                    break;
                                }
                                _props = _this.props, target = _props.target, subpaths = _props.subpaths;
                                _ctx.next = 4;
                                return importMapGenerator({
                                    target: target,
                                    subpaths: subpaths
                                });
                            case 4:
                                importMap = _ctx.sent;
                                if (importMap) {
                                    _this.importMaps = importMap;
                                    _this.update();
                                }
                            case 6:
                            case "end":
                                return _ctx.stop();
                        }
                    }, _callee);
                }))();
            }
        },
        {
            key: "render",
            value: function render() {
                if (this.importMaps) {
                    return(/*#__PURE__*/ h("pre", null, /*#__PURE__*/ h("code", {
                        innerHTML: {
                            __dangerousHtml: JSON.stringify(this.importMaps, null, 2)
                        }
                    })));
                } else {
                    return(/*#__PURE__*/ h("div", null, this.props.subpath));
                }
            }
        }
    ]);
    return ImportMap;
}(Component);
function SubpathImportMap(param) {
    var subpath = param.subpath, name = param.name, version = param.version;
    return(/*#__PURE__*/ h("jspm-package-exports-subpath-importmap", null, /*#__PURE__*/ h(ImportMap, {
        target: "".concat(name, "@").concat(version),
        subpaths: [
            subpath
        ]
    })));
}
function Subpath(param) {
    var importPath = param.importPath;
    return(/*#__PURE__*/ h("jspm-package-exports-subpath", null, importPath));
}
function Exports(param) {
    var exports = param.exports, name = param.name, version = param.version, exportHashes = param.exportHashes;
    return(/*#__PURE__*/ h("jspm-package-exports", null, /*#__PURE__*/ h("ul", {
        class: "package-files"
    }, exportHashes && (exports === null || exports === void 0 ? void 0 : exports.map(function(subpath) {
        var href = exportHashes[subpath];
        return(/*#__PURE__*/ h("li", null, /*#__PURE__*/ h("a", {
            target: "_blank",
            href: href,
            class: "package-file"
        }, "".concat(name).concat(subpath.slice(1)))));
    }))), /*#__PURE__*/ h(Helmet, null, /*#__PURE__*/ h("style", {
        "data-page": "package-details"
    }, "\n            .package-file {\n              display: block;\n              line-height: 1.3;\n            }\n            .package-files {\n              list-style: none;\n              padding-left: 0px;\n              height: 500px;\n              overflow: scroll;\n            }\n            .package-files li {\n              line-height: 1.3;\n            }\n            "))));
}
export { Exports };


//# sourceMappingURL=exports.js.map