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
/** @jsx h */ import { h, hydrate } from "nano-jsx";
function hydrateHero() {
    return _hydrateHero.apply(this, arguments);
}
function _hydrateHero() {
    _hydrateHero = _asyncToGenerator(function*() {
        const mountElement = document.querySelector("jspm-package-hero");
        if (mountElement) {
            const { exports , name , version , description , updated , types  } = mountElement.dataset;
            const parsedExports = exports ? JSON.parse(exports) : [];
            const { Hero  } = yield import("./hero.js");
            hydrate(/*#__PURE__*/ h(Hero, {
                exports: parsedExports,
                name: name,
                version: version,
                description: description,
                updated: updated,
                types: types
            }), mountElement);
        }
    });
    return _hydrateHero.apply(this, arguments);
}
function hydrateExports() {
    return _hydrateExports.apply(this, arguments);
}
function _hydrateExports() {
    _hydrateExports = _asyncToGenerator(function*() {
        const mountElement = document.querySelector("jspm-aside-exports");
        if (mountElement) {
            const { exports , name , version  } = mountElement.dataset;
            const parsedExports = exports ? JSON.parse(exports) : [];
            const { Exports  } = yield import("./exports.js");
            hydrate(/*#__PURE__*/ h(Exports, {
                exports: parsedExports,
                name: name,
                version: version
            }), mountElement);
        }
    });
    return _hydrateExports.apply(this, arguments);
}
function hydrateRoot() {
    return _hydrateRoot.apply(this, arguments);
}
function _hydrateRoot() {
    _hydrateRoot = _asyncToGenerator(function*() {
        const mountElement = document.querySelector("jspm-package-root");
        if (mountElement) {
            const { exports , name , version , features , links , maintainers , readme  } = mountElement.dataset;
            const parsedExports = exports ? JSON.parse(exports) : [];
            const { DomRoot  } = yield import("./dom-root.js");
            hydrate(/*#__PURE__*/ h(DomRoot, {
                name: name,
                version: version,
                exports: parsedExports,
                features: JSON.parse(features),
                links: JSON.parse(links),
                maintainers: JSON.parse(maintainers),
                readme: readme
            }), mountElement);
        }
    });
    return _hydrateRoot.apply(this, arguments);
}
if (typeof globalThis.document !== "undefined") {
    hydrateRoot();
}


//# sourceMappingURL=dom-main.js.map