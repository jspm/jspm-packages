import regeneratorRuntime from "regenerator-runtime";
/** @jsx h */ import { h, hydrate } from "nano-jsx";
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
function hydrateHero() {
    return _hydrateHero.apply(this, arguments);
}
function _hydrateHero() {
    _hydrateHero = _asyncToGenerator(regeneratorRuntime.mark(function _callee() {
        var mountElement, _dataset, exports, name, version, description, updated, types, parsedExports, Hero;
        return regeneratorRuntime.wrap(function _callee$(_ctx) {
            while(1)switch(_ctx.prev = _ctx.next){
                case 0:
                    mountElement = document.querySelector("jspm-package-hero");
                    if (!mountElement) {
                        _ctx.next = 8;
                        break;
                    }
                    _dataset = mountElement.dataset, exports = _dataset.exports, name = _dataset.name, version = _dataset.version, description = _dataset.description, updated = _dataset.updated, types = _dataset.types;
                    parsedExports = exports ? JSON.parse(exports) : [];
                    _ctx.next = 6;
                    return import("./hero.js");
                case 6:
                    Hero = _ctx.sent.Hero;
                    hydrate(/*#__PURE__*/ h(Hero, {
                        exports: parsedExports,
                        name: name,
                        version: version,
                        description: description,
                        updated: updated,
                        types: types
                    }), mountElement);
                case 8:
                case "end":
                    return _ctx.stop();
            }
        }, _callee);
    }));
    return _hydrateHero.apply(this, arguments);
}
function hydrateExports() {
    return _hydrateExports.apply(this, arguments);
}
function _hydrateExports() {
    _hydrateExports = _asyncToGenerator(regeneratorRuntime.mark(function _callee() {
        var mountElement, _dataset, exports, name, version, parsedExports, Exports;
        return regeneratorRuntime.wrap(function _callee$(_ctx) {
            while(1)switch(_ctx.prev = _ctx.next){
                case 0:
                    mountElement = document.querySelector("jspm-aside-exports");
                    if (!mountElement) {
                        _ctx.next = 8;
                        break;
                    }
                    _dataset = mountElement.dataset, exports = _dataset.exports, name = _dataset.name, version = _dataset.version;
                    parsedExports = exports ? JSON.parse(exports) : [];
                    _ctx.next = 6;
                    return import("./exports.js");
                case 6:
                    Exports = _ctx.sent.Exports;
                    hydrate(/*#__PURE__*/ h(Exports, {
                        exports: parsedExports,
                        name: name,
                        version: version
                    }), mountElement);
                case 8:
                case "end":
                    return _ctx.stop();
            }
        }, _callee);
    }));
    return _hydrateExports.apply(this, arguments);
}
function hydratePackage() {
    return _hydratePackage.apply(this, arguments);
}
function _hydratePackage() {
    _hydratePackage = _asyncToGenerator(regeneratorRuntime.mark(function _callee() {
        var mountElement, _dataset, exports, name, version, parsedExports, Package;
        return regeneratorRuntime.wrap(function _callee$(_ctx) {
            while(1)switch(_ctx.prev = _ctx.next){
                case 0:
                    mountElement = document.querySelector("jspm-package");
                    if (!mountElement) {
                        _ctx.next = 8;
                        break;
                    }
                    _dataset = mountElement.dataset, exports = _dataset.exports, name = _dataset.name, version = _dataset.version;
                    parsedExports = exports ? JSON.parse(exports) : [];
                    _ctx.next = 6;
                    return import("./package.js");
                case 6:
                    Package = _ctx.sent.Package;
                    hydrate(/*#__PURE__*/ h(Package, {
                        exports: parsedExports,
                        name: name,
                        version: version
                    }), mountElement);
                case 8:
                case "end":
                    return _ctx.stop();
            }
        }, _callee);
    }));
    return _hydratePackage.apply(this, arguments);
}
if (typeof globalThis.document !== "undefined") {
    hydrateHero();
}


//# sourceMappingURL=dom-main.js.map