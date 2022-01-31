import regeneratorRuntime from "regenerator-runtime";
/** @jsx h */ import { serve } from "https://deno.land/std@0.121.0/http/server.ts";
import { h, Helmet, renderSSR } from "nano-jsx";
import dayjsEsm from "dayjs/esm";
import dayjsPluginRelativeTime from "dayjs/plugin/relativeTime";
import { Package } from "./lib/package.js";
import { Home } from "./lib/home.js";
import { pageServingHeaders, renderMarkdownContent } from "./utils.js";
import { FEATURED_PACKAGES } from "./lib/featured-packages-list.js";
import { features, parseURL } from "./lib/package-quality-check.js";
function _arrayLikeToArray(arr, len) {
    if (len == null || len > arr.length) len = arr.length;
    for(var i = 0, arr2 = new Array(len); i < len; i++)arr2[i] = arr[i];
    return arr2;
}
function _arrayWithHoles(arr) {
    if (Array.isArray(arr)) return arr;
}
function _arrayWithoutHoles(arr) {
    if (Array.isArray(arr)) return _arrayLikeToArray(arr);
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
function _iterableToArray(iter) {
    if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter);
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
function _nonIterableSpread() {
    throw new TypeError("Invalid attempt to spread non-iterable instance.\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _slicedToArray(arr, i) {
    return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest();
}
function _toConsumableArray(arr) {
    return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread();
}
function _unsupportedIterableToArray(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return _arrayLikeToArray(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(n);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
}
var ref;
var staticResources = {
    "/style.css": {
        path: "./style.css",
        contentType: "text/css; charset=utf-8"
    },
    "/dom-main.js": {
        path: "./lib/dom-main.js",
        contentType: "application/javascript; charset=utf-8"
    },
    "/dom-main.js.map": {
        path: "./lib/dom-main.js.map",
        contentType: "application/javascript; charset=utf-8"
    },
    "/statehash.js": {
        path: "./lib/statehash.js",
        contentType: "application/javascript; charset=utf-8"
    },
    "/statehash.js.map": {
        path: "./lib/statehash.js.map",
        contentType: "application/javascript; charset=utf-8"
    },
    "/header.js": {
        path: "./lib/header.js",
        contentType: "application/javascript; charset=utf-8"
    },
    "/header.js.map": {
        path: "./lib/header.js.map",
        contentType: "application/javascript; charset=utf-8"
    },
    "/exports.js": {
        path: "./lib/exports.js",
        contentType: "application/javascript; charset=utf-8"
    },
    "/exports.js.map": {
        path: "./lib/exports.js.map",
        contentType: "application/javascript; charset=utf-8"
    },
    "/hero.js": {
        path: "./lib/hero.js",
        contentType: "application/javascript; charset=utf-8"
    },
    "/hero.js.map": {
        path: "./lib/hero.js.map",
        contentType: "application/javascript; charset=utf-8"
    },
    "/generate-statehash.js": {
        path: "./lib/generate-statehash.js",
        contentType: "application/javascript; charset=utf-8"
    },
    "/generate-statehash.js.map": {
        path: "./lib/generate-statehash.js.map",
        contentType: "application/javascript; charset=utf-8"
    },
    "/logo.js": {
        path: "./lib/logo.js",
        contentType: "application/javascript; charset=utf-8"
    },
    "/logo.js.map": {
        path: "./lib/logo.js.map",
        contentType: "application/javascript; charset=utf-8"
    },
    "/search.js": {
        path: "./lib/search.js",
        contentType: "application/javascript; charset=utf-8"
    },
    "/search.js.map": {
        path: "./lib/search.js.map",
        contentType: "application/javascript; charset=utf-8"
    },
    "/nav.js": {
        path: "./lib/nav.js",
        contentType: "application/javascript; charset=utf-8"
    },
    "/nav.js.map": {
        path: "./lib/nav.js.map",
        contentType: "application/javascript; charset=utf-8"
    },
    "/importmap-generator.js": {
        path: "./lib/importmap-generator.js",
        contentType: "application/javascript; charset=utf-8"
    },
    "/importmap-generator.js.map": {
        path: "./lib/importmap-generator.js.map",
        contentType: "application/javascript; charset=utf-8"
    },
    "/imports-hash-store.js": {
        path: "./lib/imports-hash-store.js",
        contentType: "application/javascript; charset=utf-8"
    },
    "/icon-add.svg": {
        path: "./images/icon-add.svg",
        contentType: "image/svg+xml; charset=utf-8"
    },
    "/icon-check.svg": {
        path: "./images/icon-check.svg",
        contentType: "image/svg+xml; charset=utf-8"
    },
    "/icon-typescript-logo.svg": {
        path: "./images/icon-typescript-logo.svg",
        contentType: "image/svg+xml; charset=utf-8"
    },
    "/favicon.ico": {
        path: "./favicon.ico",
        contentType: "image/vnd.microsoft.icon"
    }
};
function generateHTML() {
    return _generateHTML.apply(this, arguments);
}
function _generateHTML() {
    _generateHTML = _asyncToGenerator(regeneratorRuntime.mark(function _callee() {
        var ref2, template, body, head, footer, content, ref1, START, AFTER_HEADER_BEFORE_CONTENT, DOM_SCRIPT, END, _args = arguments;
        return regeneratorRuntime.wrap(function _callee$(_ctx) {
            while(1)switch(_ctx.prev = _ctx.next){
                case 0:
                    ref2 = _args.length > 0 && _args[0] !== void 0 ? _args[0] : {
                        template: "./lib/shell.html"
                    }, template = ref2.template, body = ref2.body, head = ref2.head, footer = ref2.footer;
                    _ctx.next = 3;
                    return Deno.readTextFile(template);
                case 3:
                    content = _ctx.sent;
                    ref1 = _slicedToArray(content.split(/<!-- __[A-Z]*__ -->/i), 4), START = ref1[0], AFTER_HEADER_BEFORE_CONTENT = ref1[1], DOM_SCRIPT = ref1[2], END = ref1[3];
                    return _ctx.abrupt("return", [
                        START,
                        head.join("\n"),
                        AFTER_HEADER_BEFORE_CONTENT,
                        body,
                        DOM_SCRIPT,
                        footer.join("\n"),
                        END, 
                    ].join("\n"));
                case 6:
                case "end":
                    return _ctx.stop();
            }
        }, _callee);
    }));
    return _generateHTML.apply(this, arguments);
}
/**
 * @param {string} path
 * @returns {string}
 */ function removeLeadingSlash(path) {
    if (path.startsWith("/")) {
        return path.slice(1);
    }
    return path;
}
/**
 * @param {string} path
 * @returns {string}
 */ function removeTrailingSlash(path) {
    if (path.endsWith("/")) {
        return path.slice(0, -1);
    }
    return path;
}
/**
 * @param {string} path
 * @returns {string}
 */ function removeSlashes(path) {
    return removeTrailingSlash(removeLeadingSlash(path));
}
function requestHandler(request) {
    return _requestHandler.apply(this, arguments);
}
function _requestHandler() {
    _requestHandler = _asyncToGenerator(regeneratorRuntime.mark(function _callee(request) {
        var ref8, pathname, searchParams, NPM_PROVIDER_URL, npmPackage, npmPackageProbe, npmPackageVersion, pathSegments, staticResource, response, indexPage, ref3, body, head, footer, html, BASE_PATH, maybeReadmeFiles, ref4, packageName, baseURL, filesToFetch, ref5, jspmPackage, READMEFile, readmeFile1, packageJson, name, description, keywords, version, license, files, exports, types, type, homepage, repository, bugs, readmeFileContent, weeklyDownloadsResponse, downloads, packageMetaData, ref6, maintainers, readme, _time, createdISO, modified, updated, created, readmeHTML, filteredExport, links, app, ref7, body1, head1, footer1, html1;
        return regeneratorRuntime.wrap(function _callee$(_ctx) {
            while(1)switch(_ctx.prev = _ctx.next){
                case 0:
                    _ctx.prev = 0;
                    ref8 = new URL(request.url), pathname = ref8.pathname, searchParams = ref8.searchParams;
                    NPM_PROVIDER_URL = "https://ga.jspm.io/npm:";
                    npmPackage = searchParams.get("q");
                    if (!npmPackage) {
                        _ctx.next = 13;
                        break;
                    }
                    _ctx.next = 7;
                    return fetch("".concat(NPM_PROVIDER_URL).concat(npmPackage));
                case 7:
                    npmPackageProbe = _ctx.sent;
                    _ctx.next = 10;
                    return npmPackageProbe.text();
                case 10:
                    npmPackageVersion = _ctx.sent;
                    if (!npmPackageVersion) {
                        _ctx.next = 13;
                        break;
                    }
                    return _ctx.abrupt("return", new Response(npmPackage, {
                        status: 302,
                        headers: {
                            "Location": "/package/".concat(npmPackage, "@").concat(npmPackageVersion)
                        }
                    }));
                case 13:
                    pathSegments = removeSlashes(pathname).split("/");
                    staticResource = staticResources["/".concat(pathSegments[pathSegments.length - 1])];
                    if (!staticResource) {
                        _ctx.next = 20;
                        break;
                    }
                    _ctx.next = 18;
                    return Deno.readFile(staticResource.path);
                case 18:
                    response = _ctx.sent;
                    return _ctx.abrupt("return", new Response(response, {
                        headers: {
                            "content-type": staticResource.contentType
                        }
                    }));
                case 20:
                    if (!(pathname === "/")) {
                        _ctx.next = 27;
                        break;
                    }
                    indexPage = renderSSR(/*#__PURE__*/ h(Home, {
                        packages: FEATURED_PACKAGES
                    }));
                    ref3 = Helmet.SSR(indexPage), body = ref3.body, head = ref3.head, footer = ref3.footer;
                    _ctx.next = 25;
                    return generateHTML({
                        template: "./lib/shell.html",
                        body: body,
                        head: head,
                        footer: footer
                    });
                case 25:
                    html = _ctx.sent;
                    return _ctx.abrupt("return", new Response(html, {
                        headers: pageServingHeaders
                    }));
                case 27:
                    BASE_PATH = "/package/";
                    maybeReadmeFiles = [
                        "README.md",
                        "readme.md"
                    ];
                    if (!pathname.startsWith(BASE_PATH)) {
                        _ctx.next = 86;
                        break;
                    }
                    ref4 = _slicedToArray(pathname.split(BASE_PATH), 2), packageName = ref4[1];
                    if (!packageName) {
                        _ctx.next = 86;
                        break;
                    }
                    baseURL = "".concat(NPM_PROVIDER_URL).concat(packageName);
                    filesToFetch = [
                        "package.json"
                    ].concat(_toConsumableArray(maybeReadmeFiles));
                    _ctx.t0 = _slicedToArray;
                    _ctx.next = 37;
                    return Promise.all(filesToFetch.map(function(file) {
                        return fetch("".concat(baseURL, "/").concat(file));
                    }));
                case 37:
                    _ctx.t1 = _ctx.sent;
                    ref5 = (0, _ctx.t0)(_ctx.t1, 3);
                    jspmPackage = ref5[0];
                    READMEFile = ref5[1];
                    readmeFile1 = ref5[2];
                    _ctx.next = 44;
                    return jspmPackage.json();
                case 44:
                    packageJson = _ctx.sent;
                    name = packageJson.name, description = packageJson.description, keywords = packageJson.keywords, version = packageJson.version, license = packageJson.license, files = packageJson.files, exports = packageJson.exports, types = packageJson.types, type = packageJson.type, homepage = packageJson.homepage, repository = packageJson.repository, bugs = packageJson.bugs;
                    _ctx.next = 48;
                    return [
                        READMEFile,
                        readmeFile1
                    ].find(function(readmeFile) {
                        return readmeFile.status === 200 || readmeFile.status === 304;
                    }).text();
                case 48:
                    readmeFileContent = _ctx.sent;
                    _ctx.next = 51;
                    return fetch("https://api.npmjs.org/downloads/point/last-week/".concat(name));
                case 51:
                    weeklyDownloadsResponse = _ctx.sent;
                    _ctx.next = 54;
                    return weeklyDownloadsResponse.json();
                case 54:
                    downloads = _ctx.sent.downloads;
                    _ctx.next = 57;
                    return fetch("https://registry.npmjs.org/".concat(name));
                case 57:
                    packageMetaData = _ctx.sent;
                    _ctx.next = 60;
                    return packageMetaData.json();
                case 60:
                    ref6 = _ctx.sent;
                    maintainers = ref6.maintainers;
                    readme = ref6.readme;
                    _time = ref6.time;
                    createdISO = _time.created;
                    modified = _time.modified;
                    dayjsEsm.extend(dayjsPluginRelativeTime);
                    updated = dayjsEsm(modified).fromNow();
                    created = dayjsEsm(createdISO).fromNow();
                    _ctx.prev = 69;
                    readmeHTML = renderMarkdownContent(readmeFileContent || readme);
                    filteredExport = Object.keys(exports).filter(function(expt) {
                        return !expt.endsWith("!cjs") && !expt.endsWith("/") && expt.indexOf("*") === -1;
                    }).sort();
                    links = {
                        homepage: homepage,
                        repository: parseURL(repository),
                        issues: parseURL(bugs)
                    };
                    app = renderSSR(/*#__PURE__*/ h(Package, {
                        name: name,
                        description: description,
                        version: version,
                        homepage: homepage,
                        license: license,
                        files: files,
                        exports: filteredExport,
                        readme: readmeHTML,
                        keywords: keywords,
                        downloads: downloads,
                        created: created,
                        updated: updated,
                        type: type,
                        types: types,
                        features: features(packageJson),
                        links: links,
                        maintainers: maintainers
                    }));
                    ref7 = Helmet.SSR(app), body1 = ref7.body, head1 = ref7.head, footer1 = ref7.footer;
                    _ctx.next = 77;
                    return generateHTML({
                        template: "./lib/shell.html",
                        body: body1,
                        head: head1,
                        footer: footer1
                    });
                case 77:
                    html1 = _ctx.sent;
                    return _ctx.abrupt("return", new Response(html1, {
                        headers: pageServingHeaders
                    }));
                case 81:
                    _ctx.prev = 81;
                    _ctx.t2 = _ctx["catch"](69);
                    console.error("Failed in generating package-page ".concat(name, "@").concat(version));
                    console.error(_ctx.t2);
                    return _ctx.abrupt("return", new Response("500", {
                        status: 500
                    }));
                case 86:
                    return _ctx.abrupt("return", new Response("404", {
                        status: 404
                    }));
                case 89:
                    _ctx.prev = 89;
                    _ctx.t3 = _ctx["catch"](0);
                    return _ctx.abrupt("return", new Response(_ctx.t3.message || _ctx.t3.toString(), {
                        status: 500
                    }));
                case 92:
                case "end":
                    return _ctx.stop();
            }
        }, _callee, null, [
            [
                0,
                89
            ],
            [
                69,
                81
            ]
        ]);
    }));
    return _requestHandler.apply(this, arguments);
}
if ((ref = import.meta) === null || ref === void 0 ? void 0 : ref.main) {
    var timestamp = Date.now();
    var humanReadableDateTime = new Intl.DateTimeFormat("default", {
        dateStyle: "full",
        timeStyle: "long"
    }).format(timestamp);
    console.log("Current Date: ", humanReadableDateTime);
    console.info("Server Listening on http://localhost:8000");
    serve(requestHandler);
}


//# sourceMappingURL=server.js.map