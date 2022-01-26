import regeneratorRuntime from "regenerator-runtime";
import { h, hydrate } from "nano-jsx";
import { Exports } from "./exports.js";
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
function getStateHash(_) {
    return _getStateHash.apply(this, arguments);
}
function _getStateHash() {
    _getStateHash = _asyncToGenerator(regeneratorRuntime.mark(function _callee(param) {
        var name1, version1, subpath, stateToHash, importPath, deps, state, stateHash;
        return regeneratorRuntime.wrap(function _callee$(_ctx) {
            while(1)switch(_ctx.prev = _ctx.next){
                case 0:
                    name1 = param.name, version1 = param.version, subpath = param.subpath;
                    _ctx.next = 3;
                    return import("https://generator.jspm.io/src/statehash.js");
                case 3:
                    stateToHash = _ctx.sent.stateToHash;
                    importPath = "".concat(name1, "@").concat(version1).concat(subpath.slice(1));
                    deps = [
                        importPath,
                        !!subpath
                    ];
                    console.log("deps: ", JSON.stringify(deps));
                    state = {
                        name: "Untitled",
                        deps: deps,
                        env: {
                            development: true,
                            production: true,
                            browser: true,
                            node: false,
                            module: true,
                            deno: false
                        },
                        output: {
                            system: false,
                            boilerplate: true,
                            minify: false,
                            json: false,
                            integrity: false,
                            preload: false
                        }
                    };
                    console.table(state);
                    _ctx.next = 11;
                    return stateToHash(state);
                case 11:
                    stateHash = _ctx.sent;
                    console.log("stateHash", stateHash);
                    return _ctx.abrupt("return", stateHash);
                case 14:
                case "end":
                    return _ctx.stop();
            }
        }, _callee);
    }));
    return _getStateHash.apply(this, arguments);
}
if (typeof globalThis.document !== "undefined") {
    var mountElement = document.querySelector("jspm-package-aside-exports");
    var _dataset = mountElement.dataset, exports = _dataset.exports, name = _dataset.name, version = _dataset.version;
    var parsedExports = JSON.parse(exports);
    var exportHashesMap = {};
    var exportHashes = await Promise.all(parsedExports.map(function() {
        var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(subpath) {
            var stateHash;
            return regeneratorRuntime.wrap(function _callee$(_ctx) {
                while(1)switch(_ctx.prev = _ctx.next){
                    case 0:
                        _ctx.next = 2;
                        return getStateHash({
                            name: name,
                            version: version,
                            subpath: subpath
                        });
                    case 2:
                        stateHash = _ctx.sent;
                        console.log("stateHash: ", stateHash);
                        exportHashesMap[subpath] = "https://generator.jspm.io/".concat(stateHash);
                        return _ctx.abrupt("return", _defineProperty({}, subpath, "https://generator.jspm.io/".concat(stateHash)));
                    case 6:
                    case "end":
                        return _ctx.stop();
                }
            }, _callee);
        }));
        return function(subpath) {
            return _ref.apply(this, arguments);
        };
    }()));
    exportHashes.forEach(function(entry) {
        return Object.entries(entry);
    });
    hydrate(/*#__PURE__*/ h(Exports, {
        exports: parsedExports,
        name: name,
        version: version,
        exportHashes: exportHashesMap
    }), mountElement);
}


//# sourceMappingURL=dom-main.js.map