import regeneratorRuntime from "regenerator-runtime";
/** @jsx h */ import { Component, h, Helmet } from "nano-jsx";
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
var Hero = /*#__PURE__*/ function(Component1) {
    "use strict";
    _inherits(Hero, Component1);
    var _super = _createSuper(Hero);
    function Hero(props) {
        _classCallCheck(this, Hero);
        var _this;
        _this = _super.call(this, props);
        _defineProperty(_assertThisInitialized(_this), "exports", void 0);
        _defineProperty(_assertThisInitialized(_this), "generatorHash", void 0);
        var _this1 = _assertThisInitialized(_this);
        _defineProperty(_assertThisInitialized(_this), "generateHash", _asyncToGenerator(regeneratorRuntime.mark(function _callee() {
            var _props, name, version, getStateHash, exports, generatorHash;
            return regeneratorRuntime.wrap(function _callee$(_ctx) {
                while(1)switch(_ctx.prev = _ctx.next){
                    case 0:
                        if (!(typeof globalThis.document !== "undefined")) {
                            _ctx.next = 10;
                            break;
                        }
                        _props = _this1.props, name = _props.name, version = _props.version;
                        _ctx.next = 4;
                        return import("./generate-statehash.js");
                    case 4:
                        getStateHash = _ctx.sent.getStateHash;
                        exports = Object.keys(_this1.exports).filter(function(subpath) {
                            return _this1.exports[subpath] === true;
                        });
                        _ctx.next = 8;
                        return getStateHash({
                            name: name,
                            version: version,
                            exports: exports
                        });
                    case 8:
                        generatorHash = _ctx.sent;
                        if (generatorHash) {
                            _this1.generatorHash = generatorHash;
                            _this1.update();
                        }
                    case 10:
                    case "end":
                        return _ctx.stop();
                }
            }, _callee);
        })));
        _defineProperty(_assertThisInitialized(_this), "toggleExportSelection", function(event) {
            event.preventDefault();
            console.log(event);
            _this.exports[event.target.value] = !_this.exports[event.target.value];
            console.log(event.target.value);
            _this.generateHash();
            _this.update();
        });
        var selectedExports = {};
        props.exports.forEach(function(subpath) {
            return selectedExports[subpath] = subpath === ".";
        });
        _this.exports = selectedExports;
        return _this;
    }
    _createClass(Hero, [
        {
            key: "didMount",
            value: function didMount() {
                if (!this.generatorHash) {
                    this.generateHash();
                }
            }
        },
        {
            key: "render",
            value: function render() {
                if (this.generatorHash) {
                    var _this = this;
                    var _props = this.props, name = _props.name, description = _props.description, version = _props.version, updated = _props.updated, types = _props.types;
                    var selectedImports = Object.keys(this.exports).filter(function(subpath) {
                        return _this.exports[subpath] === true;
                    });
                    var numSelectedImports = selectedImports.length;
                    var depText = "".concat(numSelectedImports, " ").concat(numSelectedImports > 1 ? "dependencies" : "dependency");
                    return(/*#__PURE__*/ h("jspm-hero", null, /*#__PURE__*/ h("jspm-hero-main", null, /*#__PURE__*/ h("jspm-highlight", null, /*#__PURE__*/ h("h2", null, name), /*#__PURE__*/ h("jspm-summary", null, /*#__PURE__*/ h("span", null, version), /*#__PURE__*/ h("span", null, "Published ", updated), types && /*#__PURE__*/ h("img", {
                        height: "20",
                        src: "/icon-typescript-logo.svg"
                    })), /*#__PURE__*/ h("p", null, description)), /*#__PURE__*/ h("jspm-hero-cta", null, /*#__PURE__*/ h("jspm-hero-cta-generator", null, /*#__PURE__*/ h("p", null, "Customise importmap for selected ", depText, "."), /*#__PURE__*/ h("a", {
                        target: "_blank",
                        href: "https://generator.jspm.io/".concat(this.generatorHash)
                    }, "JSPM Generator")))), /*#__PURE__*/ h("jspm-exports", null, /*#__PURE__*/ h("h3", null, "Package Exports"), /*#__PURE__*/ h("ul", null, Object.entries(this.exports).map(function(param) {
                        var _param = _slicedToArray(param, 2), subpath = _param[0], selected = _param[1];
                        /*#__PURE__*/ return h("li", {
                            "data-selected": selected
                        }, /*#__PURE__*/ h("jspm-export", null, /*#__PURE__*/ h("button", {
                            type: "button",
                            class: "code",
                            onClick: _this.toggleExportSelection,
                            value: subpath
                        }, "".concat(name).concat(subpath.slice(1)))));
                    }))), /*#__PURE__*/ h(Helmet, null, /*#__PURE__*/ h("style", {
                        "data-component-name": "jspm-hero"
                    }, "\n              jspm-summary{\n                display: flex;\n                justify-content: center;\n                font-weight: 700;\n              }\n              jspm-summary > span:after{\n                content: '•';\n                margin: 0 10px;\n              }\n              jspm-exports{\n                max-height: 400px;\n                overflow-y: scroll;\n              }\n              jspm-exports ul{\n                margin: 0;\n                padding: 0 0 0 15px;\n              }\n              jspm-exports li{\n                padding-inline-start: 1ch;\n                list-style-type: '+';\n              }\n              jspm-exports li::marker {\n                color: var(--dl-color-primary-js-primary);\n              }\n              jspm-exports li[data-selected=\"true\"]{\n                list-style-type: '✔';\n              }\n              jspm-hero{\n                display: grid;\n                grid-template-columns: minmax(800px, 1fr) minmax(350px, 1fr);\n                grid-gap: 1rem;\n              }\n              jspm-export{\n                display: block;\n              }\n          jspm-export button {\n              background: white;\n              border: none;\n              cursor: pointer;\n              display: block;\n              line-height: 30px;\n              border-radius: 5px;\n              text-align: left;\n          }\n          jspm-hero-cta{\n            display: flex;\n            justify-content: space-around;\n            text-align: center;\n          }\n          jspm-hero-cta p{\n            font-family: \"Bebas Neue\", cursive;\n            font-size: var(--step-1);\n          }\n          jspm-hero-cta a{\n            background: var(--dl-color-primary-js-primary);\n            color: black;\n            padding: 15px;\n            display: inline-block;\n            border: 3px solid black;\n          }\n          /*\n          jspm-export button[data-selected=\"true\"]{\n            border: none;\n            background: #FFC95C;\n            display: block;\n            width: 100%;\n            box-shadow: 2px 2px 24px 0px #00000026;\n          }\n          \n          jspm-export button:before {\n              content: '';\n              width: 20px;\n              height: 20px;\n              background: url('/images/icon-add.svg') center center no-repeat;\n              color: black;\n              display: inline-block;\n              margin: 10px;\n          }\n          jspm-export button[data-selected=\"true\"]:before {\n            background: url('/images/icon-check.svg') center center no-repeat;\n          }\n          */\n          "))));
                } else {
                    return(/*#__PURE__*/ h("div", null));
                }
            }
        }
    ]);
    return Hero;
}(Component);
export { Hero };


//# sourceMappingURL=hero.js.map