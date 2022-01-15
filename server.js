function delay(ms, options = {
}) {
    const { signal  } = options;
    if (signal?.aborted) {
        return Promise.reject(new DOMException("Delay was aborted.", "AbortError"));
    }
    return new Promise((resolve3, reject)=>{
        const abort = ()=>{
            clearTimeout(i2);
            reject(new DOMException("Delay was aborted.", "AbortError"));
        };
        const done = ()=>{
            signal?.removeEventListener("abort", abort);
            resolve3();
        };
        const i2 = setTimeout(done, ms);
        signal?.addEventListener("abort", abort, {
            once: true
        });
    });
}
const ERROR_SERVER_CLOSED = "Server closed";
const INITIAL_ACCEPT_BACKOFF_DELAY = 5;
const MAX_ACCEPT_BACKOFF_DELAY = 1000;
class Server {
    #port;
    #host;
    #handler;
    #closed = false;
    #listeners = new Set();
    #httpConnections = new Set();
    #onError;
    constructor(serverInit){
        this.#port = serverInit.port;
        this.#host = serverInit.hostname;
        this.#handler = serverInit.handler;
        this.#onError = serverInit.onError ?? function(error) {
            console.error(error);
            return new Response("Internal Server Error", {
                status: 500
            });
        };
    }
    async serve(listener) {
        if (this.#closed) {
            throw new Deno.errors.Http(ERROR_SERVER_CLOSED);
        }
        this.#trackListener(listener);
        try {
            return await this.#accept(listener);
        } finally{
            this.#untrackListener(listener);
            try {
                listener.close();
            } catch  {
            }
        }
    }
    async listenAndServe() {
        if (this.#closed) {
            throw new Deno.errors.Http(ERROR_SERVER_CLOSED);
        }
        const listener = Deno.listen({
            port: this.#port ?? 80,
            hostname: this.#host ?? "0.0.0.0",
            transport: "tcp"
        });
        return await this.serve(listener);
    }
    async listenAndServeTls(certFile, keyFile) {
        if (this.#closed) {
            throw new Deno.errors.Http(ERROR_SERVER_CLOSED);
        }
        const listener = Deno.listenTls({
            port: this.#port ?? 443,
            hostname: this.#host ?? "0.0.0.0",
            certFile,
            keyFile,
            transport: "tcp"
        });
        return await this.serve(listener);
    }
    close() {
        if (this.#closed) {
            throw new Deno.errors.Http(ERROR_SERVER_CLOSED);
        }
        this.#closed = true;
        for (const listener of this.#listeners){
            try {
                listener.close();
            } catch  {
            }
        }
        this.#listeners.clear();
        for (const httpConn of this.#httpConnections){
            this.#closeHttpConn(httpConn);
        }
        this.#httpConnections.clear();
    }
    get closed() {
        return this.#closed;
    }
    get addrs() {
        return Array.from(this.#listeners).map((listener)=>listener.addr
        );
    }
    async #respond(requestEvent, httpConn, connInfo) {
        let response;
        try {
            response = await this.#handler(requestEvent.request, connInfo);
        } catch (error) {
            response = await this.#onError(error);
        }
        try {
            await requestEvent.respondWith(response);
        } catch  {
            return this.#closeHttpConn(httpConn);
        }
    }
    async #serveHttp(httpConn1, connInfo1) {
        while(!this.#closed){
            let requestEvent;
            try {
                requestEvent = await httpConn1.nextRequest();
            } catch  {
                break;
            }
            if (requestEvent === null) {
                break;
            }
            this.#respond(requestEvent, httpConn1, connInfo1);
        }
        this.#closeHttpConn(httpConn1);
    }
    async #accept(listener) {
        let acceptBackoffDelay;
        while(!this.#closed){
            let conn;
            try {
                conn = await listener.accept();
            } catch (error) {
                if (error instanceof Deno.errors.BadResource || error instanceof Deno.errors.InvalidData || error instanceof Deno.errors.UnexpectedEof || error instanceof Deno.errors.ConnectionReset || error instanceof Deno.errors.NotConnected) {
                    if (!acceptBackoffDelay) {
                        acceptBackoffDelay = INITIAL_ACCEPT_BACKOFF_DELAY;
                    } else {
                        acceptBackoffDelay *= 2;
                    }
                    if (acceptBackoffDelay >= 1000) {
                        acceptBackoffDelay = MAX_ACCEPT_BACKOFF_DELAY;
                    }
                    await delay(acceptBackoffDelay);
                    continue;
                }
                throw error;
            }
            acceptBackoffDelay = undefined;
            let httpConn;
            try {
                httpConn = Deno.serveHttp(conn);
            } catch  {
                continue;
            }
            this.#trackHttpConnection(httpConn);
            const connInfo = {
                localAddr: conn.localAddr,
                remoteAddr: conn.remoteAddr
            };
            this.#serveHttp(httpConn, connInfo);
        }
    }
     #closeHttpConn(httpConn2) {
        this.#untrackHttpConnection(httpConn2);
        try {
            httpConn2.close();
        } catch  {
        }
    }
     #trackListener(listener1) {
        this.#listeners.add(listener1);
    }
     #untrackListener(listener2) {
        this.#listeners.delete(listener2);
    }
     #trackHttpConnection(httpConn3) {
        this.#httpConnections.add(httpConn3);
    }
     #untrackHttpConnection(httpConn4) {
        this.#httpConnections.delete(httpConn4);
    }
}
async function serve(handler, options = {
}) {
    const server = new Server({
        port: options.port ?? 8000,
        hostname: options.hostname ?? "0.0.0.0",
        handler,
        onError: options.onError
    });
    if (options?.signal) {
        options.signal.onabort = ()=>server.close()
        ;
    }
    return await server.listenAndServe();
}
const osType = (()=>{
    const { Deno  } = globalThis;
    if (typeof Deno?.build?.os === "string") {
        return Deno.build.os;
    }
    const { navigator  } = globalThis;
    if (navigator?.appVersion?.includes?.("Win") ?? false) {
        return "windows";
    }
    return "linux";
})();
const isWindows = osType === "windows";
const CHAR_FORWARD_SLASH = 47;
function assertPath(path2) {
    if (typeof path2 !== "string") {
        throw new TypeError(`Path must be a string. Received ${JSON.stringify(path2)}`);
    }
}
function isPosixPathSeparator(code) {
    return code === 47;
}
function isPathSeparator(code) {
    return isPosixPathSeparator(code) || code === 92;
}
function isWindowsDeviceRoot(code) {
    return code >= 97 && code <= 122 || code >= 65 && code <= 90;
}
function normalizeString(path3, allowAboveRoot, separator, isPathSeparator1) {
    let res = "";
    let lastSegmentLength = 0;
    let lastSlash = -1;
    let dots = 0;
    let code;
    for(let i3 = 0, len = path3.length; i3 <= len; ++i3){
        if (i3 < len) code = path3.charCodeAt(i3);
        else if (isPathSeparator1(code)) break;
        else code = CHAR_FORWARD_SLASH;
        if (isPathSeparator1(code)) {
            if (lastSlash === i3 - 1 || dots === 1) {
            } else if (lastSlash !== i3 - 1 && dots === 2) {
                if (res.length < 2 || lastSegmentLength !== 2 || res.charCodeAt(res.length - 1) !== 46 || res.charCodeAt(res.length - 2) !== 46) {
                    if (res.length > 2) {
                        const lastSlashIndex = res.lastIndexOf(separator);
                        if (lastSlashIndex === -1) {
                            res = "";
                            lastSegmentLength = 0;
                        } else {
                            res = res.slice(0, lastSlashIndex);
                            lastSegmentLength = res.length - 1 - res.lastIndexOf(separator);
                        }
                        lastSlash = i3;
                        dots = 0;
                        continue;
                    } else if (res.length === 2 || res.length === 1) {
                        res = "";
                        lastSegmentLength = 0;
                        lastSlash = i3;
                        dots = 0;
                        continue;
                    }
                }
                if (allowAboveRoot) {
                    if (res.length > 0) res += `${separator}..`;
                    else res = "..";
                    lastSegmentLength = 2;
                }
            } else {
                if (res.length > 0) res += separator + path3.slice(lastSlash + 1, i3);
                else res = path3.slice(lastSlash + 1, i3);
                lastSegmentLength = i3 - lastSlash - 1;
            }
            lastSlash = i3;
            dots = 0;
        } else if (code === 46 && dots !== -1) {
            ++dots;
        } else {
            dots = -1;
        }
    }
    return res;
}
function _format(sep3, pathObject) {
    const dir = pathObject.dir || pathObject.root;
    const base = pathObject.base || (pathObject.name || "") + (pathObject.ext || "");
    if (!dir) return base;
    if (dir === pathObject.root) return dir + base;
    return dir + sep3 + base;
}
const WHITESPACE_ENCODINGS = {
    "\u0009": "%09",
    "\u000A": "%0A",
    "\u000B": "%0B",
    "\u000C": "%0C",
    "\u000D": "%0D",
    "\u0020": "%20"
};
function encodeWhitespace(string) {
    return string.replaceAll(/[\s]/g, (c2)=>{
        return WHITESPACE_ENCODINGS[c2] ?? c2;
    });
}
class DenoStdInternalError extends Error {
    constructor(message){
        super(message);
        this.name = "DenoStdInternalError";
    }
}
function assert(expr, msg = "") {
    if (!expr) {
        throw new DenoStdInternalError(msg);
    }
}
const sep = "\\";
const delimiter = ";";
function resolve(...pathSegments) {
    let resolvedDevice = "";
    let resolvedTail = "";
    let resolvedAbsolute = false;
    for(let i4 = pathSegments.length - 1; i4 >= -1; i4--){
        let path4;
        const { Deno  } = globalThis;
        if (i4 >= 0) {
            path4 = pathSegments[i4];
        } else if (!resolvedDevice) {
            if (typeof Deno?.cwd !== "function") {
                throw new TypeError("Resolved a drive-letter-less path without a CWD.");
            }
            path4 = Deno.cwd();
        } else {
            if (typeof Deno?.env?.get !== "function" || typeof Deno?.cwd !== "function") {
                throw new TypeError("Resolved a relative path without a CWD.");
            }
            path4 = Deno.cwd();
            if (path4 === undefined || path4.slice(0, 3).toLowerCase() !== `${resolvedDevice.toLowerCase()}\\`) {
                path4 = `${resolvedDevice}\\`;
            }
        }
        assertPath(path4);
        const len = path4.length;
        if (len === 0) continue;
        let rootEnd = 0;
        let device = "";
        let isAbsolute1 = false;
        const code = path4.charCodeAt(0);
        if (len > 1) {
            if (isPathSeparator(code)) {
                isAbsolute1 = true;
                if (isPathSeparator(path4.charCodeAt(1))) {
                    let j1 = 2;
                    let last = j1;
                    for(; j1 < len; ++j1){
                        if (isPathSeparator(path4.charCodeAt(j1))) break;
                    }
                    if (j1 < len && j1 !== last) {
                        const firstPart = path4.slice(last, j1);
                        last = j1;
                        for(; j1 < len; ++j1){
                            if (!isPathSeparator(path4.charCodeAt(j1))) break;
                        }
                        if (j1 < len && j1 !== last) {
                            last = j1;
                            for(; j1 < len; ++j1){
                                if (isPathSeparator(path4.charCodeAt(j1))) break;
                            }
                            if (j1 === len) {
                                device = `\\\\${firstPart}\\${path4.slice(last)}`;
                                rootEnd = j1;
                            } else if (j1 !== last) {
                                device = `\\\\${firstPart}\\${path4.slice(last, j1)}`;
                                rootEnd = j1;
                            }
                        }
                    }
                } else {
                    rootEnd = 1;
                }
            } else if (isWindowsDeviceRoot(code)) {
                if (path4.charCodeAt(1) === 58) {
                    device = path4.slice(0, 2);
                    rootEnd = 2;
                    if (len > 2) {
                        if (isPathSeparator(path4.charCodeAt(2))) {
                            isAbsolute1 = true;
                            rootEnd = 3;
                        }
                    }
                }
            }
        } else if (isPathSeparator(code)) {
            rootEnd = 1;
            isAbsolute1 = true;
        }
        if (device.length > 0 && resolvedDevice.length > 0 && device.toLowerCase() !== resolvedDevice.toLowerCase()) {
            continue;
        }
        if (resolvedDevice.length === 0 && device.length > 0) {
            resolvedDevice = device;
        }
        if (!resolvedAbsolute) {
            resolvedTail = `${path4.slice(rootEnd)}\\${resolvedTail}`;
            resolvedAbsolute = isAbsolute1;
        }
        if (resolvedAbsolute && resolvedDevice.length > 0) break;
    }
    resolvedTail = normalizeString(resolvedTail, !resolvedAbsolute, "\\", isPathSeparator);
    return resolvedDevice + (resolvedAbsolute ? "\\" : "") + resolvedTail || ".";
}
function normalize(path5) {
    assertPath(path5);
    const len = path5.length;
    if (len === 0) return ".";
    let rootEnd = 0;
    let device;
    let isAbsolute2 = false;
    const code = path5.charCodeAt(0);
    if (len > 1) {
        if (isPathSeparator(code)) {
            isAbsolute2 = true;
            if (isPathSeparator(path5.charCodeAt(1))) {
                let j2 = 2;
                let last = j2;
                for(; j2 < len; ++j2){
                    if (isPathSeparator(path5.charCodeAt(j2))) break;
                }
                if (j2 < len && j2 !== last) {
                    const firstPart = path5.slice(last, j2);
                    last = j2;
                    for(; j2 < len; ++j2){
                        if (!isPathSeparator(path5.charCodeAt(j2))) break;
                    }
                    if (j2 < len && j2 !== last) {
                        last = j2;
                        for(; j2 < len; ++j2){
                            if (isPathSeparator(path5.charCodeAt(j2))) break;
                        }
                        if (j2 === len) {
                            return `\\\\${firstPart}\\${path5.slice(last)}\\`;
                        } else if (j2 !== last) {
                            device = `\\\\${firstPart}\\${path5.slice(last, j2)}`;
                            rootEnd = j2;
                        }
                    }
                }
            } else {
                rootEnd = 1;
            }
        } else if (isWindowsDeviceRoot(code)) {
            if (path5.charCodeAt(1) === 58) {
                device = path5.slice(0, 2);
                rootEnd = 2;
                if (len > 2) {
                    if (isPathSeparator(path5.charCodeAt(2))) {
                        isAbsolute2 = true;
                        rootEnd = 3;
                    }
                }
            }
        }
    } else if (isPathSeparator(code)) {
        return "\\";
    }
    let tail;
    if (rootEnd < len) {
        tail = normalizeString(path5.slice(rootEnd), !isAbsolute2, "\\", isPathSeparator);
    } else {
        tail = "";
    }
    if (tail.length === 0 && !isAbsolute2) tail = ".";
    if (tail.length > 0 && isPathSeparator(path5.charCodeAt(len - 1))) {
        tail += "\\";
    }
    if (device === undefined) {
        if (isAbsolute2) {
            if (tail.length > 0) return `\\${tail}`;
            else return "\\";
        } else if (tail.length > 0) {
            return tail;
        } else {
            return "";
        }
    } else if (isAbsolute2) {
        if (tail.length > 0) return `${device}\\${tail}`;
        else return `${device}\\`;
    } else if (tail.length > 0) {
        return device + tail;
    } else {
        return device;
    }
}
function isAbsolute(path6) {
    assertPath(path6);
    const len = path6.length;
    if (len === 0) return false;
    const code = path6.charCodeAt(0);
    if (isPathSeparator(code)) {
        return true;
    } else if (isWindowsDeviceRoot(code)) {
        if (len > 2 && path6.charCodeAt(1) === 58) {
            if (isPathSeparator(path6.charCodeAt(2))) return true;
        }
    }
    return false;
}
function join(...paths) {
    const pathsCount = paths.length;
    if (pathsCount === 0) return ".";
    let joined;
    let firstPart = null;
    for(let i5 = 0; i5 < pathsCount; ++i5){
        const path7 = paths[i5];
        assertPath(path7);
        if (path7.length > 0) {
            if (joined === undefined) joined = firstPart = path7;
            else joined += `\\${path7}`;
        }
    }
    if (joined === undefined) return ".";
    let needsReplace = true;
    let slashCount = 0;
    assert(firstPart != null);
    if (isPathSeparator(firstPart.charCodeAt(0))) {
        ++slashCount;
        const firstLen = firstPart.length;
        if (firstLen > 1) {
            if (isPathSeparator(firstPart.charCodeAt(1))) {
                ++slashCount;
                if (firstLen > 2) {
                    if (isPathSeparator(firstPart.charCodeAt(2))) ++slashCount;
                    else {
                        needsReplace = false;
                    }
                }
            }
        }
    }
    if (needsReplace) {
        for(; slashCount < joined.length; ++slashCount){
            if (!isPathSeparator(joined.charCodeAt(slashCount))) break;
        }
        if (slashCount >= 2) joined = `\\${joined.slice(slashCount)}`;
    }
    return normalize(joined);
}
function relative(from, to1) {
    assertPath(from);
    assertPath(to1);
    if (from === to1) return "";
    const fromOrig = resolve(from);
    const toOrig = resolve(to1);
    if (fromOrig === toOrig) return "";
    from = fromOrig.toLowerCase();
    to1 = toOrig.toLowerCase();
    if (from === to1) return "";
    let fromStart = 0;
    let fromEnd = from.length;
    for(; fromStart < fromEnd; ++fromStart){
        if (from.charCodeAt(fromStart) !== 92) break;
    }
    for(; fromEnd - 1 > fromStart; --fromEnd){
        if (from.charCodeAt(fromEnd - 1) !== 92) break;
    }
    const fromLen = fromEnd - fromStart;
    let toStart = 0;
    let toEnd = to1.length;
    for(; toStart < toEnd; ++toStart){
        if (to1.charCodeAt(toStart) !== 92) break;
    }
    for(; toEnd - 1 > toStart; --toEnd){
        if (to1.charCodeAt(toEnd - 1) !== 92) break;
    }
    const toLen = toEnd - toStart;
    const length = fromLen < toLen ? fromLen : toLen;
    let lastCommonSep = -1;
    let i6 = 0;
    for(; i6 <= length; ++i6){
        if (i6 === length) {
            if (toLen > length) {
                if (to1.charCodeAt(toStart + i6) === 92) {
                    return toOrig.slice(toStart + i6 + 1);
                } else if (i6 === 2) {
                    return toOrig.slice(toStart + i6);
                }
            }
            if (fromLen > length) {
                if (from.charCodeAt(fromStart + i6) === 92) {
                    lastCommonSep = i6;
                } else if (i6 === 2) {
                    lastCommonSep = 3;
                }
            }
            break;
        }
        const fromCode = from.charCodeAt(fromStart + i6);
        const toCode = to1.charCodeAt(toStart + i6);
        if (fromCode !== toCode) break;
        else if (fromCode === 92) lastCommonSep = i6;
    }
    if (i6 !== length && lastCommonSep === -1) {
        return toOrig;
    }
    let out = "";
    if (lastCommonSep === -1) lastCommonSep = 0;
    for(i6 = fromStart + lastCommonSep + 1; i6 <= fromEnd; ++i6){
        if (i6 === fromEnd || from.charCodeAt(i6) === 92) {
            if (out.length === 0) out += "..";
            else out += "\\..";
        }
    }
    if (out.length > 0) {
        return out + toOrig.slice(toStart + lastCommonSep, toEnd);
    } else {
        toStart += lastCommonSep;
        if (toOrig.charCodeAt(toStart) === 92) ++toStart;
        return toOrig.slice(toStart, toEnd);
    }
}
function toNamespacedPath(path8) {
    if (typeof path8 !== "string") return path8;
    if (path8.length === 0) return "";
    const resolvedPath = resolve(path8);
    if (resolvedPath.length >= 3) {
        if (resolvedPath.charCodeAt(0) === 92) {
            if (resolvedPath.charCodeAt(1) === 92) {
                const code = resolvedPath.charCodeAt(2);
                if (code !== 63 && code !== 46) {
                    return `\\\\?\\UNC\\${resolvedPath.slice(2)}`;
                }
            }
        } else if (isWindowsDeviceRoot(resolvedPath.charCodeAt(0))) {
            if (resolvedPath.charCodeAt(1) === 58 && resolvedPath.charCodeAt(2) === 92) {
                return `\\\\?\\${resolvedPath}`;
            }
        }
    }
    return path8;
}
function dirname(path9) {
    assertPath(path9);
    const len = path9.length;
    if (len === 0) return ".";
    let rootEnd = -1;
    let end = -1;
    let matchedSlash = true;
    let offset = 0;
    const code = path9.charCodeAt(0);
    if (len > 1) {
        if (isPathSeparator(code)) {
            rootEnd = offset = 1;
            if (isPathSeparator(path9.charCodeAt(1))) {
                let j3 = 2;
                let last = j3;
                for(; j3 < len; ++j3){
                    if (isPathSeparator(path9.charCodeAt(j3))) break;
                }
                if (j3 < len && j3 !== last) {
                    last = j3;
                    for(; j3 < len; ++j3){
                        if (!isPathSeparator(path9.charCodeAt(j3))) break;
                    }
                    if (j3 < len && j3 !== last) {
                        last = j3;
                        for(; j3 < len; ++j3){
                            if (isPathSeparator(path9.charCodeAt(j3))) break;
                        }
                        if (j3 === len) {
                            return path9;
                        }
                        if (j3 !== last) {
                            rootEnd = offset = j3 + 1;
                        }
                    }
                }
            }
        } else if (isWindowsDeviceRoot(code)) {
            if (path9.charCodeAt(1) === 58) {
                rootEnd = offset = 2;
                if (len > 2) {
                    if (isPathSeparator(path9.charCodeAt(2))) rootEnd = offset = 3;
                }
            }
        }
    } else if (isPathSeparator(code)) {
        return path9;
    }
    for(let i7 = len - 1; i7 >= offset; --i7){
        if (isPathSeparator(path9.charCodeAt(i7))) {
            if (!matchedSlash) {
                end = i7;
                break;
            }
        } else {
            matchedSlash = false;
        }
    }
    if (end === -1) {
        if (rootEnd === -1) return ".";
        else end = rootEnd;
    }
    return path9.slice(0, end);
}
function basename(path10, ext = "") {
    if (ext !== undefined && typeof ext !== "string") {
        throw new TypeError('"ext" argument must be a string');
    }
    assertPath(path10);
    let start = 0;
    let end = -1;
    let matchedSlash = true;
    let i8;
    if (path10.length >= 2) {
        const drive = path10.charCodeAt(0);
        if (isWindowsDeviceRoot(drive)) {
            if (path10.charCodeAt(1) === 58) start = 2;
        }
    }
    if (ext !== undefined && ext.length > 0 && ext.length <= path10.length) {
        if (ext.length === path10.length && ext === path10) return "";
        let extIdx = ext.length - 1;
        let firstNonSlashEnd = -1;
        for(i8 = path10.length - 1; i8 >= start; --i8){
            const code = path10.charCodeAt(i8);
            if (isPathSeparator(code)) {
                if (!matchedSlash) {
                    start = i8 + 1;
                    break;
                }
            } else {
                if (firstNonSlashEnd === -1) {
                    matchedSlash = false;
                    firstNonSlashEnd = i8 + 1;
                }
                if (extIdx >= 0) {
                    if (code === ext.charCodeAt(extIdx)) {
                        if (--extIdx === -1) {
                            end = i8;
                        }
                    } else {
                        extIdx = -1;
                        end = firstNonSlashEnd;
                    }
                }
            }
        }
        if (start === end) end = firstNonSlashEnd;
        else if (end === -1) end = path10.length;
        return path10.slice(start, end);
    } else {
        for(i8 = path10.length - 1; i8 >= start; --i8){
            if (isPathSeparator(path10.charCodeAt(i8))) {
                if (!matchedSlash) {
                    start = i8 + 1;
                    break;
                }
            } else if (end === -1) {
                matchedSlash = false;
                end = i8 + 1;
            }
        }
        if (end === -1) return "";
        return path10.slice(start, end);
    }
}
function extname(path11) {
    assertPath(path11);
    let start = 0;
    let startDot = -1;
    let startPart = 0;
    let end = -1;
    let matchedSlash = true;
    let preDotState = 0;
    if (path11.length >= 2 && path11.charCodeAt(1) === 58 && isWindowsDeviceRoot(path11.charCodeAt(0))) {
        start = startPart = 2;
    }
    for(let i9 = path11.length - 1; i9 >= start; --i9){
        const code = path11.charCodeAt(i9);
        if (isPathSeparator(code)) {
            if (!matchedSlash) {
                startPart = i9 + 1;
                break;
            }
            continue;
        }
        if (end === -1) {
            matchedSlash = false;
            end = i9 + 1;
        }
        if (code === 46) {
            if (startDot === -1) startDot = i9;
            else if (preDotState !== 1) preDotState = 1;
        } else if (startDot !== -1) {
            preDotState = -1;
        }
    }
    if (startDot === -1 || end === -1 || preDotState === 0 || preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
        return "";
    }
    return path11.slice(startDot, end);
}
function format(pathObject) {
    if (pathObject === null || typeof pathObject !== "object") {
        throw new TypeError(`The "pathObject" argument must be of type Object. Received type ${typeof pathObject}`);
    }
    return _format("\\", pathObject);
}
function parse(path12) {
    assertPath(path12);
    const ret = {
        root: "",
        dir: "",
        base: "",
        ext: "",
        name: ""
    };
    const len = path12.length;
    if (len === 0) return ret;
    let rootEnd = 0;
    let code = path12.charCodeAt(0);
    if (len > 1) {
        if (isPathSeparator(code)) {
            rootEnd = 1;
            if (isPathSeparator(path12.charCodeAt(1))) {
                let j4 = 2;
                let last = j4;
                for(; j4 < len; ++j4){
                    if (isPathSeparator(path12.charCodeAt(j4))) break;
                }
                if (j4 < len && j4 !== last) {
                    last = j4;
                    for(; j4 < len; ++j4){
                        if (!isPathSeparator(path12.charCodeAt(j4))) break;
                    }
                    if (j4 < len && j4 !== last) {
                        last = j4;
                        for(; j4 < len; ++j4){
                            if (isPathSeparator(path12.charCodeAt(j4))) break;
                        }
                        if (j4 === len) {
                            rootEnd = j4;
                        } else if (j4 !== last) {
                            rootEnd = j4 + 1;
                        }
                    }
                }
            }
        } else if (isWindowsDeviceRoot(code)) {
            if (path12.charCodeAt(1) === 58) {
                rootEnd = 2;
                if (len > 2) {
                    if (isPathSeparator(path12.charCodeAt(2))) {
                        if (len === 3) {
                            ret.root = ret.dir = path12;
                            return ret;
                        }
                        rootEnd = 3;
                    }
                } else {
                    ret.root = ret.dir = path12;
                    return ret;
                }
            }
        }
    } else if (isPathSeparator(code)) {
        ret.root = ret.dir = path12;
        return ret;
    }
    if (rootEnd > 0) ret.root = path12.slice(0, rootEnd);
    let startDot = -1;
    let startPart = rootEnd;
    let end = -1;
    let matchedSlash = true;
    let i10 = path12.length - 1;
    let preDotState = 0;
    for(; i10 >= rootEnd; --i10){
        code = path12.charCodeAt(i10);
        if (isPathSeparator(code)) {
            if (!matchedSlash) {
                startPart = i10 + 1;
                break;
            }
            continue;
        }
        if (end === -1) {
            matchedSlash = false;
            end = i10 + 1;
        }
        if (code === 46) {
            if (startDot === -1) startDot = i10;
            else if (preDotState !== 1) preDotState = 1;
        } else if (startDot !== -1) {
            preDotState = -1;
        }
    }
    if (startDot === -1 || end === -1 || preDotState === 0 || preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
        if (end !== -1) {
            ret.base = ret.name = path12.slice(startPart, end);
        }
    } else {
        ret.name = path12.slice(startPart, startDot);
        ret.base = path12.slice(startPart, end);
        ret.ext = path12.slice(startDot, end);
    }
    if (startPart > 0 && startPart !== rootEnd) {
        ret.dir = path12.slice(0, startPart - 1);
    } else ret.dir = ret.root;
    return ret;
}
function fromFileUrl(url) {
    url = url instanceof URL ? url : new URL(url);
    if (url.protocol != "file:") {
        throw new TypeError("Must be a file URL.");
    }
    let path13 = decodeURIComponent(url.pathname.replace(/\//g, "\\").replace(/%(?![0-9A-Fa-f]{2})/g, "%25")).replace(/^\\*([A-Za-z]:)(\\|$)/, "$1\\");
    if (url.hostname != "") {
        path13 = `\\\\${url.hostname}${path13}`;
    }
    return path13;
}
function toFileUrl(path14) {
    if (!isAbsolute(path14)) {
        throw new TypeError("Must be an absolute path.");
    }
    const [, hostname, pathname] = path14.match(/^(?:[/\\]{2}([^/\\]+)(?=[/\\](?:[^/\\]|$)))?(.*)/);
    const url = new URL("file:///");
    url.pathname = encodeWhitespace(pathname.replace(/%/g, "%25"));
    if (hostname != null && hostname != "localhost") {
        url.hostname = hostname;
        if (!url.hostname) {
            throw new TypeError("Invalid hostname.");
        }
    }
    return url;
}
const mod = {
    sep: sep,
    delimiter: delimiter,
    resolve: resolve,
    normalize: normalize,
    isAbsolute: isAbsolute,
    join: join,
    relative: relative,
    toNamespacedPath: toNamespacedPath,
    dirname: dirname,
    basename: basename,
    extname: extname,
    format: format,
    parse: parse,
    fromFileUrl: fromFileUrl,
    toFileUrl: toFileUrl
};
const sep1 = "/";
const delimiter1 = ":";
function resolve1(...pathSegments) {
    let resolvedPath = "";
    let resolvedAbsolute = false;
    for(let i11 = pathSegments.length - 1; i11 >= -1 && !resolvedAbsolute; i11--){
        let path15;
        if (i11 >= 0) path15 = pathSegments[i11];
        else {
            const { Deno  } = globalThis;
            if (typeof Deno?.cwd !== "function") {
                throw new TypeError("Resolved a relative path without a CWD.");
            }
            path15 = Deno.cwd();
        }
        assertPath(path15);
        if (path15.length === 0) {
            continue;
        }
        resolvedPath = `${path15}/${resolvedPath}`;
        resolvedAbsolute = path15.charCodeAt(0) === CHAR_FORWARD_SLASH;
    }
    resolvedPath = normalizeString(resolvedPath, !resolvedAbsolute, "/", isPosixPathSeparator);
    if (resolvedAbsolute) {
        if (resolvedPath.length > 0) return `/${resolvedPath}`;
        else return "/";
    } else if (resolvedPath.length > 0) return resolvedPath;
    else return ".";
}
function normalize1(path16) {
    assertPath(path16);
    if (path16.length === 0) return ".";
    const isAbsolute1 = path16.charCodeAt(0) === 47;
    const trailingSeparator = path16.charCodeAt(path16.length - 1) === 47;
    path16 = normalizeString(path16, !isAbsolute1, "/", isPosixPathSeparator);
    if (path16.length === 0 && !isAbsolute1) path16 = ".";
    if (path16.length > 0 && trailingSeparator) path16 += "/";
    if (isAbsolute1) return `/${path16}`;
    return path16;
}
function isAbsolute1(path17) {
    assertPath(path17);
    return path17.length > 0 && path17.charCodeAt(0) === 47;
}
function join1(...paths) {
    if (paths.length === 0) return ".";
    let joined;
    for(let i12 = 0, len = paths.length; i12 < len; ++i12){
        const path18 = paths[i12];
        assertPath(path18);
        if (path18.length > 0) {
            if (!joined) joined = path18;
            else joined += `/${path18}`;
        }
    }
    if (!joined) return ".";
    return normalize1(joined);
}
function relative1(from, to2) {
    assertPath(from);
    assertPath(to2);
    if (from === to2) return "";
    from = resolve1(from);
    to2 = resolve1(to2);
    if (from === to2) return "";
    let fromStart = 1;
    const fromEnd = from.length;
    for(; fromStart < fromEnd; ++fromStart){
        if (from.charCodeAt(fromStart) !== 47) break;
    }
    const fromLen = fromEnd - fromStart;
    let toStart = 1;
    const toEnd = to2.length;
    for(; toStart < toEnd; ++toStart){
        if (to2.charCodeAt(toStart) !== 47) break;
    }
    const toLen = toEnd - toStart;
    const length = fromLen < toLen ? fromLen : toLen;
    let lastCommonSep = -1;
    let i13 = 0;
    for(; i13 <= length; ++i13){
        if (i13 === length) {
            if (toLen > length) {
                if (to2.charCodeAt(toStart + i13) === 47) {
                    return to2.slice(toStart + i13 + 1);
                } else if (i13 === 0) {
                    return to2.slice(toStart + i13);
                }
            } else if (fromLen > length) {
                if (from.charCodeAt(fromStart + i13) === 47) {
                    lastCommonSep = i13;
                } else if (i13 === 0) {
                    lastCommonSep = 0;
                }
            }
            break;
        }
        const fromCode = from.charCodeAt(fromStart + i13);
        const toCode = to2.charCodeAt(toStart + i13);
        if (fromCode !== toCode) break;
        else if (fromCode === 47) lastCommonSep = i13;
    }
    let out = "";
    for(i13 = fromStart + lastCommonSep + 1; i13 <= fromEnd; ++i13){
        if (i13 === fromEnd || from.charCodeAt(i13) === 47) {
            if (out.length === 0) out += "..";
            else out += "/..";
        }
    }
    if (out.length > 0) return out + to2.slice(toStart + lastCommonSep);
    else {
        toStart += lastCommonSep;
        if (to2.charCodeAt(toStart) === 47) ++toStart;
        return to2.slice(toStart);
    }
}
function toNamespacedPath1(path19) {
    return path19;
}
function dirname1(path20) {
    assertPath(path20);
    if (path20.length === 0) return ".";
    const hasRoot = path20.charCodeAt(0) === 47;
    let end = -1;
    let matchedSlash = true;
    for(let i14 = path20.length - 1; i14 >= 1; --i14){
        if (path20.charCodeAt(i14) === 47) {
            if (!matchedSlash) {
                end = i14;
                break;
            }
        } else {
            matchedSlash = false;
        }
    }
    if (end === -1) return hasRoot ? "/" : ".";
    if (hasRoot && end === 1) return "//";
    return path20.slice(0, end);
}
function basename1(path21, ext = "") {
    if (ext !== undefined && typeof ext !== "string") {
        throw new TypeError('"ext" argument must be a string');
    }
    assertPath(path21);
    let start = 0;
    let end = -1;
    let matchedSlash = true;
    let i15;
    if (ext !== undefined && ext.length > 0 && ext.length <= path21.length) {
        if (ext.length === path21.length && ext === path21) return "";
        let extIdx = ext.length - 1;
        let firstNonSlashEnd = -1;
        for(i15 = path21.length - 1; i15 >= 0; --i15){
            const code = path21.charCodeAt(i15);
            if (code === 47) {
                if (!matchedSlash) {
                    start = i15 + 1;
                    break;
                }
            } else {
                if (firstNonSlashEnd === -1) {
                    matchedSlash = false;
                    firstNonSlashEnd = i15 + 1;
                }
                if (extIdx >= 0) {
                    if (code === ext.charCodeAt(extIdx)) {
                        if (--extIdx === -1) {
                            end = i15;
                        }
                    } else {
                        extIdx = -1;
                        end = firstNonSlashEnd;
                    }
                }
            }
        }
        if (start === end) end = firstNonSlashEnd;
        else if (end === -1) end = path21.length;
        return path21.slice(start, end);
    } else {
        for(i15 = path21.length - 1; i15 >= 0; --i15){
            if (path21.charCodeAt(i15) === 47) {
                if (!matchedSlash) {
                    start = i15 + 1;
                    break;
                }
            } else if (end === -1) {
                matchedSlash = false;
                end = i15 + 1;
            }
        }
        if (end === -1) return "";
        return path21.slice(start, end);
    }
}
function extname1(path22) {
    assertPath(path22);
    let startDot = -1;
    let startPart = 0;
    let end = -1;
    let matchedSlash = true;
    let preDotState = 0;
    for(let i16 = path22.length - 1; i16 >= 0; --i16){
        const code = path22.charCodeAt(i16);
        if (code === 47) {
            if (!matchedSlash) {
                startPart = i16 + 1;
                break;
            }
            continue;
        }
        if (end === -1) {
            matchedSlash = false;
            end = i16 + 1;
        }
        if (code === 46) {
            if (startDot === -1) startDot = i16;
            else if (preDotState !== 1) preDotState = 1;
        } else if (startDot !== -1) {
            preDotState = -1;
        }
    }
    if (startDot === -1 || end === -1 || preDotState === 0 || preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
        return "";
    }
    return path22.slice(startDot, end);
}
function format1(pathObject) {
    if (pathObject === null || typeof pathObject !== "object") {
        throw new TypeError(`The "pathObject" argument must be of type Object. Received type ${typeof pathObject}`);
    }
    return _format("/", pathObject);
}
function parse1(path23) {
    assertPath(path23);
    const ret = {
        root: "",
        dir: "",
        base: "",
        ext: "",
        name: ""
    };
    if (path23.length === 0) return ret;
    const isAbsolute2 = path23.charCodeAt(0) === 47;
    let start;
    if (isAbsolute2) {
        ret.root = "/";
        start = 1;
    } else {
        start = 0;
    }
    let startDot = -1;
    let startPart = 0;
    let end = -1;
    let matchedSlash = true;
    let i17 = path23.length - 1;
    let preDotState = 0;
    for(; i17 >= start; --i17){
        const code = path23.charCodeAt(i17);
        if (code === 47) {
            if (!matchedSlash) {
                startPart = i17 + 1;
                break;
            }
            continue;
        }
        if (end === -1) {
            matchedSlash = false;
            end = i17 + 1;
        }
        if (code === 46) {
            if (startDot === -1) startDot = i17;
            else if (preDotState !== 1) preDotState = 1;
        } else if (startDot !== -1) {
            preDotState = -1;
        }
    }
    if (startDot === -1 || end === -1 || preDotState === 0 || preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
        if (end !== -1) {
            if (startPart === 0 && isAbsolute2) {
                ret.base = ret.name = path23.slice(1, end);
            } else {
                ret.base = ret.name = path23.slice(startPart, end);
            }
        }
    } else {
        if (startPart === 0 && isAbsolute2) {
            ret.name = path23.slice(1, startDot);
            ret.base = path23.slice(1, end);
        } else {
            ret.name = path23.slice(startPart, startDot);
            ret.base = path23.slice(startPart, end);
        }
        ret.ext = path23.slice(startDot, end);
    }
    if (startPart > 0) ret.dir = path23.slice(0, startPart - 1);
    else if (isAbsolute2) ret.dir = "/";
    return ret;
}
function fromFileUrl1(url) {
    url = url instanceof URL ? url : new URL(url);
    if (url.protocol != "file:") {
        throw new TypeError("Must be a file URL.");
    }
    return decodeURIComponent(url.pathname.replace(/%(?![0-9A-Fa-f]{2})/g, "%25"));
}
function toFileUrl1(path24) {
    if (!isAbsolute1(path24)) {
        throw new TypeError("Must be an absolute path.");
    }
    const url = new URL("file:///");
    url.pathname = encodeWhitespace(path24.replace(/%/g, "%25").replace(/\\/g, "%5C"));
    return url;
}
const mod1 = {
    sep: sep1,
    delimiter: delimiter1,
    resolve: resolve1,
    normalize: normalize1,
    isAbsolute: isAbsolute1,
    join: join1,
    relative: relative1,
    toNamespacedPath: toNamespacedPath1,
    dirname: dirname1,
    basename: basename1,
    extname: extname1,
    format: format1,
    parse: parse1,
    fromFileUrl: fromFileUrl1,
    toFileUrl: toFileUrl1
};
const path = isWindows ? mod : mod1;
const { join: join2 , normalize: normalize2  } = path;
const path1 = isWindows ? mod : mod1;
const { basename: basename2 , delimiter: delimiter2 , dirname: dirname2 , extname: extname2 , format: format2 , fromFileUrl: fromFileUrl2 , isAbsolute: isAbsolute2 , join: join3 , normalize: normalize3 , parse: parse2 , relative: relative2 , resolve: resolve2 , sep: sep2 , toFileUrl: toFileUrl2 , toNamespacedPath: toNamespacedPath2 ,  } = path1;
const db = JSON.parse(`{
  "application/1d-interleaved-parityfec": {
    "source": "iana"
  },
  "application/3gpdash-qoe-report+xml": {
    "source": "iana",
    "charset": "UTF-8",
    "compressible": true
  },
  "application/3gpp-ims+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/3gpphal+json": {
    "source": "iana",
    "compressible": true
  },
  "application/3gpphalforms+json": {
    "source": "iana",
    "compressible": true
  },
  "application/a2l": {
    "source": "iana"
  },
  "application/ace+cbor": {
    "source": "iana"
  },
  "application/activemessage": {
    "source": "iana"
  },
  "application/activity+json": {
    "source": "iana",
    "compressible": true
  },
  "application/alto-costmap+json": {
    "source": "iana",
    "compressible": true
  },
  "application/alto-costmapfilter+json": {
    "source": "iana",
    "compressible": true
  },
  "application/alto-directory+json": {
    "source": "iana",
    "compressible": true
  },
  "application/alto-endpointcost+json": {
    "source": "iana",
    "compressible": true
  },
  "application/alto-endpointcostparams+json": {
    "source": "iana",
    "compressible": true
  },
  "application/alto-endpointprop+json": {
    "source": "iana",
    "compressible": true
  },
  "application/alto-endpointpropparams+json": {
    "source": "iana",
    "compressible": true
  },
  "application/alto-error+json": {
    "source": "iana",
    "compressible": true
  },
  "application/alto-networkmap+json": {
    "source": "iana",
    "compressible": true
  },
  "application/alto-networkmapfilter+json": {
    "source": "iana",
    "compressible": true
  },
  "application/alto-updatestreamcontrol+json": {
    "source": "iana",
    "compressible": true
  },
  "application/alto-updatestreamparams+json": {
    "source": "iana",
    "compressible": true
  },
  "application/aml": {
    "source": "iana"
  },
  "application/andrew-inset": {
    "source": "iana",
    "extensions": ["ez"]
  },
  "application/applefile": {
    "source": "iana"
  },
  "application/applixware": {
    "source": "apache",
    "extensions": ["aw"]
  },
  "application/at+jwt": {
    "source": "iana"
  },
  "application/atf": {
    "source": "iana"
  },
  "application/atfx": {
    "source": "iana"
  },
  "application/atom+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["atom"]
  },
  "application/atomcat+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["atomcat"]
  },
  "application/atomdeleted+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["atomdeleted"]
  },
  "application/atomicmail": {
    "source": "iana"
  },
  "application/atomsvc+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["atomsvc"]
  },
  "application/atsc-dwd+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["dwd"]
  },
  "application/atsc-dynamic-event-message": {
    "source": "iana"
  },
  "application/atsc-held+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["held"]
  },
  "application/atsc-rdt+json": {
    "source": "iana",
    "compressible": true
  },
  "application/atsc-rsat+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["rsat"]
  },
  "application/atxml": {
    "source": "iana"
  },
  "application/auth-policy+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/bacnet-xdd+zip": {
    "source": "iana",
    "compressible": false
  },
  "application/batch-smtp": {
    "source": "iana"
  },
  "application/bdoc": {
    "compressible": false,
    "extensions": ["bdoc"]
  },
  "application/beep+xml": {
    "source": "iana",
    "charset": "UTF-8",
    "compressible": true
  },
  "application/calendar+json": {
    "source": "iana",
    "compressible": true
  },
  "application/calendar+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["xcs"]
  },
  "application/call-completion": {
    "source": "iana"
  },
  "application/cals-1840": {
    "source": "iana"
  },
  "application/captive+json": {
    "source": "iana",
    "compressible": true
  },
  "application/cbor": {
    "source": "iana"
  },
  "application/cbor-seq": {
    "source": "iana"
  },
  "application/cccex": {
    "source": "iana"
  },
  "application/ccmp+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/ccxml+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["ccxml"]
  },
  "application/cdfx+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["cdfx"]
  },
  "application/cdmi-capability": {
    "source": "iana",
    "extensions": ["cdmia"]
  },
  "application/cdmi-container": {
    "source": "iana",
    "extensions": ["cdmic"]
  },
  "application/cdmi-domain": {
    "source": "iana",
    "extensions": ["cdmid"]
  },
  "application/cdmi-object": {
    "source": "iana",
    "extensions": ["cdmio"]
  },
  "application/cdmi-queue": {
    "source": "iana",
    "extensions": ["cdmiq"]
  },
  "application/cdni": {
    "source": "iana"
  },
  "application/cea": {
    "source": "iana"
  },
  "application/cea-2018+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/cellml+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/cfw": {
    "source": "iana"
  },
  "application/clr": {
    "source": "iana"
  },
  "application/clue+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/clue_info+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/cms": {
    "source": "iana"
  },
  "application/cnrp+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/coap-group+json": {
    "source": "iana",
    "compressible": true
  },
  "application/coap-payload": {
    "source": "iana"
  },
  "application/commonground": {
    "source": "iana"
  },
  "application/conference-info+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/cose": {
    "source": "iana"
  },
  "application/cose-key": {
    "source": "iana"
  },
  "application/cose-key-set": {
    "source": "iana"
  },
  "application/cpl+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/csrattrs": {
    "source": "iana"
  },
  "application/csta+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/cstadata+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/csvm+json": {
    "source": "iana",
    "compressible": true
  },
  "application/cu-seeme": {
    "source": "apache",
    "extensions": ["cu"]
  },
  "application/cwt": {
    "source": "iana"
  },
  "application/cybercash": {
    "source": "iana"
  },
  "application/dart": {
    "compressible": true
  },
  "application/dash+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["mpd"]
  },
  "application/dashdelta": {
    "source": "iana"
  },
  "application/davmount+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["davmount"]
  },
  "application/dca-rft": {
    "source": "iana"
  },
  "application/dcd": {
    "source": "iana"
  },
  "application/dec-dx": {
    "source": "iana"
  },
  "application/dialog-info+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/dicom": {
    "source": "iana"
  },
  "application/dicom+json": {
    "source": "iana",
    "compressible": true
  },
  "application/dicom+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/dii": {
    "source": "iana"
  },
  "application/dit": {
    "source": "iana"
  },
  "application/dns": {
    "source": "iana"
  },
  "application/dns+json": {
    "source": "iana",
    "compressible": true
  },
  "application/dns-message": {
    "source": "iana"
  },
  "application/docbook+xml": {
    "source": "apache",
    "compressible": true,
    "extensions": ["dbk"]
  },
  "application/dots+cbor": {
    "source": "iana"
  },
  "application/dskpp+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/dssc+der": {
    "source": "iana",
    "extensions": ["dssc"]
  },
  "application/dssc+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["xdssc"]
  },
  "application/dvcs": {
    "source": "iana"
  },
  "application/ecmascript": {
    "source": "iana",
    "compressible": true,
    "extensions": ["es","ecma"]
  },
  "application/edi-consent": {
    "source": "iana"
  },
  "application/edi-x12": {
    "source": "iana",
    "compressible": false
  },
  "application/edifact": {
    "source": "iana",
    "compressible": false
  },
  "application/efi": {
    "source": "iana"
  },
  "application/elm+json": {
    "source": "iana",
    "charset": "UTF-8",
    "compressible": true
  },
  "application/elm+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/emergencycalldata.cap+xml": {
    "source": "iana",
    "charset": "UTF-8",
    "compressible": true
  },
  "application/emergencycalldata.comment+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/emergencycalldata.control+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/emergencycalldata.deviceinfo+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/emergencycalldata.ecall.msd": {
    "source": "iana"
  },
  "application/emergencycalldata.providerinfo+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/emergencycalldata.serviceinfo+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/emergencycalldata.subscriberinfo+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/emergencycalldata.veds+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/emma+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["emma"]
  },
  "application/emotionml+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["emotionml"]
  },
  "application/encaprtp": {
    "source": "iana"
  },
  "application/epp+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/epub+zip": {
    "source": "iana",
    "compressible": false,
    "extensions": ["epub"]
  },
  "application/eshop": {
    "source": "iana"
  },
  "application/exi": {
    "source": "iana",
    "extensions": ["exi"]
  },
  "application/expect-ct-report+json": {
    "source": "iana",
    "compressible": true
  },
  "application/express": {
    "source": "iana",
    "extensions": ["exp"]
  },
  "application/fastinfoset": {
    "source": "iana"
  },
  "application/fastsoap": {
    "source": "iana"
  },
  "application/fdt+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["fdt"]
  },
  "application/fhir+json": {
    "source": "iana",
    "charset": "UTF-8",
    "compressible": true
  },
  "application/fhir+xml": {
    "source": "iana",
    "charset": "UTF-8",
    "compressible": true
  },
  "application/fido.trusted-apps+json": {
    "compressible": true
  },
  "application/fits": {
    "source": "iana"
  },
  "application/flexfec": {
    "source": "iana"
  },
  "application/font-sfnt": {
    "source": "iana"
  },
  "application/font-tdpfr": {
    "source": "iana",
    "extensions": ["pfr"]
  },
  "application/font-woff": {
    "source": "iana",
    "compressible": false
  },
  "application/framework-attributes+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/geo+json": {
    "source": "iana",
    "compressible": true,
    "extensions": ["geojson"]
  },
  "application/geo+json-seq": {
    "source": "iana"
  },
  "application/geopackage+sqlite3": {
    "source": "iana"
  },
  "application/geoxacml+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/gltf-buffer": {
    "source": "iana"
  },
  "application/gml+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["gml"]
  },
  "application/gpx+xml": {
    "source": "apache",
    "compressible": true,
    "extensions": ["gpx"]
  },
  "application/gxf": {
    "source": "apache",
    "extensions": ["gxf"]
  },
  "application/gzip": {
    "source": "iana",
    "compressible": false,
    "extensions": ["gz"]
  },
  "application/h224": {
    "source": "iana"
  },
  "application/held+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/hjson": {
    "extensions": ["hjson"]
  },
  "application/http": {
    "source": "iana"
  },
  "application/hyperstudio": {
    "source": "iana",
    "extensions": ["stk"]
  },
  "application/ibe-key-request+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/ibe-pkg-reply+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/ibe-pp-data": {
    "source": "iana"
  },
  "application/iges": {
    "source": "iana"
  },
  "application/im-iscomposing+xml": {
    "source": "iana",
    "charset": "UTF-8",
    "compressible": true
  },
  "application/index": {
    "source": "iana"
  },
  "application/index.cmd": {
    "source": "iana"
  },
  "application/index.obj": {
    "source": "iana"
  },
  "application/index.response": {
    "source": "iana"
  },
  "application/index.vnd": {
    "source": "iana"
  },
  "application/inkml+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["ink","inkml"]
  },
  "application/iotp": {
    "source": "iana"
  },
  "application/ipfix": {
    "source": "iana",
    "extensions": ["ipfix"]
  },
  "application/ipp": {
    "source": "iana"
  },
  "application/isup": {
    "source": "iana"
  },
  "application/its+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["its"]
  },
  "application/java-archive": {
    "source": "apache",
    "compressible": false,
    "extensions": ["jar","war","ear"]
  },
  "application/java-serialized-object": {
    "source": "apache",
    "compressible": false,
    "extensions": ["ser"]
  },
  "application/java-vm": {
    "source": "apache",
    "compressible": false,
    "extensions": ["class"]
  },
  "application/javascript": {
    "source": "iana",
    "charset": "UTF-8",
    "compressible": true,
    "extensions": ["js","mjs"]
  },
  "application/jf2feed+json": {
    "source": "iana",
    "compressible": true
  },
  "application/jose": {
    "source": "iana"
  },
  "application/jose+json": {
    "source": "iana",
    "compressible": true
  },
  "application/jrd+json": {
    "source": "iana",
    "compressible": true
  },
  "application/jscalendar+json": {
    "source": "iana",
    "compressible": true
  },
  "application/json": {
    "source": "iana",
    "charset": "UTF-8",
    "compressible": true,
    "extensions": ["json","map"]
  },
  "application/json-patch+json": {
    "source": "iana",
    "compressible": true
  },
  "application/json-seq": {
    "source": "iana"
  },
  "application/json5": {
    "extensions": ["json5"]
  },
  "application/jsonml+json": {
    "source": "apache",
    "compressible": true,
    "extensions": ["jsonml"]
  },
  "application/jwk+json": {
    "source": "iana",
    "compressible": true
  },
  "application/jwk-set+json": {
    "source": "iana",
    "compressible": true
  },
  "application/jwt": {
    "source": "iana"
  },
  "application/kpml-request+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/kpml-response+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/ld+json": {
    "source": "iana",
    "compressible": true,
    "extensions": ["jsonld"]
  },
  "application/lgr+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["lgr"]
  },
  "application/link-format": {
    "source": "iana"
  },
  "application/load-control+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/lost+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["lostxml"]
  },
  "application/lostsync+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/lpf+zip": {
    "source": "iana",
    "compressible": false
  },
  "application/lxf": {
    "source": "iana"
  },
  "application/mac-binhex40": {
    "source": "iana",
    "extensions": ["hqx"]
  },
  "application/mac-compactpro": {
    "source": "apache",
    "extensions": ["cpt"]
  },
  "application/macwriteii": {
    "source": "iana"
  },
  "application/mads+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["mads"]
  },
  "application/manifest+json": {
    "source": "iana",
    "charset": "UTF-8",
    "compressible": true,
    "extensions": ["webmanifest"]
  },
  "application/marc": {
    "source": "iana",
    "extensions": ["mrc"]
  },
  "application/marcxml+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["mrcx"]
  },
  "application/mathematica": {
    "source": "iana",
    "extensions": ["ma","nb","mb"]
  },
  "application/mathml+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["mathml"]
  },
  "application/mathml-content+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/mathml-presentation+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/mbms-associated-procedure-description+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/mbms-deregister+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/mbms-envelope+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/mbms-msk+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/mbms-msk-response+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/mbms-protection-description+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/mbms-reception-report+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/mbms-register+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/mbms-register-response+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/mbms-schedule+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/mbms-user-service-description+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/mbox": {
    "source": "iana",
    "extensions": ["mbox"]
  },
  "application/media-policy-dataset+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/media_control+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/mediaservercontrol+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["mscml"]
  },
  "application/merge-patch+json": {
    "source": "iana",
    "compressible": true
  },
  "application/metalink+xml": {
    "source": "apache",
    "compressible": true,
    "extensions": ["metalink"]
  },
  "application/metalink4+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["meta4"]
  },
  "application/mets+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["mets"]
  },
  "application/mf4": {
    "source": "iana"
  },
  "application/mikey": {
    "source": "iana"
  },
  "application/mipc": {
    "source": "iana"
  },
  "application/missing-blocks+cbor-seq": {
    "source": "iana"
  },
  "application/mmt-aei+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["maei"]
  },
  "application/mmt-usd+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["musd"]
  },
  "application/mods+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["mods"]
  },
  "application/moss-keys": {
    "source": "iana"
  },
  "application/moss-signature": {
    "source": "iana"
  },
  "application/mosskey-data": {
    "source": "iana"
  },
  "application/mosskey-request": {
    "source": "iana"
  },
  "application/mp21": {
    "source": "iana",
    "extensions": ["m21","mp21"]
  },
  "application/mp4": {
    "source": "iana",
    "extensions": ["mp4s","m4p"]
  },
  "application/mpeg4-generic": {
    "source": "iana"
  },
  "application/mpeg4-iod": {
    "source": "iana"
  },
  "application/mpeg4-iod-xmt": {
    "source": "iana"
  },
  "application/mrb-consumer+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/mrb-publish+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/msc-ivr+xml": {
    "source": "iana",
    "charset": "UTF-8",
    "compressible": true
  },
  "application/msc-mixer+xml": {
    "source": "iana",
    "charset": "UTF-8",
    "compressible": true
  },
  "application/msword": {
    "source": "iana",
    "compressible": false,
    "extensions": ["doc","dot"]
  },
  "application/mud+json": {
    "source": "iana",
    "compressible": true
  },
  "application/multipart-core": {
    "source": "iana"
  },
  "application/mxf": {
    "source": "iana",
    "extensions": ["mxf"]
  },
  "application/n-quads": {
    "source": "iana",
    "extensions": ["nq"]
  },
  "application/n-triples": {
    "source": "iana",
    "extensions": ["nt"]
  },
  "application/nasdata": {
    "source": "iana"
  },
  "application/news-checkgroups": {
    "source": "iana",
    "charset": "US-ASCII"
  },
  "application/news-groupinfo": {
    "source": "iana",
    "charset": "US-ASCII"
  },
  "application/news-transmission": {
    "source": "iana"
  },
  "application/nlsml+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/node": {
    "source": "iana",
    "extensions": ["cjs"]
  },
  "application/nss": {
    "source": "iana"
  },
  "application/oauth-authz-req+jwt": {
    "source": "iana"
  },
  "application/ocsp-request": {
    "source": "iana"
  },
  "application/ocsp-response": {
    "source": "iana"
  },
  "application/octet-stream": {
    "source": "iana",
    "compressible": false,
    "extensions": ["bin","dms","lrf","mar","so","dist","distz","pkg","bpk","dump","elc","deploy","exe","dll","deb","dmg","iso","img","msi","msp","msm","buffer"]
  },
  "application/oda": {
    "source": "iana",
    "extensions": ["oda"]
  },
  "application/odm+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/odx": {
    "source": "iana"
  },
  "application/oebps-package+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["opf"]
  },
  "application/ogg": {
    "source": "iana",
    "compressible": false,
    "extensions": ["ogx"]
  },
  "application/omdoc+xml": {
    "source": "apache",
    "compressible": true,
    "extensions": ["omdoc"]
  },
  "application/onenote": {
    "source": "apache",
    "extensions": ["onetoc","onetoc2","onetmp","onepkg"]
  },
  "application/opc-nodeset+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/oscore": {
    "source": "iana"
  },
  "application/oxps": {
    "source": "iana",
    "extensions": ["oxps"]
  },
  "application/p21": {
    "source": "iana"
  },
  "application/p21+zip": {
    "source": "iana",
    "compressible": false
  },
  "application/p2p-overlay+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["relo"]
  },
  "application/parityfec": {
    "source": "iana"
  },
  "application/passport": {
    "source": "iana"
  },
  "application/patch-ops-error+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["xer"]
  },
  "application/pdf": {
    "source": "iana",
    "compressible": false,
    "extensions": ["pdf"]
  },
  "application/pdx": {
    "source": "iana"
  },
  "application/pem-certificate-chain": {
    "source": "iana"
  },
  "application/pgp-encrypted": {
    "source": "iana",
    "compressible": false,
    "extensions": ["pgp"]
  },
  "application/pgp-keys": {
    "source": "iana"
  },
  "application/pgp-signature": {
    "source": "iana",
    "extensions": ["asc","sig"]
  },
  "application/pics-rules": {
    "source": "apache",
    "extensions": ["prf"]
  },
  "application/pidf+xml": {
    "source": "iana",
    "charset": "UTF-8",
    "compressible": true
  },
  "application/pidf-diff+xml": {
    "source": "iana",
    "charset": "UTF-8",
    "compressible": true
  },
  "application/pkcs10": {
    "source": "iana",
    "extensions": ["p10"]
  },
  "application/pkcs12": {
    "source": "iana"
  },
  "application/pkcs7-mime": {
    "source": "iana",
    "extensions": ["p7m","p7c"]
  },
  "application/pkcs7-signature": {
    "source": "iana",
    "extensions": ["p7s"]
  },
  "application/pkcs8": {
    "source": "iana",
    "extensions": ["p8"]
  },
  "application/pkcs8-encrypted": {
    "source": "iana"
  },
  "application/pkix-attr-cert": {
    "source": "iana",
    "extensions": ["ac"]
  },
  "application/pkix-cert": {
    "source": "iana",
    "extensions": ["cer"]
  },
  "application/pkix-crl": {
    "source": "iana",
    "extensions": ["crl"]
  },
  "application/pkix-pkipath": {
    "source": "iana",
    "extensions": ["pkipath"]
  },
  "application/pkixcmp": {
    "source": "iana",
    "extensions": ["pki"]
  },
  "application/pls+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["pls"]
  },
  "application/poc-settings+xml": {
    "source": "iana",
    "charset": "UTF-8",
    "compressible": true
  },
  "application/postscript": {
    "source": "iana",
    "compressible": true,
    "extensions": ["ai","eps","ps"]
  },
  "application/ppsp-tracker+json": {
    "source": "iana",
    "compressible": true
  },
  "application/problem+json": {
    "source": "iana",
    "compressible": true
  },
  "application/problem+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/provenance+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["provx"]
  },
  "application/prs.alvestrand.titrax-sheet": {
    "source": "iana"
  },
  "application/prs.cww": {
    "source": "iana",
    "extensions": ["cww"]
  },
  "application/prs.cyn": {
    "source": "iana",
    "charset": "7-BIT"
  },
  "application/prs.hpub+zip": {
    "source": "iana",
    "compressible": false
  },
  "application/prs.nprend": {
    "source": "iana"
  },
  "application/prs.plucker": {
    "source": "iana"
  },
  "application/prs.rdf-xml-crypt": {
    "source": "iana"
  },
  "application/prs.xsf+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/pskc+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["pskcxml"]
  },
  "application/pvd+json": {
    "source": "iana",
    "compressible": true
  },
  "application/qsig": {
    "source": "iana"
  },
  "application/raml+yaml": {
    "compressible": true,
    "extensions": ["raml"]
  },
  "application/raptorfec": {
    "source": "iana"
  },
  "application/rdap+json": {
    "source": "iana",
    "compressible": true
  },
  "application/rdf+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["rdf","owl"]
  },
  "application/reginfo+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["rif"]
  },
  "application/relax-ng-compact-syntax": {
    "source": "iana",
    "extensions": ["rnc"]
  },
  "application/remote-printing": {
    "source": "iana"
  },
  "application/reputon+json": {
    "source": "iana",
    "compressible": true
  },
  "application/resource-lists+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["rl"]
  },
  "application/resource-lists-diff+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["rld"]
  },
  "application/rfc+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/riscos": {
    "source": "iana"
  },
  "application/rlmi+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/rls-services+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["rs"]
  },
  "application/route-apd+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["rapd"]
  },
  "application/route-s-tsid+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["sls"]
  },
  "application/route-usd+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["rusd"]
  },
  "application/rpki-ghostbusters": {
    "source": "iana",
    "extensions": ["gbr"]
  },
  "application/rpki-manifest": {
    "source": "iana",
    "extensions": ["mft"]
  },
  "application/rpki-publication": {
    "source": "iana"
  },
  "application/rpki-roa": {
    "source": "iana",
    "extensions": ["roa"]
  },
  "application/rpki-updown": {
    "source": "iana"
  },
  "application/rsd+xml": {
    "source": "apache",
    "compressible": true,
    "extensions": ["rsd"]
  },
  "application/rss+xml": {
    "source": "apache",
    "compressible": true,
    "extensions": ["rss"]
  },
  "application/rtf": {
    "source": "iana",
    "compressible": true,
    "extensions": ["rtf"]
  },
  "application/rtploopback": {
    "source": "iana"
  },
  "application/rtx": {
    "source": "iana"
  },
  "application/samlassertion+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/samlmetadata+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/sarif+json": {
    "source": "iana",
    "compressible": true
  },
  "application/sarif-external-properties+json": {
    "source": "iana",
    "compressible": true
  },
  "application/sbe": {
    "source": "iana"
  },
  "application/sbml+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["sbml"]
  },
  "application/scaip+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/scim+json": {
    "source": "iana",
    "compressible": true
  },
  "application/scvp-cv-request": {
    "source": "iana",
    "extensions": ["scq"]
  },
  "application/scvp-cv-response": {
    "source": "iana",
    "extensions": ["scs"]
  },
  "application/scvp-vp-request": {
    "source": "iana",
    "extensions": ["spq"]
  },
  "application/scvp-vp-response": {
    "source": "iana",
    "extensions": ["spp"]
  },
  "application/sdp": {
    "source": "iana",
    "extensions": ["sdp"]
  },
  "application/secevent+jwt": {
    "source": "iana"
  },
  "application/senml+cbor": {
    "source": "iana"
  },
  "application/senml+json": {
    "source": "iana",
    "compressible": true
  },
  "application/senml+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["senmlx"]
  },
  "application/senml-etch+cbor": {
    "source": "iana"
  },
  "application/senml-etch+json": {
    "source": "iana",
    "compressible": true
  },
  "application/senml-exi": {
    "source": "iana"
  },
  "application/sensml+cbor": {
    "source": "iana"
  },
  "application/sensml+json": {
    "source": "iana",
    "compressible": true
  },
  "application/sensml+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["sensmlx"]
  },
  "application/sensml-exi": {
    "source": "iana"
  },
  "application/sep+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/sep-exi": {
    "source": "iana"
  },
  "application/session-info": {
    "source": "iana"
  },
  "application/set-payment": {
    "source": "iana"
  },
  "application/set-payment-initiation": {
    "source": "iana",
    "extensions": ["setpay"]
  },
  "application/set-registration": {
    "source": "iana"
  },
  "application/set-registration-initiation": {
    "source": "iana",
    "extensions": ["setreg"]
  },
  "application/sgml": {
    "source": "iana"
  },
  "application/sgml-open-catalog": {
    "source": "iana"
  },
  "application/shf+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["shf"]
  },
  "application/sieve": {
    "source": "iana",
    "extensions": ["siv","sieve"]
  },
  "application/simple-filter+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/simple-message-summary": {
    "source": "iana"
  },
  "application/simplesymbolcontainer": {
    "source": "iana"
  },
  "application/sipc": {
    "source": "iana"
  },
  "application/slate": {
    "source": "iana"
  },
  "application/smil": {
    "source": "iana"
  },
  "application/smil+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["smi","smil"]
  },
  "application/smpte336m": {
    "source": "iana"
  },
  "application/soap+fastinfoset": {
    "source": "iana"
  },
  "application/soap+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/sparql-query": {
    "source": "iana",
    "extensions": ["rq"]
  },
  "application/sparql-results+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["srx"]
  },
  "application/spdx+json": {
    "source": "iana",
    "compressible": true
  },
  "application/spirits-event+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/sql": {
    "source": "iana"
  },
  "application/srgs": {
    "source": "iana",
    "extensions": ["gram"]
  },
  "application/srgs+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["grxml"]
  },
  "application/sru+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["sru"]
  },
  "application/ssdl+xml": {
    "source": "apache",
    "compressible": true,
    "extensions": ["ssdl"]
  },
  "application/ssml+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["ssml"]
  },
  "application/stix+json": {
    "source": "iana",
    "compressible": true
  },
  "application/swid+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["swidtag"]
  },
  "application/tamp-apex-update": {
    "source": "iana"
  },
  "application/tamp-apex-update-confirm": {
    "source": "iana"
  },
  "application/tamp-community-update": {
    "source": "iana"
  },
  "application/tamp-community-update-confirm": {
    "source": "iana"
  },
  "application/tamp-error": {
    "source": "iana"
  },
  "application/tamp-sequence-adjust": {
    "source": "iana"
  },
  "application/tamp-sequence-adjust-confirm": {
    "source": "iana"
  },
  "application/tamp-status-query": {
    "source": "iana"
  },
  "application/tamp-status-response": {
    "source": "iana"
  },
  "application/tamp-update": {
    "source": "iana"
  },
  "application/tamp-update-confirm": {
    "source": "iana"
  },
  "application/tar": {
    "compressible": true
  },
  "application/taxii+json": {
    "source": "iana",
    "compressible": true
  },
  "application/td+json": {
    "source": "iana",
    "compressible": true
  },
  "application/tei+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["tei","teicorpus"]
  },
  "application/tetra_isi": {
    "source": "iana"
  },
  "application/thraud+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["tfi"]
  },
  "application/timestamp-query": {
    "source": "iana"
  },
  "application/timestamp-reply": {
    "source": "iana"
  },
  "application/timestamped-data": {
    "source": "iana",
    "extensions": ["tsd"]
  },
  "application/tlsrpt+gzip": {
    "source": "iana"
  },
  "application/tlsrpt+json": {
    "source": "iana",
    "compressible": true
  },
  "application/tnauthlist": {
    "source": "iana"
  },
  "application/token-introspection+jwt": {
    "source": "iana"
  },
  "application/toml": {
    "compressible": true,
    "extensions": ["toml"]
  },
  "application/trickle-ice-sdpfrag": {
    "source": "iana"
  },
  "application/trig": {
    "source": "iana",
    "extensions": ["trig"]
  },
  "application/ttml+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["ttml"]
  },
  "application/tve-trigger": {
    "source": "iana"
  },
  "application/tzif": {
    "source": "iana"
  },
  "application/tzif-leap": {
    "source": "iana"
  },
  "application/ubjson": {
    "compressible": false,
    "extensions": ["ubj"]
  },
  "application/ulpfec": {
    "source": "iana"
  },
  "application/urc-grpsheet+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/urc-ressheet+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["rsheet"]
  },
  "application/urc-targetdesc+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["td"]
  },
  "application/urc-uisocketdesc+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vcard+json": {
    "source": "iana",
    "compressible": true
  },
  "application/vcard+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vemmi": {
    "source": "iana"
  },
  "application/vividence.scriptfile": {
    "source": "apache"
  },
  "application/vnd.1000minds.decision-model+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["1km"]
  },
  "application/vnd.3gpp-prose+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.3gpp-prose-pc3ch+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.3gpp-v2x-local-service-information": {
    "source": "iana"
  },
  "application/vnd.3gpp.5gnas": {
    "source": "iana"
  },
  "application/vnd.3gpp.access-transfer-events+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.3gpp.bsf+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.3gpp.gmop+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.3gpp.gtpc": {
    "source": "iana"
  },
  "application/vnd.3gpp.interworking-data": {
    "source": "iana"
  },
  "application/vnd.3gpp.lpp": {
    "source": "iana"
  },
  "application/vnd.3gpp.mc-signalling-ear": {
    "source": "iana"
  },
  "application/vnd.3gpp.mcdata-affiliation-command+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.3gpp.mcdata-info+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.3gpp.mcdata-payload": {
    "source": "iana"
  },
  "application/vnd.3gpp.mcdata-service-config+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.3gpp.mcdata-signalling": {
    "source": "iana"
  },
  "application/vnd.3gpp.mcdata-ue-config+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.3gpp.mcdata-user-profile+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.3gpp.mcptt-affiliation-command+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.3gpp.mcptt-floor-request+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.3gpp.mcptt-info+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.3gpp.mcptt-location-info+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.3gpp.mcptt-mbms-usage-info+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.3gpp.mcptt-service-config+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.3gpp.mcptt-signed+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.3gpp.mcptt-ue-config+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.3gpp.mcptt-ue-init-config+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.3gpp.mcptt-user-profile+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.3gpp.mcvideo-affiliation-command+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.3gpp.mcvideo-affiliation-info+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.3gpp.mcvideo-info+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.3gpp.mcvideo-location-info+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.3gpp.mcvideo-mbms-usage-info+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.3gpp.mcvideo-service-config+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.3gpp.mcvideo-transmission-request+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.3gpp.mcvideo-ue-config+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.3gpp.mcvideo-user-profile+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.3gpp.mid-call+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.3gpp.ngap": {
    "source": "iana"
  },
  "application/vnd.3gpp.pfcp": {
    "source": "iana"
  },
  "application/vnd.3gpp.pic-bw-large": {
    "source": "iana",
    "extensions": ["plb"]
  },
  "application/vnd.3gpp.pic-bw-small": {
    "source": "iana",
    "extensions": ["psb"]
  },
  "application/vnd.3gpp.pic-bw-var": {
    "source": "iana",
    "extensions": ["pvb"]
  },
  "application/vnd.3gpp.s1ap": {
    "source": "iana"
  },
  "application/vnd.3gpp.sms": {
    "source": "iana"
  },
  "application/vnd.3gpp.sms+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.3gpp.srvcc-ext+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.3gpp.srvcc-info+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.3gpp.state-and-event-info+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.3gpp.ussd+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.3gpp2.bcmcsinfo+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.3gpp2.sms": {
    "source": "iana"
  },
  "application/vnd.3gpp2.tcap": {
    "source": "iana",
    "extensions": ["tcap"]
  },
  "application/vnd.3lightssoftware.imagescal": {
    "source": "iana"
  },
  "application/vnd.3m.post-it-notes": {
    "source": "iana",
    "extensions": ["pwn"]
  },
  "application/vnd.accpac.simply.aso": {
    "source": "iana",
    "extensions": ["aso"]
  },
  "application/vnd.accpac.simply.imp": {
    "source": "iana",
    "extensions": ["imp"]
  },
  "application/vnd.acucobol": {
    "source": "iana",
    "extensions": ["acu"]
  },
  "application/vnd.acucorp": {
    "source": "iana",
    "extensions": ["atc","acutc"]
  },
  "application/vnd.adobe.air-application-installer-package+zip": {
    "source": "apache",
    "compressible": false,
    "extensions": ["air"]
  },
  "application/vnd.adobe.flash.movie": {
    "source": "iana"
  },
  "application/vnd.adobe.formscentral.fcdt": {
    "source": "iana",
    "extensions": ["fcdt"]
  },
  "application/vnd.adobe.fxp": {
    "source": "iana",
    "extensions": ["fxp","fxpl"]
  },
  "application/vnd.adobe.partial-upload": {
    "source": "iana"
  },
  "application/vnd.adobe.xdp+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["xdp"]
  },
  "application/vnd.adobe.xfdf": {
    "source": "iana",
    "extensions": ["xfdf"]
  },
  "application/vnd.aether.imp": {
    "source": "iana"
  },
  "application/vnd.afpc.afplinedata": {
    "source": "iana"
  },
  "application/vnd.afpc.afplinedata-pagedef": {
    "source": "iana"
  },
  "application/vnd.afpc.cmoca-cmresource": {
    "source": "iana"
  },
  "application/vnd.afpc.foca-charset": {
    "source": "iana"
  },
  "application/vnd.afpc.foca-codedfont": {
    "source": "iana"
  },
  "application/vnd.afpc.foca-codepage": {
    "source": "iana"
  },
  "application/vnd.afpc.modca": {
    "source": "iana"
  },
  "application/vnd.afpc.modca-cmtable": {
    "source": "iana"
  },
  "application/vnd.afpc.modca-formdef": {
    "source": "iana"
  },
  "application/vnd.afpc.modca-mediummap": {
    "source": "iana"
  },
  "application/vnd.afpc.modca-objectcontainer": {
    "source": "iana"
  },
  "application/vnd.afpc.modca-overlay": {
    "source": "iana"
  },
  "application/vnd.afpc.modca-pagesegment": {
    "source": "iana"
  },
  "application/vnd.age": {
    "source": "iana",
    "extensions": ["age"]
  },
  "application/vnd.ah-barcode": {
    "source": "iana"
  },
  "application/vnd.ahead.space": {
    "source": "iana",
    "extensions": ["ahead"]
  },
  "application/vnd.airzip.filesecure.azf": {
    "source": "iana",
    "extensions": ["azf"]
  },
  "application/vnd.airzip.filesecure.azs": {
    "source": "iana",
    "extensions": ["azs"]
  },
  "application/vnd.amadeus+json": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.amazon.ebook": {
    "source": "apache",
    "extensions": ["azw"]
  },
  "application/vnd.amazon.mobi8-ebook": {
    "source": "iana"
  },
  "application/vnd.americandynamics.acc": {
    "source": "iana",
    "extensions": ["acc"]
  },
  "application/vnd.amiga.ami": {
    "source": "iana",
    "extensions": ["ami"]
  },
  "application/vnd.amundsen.maze+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.android.ota": {
    "source": "iana"
  },
  "application/vnd.android.package-archive": {
    "source": "apache",
    "compressible": false,
    "extensions": ["apk"]
  },
  "application/vnd.anki": {
    "source": "iana"
  },
  "application/vnd.anser-web-certificate-issue-initiation": {
    "source": "iana",
    "extensions": ["cii"]
  },
  "application/vnd.anser-web-funds-transfer-initiation": {
    "source": "apache",
    "extensions": ["fti"]
  },
  "application/vnd.antix.game-component": {
    "source": "iana",
    "extensions": ["atx"]
  },
  "application/vnd.apache.arrow.file": {
    "source": "iana"
  },
  "application/vnd.apache.arrow.stream": {
    "source": "iana"
  },
  "application/vnd.apache.thrift.binary": {
    "source": "iana"
  },
  "application/vnd.apache.thrift.compact": {
    "source": "iana"
  },
  "application/vnd.apache.thrift.json": {
    "source": "iana"
  },
  "application/vnd.api+json": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.aplextor.warrp+json": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.apothekende.reservation+json": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.apple.installer+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["mpkg"]
  },
  "application/vnd.apple.keynote": {
    "source": "iana",
    "extensions": ["key"]
  },
  "application/vnd.apple.mpegurl": {
    "source": "iana",
    "extensions": ["m3u8"]
  },
  "application/vnd.apple.numbers": {
    "source": "iana",
    "extensions": ["numbers"]
  },
  "application/vnd.apple.pages": {
    "source": "iana",
    "extensions": ["pages"]
  },
  "application/vnd.apple.pkpass": {
    "compressible": false,
    "extensions": ["pkpass"]
  },
  "application/vnd.arastra.swi": {
    "source": "iana"
  },
  "application/vnd.aristanetworks.swi": {
    "source": "iana",
    "extensions": ["swi"]
  },
  "application/vnd.artisan+json": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.artsquare": {
    "source": "iana"
  },
  "application/vnd.astraea-software.iota": {
    "source": "iana",
    "extensions": ["iota"]
  },
  "application/vnd.audiograph": {
    "source": "iana",
    "extensions": ["aep"]
  },
  "application/vnd.autopackage": {
    "source": "iana"
  },
  "application/vnd.avalon+json": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.avistar+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.balsamiq.bmml+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["bmml"]
  },
  "application/vnd.balsamiq.bmpr": {
    "source": "iana"
  },
  "application/vnd.banana-accounting": {
    "source": "iana"
  },
  "application/vnd.bbf.usp.error": {
    "source": "iana"
  },
  "application/vnd.bbf.usp.msg": {
    "source": "iana"
  },
  "application/vnd.bbf.usp.msg+json": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.bekitzur-stech+json": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.bint.med-content": {
    "source": "iana"
  },
  "application/vnd.biopax.rdf+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.blink-idb-value-wrapper": {
    "source": "iana"
  },
  "application/vnd.blueice.multipass": {
    "source": "iana",
    "extensions": ["mpm"]
  },
  "application/vnd.bluetooth.ep.oob": {
    "source": "iana"
  },
  "application/vnd.bluetooth.le.oob": {
    "source": "iana"
  },
  "application/vnd.bmi": {
    "source": "iana",
    "extensions": ["bmi"]
  },
  "application/vnd.bpf": {
    "source": "iana"
  },
  "application/vnd.bpf3": {
    "source": "iana"
  },
  "application/vnd.businessobjects": {
    "source": "iana",
    "extensions": ["rep"]
  },
  "application/vnd.byu.uapi+json": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.cab-jscript": {
    "source": "iana"
  },
  "application/vnd.canon-cpdl": {
    "source": "iana"
  },
  "application/vnd.canon-lips": {
    "source": "iana"
  },
  "application/vnd.capasystems-pg+json": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.cendio.thinlinc.clientconf": {
    "source": "iana"
  },
  "application/vnd.century-systems.tcp_stream": {
    "source": "iana"
  },
  "application/vnd.chemdraw+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["cdxml"]
  },
  "application/vnd.chess-pgn": {
    "source": "iana"
  },
  "application/vnd.chipnuts.karaoke-mmd": {
    "source": "iana",
    "extensions": ["mmd"]
  },
  "application/vnd.ciedi": {
    "source": "iana"
  },
  "application/vnd.cinderella": {
    "source": "iana",
    "extensions": ["cdy"]
  },
  "application/vnd.cirpack.isdn-ext": {
    "source": "iana"
  },
  "application/vnd.citationstyles.style+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["csl"]
  },
  "application/vnd.claymore": {
    "source": "iana",
    "extensions": ["cla"]
  },
  "application/vnd.cloanto.rp9": {
    "source": "iana",
    "extensions": ["rp9"]
  },
  "application/vnd.clonk.c4group": {
    "source": "iana",
    "extensions": ["c4g","c4d","c4f","c4p","c4u"]
  },
  "application/vnd.cluetrust.cartomobile-config": {
    "source": "iana",
    "extensions": ["c11amc"]
  },
  "application/vnd.cluetrust.cartomobile-config-pkg": {
    "source": "iana",
    "extensions": ["c11amz"]
  },
  "application/vnd.coffeescript": {
    "source": "iana"
  },
  "application/vnd.collabio.xodocuments.document": {
    "source": "iana"
  },
  "application/vnd.collabio.xodocuments.document-template": {
    "source": "iana"
  },
  "application/vnd.collabio.xodocuments.presentation": {
    "source": "iana"
  },
  "application/vnd.collabio.xodocuments.presentation-template": {
    "source": "iana"
  },
  "application/vnd.collabio.xodocuments.spreadsheet": {
    "source": "iana"
  },
  "application/vnd.collabio.xodocuments.spreadsheet-template": {
    "source": "iana"
  },
  "application/vnd.collection+json": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.collection.doc+json": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.collection.next+json": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.comicbook+zip": {
    "source": "iana",
    "compressible": false
  },
  "application/vnd.comicbook-rar": {
    "source": "iana"
  },
  "application/vnd.commerce-battelle": {
    "source": "iana"
  },
  "application/vnd.commonspace": {
    "source": "iana",
    "extensions": ["csp"]
  },
  "application/vnd.contact.cmsg": {
    "source": "iana",
    "extensions": ["cdbcmsg"]
  },
  "application/vnd.coreos.ignition+json": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.cosmocaller": {
    "source": "iana",
    "extensions": ["cmc"]
  },
  "application/vnd.crick.clicker": {
    "source": "iana",
    "extensions": ["clkx"]
  },
  "application/vnd.crick.clicker.keyboard": {
    "source": "iana",
    "extensions": ["clkk"]
  },
  "application/vnd.crick.clicker.palette": {
    "source": "iana",
    "extensions": ["clkp"]
  },
  "application/vnd.crick.clicker.template": {
    "source": "iana",
    "extensions": ["clkt"]
  },
  "application/vnd.crick.clicker.wordbank": {
    "source": "iana",
    "extensions": ["clkw"]
  },
  "application/vnd.criticaltools.wbs+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["wbs"]
  },
  "application/vnd.cryptii.pipe+json": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.crypto-shade-file": {
    "source": "iana"
  },
  "application/vnd.cryptomator.encrypted": {
    "source": "iana"
  },
  "application/vnd.cryptomator.vault": {
    "source": "iana"
  },
  "application/vnd.ctc-posml": {
    "source": "iana",
    "extensions": ["pml"]
  },
  "application/vnd.ctct.ws+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.cups-pdf": {
    "source": "iana"
  },
  "application/vnd.cups-postscript": {
    "source": "iana"
  },
  "application/vnd.cups-ppd": {
    "source": "iana",
    "extensions": ["ppd"]
  },
  "application/vnd.cups-raster": {
    "source": "iana"
  },
  "application/vnd.cups-raw": {
    "source": "iana"
  },
  "application/vnd.curl": {
    "source": "iana"
  },
  "application/vnd.curl.car": {
    "source": "apache",
    "extensions": ["car"]
  },
  "application/vnd.curl.pcurl": {
    "source": "apache",
    "extensions": ["pcurl"]
  },
  "application/vnd.cyan.dean.root+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.cybank": {
    "source": "iana"
  },
  "application/vnd.cyclonedx+json": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.cyclonedx+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.d2l.coursepackage1p0+zip": {
    "source": "iana",
    "compressible": false
  },
  "application/vnd.d3m-dataset": {
    "source": "iana"
  },
  "application/vnd.d3m-problem": {
    "source": "iana"
  },
  "application/vnd.dart": {
    "source": "iana",
    "compressible": true,
    "extensions": ["dart"]
  },
  "application/vnd.data-vision.rdz": {
    "source": "iana",
    "extensions": ["rdz"]
  },
  "application/vnd.datapackage+json": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.dataresource+json": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.dbf": {
    "source": "iana",
    "extensions": ["dbf"]
  },
  "application/vnd.debian.binary-package": {
    "source": "iana"
  },
  "application/vnd.dece.data": {
    "source": "iana",
    "extensions": ["uvf","uvvf","uvd","uvvd"]
  },
  "application/vnd.dece.ttml+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["uvt","uvvt"]
  },
  "application/vnd.dece.unspecified": {
    "source": "iana",
    "extensions": ["uvx","uvvx"]
  },
  "application/vnd.dece.zip": {
    "source": "iana",
    "extensions": ["uvz","uvvz"]
  },
  "application/vnd.denovo.fcselayout-link": {
    "source": "iana",
    "extensions": ["fe_launch"]
  },
  "application/vnd.desmume.movie": {
    "source": "iana"
  },
  "application/vnd.dir-bi.plate-dl-nosuffix": {
    "source": "iana"
  },
  "application/vnd.dm.delegation+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.dna": {
    "source": "iana",
    "extensions": ["dna"]
  },
  "application/vnd.document+json": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.dolby.mlp": {
    "source": "apache",
    "extensions": ["mlp"]
  },
  "application/vnd.dolby.mobile.1": {
    "source": "iana"
  },
  "application/vnd.dolby.mobile.2": {
    "source": "iana"
  },
  "application/vnd.doremir.scorecloud-binary-document": {
    "source": "iana"
  },
  "application/vnd.dpgraph": {
    "source": "iana",
    "extensions": ["dpg"]
  },
  "application/vnd.dreamfactory": {
    "source": "iana",
    "extensions": ["dfac"]
  },
  "application/vnd.drive+json": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.ds-keypoint": {
    "source": "apache",
    "extensions": ["kpxx"]
  },
  "application/vnd.dtg.local": {
    "source": "iana"
  },
  "application/vnd.dtg.local.flash": {
    "source": "iana"
  },
  "application/vnd.dtg.local.html": {
    "source": "iana"
  },
  "application/vnd.dvb.ait": {
    "source": "iana",
    "extensions": ["ait"]
  },
  "application/vnd.dvb.dvbisl+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.dvb.dvbj": {
    "source": "iana"
  },
  "application/vnd.dvb.esgcontainer": {
    "source": "iana"
  },
  "application/vnd.dvb.ipdcdftnotifaccess": {
    "source": "iana"
  },
  "application/vnd.dvb.ipdcesgaccess": {
    "source": "iana"
  },
  "application/vnd.dvb.ipdcesgaccess2": {
    "source": "iana"
  },
  "application/vnd.dvb.ipdcesgpdd": {
    "source": "iana"
  },
  "application/vnd.dvb.ipdcroaming": {
    "source": "iana"
  },
  "application/vnd.dvb.iptv.alfec-base": {
    "source": "iana"
  },
  "application/vnd.dvb.iptv.alfec-enhancement": {
    "source": "iana"
  },
  "application/vnd.dvb.notif-aggregate-root+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.dvb.notif-container+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.dvb.notif-generic+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.dvb.notif-ia-msglist+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.dvb.notif-ia-registration-request+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.dvb.notif-ia-registration-response+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.dvb.notif-init+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.dvb.pfr": {
    "source": "iana"
  },
  "application/vnd.dvb.service": {
    "source": "iana",
    "extensions": ["svc"]
  },
  "application/vnd.dxr": {
    "source": "iana"
  },
  "application/vnd.dynageo": {
    "source": "iana",
    "extensions": ["geo"]
  },
  "application/vnd.dzr": {
    "source": "iana"
  },
  "application/vnd.easykaraoke.cdgdownload": {
    "source": "iana"
  },
  "application/vnd.ecdis-update": {
    "source": "iana"
  },
  "application/vnd.ecip.rlp": {
    "source": "iana"
  },
  "application/vnd.ecowin.chart": {
    "source": "iana",
    "extensions": ["mag"]
  },
  "application/vnd.ecowin.filerequest": {
    "source": "iana"
  },
  "application/vnd.ecowin.fileupdate": {
    "source": "iana"
  },
  "application/vnd.ecowin.series": {
    "source": "iana"
  },
  "application/vnd.ecowin.seriesrequest": {
    "source": "iana"
  },
  "application/vnd.ecowin.seriesupdate": {
    "source": "iana"
  },
  "application/vnd.efi.img": {
    "source": "iana"
  },
  "application/vnd.efi.iso": {
    "source": "iana"
  },
  "application/vnd.emclient.accessrequest+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.enliven": {
    "source": "iana",
    "extensions": ["nml"]
  },
  "application/vnd.enphase.envoy": {
    "source": "iana"
  },
  "application/vnd.eprints.data+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.epson.esf": {
    "source": "iana",
    "extensions": ["esf"]
  },
  "application/vnd.epson.msf": {
    "source": "iana",
    "extensions": ["msf"]
  },
  "application/vnd.epson.quickanime": {
    "source": "iana",
    "extensions": ["qam"]
  },
  "application/vnd.epson.salt": {
    "source": "iana",
    "extensions": ["slt"]
  },
  "application/vnd.epson.ssf": {
    "source": "iana",
    "extensions": ["ssf"]
  },
  "application/vnd.ericsson.quickcall": {
    "source": "iana"
  },
  "application/vnd.espass-espass+zip": {
    "source": "iana",
    "compressible": false
  },
  "application/vnd.eszigno3+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["es3","et3"]
  },
  "application/vnd.etsi.aoc+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.etsi.asic-e+zip": {
    "source": "iana",
    "compressible": false
  },
  "application/vnd.etsi.asic-s+zip": {
    "source": "iana",
    "compressible": false
  },
  "application/vnd.etsi.cug+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.etsi.iptvcommand+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.etsi.iptvdiscovery+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.etsi.iptvprofile+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.etsi.iptvsad-bc+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.etsi.iptvsad-cod+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.etsi.iptvsad-npvr+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.etsi.iptvservice+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.etsi.iptvsync+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.etsi.iptvueprofile+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.etsi.mcid+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.etsi.mheg5": {
    "source": "iana"
  },
  "application/vnd.etsi.overload-control-policy-dataset+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.etsi.pstn+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.etsi.sci+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.etsi.simservs+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.etsi.timestamp-token": {
    "source": "iana"
  },
  "application/vnd.etsi.tsl+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.etsi.tsl.der": {
    "source": "iana"
  },
  "application/vnd.eudora.data": {
    "source": "iana"
  },
  "application/vnd.evolv.ecig.profile": {
    "source": "iana"
  },
  "application/vnd.evolv.ecig.settings": {
    "source": "iana"
  },
  "application/vnd.evolv.ecig.theme": {
    "source": "iana"
  },
  "application/vnd.exstream-empower+zip": {
    "source": "iana",
    "compressible": false
  },
  "application/vnd.exstream-package": {
    "source": "iana"
  },
  "application/vnd.ezpix-album": {
    "source": "iana",
    "extensions": ["ez2"]
  },
  "application/vnd.ezpix-package": {
    "source": "iana",
    "extensions": ["ez3"]
  },
  "application/vnd.f-secure.mobile": {
    "source": "iana"
  },
  "application/vnd.fastcopy-disk-image": {
    "source": "iana"
  },
  "application/vnd.fdf": {
    "source": "iana",
    "extensions": ["fdf"]
  },
  "application/vnd.fdsn.mseed": {
    "source": "iana",
    "extensions": ["mseed"]
  },
  "application/vnd.fdsn.seed": {
    "source": "iana",
    "extensions": ["seed","dataless"]
  },
  "application/vnd.ffsns": {
    "source": "iana"
  },
  "application/vnd.ficlab.flb+zip": {
    "source": "iana",
    "compressible": false
  },
  "application/vnd.filmit.zfc": {
    "source": "iana"
  },
  "application/vnd.fints": {
    "source": "iana"
  },
  "application/vnd.firemonkeys.cloudcell": {
    "source": "iana"
  },
  "application/vnd.flographit": {
    "source": "iana",
    "extensions": ["gph"]
  },
  "application/vnd.fluxtime.clip": {
    "source": "iana",
    "extensions": ["ftc"]
  },
  "application/vnd.font-fontforge-sfd": {
    "source": "iana"
  },
  "application/vnd.framemaker": {
    "source": "iana",
    "extensions": ["fm","frame","maker","book"]
  },
  "application/vnd.frogans.fnc": {
    "source": "iana",
    "extensions": ["fnc"]
  },
  "application/vnd.frogans.ltf": {
    "source": "iana",
    "extensions": ["ltf"]
  },
  "application/vnd.fsc.weblaunch": {
    "source": "iana",
    "extensions": ["fsc"]
  },
  "application/vnd.fujifilm.fb.docuworks": {
    "source": "iana"
  },
  "application/vnd.fujifilm.fb.docuworks.binder": {
    "source": "iana"
  },
  "application/vnd.fujifilm.fb.docuworks.container": {
    "source": "iana"
  },
  "application/vnd.fujifilm.fb.jfi+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.fujitsu.oasys": {
    "source": "iana",
    "extensions": ["oas"]
  },
  "application/vnd.fujitsu.oasys2": {
    "source": "iana",
    "extensions": ["oa2"]
  },
  "application/vnd.fujitsu.oasys3": {
    "source": "iana",
    "extensions": ["oa3"]
  },
  "application/vnd.fujitsu.oasysgp": {
    "source": "iana",
    "extensions": ["fg5"]
  },
  "application/vnd.fujitsu.oasysprs": {
    "source": "iana",
    "extensions": ["bh2"]
  },
  "application/vnd.fujixerox.art-ex": {
    "source": "iana"
  },
  "application/vnd.fujixerox.art4": {
    "source": "iana"
  },
  "application/vnd.fujixerox.ddd": {
    "source": "iana",
    "extensions": ["ddd"]
  },
  "application/vnd.fujixerox.docuworks": {
    "source": "iana",
    "extensions": ["xdw"]
  },
  "application/vnd.fujixerox.docuworks.binder": {
    "source": "iana",
    "extensions": ["xbd"]
  },
  "application/vnd.fujixerox.docuworks.container": {
    "source": "iana"
  },
  "application/vnd.fujixerox.hbpl": {
    "source": "iana"
  },
  "application/vnd.fut-misnet": {
    "source": "iana"
  },
  "application/vnd.futoin+cbor": {
    "source": "iana"
  },
  "application/vnd.futoin+json": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.fuzzysheet": {
    "source": "iana",
    "extensions": ["fzs"]
  },
  "application/vnd.genomatix.tuxedo": {
    "source": "iana",
    "extensions": ["txd"]
  },
  "application/vnd.gentics.grd+json": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.geo+json": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.geocube+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.geogebra.file": {
    "source": "iana",
    "extensions": ["ggb"]
  },
  "application/vnd.geogebra.slides": {
    "source": "iana"
  },
  "application/vnd.geogebra.tool": {
    "source": "iana",
    "extensions": ["ggt"]
  },
  "application/vnd.geometry-explorer": {
    "source": "iana",
    "extensions": ["gex","gre"]
  },
  "application/vnd.geonext": {
    "source": "iana",
    "extensions": ["gxt"]
  },
  "application/vnd.geoplan": {
    "source": "iana",
    "extensions": ["g2w"]
  },
  "application/vnd.geospace": {
    "source": "iana",
    "extensions": ["g3w"]
  },
  "application/vnd.gerber": {
    "source": "iana"
  },
  "application/vnd.globalplatform.card-content-mgt": {
    "source": "iana"
  },
  "application/vnd.globalplatform.card-content-mgt-response": {
    "source": "iana"
  },
  "application/vnd.gmx": {
    "source": "iana",
    "extensions": ["gmx"]
  },
  "application/vnd.google-apps.document": {
    "compressible": false,
    "extensions": ["gdoc"]
  },
  "application/vnd.google-apps.presentation": {
    "compressible": false,
    "extensions": ["gslides"]
  },
  "application/vnd.google-apps.spreadsheet": {
    "compressible": false,
    "extensions": ["gsheet"]
  },
  "application/vnd.google-earth.kml+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["kml"]
  },
  "application/vnd.google-earth.kmz": {
    "source": "iana",
    "compressible": false,
    "extensions": ["kmz"]
  },
  "application/vnd.gov.sk.e-form+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.gov.sk.e-form+zip": {
    "source": "iana",
    "compressible": false
  },
  "application/vnd.gov.sk.xmldatacontainer+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.grafeq": {
    "source": "iana",
    "extensions": ["gqf","gqs"]
  },
  "application/vnd.gridmp": {
    "source": "iana"
  },
  "application/vnd.groove-account": {
    "source": "iana",
    "extensions": ["gac"]
  },
  "application/vnd.groove-help": {
    "source": "iana",
    "extensions": ["ghf"]
  },
  "application/vnd.groove-identity-message": {
    "source": "iana",
    "extensions": ["gim"]
  },
  "application/vnd.groove-injector": {
    "source": "iana",
    "extensions": ["grv"]
  },
  "application/vnd.groove-tool-message": {
    "source": "iana",
    "extensions": ["gtm"]
  },
  "application/vnd.groove-tool-template": {
    "source": "iana",
    "extensions": ["tpl"]
  },
  "application/vnd.groove-vcard": {
    "source": "iana",
    "extensions": ["vcg"]
  },
  "application/vnd.hal+json": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.hal+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["hal"]
  },
  "application/vnd.handheld-entertainment+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["zmm"]
  },
  "application/vnd.hbci": {
    "source": "iana",
    "extensions": ["hbci"]
  },
  "application/vnd.hc+json": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.hcl-bireports": {
    "source": "iana"
  },
  "application/vnd.hdt": {
    "source": "iana"
  },
  "application/vnd.heroku+json": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.hhe.lesson-player": {
    "source": "iana",
    "extensions": ["les"]
  },
  "application/vnd.hp-hpgl": {
    "source": "iana",
    "extensions": ["hpgl"]
  },
  "application/vnd.hp-hpid": {
    "source": "iana",
    "extensions": ["hpid"]
  },
  "application/vnd.hp-hps": {
    "source": "iana",
    "extensions": ["hps"]
  },
  "application/vnd.hp-jlyt": {
    "source": "iana",
    "extensions": ["jlt"]
  },
  "application/vnd.hp-pcl": {
    "source": "iana",
    "extensions": ["pcl"]
  },
  "application/vnd.hp-pclxl": {
    "source": "iana",
    "extensions": ["pclxl"]
  },
  "application/vnd.httphone": {
    "source": "iana"
  },
  "application/vnd.hydrostatix.sof-data": {
    "source": "iana",
    "extensions": ["sfd-hdstx"]
  },
  "application/vnd.hyper+json": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.hyper-item+json": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.hyperdrive+json": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.hzn-3d-crossword": {
    "source": "iana"
  },
  "application/vnd.ibm.afplinedata": {
    "source": "iana"
  },
  "application/vnd.ibm.electronic-media": {
    "source": "iana"
  },
  "application/vnd.ibm.minipay": {
    "source": "iana",
    "extensions": ["mpy"]
  },
  "application/vnd.ibm.modcap": {
    "source": "iana",
    "extensions": ["afp","listafp","list3820"]
  },
  "application/vnd.ibm.rights-management": {
    "source": "iana",
    "extensions": ["irm"]
  },
  "application/vnd.ibm.secure-container": {
    "source": "iana",
    "extensions": ["sc"]
  },
  "application/vnd.iccprofile": {
    "source": "iana",
    "extensions": ["icc","icm"]
  },
  "application/vnd.ieee.1905": {
    "source": "iana"
  },
  "application/vnd.igloader": {
    "source": "iana",
    "extensions": ["igl"]
  },
  "application/vnd.imagemeter.folder+zip": {
    "source": "iana",
    "compressible": false
  },
  "application/vnd.imagemeter.image+zip": {
    "source": "iana",
    "compressible": false
  },
  "application/vnd.immervision-ivp": {
    "source": "iana",
    "extensions": ["ivp"]
  },
  "application/vnd.immervision-ivu": {
    "source": "iana",
    "extensions": ["ivu"]
  },
  "application/vnd.ims.imsccv1p1": {
    "source": "iana"
  },
  "application/vnd.ims.imsccv1p2": {
    "source": "iana"
  },
  "application/vnd.ims.imsccv1p3": {
    "source": "iana"
  },
  "application/vnd.ims.lis.v2.result+json": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.ims.lti.v2.toolconsumerprofile+json": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.ims.lti.v2.toolproxy+json": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.ims.lti.v2.toolproxy.id+json": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.ims.lti.v2.toolsettings+json": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.ims.lti.v2.toolsettings.simple+json": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.informedcontrol.rms+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.informix-visionary": {
    "source": "iana"
  },
  "application/vnd.infotech.project": {
    "source": "iana"
  },
  "application/vnd.infotech.project+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.innopath.wamp.notification": {
    "source": "iana"
  },
  "application/vnd.insors.igm": {
    "source": "iana",
    "extensions": ["igm"]
  },
  "application/vnd.intercon.formnet": {
    "source": "iana",
    "extensions": ["xpw","xpx"]
  },
  "application/vnd.intergeo": {
    "source": "iana",
    "extensions": ["i2g"]
  },
  "application/vnd.intertrust.digibox": {
    "source": "iana"
  },
  "application/vnd.intertrust.nncp": {
    "source": "iana"
  },
  "application/vnd.intu.qbo": {
    "source": "iana",
    "extensions": ["qbo"]
  },
  "application/vnd.intu.qfx": {
    "source": "iana",
    "extensions": ["qfx"]
  },
  "application/vnd.iptc.g2.catalogitem+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.iptc.g2.conceptitem+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.iptc.g2.knowledgeitem+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.iptc.g2.newsitem+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.iptc.g2.newsmessage+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.iptc.g2.packageitem+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.iptc.g2.planningitem+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.ipunplugged.rcprofile": {
    "source": "iana",
    "extensions": ["rcprofile"]
  },
  "application/vnd.irepository.package+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["irp"]
  },
  "application/vnd.is-xpr": {
    "source": "iana",
    "extensions": ["xpr"]
  },
  "application/vnd.isac.fcs": {
    "source": "iana",
    "extensions": ["fcs"]
  },
  "application/vnd.iso11783-10+zip": {
    "source": "iana",
    "compressible": false
  },
  "application/vnd.jam": {
    "source": "iana",
    "extensions": ["jam"]
  },
  "application/vnd.japannet-directory-service": {
    "source": "iana"
  },
  "application/vnd.japannet-jpnstore-wakeup": {
    "source": "iana"
  },
  "application/vnd.japannet-payment-wakeup": {
    "source": "iana"
  },
  "application/vnd.japannet-registration": {
    "source": "iana"
  },
  "application/vnd.japannet-registration-wakeup": {
    "source": "iana"
  },
  "application/vnd.japannet-setstore-wakeup": {
    "source": "iana"
  },
  "application/vnd.japannet-verification": {
    "source": "iana"
  },
  "application/vnd.japannet-verification-wakeup": {
    "source": "iana"
  },
  "application/vnd.jcp.javame.midlet-rms": {
    "source": "iana",
    "extensions": ["rms"]
  },
  "application/vnd.jisp": {
    "source": "iana",
    "extensions": ["jisp"]
  },
  "application/vnd.joost.joda-archive": {
    "source": "iana",
    "extensions": ["joda"]
  },
  "application/vnd.jsk.isdn-ngn": {
    "source": "iana"
  },
  "application/vnd.kahootz": {
    "source": "iana",
    "extensions": ["ktz","ktr"]
  },
  "application/vnd.kde.karbon": {
    "source": "iana",
    "extensions": ["karbon"]
  },
  "application/vnd.kde.kchart": {
    "source": "iana",
    "extensions": ["chrt"]
  },
  "application/vnd.kde.kformula": {
    "source": "iana",
    "extensions": ["kfo"]
  },
  "application/vnd.kde.kivio": {
    "source": "iana",
    "extensions": ["flw"]
  },
  "application/vnd.kde.kontour": {
    "source": "iana",
    "extensions": ["kon"]
  },
  "application/vnd.kde.kpresenter": {
    "source": "iana",
    "extensions": ["kpr","kpt"]
  },
  "application/vnd.kde.kspread": {
    "source": "iana",
    "extensions": ["ksp"]
  },
  "application/vnd.kde.kword": {
    "source": "iana",
    "extensions": ["kwd","kwt"]
  },
  "application/vnd.kenameaapp": {
    "source": "iana",
    "extensions": ["htke"]
  },
  "application/vnd.kidspiration": {
    "source": "iana",
    "extensions": ["kia"]
  },
  "application/vnd.kinar": {
    "source": "iana",
    "extensions": ["kne","knp"]
  },
  "application/vnd.koan": {
    "source": "iana",
    "extensions": ["skp","skd","skt","skm"]
  },
  "application/vnd.kodak-descriptor": {
    "source": "iana",
    "extensions": ["sse"]
  },
  "application/vnd.las": {
    "source": "iana"
  },
  "application/vnd.las.las+json": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.las.las+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["lasxml"]
  },
  "application/vnd.laszip": {
    "source": "iana"
  },
  "application/vnd.leap+json": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.liberty-request+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.llamagraphics.life-balance.desktop": {
    "source": "iana",
    "extensions": ["lbd"]
  },
  "application/vnd.llamagraphics.life-balance.exchange+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["lbe"]
  },
  "application/vnd.logipipe.circuit+zip": {
    "source": "iana",
    "compressible": false
  },
  "application/vnd.loom": {
    "source": "iana"
  },
  "application/vnd.lotus-1-2-3": {
    "source": "iana",
    "extensions": ["123"]
  },
  "application/vnd.lotus-approach": {
    "source": "iana",
    "extensions": ["apr"]
  },
  "application/vnd.lotus-freelance": {
    "source": "iana",
    "extensions": ["pre"]
  },
  "application/vnd.lotus-notes": {
    "source": "iana",
    "extensions": ["nsf"]
  },
  "application/vnd.lotus-organizer": {
    "source": "iana",
    "extensions": ["org"]
  },
  "application/vnd.lotus-screencam": {
    "source": "iana",
    "extensions": ["scm"]
  },
  "application/vnd.lotus-wordpro": {
    "source": "iana",
    "extensions": ["lwp"]
  },
  "application/vnd.macports.portpkg": {
    "source": "iana",
    "extensions": ["portpkg"]
  },
  "application/vnd.mapbox-vector-tile": {
    "source": "iana",
    "extensions": ["mvt"]
  },
  "application/vnd.marlin.drm.actiontoken+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.marlin.drm.conftoken+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.marlin.drm.license+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.marlin.drm.mdcf": {
    "source": "iana"
  },
  "application/vnd.mason+json": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.maxmind.maxmind-db": {
    "source": "iana"
  },
  "application/vnd.mcd": {
    "source": "iana",
    "extensions": ["mcd"]
  },
  "application/vnd.medcalcdata": {
    "source": "iana",
    "extensions": ["mc1"]
  },
  "application/vnd.mediastation.cdkey": {
    "source": "iana",
    "extensions": ["cdkey"]
  },
  "application/vnd.meridian-slingshot": {
    "source": "iana"
  },
  "application/vnd.mfer": {
    "source": "iana",
    "extensions": ["mwf"]
  },
  "application/vnd.mfmp": {
    "source": "iana",
    "extensions": ["mfm"]
  },
  "application/vnd.micro+json": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.micrografx.flo": {
    "source": "iana",
    "extensions": ["flo"]
  },
  "application/vnd.micrografx.igx": {
    "source": "iana",
    "extensions": ["igx"]
  },
  "application/vnd.microsoft.portable-executable": {
    "source": "iana"
  },
  "application/vnd.microsoft.windows.thumbnail-cache": {
    "source": "iana"
  },
  "application/vnd.miele+json": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.mif": {
    "source": "iana",
    "extensions": ["mif"]
  },
  "application/vnd.minisoft-hp3000-save": {
    "source": "iana"
  },
  "application/vnd.mitsubishi.misty-guard.trustweb": {
    "source": "iana"
  },
  "application/vnd.mobius.daf": {
    "source": "iana",
    "extensions": ["daf"]
  },
  "application/vnd.mobius.dis": {
    "source": "iana",
    "extensions": ["dis"]
  },
  "application/vnd.mobius.mbk": {
    "source": "iana",
    "extensions": ["mbk"]
  },
  "application/vnd.mobius.mqy": {
    "source": "iana",
    "extensions": ["mqy"]
  },
  "application/vnd.mobius.msl": {
    "source": "iana",
    "extensions": ["msl"]
  },
  "application/vnd.mobius.plc": {
    "source": "iana",
    "extensions": ["plc"]
  },
  "application/vnd.mobius.txf": {
    "source": "iana",
    "extensions": ["txf"]
  },
  "application/vnd.mophun.application": {
    "source": "iana",
    "extensions": ["mpn"]
  },
  "application/vnd.mophun.certificate": {
    "source": "iana",
    "extensions": ["mpc"]
  },
  "application/vnd.motorola.flexsuite": {
    "source": "iana"
  },
  "application/vnd.motorola.flexsuite.adsi": {
    "source": "iana"
  },
  "application/vnd.motorola.flexsuite.fis": {
    "source": "iana"
  },
  "application/vnd.motorola.flexsuite.gotap": {
    "source": "iana"
  },
  "application/vnd.motorola.flexsuite.kmr": {
    "source": "iana"
  },
  "application/vnd.motorola.flexsuite.ttc": {
    "source": "iana"
  },
  "application/vnd.motorola.flexsuite.wem": {
    "source": "iana"
  },
  "application/vnd.motorola.iprm": {
    "source": "iana"
  },
  "application/vnd.mozilla.xul+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["xul"]
  },
  "application/vnd.ms-3mfdocument": {
    "source": "iana"
  },
  "application/vnd.ms-artgalry": {
    "source": "iana",
    "extensions": ["cil"]
  },
  "application/vnd.ms-asf": {
    "source": "iana"
  },
  "application/vnd.ms-cab-compressed": {
    "source": "iana",
    "extensions": ["cab"]
  },
  "application/vnd.ms-color.iccprofile": {
    "source": "apache"
  },
  "application/vnd.ms-excel": {
    "source": "iana",
    "compressible": false,
    "extensions": ["xls","xlm","xla","xlc","xlt","xlw"]
  },
  "application/vnd.ms-excel.addin.macroenabled.12": {
    "source": "iana",
    "extensions": ["xlam"]
  },
  "application/vnd.ms-excel.sheet.binary.macroenabled.12": {
    "source": "iana",
    "extensions": ["xlsb"]
  },
  "application/vnd.ms-excel.sheet.macroenabled.12": {
    "source": "iana",
    "extensions": ["xlsm"]
  },
  "application/vnd.ms-excel.template.macroenabled.12": {
    "source": "iana",
    "extensions": ["xltm"]
  },
  "application/vnd.ms-fontobject": {
    "source": "iana",
    "compressible": true,
    "extensions": ["eot"]
  },
  "application/vnd.ms-htmlhelp": {
    "source": "iana",
    "extensions": ["chm"]
  },
  "application/vnd.ms-ims": {
    "source": "iana",
    "extensions": ["ims"]
  },
  "application/vnd.ms-lrm": {
    "source": "iana",
    "extensions": ["lrm"]
  },
  "application/vnd.ms-office.activex+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.ms-officetheme": {
    "source": "iana",
    "extensions": ["thmx"]
  },
  "application/vnd.ms-opentype": {
    "source": "apache",
    "compressible": true
  },
  "application/vnd.ms-outlook": {
    "compressible": false,
    "extensions": ["msg"]
  },
  "application/vnd.ms-package.obfuscated-opentype": {
    "source": "apache"
  },
  "application/vnd.ms-pki.seccat": {
    "source": "apache",
    "extensions": ["cat"]
  },
  "application/vnd.ms-pki.stl": {
    "source": "apache",
    "extensions": ["stl"]
  },
  "application/vnd.ms-playready.initiator+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.ms-powerpoint": {
    "source": "iana",
    "compressible": false,
    "extensions": ["ppt","pps","pot"]
  },
  "application/vnd.ms-powerpoint.addin.macroenabled.12": {
    "source": "iana",
    "extensions": ["ppam"]
  },
  "application/vnd.ms-powerpoint.presentation.macroenabled.12": {
    "source": "iana",
    "extensions": ["pptm"]
  },
  "application/vnd.ms-powerpoint.slide.macroenabled.12": {
    "source": "iana",
    "extensions": ["sldm"]
  },
  "application/vnd.ms-powerpoint.slideshow.macroenabled.12": {
    "source": "iana",
    "extensions": ["ppsm"]
  },
  "application/vnd.ms-powerpoint.template.macroenabled.12": {
    "source": "iana",
    "extensions": ["potm"]
  },
  "application/vnd.ms-printdevicecapabilities+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.ms-printing.printticket+xml": {
    "source": "apache",
    "compressible": true
  },
  "application/vnd.ms-printschematicket+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.ms-project": {
    "source": "iana",
    "extensions": ["mpp","mpt"]
  },
  "application/vnd.ms-tnef": {
    "source": "iana"
  },
  "application/vnd.ms-windows.devicepairing": {
    "source": "iana"
  },
  "application/vnd.ms-windows.nwprinting.oob": {
    "source": "iana"
  },
  "application/vnd.ms-windows.printerpairing": {
    "source": "iana"
  },
  "application/vnd.ms-windows.wsd.oob": {
    "source": "iana"
  },
  "application/vnd.ms-wmdrm.lic-chlg-req": {
    "source": "iana"
  },
  "application/vnd.ms-wmdrm.lic-resp": {
    "source": "iana"
  },
  "application/vnd.ms-wmdrm.meter-chlg-req": {
    "source": "iana"
  },
  "application/vnd.ms-wmdrm.meter-resp": {
    "source": "iana"
  },
  "application/vnd.ms-word.document.macroenabled.12": {
    "source": "iana",
    "extensions": ["docm"]
  },
  "application/vnd.ms-word.template.macroenabled.12": {
    "source": "iana",
    "extensions": ["dotm"]
  },
  "application/vnd.ms-works": {
    "source": "iana",
    "extensions": ["wps","wks","wcm","wdb"]
  },
  "application/vnd.ms-wpl": {
    "source": "iana",
    "extensions": ["wpl"]
  },
  "application/vnd.ms-xpsdocument": {
    "source": "iana",
    "compressible": false,
    "extensions": ["xps"]
  },
  "application/vnd.msa-disk-image": {
    "source": "iana"
  },
  "application/vnd.mseq": {
    "source": "iana",
    "extensions": ["mseq"]
  },
  "application/vnd.msign": {
    "source": "iana"
  },
  "application/vnd.multiad.creator": {
    "source": "iana"
  },
  "application/vnd.multiad.creator.cif": {
    "source": "iana"
  },
  "application/vnd.music-niff": {
    "source": "iana"
  },
  "application/vnd.musician": {
    "source": "iana",
    "extensions": ["mus"]
  },
  "application/vnd.muvee.style": {
    "source": "iana",
    "extensions": ["msty"]
  },
  "application/vnd.mynfc": {
    "source": "iana",
    "extensions": ["taglet"]
  },
  "application/vnd.nacamar.ybrid+json": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.ncd.control": {
    "source": "iana"
  },
  "application/vnd.ncd.reference": {
    "source": "iana"
  },
  "application/vnd.nearst.inv+json": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.nebumind.line": {
    "source": "iana"
  },
  "application/vnd.nervana": {
    "source": "iana"
  },
  "application/vnd.netfpx": {
    "source": "iana"
  },
  "application/vnd.neurolanguage.nlu": {
    "source": "iana",
    "extensions": ["nlu"]
  },
  "application/vnd.nimn": {
    "source": "iana"
  },
  "application/vnd.nintendo.nitro.rom": {
    "source": "iana"
  },
  "application/vnd.nintendo.snes.rom": {
    "source": "iana"
  },
  "application/vnd.nitf": {
    "source": "iana",
    "extensions": ["ntf","nitf"]
  },
  "application/vnd.noblenet-directory": {
    "source": "iana",
    "extensions": ["nnd"]
  },
  "application/vnd.noblenet-sealer": {
    "source": "iana",
    "extensions": ["nns"]
  },
  "application/vnd.noblenet-web": {
    "source": "iana",
    "extensions": ["nnw"]
  },
  "application/vnd.nokia.catalogs": {
    "source": "iana"
  },
  "application/vnd.nokia.conml+wbxml": {
    "source": "iana"
  },
  "application/vnd.nokia.conml+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.nokia.iptv.config+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.nokia.isds-radio-presets": {
    "source": "iana"
  },
  "application/vnd.nokia.landmark+wbxml": {
    "source": "iana"
  },
  "application/vnd.nokia.landmark+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.nokia.landmarkcollection+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.nokia.n-gage.ac+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["ac"]
  },
  "application/vnd.nokia.n-gage.data": {
    "source": "iana",
    "extensions": ["ngdat"]
  },
  "application/vnd.nokia.n-gage.symbian.install": {
    "source": "iana",
    "extensions": ["n-gage"]
  },
  "application/vnd.nokia.ncd": {
    "source": "iana"
  },
  "application/vnd.nokia.pcd+wbxml": {
    "source": "iana"
  },
  "application/vnd.nokia.pcd+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.nokia.radio-preset": {
    "source": "iana",
    "extensions": ["rpst"]
  },
  "application/vnd.nokia.radio-presets": {
    "source": "iana",
    "extensions": ["rpss"]
  },
  "application/vnd.novadigm.edm": {
    "source": "iana",
    "extensions": ["edm"]
  },
  "application/vnd.novadigm.edx": {
    "source": "iana",
    "extensions": ["edx"]
  },
  "application/vnd.novadigm.ext": {
    "source": "iana",
    "extensions": ["ext"]
  },
  "application/vnd.ntt-local.content-share": {
    "source": "iana"
  },
  "application/vnd.ntt-local.file-transfer": {
    "source": "iana"
  },
  "application/vnd.ntt-local.ogw_remote-access": {
    "source": "iana"
  },
  "application/vnd.ntt-local.sip-ta_remote": {
    "source": "iana"
  },
  "application/vnd.ntt-local.sip-ta_tcp_stream": {
    "source": "iana"
  },
  "application/vnd.oasis.opendocument.chart": {
    "source": "iana",
    "extensions": ["odc"]
  },
  "application/vnd.oasis.opendocument.chart-template": {
    "source": "iana",
    "extensions": ["otc"]
  },
  "application/vnd.oasis.opendocument.database": {
    "source": "iana",
    "extensions": ["odb"]
  },
  "application/vnd.oasis.opendocument.formula": {
    "source": "iana",
    "extensions": ["odf"]
  },
  "application/vnd.oasis.opendocument.formula-template": {
    "source": "iana",
    "extensions": ["odft"]
  },
  "application/vnd.oasis.opendocument.graphics": {
    "source": "iana",
    "compressible": false,
    "extensions": ["odg"]
  },
  "application/vnd.oasis.opendocument.graphics-template": {
    "source": "iana",
    "extensions": ["otg"]
  },
  "application/vnd.oasis.opendocument.image": {
    "source": "iana",
    "extensions": ["odi"]
  },
  "application/vnd.oasis.opendocument.image-template": {
    "source": "iana",
    "extensions": ["oti"]
  },
  "application/vnd.oasis.opendocument.presentation": {
    "source": "iana",
    "compressible": false,
    "extensions": ["odp"]
  },
  "application/vnd.oasis.opendocument.presentation-template": {
    "source": "iana",
    "extensions": ["otp"]
  },
  "application/vnd.oasis.opendocument.spreadsheet": {
    "source": "iana",
    "compressible": false,
    "extensions": ["ods"]
  },
  "application/vnd.oasis.opendocument.spreadsheet-template": {
    "source": "iana",
    "extensions": ["ots"]
  },
  "application/vnd.oasis.opendocument.text": {
    "source": "iana",
    "compressible": false,
    "extensions": ["odt"]
  },
  "application/vnd.oasis.opendocument.text-master": {
    "source": "iana",
    "extensions": ["odm"]
  },
  "application/vnd.oasis.opendocument.text-template": {
    "source": "iana",
    "extensions": ["ott"]
  },
  "application/vnd.oasis.opendocument.text-web": {
    "source": "iana",
    "extensions": ["oth"]
  },
  "application/vnd.obn": {
    "source": "iana"
  },
  "application/vnd.ocf+cbor": {
    "source": "iana"
  },
  "application/vnd.oci.image.manifest.v1+json": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.oftn.l10n+json": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.oipf.contentaccessdownload+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.oipf.contentaccessstreaming+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.oipf.cspg-hexbinary": {
    "source": "iana"
  },
  "application/vnd.oipf.dae.svg+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.oipf.dae.xhtml+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.oipf.mippvcontrolmessage+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.oipf.pae.gem": {
    "source": "iana"
  },
  "application/vnd.oipf.spdiscovery+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.oipf.spdlist+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.oipf.ueprofile+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.oipf.userprofile+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.olpc-sugar": {
    "source": "iana",
    "extensions": ["xo"]
  },
  "application/vnd.oma-scws-config": {
    "source": "iana"
  },
  "application/vnd.oma-scws-http-request": {
    "source": "iana"
  },
  "application/vnd.oma-scws-http-response": {
    "source": "iana"
  },
  "application/vnd.oma.bcast.associated-procedure-parameter+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.oma.bcast.drm-trigger+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.oma.bcast.imd+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.oma.bcast.ltkm": {
    "source": "iana"
  },
  "application/vnd.oma.bcast.notification+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.oma.bcast.provisioningtrigger": {
    "source": "iana"
  },
  "application/vnd.oma.bcast.sgboot": {
    "source": "iana"
  },
  "application/vnd.oma.bcast.sgdd+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.oma.bcast.sgdu": {
    "source": "iana"
  },
  "application/vnd.oma.bcast.simple-symbol-container": {
    "source": "iana"
  },
  "application/vnd.oma.bcast.smartcard-trigger+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.oma.bcast.sprov+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.oma.bcast.stkm": {
    "source": "iana"
  },
  "application/vnd.oma.cab-address-book+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.oma.cab-feature-handler+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.oma.cab-pcc+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.oma.cab-subs-invite+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.oma.cab-user-prefs+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.oma.dcd": {
    "source": "iana"
  },
  "application/vnd.oma.dcdc": {
    "source": "iana"
  },
  "application/vnd.oma.dd2+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["dd2"]
  },
  "application/vnd.oma.drm.risd+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.oma.group-usage-list+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.oma.lwm2m+cbor": {
    "source": "iana"
  },
  "application/vnd.oma.lwm2m+json": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.oma.lwm2m+tlv": {
    "source": "iana"
  },
  "application/vnd.oma.pal+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.oma.poc.detailed-progress-report+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.oma.poc.final-report+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.oma.poc.groups+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.oma.poc.invocation-descriptor+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.oma.poc.optimized-progress-report+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.oma.push": {
    "source": "iana"
  },
  "application/vnd.oma.scidm.messages+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.oma.xcap-directory+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.omads-email+xml": {
    "source": "iana",
    "charset": "UTF-8",
    "compressible": true
  },
  "application/vnd.omads-file+xml": {
    "source": "iana",
    "charset": "UTF-8",
    "compressible": true
  },
  "application/vnd.omads-folder+xml": {
    "source": "iana",
    "charset": "UTF-8",
    "compressible": true
  },
  "application/vnd.omaloc-supl-init": {
    "source": "iana"
  },
  "application/vnd.onepager": {
    "source": "iana"
  },
  "application/vnd.onepagertamp": {
    "source": "iana"
  },
  "application/vnd.onepagertamx": {
    "source": "iana"
  },
  "application/vnd.onepagertat": {
    "source": "iana"
  },
  "application/vnd.onepagertatp": {
    "source": "iana"
  },
  "application/vnd.onepagertatx": {
    "source": "iana"
  },
  "application/vnd.openblox.game+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["obgx"]
  },
  "application/vnd.openblox.game-binary": {
    "source": "iana"
  },
  "application/vnd.openeye.oeb": {
    "source": "iana"
  },
  "application/vnd.openofficeorg.extension": {
    "source": "apache",
    "extensions": ["oxt"]
  },
  "application/vnd.openstreetmap.data+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["osm"]
  },
  "application/vnd.opentimestamps.ots": {
    "source": "iana"
  },
  "application/vnd.openxmlformats-officedocument.custom-properties+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.openxmlformats-officedocument.customxmlproperties+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.openxmlformats-officedocument.drawing+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.openxmlformats-officedocument.drawingml.chart+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.openxmlformats-officedocument.drawingml.chartshapes+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.openxmlformats-officedocument.drawingml.diagramcolors+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.openxmlformats-officedocument.drawingml.diagramdata+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.openxmlformats-officedocument.drawingml.diagramlayout+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.openxmlformats-officedocument.drawingml.diagramstyle+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.openxmlformats-officedocument.extended-properties+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.openxmlformats-officedocument.presentationml.commentauthors+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.openxmlformats-officedocument.presentationml.comments+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.openxmlformats-officedocument.presentationml.handoutmaster+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.openxmlformats-officedocument.presentationml.notesmaster+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.openxmlformats-officedocument.presentationml.notesslide+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": {
    "source": "iana",
    "compressible": false,
    "extensions": ["pptx"]
  },
  "application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.openxmlformats-officedocument.presentationml.presprops+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.openxmlformats-officedocument.presentationml.slide": {
    "source": "iana",
    "extensions": ["sldx"]
  },
  "application/vnd.openxmlformats-officedocument.presentationml.slide+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.openxmlformats-officedocument.presentationml.slidelayout+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.openxmlformats-officedocument.presentationml.slidemaster+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.openxmlformats-officedocument.presentationml.slideshow": {
    "source": "iana",
    "extensions": ["ppsx"]
  },
  "application/vnd.openxmlformats-officedocument.presentationml.slideshow.main+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.openxmlformats-officedocument.presentationml.slideupdateinfo+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.openxmlformats-officedocument.presentationml.tablestyles+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.openxmlformats-officedocument.presentationml.tags+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.openxmlformats-officedocument.presentationml.template": {
    "source": "iana",
    "extensions": ["potx"]
  },
  "application/vnd.openxmlformats-officedocument.presentationml.template.main+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.openxmlformats-officedocument.presentationml.viewprops+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.calcchain+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.chartsheet+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.comments+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.connections+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.dialogsheet+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.externallink+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.pivotcachedefinition+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.pivotcacherecords+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.pivottable+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.querytable+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.revisionheaders+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.revisionlog+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sharedstrings+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
    "source": "iana",
    "compressible": false,
    "extensions": ["xlsx"]
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheetmetadata+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.table+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.tablesinglecells+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.template": {
    "source": "iana",
    "extensions": ["xltx"]
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.template.main+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.usernames+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.volatiledependencies+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.openxmlformats-officedocument.theme+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.openxmlformats-officedocument.themeoverride+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.openxmlformats-officedocument.vmldrawing": {
    "source": "iana"
  },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.comments+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
    "source": "iana",
    "compressible": false,
    "extensions": ["docx"]
  },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document.glossary+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.endnotes+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.fonttable+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.footnotes+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.template": {
    "source": "iana",
    "extensions": ["dotx"]
  },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.template.main+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.websettings+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.openxmlformats-package.core-properties+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.openxmlformats-package.digital-signature-xmlsignature+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.openxmlformats-package.relationships+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.oracle.resource+json": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.orange.indata": {
    "source": "iana"
  },
  "application/vnd.osa.netdeploy": {
    "source": "iana"
  },
  "application/vnd.osgeo.mapguide.package": {
    "source": "iana",
    "extensions": ["mgp"]
  },
  "application/vnd.osgi.bundle": {
    "source": "iana"
  },
  "application/vnd.osgi.dp": {
    "source": "iana",
    "extensions": ["dp"]
  },
  "application/vnd.osgi.subsystem": {
    "source": "iana",
    "extensions": ["esa"]
  },
  "application/vnd.otps.ct-kip+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.oxli.countgraph": {
    "source": "iana"
  },
  "application/vnd.pagerduty+json": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.palm": {
    "source": "iana",
    "extensions": ["pdb","pqa","oprc"]
  },
  "application/vnd.panoply": {
    "source": "iana"
  },
  "application/vnd.paos.xml": {
    "source": "iana"
  },
  "application/vnd.patentdive": {
    "source": "iana"
  },
  "application/vnd.patientecommsdoc": {
    "source": "iana"
  },
  "application/vnd.pawaafile": {
    "source": "iana",
    "extensions": ["paw"]
  },
  "application/vnd.pcos": {
    "source": "iana"
  },
  "application/vnd.pg.format": {
    "source": "iana",
    "extensions": ["str"]
  },
  "application/vnd.pg.osasli": {
    "source": "iana",
    "extensions": ["ei6"]
  },
  "application/vnd.piaccess.application-licence": {
    "source": "iana"
  },
  "application/vnd.picsel": {
    "source": "iana",
    "extensions": ["efif"]
  },
  "application/vnd.pmi.widget": {
    "source": "iana",
    "extensions": ["wg"]
  },
  "application/vnd.poc.group-advertisement+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.pocketlearn": {
    "source": "iana",
    "extensions": ["plf"]
  },
  "application/vnd.powerbuilder6": {
    "source": "iana",
    "extensions": ["pbd"]
  },
  "application/vnd.powerbuilder6-s": {
    "source": "iana"
  },
  "application/vnd.powerbuilder7": {
    "source": "iana"
  },
  "application/vnd.powerbuilder7-s": {
    "source": "iana"
  },
  "application/vnd.powerbuilder75": {
    "source": "iana"
  },
  "application/vnd.powerbuilder75-s": {
    "source": "iana"
  },
  "application/vnd.preminet": {
    "source": "iana"
  },
  "application/vnd.previewsystems.box": {
    "source": "iana",
    "extensions": ["box"]
  },
  "application/vnd.proteus.magazine": {
    "source": "iana",
    "extensions": ["mgz"]
  },
  "application/vnd.psfs": {
    "source": "iana"
  },
  "application/vnd.publishare-delta-tree": {
    "source": "iana",
    "extensions": ["qps"]
  },
  "application/vnd.pvi.ptid1": {
    "source": "iana",
    "extensions": ["ptid"]
  },
  "application/vnd.pwg-multiplexed": {
    "source": "iana"
  },
  "application/vnd.pwg-xhtml-print+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.qualcomm.brew-app-res": {
    "source": "iana"
  },
  "application/vnd.quarantainenet": {
    "source": "iana"
  },
  "application/vnd.quark.quarkxpress": {
    "source": "iana",
    "extensions": ["qxd","qxt","qwd","qwt","qxl","qxb"]
  },
  "application/vnd.quobject-quoxdocument": {
    "source": "iana"
  },
  "application/vnd.radisys.moml+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.radisys.msml+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.radisys.msml-audit+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.radisys.msml-audit-conf+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.radisys.msml-audit-conn+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.radisys.msml-audit-dialog+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.radisys.msml-audit-stream+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.radisys.msml-conf+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.radisys.msml-dialog+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.radisys.msml-dialog-base+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.radisys.msml-dialog-fax-detect+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.radisys.msml-dialog-fax-sendrecv+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.radisys.msml-dialog-group+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.radisys.msml-dialog-speech+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.radisys.msml-dialog-transform+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.rainstor.data": {
    "source": "iana"
  },
  "application/vnd.rapid": {
    "source": "iana"
  },
  "application/vnd.rar": {
    "source": "iana",
    "extensions": ["rar"]
  },
  "application/vnd.realvnc.bed": {
    "source": "iana",
    "extensions": ["bed"]
  },
  "application/vnd.recordare.musicxml": {
    "source": "iana",
    "extensions": ["mxl"]
  },
  "application/vnd.recordare.musicxml+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["musicxml"]
  },
  "application/vnd.renlearn.rlprint": {
    "source": "iana"
  },
  "application/vnd.resilient.logic": {
    "source": "iana"
  },
  "application/vnd.restful+json": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.rig.cryptonote": {
    "source": "iana",
    "extensions": ["cryptonote"]
  },
  "application/vnd.rim.cod": {
    "source": "apache",
    "extensions": ["cod"]
  },
  "application/vnd.rn-realmedia": {
    "source": "apache",
    "extensions": ["rm"]
  },
  "application/vnd.rn-realmedia-vbr": {
    "source": "apache",
    "extensions": ["rmvb"]
  },
  "application/vnd.route66.link66+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["link66"]
  },
  "application/vnd.rs-274x": {
    "source": "iana"
  },
  "application/vnd.ruckus.download": {
    "source": "iana"
  },
  "application/vnd.s3sms": {
    "source": "iana"
  },
  "application/vnd.sailingtracker.track": {
    "source": "iana",
    "extensions": ["st"]
  },
  "application/vnd.sar": {
    "source": "iana"
  },
  "application/vnd.sbm.cid": {
    "source": "iana"
  },
  "application/vnd.sbm.mid2": {
    "source": "iana"
  },
  "application/vnd.scribus": {
    "source": "iana"
  },
  "application/vnd.sealed.3df": {
    "source": "iana"
  },
  "application/vnd.sealed.csf": {
    "source": "iana"
  },
  "application/vnd.sealed.doc": {
    "source": "iana"
  },
  "application/vnd.sealed.eml": {
    "source": "iana"
  },
  "application/vnd.sealed.mht": {
    "source": "iana"
  },
  "application/vnd.sealed.net": {
    "source": "iana"
  },
  "application/vnd.sealed.ppt": {
    "source": "iana"
  },
  "application/vnd.sealed.tiff": {
    "source": "iana"
  },
  "application/vnd.sealed.xls": {
    "source": "iana"
  },
  "application/vnd.sealedmedia.softseal.html": {
    "source": "iana"
  },
  "application/vnd.sealedmedia.softseal.pdf": {
    "source": "iana"
  },
  "application/vnd.seemail": {
    "source": "iana",
    "extensions": ["see"]
  },
  "application/vnd.seis+json": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.sema": {
    "source": "iana",
    "extensions": ["sema"]
  },
  "application/vnd.semd": {
    "source": "iana",
    "extensions": ["semd"]
  },
  "application/vnd.semf": {
    "source": "iana",
    "extensions": ["semf"]
  },
  "application/vnd.shade-save-file": {
    "source": "iana"
  },
  "application/vnd.shana.informed.formdata": {
    "source": "iana",
    "extensions": ["ifm"]
  },
  "application/vnd.shana.informed.formtemplate": {
    "source": "iana",
    "extensions": ["itp"]
  },
  "application/vnd.shana.informed.interchange": {
    "source": "iana",
    "extensions": ["iif"]
  },
  "application/vnd.shana.informed.package": {
    "source": "iana",
    "extensions": ["ipk"]
  },
  "application/vnd.shootproof+json": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.shopkick+json": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.shp": {
    "source": "iana"
  },
  "application/vnd.shx": {
    "source": "iana"
  },
  "application/vnd.sigrok.session": {
    "source": "iana"
  },
  "application/vnd.simtech-mindmapper": {
    "source": "iana",
    "extensions": ["twd","twds"]
  },
  "application/vnd.siren+json": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.smaf": {
    "source": "iana",
    "extensions": ["mmf"]
  },
  "application/vnd.smart.notebook": {
    "source": "iana"
  },
  "application/vnd.smart.teacher": {
    "source": "iana",
    "extensions": ["teacher"]
  },
  "application/vnd.snesdev-page-table": {
    "source": "iana"
  },
  "application/vnd.software602.filler.form+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["fo"]
  },
  "application/vnd.software602.filler.form-xml-zip": {
    "source": "iana"
  },
  "application/vnd.solent.sdkm+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["sdkm","sdkd"]
  },
  "application/vnd.spotfire.dxp": {
    "source": "iana",
    "extensions": ["dxp"]
  },
  "application/vnd.spotfire.sfs": {
    "source": "iana",
    "extensions": ["sfs"]
  },
  "application/vnd.sqlite3": {
    "source": "iana"
  },
  "application/vnd.sss-cod": {
    "source": "iana"
  },
  "application/vnd.sss-dtf": {
    "source": "iana"
  },
  "application/vnd.sss-ntf": {
    "source": "iana"
  },
  "application/vnd.stardivision.calc": {
    "source": "apache",
    "extensions": ["sdc"]
  },
  "application/vnd.stardivision.draw": {
    "source": "apache",
    "extensions": ["sda"]
  },
  "application/vnd.stardivision.impress": {
    "source": "apache",
    "extensions": ["sdd"]
  },
  "application/vnd.stardivision.math": {
    "source": "apache",
    "extensions": ["smf"]
  },
  "application/vnd.stardivision.writer": {
    "source": "apache",
    "extensions": ["sdw","vor"]
  },
  "application/vnd.stardivision.writer-global": {
    "source": "apache",
    "extensions": ["sgl"]
  },
  "application/vnd.stepmania.package": {
    "source": "iana",
    "extensions": ["smzip"]
  },
  "application/vnd.stepmania.stepchart": {
    "source": "iana",
    "extensions": ["sm"]
  },
  "application/vnd.street-stream": {
    "source": "iana"
  },
  "application/vnd.sun.wadl+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["wadl"]
  },
  "application/vnd.sun.xml.calc": {
    "source": "apache",
    "extensions": ["sxc"]
  },
  "application/vnd.sun.xml.calc.template": {
    "source": "apache",
    "extensions": ["stc"]
  },
  "application/vnd.sun.xml.draw": {
    "source": "apache",
    "extensions": ["sxd"]
  },
  "application/vnd.sun.xml.draw.template": {
    "source": "apache",
    "extensions": ["std"]
  },
  "application/vnd.sun.xml.impress": {
    "source": "apache",
    "extensions": ["sxi"]
  },
  "application/vnd.sun.xml.impress.template": {
    "source": "apache",
    "extensions": ["sti"]
  },
  "application/vnd.sun.xml.math": {
    "source": "apache",
    "extensions": ["sxm"]
  },
  "application/vnd.sun.xml.writer": {
    "source": "apache",
    "extensions": ["sxw"]
  },
  "application/vnd.sun.xml.writer.global": {
    "source": "apache",
    "extensions": ["sxg"]
  },
  "application/vnd.sun.xml.writer.template": {
    "source": "apache",
    "extensions": ["stw"]
  },
  "application/vnd.sus-calendar": {
    "source": "iana",
    "extensions": ["sus","susp"]
  },
  "application/vnd.svd": {
    "source": "iana",
    "extensions": ["svd"]
  },
  "application/vnd.swiftview-ics": {
    "source": "iana"
  },
  "application/vnd.sycle+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.symbian.install": {
    "source": "apache",
    "extensions": ["sis","sisx"]
  },
  "application/vnd.syncml+xml": {
    "source": "iana",
    "charset": "UTF-8",
    "compressible": true,
    "extensions": ["xsm"]
  },
  "application/vnd.syncml.dm+wbxml": {
    "source": "iana",
    "charset": "UTF-8",
    "extensions": ["bdm"]
  },
  "application/vnd.syncml.dm+xml": {
    "source": "iana",
    "charset": "UTF-8",
    "compressible": true,
    "extensions": ["xdm"]
  },
  "application/vnd.syncml.dm.notification": {
    "source": "iana"
  },
  "application/vnd.syncml.dmddf+wbxml": {
    "source": "iana"
  },
  "application/vnd.syncml.dmddf+xml": {
    "source": "iana",
    "charset": "UTF-8",
    "compressible": true,
    "extensions": ["ddf"]
  },
  "application/vnd.syncml.dmtnds+wbxml": {
    "source": "iana"
  },
  "application/vnd.syncml.dmtnds+xml": {
    "source": "iana",
    "charset": "UTF-8",
    "compressible": true
  },
  "application/vnd.syncml.ds.notification": {
    "source": "iana"
  },
  "application/vnd.tableschema+json": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.tao.intent-module-archive": {
    "source": "iana",
    "extensions": ["tao"]
  },
  "application/vnd.tcpdump.pcap": {
    "source": "iana",
    "extensions": ["pcap","cap","dmp"]
  },
  "application/vnd.think-cell.ppttc+json": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.tmd.mediaflex.api+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.tml": {
    "source": "iana"
  },
  "application/vnd.tmobile-livetv": {
    "source": "iana",
    "extensions": ["tmo"]
  },
  "application/vnd.tri.onesource": {
    "source": "iana"
  },
  "application/vnd.trid.tpt": {
    "source": "iana",
    "extensions": ["tpt"]
  },
  "application/vnd.triscape.mxs": {
    "source": "iana",
    "extensions": ["mxs"]
  },
  "application/vnd.trueapp": {
    "source": "iana",
    "extensions": ["tra"]
  },
  "application/vnd.truedoc": {
    "source": "iana"
  },
  "application/vnd.ubisoft.webplayer": {
    "source": "iana"
  },
  "application/vnd.ufdl": {
    "source": "iana",
    "extensions": ["ufd","ufdl"]
  },
  "application/vnd.uiq.theme": {
    "source": "iana",
    "extensions": ["utz"]
  },
  "application/vnd.umajin": {
    "source": "iana",
    "extensions": ["umj"]
  },
  "application/vnd.unity": {
    "source": "iana",
    "extensions": ["unityweb"]
  },
  "application/vnd.uoml+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["uoml"]
  },
  "application/vnd.uplanet.alert": {
    "source": "iana"
  },
  "application/vnd.uplanet.alert-wbxml": {
    "source": "iana"
  },
  "application/vnd.uplanet.bearer-choice": {
    "source": "iana"
  },
  "application/vnd.uplanet.bearer-choice-wbxml": {
    "source": "iana"
  },
  "application/vnd.uplanet.cacheop": {
    "source": "iana"
  },
  "application/vnd.uplanet.cacheop-wbxml": {
    "source": "iana"
  },
  "application/vnd.uplanet.channel": {
    "source": "iana"
  },
  "application/vnd.uplanet.channel-wbxml": {
    "source": "iana"
  },
  "application/vnd.uplanet.list": {
    "source": "iana"
  },
  "application/vnd.uplanet.list-wbxml": {
    "source": "iana"
  },
  "application/vnd.uplanet.listcmd": {
    "source": "iana"
  },
  "application/vnd.uplanet.listcmd-wbxml": {
    "source": "iana"
  },
  "application/vnd.uplanet.signal": {
    "source": "iana"
  },
  "application/vnd.uri-map": {
    "source": "iana"
  },
  "application/vnd.valve.source.material": {
    "source": "iana"
  },
  "application/vnd.vcx": {
    "source": "iana",
    "extensions": ["vcx"]
  },
  "application/vnd.vd-study": {
    "source": "iana"
  },
  "application/vnd.vectorworks": {
    "source": "iana"
  },
  "application/vnd.vel+json": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.verimatrix.vcas": {
    "source": "iana"
  },
  "application/vnd.veritone.aion+json": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.veryant.thin": {
    "source": "iana"
  },
  "application/vnd.ves.encrypted": {
    "source": "iana"
  },
  "application/vnd.vidsoft.vidconference": {
    "source": "iana"
  },
  "application/vnd.visio": {
    "source": "iana",
    "extensions": ["vsd","vst","vss","vsw"]
  },
  "application/vnd.visionary": {
    "source": "iana",
    "extensions": ["vis"]
  },
  "application/vnd.vividence.scriptfile": {
    "source": "iana"
  },
  "application/vnd.vsf": {
    "source": "iana",
    "extensions": ["vsf"]
  },
  "application/vnd.wap.sic": {
    "source": "iana"
  },
  "application/vnd.wap.slc": {
    "source": "iana"
  },
  "application/vnd.wap.wbxml": {
    "source": "iana",
    "charset": "UTF-8",
    "extensions": ["wbxml"]
  },
  "application/vnd.wap.wmlc": {
    "source": "iana",
    "extensions": ["wmlc"]
  },
  "application/vnd.wap.wmlscriptc": {
    "source": "iana",
    "extensions": ["wmlsc"]
  },
  "application/vnd.webturbo": {
    "source": "iana",
    "extensions": ["wtb"]
  },
  "application/vnd.wfa.dpp": {
    "source": "iana"
  },
  "application/vnd.wfa.p2p": {
    "source": "iana"
  },
  "application/vnd.wfa.wsc": {
    "source": "iana"
  },
  "application/vnd.windows.devicepairing": {
    "source": "iana"
  },
  "application/vnd.wmc": {
    "source": "iana"
  },
  "application/vnd.wmf.bootstrap": {
    "source": "iana"
  },
  "application/vnd.wolfram.mathematica": {
    "source": "iana"
  },
  "application/vnd.wolfram.mathematica.package": {
    "source": "iana"
  },
  "application/vnd.wolfram.player": {
    "source": "iana",
    "extensions": ["nbp"]
  },
  "application/vnd.wordperfect": {
    "source": "iana",
    "extensions": ["wpd"]
  },
  "application/vnd.wqd": {
    "source": "iana",
    "extensions": ["wqd"]
  },
  "application/vnd.wrq-hp3000-labelled": {
    "source": "iana"
  },
  "application/vnd.wt.stf": {
    "source": "iana",
    "extensions": ["stf"]
  },
  "application/vnd.wv.csp+wbxml": {
    "source": "iana"
  },
  "application/vnd.wv.csp+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.wv.ssp+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.xacml+json": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.xara": {
    "source": "iana",
    "extensions": ["xar"]
  },
  "application/vnd.xfdl": {
    "source": "iana",
    "extensions": ["xfdl"]
  },
  "application/vnd.xfdl.webform": {
    "source": "iana"
  },
  "application/vnd.xmi+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.xmpie.cpkg": {
    "source": "iana"
  },
  "application/vnd.xmpie.dpkg": {
    "source": "iana"
  },
  "application/vnd.xmpie.plan": {
    "source": "iana"
  },
  "application/vnd.xmpie.ppkg": {
    "source": "iana"
  },
  "application/vnd.xmpie.xlim": {
    "source": "iana"
  },
  "application/vnd.yamaha.hv-dic": {
    "source": "iana",
    "extensions": ["hvd"]
  },
  "application/vnd.yamaha.hv-script": {
    "source": "iana",
    "extensions": ["hvs"]
  },
  "application/vnd.yamaha.hv-voice": {
    "source": "iana",
    "extensions": ["hvp"]
  },
  "application/vnd.yamaha.openscoreformat": {
    "source": "iana",
    "extensions": ["osf"]
  },
  "application/vnd.yamaha.openscoreformat.osfpvg+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["osfpvg"]
  },
  "application/vnd.yamaha.remote-setup": {
    "source": "iana"
  },
  "application/vnd.yamaha.smaf-audio": {
    "source": "iana",
    "extensions": ["saf"]
  },
  "application/vnd.yamaha.smaf-phrase": {
    "source": "iana",
    "extensions": ["spf"]
  },
  "application/vnd.yamaha.through-ngn": {
    "source": "iana"
  },
  "application/vnd.yamaha.tunnel-udpencap": {
    "source": "iana"
  },
  "application/vnd.yaoweme": {
    "source": "iana"
  },
  "application/vnd.yellowriver-custom-menu": {
    "source": "iana",
    "extensions": ["cmp"]
  },
  "application/vnd.youtube.yt": {
    "source": "iana"
  },
  "application/vnd.zul": {
    "source": "iana",
    "extensions": ["zir","zirz"]
  },
  "application/vnd.zzazz.deck+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["zaz"]
  },
  "application/voicexml+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["vxml"]
  },
  "application/voucher-cms+json": {
    "source": "iana",
    "compressible": true
  },
  "application/vq-rtcpxr": {
    "source": "iana"
  },
  "application/wasm": {
    "source": "iana",
    "compressible": true,
    "extensions": ["wasm"]
  },
  "application/watcherinfo+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/webpush-options+json": {
    "source": "iana",
    "compressible": true
  },
  "application/whoispp-query": {
    "source": "iana"
  },
  "application/whoispp-response": {
    "source": "iana"
  },
  "application/widget": {
    "source": "iana",
    "extensions": ["wgt"]
  },
  "application/winhlp": {
    "source": "apache",
    "extensions": ["hlp"]
  },
  "application/wita": {
    "source": "iana"
  },
  "application/wordperfect5.1": {
    "source": "iana"
  },
  "application/wsdl+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["wsdl"]
  },
  "application/wspolicy+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["wspolicy"]
  },
  "application/x-7z-compressed": {
    "source": "apache",
    "compressible": false,
    "extensions": ["7z"]
  },
  "application/x-abiword": {
    "source": "apache",
    "extensions": ["abw"]
  },
  "application/x-ace-compressed": {
    "source": "apache",
    "extensions": ["ace"]
  },
  "application/x-amf": {
    "source": "apache"
  },
  "application/x-apple-diskimage": {
    "source": "apache",
    "extensions": ["dmg"]
  },
  "application/x-arj": {
    "compressible": false,
    "extensions": ["arj"]
  },
  "application/x-authorware-bin": {
    "source": "apache",
    "extensions": ["aab","x32","u32","vox"]
  },
  "application/x-authorware-map": {
    "source": "apache",
    "extensions": ["aam"]
  },
  "application/x-authorware-seg": {
    "source": "apache",
    "extensions": ["aas"]
  },
  "application/x-bcpio": {
    "source": "apache",
    "extensions": ["bcpio"]
  },
  "application/x-bdoc": {
    "compressible": false,
    "extensions": ["bdoc"]
  },
  "application/x-bittorrent": {
    "source": "apache",
    "extensions": ["torrent"]
  },
  "application/x-blorb": {
    "source": "apache",
    "extensions": ["blb","blorb"]
  },
  "application/x-bzip": {
    "source": "apache",
    "compressible": false,
    "extensions": ["bz"]
  },
  "application/x-bzip2": {
    "source": "apache",
    "compressible": false,
    "extensions": ["bz2","boz"]
  },
  "application/x-cbr": {
    "source": "apache",
    "extensions": ["cbr","cba","cbt","cbz","cb7"]
  },
  "application/x-cdlink": {
    "source": "apache",
    "extensions": ["vcd"]
  },
  "application/x-cfs-compressed": {
    "source": "apache",
    "extensions": ["cfs"]
  },
  "application/x-chat": {
    "source": "apache",
    "extensions": ["chat"]
  },
  "application/x-chess-pgn": {
    "source": "apache",
    "extensions": ["pgn"]
  },
  "application/x-chrome-extension": {
    "extensions": ["crx"]
  },
  "application/x-cocoa": {
    "source": "nginx",
    "extensions": ["cco"]
  },
  "application/x-compress": {
    "source": "apache"
  },
  "application/x-conference": {
    "source": "apache",
    "extensions": ["nsc"]
  },
  "application/x-cpio": {
    "source": "apache",
    "extensions": ["cpio"]
  },
  "application/x-csh": {
    "source": "apache",
    "extensions": ["csh"]
  },
  "application/x-deb": {
    "compressible": false
  },
  "application/x-debian-package": {
    "source": "apache",
    "extensions": ["deb","udeb"]
  },
  "application/x-dgc-compressed": {
    "source": "apache",
    "extensions": ["dgc"]
  },
  "application/x-director": {
    "source": "apache",
    "extensions": ["dir","dcr","dxr","cst","cct","cxt","w3d","fgd","swa"]
  },
  "application/x-doom": {
    "source": "apache",
    "extensions": ["wad"]
  },
  "application/x-dtbncx+xml": {
    "source": "apache",
    "compressible": true,
    "extensions": ["ncx"]
  },
  "application/x-dtbook+xml": {
    "source": "apache",
    "compressible": true,
    "extensions": ["dtb"]
  },
  "application/x-dtbresource+xml": {
    "source": "apache",
    "compressible": true,
    "extensions": ["res"]
  },
  "application/x-dvi": {
    "source": "apache",
    "compressible": false,
    "extensions": ["dvi"]
  },
  "application/x-envoy": {
    "source": "apache",
    "extensions": ["evy"]
  },
  "application/x-eva": {
    "source": "apache",
    "extensions": ["eva"]
  },
  "application/x-font-bdf": {
    "source": "apache",
    "extensions": ["bdf"]
  },
  "application/x-font-dos": {
    "source": "apache"
  },
  "application/x-font-framemaker": {
    "source": "apache"
  },
  "application/x-font-ghostscript": {
    "source": "apache",
    "extensions": ["gsf"]
  },
  "application/x-font-libgrx": {
    "source": "apache"
  },
  "application/x-font-linux-psf": {
    "source": "apache",
    "extensions": ["psf"]
  },
  "application/x-font-pcf": {
    "source": "apache",
    "extensions": ["pcf"]
  },
  "application/x-font-snf": {
    "source": "apache",
    "extensions": ["snf"]
  },
  "application/x-font-speedo": {
    "source": "apache"
  },
  "application/x-font-sunos-news": {
    "source": "apache"
  },
  "application/x-font-type1": {
    "source": "apache",
    "extensions": ["pfa","pfb","pfm","afm"]
  },
  "application/x-font-vfont": {
    "source": "apache"
  },
  "application/x-freearc": {
    "source": "apache",
    "extensions": ["arc"]
  },
  "application/x-futuresplash": {
    "source": "apache",
    "extensions": ["spl"]
  },
  "application/x-gca-compressed": {
    "source": "apache",
    "extensions": ["gca"]
  },
  "application/x-glulx": {
    "source": "apache",
    "extensions": ["ulx"]
  },
  "application/x-gnumeric": {
    "source": "apache",
    "extensions": ["gnumeric"]
  },
  "application/x-gramps-xml": {
    "source": "apache",
    "extensions": ["gramps"]
  },
  "application/x-gtar": {
    "source": "apache",
    "extensions": ["gtar"]
  },
  "application/x-gzip": {
    "source": "apache"
  },
  "application/x-hdf": {
    "source": "apache",
    "extensions": ["hdf"]
  },
  "application/x-httpd-php": {
    "compressible": true,
    "extensions": ["php"]
  },
  "application/x-install-instructions": {
    "source": "apache",
    "extensions": ["install"]
  },
  "application/x-iso9660-image": {
    "source": "apache",
    "extensions": ["iso"]
  },
  "application/x-iwork-keynote-sffkey": {
    "extensions": ["key"]
  },
  "application/x-iwork-numbers-sffnumbers": {
    "extensions": ["numbers"]
  },
  "application/x-iwork-pages-sffpages": {
    "extensions": ["pages"]
  },
  "application/x-java-archive-diff": {
    "source": "nginx",
    "extensions": ["jardiff"]
  },
  "application/x-java-jnlp-file": {
    "source": "apache",
    "compressible": false,
    "extensions": ["jnlp"]
  },
  "application/x-javascript": {
    "compressible": true
  },
  "application/x-keepass2": {
    "extensions": ["kdbx"]
  },
  "application/x-latex": {
    "source": "apache",
    "compressible": false,
    "extensions": ["latex"]
  },
  "application/x-lua-bytecode": {
    "extensions": ["luac"]
  },
  "application/x-lzh-compressed": {
    "source": "apache",
    "extensions": ["lzh","lha"]
  },
  "application/x-makeself": {
    "source": "nginx",
    "extensions": ["run"]
  },
  "application/x-mie": {
    "source": "apache",
    "extensions": ["mie"]
  },
  "application/x-mobipocket-ebook": {
    "source": "apache",
    "extensions": ["prc","mobi"]
  },
  "application/x-mpegurl": {
    "compressible": false
  },
  "application/x-ms-application": {
    "source": "apache",
    "extensions": ["application"]
  },
  "application/x-ms-shortcut": {
    "source": "apache",
    "extensions": ["lnk"]
  },
  "application/x-ms-wmd": {
    "source": "apache",
    "extensions": ["wmd"]
  },
  "application/x-ms-wmz": {
    "source": "apache",
    "extensions": ["wmz"]
  },
  "application/x-ms-xbap": {
    "source": "apache",
    "extensions": ["xbap"]
  },
  "application/x-msaccess": {
    "source": "apache",
    "extensions": ["mdb"]
  },
  "application/x-msbinder": {
    "source": "apache",
    "extensions": ["obd"]
  },
  "application/x-mscardfile": {
    "source": "apache",
    "extensions": ["crd"]
  },
  "application/x-msclip": {
    "source": "apache",
    "extensions": ["clp"]
  },
  "application/x-msdos-program": {
    "extensions": ["exe"]
  },
  "application/x-msdownload": {
    "source": "apache",
    "extensions": ["exe","dll","com","bat","msi"]
  },
  "application/x-msmediaview": {
    "source": "apache",
    "extensions": ["mvb","m13","m14"]
  },
  "application/x-msmetafile": {
    "source": "apache",
    "extensions": ["wmf","wmz","emf","emz"]
  },
  "application/x-msmoney": {
    "source": "apache",
    "extensions": ["mny"]
  },
  "application/x-mspublisher": {
    "source": "apache",
    "extensions": ["pub"]
  },
  "application/x-msschedule": {
    "source": "apache",
    "extensions": ["scd"]
  },
  "application/x-msterminal": {
    "source": "apache",
    "extensions": ["trm"]
  },
  "application/x-mswrite": {
    "source": "apache",
    "extensions": ["wri"]
  },
  "application/x-netcdf": {
    "source": "apache",
    "extensions": ["nc","cdf"]
  },
  "application/x-ns-proxy-autoconfig": {
    "compressible": true,
    "extensions": ["pac"]
  },
  "application/x-nzb": {
    "source": "apache",
    "extensions": ["nzb"]
  },
  "application/x-perl": {
    "source": "nginx",
    "extensions": ["pl","pm"]
  },
  "application/x-pilot": {
    "source": "nginx",
    "extensions": ["prc","pdb"]
  },
  "application/x-pkcs12": {
    "source": "apache",
    "compressible": false,
    "extensions": ["p12","pfx"]
  },
  "application/x-pkcs7-certificates": {
    "source": "apache",
    "extensions": ["p7b","spc"]
  },
  "application/x-pkcs7-certreqresp": {
    "source": "apache",
    "extensions": ["p7r"]
  },
  "application/x-pki-message": {
    "source": "iana"
  },
  "application/x-rar-compressed": {
    "source": "apache",
    "compressible": false,
    "extensions": ["rar"]
  },
  "application/x-redhat-package-manager": {
    "source": "nginx",
    "extensions": ["rpm"]
  },
  "application/x-research-info-systems": {
    "source": "apache",
    "extensions": ["ris"]
  },
  "application/x-sea": {
    "source": "nginx",
    "extensions": ["sea"]
  },
  "application/x-sh": {
    "source": "apache",
    "compressible": true,
    "extensions": ["sh"]
  },
  "application/x-shar": {
    "source": "apache",
    "extensions": ["shar"]
  },
  "application/x-shockwave-flash": {
    "source": "apache",
    "compressible": false,
    "extensions": ["swf"]
  },
  "application/x-silverlight-app": {
    "source": "apache",
    "extensions": ["xap"]
  },
  "application/x-sql": {
    "source": "apache",
    "extensions": ["sql"]
  },
  "application/x-stuffit": {
    "source": "apache",
    "compressible": false,
    "extensions": ["sit"]
  },
  "application/x-stuffitx": {
    "source": "apache",
    "extensions": ["sitx"]
  },
  "application/x-subrip": {
    "source": "apache",
    "extensions": ["srt"]
  },
  "application/x-sv4cpio": {
    "source": "apache",
    "extensions": ["sv4cpio"]
  },
  "application/x-sv4crc": {
    "source": "apache",
    "extensions": ["sv4crc"]
  },
  "application/x-t3vm-image": {
    "source": "apache",
    "extensions": ["t3"]
  },
  "application/x-tads": {
    "source": "apache",
    "extensions": ["gam"]
  },
  "application/x-tar": {
    "source": "apache",
    "compressible": true,
    "extensions": ["tar"]
  },
  "application/x-tcl": {
    "source": "apache",
    "extensions": ["tcl","tk"]
  },
  "application/x-tex": {
    "source": "apache",
    "extensions": ["tex"]
  },
  "application/x-tex-tfm": {
    "source": "apache",
    "extensions": ["tfm"]
  },
  "application/x-texinfo": {
    "source": "apache",
    "extensions": ["texinfo","texi"]
  },
  "application/x-tgif": {
    "source": "apache",
    "extensions": ["obj"]
  },
  "application/x-ustar": {
    "source": "apache",
    "extensions": ["ustar"]
  },
  "application/x-virtualbox-hdd": {
    "compressible": true,
    "extensions": ["hdd"]
  },
  "application/x-virtualbox-ova": {
    "compressible": true,
    "extensions": ["ova"]
  },
  "application/x-virtualbox-ovf": {
    "compressible": true,
    "extensions": ["ovf"]
  },
  "application/x-virtualbox-vbox": {
    "compressible": true,
    "extensions": ["vbox"]
  },
  "application/x-virtualbox-vbox-extpack": {
    "compressible": false,
    "extensions": ["vbox-extpack"]
  },
  "application/x-virtualbox-vdi": {
    "compressible": true,
    "extensions": ["vdi"]
  },
  "application/x-virtualbox-vhd": {
    "compressible": true,
    "extensions": ["vhd"]
  },
  "application/x-virtualbox-vmdk": {
    "compressible": true,
    "extensions": ["vmdk"]
  },
  "application/x-wais-source": {
    "source": "apache",
    "extensions": ["src"]
  },
  "application/x-web-app-manifest+json": {
    "compressible": true,
    "extensions": ["webapp"]
  },
  "application/x-www-form-urlencoded": {
    "source": "iana",
    "compressible": true
  },
  "application/x-x509-ca-cert": {
    "source": "iana",
    "extensions": ["der","crt","pem"]
  },
  "application/x-x509-ca-ra-cert": {
    "source": "iana"
  },
  "application/x-x509-next-ca-cert": {
    "source": "iana"
  },
  "application/x-xfig": {
    "source": "apache",
    "extensions": ["fig"]
  },
  "application/x-xliff+xml": {
    "source": "apache",
    "compressible": true,
    "extensions": ["xlf"]
  },
  "application/x-xpinstall": {
    "source": "apache",
    "compressible": false,
    "extensions": ["xpi"]
  },
  "application/x-xz": {
    "source": "apache",
    "extensions": ["xz"]
  },
  "application/x-zmachine": {
    "source": "apache",
    "extensions": ["z1","z2","z3","z4","z5","z6","z7","z8"]
  },
  "application/x400-bp": {
    "source": "iana"
  },
  "application/xacml+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/xaml+xml": {
    "source": "apache",
    "compressible": true,
    "extensions": ["xaml"]
  },
  "application/xcap-att+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["xav"]
  },
  "application/xcap-caps+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["xca"]
  },
  "application/xcap-diff+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["xdf"]
  },
  "application/xcap-el+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["xel"]
  },
  "application/xcap-error+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/xcap-ns+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["xns"]
  },
  "application/xcon-conference-info+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/xcon-conference-info-diff+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/xenc+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["xenc"]
  },
  "application/xhtml+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["xhtml","xht"]
  },
  "application/xhtml-voice+xml": {
    "source": "apache",
    "compressible": true
  },
  "application/xliff+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["xlf"]
  },
  "application/xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["xml","xsl","xsd","rng"]
  },
  "application/xml-dtd": {
    "source": "iana",
    "compressible": true,
    "extensions": ["dtd"]
  },
  "application/xml-external-parsed-entity": {
    "source": "iana"
  },
  "application/xml-patch+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/xmpp+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/xop+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["xop"]
  },
  "application/xproc+xml": {
    "source": "apache",
    "compressible": true,
    "extensions": ["xpl"]
  },
  "application/xslt+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["xsl","xslt"]
  },
  "application/xspf+xml": {
    "source": "apache",
    "compressible": true,
    "extensions": ["xspf"]
  },
  "application/xv+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["mxml","xhvml","xvml","xvm"]
  },
  "application/yang": {
    "source": "iana",
    "extensions": ["yang"]
  },
  "application/yang-data+json": {
    "source": "iana",
    "compressible": true
  },
  "application/yang-data+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/yang-patch+json": {
    "source": "iana",
    "compressible": true
  },
  "application/yang-patch+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/yin+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["yin"]
  },
  "application/zip": {
    "source": "iana",
    "compressible": false,
    "extensions": ["zip"]
  },
  "application/zlib": {
    "source": "iana"
  },
  "application/zstd": {
    "source": "iana"
  },
  "audio/1d-interleaved-parityfec": {
    "source": "iana"
  },
  "audio/32kadpcm": {
    "source": "iana"
  },
  "audio/3gpp": {
    "source": "iana",
    "compressible": false,
    "extensions": ["3gpp"]
  },
  "audio/3gpp2": {
    "source": "iana"
  },
  "audio/aac": {
    "source": "iana"
  },
  "audio/ac3": {
    "source": "iana"
  },
  "audio/adpcm": {
    "source": "apache",
    "extensions": ["adp"]
  },
  "audio/amr": {
    "source": "iana",
    "extensions": ["amr"]
  },
  "audio/amr-wb": {
    "source": "iana"
  },
  "audio/amr-wb+": {
    "source": "iana"
  },
  "audio/aptx": {
    "source": "iana"
  },
  "audio/asc": {
    "source": "iana"
  },
  "audio/atrac-advanced-lossless": {
    "source": "iana"
  },
  "audio/atrac-x": {
    "source": "iana"
  },
  "audio/atrac3": {
    "source": "iana"
  },
  "audio/basic": {
    "source": "iana",
    "compressible": false,
    "extensions": ["au","snd"]
  },
  "audio/bv16": {
    "source": "iana"
  },
  "audio/bv32": {
    "source": "iana"
  },
  "audio/clearmode": {
    "source": "iana"
  },
  "audio/cn": {
    "source": "iana"
  },
  "audio/dat12": {
    "source": "iana"
  },
  "audio/dls": {
    "source": "iana"
  },
  "audio/dsr-es201108": {
    "source": "iana"
  },
  "audio/dsr-es202050": {
    "source": "iana"
  },
  "audio/dsr-es202211": {
    "source": "iana"
  },
  "audio/dsr-es202212": {
    "source": "iana"
  },
  "audio/dv": {
    "source": "iana"
  },
  "audio/dvi4": {
    "source": "iana"
  },
  "audio/eac3": {
    "source": "iana"
  },
  "audio/encaprtp": {
    "source": "iana"
  },
  "audio/evrc": {
    "source": "iana"
  },
  "audio/evrc-qcp": {
    "source": "iana"
  },
  "audio/evrc0": {
    "source": "iana"
  },
  "audio/evrc1": {
    "source": "iana"
  },
  "audio/evrcb": {
    "source": "iana"
  },
  "audio/evrcb0": {
    "source": "iana"
  },
  "audio/evrcb1": {
    "source": "iana"
  },
  "audio/evrcnw": {
    "source": "iana"
  },
  "audio/evrcnw0": {
    "source": "iana"
  },
  "audio/evrcnw1": {
    "source": "iana"
  },
  "audio/evrcwb": {
    "source": "iana"
  },
  "audio/evrcwb0": {
    "source": "iana"
  },
  "audio/evrcwb1": {
    "source": "iana"
  },
  "audio/evs": {
    "source": "iana"
  },
  "audio/flexfec": {
    "source": "iana"
  },
  "audio/fwdred": {
    "source": "iana"
  },
  "audio/g711-0": {
    "source": "iana"
  },
  "audio/g719": {
    "source": "iana"
  },
  "audio/g722": {
    "source": "iana"
  },
  "audio/g7221": {
    "source": "iana"
  },
  "audio/g723": {
    "source": "iana"
  },
  "audio/g726-16": {
    "source": "iana"
  },
  "audio/g726-24": {
    "source": "iana"
  },
  "audio/g726-32": {
    "source": "iana"
  },
  "audio/g726-40": {
    "source": "iana"
  },
  "audio/g728": {
    "source": "iana"
  },
  "audio/g729": {
    "source": "iana"
  },
  "audio/g7291": {
    "source": "iana"
  },
  "audio/g729d": {
    "source": "iana"
  },
  "audio/g729e": {
    "source": "iana"
  },
  "audio/gsm": {
    "source": "iana"
  },
  "audio/gsm-efr": {
    "source": "iana"
  },
  "audio/gsm-hr-08": {
    "source": "iana"
  },
  "audio/ilbc": {
    "source": "iana"
  },
  "audio/ip-mr_v2.5": {
    "source": "iana"
  },
  "audio/isac": {
    "source": "apache"
  },
  "audio/l16": {
    "source": "iana"
  },
  "audio/l20": {
    "source": "iana"
  },
  "audio/l24": {
    "source": "iana",
    "compressible": false
  },
  "audio/l8": {
    "source": "iana"
  },
  "audio/lpc": {
    "source": "iana"
  },
  "audio/melp": {
    "source": "iana"
  },
  "audio/melp1200": {
    "source": "iana"
  },
  "audio/melp2400": {
    "source": "iana"
  },
  "audio/melp600": {
    "source": "iana"
  },
  "audio/mhas": {
    "source": "iana"
  },
  "audio/midi": {
    "source": "apache",
    "extensions": ["mid","midi","kar","rmi"]
  },
  "audio/mobile-xmf": {
    "source": "iana",
    "extensions": ["mxmf"]
  },
  "audio/mp3": {
    "compressible": false,
    "extensions": ["mp3"]
  },
  "audio/mp4": {
    "source": "iana",
    "compressible": false,
    "extensions": ["m4a","mp4a"]
  },
  "audio/mp4a-latm": {
    "source": "iana"
  },
  "audio/mpa": {
    "source": "iana"
  },
  "audio/mpa-robust": {
    "source": "iana"
  },
  "audio/mpeg": {
    "source": "iana",
    "compressible": false,
    "extensions": ["mpga","mp2","mp2a","mp3","m2a","m3a"]
  },
  "audio/mpeg4-generic": {
    "source": "iana"
  },
  "audio/musepack": {
    "source": "apache"
  },
  "audio/ogg": {
    "source": "iana",
    "compressible": false,
    "extensions": ["oga","ogg","spx","opus"]
  },
  "audio/opus": {
    "source": "iana"
  },
  "audio/parityfec": {
    "source": "iana"
  },
  "audio/pcma": {
    "source": "iana"
  },
  "audio/pcma-wb": {
    "source": "iana"
  },
  "audio/pcmu": {
    "source": "iana"
  },
  "audio/pcmu-wb": {
    "source": "iana"
  },
  "audio/prs.sid": {
    "source": "iana"
  },
  "audio/qcelp": {
    "source": "iana"
  },
  "audio/raptorfec": {
    "source": "iana"
  },
  "audio/red": {
    "source": "iana"
  },
  "audio/rtp-enc-aescm128": {
    "source": "iana"
  },
  "audio/rtp-midi": {
    "source": "iana"
  },
  "audio/rtploopback": {
    "source": "iana"
  },
  "audio/rtx": {
    "source": "iana"
  },
  "audio/s3m": {
    "source": "apache",
    "extensions": ["s3m"]
  },
  "audio/scip": {
    "source": "iana"
  },
  "audio/silk": {
    "source": "apache",
    "extensions": ["sil"]
  },
  "audio/smv": {
    "source": "iana"
  },
  "audio/smv-qcp": {
    "source": "iana"
  },
  "audio/smv0": {
    "source": "iana"
  },
  "audio/sofa": {
    "source": "iana"
  },
  "audio/sp-midi": {
    "source": "iana"
  },
  "audio/speex": {
    "source": "iana"
  },
  "audio/t140c": {
    "source": "iana"
  },
  "audio/t38": {
    "source": "iana"
  },
  "audio/telephone-event": {
    "source": "iana"
  },
  "audio/tetra_acelp": {
    "source": "iana"
  },
  "audio/tetra_acelp_bb": {
    "source": "iana"
  },
  "audio/tone": {
    "source": "iana"
  },
  "audio/tsvcis": {
    "source": "iana"
  },
  "audio/uemclip": {
    "source": "iana"
  },
  "audio/ulpfec": {
    "source": "iana"
  },
  "audio/usac": {
    "source": "iana"
  },
  "audio/vdvi": {
    "source": "iana"
  },
  "audio/vmr-wb": {
    "source": "iana"
  },
  "audio/vnd.3gpp.iufp": {
    "source": "iana"
  },
  "audio/vnd.4sb": {
    "source": "iana"
  },
  "audio/vnd.audiokoz": {
    "source": "iana"
  },
  "audio/vnd.celp": {
    "source": "iana"
  },
  "audio/vnd.cisco.nse": {
    "source": "iana"
  },
  "audio/vnd.cmles.radio-events": {
    "source": "iana"
  },
  "audio/vnd.cns.anp1": {
    "source": "iana"
  },
  "audio/vnd.cns.inf1": {
    "source": "iana"
  },
  "audio/vnd.dece.audio": {
    "source": "iana",
    "extensions": ["uva","uvva"]
  },
  "audio/vnd.digital-winds": {
    "source": "iana",
    "extensions": ["eol"]
  },
  "audio/vnd.dlna.adts": {
    "source": "iana"
  },
  "audio/vnd.dolby.heaac.1": {
    "source": "iana"
  },
  "audio/vnd.dolby.heaac.2": {
    "source": "iana"
  },
  "audio/vnd.dolby.mlp": {
    "source": "iana"
  },
  "audio/vnd.dolby.mps": {
    "source": "iana"
  },
  "audio/vnd.dolby.pl2": {
    "source": "iana"
  },
  "audio/vnd.dolby.pl2x": {
    "source": "iana"
  },
  "audio/vnd.dolby.pl2z": {
    "source": "iana"
  },
  "audio/vnd.dolby.pulse.1": {
    "source": "iana"
  },
  "audio/vnd.dra": {
    "source": "iana",
    "extensions": ["dra"]
  },
  "audio/vnd.dts": {
    "source": "iana",
    "extensions": ["dts"]
  },
  "audio/vnd.dts.hd": {
    "source": "iana",
    "extensions": ["dtshd"]
  },
  "audio/vnd.dts.uhd": {
    "source": "iana"
  },
  "audio/vnd.dvb.file": {
    "source": "iana"
  },
  "audio/vnd.everad.plj": {
    "source": "iana"
  },
  "audio/vnd.hns.audio": {
    "source": "iana"
  },
  "audio/vnd.lucent.voice": {
    "source": "iana",
    "extensions": ["lvp"]
  },
  "audio/vnd.ms-playready.media.pya": {
    "source": "iana",
    "extensions": ["pya"]
  },
  "audio/vnd.nokia.mobile-xmf": {
    "source": "iana"
  },
  "audio/vnd.nortel.vbk": {
    "source": "iana"
  },
  "audio/vnd.nuera.ecelp4800": {
    "source": "iana",
    "extensions": ["ecelp4800"]
  },
  "audio/vnd.nuera.ecelp7470": {
    "source": "iana",
    "extensions": ["ecelp7470"]
  },
  "audio/vnd.nuera.ecelp9600": {
    "source": "iana",
    "extensions": ["ecelp9600"]
  },
  "audio/vnd.octel.sbc": {
    "source": "iana"
  },
  "audio/vnd.presonus.multitrack": {
    "source": "iana"
  },
  "audio/vnd.qcelp": {
    "source": "iana"
  },
  "audio/vnd.rhetorex.32kadpcm": {
    "source": "iana"
  },
  "audio/vnd.rip": {
    "source": "iana",
    "extensions": ["rip"]
  },
  "audio/vnd.rn-realaudio": {
    "compressible": false
  },
  "audio/vnd.sealedmedia.softseal.mpeg": {
    "source": "iana"
  },
  "audio/vnd.vmx.cvsd": {
    "source": "iana"
  },
  "audio/vnd.wave": {
    "compressible": false
  },
  "audio/vorbis": {
    "source": "iana",
    "compressible": false
  },
  "audio/vorbis-config": {
    "source": "iana"
  },
  "audio/wav": {
    "compressible": false,
    "extensions": ["wav"]
  },
  "audio/wave": {
    "compressible": false,
    "extensions": ["wav"]
  },
  "audio/webm": {
    "source": "apache",
    "compressible": false,
    "extensions": ["weba"]
  },
  "audio/x-aac": {
    "source": "apache",
    "compressible": false,
    "extensions": ["aac"]
  },
  "audio/x-aiff": {
    "source": "apache",
    "extensions": ["aif","aiff","aifc"]
  },
  "audio/x-caf": {
    "source": "apache",
    "compressible": false,
    "extensions": ["caf"]
  },
  "audio/x-flac": {
    "source": "apache",
    "extensions": ["flac"]
  },
  "audio/x-m4a": {
    "source": "nginx",
    "extensions": ["m4a"]
  },
  "audio/x-matroska": {
    "source": "apache",
    "extensions": ["mka"]
  },
  "audio/x-mpegurl": {
    "source": "apache",
    "extensions": ["m3u"]
  },
  "audio/x-ms-wax": {
    "source": "apache",
    "extensions": ["wax"]
  },
  "audio/x-ms-wma": {
    "source": "apache",
    "extensions": ["wma"]
  },
  "audio/x-pn-realaudio": {
    "source": "apache",
    "extensions": ["ram","ra"]
  },
  "audio/x-pn-realaudio-plugin": {
    "source": "apache",
    "extensions": ["rmp"]
  },
  "audio/x-realaudio": {
    "source": "nginx",
    "extensions": ["ra"]
  },
  "audio/x-tta": {
    "source": "apache"
  },
  "audio/x-wav": {
    "source": "apache",
    "extensions": ["wav"]
  },
  "audio/xm": {
    "source": "apache",
    "extensions": ["xm"]
  },
  "chemical/x-cdx": {
    "source": "apache",
    "extensions": ["cdx"]
  },
  "chemical/x-cif": {
    "source": "apache",
    "extensions": ["cif"]
  },
  "chemical/x-cmdf": {
    "source": "apache",
    "extensions": ["cmdf"]
  },
  "chemical/x-cml": {
    "source": "apache",
    "extensions": ["cml"]
  },
  "chemical/x-csml": {
    "source": "apache",
    "extensions": ["csml"]
  },
  "chemical/x-pdb": {
    "source": "apache"
  },
  "chemical/x-xyz": {
    "source": "apache",
    "extensions": ["xyz"]
  },
  "font/collection": {
    "source": "iana",
    "extensions": ["ttc"]
  },
  "font/otf": {
    "source": "iana",
    "compressible": true,
    "extensions": ["otf"]
  },
  "font/sfnt": {
    "source": "iana"
  },
  "font/ttf": {
    "source": "iana",
    "compressible": true,
    "extensions": ["ttf"]
  },
  "font/woff": {
    "source": "iana",
    "extensions": ["woff"]
  },
  "font/woff2": {
    "source": "iana",
    "extensions": ["woff2"]
  },
  "image/aces": {
    "source": "iana",
    "extensions": ["exr"]
  },
  "image/apng": {
    "compressible": false,
    "extensions": ["apng"]
  },
  "image/avci": {
    "source": "iana"
  },
  "image/avcs": {
    "source": "iana"
  },
  "image/avif": {
    "source": "iana",
    "compressible": false,
    "extensions": ["avif"]
  },
  "image/bmp": {
    "source": "iana",
    "compressible": true,
    "extensions": ["bmp"]
  },
  "image/cgm": {
    "source": "iana",
    "extensions": ["cgm"]
  },
  "image/dicom-rle": {
    "source": "iana",
    "extensions": ["drle"]
  },
  "image/emf": {
    "source": "iana",
    "extensions": ["emf"]
  },
  "image/fits": {
    "source": "iana",
    "extensions": ["fits"]
  },
  "image/g3fax": {
    "source": "iana",
    "extensions": ["g3"]
  },
  "image/gif": {
    "source": "iana",
    "compressible": false,
    "extensions": ["gif"]
  },
  "image/heic": {
    "source": "iana",
    "extensions": ["heic"]
  },
  "image/heic-sequence": {
    "source": "iana",
    "extensions": ["heics"]
  },
  "image/heif": {
    "source": "iana",
    "extensions": ["heif"]
  },
  "image/heif-sequence": {
    "source": "iana",
    "extensions": ["heifs"]
  },
  "image/hej2k": {
    "source": "iana",
    "extensions": ["hej2"]
  },
  "image/hsj2": {
    "source": "iana",
    "extensions": ["hsj2"]
  },
  "image/ief": {
    "source": "iana",
    "extensions": ["ief"]
  },
  "image/jls": {
    "source": "iana",
    "extensions": ["jls"]
  },
  "image/jp2": {
    "source": "iana",
    "compressible": false,
    "extensions": ["jp2","jpg2"]
  },
  "image/jpeg": {
    "source": "iana",
    "compressible": false,
    "extensions": ["jpeg","jpg","jpe"]
  },
  "image/jph": {
    "source": "iana",
    "extensions": ["jph"]
  },
  "image/jphc": {
    "source": "iana",
    "extensions": ["jhc"]
  },
  "image/jpm": {
    "source": "iana",
    "compressible": false,
    "extensions": ["jpm"]
  },
  "image/jpx": {
    "source": "iana",
    "compressible": false,
    "extensions": ["jpx","jpf"]
  },
  "image/jxr": {
    "source": "iana",
    "extensions": ["jxr"]
  },
  "image/jxra": {
    "source": "iana",
    "extensions": ["jxra"]
  },
  "image/jxrs": {
    "source": "iana",
    "extensions": ["jxrs"]
  },
  "image/jxs": {
    "source": "iana",
    "extensions": ["jxs"]
  },
  "image/jxsc": {
    "source": "iana",
    "extensions": ["jxsc"]
  },
  "image/jxsi": {
    "source": "iana",
    "extensions": ["jxsi"]
  },
  "image/jxss": {
    "source": "iana",
    "extensions": ["jxss"]
  },
  "image/ktx": {
    "source": "iana",
    "extensions": ["ktx"]
  },
  "image/ktx2": {
    "source": "iana",
    "extensions": ["ktx2"]
  },
  "image/naplps": {
    "source": "iana"
  },
  "image/pjpeg": {
    "compressible": false
  },
  "image/png": {
    "source": "iana",
    "compressible": false,
    "extensions": ["png"]
  },
  "image/prs.btif": {
    "source": "iana",
    "extensions": ["btif"]
  },
  "image/prs.pti": {
    "source": "iana",
    "extensions": ["pti"]
  },
  "image/pwg-raster": {
    "source": "iana"
  },
  "image/sgi": {
    "source": "apache",
    "extensions": ["sgi"]
  },
  "image/svg+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["svg","svgz"]
  },
  "image/t38": {
    "source": "iana",
    "extensions": ["t38"]
  },
  "image/tiff": {
    "source": "iana",
    "compressible": false,
    "extensions": ["tif","tiff"]
  },
  "image/tiff-fx": {
    "source": "iana",
    "extensions": ["tfx"]
  },
  "image/vnd.adobe.photoshop": {
    "source": "iana",
    "compressible": true,
    "extensions": ["psd"]
  },
  "image/vnd.airzip.accelerator.azv": {
    "source": "iana",
    "extensions": ["azv"]
  },
  "image/vnd.cns.inf2": {
    "source": "iana"
  },
  "image/vnd.dece.graphic": {
    "source": "iana",
    "extensions": ["uvi","uvvi","uvg","uvvg"]
  },
  "image/vnd.djvu": {
    "source": "iana",
    "extensions": ["djvu","djv"]
  },
  "image/vnd.dvb.subtitle": {
    "source": "iana",
    "extensions": ["sub"]
  },
  "image/vnd.dwg": {
    "source": "iana",
    "extensions": ["dwg"]
  },
  "image/vnd.dxf": {
    "source": "iana",
    "extensions": ["dxf"]
  },
  "image/vnd.fastbidsheet": {
    "source": "iana",
    "extensions": ["fbs"]
  },
  "image/vnd.fpx": {
    "source": "iana",
    "extensions": ["fpx"]
  },
  "image/vnd.fst": {
    "source": "iana",
    "extensions": ["fst"]
  },
  "image/vnd.fujixerox.edmics-mmr": {
    "source": "iana",
    "extensions": ["mmr"]
  },
  "image/vnd.fujixerox.edmics-rlc": {
    "source": "iana",
    "extensions": ["rlc"]
  },
  "image/vnd.globalgraphics.pgb": {
    "source": "iana"
  },
  "image/vnd.microsoft.icon": {
    "source": "iana",
    "compressible": true,
    "extensions": ["ico"]
  },
  "image/vnd.mix": {
    "source": "iana"
  },
  "image/vnd.mozilla.apng": {
    "source": "iana"
  },
  "image/vnd.ms-dds": {
    "compressible": true,
    "extensions": ["dds"]
  },
  "image/vnd.ms-modi": {
    "source": "iana",
    "extensions": ["mdi"]
  },
  "image/vnd.ms-photo": {
    "source": "apache",
    "extensions": ["wdp"]
  },
  "image/vnd.net-fpx": {
    "source": "iana",
    "extensions": ["npx"]
  },
  "image/vnd.pco.b16": {
    "source": "iana",
    "extensions": ["b16"]
  },
  "image/vnd.radiance": {
    "source": "iana"
  },
  "image/vnd.sealed.png": {
    "source": "iana"
  },
  "image/vnd.sealedmedia.softseal.gif": {
    "source": "iana"
  },
  "image/vnd.sealedmedia.softseal.jpg": {
    "source": "iana"
  },
  "image/vnd.svf": {
    "source": "iana"
  },
  "image/vnd.tencent.tap": {
    "source": "iana",
    "extensions": ["tap"]
  },
  "image/vnd.valve.source.texture": {
    "source": "iana",
    "extensions": ["vtf"]
  },
  "image/vnd.wap.wbmp": {
    "source": "iana",
    "extensions": ["wbmp"]
  },
  "image/vnd.xiff": {
    "source": "iana",
    "extensions": ["xif"]
  },
  "image/vnd.zbrush.pcx": {
    "source": "iana",
    "extensions": ["pcx"]
  },
  "image/webp": {
    "source": "apache",
    "extensions": ["webp"]
  },
  "image/wmf": {
    "source": "iana",
    "extensions": ["wmf"]
  },
  "image/x-3ds": {
    "source": "apache",
    "extensions": ["3ds"]
  },
  "image/x-cmu-raster": {
    "source": "apache",
    "extensions": ["ras"]
  },
  "image/x-cmx": {
    "source": "apache",
    "extensions": ["cmx"]
  },
  "image/x-freehand": {
    "source": "apache",
    "extensions": ["fh","fhc","fh4","fh5","fh7"]
  },
  "image/x-icon": {
    "source": "apache",
    "compressible": true,
    "extensions": ["ico"]
  },
  "image/x-jng": {
    "source": "nginx",
    "extensions": ["jng"]
  },
  "image/x-mrsid-image": {
    "source": "apache",
    "extensions": ["sid"]
  },
  "image/x-ms-bmp": {
    "source": "nginx",
    "compressible": true,
    "extensions": ["bmp"]
  },
  "image/x-pcx": {
    "source": "apache",
    "extensions": ["pcx"]
  },
  "image/x-pict": {
    "source": "apache",
    "extensions": ["pic","pct"]
  },
  "image/x-portable-anymap": {
    "source": "apache",
    "extensions": ["pnm"]
  },
  "image/x-portable-bitmap": {
    "source": "apache",
    "extensions": ["pbm"]
  },
  "image/x-portable-graymap": {
    "source": "apache",
    "extensions": ["pgm"]
  },
  "image/x-portable-pixmap": {
    "source": "apache",
    "extensions": ["ppm"]
  },
  "image/x-rgb": {
    "source": "apache",
    "extensions": ["rgb"]
  },
  "image/x-tga": {
    "source": "apache",
    "extensions": ["tga"]
  },
  "image/x-xbitmap": {
    "source": "apache",
    "extensions": ["xbm"]
  },
  "image/x-xcf": {
    "compressible": false
  },
  "image/x-xpixmap": {
    "source": "apache",
    "extensions": ["xpm"]
  },
  "image/x-xwindowdump": {
    "source": "apache",
    "extensions": ["xwd"]
  },
  "message/cpim": {
    "source": "iana"
  },
  "message/delivery-status": {
    "source": "iana"
  },
  "message/disposition-notification": {
    "source": "iana",
    "extensions": [
      "disposition-notification"
    ]
  },
  "message/external-body": {
    "source": "iana"
  },
  "message/feedback-report": {
    "source": "iana"
  },
  "message/global": {
    "source": "iana",
    "extensions": ["u8msg"]
  },
  "message/global-delivery-status": {
    "source": "iana",
    "extensions": ["u8dsn"]
  },
  "message/global-disposition-notification": {
    "source": "iana",
    "extensions": ["u8mdn"]
  },
  "message/global-headers": {
    "source": "iana",
    "extensions": ["u8hdr"]
  },
  "message/http": {
    "source": "iana",
    "compressible": false
  },
  "message/imdn+xml": {
    "source": "iana",
    "compressible": true
  },
  "message/news": {
    "source": "iana"
  },
  "message/partial": {
    "source": "iana",
    "compressible": false
  },
  "message/rfc822": {
    "source": "iana",
    "compressible": true,
    "extensions": ["eml","mime"]
  },
  "message/s-http": {
    "source": "iana"
  },
  "message/sip": {
    "source": "iana"
  },
  "message/sipfrag": {
    "source": "iana"
  },
  "message/tracking-status": {
    "source": "iana"
  },
  "message/vnd.si.simp": {
    "source": "iana"
  },
  "message/vnd.wfa.wsc": {
    "source": "iana",
    "extensions": ["wsc"]
  },
  "model/3mf": {
    "source": "iana",
    "extensions": ["3mf"]
  },
  "model/e57": {
    "source": "iana"
  },
  "model/gltf+json": {
    "source": "iana",
    "compressible": true,
    "extensions": ["gltf"]
  },
  "model/gltf-binary": {
    "source": "iana",
    "compressible": true,
    "extensions": ["glb"]
  },
  "model/iges": {
    "source": "iana",
    "compressible": false,
    "extensions": ["igs","iges"]
  },
  "model/mesh": {
    "source": "iana",
    "compressible": false,
    "extensions": ["msh","mesh","silo"]
  },
  "model/mtl": {
    "source": "iana",
    "extensions": ["mtl"]
  },
  "model/obj": {
    "source": "iana",
    "extensions": ["obj"]
  },
  "model/step": {
    "source": "iana"
  },
  "model/step+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["stpx"]
  },
  "model/step+zip": {
    "source": "iana",
    "compressible": false,
    "extensions": ["stpz"]
  },
  "model/step-xml+zip": {
    "source": "iana",
    "compressible": false,
    "extensions": ["stpxz"]
  },
  "model/stl": {
    "source": "iana",
    "extensions": ["stl"]
  },
  "model/vnd.collada+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["dae"]
  },
  "model/vnd.dwf": {
    "source": "iana",
    "extensions": ["dwf"]
  },
  "model/vnd.flatland.3dml": {
    "source": "iana"
  },
  "model/vnd.gdl": {
    "source": "iana",
    "extensions": ["gdl"]
  },
  "model/vnd.gs-gdl": {
    "source": "apache"
  },
  "model/vnd.gs.gdl": {
    "source": "iana"
  },
  "model/vnd.gtw": {
    "source": "iana",
    "extensions": ["gtw"]
  },
  "model/vnd.moml+xml": {
    "source": "iana",
    "compressible": true
  },
  "model/vnd.mts": {
    "source": "iana",
    "extensions": ["mts"]
  },
  "model/vnd.opengex": {
    "source": "iana",
    "extensions": ["ogex"]
  },
  "model/vnd.parasolid.transmit.binary": {
    "source": "iana",
    "extensions": ["x_b"]
  },
  "model/vnd.parasolid.transmit.text": {
    "source": "iana",
    "extensions": ["x_t"]
  },
  "model/vnd.pytha.pyox": {
    "source": "iana"
  },
  "model/vnd.rosette.annotated-data-model": {
    "source": "iana"
  },
  "model/vnd.sap.vds": {
    "source": "iana",
    "extensions": ["vds"]
  },
  "model/vnd.usdz+zip": {
    "source": "iana",
    "compressible": false,
    "extensions": ["usdz"]
  },
  "model/vnd.valve.source.compiled-map": {
    "source": "iana",
    "extensions": ["bsp"]
  },
  "model/vnd.vtu": {
    "source": "iana",
    "extensions": ["vtu"]
  },
  "model/vrml": {
    "source": "iana",
    "compressible": false,
    "extensions": ["wrl","vrml"]
  },
  "model/x3d+binary": {
    "source": "apache",
    "compressible": false,
    "extensions": ["x3db","x3dbz"]
  },
  "model/x3d+fastinfoset": {
    "source": "iana",
    "extensions": ["x3db"]
  },
  "model/x3d+vrml": {
    "source": "apache",
    "compressible": false,
    "extensions": ["x3dv","x3dvz"]
  },
  "model/x3d+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["x3d","x3dz"]
  },
  "model/x3d-vrml": {
    "source": "iana",
    "extensions": ["x3dv"]
  },
  "multipart/alternative": {
    "source": "iana",
    "compressible": false
  },
  "multipart/appledouble": {
    "source": "iana"
  },
  "multipart/byteranges": {
    "source": "iana"
  },
  "multipart/digest": {
    "source": "iana"
  },
  "multipart/encrypted": {
    "source": "iana",
    "compressible": false
  },
  "multipart/form-data": {
    "source": "iana",
    "compressible": false
  },
  "multipart/header-set": {
    "source": "iana"
  },
  "multipart/mixed": {
    "source": "iana"
  },
  "multipart/multilingual": {
    "source": "iana"
  },
  "multipart/parallel": {
    "source": "iana"
  },
  "multipart/related": {
    "source": "iana",
    "compressible": false
  },
  "multipart/report": {
    "source": "iana"
  },
  "multipart/signed": {
    "source": "iana",
    "compressible": false
  },
  "multipart/vnd.bint.med-plus": {
    "source": "iana"
  },
  "multipart/voice-message": {
    "source": "iana"
  },
  "multipart/x-mixed-replace": {
    "source": "iana"
  },
  "text/1d-interleaved-parityfec": {
    "source": "iana"
  },
  "text/cache-manifest": {
    "source": "iana",
    "compressible": true,
    "extensions": ["appcache","manifest"]
  },
  "text/calendar": {
    "source": "iana",
    "extensions": ["ics","ifb"]
  },
  "text/calender": {
    "compressible": true
  },
  "text/cmd": {
    "compressible": true
  },
  "text/coffeescript": {
    "extensions": ["coffee","litcoffee"]
  },
  "text/cql": {
    "source": "iana"
  },
  "text/cql-expression": {
    "source": "iana"
  },
  "text/cql-identifier": {
    "source": "iana"
  },
  "text/css": {
    "source": "iana",
    "charset": "UTF-8",
    "compressible": true,
    "extensions": ["css"]
  },
  "text/csv": {
    "source": "iana",
    "compressible": true,
    "extensions": ["csv"]
  },
  "text/csv-schema": {
    "source": "iana"
  },
  "text/directory": {
    "source": "iana"
  },
  "text/dns": {
    "source": "iana"
  },
  "text/ecmascript": {
    "source": "iana"
  },
  "text/encaprtp": {
    "source": "iana"
  },
  "text/enriched": {
    "source": "iana"
  },
  "text/fhirpath": {
    "source": "iana"
  },
  "text/flexfec": {
    "source": "iana"
  },
  "text/fwdred": {
    "source": "iana"
  },
  "text/gff3": {
    "source": "iana"
  },
  "text/grammar-ref-list": {
    "source": "iana"
  },
  "text/html": {
    "source": "iana",
    "compressible": true,
    "extensions": ["html","htm","shtml"]
  },
  "text/jade": {
    "extensions": ["jade"]
  },
  "text/javascript": {
    "source": "iana",
    "compressible": true
  },
  "text/jcr-cnd": {
    "source": "iana"
  },
  "text/jsx": {
    "compressible": true,
    "extensions": ["jsx"]
  },
  "text/less": {
    "compressible": true,
    "extensions": ["less"]
  },
  "text/markdown": {
    "source": "iana",
    "compressible": true,
    "extensions": ["markdown","md"]
  },
  "text/mathml": {
    "source": "nginx",
    "extensions": ["mml"]
  },
  "text/mdx": {
    "compressible": true,
    "extensions": ["mdx"]
  },
  "text/mizar": {
    "source": "iana"
  },
  "text/n3": {
    "source": "iana",
    "charset": "UTF-8",
    "compressible": true,
    "extensions": ["n3"]
  },
  "text/parameters": {
    "source": "iana",
    "charset": "UTF-8"
  },
  "text/parityfec": {
    "source": "iana"
  },
  "text/plain": {
    "source": "iana",
    "compressible": true,
    "extensions": ["txt","text","conf","def","list","log","in","ini"]
  },
  "text/provenance-notation": {
    "source": "iana",
    "charset": "UTF-8"
  },
  "text/prs.fallenstein.rst": {
    "source": "iana"
  },
  "text/prs.lines.tag": {
    "source": "iana",
    "extensions": ["dsc"]
  },
  "text/prs.prop.logic": {
    "source": "iana"
  },
  "text/raptorfec": {
    "source": "iana"
  },
  "text/red": {
    "source": "iana"
  },
  "text/rfc822-headers": {
    "source": "iana"
  },
  "text/richtext": {
    "source": "iana",
    "compressible": true,
    "extensions": ["rtx"]
  },
  "text/rtf": {
    "source": "iana",
    "compressible": true,
    "extensions": ["rtf"]
  },
  "text/rtp-enc-aescm128": {
    "source": "iana"
  },
  "text/rtploopback": {
    "source": "iana"
  },
  "text/rtx": {
    "source": "iana"
  },
  "text/sgml": {
    "source": "iana",
    "extensions": ["sgml","sgm"]
  },
  "text/shaclc": {
    "source": "iana"
  },
  "text/shex": {
    "source": "iana",
    "extensions": ["shex"]
  },
  "text/slim": {
    "extensions": ["slim","slm"]
  },
  "text/spdx": {
    "source": "iana",
    "extensions": ["spdx"]
  },
  "text/strings": {
    "source": "iana"
  },
  "text/stylus": {
    "extensions": ["stylus","styl"]
  },
  "text/t140": {
    "source": "iana"
  },
  "text/tab-separated-values": {
    "source": "iana",
    "compressible": true,
    "extensions": ["tsv"]
  },
  "text/troff": {
    "source": "iana",
    "extensions": ["t","tr","roff","man","me","ms"]
  },
  "text/turtle": {
    "source": "iana",
    "charset": "UTF-8",
    "extensions": ["ttl"]
  },
  "text/ulpfec": {
    "source": "iana"
  },
  "text/uri-list": {
    "source": "iana",
    "compressible": true,
    "extensions": ["uri","uris","urls"]
  },
  "text/vcard": {
    "source": "iana",
    "compressible": true,
    "extensions": ["vcard"]
  },
  "text/vnd.a": {
    "source": "iana"
  },
  "text/vnd.abc": {
    "source": "iana"
  },
  "text/vnd.ascii-art": {
    "source": "iana"
  },
  "text/vnd.curl": {
    "source": "iana",
    "extensions": ["curl"]
  },
  "text/vnd.curl.dcurl": {
    "source": "apache",
    "extensions": ["dcurl"]
  },
  "text/vnd.curl.mcurl": {
    "source": "apache",
    "extensions": ["mcurl"]
  },
  "text/vnd.curl.scurl": {
    "source": "apache",
    "extensions": ["scurl"]
  },
  "text/vnd.debian.copyright": {
    "source": "iana",
    "charset": "UTF-8"
  },
  "text/vnd.dmclientscript": {
    "source": "iana"
  },
  "text/vnd.dvb.subtitle": {
    "source": "iana",
    "extensions": ["sub"]
  },
  "text/vnd.esmertec.theme-descriptor": {
    "source": "iana",
    "charset": "UTF-8"
  },
  "text/vnd.familysearch.gedcom": {
    "source": "iana",
    "extensions": ["ged"]
  },
  "text/vnd.ficlab.flt": {
    "source": "iana"
  },
  "text/vnd.fly": {
    "source": "iana",
    "extensions": ["fly"]
  },
  "text/vnd.fmi.flexstor": {
    "source": "iana",
    "extensions": ["flx"]
  },
  "text/vnd.gml": {
    "source": "iana"
  },
  "text/vnd.graphviz": {
    "source": "iana",
    "extensions": ["gv"]
  },
  "text/vnd.hans": {
    "source": "iana"
  },
  "text/vnd.hgl": {
    "source": "iana"
  },
  "text/vnd.in3d.3dml": {
    "source": "iana",
    "extensions": ["3dml"]
  },
  "text/vnd.in3d.spot": {
    "source": "iana",
    "extensions": ["spot"]
  },
  "text/vnd.iptc.newsml": {
    "source": "iana"
  },
  "text/vnd.iptc.nitf": {
    "source": "iana"
  },
  "text/vnd.latex-z": {
    "source": "iana"
  },
  "text/vnd.motorola.reflex": {
    "source": "iana"
  },
  "text/vnd.ms-mediapackage": {
    "source": "iana"
  },
  "text/vnd.net2phone.commcenter.command": {
    "source": "iana"
  },
  "text/vnd.radisys.msml-basic-layout": {
    "source": "iana"
  },
  "text/vnd.senx.warpscript": {
    "source": "iana"
  },
  "text/vnd.si.uricatalogue": {
    "source": "iana"
  },
  "text/vnd.sosi": {
    "source": "iana"
  },
  "text/vnd.sun.j2me.app-descriptor": {
    "source": "iana",
    "charset": "UTF-8",
    "extensions": ["jad"]
  },
  "text/vnd.trolltech.linguist": {
    "source": "iana",
    "charset": "UTF-8"
  },
  "text/vnd.wap.si": {
    "source": "iana"
  },
  "text/vnd.wap.sl": {
    "source": "iana"
  },
  "text/vnd.wap.wml": {
    "source": "iana",
    "extensions": ["wml"]
  },
  "text/vnd.wap.wmlscript": {
    "source": "iana",
    "extensions": ["wmls"]
  },
  "text/vtt": {
    "source": "iana",
    "charset": "UTF-8",
    "compressible": true,
    "extensions": ["vtt"]
  },
  "text/x-asm": {
    "source": "apache",
    "extensions": ["s","asm"]
  },
  "text/x-c": {
    "source": "apache",
    "extensions": ["c","cc","cxx","cpp","h","hh","dic"]
  },
  "text/x-component": {
    "source": "nginx",
    "extensions": ["htc"]
  },
  "text/x-fortran": {
    "source": "apache",
    "extensions": ["f","for","f77","f90"]
  },
  "text/x-gwt-rpc": {
    "compressible": true
  },
  "text/x-handlebars-template": {
    "extensions": ["hbs"]
  },
  "text/x-java-source": {
    "source": "apache",
    "extensions": ["java"]
  },
  "text/x-jquery-tmpl": {
    "compressible": true
  },
  "text/x-lua": {
    "extensions": ["lua"]
  },
  "text/x-markdown": {
    "compressible": true,
    "extensions": ["mkd"]
  },
  "text/x-nfo": {
    "source": "apache",
    "extensions": ["nfo"]
  },
  "text/x-opml": {
    "source": "apache",
    "extensions": ["opml"]
  },
  "text/x-org": {
    "compressible": true,
    "extensions": ["org"]
  },
  "text/x-pascal": {
    "source": "apache",
    "extensions": ["p","pas"]
  },
  "text/x-processing": {
    "compressible": true,
    "extensions": ["pde"]
  },
  "text/x-sass": {
    "extensions": ["sass"]
  },
  "text/x-scss": {
    "extensions": ["scss"]
  },
  "text/x-setext": {
    "source": "apache",
    "extensions": ["etx"]
  },
  "text/x-sfv": {
    "source": "apache",
    "extensions": ["sfv"]
  },
  "text/x-suse-ymp": {
    "compressible": true,
    "extensions": ["ymp"]
  },
  "text/x-uuencode": {
    "source": "apache",
    "extensions": ["uu"]
  },
  "text/x-vcalendar": {
    "source": "apache",
    "extensions": ["vcs"]
  },
  "text/x-vcard": {
    "source": "apache",
    "extensions": ["vcf"]
  },
  "text/xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["xml"]
  },
  "text/xml-external-parsed-entity": {
    "source": "iana"
  },
  "text/yaml": {
    "compressible": true,
    "extensions": ["yaml","yml"]
  },
  "video/1d-interleaved-parityfec": {
    "source": "iana"
  },
  "video/3gpp": {
    "source": "iana",
    "extensions": ["3gp","3gpp"]
  },
  "video/3gpp-tt": {
    "source": "iana"
  },
  "video/3gpp2": {
    "source": "iana",
    "extensions": ["3g2"]
  },
  "video/av1": {
    "source": "iana"
  },
  "video/bmpeg": {
    "source": "iana"
  },
  "video/bt656": {
    "source": "iana"
  },
  "video/celb": {
    "source": "iana"
  },
  "video/dv": {
    "source": "iana"
  },
  "video/encaprtp": {
    "source": "iana"
  },
  "video/ffv1": {
    "source": "iana"
  },
  "video/flexfec": {
    "source": "iana"
  },
  "video/h261": {
    "source": "iana",
    "extensions": ["h261"]
  },
  "video/h263": {
    "source": "iana",
    "extensions": ["h263"]
  },
  "video/h263-1998": {
    "source": "iana"
  },
  "video/h263-2000": {
    "source": "iana"
  },
  "video/h264": {
    "source": "iana",
    "extensions": ["h264"]
  },
  "video/h264-rcdo": {
    "source": "iana"
  },
  "video/h264-svc": {
    "source": "iana"
  },
  "video/h265": {
    "source": "iana"
  },
  "video/iso.segment": {
    "source": "iana",
    "extensions": ["m4s"]
  },
  "video/jpeg": {
    "source": "iana",
    "extensions": ["jpgv"]
  },
  "video/jpeg2000": {
    "source": "iana"
  },
  "video/jpm": {
    "source": "apache",
    "extensions": ["jpm","jpgm"]
  },
  "video/jxsv": {
    "source": "iana"
  },
  "video/mj2": {
    "source": "iana",
    "extensions": ["mj2","mjp2"]
  },
  "video/mp1s": {
    "source": "iana"
  },
  "video/mp2p": {
    "source": "iana"
  },
  "video/mp2t": {
    "source": "iana",
    "extensions": ["ts"]
  },
  "video/mp4": {
    "source": "iana",
    "compressible": false,
    "extensions": ["mp4","mp4v","mpg4"]
  },
  "video/mp4v-es": {
    "source": "iana"
  },
  "video/mpeg": {
    "source": "iana",
    "compressible": false,
    "extensions": ["mpeg","mpg","mpe","m1v","m2v"]
  },
  "video/mpeg4-generic": {
    "source": "iana"
  },
  "video/mpv": {
    "source": "iana"
  },
  "video/nv": {
    "source": "iana"
  },
  "video/ogg": {
    "source": "iana",
    "compressible": false,
    "extensions": ["ogv"]
  },
  "video/parityfec": {
    "source": "iana"
  },
  "video/pointer": {
    "source": "iana"
  },
  "video/quicktime": {
    "source": "iana",
    "compressible": false,
    "extensions": ["qt","mov"]
  },
  "video/raptorfec": {
    "source": "iana"
  },
  "video/raw": {
    "source": "iana"
  },
  "video/rtp-enc-aescm128": {
    "source": "iana"
  },
  "video/rtploopback": {
    "source": "iana"
  },
  "video/rtx": {
    "source": "iana"
  },
  "video/scip": {
    "source": "iana"
  },
  "video/smpte291": {
    "source": "iana"
  },
  "video/smpte292m": {
    "source": "iana"
  },
  "video/ulpfec": {
    "source": "iana"
  },
  "video/vc1": {
    "source": "iana"
  },
  "video/vc2": {
    "source": "iana"
  },
  "video/vnd.cctv": {
    "source": "iana"
  },
  "video/vnd.dece.hd": {
    "source": "iana",
    "extensions": ["uvh","uvvh"]
  },
  "video/vnd.dece.mobile": {
    "source": "iana",
    "extensions": ["uvm","uvvm"]
  },
  "video/vnd.dece.mp4": {
    "source": "iana"
  },
  "video/vnd.dece.pd": {
    "source": "iana",
    "extensions": ["uvp","uvvp"]
  },
  "video/vnd.dece.sd": {
    "source": "iana",
    "extensions": ["uvs","uvvs"]
  },
  "video/vnd.dece.video": {
    "source": "iana",
    "extensions": ["uvv","uvvv"]
  },
  "video/vnd.directv.mpeg": {
    "source": "iana"
  },
  "video/vnd.directv.mpeg-tts": {
    "source": "iana"
  },
  "video/vnd.dlna.mpeg-tts": {
    "source": "iana"
  },
  "video/vnd.dvb.file": {
    "source": "iana",
    "extensions": ["dvb"]
  },
  "video/vnd.fvt": {
    "source": "iana",
    "extensions": ["fvt"]
  },
  "video/vnd.hns.video": {
    "source": "iana"
  },
  "video/vnd.iptvforum.1dparityfec-1010": {
    "source": "iana"
  },
  "video/vnd.iptvforum.1dparityfec-2005": {
    "source": "iana"
  },
  "video/vnd.iptvforum.2dparityfec-1010": {
    "source": "iana"
  },
  "video/vnd.iptvforum.2dparityfec-2005": {
    "source": "iana"
  },
  "video/vnd.iptvforum.ttsavc": {
    "source": "iana"
  },
  "video/vnd.iptvforum.ttsmpeg2": {
    "source": "iana"
  },
  "video/vnd.motorola.video": {
    "source": "iana"
  },
  "video/vnd.motorola.videop": {
    "source": "iana"
  },
  "video/vnd.mpegurl": {
    "source": "iana",
    "extensions": ["mxu","m4u"]
  },
  "video/vnd.ms-playready.media.pyv": {
    "source": "iana",
    "extensions": ["pyv"]
  },
  "video/vnd.nokia.interleaved-multimedia": {
    "source": "iana"
  },
  "video/vnd.nokia.mp4vr": {
    "source": "iana"
  },
  "video/vnd.nokia.videovoip": {
    "source": "iana"
  },
  "video/vnd.objectvideo": {
    "source": "iana"
  },
  "video/vnd.radgamettools.bink": {
    "source": "iana"
  },
  "video/vnd.radgamettools.smacker": {
    "source": "iana"
  },
  "video/vnd.sealed.mpeg1": {
    "source": "iana"
  },
  "video/vnd.sealed.mpeg4": {
    "source": "iana"
  },
  "video/vnd.sealed.swf": {
    "source": "iana"
  },
  "video/vnd.sealedmedia.softseal.mov": {
    "source": "iana"
  },
  "video/vnd.uvvu.mp4": {
    "source": "iana",
    "extensions": ["uvu","uvvu"]
  },
  "video/vnd.vivo": {
    "source": "iana",
    "extensions": ["viv"]
  },
  "video/vnd.youtube.yt": {
    "source": "iana"
  },
  "video/vp8": {
    "source": "iana"
  },
  "video/vp9": {
    "source": "iana"
  },
  "video/webm": {
    "source": "apache",
    "compressible": false,
    "extensions": ["webm"]
  },
  "video/x-f4v": {
    "source": "apache",
    "extensions": ["f4v"]
  },
  "video/x-fli": {
    "source": "apache",
    "extensions": ["fli"]
  },
  "video/x-flv": {
    "source": "apache",
    "compressible": false,
    "extensions": ["flv"]
  },
  "video/x-m4v": {
    "source": "apache",
    "extensions": ["m4v"]
  },
  "video/x-matroska": {
    "source": "apache",
    "compressible": false,
    "extensions": ["mkv","mk3d","mks"]
  },
  "video/x-mng": {
    "source": "apache",
    "extensions": ["mng"]
  },
  "video/x-ms-asf": {
    "source": "apache",
    "extensions": ["asf","asx"]
  },
  "video/x-ms-vob": {
    "source": "apache",
    "extensions": ["vob"]
  },
  "video/x-ms-wm": {
    "source": "apache",
    "extensions": ["wm"]
  },
  "video/x-ms-wmv": {
    "source": "apache",
    "compressible": false,
    "extensions": ["wmv"]
  },
  "video/x-ms-wmx": {
    "source": "apache",
    "extensions": ["wmx"]
  },
  "video/x-ms-wvx": {
    "source": "apache",
    "extensions": ["wvx"]
  },
  "video/x-msvideo": {
    "source": "apache",
    "extensions": ["avi"]
  },
  "video/x-sgi-movie": {
    "source": "apache",
    "extensions": ["movie"]
  },
  "video/x-smv": {
    "source": "apache",
    "extensions": ["smv"]
  },
  "x-conference/x-cooltalk": {
    "source": "apache",
    "extensions": ["ice"]
  },
  "x-shader/x-fragment": {
    "compressible": true
  },
  "x-shader/x-vertex": {
    "compressible": true
  }
}`);
const EXTRACT_TYPE_REGEXP = /^\s*([^;\s]*)(?:;|\s|$)/;
const TEXT_TYPE_REGEXP = /^text\//i;
const extensions = new Map();
const types = new Map();
function populateMaps(extensions1, types1) {
    const preference = [
        "nginx",
        "apache",
        undefined,
        "iana"
    ];
    for (const type of Object.keys(db)){
        const mime = db[type];
        const exts = mime.extensions;
        if (!exts || !exts.length) {
            continue;
        }
        extensions1.set(type, exts);
        for (const ext of exts){
            const current = types1.get(ext);
            if (current) {
                const from = preference.indexOf(db[current].source);
                const to3 = preference.indexOf(mime.source);
                if (current !== "application/octet-stream" && (from > to3 || from === to3 && current.substr(0, 12) === "application/")) {
                    continue;
                }
            }
            types1.set(ext, type);
        }
    }
}
populateMaps(extensions, types);
function charset(type) {
    const m1 = EXTRACT_TYPE_REGEXP.exec(type);
    if (!m1) {
        return undefined;
    }
    const [match] = m1;
    const mime = db[match.toLowerCase()];
    if (mime && mime.charset) {
        return mime.charset;
    }
    if (TEXT_TYPE_REGEXP.test(match)) {
        return "UTF-8";
    }
    return undefined;
}
function lookup(path25) {
    const extension1 = extname2("x." + path25).toLowerCase().substr(1);
    return types.get(extension1);
}
function contentType(str) {
    let mime = str.includes("/") ? str : lookup(str);
    if (!mime) {
        return undefined;
    }
    if (!mime.includes("charset")) {
        const cs = charset(mime);
        if (cs) {
            mime += `; charset=${cs.toLowerCase()}`;
        }
    }
    return mime;
}
var t = {
};
Object.defineProperty(t, "__esModule", {
    value: true
});
t.VERSION = void 0;
t.VERSION = "0.0.27";
var n = {
};
Object.defineProperty(n, "__esModule", {
    value: true
});
n.printVersion = n.escapeHtml = n.onNodeRemove = n.detectSSR = n.nodeToString = n.task = void 0;
const r = t;
const task$1 = (e1)=>setTimeout(e1, 0)
;
n.task = task$1;
const nodeToString$1 = (e2)=>{
    const t1 = document.createElement("div");
    t1.appendChild(e2.cloneNode(true));
    return t1.innerHTML;
};
n.nodeToString = nodeToString$1;
const detectSSR = ()=>{
    const e3 = "undefined" !== typeof Deno;
    const t2 = "undefined" !== typeof window;
    return "undefined" !== typeof _nano && _nano.isSSR || e3 || !t2;
};
n.detectSSR = detectSSR;
function isDescendant(e4, t3) {
    return !!e4 && (e4 === t3 || isDescendant(e4.parentNode, t3));
}
const onNodeRemove = (e5, t4)=>{
    let n1 = new MutationObserver((r1)=>{
        r1.forEach((r2)=>{
            r2.removedNodes.forEach((r3)=>{
                if (isDescendant(e5, r3)) {
                    t4();
                    if (n1) {
                        n1.disconnect();
                        n1 = void 0;
                    }
                }
            });
        });
    });
    n1.observe(document, {
        childList: true,
        subtree: true
    });
    return n1;
};
n.onNodeRemove = onNodeRemove;
const escapeHtml = (e6)=>e6 && "string" === typeof e6 ? e6.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;") : e6
;
n.escapeHtml = escapeHtml;
const printVersion$1 = ()=>{
    const e7 = `Powered by nano JSX v${r.VERSION}`;
    console.log(`%c %c %c %c %c ${e7} %c http://nanojsx.io`, "background: #ff0000", "background: #ffff00", "background: #00ff00", "background: #00ffff", "color: #fff; background: #000000;", "background: none");
};
n.printVersion = printVersion$1;
var s = {
};
Object.defineProperty(s, "__esModule", {
    value: true
});
s.documentSSR = s.DocumentSSR = s.HTMLElementSSR = void 0;
const o = n;
class HTMLElementSSR {
    constructor(e8){
        this.isSelfClosing = false;
        this.nodeType = null;
        this.tagName = e8;
        const t5 = [
            "area",
            "base",
            "br",
            "col",
            "embed",
            "hr",
            "img",
            "input",
            "link",
            "meta",
            "param",
            "source",
            "track",
            "wbr"
        ];
        this.nodeType = 1;
        if (t5.indexOf(e8) >= 0) {
            this._ssr = `<${e8} />`;
            this.isSelfClosing = true;
        } else this._ssr = `<${e8}></${e8}>`;
    }
    get outerHTML() {
        return this.toString();
    }
    get innerHTML() {
        return this.innerText;
    }
    set innerHTML(e9) {
        this.innerText = e9;
    }
    get innerText() {
        var e10;
        const t6 = /(^<[^>]+>)(.+)?(<\/[a-z]+>$|\/>$)/gm;
        return (null === (e10 = t6.exec(this._ssr)) || void 0 === e10 ? void 0 : e10[2]) || "";
    }
    set innerText(e11) {
        const t7 = /(^<[^>]+>)(.+)?(<\/[a-z]+>$|\/>$)/gm;
        this._ssr = this._ssr.replace(t7, `$1${e11}$3`);
    }
    getAttribute(e) {
        return null;
    }
    get classList() {
        const e12 = this._ssr;
        const t8 = /^<\w+.+(\sclass=")([^"]+)"/gm;
        return {
            add: (e13)=>{
                this.setAttribute("class", e13);
            },
            entries: {
                get length () {
                    const n2 = t8.exec(e12);
                    return n2 && n2[2] ? n2[2].split(" ").length : 0;
                }
            }
        };
    }
    toString() {
        return this._ssr;
    }
    setAttributeNS(e, t9, n3) {
        this.setAttribute(t9, n3);
    }
    setAttribute(e14, t10) {
        this.isSelfClosing ? this._ssr = this._ssr.replace(/(^<[a-z]+ )(.+)/gm, `$1${(0, o.escapeHtml)(e14)}="${(0, o.escapeHtml)(t10)}" $2`) : this._ssr = this._ssr.replace(/(^<[^>]+)(.+)/gm, `$1 ${(0, o.escapeHtml)(e14)}="${(0, o.escapeHtml)(t10)}"$2`);
    }
    append(e15) {
        this.appendChild(e15);
    }
    appendChild(e16) {
        const t11 = this._ssr.lastIndexOf("</");
        this._ssr = this._ssr.substring(0, t11) + e16 + this._ssr.substring(t11);
    }
    get children() {
        const e17 = /<([a-z]+)((?!<\/\1).)*<\/\1>/gms;
        const t12 = [];
        let n4;
        while(null !== (n4 = e17.exec(this.innerHTML)))t12.push(n4[0].replace(/[\s]+/gm, " "));
        return t12;
    }
    addEventListener(e, t, n) {
    }
}
s.HTMLElementSSR = HTMLElementSSR;
class DocumentSSR {
    constructor(){
        this.body = this.createElement("body");
        this.head = this.createElement("head");
    }
    createElement(e18) {
        return new HTMLElementSSR(e18);
    }
    createElementNS(e, t13) {
        return this.createElement(t13);
    }
    createTextNode(e19) {
        return (0, o.escapeHtml)(e19);
    }
    querySelector(e) {
    }
}
s.DocumentSSR = DocumentSSR;
const documentSSR = ()=>new DocumentSSR
;
s.documentSSR = documentSSR;
var i = {
};
Object.defineProperty(i, "__esModule", {
    value: true
});
i.h = i._render = i.render = i.hydrate = i.appendChildren = i.strToHash = i.removeAllChildNodes = i.tick = i.isSSR = void 0;
const a = s;
const isSSR = ()=>"undefined" !== typeof _nano && true === _nano.isSSR
;
i.isSSR = isSSR;
i.tick = "function" == typeof Promise ? Promise.prototype.then.bind(Promise.resolve()) : setTimeout;
const removeAllChildNodes = (e20)=>{
    while(e20.firstChild)e20.removeChild(e20.firstChild);
};
i.removeAllChildNodes = removeAllChildNodes;
const strToHash = (e21)=>{
    let t14 = 0;
    for(let n5 = 0; n5 < e21.length; n5++){
        const r4 = e21.charCodeAt(n5);
        t14 = (t14 << 5) - t14 + r4;
        t14 |= 0;
    }
    return Math.abs(t14).toString(32);
};
i.strToHash = strToHash;
const appendChildren = (e22, t15, n6 = true)=>{
    if (Array.isArray(t15)) {
        "object" === typeof t15 && (t15 = Array.prototype.slice.call(t15));
        t15.forEach((t16)=>{
            if (Array.isArray(t16)) (0, i.appendChildren)(e22, t16, n6);
            else {
                const r5 = (0, i._render)(t16);
                "undefined" !== typeof r5 && (Array.isArray(r5) ? (0, i.appendChildren)(e22, r5, n6) : (0, i.isSSR)() && !n6 ? e22.appendChild(null == r5.nodeType ? r5.toString() : r5) : e22.appendChild(null == r5.nodeType ? document.createTextNode(r5.toString()) : r5));
            }
        });
    } else (0, i.appendChildren)(e22, [
        t15
    ], n6);
};
i.appendChildren = appendChildren;
const SVG = (e24)=>{
    const t17 = e24.children[0];
    const n7 = t17.attributes;
    if ((0, i.isSSR)()) return t17;
    const r6 = hNS("svg");
    for(let e23 = n7.length - 1; e23 >= 0; e23--)r6.setAttribute(n7[e23].name, n7[e23].value);
    r6.innerHTML = t17.innerHTML;
    return r6;
};
const hydrate$1 = (e25, t18 = null, n8 = true)=>(0, i.render)(e25, t18, n8)
;
i.hydrate = hydrate$1;
const render$1 = (e26, t19 = null, n9 = true)=>{
    let r7 = (0, i._render)(e26);
    if (Array.isArray(r7)) {
        r7 = r7.map((e27)=>(0, i._render)(e27)
        );
        1 === r7.length && (r7 = r7[0]);
    }
    if (t19) {
        n9 && (0, i.removeAllChildNodes)(t19);
        r7 && t19.id && t19.id === r7.id && t19.parentElement ? t19.parentElement.replaceChild(r7, t19) : Array.isArray(r7) ? r7.forEach((e28)=>{
            (0, i.appendChildren)(t19, (0, i._render)(e28));
        }) : (0, i.appendChildren)(t19, (0, i._render)(r7));
        return t19;
    }
    return (0, i.isSSR)() && !Array.isArray(r7) ? [
        r7
    ] : r7;
};
i.render = render$1;
const _render = (e29)=>{
    if ("undefined" === typeof e29) return [];
    if (null == e29) return [];
    if (false === e29) return [];
    if ("string" === typeof e29) return e29;
    if ("number" === typeof e29) return e29.toString();
    if (e29.tagName && "svg" === e29.tagName.toLowerCase()) return SVG({
        children: [
            e29
        ]
    });
    if (e29.tagName) return e29;
    if (e29 && e29.component && e29.component.isClass) return renderClassComponent(e29);
    if (e29.isClass) return renderClassComponent({
        component: e29,
        props: {
        }
    });
    if (e29.component && "function" === typeof e29.component) return renderFunctionalComponent(e29);
    if (Array.isArray(e29)) return e29.map((e30)=>(0, i._render)(e30)
    ).flat();
    if ("function" === typeof e29 && !e29.isClass) return (0, i._render)(e29());
    if (e29.component && e29.component.tagName && "string" === typeof e29.component.tagName) return (0, i._render)(e29.component);
    if (Array.isArray(e29.component)) return (0, i._render)(e29.component);
    if (e29.component) return (0, i._render)(e29.component);
    if ("object" === typeof e29) return [];
    console.warn("Something unexpected happened with:", e29);
};
i._render = _render;
const renderFunctionalComponent = (e31)=>{
    const { component: t20 , props: n10  } = e31;
    return (0, i._render)(t20(n10));
};
const renderClassComponent = (e32)=>{
    const { component: t21 , props: n11  } = e32;
    const r8 = (0, i.strToHash)(t21.toString());
    t21.prototype._getHash = ()=>r8
    ;
    const s1 = new t21(n11);
    (0, i.isSSR)() || s1.willMount();
    let o1 = s1.render();
    o1 = (0, i._render)(o1);
    s1.elements = o1;
    n11 && n11.ref && n11.ref(s1);
    (0, i.isSSR)() || (0, i.tick)(()=>{
        s1._didMount();
    });
    return o1;
};
const hNS = (e33)=>document.createElementNS("http://www.w3.org/2000/svg", e33)
;
const h$1 = (e35, t22, ...n12)=>{
    if ((0, i.isSSR)() && "string" === typeof e35 && e35.includes("-") && _nano.customElements.has(e35)) {
        const r9 = _nano.customElements.get(e35);
        const s2 = (0, i._render)({
            component: r9,
            props: Object.assign(Object.assign({
            }, t22), {
                children: n12
            })
        });
        const o2 = s2.toString().match(/^<(?<tag>[a-z]+)>(.*)<\/\k<tag>>$/);
        if (o2) {
            const e36 = new a.HTMLElementSSR(o2[1]);
            e36.innerText = o2[2];
            function replacer(e37, t23, n, r) {
                return e37.replace(t23, "");
            }
            e36.innerText = e36.innerText.replace(/<\w+[^>]*(\s(on\w*)="[^"]*")/gm, replacer);
            return e36;
        }
        return "COULD NOT RENDER WEB-COMPONENT";
    }
    if ("string" !== typeof e35) return {
        component: e35,
        props: Object.assign(Object.assign({
        }, t22), {
            children: n12
        })
    };
    let r10;
    const s3 = "svg" === e35 ? hNS("svg") : document.createElement(e35);
    const isEvent = (e38, t24)=>0 === t24.indexOf("on") && (!!e38.ssr || "object" === typeof e38[t24] || "function" === typeof e38[t24])
    ;
    for(const e34 in t22){
        if ("style" === e34 && "object" === typeof t22[e34]) {
            const n13 = Object.keys(t22[e34]).map((n14)=>`${n14}:${t22[e34][n14]}`
            ).join(";").replace(/[A-Z]/g, (e39)=>`-${e39.toLowerCase()}`
            );
            t22[e34] = `${n13};`;
        }
        if ("ref" === e34) r10 = t22[e34];
        else if (isEvent(s3, e34.toLowerCase())) s3.addEventListener(e34.toLowerCase().substring(2), (n15)=>t22[e34](n15)
        );
        else if ("dangerouslySetInnerHTML" === e34 && t22[e34].__html) if ((0, i.isSSR)()) s3.innerHTML = t22[e34].__html;
        else {
            const n16 = document.createElement("fragment");
            n16.innerHTML = t22[e34].__html;
            s3.appendChild(n16);
        }
        else if ("innerHTML" === e34 && t22[e34].__dangerousHtml) if ((0, i.isSSR)()) s3.innerHTML = t22[e34].__dangerousHtml;
        else {
            const n17 = document.createElement("fragment");
            n17.innerHTML = t22[e34].__dangerousHtml;
            s3.appendChild(n17);
        }
        else /className/i.test(e34) ? console.warn('You can use "class" instead of "className".') : "undefined" !== typeof t22[e34] && s3.setAttribute(e34, t22[e34]);
    }
    const o3 = ![
        "noscript",
        "script",
        "style"
    ].includes(e35);
    (0, i.appendChildren)(s3, n12, o3);
    r10 && r10(s3);
    return s3;
};
i.h = h$1;
var c = {
};
Object.defineProperty(c, "__esModule", {
    value: true
});
c._clearState = c._state = void 0;
c._state = new Map;
const _clearState = ()=>{
    c._state.clear();
};
c._clearState = _clearState;
var l = {
};
Object.defineProperty(l, "__esModule", {
    value: true
});
l.Component = void 0;
const u = n;
const d = i;
const h = c;
class Component$1 {
    constructor(e40){
        this._elements = [];
        this._skipUnmount = false;
        this._hasUnmounted = false;
        this.props = e40 || {
        };
        this.id = this._getHash();
    }
    static get isClass() {
        return true;
    }
    get isClass() {
        return true;
    }
    setState(e41, t25 = false) {
        const n18 = "object" === typeof e41 && null !== e41;
        n18 && void 0 !== this.state ? this.state = Object.assign(Object.assign({
        }, this.state), e41) : this.state = e41;
        t25 && this.update();
    }
    set state(e42) {
        h._state.set(this.id, e42);
    }
    get state() {
        return h._state.get(this.id);
    }
    set initState(e43) {
        void 0 === this.state && (this.state = e43);
    }
    get elements() {
        return this._elements || [];
    }
    set elements(e44) {
        Array.isArray(e44) || (e44 = [
            e44
        ]);
        e44.forEach((e45)=>{
            this._elements.push(e45);
        });
    }
    _addNodeRemoveListener() {
        /^[^{]+{\s+}$/gm.test(this.didUnmount.toString()) || (0, u.onNodeRemove)(this.elements[0], ()=>{
            this._skipUnmount || this._didUnmount();
        });
    }
    _didMount() {
        this._addNodeRemoveListener();
        this.didMount();
    }
    _didUnmount() {
        if (!this._hasUnmounted) {
            this.didUnmount();
            this._hasUnmounted = true;
        }
    }
    willMount() {
    }
    didMount() {
    }
    didUnmount() {
    }
    render(e) {
    }
    update(e46) {
        this._skipUnmount = true;
        const t26 = [
            ...this.elements
        ];
        this._elements = [];
        let n19 = this.render(e46);
        n19 = (0, d._render)(n19);
        this.elements = n19;
        const r11 = t26[0].parentElement;
        r11 || console.warn("Component needs a parent element to get updated!");
        this.elements.forEach((e47)=>{
            r11 && r11.insertBefore(e47, t26[0]);
        });
        t26.forEach((e48)=>{
            e48.remove();
            e48 = null;
        });
        this._addNodeRemoveListener();
        (0, d.tick)(()=>{
            this._skipUnmount = false;
            this.elements[0].isConnected || this._didUnmount();
        });
    }
    _getHash() {
    }
}
l.Component = Component$1;
var p = {
};
Object.defineProperty(p, "__esModule", {
    value: true
});
p.Helmet = void 0;
const f = l;
const m = i;
class Helmet$1 extends f.Component {
    static SSR(e50) {
        const t28 = /(<helmet\b[^>]*>)((.|\n)*?)(<\/helmet>)/gm;
        const n20 = [];
        const r12 = [];
        if ("undefined" !== typeof document && document.head) {
            let e49 = [];
            e49 = [].slice.call(document.head.children);
            for(let t27 = 0; t27 < e49.length; t27++)-1 === n20.indexOf(e49[t27]) && n20.push(e49[t27]);
        }
        let s4;
        while(null !== (s4 = t28.exec(e50))){
            const e51 = s4[1];
            const t29 = s4[2];
            const o4 = e51.includes('data-placement="head"');
            o4 && !n20.includes(t29) ? n20.push(t29) : o4 || r12.includes(t29) || r12.push(t29);
        }
        const o5 = e50.replace(t28, "");
        return {
            body: o5,
            head: n20,
            footer: r12
        };
    }
    didMount() {
        this.props.children.forEach((e53)=>{
            var t30, n21, r14, s5;
            const o6 = this.props.footer ? document.body : document.head;
            const i1 = e53.tagName;
            let a1 = [];
            a1.push(e53.innerText);
            for(let r13 = 0; r13 < e53.attributes.length; r13++){
                a1.push(null === (t30 = e53.attributes.item(r13)) || void 0 === t30 ? void 0 : t30.name.toLowerCase());
                a1.push(null === (n21 = e53.attributes.item(r13)) || void 0 === n21 ? void 0 : n21.value.toLowerCase());
            }
            if ("HTML" === i1 || "BODY" === i1) {
                const e54 = document.getElementsByTagName(i1)[0];
                for(let t31 = 1; t31 < a1.length; t31 += 2)e54.setAttribute(a1[t31], a1[t31 + 1]);
                return;
            }
            if ("TITLE" === i1) {
                const t32 = document.getElementsByTagName("TITLE");
                if (t32.length > 0) {
                    const n22 = e53;
                    t32[0].text = n22.text;
                } else {
                    const t33 = (0, m.h)("title", null, e53.innerHTML);
                    (0, m.appendChildren)(o6, [
                        t33
                    ], false);
                }
                return;
            }
            let c1 = false;
            a1 = a1.sort();
            const l1 = document.getElementsByTagName(i1);
            for(let e52 = 0; e52 < l1.length; e52++){
                let t34 = [];
                t34.push(l1[e52].innerText);
                for(let n23 = 0; n23 < l1[e52].attributes.length; n23++){
                    t34.push(null === (r14 = l1[e52].attributes.item(n23)) || void 0 === r14 ? void 0 : r14.name.toLowerCase());
                    t34.push(null === (s5 = l1[e52].attributes.item(n23)) || void 0 === s5 ? void 0 : s5.value.toLowerCase());
                }
                t34 = t34.sort();
                a1.length > 0 && t34.length > 0 && JSON.stringify(a1) === JSON.stringify(t34) && (c1 = true);
            }
            c1 || (0, m.appendChildren)(o6, [
                e53
            ], false);
        });
    }
    render() {
        const e55 = this.props.footer ? "footer" : "head";
        return (0, m.isSSR)() ? (0, m.h)("helmet", {
            "data-ssr": true,
            "data-placement": e55
        }, this.props.children) : [];
    }
}
p.Helmet = Helmet$1;
var g = {
};
var b = g && g.__rest || function(e56, t35) {
    var n24 = {
    };
    for(var r15 in e56)Object.prototype.hasOwnProperty.call(e56, r15) && t35.indexOf(r15) < 0 && (n24[r15] = e56[r15]);
    if (null != e56 && "function" === typeof Object.getOwnPropertySymbols) {
        var s6 = 0;
        for(r15 = Object.getOwnPropertySymbols(e56); s6 < r15.length; s6++)t35.indexOf(r15[s6]) < 0 && Object.prototype.propertyIsEnumerable.call(e56, r15[s6]) && (n24[r15[s6]] = e56[r15[s6]]);
    }
    return n24;
};
Object.defineProperty(g, "__esModule", {
    value: true
});
g.Img = void 0;
const y = l;
const v = i;
class Img$1 extends y.Component {
    constructor(e57){
        super(e57);
        const { src: t36 , key: n25  } = e57;
        this.id = `${(0, v.strToHash)(t36)}-${(0, v.strToHash)(JSON.stringify(e57))}`;
        n25 && (this.id += `key-${n25}`);
        this.state || this.setState({
            isLoaded: false,
            image: void 0
        });
    }
    didMount() {
        const e58 = this.props, { lazy: t37 = true , placeholder: n , children: r , key: s , ref: o  } = e58, i2 = b(e58, [
            "lazy",
            "placeholder",
            "children",
            "key",
            "ref"
        ]);
        if ("boolean" === typeof t37 && false === t37) return;
        const a2 = new IntersectionObserver((e59, t38)=>{
            e59.forEach((e60)=>{
                if (e60.isIntersecting) {
                    t38.disconnect();
                    this.state.image = (0, v.h)("img", Object.assign({
                    }, i2));
                    if (this.state.image.complete) {
                        this.state.isLoaded = true;
                        this.update();
                    } else this.state.image.onload = ()=>{
                        this.state.isLoaded = true;
                        this.update();
                    };
                }
            });
        }, {
            threshold: [
                0,
                1
            ]
        });
        a2.observe(this.elements[0]);
    }
    render() {
        const e61 = this.props, { src: t39 , placeholder: n26 , children: r , lazy: s7 = true , key: o , ref: i  } = e61, a3 = b(e61, [
            "src",
            "placeholder",
            "children",
            "lazy",
            "key",
            "ref"
        ]);
        if ("boolean" === typeof s7 && false === s7) {
            this.state.image = (0, v.h)("img", Object.assign({
                src: t39
            }, a3));
            return this.state.image;
        }
        if (this.state.isLoaded) return this.state.image;
        if (n26 && "string" === typeof n26) return (0, v.h)("img", Object.assign({
            src: n26
        }, a3));
        if (n26 && "function" === typeof n26) return n26();
        {
            const e62 = {
            };
            a3.width && (e62.width = `${a3.width}px`);
            a3.height && (e62.height = `${a3.height}px`);
            const { width: t , height: n  } = a3, r16 = b(a3, [
                "width",
                "height"
            ]);
            return (0, v.h)("div", Object.assign({
                style: e62
            }, r16));
        }
    }
}
g.Img = Img$1;
var _ = {
};
Object.defineProperty(_, "__esModule", {
    value: true
});
_.Fragment = void 0;
const Fragment$1 = (e63)=>e63.children
;
_.Fragment = Fragment$1;
var S = {
};
var O = S && S.__rest || function(e64, t40) {
    var n27 = {
    };
    for(var r17 in e64)Object.prototype.hasOwnProperty.call(e64, r17) && t40.indexOf(r17) < 0 && (n27[r17] = e64[r17]);
    if (null != e64 && "function" === typeof Object.getOwnPropertySymbols) {
        var s8 = 0;
        for(r17 = Object.getOwnPropertySymbols(e64); s8 < r17.length; s8++)t40.indexOf(r17[s8]) < 0 && Object.prototype.propertyIsEnumerable.call(e64, r17[s8]) && (n27[r17[s8]] = e64[r17[s8]]);
    }
    return n27;
};
Object.defineProperty(S, "__esModule", {
    value: true
});
S.Link = void 0;
const j = l;
const w = p;
const C = i;
const x = _;
class Link$2 extends j.Component {
    prefetchOnHover() {
        this.elements[0].addEventListener("mouseover", ()=>this.addPrefetch()
        , {
            once: true
        });
    }
    prefetchOnVisible() {
        const e65 = new IntersectionObserver((e66, t41)=>{
            e66.forEach((e67)=>{
                if (e67.isIntersecting) {
                    t41.disconnect();
                    this.addPrefetch();
                }
            });
        }, {
            threshold: [
                0,
                1
            ]
        });
        e65.observe(this.elements[0]);
    }
    addPrefetch() {
        let e68 = false;
        const t42 = document.getElementsByTagName("link");
        for(let n28 = 0; n28 < t42.length; n28++)"prefetch" === t42[n28].getAttribute("rel") && t42[n28].getAttribute("href") === this.props.href && (e68 = true);
        if (!e68) {
            const e69 = (0, C.h)("link", {
                rel: "prefetch",
                href: this.props.href,
                as: "document"
            });
            document.head.appendChild(e69);
        }
    }
    didMount() {
        const { href: e70 , prefetch: t43 , delay: n29 = 0 , back: r18 = false  } = this.props;
        r18 && this.elements[0].addEventListener("click", (e71)=>{
            e71.preventDefault();
            const t44 = e71.target;
            t44.href === document.referrer ? window.history.back() : window.location.href = t44.href;
        });
        n29 > 0 && this.elements[0].addEventListener("click", (t45)=>{
            t45.preventDefault();
            setTimeout(()=>window.location.href = e70
            , n29);
        });
        t43 && ("hover" === t43 ? this.prefetchOnHover() : "visible" === t43 ? this.prefetchOnVisible() : this.addPrefetch());
    }
    render() {
        const e72 = this.props, { children: t46 , prefetch: n30 , back: r , ref: s  } = e72, o7 = O(e72, [
            "children",
            "prefetch",
            "back",
            "ref"
        ]);
        this.props.href || console.warn('Please add "href" to <Link>');
        1 !== t46.length && console.warn("Please add ONE child to <Link> (<Link>child</Link>)");
        const i3 = (0, C.h)("a", Object.assign({
        }, o7), ...t46);
        if (true !== n30 || "undefined" !== typeof window && window.document) return i3;
        {
            const e73 = (0, C.h)("link", {
                rel: "prefetch",
                href: this.props.href,
                as: "document"
            });
            const t47 = (0, C.h)(w.Helmet, null, e73);
            return (0, C.h)(x.Fragment, null, [
                t47,
                i3
            ]);
        }
    }
}
S.Link = Link$2;
var P = {
};
var E = P && P.__rest || function(e74, t48) {
    var n31 = {
    };
    for(var r19 in e74)Object.prototype.hasOwnProperty.call(e74, r19) && t48.indexOf(r19) < 0 && (n31[r19] = e74[r19]);
    if (null != e74 && "function" === typeof Object.getOwnPropertySymbols) {
        var s9 = 0;
        for(r19 = Object.getOwnPropertySymbols(e74); s9 < r19.length; s9++)t48.indexOf(r19[s9]) < 0 && Object.prototype.propertyIsEnumerable.call(e74, r19[s9]) && (n31[r19[s9]] = e74[r19[s9]]);
    }
    return n31;
};
Object.defineProperty(P, "__esModule", {
    value: true
});
P.Listener = P.Link = P.to = P.Route = P.Routes = P.Switch = P.matchPath = void 0;
const M = l;
const R = i;
const L = [];
const register = (e75)=>L.push(e75)
;
const unregister = (e76)=>L.splice(L.indexOf(e76), 1)
;
const historyPush = (e77)=>{
    window.history.pushState({
    }, "", e77);
    L.forEach((e78)=>e78.handleChanges()
    );
    window.dispatchEvent(new Event("pushstate"));
};
const historyReplace = (e79)=>{
    window.history.replaceState({
    }, "", e79);
    L.forEach((e80)=>e80.handleChanges()
    );
    window.dispatchEvent(new Event("replacestate"));
};
const matchPath = (e81, t49)=>{
    const { exact: n33 = false , regex: r20  } = t49;
    let { path: s10  } = t49;
    if (!s10) return {
        path: null,
        url: e81,
        isExact: true
    };
    let o8;
    let i4 = {
    };
    if (s10.includes("/:")) {
        const t50 = s10.split("/");
        const n32 = e81.split("/");
        t50.forEach((e82, s)=>{
            if (/^:/.test(e82)) {
                const o9 = e82.slice(1);
                const a5 = n32[s];
                if (r20 && r20[o9]) {
                    const e83 = r20[o9].test(a5);
                    if (!e83) return null;
                }
                i4 = Object.assign(Object.assign({
                }, i4), {
                    [o9]: a5
                });
                t50[s] = n32[s];
            }
        });
        s10 = t50.join("/");
    }
    "*" === s10 && (o8 = [
        e81
    ]);
    o8 || (o8 = new RegExp(`^${s10}`).exec(e81));
    if (!o8) return null;
    const a4 = o8[0];
    const c2 = e81 === a4;
    return n33 && !c2 ? null : {
        path: s10,
        url: a4,
        isExact: c2,
        params: i4
    };
};
P.matchPath = matchPath;
class Switch extends M.Component {
    constructor(){
        super(...arguments);
        this.index = 0;
        this.path = "";
        this.match = {
            index: -1,
            path: ""
        };
    }
    didMount() {
        window.addEventListener("popstate", this.handleChanges.bind(this));
        register(this);
    }
    didUnmount() {
        window.removeEventListener("popstate", this.handleChanges.bind(this));
        unregister(this);
    }
    handleChanges() {
        this.findChild();
        this.shouldUpdate() && this.update();
    }
    findChild() {
        this.match = {
            index: -1,
            path: ""
        };
        for(let e84 = 0; e84 < this.props.children.length; e84++){
            const t51 = this.props.children[e84];
            const { path: n34 , exact: r21 , regex: s11  } = t51.props;
            const o10 = (0, P.matchPath)((0, R.isSSR)() ? _nano.location.pathname : window.location.pathname, {
                path: n34,
                exact: r21,
                regex: s11
            });
            if (o10) {
                this.match.index = e84;
                this.match.path = n34;
                return;
            }
        }
    }
    shouldUpdate() {
        return this.path !== this.match.path || this.index !== this.match.index;
    }
    render() {
        this.findChild();
        const e85 = this.props.children[this.match.index];
        if (-1 === this.match.index) {
            this.path = "";
            this.index = 0;
        }
        if (e85) {
            const { path: t52  } = e85.props;
            this.path = t52;
            this.index = this.match.index;
            const n35 = (0, R._render)(e85);
            return (0, R.h)("div", {
            }, (0, R._render)(n35));
        }
        return this.props.fallback ? (0, R.h)("div", {
        }, (0, R._render)(this.props.fallback)) : (0, R.h)("div", {
        }, "not found");
    }
}
P.Switch = Switch;
class Routes extends Switch {
}
P.Routes = Routes;
const Route = ({ path: e86 , regex: t53 , children: n36  })=>{
    n36.forEach((n37)=>{
        n37.props && (n37.props = Object.assign(Object.assign({
        }, n37.props), {
            route: {
                path: e86,
                regex: t53
            }
        }));
    });
    return n36;
};
P.Route = Route;
const to = (e87, t54 = false)=>{
    t54 ? historyReplace(e87) : historyPush(e87);
};
P.to = to;
const Link$1 = (e88)=>{
    var { to: t55 , replace: n38 , children: r22  } = e88, s12 = E(e88, [
        "to",
        "replace",
        "children"
    ]);
    const handleClick = (e89)=>{
        e89.preventDefault();
        n38 ? historyReplace(t55) : historyPush(t55);
    };
    return (0, R.h)("a", Object.assign({
        href: t55,
        onClick: (e90)=>handleClick(e90)
    }, s12), r22);
};
P.Link = Link$1;
class CListener {
    constructor(){
        this._listeners = new Map;
        if ((0, R.isSSR)()) return;
        this._route = window.location.pathname;
        const event = ()=>{
            const e91 = window.location.pathname;
            this._listeners.forEach((t56)=>{
                t56(e91, this._route);
            });
            this._route = e91;
        };
        window.addEventListener("pushstate", event);
        window.addEventListener("replacestate", event);
    }
    use() {
        const e92 = Math.random().toString(36).substring(2);
        return {
            subscribe: (t57)=>{
                this._listeners.set(e92, t57);
            },
            cancel: ()=>{
                this._listeners.has(e92) && this._listeners.delete(e92);
            }
        };
    }
}
let k;
const Listener = ()=>{
    k || (k = new CListener);
    return k;
};
P.Listener = Listener;
var T = {
};
var N = T && T.__awaiter || function(e93, t58, n39, r23) {
    function adopt(e94) {
        return e94 instanceof n39 ? e94 : new n39(function(t59) {
            t59(e94);
        });
    }
    return new (n39 || (n39 = Promise))(function(n40, s13) {
        function fulfilled(e95) {
            try {
                step(r23.next(e95));
            } catch (e96) {
                s13(e96);
            }
        }
        function rejected(e97) {
            try {
                step(r23.throw(e97));
            } catch (e98) {
                s13(e98);
            }
        }
        function step(e99) {
            e99.done ? n40(e99.value) : adopt(e99.value).then(fulfilled, rejected);
        }
        step((r23 = r23.apply(e93, t58 || [])).next());
    });
};
var I = T && T.__rest || function(e100, t60) {
    var n41 = {
    };
    for(var r24 in e100)Object.prototype.hasOwnProperty.call(e100, r24) && t60.indexOf(r24) < 0 && (n41[r24] = e100[r24]);
    if (null != e100 && "function" === typeof Object.getOwnPropertySymbols) {
        var s14 = 0;
        for(r24 = Object.getOwnPropertySymbols(e100); s14 < r24.length; s14++)t60.indexOf(r24[s14]) < 0 && Object.prototype.propertyIsEnumerable.call(e100, r24[s14]) && (n41[r24[s14]] = e100[r24[s14]]);
    }
    return n41;
};
Object.defineProperty(T, "__esModule", {
    value: true
});
T.Suspense = void 0;
const H = l;
const $ = i;
class Suspense$1 extends H.Component {
    constructor(e101){
        super(e101);
        this.ready = false;
        const t61 = this.props, { children: n , fallback: r , cache: s = false  } = t61, o11 = I(t61, [
            "children",
            "fallback",
            "cache"
        ]);
        const i5 = JSON.stringify(o11, function(e, t62) {
            return "function" === typeof t62 ? `${t62}` : t62;
        });
        this.id = (0, $.strToHash)(JSON.stringify(i5));
    }
    didMount() {
        return N(this, void 0, void 0, function*() {
            const e102 = this.props, { children: t , fallback: n , cache: r25 = false  } = e102, s15 = I(e102, [
                "children",
                "fallback",
                "cache"
            ]);
            r25 && (this.initState = {
            });
            if (this.loadFromCache(r25)) return;
            const o12 = Object.values(s15).map((e103)=>e103()
            );
            const i6 = yield Promise.all(o12);
            const a6 = this.prepareData(s15, i6, r25);
            this.addDataToChildren(a6);
            this.ready = true;
            this.update();
        });
    }
    ssr() {
        const e104 = this.props, { children: t , fallback: n , cache: r = false  } = e104, s16 = I(e104, [
            "children",
            "fallback",
            "cache"
        ]);
        const o13 = Object.values(s16).map((e105)=>e105()
        );
        const i7 = this.prepareData(s16, o13, false);
        this.addDataToChildren(i7);
    }
    loadFromCache(e106) {
        const t63 = this.state && e106 && Object.keys(this.state).length > 0;
        if (t63) {
            this.addDataToChildren(this.state);
            this.ready = true;
        }
        return t63;
    }
    prepareData(e107, t64, n42) {
        const r26 = Object.keys(e107).reduce((e108, r27, s)=>{
            n42 && (this.state = Object.assign(Object.assign({
            }, this.state), {
                [r27]: t64[s]
            }));
            return Object.assign(Object.assign({
            }, e108), {
                [r27]: t64[s]
            });
        }, {
        });
        return r26;
    }
    addDataToChildren(e109) {
        this.props.children.forEach((t65)=>{
            t65.props && (t65.props = Object.assign(Object.assign({
            }, t65.props), e109));
        });
    }
    render() {
        if ((0, $.isSSR)()) {
            this.ssr();
            return this.props.children;
        }
        {
            const { cache: e110 = false  } = this.props;
            this.loadFromCache(e110);
            return this.ready ? this.props.children : this.props.fallback;
        }
    }
}
T.Suspense = Suspense$1;
var A = {
};
Object.defineProperty(A, "__esModule", {
    value: true
});
A.Visible = void 0;
const V = i;
const D = l;
class Visible$1 extends D.Component {
    constructor(){
        super(...arguments);
        this.isVisible = false;
    }
    didMount() {
        const e111 = new IntersectionObserver((e112, t66)=>{
            e112.forEach((e113)=>{
                if (e113.isIntersecting) {
                    t66.disconnect();
                    this.isVisible = true;
                    this.update();
                }
            });
        }, {
            threshold: [
                0,
                1
            ]
        });
        e111.observe(this.elements[0]);
    }
    render() {
        if (this.isVisible) {
            this.props.onVisible && this.props.onVisible();
            return (0, V.render)(this.props.component || this.props.children[0]);
        }
        return (0, V.h)("div", {
            "data-visible": false,
            visibility: "hidden"
        });
    }
}
A.Visible = Visible$1;
var z = {
};
var U = z && z.__createBinding || (Object.create ? function(e114, t67, n43, r28) {
    void 0 === r28 && (r28 = n43);
    Object.defineProperty(e114, r28, {
        enumerable: true,
        get: function() {
            return t67[n43];
        }
    });
} : function(e115, t68, n44, r29) {
    void 0 === r29 && (r29 = n44);
    e115[r29] = t68[n44];
});
var F = z && z.__setModuleDefault || (Object.create ? function(e116, t69) {
    Object.defineProperty(e116, "default", {
        enumerable: true,
        value: t69
    });
} : function(e117, t70) {
    e117.default = t70;
});
var B = z && z.__importStar || function(e118) {
    if (e118 && e118.__esModule) return e118;
    var t71 = {
    };
    if (null != e118) for(var n45 in e118)"default" !== n45 && Object.prototype.hasOwnProperty.call(e118, n45) && U(t71, e118, n45);
    F(t71, e118);
    return t71;
};
Object.defineProperty(z, "__esModule", {
    value: true
});
z.Visible = z.Suspense = z.Router = z.Link = z.Img = z.Helmet = void 0;
var J = p;
Object.defineProperty(z, "Helmet", {
    enumerable: true,
    get: function() {
        return J.Helmet;
    }
});
var Z = g;
Object.defineProperty(z, "Img", {
    enumerable: true,
    get: function() {
        return Z.Img;
    }
});
var q = S;
Object.defineProperty(z, "Link", {
    enumerable: true,
    get: function() {
        return q.Link;
    }
});
z.Router = B(P);
var W = T;
Object.defineProperty(z, "Suspense", {
    enumerable: true,
    get: function() {
        return W.Suspense;
    }
});
var Y = A;
Object.defineProperty(z, "Visible", {
    enumerable: true,
    get: function() {
        return Y.Visible;
    }
});
var X = {
};
Object.defineProperty(X, "__esModule", {
    value: true
});
X.clearState = X.renderSSR = X.initSSR = void 0;
const G = i;
const K = s;
const Q = c;
const ee = n;
const initGlobalVar = ()=>{
    const e119 = true === (0, ee.detectSSR)() || void 0;
    const t72 = {
        pathname: "/"
    };
    const n46 = e119 ? (0, K.documentSSR)() : window.document;
    globalThis._nano = {
        isSSR: e119,
        location: t72,
        document: n46,
        customElements: new Map
    };
};
initGlobalVar();
const initSSR = (e120 = "/")=>{
    _nano.location = {
        pathname: e120
    };
    globalThis.document = _nano.document = (0, G.isSSR)() ? (0, K.documentSSR)() : window.document;
};
X.initSSR = initSSR;
const renderSSR$1 = (e121, t73 = {
})=>{
    const { pathname: n47 , clearState: r30 = true  } = t73;
    (0, X.initSSR)(n47);
    r30 && Q._state.clear();
    return (0, G.render)(e121, null, true).join("");
};
X.renderSSR = renderSSR$1;
const clearState = ()=>{
    Q._state.clear();
};
X.clearState = clearState;
var te = {
};
Object.defineProperty(te, "__esModule", {
    value: true
});
te.MINI = void 0;
te.MINI = false;
var ne = {
};
Object.defineProperty(ne, "__esModule", {
    value: true
});
ne.build = ne.evaluate = ne.treeify = void 0;
const re = te;
const se = 0;
const oe = 1;
const ie = 2;
const ae = 3;
const ce = 4;
const le = 5;
const ue = 6;
const de = 0;
const treeify = (e122, t74)=>{
    const _treeify = (e123)=>{
        let n49 = "";
        let r31 = null;
        const s17 = [];
        const o14 = [];
        for(let i8 = 1; i8 < e123.length; i8++){
            const a7 = e123[i8++];
            const c3 = e123[i8] ? t74[e123[i8++] - 1] : e123[++i8];
            if (a7 === 3) n49 = c3;
            else if (a7 === 4) {
                s17.push(c3);
                r31 = null;
            } else if (a7 === 5) {
                if (!r31) {
                    r31 = Object.create(null);
                    s17.push(r31);
                }
                r31[e123[++i8]] = [
                    c3
                ];
            } else a7 === 6 ? r31[e123[++i8]].push(c3) : a7 === 2 ? o14.push(_treeify(c3)) : a7 === 0 && o14.push(c3);
        }
        return {
            tag: n49,
            props: s17,
            children: o14
        };
    };
    const { children: n48  } = _treeify(e122);
    return n48.length > 1 ? n48 : n48[0];
};
ne.treeify = treeify;
const evaluate = (e124, t75, n50, r32)=>{
    let s18;
    t75[0] = 0;
    for(let o15 = 1; o15 < t75.length; o15++){
        const i9 = t75[o15++];
        const a8 = t75[o15] ? (t75[0] |= i9 ? 1 : 2, n50[t75[o15++]]) : t75[++o15];
        if (i9 === 3) r32[0] = a8;
        else if (i9 === 4) r32[1] = Object.assign(r32[1] || {
        }, a8);
        else if (i9 === 5) (r32[1] = r32[1] || {
        })[t75[++o15]] = a8;
        else if (i9 === 6) r32[1][t75[++o15]] += `${a8}`;
        else if (i9) {
            s18 = e124.apply(a8, (0, ne.evaluate)(e124, a8, n50, [
                "",
                null
            ]));
            r32.push(s18);
            if (a8[0]) t75[0] |= 2;
            else {
                t75[o15 - 2] = de;
                t75[o15] = s18;
            }
        } else r32.push(a8);
    }
    return r32;
};
ne.evaluate = evaluate;
const build = function(e125, ...t77) {
    const n51 = [
        e125,
        ...t77
    ];
    const r33 = this;
    let s19 = 1;
    let o16 = "";
    let i10 = "";
    let a9 = [
        0
    ];
    let c4;
    let l2;
    const commit = (e126)=>{
        if (s19 === 1 && (e126 || (o16 = o16.replace(/^\s*\n\s*|\s*\n\s*$/g, "")))) re.MINI ? a9.push(e126 ? n51[e126] : o16) : a9.push(0, e126, o16);
        else if (s19 === 3 && (e126 || o16)) {
            re.MINI ? a9[1] = e126 ? n51[e126] : o16 : a9.push(3, e126, o16);
            s19 = ie;
        } else if (s19 === 2 && "..." === o16 && e126) re.MINI ? a9[2] = Object.assign(a9[2] || {
        }, n51[e126]) : a9.push(4, e126, 0);
        else if (s19 === 2 && o16 && !e126) re.MINI ? (a9[2] = a9[2] || {
        })[o16] = true : a9.push(5, 0, true, o16);
        else if (s19 >= 5) if (re.MINI) if (s19 === 5) {
            (a9[2] = a9[2] || {
            })[l2] = e126 ? o16 ? o16 + n51[e126] : n51[e126] : o16;
            s19 = ue;
        } else (e126 || o16) && (a9[2][l2] += e126 ? o16 + n51[e126] : o16);
        else {
            if (o16 || !e126 && s19 === 5) {
                a9.push(s19, 0, o16, l2);
                s19 = ue;
            }
            if (e126) {
                a9.push(s19, e126, 0, l2);
                s19 = ue;
            }
        }
        o16 = "";
    };
    for(let t76 = 0; t76 < e125.length; t76++){
        if (t76) {
            s19 === 1 && commit();
            commit(t76);
        }
        for(let n52 = 0; n52 < e125[t76].length; n52++){
            c4 = e125[t76][n52];
            if (s19 === 1) if ("<" === c4) {
                commit();
                a9 = re.MINI ? [
                    a9,
                    "",
                    null
                ] : [
                    a9
                ];
                s19 = ae;
            } else o16 += c4;
            else if (s19 === 4) if ("--" === o16 && ">" === c4) {
                s19 = oe;
                o16 = "";
            } else o16 = c4 + o16[0];
            else if (i10) c4 === i10 ? i10 = "" : o16 += c4;
            else if ('"' === c4 || "'" === c4) i10 = c4;
            else if (">" === c4) {
                commit();
                s19 = oe;
            } else if (s19) if ("=" === c4) {
                s19 = le;
                l2 = o16;
                o16 = "";
            } else if ("/" === c4 && (s19 < 5 || ">" === e125[t76][n52 + 1])) {
                commit();
                s19 === 3 && (a9 = a9[0]);
                s19 = a9;
                re.MINI ? (a9 = a9[0]).push(r33(...s19.slice(1))) : (a9 = a9[0]).push(2, 0, s19);
                s19 = se;
            } else if (" " === c4 || "\t" === c4 || "\n" === c4 || "\r" === c4) {
                commit();
                s19 = ie;
            } else o16 += c4;
            else ;
            if (s19 === 3 && "!--" === o16) {
                s19 = ce;
                a9 = a9[0];
            }
        }
    }
    commit();
    return re.MINI ? a9.length > 2 ? a9.slice(1) : a9[1] : a9;
};
ne.build = build;
var be = {
};
Object.defineProperty(be, "__esModule", {
    value: true
});
const ye = te;
const ve = ne;
const _e = new Map;
const regular = function(e127) {
    let t78 = _e.get(this);
    if (!t78) {
        t78 = new Map;
        _e.set(this, t78);
    }
    t78 = (0, ve.evaluate)(this, t78.get(e127) || (t78.set(e127, t78 = (0, ve.build)(e127)), t78), arguments, []);
    return t78.length > 1 ? t78 : t78[0];
};
be.default = ye.MINI ? ve.build : regular;
var Se = {
};
var Oe = Se && Se.__importDefault || function(e128) {
    return e128 && e128.__esModule ? e128 : {
        default: e128
    };
};
Object.defineProperty(Se, "__esModule", {
    value: true
});
const je = Oe(be);
Se.default = je.default;
var we = {
};
var Ce = we && we.__importDefault || function(e129) {
    return e129 && e129.__esModule ? e129 : {
        default: e129
    };
};
Object.defineProperty(we, "__esModule", {
    value: true
});
we.jsx = void 0;
const xe = i;
const Pe = Ce(Se);
const Ee = Pe.default.bind(xe.h);
we.jsx = Ee;
var Me = {
};
Object.defineProperty(Me, "__esModule", {
    value: true
});
Me.hydrateLazy = void 0;
const Re = i;
const Le = A;
const hydrateLazy$1 = (e130, t79 = null, n53 = true)=>{
    const r34 = (0, Re.h)(Le.Visible, null, e130);
    return (0, Re.hydrate)(r34, t79, n53);
};
Me.hydrateLazy = hydrateLazy$1;
var ke = {
};
Object.defineProperty(ke, "__esModule", {
    value: true
});
ke.Store = void 0;
const Te = i;
class Store$1 {
    constructor(e131, t80 = "", n54 = "memory"){
        this._listeners = new Map;
        (0, Te.isSSR)() && (n54 = "memory");
        this._id = t80;
        this._storage = n54;
        this._state = this._prevState = e131;
        if ("memory" === n54 || !n54) return;
        const r35 = "local" === n54 ? localStorage : sessionStorage;
        const s20 = r35.getItem(this._id);
        s20 ? this._state = this._prevState = JSON.parse(s20) : r35.setItem(this._id, JSON.stringify(e131));
    }
    persist(e132) {
        if ("memory" === this._storage) return;
        const t81 = "local" === this._storage ? localStorage : sessionStorage;
        t81.setItem(this._id, JSON.stringify(e132));
    }
    clear() {
        this._state = this._prevState = void 0;
        "local" === this._storage ? localStorage.removeItem(this._id) : "session" === this._storage && sessionStorage.removeItem(this._id);
    }
    setState(e133) {
        this.state = e133;
    }
    set state(e134) {
        this._prevState = this._state;
        this._state = e134;
        this.persist(e134);
        this._listeners.forEach((e135)=>{
            e135(this._state, this._prevState);
        });
    }
    get state() {
        return this._state;
    }
    use() {
        const e136 = Math.random().toString(36).substring(2, 9);
        const t82 = this;
        return {
            get state () {
                return t82.state;
            },
            setState: (e137)=>{
                this.state = e137;
            },
            subscribe: (t83)=>{
                this._listeners.set(e136, t83);
            },
            cancel: ()=>{
                this._listeners.has(e136) && this._listeners.delete(e136);
            }
        };
    }
}
ke.Store = Store$1;
var Ne = {
};
Object.defineProperty(Ne, "__esModule", {
    value: true
});
Ne.useContext = Ne.createContext = void 0;
const createContext$1 = (e138)=>{
    let t84 = e138;
    return {
        Provider: (e139)=>{
            e139.value && (t84 = e139.value);
            return e139.children;
        },
        Consumer: (e140)=>({
                component: e140.children[0](t84),
                props: Object.assign(Object.assign({
                }, e140), {
                    context: t84
                })
            })
        ,
        get: ()=>t84
        ,
        set: (e141)=>t84 = e141
    };
};
Ne.createContext = createContext$1;
const useContext$1 = (e142)=>{
    const t85 = e142;
    if (t85 && "function" === typeof t85.get) return t85.get();
};
Ne.useContext = useContext$1;
var Ie = {
};
var He = Ie && Ie.__rest || function(e143, t86) {
    var n55 = {
    };
    for(var r36 in e143)Object.prototype.hasOwnProperty.call(e143, r36) && t86.indexOf(r36) < 0 && (n55[r36] = e143[r36]);
    if (null != e143 && "function" === typeof Object.getOwnPropertySymbols) {
        var s21 = 0;
        for(r36 = Object.getOwnPropertySymbols(e143); s21 < r36.length; s21++)t86.indexOf(r36[s21]) < 0 && Object.prototype.propertyIsEnumerable.call(e143, r36[s21]) && (n55[r36[s21]] = e143[r36[s21]]);
    }
    return n55;
};
Object.defineProperty(Ie, "__esModule", {
    value: true
});
Ie.withStyles = void 0;
const $e = i;
const Ae = l;
const Ve = _;
const De = p;
const withStyles$1 = (...e144)=>(t87)=>{
        class _class extends Ae.Component {
            render() {
                const n56 = this.props, { children: r37  } = n56, s22 = He(n56, [
                    "children"
                ]);
                const o17 = [];
                e144.forEach((e145)=>{
                    var t89;
                    if ("string" === typeof e145) o17.push((0, $e.h)(De.Helmet, null, (0, $e.h)("style", null, e145)));
                    else if ("function" === typeof e145) {
                        const t88 = e145();
                        "string" === typeof t88 && o17.push((0, $e.h)(De.Helmet, null, (0, $e.h)("style", null, t88)));
                    } else if ("object" === typeof e145) {
                        const n57 = null === (t89 = e145.toString) || void 0 === t89 ? void 0 : t89.call(e145);
                        "string" === typeof n57 && o17.push((0, $e.h)(De.Helmet, null, (0, $e.h)("style", null, n57)));
                    }
                });
                const i11 = r37 && r37.length > 0 ? (0, $e.h)(t87, Object.assign({
                }, s22), r37) : (0, $e.h)(t87, Object.assign({
                }, this.props));
                return (0, $e.h)(Ve.Fragment, null, ...o17, i11);
            }
        }
        return _class;
    }
;
Ie.withStyles = withStyles$1;
var ze = {
};
Object.defineProperty(ze, "__esModule", {
    value: true
});
ze.defineAsCustomElements = void 0;
const Ue = i;
const defineAsCustomElementsSSR = (e146, t90, n = [], r = {
})=>{
    /^[a-zA-Z0-9]+-[a-zA-Z0-9]+$/.test(t90) ? _nano.customElements.set(t90, e146) : console.log(`Error: WebComponent name "${t90}" is invalid.`);
};
const defineAsCustomElements$1 = function(e147, t91, n58, { mode: r38 = "closed" , delegatesFocus: s23 = false  } = {
}) {
    (0, Ue.isSSR)() ? defineAsCustomElementsSSR(e147, t91, n58) : customElements.define(t91, class extends HTMLElement {
        constructor(){
            super();
            const t92 = this.attachShadow({
                mode: r38,
                delegatesFocus: s23
            });
            let n59;
            const o18 = Array.from(this.children).map((e148)=>(0, Ue.render)(e148)
            );
            const i12 = (0, Ue.h)("div", null, (0, Ue._render)({
                component: e147,
                props: {
                    children: o18,
                    ref: (e149)=>n59 = e149
                }
            }));
            this.component = n59;
            this.isFunctionalComponent = !e147.isClass;
            this.functionalComponentsProps = {
            };
            t92.append(i12);
            this.isFunctionalComponent || (this.component.updatePropsValue = (e, t93)=>{
                this.component.props || (this.component.props = {
                });
                this.component.props[e] = t93;
                this.component[e] = t93;
            });
        }
        static get observedAttributes() {
            return n58;
        }
        removeChildren() {
            var e151;
            if (this.shadowRoot) {
                const t94 = Array.from(null === (e151 = this.shadowRoot) || void 0 === e151 ? void 0 : e151.children) || [];
                for (const e150 of t94)e150.remove();
            }
        }
        attributeChangedCallback(t95, n, r39) {
            if (this.isFunctionalComponent) {
                this.removeChildren();
                this.functionalComponentsProps[t95] = r39;
                const n60 = (0, Ue.h)("div", null, (0, Ue._render)({
                    component: e147,
                    props: Object.assign({
                        children: [],
                        ref: (e152)=>this.component = e152
                    }, this.functionalComponentsProps)
                }));
                this.shadowRoot.append(n60);
            } else {
                this.component.updatePropsValue(t95, r39);
                this.component.update();
            }
        }
    });
};
ze.defineAsCustomElements = defineAsCustomElements$1;
var Fe = {
};
var Be = Fe && Fe.__createBinding || (Object.create ? function(e153, t96, n61, r40) {
    void 0 === r40 && (r40 = n61);
    Object.defineProperty(e153, r40, {
        enumerable: true,
        get: function() {
            return t96[n61];
        }
    });
} : function(e154, t97, n62, r41) {
    void 0 === r41 && (r41 = n62);
    e154[r41] = t97[n62];
});
var Je = Fe && Fe.__exportStar || function(e155, t98) {
    for(var n63 in e155)"default" === n63 || Object.prototype.hasOwnProperty.call(t98, n63) || Be(t98, e155, n63);
};
Object.defineProperty(Fe, "__esModule", {
    value: true
});
Fe.VERSION = Fe.printVersion = Fe.defineAsCustomElements = Fe.withStyles = Fe.useContext = Fe.createContext = Fe.Store = Fe.Fragment = Fe.renderSSR = Fe.task = Fe.nodeToString = Fe.hydrateLazy = Fe.jsx = Fe.Component = Fe.tick = Fe.hydrate = Fe.render = Fe.h = void 0;
var Ze = i;
Object.defineProperty(Fe, "h", {
    enumerable: true,
    get: function() {
        return Ze.h;
    }
});
Object.defineProperty(Fe, "render", {
    enumerable: true,
    get: function() {
        return Ze.render;
    }
});
Object.defineProperty(Fe, "hydrate", {
    enumerable: true,
    get: function() {
        return Ze.hydrate;
    }
});
Object.defineProperty(Fe, "tick", {
    enumerable: true,
    get: function() {
        return Ze.tick;
    }
});
var qe = l;
Object.defineProperty(Fe, "Component", {
    enumerable: true,
    get: function() {
        return qe.Component;
    }
});
Je(z, Fe);
const We = i;
const Ye = X;
Fe.default = {
    h: We.h,
    render: We.render,
    hydrate: We.hydrate,
    renderSSR: Ye.renderSSR
};
var Xe = we;
Object.defineProperty(Fe, "jsx", {
    enumerable: true,
    get: function() {
        return Xe.jsx;
    }
});
var Ge = Me;
Object.defineProperty(Fe, "hydrateLazy", {
    enumerable: true,
    get: function() {
        return Ge.hydrateLazy;
    }
});
var Ke = n;
Object.defineProperty(Fe, "nodeToString", {
    enumerable: true,
    get: function() {
        return Ke.nodeToString;
    }
});
Object.defineProperty(Fe, "task", {
    enumerable: true,
    get: function() {
        return Ke.task;
    }
});
var Qe = X;
Object.defineProperty(Fe, "renderSSR", {
    enumerable: true,
    get: function() {
        return Qe.renderSSR;
    }
});
var et = _;
Object.defineProperty(Fe, "Fragment", {
    enumerable: true,
    get: function() {
        return et.Fragment;
    }
});
var tt = ke;
Object.defineProperty(Fe, "Store", {
    enumerable: true,
    get: function() {
        return tt.Store;
    }
});
var nt = Ne;
Object.defineProperty(Fe, "createContext", {
    enumerable: true,
    get: function() {
        return nt.createContext;
    }
});
Object.defineProperty(Fe, "useContext", {
    enumerable: true,
    get: function() {
        return nt.useContext;
    }
});
var rt = Ie;
Object.defineProperty(Fe, "withStyles", {
    enumerable: true,
    get: function() {
        return rt.withStyles;
    }
});
var st = ze;
Object.defineProperty(Fe, "defineAsCustomElements", {
    enumerable: true,
    get: function() {
        return st.defineAsCustomElements;
    }
});
var ot = n;
Object.defineProperty(Fe, "printVersion", {
    enumerable: true,
    get: function() {
        return ot.printVersion;
    }
});
var it = t;
Object.defineProperty(Fe, "VERSION", {
    enumerable: true,
    get: function() {
        return it.VERSION;
    }
});
const at = Fe.__esModule, ct = Fe.VERSION, lt = Fe.printVersion, ut = Fe.defineAsCustomElements, dt = Fe.withStyles, ht = Fe.useContext, pt = Fe.createContext, ft = Fe.Store, mt = Fe.Fragment, gt = Fe.renderSSR, bt = Fe.task, yt = Fe.nodeToString, vt = Fe.hydrateLazy, _t = Fe.jsx, St = Fe.Component, Ot = Fe.tick, jt = Fe.hydrate, wt = Fe.render, Ct = Fe.h, xt = Fe.Visible, Pt = Fe.Suspense, Et = Fe.Router, Mt = Fe.Link, Rt = Fe.Img, Lt = Fe.Helmet;
function Logo(param) {
    var name = param.name, version = param.version;
    return Ct("jspm-package-logo", null, Ct("div", {
        class: "scene"
    }, Ct("div", {
        class: "cube show-top"
    }, Ct("div", {
        class: "cube__face cube__face--front"
    }, name), Ct("div", {
        class: "cube__face cube__face--back"
    }), Ct("div", {
        class: "cube__face cube__face--right"
    }, version), Ct("div", {
        class: "cube__face cube__face--left"
    }), Ct("div", {
        class: "cube__face cube__face--top"
    }, Ct("a", {
        href: "/"
    }, "JSPM")), Ct("div", {
        class: "cube__face cube__face--bottom"
    }))));
}
function PackageHeader(param) {
    var homepage = param.homepage, name = param.name, version = param.version, description = param.description;
    return Ct("div", null, Ct("div", {
        class: "package-header"
    }, Ct(Logo, {
        name: name,
        version: version
    }), Ct("div", {
        class: "package-info"
    }, Ct("jspm-package-name", null, Ct("h1", null, Ct("a", {
        href: homepage
    }, name))), Ct("jspm-package-version", null, version), Ct("jspm-package-description", null, description))), Ct(Lt, null, Ct("style", {
        "data-page": "package-header"
    }, "\n        .package-header {\n          display: flex;\n          font-family: \"Major Mono Display\", monospace;\n          flex-wrap: wrap;\n          justify-content: center;\n          align-items: center;\n        }\n        @media(max-width: 479px) {\n          .package-info {\n            text-align: center;\n          }\n        }\n        ")));
}
function Readme() {
    return Ct("jspm-package-readme", null, Ct("package-readme-placeholder", null));
}
function Seperator() {
    return Ct("div", null, Ct("div", {
        class: "seperator-seperator"
    }, Ct("div", {
        class: "seperator-container"
    }), Ct("div", {
        class: "seperator-container1"
    }), Ct("div", {
        class: "seperator-container2"
    }), Ct("div", {
        class: "seperator-container3"
    })), Ct(Lt, null, Ct("style", {
        "data-page-name": "seperator"
    }, "\n        .seperator-seperator {\n            flex: 0 0 auto;\n            width: 100%;\n            height: auto;\n            display: flex;\n            margin-top: var(--dl-space-space-unit);\n            align-items: center;\n            margin-bottom: var(--dl-space-space-unit);\n          }\n          .seperator-container {\n            flex: 0 0 auto;\n            width: 50px;\n            height: 8px;\n            display: flex;\n            align-items: flex-start;\n            background-color: var(--dl-color-jspm-500);\n            border-top-left-radius: var(--dl-radius-radius-radius8);\n            border-bottom-left-radius: var(--dl-radius-radius-radius8);\n          }\n          .seperator-container1 {\n            flex: 0 0 auto;\n            width: 50px;\n            height: 8px;\n            display: flex;\n            align-items: flex-start;\n            background-color: var(--dl-color-jspm-400);\n          }\n          .seperator-container2 {\n            flex: 0 0 auto;\n            width: 50px;\n            height: 8px;\n            display: flex;\n            align-items: flex-start;\n            background-color: var(--dl-color-jspm-300);\n          }\n          .seperator-container3 {\n            flex: 0 0 auto;\n            width: 50px;\n            height: 8px;\n            display: flex;\n            align-items: flex-start;\n            background-color: var(--dl-color-jspm-200);\n            border-top-right-radius: var(--dl-radius-radius-radius8);\n            border-bottom-right-radius: var(--dl-radius-radius-radius8);\n          }\n        ")));
}
function Aside(param) {
    var license = param.license, files = param.files, name = param.name, version = param.version;
    return Ct("jspm-package-aside", null, Ct("aside", null, Ct("div", null, Ct("h3", null, "License"), Ct("jspm-package-license", null, license), Ct(Seperator, null)), Ct("ul", {
        class: "package-files"
    }, files === null || files === void 0 ? void 0 : files.map(function(file) {
        return Ct("li", null, Ct("a", {
            target: "_blank",
            href: "https://ga.jspm.io/npm:".concat(name, "@").concat(version, "/").concat(file),
            class: "package-file"
        }, file));
    }))), Ct(Lt, null, Ct("style", {
        "data-page": "package-files"
    }, "\n          .package-file {\n            display: block;\n            line-height: 1.3;\n          }\n          .package-files {\n            list-style: none;\n            padding-left: 0px;\n            height: 500px;\n            overflow: scroll;\n          }\n          .package-files li {\n            line-height: 1.3;\n          }\n        ")));
}
function Header() {
    return Ct("div", null, Ct("div", {
        class: "header-header",
        id: "app-header"
    }, Ct("div", {
        class: "header-container"
    }, Ct("a", {
        href: "/",
        class: "header-logo"
    }), Ct("img", {
        alt: "image",
        src: "https://jspm-registry.teleporthq.app/playground_assets/jspm.png",
        class: "header-image"
    }), Ct("h1", {
        class: "jspmheaderlogo"
    }, Ct("span", null, "JSPM"))), Ct("div", {
        class: "header-search"
    }, Ct("input", {
        type: "text",
        autofocus: "true",
        placeholder: "Search for packages...",
        autocomplete: "on",
        class: "header-textinput search_input"
    }), Ct("button", {
        class: "search_button"
    }, Ct("span", null, "Search")))), Ct("div", {
        class: "header-container1"
    }, Ct("span", {
        class: "header-text1"
    }, Ct("span", null, "Generator")), Ct("span", {
        class: "header-text2"
    }, Ct("span", null, "Docs")), Ct("span", {
        class: "header-text3"
    }, Ct("span", null, "Faq")), Ct("img", {
        alt: "image",
        src: "https://jspm-registry.teleporthq.app/playground_assets/github.svg",
        class: "header-image1"
    })), Ct(Lt, null, Ct("style", {
        "data-page-name": "header"
    }, "\n          .search_button {\n              color: var(--dl-color-gray-black);\n              display: inline-block;\n              padding: 0.5rem 1rem;\n              border-color: var(--dl-color-gray-black);\n              border-width: 1px;\n              height: 40px;\n              display: flex;\n              align-items: center;\n              border-width: 0px;\n              padding-left: var(--dl-space-space-oneandhalfunits);\n              padding-right: var(--dl-space-space-oneandhalfunits);\n              background-color: var(--dl-color-primary-js-primary);\n              border-top-left-radius: none;\n              border-top-right-radius: var(--dl-radius-radius-radius8);\n              border-bottom-left-radius: none;\n              border-bottom-right-radius: var(--dl-radius-radius-radius8);\n          }\n            \n            .search_input {\n              color: var(--dl-color-gray-black);\n              cursor: auto;\n              padding: 0.5rem 1rem;\n              border-color: var(--dl-color-gray-black);\n              border-width: 1px;\n              background-color: var(--dl-color-gray-white);\n              height: 40px;\n              padding: var(--dl-space-space-halfunit);\n              max-width: 500px;\n              border-color: var(--dl-color-jspm-placeholder);\n              background-color: var(--dl-color-jspm-placeholder);\n              border-top-left-radius: var(--dl-radius-radius-radius8);\n              border-bottom-left-radius: var(--dl-radius-radius-radius8);\n            }\n\n          .header-header {\n              width: 100%;\n              display: flex;\n              margin-top: var(--dl-space-space-oneandhalfunits);\n              align-items: center;\n              margin-bottom: var(--dl-space-space-oneandhalfunits);\n              flex-direction: row;\n              justify-content: space-between;\n            }\n            .header-container {\n              display: flex;\n              align-items: center;\n              flex-direction: row;\n              justify-content: center;\n            }\n\n            .header-logo {\n              display: flex;\n              align-items: center;\n              margin-right: var(--dl-space-space-unit);\n              flex-direction: row;\n              justify-content: center;\n              text-decoration: none;\n              color: var(--dl-color-gray-black);\n            }\n\n            .header-logo:visited {\n              text-decoration: none;\n            }\n\n            .header-image {\n              width: 32px;\n              object-fit: cover;\n            }\n            .header-search {\n              display: flex;\n              align-items: center;\n              flex-direction: row;\n              justify-content: center;\n            }\n            .header-textinput {\n              width: 300px;\n            }\n            .header-container1 {\n              display: flex;\n              align-items: center;\n              flex-direction: row;\n              justify-content: center;\n            }\n            .header-text1 {\n              margin-left: var(--dl-space-space-unit);\n              margin-right: var(--dl-space-space-unit);\n            }\n            .header-text2 {\n              margin-left: var(--dl-space-space-unit);\n              margin-right: var(--dl-space-space-unit);\n            }\n            .header-text3 {\n              margin-left: var(--dl-space-space-unit);\n              margin-right: var(--dl-space-space-unit);\n            }\n            .header-image1 {\n              width: 35px;\n              object-fit: cover;\n            }\n            @media(max-width: 767px) {\n              .header-header {\n                flex-wrap: wrap;\n                flex-direction: column;\n              }\n              .header-container {\n                margin-bottom: var(--dl-space-space-unit);\n              }\n              .header-container1 {\n                margin-top: var(--dl-space-space-unit);\n              }\n              .header-container {\n                width: 100%;\n              }\n            }\n            @media(max-width: 479px) {\n              .header-container {\n                flex-wrap: wrap;\n              }\n              .header-logo {\n                margin-left: var(--dl-space-space-unit);\n                margin-right: var(--dl-space-space-unit);\n                margin-bottom: var(--dl-space-space-unit);\n              }\n              .header-search {\n                margin-bottom: var(--dl-space-space-unit);\n              }\n              .header-textinput {\n                width: auto;\n              }\n            }\n          ")));
}
function Footer() {
    return Ct("div", null, Ct("div", {
        class: "footer-container"
    }, Ct("footer", {
        class: "footer-footer"
    }, Ct("div", {
        class: "footer-container1"
    }, Ct("img", {
        alt: "image",
        src: "https://jspm-registry.teleporthq.app/playground_assets/jspm.png",
        class: "footer-image"
    }), Ct("div", {
        class: "footer-container2"
    }, Ct("div", {
        class: "footer-product-container"
    }, Ct("span", {
        class: "footer-text"
    }, "Docs"), Ct("span", {
        class: "footer-text01"
    }, "Get Started"), Ct("span", {
        class: "footer-text02"
    }, "Workspace"), Ct("span", {
        class: "footer-text03"
    }, ".npmrc")), Ct("div", {
        class: "footer-company-container"
    }, Ct("span", {
        class: "footer-text04"
    }, "Community"), Ct("span", {
        class: "footer-text05"
    }, "Getting Started"), Ct("span", {
        class: "footer-text06"
    }, "Workspace"), Ct("span", {
        class: "footer-text07"
    }, ".npmrc")), Ct("div", {
        class: "footer-company-container1"
    }, Ct("span", {
        class: "footer-text08"
    }, "Contributing"), Ct("span", {
        class: "footer-text09"
    }, "Getting Started"), Ct("span", {
        class: "footer-text10"
    }, "Workspace"), Ct("span", {
        class: "footer-text11"
    }, ".npmrc")))), Ct("div", {
        class: "footer-separator"
    }), Ct("div", {
        class: "footer-copyright"
    }, Ct("span", {
        class: "footer-text12"
    }, Ct("span", null, "Copyright \xa9 2015-2021")), Ct("div", {
        class: "footer-socials"
    }, Ct("span", {
        class: "footer-text14"
    }, "Follow Us"), Ct("div", {
        class: "footer-icon-group"
    }, Ct("img", {
        alt: "image",
        src: "https://jspm-registry.teleporthq.app/playground_assets/github.svg",
        class: "footer-image1"
    }), Ct("svg", {
        viewBox: "0 0 950.8571428571428 1024",
        class: "footer-icon"
    }, Ct("path", {
        d: "M925.714 233.143c-25.143 36.571-56.571 69.143-92.571 95.429 0.571 8 0.571 16 0.571 24 0 244-185.714 525.143-525.143 525.143-104.571 0-201.714-30.286-283.429-82.857 14.857 1.714 29.143 2.286 44.571 2.286 86.286 0 165.714-29.143 229.143-78.857-81.143-1.714-149.143-54.857-172.571-128 11.429 1.714 22.857 2.857 34.857 2.857 16.571 0 33.143-2.286 48.571-6.286-84.571-17.143-148-91.429-148-181.143v-2.286c24.571 13.714 53.143 22.286 83.429 23.429-49.714-33.143-82.286-89.714-82.286-153.714 0-34.286 9.143-65.714 25.143-93.143 90.857 112 227.429 185.143 380.571 193.143-2.857-13.714-4.571-28-4.571-42.286 0-101.714 82.286-184.571 184.571-184.571 53.143 0 101.143 22.286 134.857 58.286 41.714-8 81.714-23.429 117.143-44.571-13.714 42.857-42.857 78.857-81.143 101.714 37.143-4 73.143-14.286 106.286-28.571z"
    }))))))), Ct(Lt, null, Ct("style", {
        "data-page-name": "footer"
    }, "\n        .footer-container {\n            width: 100%;\n            display: flex;\n            position: relative;\n            align-items: flex-start;\n            flex-direction: column;\n            background-color: var(--dl-color-jspm-footer);\n          }\n          .footer-footer {\n            width: 100%;\n            display: flex;\n            max-width: var(--dl-size-size-maxwidth);\n            align-items: center;\n            padding-top: var(--dl-space-space-twounits);\n            padding-left: var(--dl-space-space-threeunits);\n            padding-right: var(--dl-space-space-threeunits);\n            flex-direction: column;\n            padding-bottom: var(--dl-space-space-twounits);\n            justify-content: space-between;\n            background-color: var(--dl-color-gray-900);\n            margin-top: var(--dl-space-space-unit);\n          }\n          .footer-container1 {\n            width: 100%;\n            display: flex;\n            align-items: flex-start;\n            flex-direction: row;\n            justify-content: center;\n          }\n          .footer-image {\n            width: 45px;\n            object-fit: cover;\n            margin-right: var(--dl-space-space-oneandhalfunits);\n          }\n          .footer-container2 {\n            display: flex;\n            align-items: flex-start;\n            margin-right: 5rem;\n            flex-direction: row;\n            justify-content: space-between;\n            flex-wrap: wrap;\n          }\n          .footer-product-container {\n            flex: 0 0 auto;\n            display: flex;\n            align-items: flex-start;\n            margin-right: 5rem;\n            flex-direction: column;\n            justify-content: flex-start;\n          }\n          .footer-text {\n            font-weight: 700;\n            margin-bottom: var(--dl-space-space-oneandhalfunits);\n          }\n          .footer-text01 {\n            margin-bottom: var(--dl-space-space-unit);\n          }\n          .footer-text02 {\n            margin-bottom: var(--dl-space-space-unit);\n          }\n          .footer-text03 {\n            margin-bottom: var(--dl-space-space-unit);\n          }\n          .footer-company-container {\n            flex: 0 0 auto;\n            display: flex;\n            align-items: flex-start;\n            margin-right: 5rem;\n            flex-direction: column;\n            justify-content: flex-start;\n          }\n          .footer-text04 {\n            font-weight: 700;\n            margin-bottom: var(--dl-space-space-oneandhalfunits);\n          }\n          .footer-text05 {\n            margin-bottom: var(--dl-space-space-unit);\n          }\n          .footer-text06 {\n            margin-bottom: var(--dl-space-space-unit);\n          }\n          .footer-text07 {\n            margin-bottom: var(--dl-space-space-unit);\n          }\n          .footer-company-container1 {\n            flex: 0 0 auto;\n            display: flex;\n            align-items: flex-start;\n            flex-direction: column;\n            justify-content: flex-start;\n          }\n          .footer-text08 {\n            font-weight: 700;\n            margin-bottom: var(--dl-space-space-oneandhalfunits);\n          }\n          .footer-text09 {\n            margin-bottom: var(--dl-space-space-unit);\n          }\n          .footer-text10 {\n            margin-bottom: var(--dl-space-space-unit);\n          }\n          .footer-text11 {\n            margin-bottom: var(--dl-space-space-unit);\n          }\n          .footer-separator {\n            width: 100%;\n            height: 1px;\n            margin-top: var(--dl-space-space-twounits);\n            margin-bottom: var(--dl-space-space-twounits);\n            background-color: var(--dl-color-gray-900);\n          }\n          .footer-copyright {\n            flex: 0 0 auto;\n            width: 100%;\n            height: auto;\n            display: flex;\n            align-items: flex-start;\n            justify-content: space-between;\n          }\n          .footer-text12 {\n            align-self: center;\n          }\n          .footer-socials {\n            display: flex;\n            align-items: center;\n            flex-direction: row;\n            justify-content: flex-start;\n          }\n          .footer-text14 {\n            font-style: normal;\n            font-weight: 400;\n            margin-right: var(--dl-space-space-unit);\n            margin-bottom: 0px;\n          }\n          .footer-icon-group {\n            display: flex;\n            align-items: center;\n            flex-direction: row;\n            justify-content: space-between;\n          }\n          .footer-image1 {\n            width: var(--dl-size-size-xsmall);\n            height: var(--dl-size-size-xsmall);\n            object-fit: cover;\n            margin-right: var(--dl-space-space-unit);\n          }\n          .footer-icon {\n            width: var(--dl-size-size-xsmall);\n            height: var(--dl-size-size-xsmall);\n            margin-left: 0px;\n            margin-right: 0px;\n          }\n          \n          @media(max-width: 991px) {\n            .footer-footer {\n              flex-direction: column;\n            }\n            .footer-container2 {\n              margin-right: var(--dl-space-space-fourunits);\n            }\n            .footer-product-container {\n              margin-right: var(--dl-space-space-fourunits);\n            }\n          }\n          @media(max-width: 767px) {\n            .footer-footer {\n              padding-left: var(--dl-space-space-twounits);\n              padding-right: var(--dl-space-space-twounits);\n            }\n            .footer-container1 {\n              align-items: center;\n              flex-direction: column;\n              justify-content: space-between;\n            }\n            .footer-image {\n              display: none;\n            }\n            .footer-container2 {\n              margin-right: var(--dl-space-space-fourunits);\n            }\n            .footer-product-container {\n              margin-right: var(--dl-space-space-fourunits);\n            }\n          }\n          @media(max-width: 479px) {\n            .footer-footer {\n              padding: var(--dl-space-space-unit);\n            }\n            .footer-container1 {\n              align-items: center;\n              flex-direction: column;\n            }\n            .footer-container2 {\n              margin-right: 0px;\n            }\n            .footer-text12 {\n              text-align: center;\n            }\n          }          \n        ")));
}
function Package(props) {
    var name = props.name, description = props.description, keywords = props.keywords, version = props.version, homepage = props.homepage, license = props.license, files = props.files, exports = props.exports, readme = props.readme;
    return Ct("div", null, Ct(Header, null), Ct("jspm-package", null, Ct(PackageHeader, {
        homepage: homepage || "",
        name: name,
        description: description,
        version: version
    }), Ct("jspm-package-content", null, Ct(Readme, {
        __html: readme
    }), Ct(Aside, {
        version: version,
        name: name,
        license: license,
        files: files,
        exports: exports,
        keywords: keywords
    }))), Ct(Footer, null), Ct(Lt, null, Ct("style", {
        "data-page": "package-details"
    }, "\n        jspm-package-content {\n          display: flex;\n          flex-direction: row;\n          flex-wrap: wrap;\n        }\n        \n        jspm-package-readme {\n          display: block;\n          width: 800px;\n          padding: var(--dl-space-space-oneandhalfunits);\n        }\n        \n        jspm-package-aside {\n          width: 300px;\n          padding-left: var(--dl-space-space-unit);\n        }\n        \n        jspm-package-name,\n        jspm-package-version,\n        jspm-package-description,\n        jspm-package-license {\n          display: block;\n        }\n        \n        jspm-package-name h1 {\n          font-family: \"Major Mono Display\", monospace;\n          font-size: var(--step-5);\n        }\n        \n        jspm-package-name h1 a {\n          color: black;\n        }\n\n        @media(max-width: 767px) {\n          jspm-package-content {\n            justify-content: space-between;\n          }\n\n          jspm-package-readme {\n            width: 100%;\n          }\n        }\n        ")));
}
function FeaturedPackages(param) {
    var _packages = param.packages, packages = _packages === void 0 ? [] : _packages;
    return Ct("div", {
        id: "featured-packages"
    }, Ct(Header, null), Ct("ul", {
        class: "list-style"
    }, packages.map(function(item) {
        var _package = item.package, name = _package.name, description = _package.description, version = _package.version;
        return Ct("li", {
            class: "package-item-wrapper"
        }, Ct("a", {
            class: "package-name",
            href: "/package/".concat(name, "@").concat(version)
        }, name, " ", Ct("span", {
            class: "package-version"
        }, version)), Ct("span", {
            class: "description"
        }, description));
    })), Ct(Footer, null), Ct(Lt, null, Ct("style", {
        "data-page-name": "featured-packages"
    }, "\n          .list-style {\n            list-style: none;\n            padding-left: var(--dl-space-space-unit);\n            margin: 0px;\n            width: 100%;\n          }\n          \n          .package-item-wrapper {\n            font-weight: 200;\n            margin-top: var(--dl-space-space-oneandhalfunits);\n          }\n\n          .package-version {\n            font-weight: 200;\n            font-size: var(--dl-space-space-unit);\n          }\n\n          .package-name {\n            display: block;\n            font-size: var(--dl-space-space-oneandhalfunits);\n            font-family: 'Inter';\n            font-weight: 400;\n            margin-bottom: var(--dl-space-space-halfunit);\n          }\n\n          .description {\n            overflow: hidden;\n            white-space: normal;\n            word-break: break-word;\n            line-height: 1.5;\n          }\n\n        ")));
}
const emojis = [
    {
        emoji: "😀",
        description: "grinning face",
        category: "Smileys & Emotion",
        aliases: [
            "grinning"
        ],
        tags: [
            "smile",
            "happy"
        ],
        unicodeVersion: "6.1",
        iosVersion: "6.0"
    },
    {
        emoji: "😃",
        description: "grinning face with big eyes",
        category: "Smileys & Emotion",
        aliases: [
            "smiley"
        ],
        tags: [
            "happy",
            "joy",
            "haha"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "😄",
        description: "grinning face with smiling eyes",
        category: "Smileys & Emotion",
        aliases: [
            "smile"
        ],
        tags: [
            "happy",
            "joy",
            "laugh",
            "pleased"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "😁",
        description: "beaming face with smiling eyes",
        category: "Smileys & Emotion",
        aliases: [
            "grin"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "😆",
        description: "grinning squinting face",
        category: "Smileys & Emotion",
        aliases: [
            "laughing",
            "satisfied"
        ],
        tags: [
            "happy",
            "haha"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "😅",
        description: "grinning face with sweat",
        category: "Smileys & Emotion",
        aliases: [
            "sweat_smile"
        ],
        tags: [
            "hot"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🤣",
        description: "rolling on the floor laughing",
        category: "Smileys & Emotion",
        aliases: [
            "rofl"
        ],
        tags: [
            "lol",
            "laughing"
        ],
        unicodeVersion: "9.0",
        iosVersion: "10.2"
    },
    {
        emoji: "😂",
        description: "face with tears of joy",
        category: "Smileys & Emotion",
        aliases: [
            "joy"
        ],
        tags: [
            "tears"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🙂",
        description: "slightly smiling face",
        category: "Smileys & Emotion",
        aliases: [
            "slightly_smiling_face"
        ],
        tags: [],
        unicodeVersion: "7.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🙃",
        description: "upside-down face",
        category: "Smileys & Emotion",
        aliases: [
            "upside_down_face"
        ],
        tags: [],
        unicodeVersion: "8.0",
        iosVersion: "9.1"
    },
    {
        emoji: "😉",
        description: "winking face",
        category: "Smileys & Emotion",
        aliases: [
            "wink"
        ],
        tags: [
            "flirt"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "😊",
        description: "smiling face with smiling eyes",
        category: "Smileys & Emotion",
        aliases: [
            "blush"
        ],
        tags: [
            "proud"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "😇",
        description: "smiling face with halo",
        category: "Smileys & Emotion",
        aliases: [
            "innocent"
        ],
        tags: [
            "angel"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🥰",
        description: "smiling face with hearts",
        category: "Smileys & Emotion",
        aliases: [
            "smiling_face_with_three_hearts"
        ],
        tags: [
            "love"
        ],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "😍",
        description: "smiling face with heart-eyes",
        category: "Smileys & Emotion",
        aliases: [
            "heart_eyes"
        ],
        tags: [
            "love",
            "crush"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🤩",
        description: "star-struck",
        category: "Smileys & Emotion",
        aliases: [
            "star_struck"
        ],
        tags: [
            "eyes"
        ],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "😘",
        description: "face blowing a kiss",
        category: "Smileys & Emotion",
        aliases: [
            "kissing_heart"
        ],
        tags: [
            "flirt"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "😗",
        description: "kissing face",
        category: "Smileys & Emotion",
        aliases: [
            "kissing"
        ],
        tags: [],
        unicodeVersion: "6.1",
        iosVersion: "6.0"
    },
    {
        emoji: "☺️",
        description: "smiling face",
        category: "Smileys & Emotion",
        aliases: [
            "relaxed"
        ],
        tags: [
            "blush",
            "pleased"
        ],
        unicodeVersion: "",
        iosVersion: "6.0"
    },
    {
        emoji: "😚",
        description: "kissing face with closed eyes",
        category: "Smileys & Emotion",
        aliases: [
            "kissing_closed_eyes"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "😙",
        description: "kissing face with smiling eyes",
        category: "Smileys & Emotion",
        aliases: [
            "kissing_smiling_eyes"
        ],
        tags: [],
        unicodeVersion: "6.1",
        iosVersion: "6.0"
    },
    {
        emoji: "🥲",
        description: "smiling face with tear",
        category: "Smileys & Emotion",
        aliases: [
            "smiling_face_with_tear"
        ],
        tags: [],
        unicodeVersion: "13.0",
        iosVersion: "14.0"
    },
    {
        emoji: "😋",
        description: "face savoring food",
        category: "Smileys & Emotion",
        aliases: [
            "yum"
        ],
        tags: [
            "tongue",
            "lick"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "😛",
        description: "face with tongue",
        category: "Smileys & Emotion",
        aliases: [
            "stuck_out_tongue"
        ],
        tags: [],
        unicodeVersion: "6.1",
        iosVersion: "6.0"
    },
    {
        emoji: "😜",
        description: "winking face with tongue",
        category: "Smileys & Emotion",
        aliases: [
            "stuck_out_tongue_winking_eye"
        ],
        tags: [
            "prank",
            "silly"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🤪",
        description: "zany face",
        category: "Smileys & Emotion",
        aliases: [
            "zany_face"
        ],
        tags: [
            "goofy",
            "wacky"
        ],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "😝",
        description: "squinting face with tongue",
        category: "Smileys & Emotion",
        aliases: [
            "stuck_out_tongue_closed_eyes"
        ],
        tags: [
            "prank"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🤑",
        description: "money-mouth face",
        category: "Smileys & Emotion",
        aliases: [
            "money_mouth_face"
        ],
        tags: [
            "rich"
        ],
        unicodeVersion: "8.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🤗",
        description: "hugging face",
        category: "Smileys & Emotion",
        aliases: [
            "hugs"
        ],
        tags: [],
        unicodeVersion: "8.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🤭",
        description: "face with hand over mouth",
        category: "Smileys & Emotion",
        aliases: [
            "hand_over_mouth"
        ],
        tags: [
            "quiet",
            "whoops"
        ],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🤫",
        description: "shushing face",
        category: "Smileys & Emotion",
        aliases: [
            "shushing_face"
        ],
        tags: [
            "silence",
            "quiet"
        ],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🤔",
        description: "thinking face",
        category: "Smileys & Emotion",
        aliases: [
            "thinking"
        ],
        tags: [],
        unicodeVersion: "8.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🤐",
        description: "zipper-mouth face",
        category: "Smileys & Emotion",
        aliases: [
            "zipper_mouth_face"
        ],
        tags: [
            "silence",
            "hush"
        ],
        unicodeVersion: "8.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🤨",
        description: "face with raised eyebrow",
        category: "Smileys & Emotion",
        aliases: [
            "raised_eyebrow"
        ],
        tags: [
            "suspicious"
        ],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "😐",
        description: "neutral face",
        category: "Smileys & Emotion",
        aliases: [
            "neutral_face"
        ],
        tags: [
            "meh"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "😑",
        description: "expressionless face",
        category: "Smileys & Emotion",
        aliases: [
            "expressionless"
        ],
        tags: [],
        unicodeVersion: "6.1",
        iosVersion: "6.0"
    },
    {
        emoji: "😶",
        description: "face without mouth",
        category: "Smileys & Emotion",
        aliases: [
            "no_mouth"
        ],
        tags: [
            "mute",
            "silence"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "😏",
        description: "smirking face",
        category: "Smileys & Emotion",
        aliases: [
            "smirk"
        ],
        tags: [
            "smug"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "😒",
        description: "unamused face",
        category: "Smileys & Emotion",
        aliases: [
            "unamused"
        ],
        tags: [
            "meh"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🙄",
        description: "face with rolling eyes",
        category: "Smileys & Emotion",
        aliases: [
            "roll_eyes"
        ],
        tags: [],
        unicodeVersion: "8.0",
        iosVersion: "9.1"
    },
    {
        emoji: "😬",
        description: "grimacing face",
        category: "Smileys & Emotion",
        aliases: [
            "grimacing"
        ],
        tags: [],
        unicodeVersion: "6.1",
        iosVersion: "6.0"
    },
    {
        emoji: "🤥",
        description: "lying face",
        category: "Smileys & Emotion",
        aliases: [
            "lying_face"
        ],
        tags: [
            "liar"
        ],
        unicodeVersion: "9.0",
        iosVersion: "10.2"
    },
    {
        emoji: "😌",
        description: "relieved face",
        category: "Smileys & Emotion",
        aliases: [
            "relieved"
        ],
        tags: [
            "whew"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "😔",
        description: "pensive face",
        category: "Smileys & Emotion",
        aliases: [
            "pensive"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "😪",
        description: "sleepy face",
        category: "Smileys & Emotion",
        aliases: [
            "sleepy"
        ],
        tags: [
            "tired"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🤤",
        description: "drooling face",
        category: "Smileys & Emotion",
        aliases: [
            "drooling_face"
        ],
        tags: [],
        unicodeVersion: "9.0",
        iosVersion: "10.2"
    },
    {
        emoji: "😴",
        description: "sleeping face",
        category: "Smileys & Emotion",
        aliases: [
            "sleeping"
        ],
        tags: [
            "zzz"
        ],
        unicodeVersion: "6.1",
        iosVersion: "6.0"
    },
    {
        emoji: "😷",
        description: "face with medical mask",
        category: "Smileys & Emotion",
        aliases: [
            "mask"
        ],
        tags: [
            "sick",
            "ill"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🤒",
        description: "face with thermometer",
        category: "Smileys & Emotion",
        aliases: [
            "face_with_thermometer"
        ],
        tags: [
            "sick"
        ],
        unicodeVersion: "8.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🤕",
        description: "face with head-bandage",
        category: "Smileys & Emotion",
        aliases: [
            "face_with_head_bandage"
        ],
        tags: [
            "hurt"
        ],
        unicodeVersion: "8.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🤢",
        description: "nauseated face",
        category: "Smileys & Emotion",
        aliases: [
            "nauseated_face"
        ],
        tags: [
            "sick",
            "barf",
            "disgusted"
        ],
        unicodeVersion: "9.0",
        iosVersion: "10.2"
    },
    {
        emoji: "🤮",
        description: "face vomiting",
        category: "Smileys & Emotion",
        aliases: [
            "vomiting_face"
        ],
        tags: [
            "barf",
            "sick"
        ],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🤧",
        description: "sneezing face",
        category: "Smileys & Emotion",
        aliases: [
            "sneezing_face"
        ],
        tags: [
            "achoo",
            "sick"
        ],
        unicodeVersion: "9.0",
        iosVersion: "10.2"
    },
    {
        emoji: "🥵",
        description: "hot face",
        category: "Smileys & Emotion",
        aliases: [
            "hot_face"
        ],
        tags: [
            "heat",
            "sweating"
        ],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🥶",
        description: "cold face",
        category: "Smileys & Emotion",
        aliases: [
            "cold_face"
        ],
        tags: [
            "freezing",
            "ice"
        ],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🥴",
        description: "woozy face",
        category: "Smileys & Emotion",
        aliases: [
            "woozy_face"
        ],
        tags: [
            "groggy"
        ],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "😵",
        description: "dizzy face",
        category: "Smileys & Emotion",
        aliases: [
            "dizzy_face"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🤯",
        description: "exploding head",
        category: "Smileys & Emotion",
        aliases: [
            "exploding_head"
        ],
        tags: [
            "mind",
            "blown"
        ],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🤠",
        description: "cowboy hat face",
        category: "Smileys & Emotion",
        aliases: [
            "cowboy_hat_face"
        ],
        tags: [],
        unicodeVersion: "9.0",
        iosVersion: "10.2"
    },
    {
        emoji: "🥳",
        description: "partying face",
        category: "Smileys & Emotion",
        aliases: [
            "partying_face"
        ],
        tags: [
            "celebration",
            "birthday"
        ],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🥸",
        description: "disguised face",
        category: "Smileys & Emotion",
        aliases: [
            "disguised_face"
        ],
        tags: [],
        unicodeVersion: "13.0",
        iosVersion: "14.0"
    },
    {
        emoji: "😎",
        description: "smiling face with sunglasses",
        category: "Smileys & Emotion",
        aliases: [
            "sunglasses"
        ],
        tags: [
            "cool"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🤓",
        description: "nerd face",
        category: "Smileys & Emotion",
        aliases: [
            "nerd_face"
        ],
        tags: [
            "geek",
            "glasses"
        ],
        unicodeVersion: "8.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🧐",
        description: "face with monocle",
        category: "Smileys & Emotion",
        aliases: [
            "monocle_face"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "😕",
        description: "confused face",
        category: "Smileys & Emotion",
        aliases: [
            "confused"
        ],
        tags: [],
        unicodeVersion: "6.1",
        iosVersion: "6.0"
    },
    {
        emoji: "😟",
        description: "worried face",
        category: "Smileys & Emotion",
        aliases: [
            "worried"
        ],
        tags: [
            "nervous"
        ],
        unicodeVersion: "6.1",
        iosVersion: "6.0"
    },
    {
        emoji: "🙁",
        description: "slightly frowning face",
        category: "Smileys & Emotion",
        aliases: [
            "slightly_frowning_face"
        ],
        tags: [],
        unicodeVersion: "7.0",
        iosVersion: "9.1"
    },
    {
        emoji: "☹️",
        description: "frowning face",
        category: "Smileys & Emotion",
        aliases: [
            "frowning_face"
        ],
        tags: [],
        unicodeVersion: "",
        iosVersion: "9.1"
    },
    {
        emoji: "😮",
        description: "face with open mouth",
        category: "Smileys & Emotion",
        aliases: [
            "open_mouth"
        ],
        tags: [
            "surprise",
            "impressed",
            "wow"
        ],
        unicodeVersion: "6.1",
        iosVersion: "6.0"
    },
    {
        emoji: "😯",
        description: "hushed face",
        category: "Smileys & Emotion",
        aliases: [
            "hushed"
        ],
        tags: [
            "silence",
            "speechless"
        ],
        unicodeVersion: "6.1",
        iosVersion: "6.0"
    },
    {
        emoji: "😲",
        description: "astonished face",
        category: "Smileys & Emotion",
        aliases: [
            "astonished"
        ],
        tags: [
            "amazed",
            "gasp"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "😳",
        description: "flushed face",
        category: "Smileys & Emotion",
        aliases: [
            "flushed"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🥺",
        description: "pleading face",
        category: "Smileys & Emotion",
        aliases: [
            "pleading_face"
        ],
        tags: [
            "puppy",
            "eyes"
        ],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "😦",
        description: "frowning face with open mouth",
        category: "Smileys & Emotion",
        aliases: [
            "frowning"
        ],
        tags: [],
        unicodeVersion: "6.1",
        iosVersion: "6.0"
    },
    {
        emoji: "😧",
        description: "anguished face",
        category: "Smileys & Emotion",
        aliases: [
            "anguished"
        ],
        tags: [
            "stunned"
        ],
        unicodeVersion: "6.1",
        iosVersion: "6.0"
    },
    {
        emoji: "😨",
        description: "fearful face",
        category: "Smileys & Emotion",
        aliases: [
            "fearful"
        ],
        tags: [
            "scared",
            "shocked",
            "oops"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "😰",
        description: "anxious face with sweat",
        category: "Smileys & Emotion",
        aliases: [
            "cold_sweat"
        ],
        tags: [
            "nervous"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "😥",
        description: "sad but relieved face",
        category: "Smileys & Emotion",
        aliases: [
            "disappointed_relieved"
        ],
        tags: [
            "phew",
            "sweat",
            "nervous"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "😢",
        description: "crying face",
        category: "Smileys & Emotion",
        aliases: [
            "cry"
        ],
        tags: [
            "sad",
            "tear"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "😭",
        description: "loudly crying face",
        category: "Smileys & Emotion",
        aliases: [
            "sob"
        ],
        tags: [
            "sad",
            "cry",
            "bawling"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "😱",
        description: "face screaming in fear",
        category: "Smileys & Emotion",
        aliases: [
            "scream"
        ],
        tags: [
            "horror",
            "shocked"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "😖",
        description: "confounded face",
        category: "Smileys & Emotion",
        aliases: [
            "confounded"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "😣",
        description: "persevering face",
        category: "Smileys & Emotion",
        aliases: [
            "persevere"
        ],
        tags: [
            "struggling"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "😞",
        description: "disappointed face",
        category: "Smileys & Emotion",
        aliases: [
            "disappointed"
        ],
        tags: [
            "sad"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "😓",
        description: "downcast face with sweat",
        category: "Smileys & Emotion",
        aliases: [
            "sweat"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "😩",
        description: "weary face",
        category: "Smileys & Emotion",
        aliases: [
            "weary"
        ],
        tags: [
            "tired"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "😫",
        description: "tired face",
        category: "Smileys & Emotion",
        aliases: [
            "tired_face"
        ],
        tags: [
            "upset",
            "whine"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🥱",
        description: "yawning face",
        category: "Smileys & Emotion",
        aliases: [
            "yawning_face"
        ],
        tags: [],
        unicodeVersion: "12.0",
        iosVersion: "13.0"
    },
    {
        emoji: "😤",
        description: "face with steam from nose",
        category: "Smileys & Emotion",
        aliases: [
            "triumph"
        ],
        tags: [
            "smug"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "😡",
        description: "pouting face",
        category: "Smileys & Emotion",
        aliases: [
            "rage",
            "pout"
        ],
        tags: [
            "angry"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "😠",
        description: "angry face",
        category: "Smileys & Emotion",
        aliases: [
            "angry"
        ],
        tags: [
            "mad",
            "annoyed"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🤬",
        description: "face with symbols on mouth",
        category: "Smileys & Emotion",
        aliases: [
            "cursing_face"
        ],
        tags: [
            "foul"
        ],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "😈",
        description: "smiling face with horns",
        category: "Smileys & Emotion",
        aliases: [
            "smiling_imp"
        ],
        tags: [
            "devil",
            "evil",
            "horns"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "👿",
        description: "angry face with horns",
        category: "Smileys & Emotion",
        aliases: [
            "imp"
        ],
        tags: [
            "angry",
            "devil",
            "evil",
            "horns"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "💀",
        description: "skull",
        category: "Smileys & Emotion",
        aliases: [
            "skull"
        ],
        tags: [
            "dead",
            "danger",
            "poison"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "☠️",
        description: "skull and crossbones",
        category: "Smileys & Emotion",
        aliases: [
            "skull_and_crossbones"
        ],
        tags: [
            "danger",
            "pirate"
        ],
        unicodeVersion: "",
        iosVersion: "9.1"
    },
    {
        emoji: "💩",
        description: "pile of poo",
        category: "Smileys & Emotion",
        aliases: [
            "hankey",
            "poop",
            "shit"
        ],
        tags: [
            "crap"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🤡",
        description: "clown face",
        category: "Smileys & Emotion",
        aliases: [
            "clown_face"
        ],
        tags: [],
        unicodeVersion: "9.0",
        iosVersion: "10.2"
    },
    {
        emoji: "👹",
        description: "ogre",
        category: "Smileys & Emotion",
        aliases: [
            "japanese_ogre"
        ],
        tags: [
            "monster"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "👺",
        description: "goblin",
        category: "Smileys & Emotion",
        aliases: [
            "japanese_goblin"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "👻",
        description: "ghost",
        category: "Smileys & Emotion",
        aliases: [
            "ghost"
        ],
        tags: [
            "halloween"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "👽",
        description: "alien",
        category: "Smileys & Emotion",
        aliases: [
            "alien"
        ],
        tags: [
            "ufo"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "👾",
        description: "alien monster",
        category: "Smileys & Emotion",
        aliases: [
            "space_invader"
        ],
        tags: [
            "game",
            "retro"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🤖",
        description: "robot",
        category: "Smileys & Emotion",
        aliases: [
            "robot"
        ],
        tags: [],
        unicodeVersion: "8.0",
        iosVersion: "9.1"
    },
    {
        emoji: "😺",
        description: "grinning cat",
        category: "Smileys & Emotion",
        aliases: [
            "smiley_cat"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "😸",
        description: "grinning cat with smiling eyes",
        category: "Smileys & Emotion",
        aliases: [
            "smile_cat"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "😹",
        description: "cat with tears of joy",
        category: "Smileys & Emotion",
        aliases: [
            "joy_cat"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "😻",
        description: "smiling cat with heart-eyes",
        category: "Smileys & Emotion",
        aliases: [
            "heart_eyes_cat"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "😼",
        description: "cat with wry smile",
        category: "Smileys & Emotion",
        aliases: [
            "smirk_cat"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "😽",
        description: "kissing cat",
        category: "Smileys & Emotion",
        aliases: [
            "kissing_cat"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🙀",
        description: "weary cat",
        category: "Smileys & Emotion",
        aliases: [
            "scream_cat"
        ],
        tags: [
            "horror"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "😿",
        description: "crying cat",
        category: "Smileys & Emotion",
        aliases: [
            "crying_cat_face"
        ],
        tags: [
            "sad",
            "tear"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "😾",
        description: "pouting cat",
        category: "Smileys & Emotion",
        aliases: [
            "pouting_cat"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🙈",
        description: "see-no-evil monkey",
        category: "Smileys & Emotion",
        aliases: [
            "see_no_evil"
        ],
        tags: [
            "monkey",
            "blind",
            "ignore"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🙉",
        description: "hear-no-evil monkey",
        category: "Smileys & Emotion",
        aliases: [
            "hear_no_evil"
        ],
        tags: [
            "monkey",
            "deaf"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🙊",
        description: "speak-no-evil monkey",
        category: "Smileys & Emotion",
        aliases: [
            "speak_no_evil"
        ],
        tags: [
            "monkey",
            "mute",
            "hush"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "💋",
        description: "kiss mark",
        category: "Smileys & Emotion",
        aliases: [
            "kiss"
        ],
        tags: [
            "lipstick"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "💌",
        description: "love letter",
        category: "Smileys & Emotion",
        aliases: [
            "love_letter"
        ],
        tags: [
            "email",
            "envelope"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "💘",
        description: "heart with arrow",
        category: "Smileys & Emotion",
        aliases: [
            "cupid"
        ],
        tags: [
            "love",
            "heart"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "💝",
        description: "heart with ribbon",
        category: "Smileys & Emotion",
        aliases: [
            "gift_heart"
        ],
        tags: [
            "chocolates"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "💖",
        description: "sparkling heart",
        category: "Smileys & Emotion",
        aliases: [
            "sparkling_heart"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "💗",
        description: "growing heart",
        category: "Smileys & Emotion",
        aliases: [
            "heartpulse"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "💓",
        description: "beating heart",
        category: "Smileys & Emotion",
        aliases: [
            "heartbeat"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "💞",
        description: "revolving hearts",
        category: "Smileys & Emotion",
        aliases: [
            "revolving_hearts"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "💕",
        description: "two hearts",
        category: "Smileys & Emotion",
        aliases: [
            "two_hearts"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "💟",
        description: "heart decoration",
        category: "Smileys & Emotion",
        aliases: [
            "heart_decoration"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "❣️",
        description: "heart exclamation",
        category: "Smileys & Emotion",
        aliases: [
            "heavy_heart_exclamation"
        ],
        tags: [],
        unicodeVersion: "",
        iosVersion: "9.1"
    },
    {
        emoji: "💔",
        description: "broken heart",
        category: "Smileys & Emotion",
        aliases: [
            "broken_heart"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "❤️",
        description: "red heart",
        category: "Smileys & Emotion",
        aliases: [
            "heart"
        ],
        tags: [
            "love"
        ],
        unicodeVersion: "",
        iosVersion: "6.0"
    },
    {
        emoji: "🧡",
        description: "orange heart",
        category: "Smileys & Emotion",
        aliases: [
            "orange_heart"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "💛",
        description: "yellow heart",
        category: "Smileys & Emotion",
        aliases: [
            "yellow_heart"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "💚",
        description: "green heart",
        category: "Smileys & Emotion",
        aliases: [
            "green_heart"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "💙",
        description: "blue heart",
        category: "Smileys & Emotion",
        aliases: [
            "blue_heart"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "💜",
        description: "purple heart",
        category: "Smileys & Emotion",
        aliases: [
            "purple_heart"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🤎",
        description: "brown heart",
        category: "Smileys & Emotion",
        aliases: [
            "brown_heart"
        ],
        tags: [],
        unicodeVersion: "12.0",
        iosVersion: "13.0"
    },
    {
        emoji: "🖤",
        description: "black heart",
        category: "Smileys & Emotion",
        aliases: [
            "black_heart"
        ],
        tags: [],
        unicodeVersion: "9.0",
        iosVersion: "10.2"
    },
    {
        emoji: "🤍",
        description: "white heart",
        category: "Smileys & Emotion",
        aliases: [
            "white_heart"
        ],
        tags: [],
        unicodeVersion: "12.0",
        iosVersion: "13.0"
    },
    {
        emoji: "💯",
        description: "hundred points",
        category: "Smileys & Emotion",
        aliases: [
            "100"
        ],
        tags: [
            "score",
            "perfect"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "💢",
        description: "anger symbol",
        category: "Smileys & Emotion",
        aliases: [
            "anger"
        ],
        tags: [
            "angry"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "💥",
        description: "collision",
        category: "Smileys & Emotion",
        aliases: [
            "boom",
            "collision"
        ],
        tags: [
            "explode"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "💫",
        description: "dizzy",
        category: "Smileys & Emotion",
        aliases: [
            "dizzy"
        ],
        tags: [
            "star"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "💦",
        description: "sweat droplets",
        category: "Smileys & Emotion",
        aliases: [
            "sweat_drops"
        ],
        tags: [
            "water",
            "workout"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "💨",
        description: "dashing away",
        category: "Smileys & Emotion",
        aliases: [
            "dash"
        ],
        tags: [
            "wind",
            "blow",
            "fast"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🕳️",
        description: "hole",
        category: "Smileys & Emotion",
        aliases: [
            "hole"
        ],
        tags: [],
        unicodeVersion: "7.0",
        iosVersion: "9.1"
    },
    {
        emoji: "💣",
        description: "bomb",
        category: "Smileys & Emotion",
        aliases: [
            "bomb"
        ],
        tags: [
            "boom"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "💬",
        description: "speech balloon",
        category: "Smileys & Emotion",
        aliases: [
            "speech_balloon"
        ],
        tags: [
            "comment"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "👁️‍🗨️",
        description: "eye in speech bubble",
        category: "Smileys & Emotion",
        aliases: [
            "eye_speech_bubble"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🗨️",
        description: "left speech bubble",
        category: "Smileys & Emotion",
        aliases: [
            "left_speech_bubble"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🗯️",
        description: "right anger bubble",
        category: "Smileys & Emotion",
        aliases: [
            "right_anger_bubble"
        ],
        tags: [],
        unicodeVersion: "7.0",
        iosVersion: "9.1"
    },
    {
        emoji: "💭",
        description: "thought balloon",
        category: "Smileys & Emotion",
        aliases: [
            "thought_balloon"
        ],
        tags: [
            "thinking"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "💤",
        description: "zzz",
        category: "Smileys & Emotion",
        aliases: [
            "zzz"
        ],
        tags: [
            "sleeping"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "👋",
        description: "waving hand",
        category: "People & Body",
        aliases: [
            "wave"
        ],
        tags: [
            "goodbye"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0",
        skinTones: true
    },
    {
        emoji: "🤚",
        description: "raised back of hand",
        category: "People & Body",
        aliases: [
            "raised_back_of_hand"
        ],
        tags: [],
        unicodeVersion: "9.0",
        iosVersion: "10.2",
        skinTones: true
    },
    {
        emoji: "🖐️",
        description: "hand with fingers splayed",
        category: "People & Body",
        aliases: [
            "raised_hand_with_fingers_splayed"
        ],
        tags: [],
        unicodeVersion: "7.0",
        iosVersion: "9.1",
        skinTones: true
    },
    {
        emoji: "✋",
        description: "raised hand",
        category: "People & Body",
        aliases: [
            "hand",
            "raised_hand"
        ],
        tags: [
            "highfive",
            "stop"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0",
        skinTones: true
    },
    {
        emoji: "🖖",
        description: "vulcan salute",
        category: "People & Body",
        aliases: [
            "vulcan_salute"
        ],
        tags: [
            "prosper",
            "spock"
        ],
        unicodeVersion: "7.0",
        iosVersion: "8.3",
        skinTones: true
    },
    {
        emoji: "👌",
        description: "OK hand",
        category: "People & Body",
        aliases: [
            "ok_hand"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0",
        skinTones: true
    },
    {
        emoji: "🤌",
        description: "pinched fingers",
        category: "People & Body",
        aliases: [
            "pinched_fingers"
        ],
        tags: [],
        unicodeVersion: "13.0",
        iosVersion: "14.0",
        skinTones: true
    },
    {
        emoji: "🤏",
        description: "pinching hand",
        category: "People & Body",
        aliases: [
            "pinching_hand"
        ],
        tags: [],
        unicodeVersion: "12.0",
        iosVersion: "13.0",
        skinTones: true
    },
    {
        emoji: "✌️",
        description: "victory hand",
        category: "People & Body",
        aliases: [
            "v"
        ],
        tags: [
            "victory",
            "peace"
        ],
        unicodeVersion: "",
        iosVersion: "6.0",
        skinTones: true
    },
    {
        emoji: "🤞",
        description: "crossed fingers",
        category: "People & Body",
        aliases: [
            "crossed_fingers"
        ],
        tags: [
            "luck",
            "hopeful"
        ],
        unicodeVersion: "9.0",
        iosVersion: "10.2",
        skinTones: true
    },
    {
        emoji: "🤟",
        description: "love-you gesture",
        category: "People & Body",
        aliases: [
            "love_you_gesture"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1",
        skinTones: true
    },
    {
        emoji: "🤘",
        description: "sign of the horns",
        category: "People & Body",
        aliases: [
            "metal"
        ],
        tags: [],
        unicodeVersion: "8.0",
        iosVersion: "9.1",
        skinTones: true
    },
    {
        emoji: "🤙",
        description: "call me hand",
        category: "People & Body",
        aliases: [
            "call_me_hand"
        ],
        tags: [],
        unicodeVersion: "9.0",
        iosVersion: "10.2",
        skinTones: true
    },
    {
        emoji: "👈",
        description: "backhand index pointing left",
        category: "People & Body",
        aliases: [
            "point_left"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0",
        skinTones: true
    },
    {
        emoji: "👉",
        description: "backhand index pointing right",
        category: "People & Body",
        aliases: [
            "point_right"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0",
        skinTones: true
    },
    {
        emoji: "👆",
        description: "backhand index pointing up",
        category: "People & Body",
        aliases: [
            "point_up_2"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0",
        skinTones: true
    },
    {
        emoji: "🖕",
        description: "middle finger",
        category: "People & Body",
        aliases: [
            "middle_finger",
            "fu"
        ],
        tags: [],
        unicodeVersion: "7.0",
        iosVersion: "9.1",
        skinTones: true
    },
    {
        emoji: "👇",
        description: "backhand index pointing down",
        category: "People & Body",
        aliases: [
            "point_down"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0",
        skinTones: true
    },
    {
        emoji: "☝️",
        description: "index pointing up",
        category: "People & Body",
        aliases: [
            "point_up"
        ],
        tags: [],
        unicodeVersion: "",
        iosVersion: "6.0",
        skinTones: true
    },
    {
        emoji: "👍",
        description: "thumbs up",
        category: "People & Body",
        aliases: [
            "+1",
            "thumbsup"
        ],
        tags: [
            "approve",
            "ok"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0",
        skinTones: true
    },
    {
        emoji: "👎",
        description: "thumbs down",
        category: "People & Body",
        aliases: [
            "-1",
            "thumbsdown"
        ],
        tags: [
            "disapprove",
            "bury"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0",
        skinTones: true
    },
    {
        emoji: "✊",
        description: "raised fist",
        category: "People & Body",
        aliases: [
            "fist_raised",
            "fist"
        ],
        tags: [
            "power"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0",
        skinTones: true
    },
    {
        emoji: "👊",
        description: "oncoming fist",
        category: "People & Body",
        aliases: [
            "fist_oncoming",
            "facepunch",
            "punch"
        ],
        tags: [
            "attack"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0",
        skinTones: true
    },
    {
        emoji: "🤛",
        description: "left-facing fist",
        category: "People & Body",
        aliases: [
            "fist_left"
        ],
        tags: [],
        unicodeVersion: "9.0",
        iosVersion: "10.2",
        skinTones: true
    },
    {
        emoji: "🤜",
        description: "right-facing fist",
        category: "People & Body",
        aliases: [
            "fist_right"
        ],
        tags: [],
        unicodeVersion: "9.0",
        iosVersion: "10.2",
        skinTones: true
    },
    {
        emoji: "👏",
        description: "clapping hands",
        category: "People & Body",
        aliases: [
            "clap"
        ],
        tags: [
            "praise",
            "applause"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0",
        skinTones: true
    },
    {
        emoji: "🙌",
        description: "raising hands",
        category: "People & Body",
        aliases: [
            "raised_hands"
        ],
        tags: [
            "hooray"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0",
        skinTones: true
    },
    {
        emoji: "👐",
        description: "open hands",
        category: "People & Body",
        aliases: [
            "open_hands"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0",
        skinTones: true
    },
    {
        emoji: "🤲",
        description: "palms up together",
        category: "People & Body",
        aliases: [
            "palms_up_together"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1",
        skinTones: true
    },
    {
        emoji: "🤝",
        description: "handshake",
        category: "People & Body",
        aliases: [
            "handshake"
        ],
        tags: [
            "deal"
        ],
        unicodeVersion: "9.0",
        iosVersion: "10.2"
    },
    {
        emoji: "🙏",
        description: "folded hands",
        category: "People & Body",
        aliases: [
            "pray"
        ],
        tags: [
            "please",
            "hope",
            "wish"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0",
        skinTones: true
    },
    {
        emoji: "✍️",
        description: "writing hand",
        category: "People & Body",
        aliases: [
            "writing_hand"
        ],
        tags: [],
        unicodeVersion: "",
        iosVersion: "9.1",
        skinTones: true
    },
    {
        emoji: "💅",
        description: "nail polish",
        category: "People & Body",
        aliases: [
            "nail_care"
        ],
        tags: [
            "beauty",
            "manicure"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0",
        skinTones: true
    },
    {
        emoji: "🤳",
        description: "selfie",
        category: "People & Body",
        aliases: [
            "selfie"
        ],
        tags: [],
        unicodeVersion: "9.0",
        iosVersion: "10.2",
        skinTones: true
    },
    {
        emoji: "💪",
        description: "flexed biceps",
        category: "People & Body",
        aliases: [
            "muscle"
        ],
        tags: [
            "flex",
            "bicep",
            "strong",
            "workout"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0",
        skinTones: true
    },
    {
        emoji: "🦾",
        description: "mechanical arm",
        category: "People & Body",
        aliases: [
            "mechanical_arm"
        ],
        tags: [],
        unicodeVersion: "12.0",
        iosVersion: "13.0"
    },
    {
        emoji: "🦿",
        description: "mechanical leg",
        category: "People & Body",
        aliases: [
            "mechanical_leg"
        ],
        tags: [],
        unicodeVersion: "12.0",
        iosVersion: "13.0"
    },
    {
        emoji: "🦵",
        description: "leg",
        category: "People & Body",
        aliases: [
            "leg"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1",
        skinTones: true
    },
    {
        emoji: "🦶",
        description: "foot",
        category: "People & Body",
        aliases: [
            "foot"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1",
        skinTones: true
    },
    {
        emoji: "👂",
        description: "ear",
        category: "People & Body",
        aliases: [
            "ear"
        ],
        tags: [
            "hear",
            "sound",
            "listen"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0",
        skinTones: true
    },
    {
        emoji: "🦻",
        description: "ear with hearing aid",
        category: "People & Body",
        aliases: [
            "ear_with_hearing_aid"
        ],
        tags: [],
        unicodeVersion: "12.0",
        iosVersion: "13.0",
        skinTones: true
    },
    {
        emoji: "👃",
        description: "nose",
        category: "People & Body",
        aliases: [
            "nose"
        ],
        tags: [
            "smell"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0",
        skinTones: true
    },
    {
        emoji: "🧠",
        description: "brain",
        category: "People & Body",
        aliases: [
            "brain"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🫀",
        description: "anatomical heart",
        category: "People & Body",
        aliases: [
            "anatomical_heart"
        ],
        tags: [],
        unicodeVersion: "13.0",
        iosVersion: "14.0"
    },
    {
        emoji: "🫁",
        description: "lungs",
        category: "People & Body",
        aliases: [
            "lungs"
        ],
        tags: [],
        unicodeVersion: "13.0",
        iosVersion: "14.0"
    },
    {
        emoji: "🦷",
        description: "tooth",
        category: "People & Body",
        aliases: [
            "tooth"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🦴",
        description: "bone",
        category: "People & Body",
        aliases: [
            "bone"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "👀",
        description: "eyes",
        category: "People & Body",
        aliases: [
            "eyes"
        ],
        tags: [
            "look",
            "see",
            "watch"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "👁️",
        description: "eye",
        category: "People & Body",
        aliases: [
            "eye"
        ],
        tags: [],
        unicodeVersion: "7.0",
        iosVersion: "9.1"
    },
    {
        emoji: "👅",
        description: "tongue",
        category: "People & Body",
        aliases: [
            "tongue"
        ],
        tags: [
            "taste"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "👄",
        description: "mouth",
        category: "People & Body",
        aliases: [
            "lips"
        ],
        tags: [
            "kiss"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "👶",
        description: "baby",
        category: "People & Body",
        aliases: [
            "baby"
        ],
        tags: [
            "child",
            "newborn"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0",
        skinTones: true
    },
    {
        emoji: "🧒",
        description: "child",
        category: "People & Body",
        aliases: [
            "child"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1",
        skinTones: true
    },
    {
        emoji: "👦",
        description: "boy",
        category: "People & Body",
        aliases: [
            "boy"
        ],
        tags: [
            "child"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0",
        skinTones: true
    },
    {
        emoji: "👧",
        description: "girl",
        category: "People & Body",
        aliases: [
            "girl"
        ],
        tags: [
            "child"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0",
        skinTones: true
    },
    {
        emoji: "🧑",
        description: "person",
        category: "People & Body",
        aliases: [
            "adult"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1",
        skinTones: true
    },
    {
        emoji: "👱",
        description: "person: blond hair",
        category: "People & Body",
        aliases: [
            "blond_haired_person"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0",
        skinTones: true
    },
    {
        emoji: "👨",
        description: "man",
        category: "People & Body",
        aliases: [
            "man"
        ],
        tags: [
            "mustache",
            "father",
            "dad"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0",
        skinTones: true
    },
    {
        emoji: "🧔",
        description: "man: beard",
        category: "People & Body",
        aliases: [
            "bearded_person"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1",
        skinTones: true
    },
    {
        emoji: "👨‍🦰",
        description: "man: red hair",
        category: "People & Body",
        aliases: [
            "red_haired_man"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1",
        skinTones: true
    },
    {
        emoji: "👨‍🦱",
        description: "man: curly hair",
        category: "People & Body",
        aliases: [
            "curly_haired_man"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1",
        skinTones: true
    },
    {
        emoji: "👨‍🦳",
        description: "man: white hair",
        category: "People & Body",
        aliases: [
            "white_haired_man"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1",
        skinTones: true
    },
    {
        emoji: "👨‍🦲",
        description: "man: bald",
        category: "People & Body",
        aliases: [
            "bald_man"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1",
        skinTones: true
    },
    {
        emoji: "👩",
        description: "woman",
        category: "People & Body",
        aliases: [
            "woman"
        ],
        tags: [
            "girls"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0",
        skinTones: true
    },
    {
        emoji: "👩‍🦰",
        description: "woman: red hair",
        category: "People & Body",
        aliases: [
            "red_haired_woman"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1",
        skinTones: true
    },
    {
        emoji: "🧑‍🦰",
        description: "person: red hair",
        category: "People & Body",
        aliases: [
            "person_red_hair"
        ],
        tags: [],
        unicodeVersion: "12.1",
        iosVersion: "13.2",
        skinTones: true
    },
    {
        emoji: "👩‍🦱",
        description: "woman: curly hair",
        category: "People & Body",
        aliases: [
            "curly_haired_woman"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1",
        skinTones: true
    },
    {
        emoji: "🧑‍🦱",
        description: "person: curly hair",
        category: "People & Body",
        aliases: [
            "person_curly_hair"
        ],
        tags: [],
        unicodeVersion: "12.1",
        iosVersion: "13.2",
        skinTones: true
    },
    {
        emoji: "👩‍🦳",
        description: "woman: white hair",
        category: "People & Body",
        aliases: [
            "white_haired_woman"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1",
        skinTones: true
    },
    {
        emoji: "🧑‍🦳",
        description: "person: white hair",
        category: "People & Body",
        aliases: [
            "person_white_hair"
        ],
        tags: [],
        unicodeVersion: "12.1",
        iosVersion: "13.2",
        skinTones: true
    },
    {
        emoji: "👩‍🦲",
        description: "woman: bald",
        category: "People & Body",
        aliases: [
            "bald_woman"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1",
        skinTones: true
    },
    {
        emoji: "🧑‍🦲",
        description: "person: bald",
        category: "People & Body",
        aliases: [
            "person_bald"
        ],
        tags: [],
        unicodeVersion: "12.1",
        iosVersion: "13.2",
        skinTones: true
    },
    {
        emoji: "👱‍♀️",
        description: "woman: blond hair",
        category: "People & Body",
        aliases: [
            "blond_haired_woman",
            "blonde_woman"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "10.0",
        skinTones: true
    },
    {
        emoji: "👱‍♂️",
        description: "man: blond hair",
        category: "People & Body",
        aliases: [
            "blond_haired_man"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1",
        skinTones: true
    },
    {
        emoji: "🧓",
        description: "older person",
        category: "People & Body",
        aliases: [
            "older_adult"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1",
        skinTones: true
    },
    {
        emoji: "👴",
        description: "old man",
        category: "People & Body",
        aliases: [
            "older_man"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0",
        skinTones: true
    },
    {
        emoji: "👵",
        description: "old woman",
        category: "People & Body",
        aliases: [
            "older_woman"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0",
        skinTones: true
    },
    {
        emoji: "🙍",
        description: "person frowning",
        category: "People & Body",
        aliases: [
            "frowning_person"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0",
        skinTones: true
    },
    {
        emoji: "🙍‍♂️",
        description: "man frowning",
        category: "People & Body",
        aliases: [
            "frowning_man"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "10.0",
        skinTones: true
    },
    {
        emoji: "🙍‍♀️",
        description: "woman frowning",
        category: "People & Body",
        aliases: [
            "frowning_woman"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1",
        skinTones: true
    },
    {
        emoji: "🙎",
        description: "person pouting",
        category: "People & Body",
        aliases: [
            "pouting_face"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0",
        skinTones: true
    },
    {
        emoji: "🙎‍♂️",
        description: "man pouting",
        category: "People & Body",
        aliases: [
            "pouting_man"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "10.0",
        skinTones: true
    },
    {
        emoji: "🙎‍♀️",
        description: "woman pouting",
        category: "People & Body",
        aliases: [
            "pouting_woman"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1",
        skinTones: true
    },
    {
        emoji: "🙅",
        description: "person gesturing NO",
        category: "People & Body",
        aliases: [
            "no_good"
        ],
        tags: [
            "stop",
            "halt",
            "denied"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0",
        skinTones: true
    },
    {
        emoji: "🙅‍♂️",
        description: "man gesturing NO",
        category: "People & Body",
        aliases: [
            "no_good_man",
            "ng_man"
        ],
        tags: [
            "stop",
            "halt",
            "denied"
        ],
        unicodeVersion: "6.0",
        iosVersion: "10.0",
        skinTones: true
    },
    {
        emoji: "🙅‍♀️",
        description: "woman gesturing NO",
        category: "People & Body",
        aliases: [
            "no_good_woman",
            "ng_woman"
        ],
        tags: [
            "stop",
            "halt",
            "denied"
        ],
        unicodeVersion: "11.0",
        iosVersion: "12.1",
        skinTones: true
    },
    {
        emoji: "🙆",
        description: "person gesturing OK",
        category: "People & Body",
        aliases: [
            "ok_person"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0",
        skinTones: true
    },
    {
        emoji: "🙆‍♂️",
        description: "man gesturing OK",
        category: "People & Body",
        aliases: [
            "ok_man"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "10.0",
        skinTones: true
    },
    {
        emoji: "🙆‍♀️",
        description: "woman gesturing OK",
        category: "People & Body",
        aliases: [
            "ok_woman"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1",
        skinTones: true
    },
    {
        emoji: "💁",
        description: "person tipping hand",
        category: "People & Body",
        aliases: [
            "tipping_hand_person",
            "information_desk_person"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0",
        skinTones: true
    },
    {
        emoji: "💁‍♂️",
        description: "man tipping hand",
        category: "People & Body",
        aliases: [
            "tipping_hand_man",
            "sassy_man"
        ],
        tags: [
            "information"
        ],
        unicodeVersion: "6.0",
        iosVersion: "10.0",
        skinTones: true
    },
    {
        emoji: "💁‍♀️",
        description: "woman tipping hand",
        category: "People & Body",
        aliases: [
            "tipping_hand_woman",
            "sassy_woman"
        ],
        tags: [
            "information"
        ],
        unicodeVersion: "11.0",
        iosVersion: "12.1",
        skinTones: true
    },
    {
        emoji: "🙋",
        description: "person raising hand",
        category: "People & Body",
        aliases: [
            "raising_hand"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0",
        skinTones: true
    },
    {
        emoji: "🙋‍♂️",
        description: "man raising hand",
        category: "People & Body",
        aliases: [
            "raising_hand_man"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "10.0",
        skinTones: true
    },
    {
        emoji: "🙋‍♀️",
        description: "woman raising hand",
        category: "People & Body",
        aliases: [
            "raising_hand_woman"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1",
        skinTones: true
    },
    {
        emoji: "🧏",
        description: "deaf person",
        category: "People & Body",
        aliases: [
            "deaf_person"
        ],
        tags: [],
        unicodeVersion: "12.0",
        iosVersion: "13.0",
        skinTones: true
    },
    {
        emoji: "🧏‍♂️",
        description: "deaf man",
        category: "People & Body",
        aliases: [
            "deaf_man"
        ],
        tags: [],
        unicodeVersion: "12.0",
        iosVersion: "13.0",
        skinTones: true
    },
    {
        emoji: "🧏‍♀️",
        description: "deaf woman",
        category: "People & Body",
        aliases: [
            "deaf_woman"
        ],
        tags: [],
        unicodeVersion: "12.0",
        iosVersion: "13.0",
        skinTones: true
    },
    {
        emoji: "🙇",
        description: "person bowing",
        category: "People & Body",
        aliases: [
            "bow"
        ],
        tags: [
            "respect",
            "thanks"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0",
        skinTones: true
    },
    {
        emoji: "🙇‍♂️",
        description: "man bowing",
        category: "People & Body",
        aliases: [
            "bowing_man"
        ],
        tags: [
            "respect",
            "thanks"
        ],
        unicodeVersion: "11.0",
        iosVersion: "12.1",
        skinTones: true
    },
    {
        emoji: "🙇‍♀️",
        description: "woman bowing",
        category: "People & Body",
        aliases: [
            "bowing_woman"
        ],
        tags: [
            "respect",
            "thanks"
        ],
        unicodeVersion: "6.0",
        iosVersion: "10.0",
        skinTones: true
    },
    {
        emoji: "🤦",
        description: "person facepalming",
        category: "People & Body",
        aliases: [
            "facepalm"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1",
        skinTones: true
    },
    {
        emoji: "🤦‍♂️",
        description: "man facepalming",
        category: "People & Body",
        aliases: [
            "man_facepalming"
        ],
        tags: [],
        unicodeVersion: "9.0",
        iosVersion: "10.2",
        skinTones: true
    },
    {
        emoji: "🤦‍♀️",
        description: "woman facepalming",
        category: "People & Body",
        aliases: [
            "woman_facepalming"
        ],
        tags: [],
        unicodeVersion: "9.0",
        iosVersion: "10.2",
        skinTones: true
    },
    {
        emoji: "🤷",
        description: "person shrugging",
        category: "People & Body",
        aliases: [
            "shrug"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1",
        skinTones: true
    },
    {
        emoji: "🤷‍♂️",
        description: "man shrugging",
        category: "People & Body",
        aliases: [
            "man_shrugging"
        ],
        tags: [],
        unicodeVersion: "9.0",
        iosVersion: "10.2",
        skinTones: true
    },
    {
        emoji: "🤷‍♀️",
        description: "woman shrugging",
        category: "People & Body",
        aliases: [
            "woman_shrugging"
        ],
        tags: [],
        unicodeVersion: "9.0",
        iosVersion: "10.2",
        skinTones: true
    },
    {
        emoji: "🧑‍⚕️",
        description: "health worker",
        category: "People & Body",
        aliases: [
            "health_worker"
        ],
        tags: [],
        unicodeVersion: "12.1",
        iosVersion: "13.2",
        skinTones: true
    },
    {
        emoji: "👨‍⚕️",
        description: "man health worker",
        category: "People & Body",
        aliases: [
            "man_health_worker"
        ],
        tags: [
            "doctor",
            "nurse"
        ],
        unicodeVersion: "",
        iosVersion: "10.2",
        skinTones: true
    },
    {
        emoji: "👩‍⚕️",
        description: "woman health worker",
        category: "People & Body",
        aliases: [
            "woman_health_worker"
        ],
        tags: [
            "doctor",
            "nurse"
        ],
        unicodeVersion: "",
        iosVersion: "10.2",
        skinTones: true
    },
    {
        emoji: "🧑‍🎓",
        description: "student",
        category: "People & Body",
        aliases: [
            "student"
        ],
        tags: [],
        unicodeVersion: "12.1",
        iosVersion: "13.2",
        skinTones: true
    },
    {
        emoji: "👨‍🎓",
        description: "man student",
        category: "People & Body",
        aliases: [
            "man_student"
        ],
        tags: [
            "graduation"
        ],
        unicodeVersion: "",
        iosVersion: "10.2",
        skinTones: true
    },
    {
        emoji: "👩‍🎓",
        description: "woman student",
        category: "People & Body",
        aliases: [
            "woman_student"
        ],
        tags: [
            "graduation"
        ],
        unicodeVersion: "",
        iosVersion: "10.2",
        skinTones: true
    },
    {
        emoji: "🧑‍🏫",
        description: "teacher",
        category: "People & Body",
        aliases: [
            "teacher"
        ],
        tags: [],
        unicodeVersion: "12.1",
        iosVersion: "13.2",
        skinTones: true
    },
    {
        emoji: "👨‍🏫",
        description: "man teacher",
        category: "People & Body",
        aliases: [
            "man_teacher"
        ],
        tags: [
            "school",
            "professor"
        ],
        unicodeVersion: "",
        iosVersion: "10.2",
        skinTones: true
    },
    {
        emoji: "👩‍🏫",
        description: "woman teacher",
        category: "People & Body",
        aliases: [
            "woman_teacher"
        ],
        tags: [
            "school",
            "professor"
        ],
        unicodeVersion: "",
        iosVersion: "10.2",
        skinTones: true
    },
    {
        emoji: "🧑‍⚖️",
        description: "judge",
        category: "People & Body",
        aliases: [
            "judge"
        ],
        tags: [],
        unicodeVersion: "12.1",
        iosVersion: "13.2",
        skinTones: true
    },
    {
        emoji: "👨‍⚖️",
        description: "man judge",
        category: "People & Body",
        aliases: [
            "man_judge"
        ],
        tags: [
            "justice"
        ],
        unicodeVersion: "",
        iosVersion: "10.2",
        skinTones: true
    },
    {
        emoji: "👩‍⚖️",
        description: "woman judge",
        category: "People & Body",
        aliases: [
            "woman_judge"
        ],
        tags: [
            "justice"
        ],
        unicodeVersion: "",
        iosVersion: "10.2",
        skinTones: true
    },
    {
        emoji: "🧑‍🌾",
        description: "farmer",
        category: "People & Body",
        aliases: [
            "farmer"
        ],
        tags: [],
        unicodeVersion: "12.1",
        iosVersion: "13.2",
        skinTones: true
    },
    {
        emoji: "👨‍🌾",
        description: "man farmer",
        category: "People & Body",
        aliases: [
            "man_farmer"
        ],
        tags: [],
        unicodeVersion: "",
        iosVersion: "10.2",
        skinTones: true
    },
    {
        emoji: "👩‍🌾",
        description: "woman farmer",
        category: "People & Body",
        aliases: [
            "woman_farmer"
        ],
        tags: [],
        unicodeVersion: "",
        iosVersion: "10.2",
        skinTones: true
    },
    {
        emoji: "🧑‍🍳",
        description: "cook",
        category: "People & Body",
        aliases: [
            "cook"
        ],
        tags: [],
        unicodeVersion: "12.1",
        iosVersion: "13.2",
        skinTones: true
    },
    {
        emoji: "👨‍🍳",
        description: "man cook",
        category: "People & Body",
        aliases: [
            "man_cook"
        ],
        tags: [
            "chef"
        ],
        unicodeVersion: "",
        iosVersion: "10.2",
        skinTones: true
    },
    {
        emoji: "👩‍🍳",
        description: "woman cook",
        category: "People & Body",
        aliases: [
            "woman_cook"
        ],
        tags: [
            "chef"
        ],
        unicodeVersion: "",
        iosVersion: "10.2",
        skinTones: true
    },
    {
        emoji: "🧑‍🔧",
        description: "mechanic",
        category: "People & Body",
        aliases: [
            "mechanic"
        ],
        tags: [],
        unicodeVersion: "12.1",
        iosVersion: "13.2",
        skinTones: true
    },
    {
        emoji: "👨‍🔧",
        description: "man mechanic",
        category: "People & Body",
        aliases: [
            "man_mechanic"
        ],
        tags: [],
        unicodeVersion: "",
        iosVersion: "10.2",
        skinTones: true
    },
    {
        emoji: "👩‍🔧",
        description: "woman mechanic",
        category: "People & Body",
        aliases: [
            "woman_mechanic"
        ],
        tags: [],
        unicodeVersion: "",
        iosVersion: "10.2",
        skinTones: true
    },
    {
        emoji: "🧑‍🏭",
        description: "factory worker",
        category: "People & Body",
        aliases: [
            "factory_worker"
        ],
        tags: [],
        unicodeVersion: "12.1",
        iosVersion: "13.2",
        skinTones: true
    },
    {
        emoji: "👨‍🏭",
        description: "man factory worker",
        category: "People & Body",
        aliases: [
            "man_factory_worker"
        ],
        tags: [],
        unicodeVersion: "",
        iosVersion: "10.2",
        skinTones: true
    },
    {
        emoji: "👩‍🏭",
        description: "woman factory worker",
        category: "People & Body",
        aliases: [
            "woman_factory_worker"
        ],
        tags: [],
        unicodeVersion: "",
        iosVersion: "10.2",
        skinTones: true
    },
    {
        emoji: "🧑‍💼",
        description: "office worker",
        category: "People & Body",
        aliases: [
            "office_worker"
        ],
        tags: [],
        unicodeVersion: "12.1",
        iosVersion: "13.2",
        skinTones: true
    },
    {
        emoji: "👨‍💼",
        description: "man office worker",
        category: "People & Body",
        aliases: [
            "man_office_worker"
        ],
        tags: [
            "business"
        ],
        unicodeVersion: "",
        iosVersion: "10.2",
        skinTones: true
    },
    {
        emoji: "👩‍💼",
        description: "woman office worker",
        category: "People & Body",
        aliases: [
            "woman_office_worker"
        ],
        tags: [
            "business"
        ],
        unicodeVersion: "",
        iosVersion: "10.2",
        skinTones: true
    },
    {
        emoji: "🧑‍🔬",
        description: "scientist",
        category: "People & Body",
        aliases: [
            "scientist"
        ],
        tags: [],
        unicodeVersion: "12.1",
        iosVersion: "13.2",
        skinTones: true
    },
    {
        emoji: "👨‍🔬",
        description: "man scientist",
        category: "People & Body",
        aliases: [
            "man_scientist"
        ],
        tags: [
            "research"
        ],
        unicodeVersion: "",
        iosVersion: "10.2",
        skinTones: true
    },
    {
        emoji: "👩‍🔬",
        description: "woman scientist",
        category: "People & Body",
        aliases: [
            "woman_scientist"
        ],
        tags: [
            "research"
        ],
        unicodeVersion: "",
        iosVersion: "10.2",
        skinTones: true
    },
    {
        emoji: "🧑‍💻",
        description: "technologist",
        category: "People & Body",
        aliases: [
            "technologist"
        ],
        tags: [],
        unicodeVersion: "12.1",
        iosVersion: "13.2",
        skinTones: true
    },
    {
        emoji: "👨‍💻",
        description: "man technologist",
        category: "People & Body",
        aliases: [
            "man_technologist"
        ],
        tags: [
            "coder"
        ],
        unicodeVersion: "",
        iosVersion: "10.2",
        skinTones: true
    },
    {
        emoji: "👩‍💻",
        description: "woman technologist",
        category: "People & Body",
        aliases: [
            "woman_technologist"
        ],
        tags: [
            "coder"
        ],
        unicodeVersion: "",
        iosVersion: "10.2",
        skinTones: true
    },
    {
        emoji: "🧑‍🎤",
        description: "singer",
        category: "People & Body",
        aliases: [
            "singer"
        ],
        tags: [],
        unicodeVersion: "12.1",
        iosVersion: "13.2",
        skinTones: true
    },
    {
        emoji: "👨‍🎤",
        description: "man singer",
        category: "People & Body",
        aliases: [
            "man_singer"
        ],
        tags: [
            "rockstar"
        ],
        unicodeVersion: "",
        iosVersion: "10.2",
        skinTones: true
    },
    {
        emoji: "👩‍🎤",
        description: "woman singer",
        category: "People & Body",
        aliases: [
            "woman_singer"
        ],
        tags: [
            "rockstar"
        ],
        unicodeVersion: "",
        iosVersion: "10.2",
        skinTones: true
    },
    {
        emoji: "🧑‍🎨",
        description: "artist",
        category: "People & Body",
        aliases: [
            "artist"
        ],
        tags: [],
        unicodeVersion: "12.1",
        iosVersion: "13.2",
        skinTones: true
    },
    {
        emoji: "👨‍🎨",
        description: "man artist",
        category: "People & Body",
        aliases: [
            "man_artist"
        ],
        tags: [
            "painter"
        ],
        unicodeVersion: "",
        iosVersion: "10.2",
        skinTones: true
    },
    {
        emoji: "👩‍🎨",
        description: "woman artist",
        category: "People & Body",
        aliases: [
            "woman_artist"
        ],
        tags: [
            "painter"
        ],
        unicodeVersion: "",
        iosVersion: "10.2",
        skinTones: true
    },
    {
        emoji: "🧑‍✈️",
        description: "pilot",
        category: "People & Body",
        aliases: [
            "pilot"
        ],
        tags: [],
        unicodeVersion: "12.1",
        iosVersion: "13.2",
        skinTones: true
    },
    {
        emoji: "👨‍✈️",
        description: "man pilot",
        category: "People & Body",
        aliases: [
            "man_pilot"
        ],
        tags: [],
        unicodeVersion: "",
        iosVersion: "10.2",
        skinTones: true
    },
    {
        emoji: "👩‍✈️",
        description: "woman pilot",
        category: "People & Body",
        aliases: [
            "woman_pilot"
        ],
        tags: [],
        unicodeVersion: "",
        iosVersion: "10.2",
        skinTones: true
    },
    {
        emoji: "🧑‍🚀",
        description: "astronaut",
        category: "People & Body",
        aliases: [
            "astronaut"
        ],
        tags: [],
        unicodeVersion: "12.1",
        iosVersion: "13.2",
        skinTones: true
    },
    {
        emoji: "👨‍🚀",
        description: "man astronaut",
        category: "People & Body",
        aliases: [
            "man_astronaut"
        ],
        tags: [
            "space"
        ],
        unicodeVersion: "",
        iosVersion: "10.2",
        skinTones: true
    },
    {
        emoji: "👩‍🚀",
        description: "woman astronaut",
        category: "People & Body",
        aliases: [
            "woman_astronaut"
        ],
        tags: [
            "space"
        ],
        unicodeVersion: "",
        iosVersion: "10.2",
        skinTones: true
    },
    {
        emoji: "🧑‍🚒",
        description: "firefighter",
        category: "People & Body",
        aliases: [
            "firefighter"
        ],
        tags: [],
        unicodeVersion: "12.1",
        iosVersion: "13.2",
        skinTones: true
    },
    {
        emoji: "👨‍🚒",
        description: "man firefighter",
        category: "People & Body",
        aliases: [
            "man_firefighter"
        ],
        tags: [],
        unicodeVersion: "",
        iosVersion: "10.2",
        skinTones: true
    },
    {
        emoji: "👩‍🚒",
        description: "woman firefighter",
        category: "People & Body",
        aliases: [
            "woman_firefighter"
        ],
        tags: [],
        unicodeVersion: "",
        iosVersion: "10.2",
        skinTones: true
    },
    {
        emoji: "👮",
        description: "police officer",
        category: "People & Body",
        aliases: [
            "police_officer",
            "cop"
        ],
        tags: [
            "law"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0",
        skinTones: true
    },
    {
        emoji: "👮‍♂️",
        description: "man police officer",
        category: "People & Body",
        aliases: [
            "policeman"
        ],
        tags: [
            "law",
            "cop"
        ],
        unicodeVersion: "11.0",
        iosVersion: "12.1",
        skinTones: true
    },
    {
        emoji: "👮‍♀️",
        description: "woman police officer",
        category: "People & Body",
        aliases: [
            "policewoman"
        ],
        tags: [
            "law",
            "cop"
        ],
        unicodeVersion: "6.0",
        iosVersion: "10.0",
        skinTones: true
    },
    {
        emoji: "🕵️",
        description: "detective",
        category: "People & Body",
        aliases: [
            "detective"
        ],
        tags: [
            "sleuth"
        ],
        unicodeVersion: "7.0",
        iosVersion: "9.1",
        skinTones: true
    },
    {
        emoji: "🕵️‍♂️",
        description: "man detective",
        category: "People & Body",
        aliases: [
            "male_detective"
        ],
        tags: [
            "sleuth"
        ],
        unicodeVersion: "11.0",
        iosVersion: "12.1",
        skinTones: true
    },
    {
        emoji: "🕵️‍♀️",
        description: "woman detective",
        category: "People & Body",
        aliases: [
            "female_detective"
        ],
        tags: [
            "sleuth"
        ],
        unicodeVersion: "6.0",
        iosVersion: "10.0",
        skinTones: true
    },
    {
        emoji: "💂",
        description: "guard",
        category: "People & Body",
        aliases: [
            "guard"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0",
        skinTones: true
    },
    {
        emoji: "💂‍♂️",
        description: "man guard",
        category: "People & Body",
        aliases: [
            "guardsman"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1",
        skinTones: true
    },
    {
        emoji: "💂‍♀️",
        description: "woman guard",
        category: "People & Body",
        aliases: [
            "guardswoman"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "10.0",
        skinTones: true
    },
    {
        emoji: "🥷",
        description: "ninja",
        category: "People & Body",
        aliases: [
            "ninja"
        ],
        tags: [],
        unicodeVersion: "13.0",
        iosVersion: "14.0",
        skinTones: true
    },
    {
        emoji: "👷",
        description: "construction worker",
        category: "People & Body",
        aliases: [
            "construction_worker"
        ],
        tags: [
            "helmet"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0",
        skinTones: true
    },
    {
        emoji: "👷‍♂️",
        description: "man construction worker",
        category: "People & Body",
        aliases: [
            "construction_worker_man"
        ],
        tags: [
            "helmet"
        ],
        unicodeVersion: "11.0",
        iosVersion: "12.1",
        skinTones: true
    },
    {
        emoji: "👷‍♀️",
        description: "woman construction worker",
        category: "People & Body",
        aliases: [
            "construction_worker_woman"
        ],
        tags: [
            "helmet"
        ],
        unicodeVersion: "6.0",
        iosVersion: "10.0",
        skinTones: true
    },
    {
        emoji: "🤴",
        description: "prince",
        category: "People & Body",
        aliases: [
            "prince"
        ],
        tags: [
            "crown",
            "royal"
        ],
        unicodeVersion: "9.0",
        iosVersion: "10.2",
        skinTones: true
    },
    {
        emoji: "👸",
        description: "princess",
        category: "People & Body",
        aliases: [
            "princess"
        ],
        tags: [
            "crown",
            "royal"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0",
        skinTones: true
    },
    {
        emoji: "👳",
        description: "person wearing turban",
        category: "People & Body",
        aliases: [
            "person_with_turban"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0",
        skinTones: true
    },
    {
        emoji: "👳‍♂️",
        description: "man wearing turban",
        category: "People & Body",
        aliases: [
            "man_with_turban"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1",
        skinTones: true
    },
    {
        emoji: "👳‍♀️",
        description: "woman wearing turban",
        category: "People & Body",
        aliases: [
            "woman_with_turban"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "10.0",
        skinTones: true
    },
    {
        emoji: "👲",
        description: "person with skullcap",
        category: "People & Body",
        aliases: [
            "man_with_gua_pi_mao"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0",
        skinTones: true
    },
    {
        emoji: "🧕",
        description: "woman with headscarf",
        category: "People & Body",
        aliases: [
            "woman_with_headscarf"
        ],
        tags: [
            "hijab"
        ],
        unicodeVersion: "11.0",
        iosVersion: "12.1",
        skinTones: true
    },
    {
        emoji: "🤵",
        description: "person in tuxedo",
        category: "People & Body",
        aliases: [
            "person_in_tuxedo"
        ],
        tags: [
            "groom",
            "marriage",
            "wedding"
        ],
        unicodeVersion: "9.0",
        iosVersion: "10.2",
        skinTones: true
    },
    {
        emoji: "🤵‍♂️",
        description: "man in tuxedo",
        category: "People & Body",
        aliases: [
            "man_in_tuxedo"
        ],
        tags: [],
        unicodeVersion: "13.0",
        iosVersion: "14.0",
        skinTones: true
    },
    {
        emoji: "🤵‍♀️",
        description: "woman in tuxedo",
        category: "People & Body",
        aliases: [
            "woman_in_tuxedo"
        ],
        tags: [],
        unicodeVersion: "13.0",
        iosVersion: "14.0",
        skinTones: true
    },
    {
        emoji: "👰",
        description: "person with veil",
        category: "People & Body",
        aliases: [
            "person_with_veil"
        ],
        tags: [
            "marriage",
            "wedding"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0",
        skinTones: true
    },
    {
        emoji: "👰‍♂️",
        description: "man with veil",
        category: "People & Body",
        aliases: [
            "man_with_veil"
        ],
        tags: [],
        unicodeVersion: "13.0",
        iosVersion: "14.0",
        skinTones: true
    },
    {
        emoji: "👰‍♀️",
        description: "woman with veil",
        category: "People & Body",
        aliases: [
            "woman_with_veil",
            "bride_with_veil"
        ],
        tags: [],
        unicodeVersion: "13.0",
        iosVersion: "14.0",
        skinTones: true
    },
    {
        emoji: "🤰",
        description: "pregnant woman",
        category: "People & Body",
        aliases: [
            "pregnant_woman"
        ],
        tags: [],
        unicodeVersion: "9.0",
        iosVersion: "10.2",
        skinTones: true
    },
    {
        emoji: "🤱",
        description: "breast-feeding",
        category: "People & Body",
        aliases: [
            "breast_feeding"
        ],
        tags: [
            "nursing"
        ],
        unicodeVersion: "11.0",
        iosVersion: "12.1",
        skinTones: true
    },
    {
        emoji: "👩‍🍼",
        description: "woman feeding baby",
        category: "People & Body",
        aliases: [
            "woman_feeding_baby"
        ],
        tags: [],
        unicodeVersion: "13.0",
        iosVersion: "14.0",
        skinTones: true
    },
    {
        emoji: "👨‍🍼",
        description: "man feeding baby",
        category: "People & Body",
        aliases: [
            "man_feeding_baby"
        ],
        tags: [],
        unicodeVersion: "13.0",
        iosVersion: "14.0",
        skinTones: true
    },
    {
        emoji: "🧑‍🍼",
        description: "person feeding baby",
        category: "People & Body",
        aliases: [
            "person_feeding_baby"
        ],
        tags: [],
        unicodeVersion: "13.0",
        iosVersion: "14.0",
        skinTones: true
    },
    {
        emoji: "👼",
        description: "baby angel",
        category: "People & Body",
        aliases: [
            "angel"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0",
        skinTones: true
    },
    {
        emoji: "🎅",
        description: "Santa Claus",
        category: "People & Body",
        aliases: [
            "santa"
        ],
        tags: [
            "christmas"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0",
        skinTones: true
    },
    {
        emoji: "🤶",
        description: "Mrs. Claus",
        category: "People & Body",
        aliases: [
            "mrs_claus"
        ],
        tags: [
            "santa"
        ],
        unicodeVersion: "9.0",
        iosVersion: "10.2",
        skinTones: true
    },
    {
        emoji: "🧑‍🎄",
        description: "mx claus",
        category: "People & Body",
        aliases: [
            "mx_claus"
        ],
        tags: [],
        unicodeVersion: "13.0",
        iosVersion: "14.0",
        skinTones: true
    },
    {
        emoji: "🦸",
        description: "superhero",
        category: "People & Body",
        aliases: [
            "superhero"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1",
        skinTones: true
    },
    {
        emoji: "🦸‍♂️",
        description: "man superhero",
        category: "People & Body",
        aliases: [
            "superhero_man"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1",
        skinTones: true
    },
    {
        emoji: "🦸‍♀️",
        description: "woman superhero",
        category: "People & Body",
        aliases: [
            "superhero_woman"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1",
        skinTones: true
    },
    {
        emoji: "🦹",
        description: "supervillain",
        category: "People & Body",
        aliases: [
            "supervillain"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1",
        skinTones: true
    },
    {
        emoji: "🦹‍♂️",
        description: "man supervillain",
        category: "People & Body",
        aliases: [
            "supervillain_man"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1",
        skinTones: true
    },
    {
        emoji: "🦹‍♀️",
        description: "woman supervillain",
        category: "People & Body",
        aliases: [
            "supervillain_woman"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1",
        skinTones: true
    },
    {
        emoji: "🧙",
        description: "mage",
        category: "People & Body",
        aliases: [
            "mage"
        ],
        tags: [
            "wizard"
        ],
        unicodeVersion: "11.0",
        iosVersion: "12.1",
        skinTones: true
    },
    {
        emoji: "🧙‍♂️",
        description: "man mage",
        category: "People & Body",
        aliases: [
            "mage_man"
        ],
        tags: [
            "wizard"
        ],
        unicodeVersion: "11.0",
        iosVersion: "12.1",
        skinTones: true
    },
    {
        emoji: "🧙‍♀️",
        description: "woman mage",
        category: "People & Body",
        aliases: [
            "mage_woman"
        ],
        tags: [
            "wizard"
        ],
        unicodeVersion: "11.0",
        iosVersion: "12.1",
        skinTones: true
    },
    {
        emoji: "🧚",
        description: "fairy",
        category: "People & Body",
        aliases: [
            "fairy"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1",
        skinTones: true
    },
    {
        emoji: "🧚‍♂️",
        description: "man fairy",
        category: "People & Body",
        aliases: [
            "fairy_man"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1",
        skinTones: true
    },
    {
        emoji: "🧚‍♀️",
        description: "woman fairy",
        category: "People & Body",
        aliases: [
            "fairy_woman"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1",
        skinTones: true
    },
    {
        emoji: "🧛",
        description: "vampire",
        category: "People & Body",
        aliases: [
            "vampire"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1",
        skinTones: true
    },
    {
        emoji: "🧛‍♂️",
        description: "man vampire",
        category: "People & Body",
        aliases: [
            "vampire_man"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1",
        skinTones: true
    },
    {
        emoji: "🧛‍♀️",
        description: "woman vampire",
        category: "People & Body",
        aliases: [
            "vampire_woman"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1",
        skinTones: true
    },
    {
        emoji: "🧜",
        description: "merperson",
        category: "People & Body",
        aliases: [
            "merperson"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1",
        skinTones: true
    },
    {
        emoji: "🧜‍♂️",
        description: "merman",
        category: "People & Body",
        aliases: [
            "merman"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1",
        skinTones: true
    },
    {
        emoji: "🧜‍♀️",
        description: "mermaid",
        category: "People & Body",
        aliases: [
            "mermaid"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1",
        skinTones: true
    },
    {
        emoji: "🧝",
        description: "elf",
        category: "People & Body",
        aliases: [
            "elf"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1",
        skinTones: true
    },
    {
        emoji: "🧝‍♂️",
        description: "man elf",
        category: "People & Body",
        aliases: [
            "elf_man"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1",
        skinTones: true
    },
    {
        emoji: "🧝‍♀️",
        description: "woman elf",
        category: "People & Body",
        aliases: [
            "elf_woman"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1",
        skinTones: true
    },
    {
        emoji: "🧞",
        description: "genie",
        category: "People & Body",
        aliases: [
            "genie"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🧞‍♂️",
        description: "man genie",
        category: "People & Body",
        aliases: [
            "genie_man"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🧞‍♀️",
        description: "woman genie",
        category: "People & Body",
        aliases: [
            "genie_woman"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🧟",
        description: "zombie",
        category: "People & Body",
        aliases: [
            "zombie"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🧟‍♂️",
        description: "man zombie",
        category: "People & Body",
        aliases: [
            "zombie_man"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🧟‍♀️",
        description: "woman zombie",
        category: "People & Body",
        aliases: [
            "zombie_woman"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "💆",
        description: "person getting massage",
        category: "People & Body",
        aliases: [
            "massage"
        ],
        tags: [
            "spa"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0",
        skinTones: true
    },
    {
        emoji: "💆‍♂️",
        description: "man getting massage",
        category: "People & Body",
        aliases: [
            "massage_man"
        ],
        tags: [
            "spa"
        ],
        unicodeVersion: "6.0",
        iosVersion: "10.0",
        skinTones: true
    },
    {
        emoji: "💆‍♀️",
        description: "woman getting massage",
        category: "People & Body",
        aliases: [
            "massage_woman"
        ],
        tags: [
            "spa"
        ],
        unicodeVersion: "11.0",
        iosVersion: "12.1",
        skinTones: true
    },
    {
        emoji: "💇",
        description: "person getting haircut",
        category: "People & Body",
        aliases: [
            "haircut"
        ],
        tags: [
            "beauty"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0",
        skinTones: true
    },
    {
        emoji: "💇‍♂️",
        description: "man getting haircut",
        category: "People & Body",
        aliases: [
            "haircut_man"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "10.0",
        skinTones: true
    },
    {
        emoji: "💇‍♀️",
        description: "woman getting haircut",
        category: "People & Body",
        aliases: [
            "haircut_woman"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1",
        skinTones: true
    },
    {
        emoji: "🚶",
        description: "person walking",
        category: "People & Body",
        aliases: [
            "walking"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0",
        skinTones: true
    },
    {
        emoji: "🚶‍♂️",
        description: "man walking",
        category: "People & Body",
        aliases: [
            "walking_man"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1",
        skinTones: true
    },
    {
        emoji: "🚶‍♀️",
        description: "woman walking",
        category: "People & Body",
        aliases: [
            "walking_woman"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "10.0",
        skinTones: true
    },
    {
        emoji: "🧍",
        description: "person standing",
        category: "People & Body",
        aliases: [
            "standing_person"
        ],
        tags: [],
        unicodeVersion: "12.0",
        iosVersion: "13.0",
        skinTones: true
    },
    {
        emoji: "🧍‍♂️",
        description: "man standing",
        category: "People & Body",
        aliases: [
            "standing_man"
        ],
        tags: [],
        unicodeVersion: "12.0",
        iosVersion: "13.0",
        skinTones: true
    },
    {
        emoji: "🧍‍♀️",
        description: "woman standing",
        category: "People & Body",
        aliases: [
            "standing_woman"
        ],
        tags: [],
        unicodeVersion: "12.0",
        iosVersion: "13.0",
        skinTones: true
    },
    {
        emoji: "🧎",
        description: "person kneeling",
        category: "People & Body",
        aliases: [
            "kneeling_person"
        ],
        tags: [],
        unicodeVersion: "12.0",
        iosVersion: "13.0",
        skinTones: true
    },
    {
        emoji: "🧎‍♂️",
        description: "man kneeling",
        category: "People & Body",
        aliases: [
            "kneeling_man"
        ],
        tags: [],
        unicodeVersion: "12.0",
        iosVersion: "13.0",
        skinTones: true
    },
    {
        emoji: "🧎‍♀️",
        description: "woman kneeling",
        category: "People & Body",
        aliases: [
            "kneeling_woman"
        ],
        tags: [],
        unicodeVersion: "12.0",
        iosVersion: "13.0",
        skinTones: true
    },
    {
        emoji: "🧑‍🦯",
        description: "person with white cane",
        category: "People & Body",
        aliases: [
            "person_with_probing_cane"
        ],
        tags: [],
        unicodeVersion: "12.1",
        iosVersion: "13.2",
        skinTones: true
    },
    {
        emoji: "👨‍🦯",
        description: "man with white cane",
        category: "People & Body",
        aliases: [
            "man_with_probing_cane"
        ],
        tags: [],
        unicodeVersion: "12.0",
        iosVersion: "13.0",
        skinTones: true
    },
    {
        emoji: "👩‍🦯",
        description: "woman with white cane",
        category: "People & Body",
        aliases: [
            "woman_with_probing_cane"
        ],
        tags: [],
        unicodeVersion: "12.0",
        iosVersion: "13.0",
        skinTones: true
    },
    {
        emoji: "🧑‍🦼",
        description: "person in motorized wheelchair",
        category: "People & Body",
        aliases: [
            "person_in_motorized_wheelchair"
        ],
        tags: [],
        unicodeVersion: "12.1",
        iosVersion: "13.2",
        skinTones: true
    },
    {
        emoji: "👨‍🦼",
        description: "man in motorized wheelchair",
        category: "People & Body",
        aliases: [
            "man_in_motorized_wheelchair"
        ],
        tags: [],
        unicodeVersion: "12.0",
        iosVersion: "13.0",
        skinTones: true
    },
    {
        emoji: "👩‍🦼",
        description: "woman in motorized wheelchair",
        category: "People & Body",
        aliases: [
            "woman_in_motorized_wheelchair"
        ],
        tags: [],
        unicodeVersion: "12.0",
        iosVersion: "13.0",
        skinTones: true
    },
    {
        emoji: "🧑‍🦽",
        description: "person in manual wheelchair",
        category: "People & Body",
        aliases: [
            "person_in_manual_wheelchair"
        ],
        tags: [],
        unicodeVersion: "12.1",
        iosVersion: "13.2",
        skinTones: true
    },
    {
        emoji: "👨‍🦽",
        description: "man in manual wheelchair",
        category: "People & Body",
        aliases: [
            "man_in_manual_wheelchair"
        ],
        tags: [],
        unicodeVersion: "12.0",
        iosVersion: "13.0",
        skinTones: true
    },
    {
        emoji: "👩‍🦽",
        description: "woman in manual wheelchair",
        category: "People & Body",
        aliases: [
            "woman_in_manual_wheelchair"
        ],
        tags: [],
        unicodeVersion: "12.0",
        iosVersion: "13.0",
        skinTones: true
    },
    {
        emoji: "🏃",
        description: "person running",
        category: "People & Body",
        aliases: [
            "runner",
            "running"
        ],
        tags: [
            "exercise",
            "workout",
            "marathon"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0",
        skinTones: true
    },
    {
        emoji: "🏃‍♂️",
        description: "man running",
        category: "People & Body",
        aliases: [
            "running_man"
        ],
        tags: [
            "exercise",
            "workout",
            "marathon"
        ],
        unicodeVersion: "11.0",
        iosVersion: "12.1",
        skinTones: true
    },
    {
        emoji: "🏃‍♀️",
        description: "woman running",
        category: "People & Body",
        aliases: [
            "running_woman"
        ],
        tags: [
            "exercise",
            "workout",
            "marathon"
        ],
        unicodeVersion: "6.0",
        iosVersion: "10.0",
        skinTones: true
    },
    {
        emoji: "💃",
        description: "woman dancing",
        category: "People & Body",
        aliases: [
            "woman_dancing",
            "dancer"
        ],
        tags: [
            "dress"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0",
        skinTones: true
    },
    {
        emoji: "🕺",
        description: "man dancing",
        category: "People & Body",
        aliases: [
            "man_dancing"
        ],
        tags: [
            "dancer"
        ],
        unicodeVersion: "9.0",
        iosVersion: "10.2",
        skinTones: true
    },
    {
        emoji: "🕴️",
        description: "person in suit levitating",
        category: "People & Body",
        aliases: [
            "business_suit_levitating"
        ],
        tags: [],
        unicodeVersion: "7.0",
        iosVersion: "9.1",
        skinTones: true
    },
    {
        emoji: "👯",
        description: "people with bunny ears",
        category: "People & Body",
        aliases: [
            "dancers"
        ],
        tags: [
            "bunny"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "👯‍♂️",
        description: "men with bunny ears",
        category: "People & Body",
        aliases: [
            "dancing_men"
        ],
        tags: [
            "bunny"
        ],
        unicodeVersion: "6.0",
        iosVersion: "10.0"
    },
    {
        emoji: "👯‍♀️",
        description: "women with bunny ears",
        category: "People & Body",
        aliases: [
            "dancing_women"
        ],
        tags: [
            "bunny"
        ],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🧖",
        description: "person in steamy room",
        category: "People & Body",
        aliases: [
            "sauna_person"
        ],
        tags: [
            "steamy"
        ],
        unicodeVersion: "11.0",
        iosVersion: "12.1",
        skinTones: true
    },
    {
        emoji: "🧖‍♂️",
        description: "man in steamy room",
        category: "People & Body",
        aliases: [
            "sauna_man"
        ],
        tags: [
            "steamy"
        ],
        unicodeVersion: "11.0",
        iosVersion: "12.1",
        skinTones: true
    },
    {
        emoji: "🧖‍♀️",
        description: "woman in steamy room",
        category: "People & Body",
        aliases: [
            "sauna_woman"
        ],
        tags: [
            "steamy"
        ],
        unicodeVersion: "11.0",
        iosVersion: "12.1",
        skinTones: true
    },
    {
        emoji: "🧗",
        description: "person climbing",
        category: "People & Body",
        aliases: [
            "climbing"
        ],
        tags: [
            "bouldering"
        ],
        unicodeVersion: "11.0",
        iosVersion: "12.1",
        skinTones: true
    },
    {
        emoji: "🧗‍♂️",
        description: "man climbing",
        category: "People & Body",
        aliases: [
            "climbing_man"
        ],
        tags: [
            "bouldering"
        ],
        unicodeVersion: "11.0",
        iosVersion: "12.1",
        skinTones: true
    },
    {
        emoji: "🧗‍♀️",
        description: "woman climbing",
        category: "People & Body",
        aliases: [
            "climbing_woman"
        ],
        tags: [
            "bouldering"
        ],
        unicodeVersion: "11.0",
        iosVersion: "12.1",
        skinTones: true
    },
    {
        emoji: "🤺",
        description: "person fencing",
        category: "People & Body",
        aliases: [
            "person_fencing"
        ],
        tags: [],
        unicodeVersion: "9.0",
        iosVersion: "10.2"
    },
    {
        emoji: "🏇",
        description: "horse racing",
        category: "People & Body",
        aliases: [
            "horse_racing"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0",
        skinTones: true
    },
    {
        emoji: "⛷️",
        description: "skier",
        category: "People & Body",
        aliases: [
            "skier"
        ],
        tags: [],
        unicodeVersion: "5.2",
        iosVersion: "9.1"
    },
    {
        emoji: "🏂",
        description: "snowboarder",
        category: "People & Body",
        aliases: [
            "snowboarder"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0",
        skinTones: true
    },
    {
        emoji: "🏌️",
        description: "person golfing",
        category: "People & Body",
        aliases: [
            "golfing"
        ],
        tags: [],
        unicodeVersion: "7.0",
        iosVersion: "9.1",
        skinTones: true
    },
    {
        emoji: "🏌️‍♂️",
        description: "man golfing",
        category: "People & Body",
        aliases: [
            "golfing_man"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1",
        skinTones: true
    },
    {
        emoji: "🏌️‍♀️",
        description: "woman golfing",
        category: "People & Body",
        aliases: [
            "golfing_woman"
        ],
        tags: [],
        unicodeVersion: "",
        iosVersion: "10.0",
        skinTones: true
    },
    {
        emoji: "🏄",
        description: "person surfing",
        category: "People & Body",
        aliases: [
            "surfer"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0",
        skinTones: true
    },
    {
        emoji: "🏄‍♂️",
        description: "man surfing",
        category: "People & Body",
        aliases: [
            "surfing_man"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1",
        skinTones: true
    },
    {
        emoji: "🏄‍♀️",
        description: "woman surfing",
        category: "People & Body",
        aliases: [
            "surfing_woman"
        ],
        tags: [],
        unicodeVersion: "7.0",
        iosVersion: "10.0",
        skinTones: true
    },
    {
        emoji: "🚣",
        description: "person rowing boat",
        category: "People & Body",
        aliases: [
            "rowboat"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0",
        skinTones: true
    },
    {
        emoji: "🚣‍♂️",
        description: "man rowing boat",
        category: "People & Body",
        aliases: [
            "rowing_man"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1",
        skinTones: true
    },
    {
        emoji: "🚣‍♀️",
        description: "woman rowing boat",
        category: "People & Body",
        aliases: [
            "rowing_woman"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "10.0",
        skinTones: true
    },
    {
        emoji: "🏊",
        description: "person swimming",
        category: "People & Body",
        aliases: [
            "swimmer"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0",
        skinTones: true
    },
    {
        emoji: "🏊‍♂️",
        description: "man swimming",
        category: "People & Body",
        aliases: [
            "swimming_man"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1",
        skinTones: true
    },
    {
        emoji: "🏊‍♀️",
        description: "woman swimming",
        category: "People & Body",
        aliases: [
            "swimming_woman"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "10.0",
        skinTones: true
    },
    {
        emoji: "⛹️",
        description: "person bouncing ball",
        category: "People & Body",
        aliases: [
            "bouncing_ball_person"
        ],
        tags: [
            "basketball"
        ],
        unicodeVersion: "5.2",
        iosVersion: "9.1",
        skinTones: true
    },
    {
        emoji: "⛹️‍♂️",
        description: "man bouncing ball",
        category: "People & Body",
        aliases: [
            "bouncing_ball_man",
            "basketball_man"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1",
        skinTones: true
    },
    {
        emoji: "⛹️‍♀️",
        description: "woman bouncing ball",
        category: "People & Body",
        aliases: [
            "bouncing_ball_woman",
            "basketball_woman"
        ],
        tags: [],
        unicodeVersion: "7.0",
        iosVersion: "10.0",
        skinTones: true
    },
    {
        emoji: "🏋️",
        description: "person lifting weights",
        category: "People & Body",
        aliases: [
            "weight_lifting"
        ],
        tags: [
            "gym",
            "workout"
        ],
        unicodeVersion: "7.0",
        iosVersion: "9.1",
        skinTones: true
    },
    {
        emoji: "🏋️‍♂️",
        description: "man lifting weights",
        category: "People & Body",
        aliases: [
            "weight_lifting_man"
        ],
        tags: [
            "gym",
            "workout"
        ],
        unicodeVersion: "11.0",
        iosVersion: "12.1",
        skinTones: true
    },
    {
        emoji: "🏋️‍♀️",
        description: "woman lifting weights",
        category: "People & Body",
        aliases: [
            "weight_lifting_woman"
        ],
        tags: [
            "gym",
            "workout"
        ],
        unicodeVersion: "6.0",
        iosVersion: "10.0",
        skinTones: true
    },
    {
        emoji: "🚴",
        description: "person biking",
        category: "People & Body",
        aliases: [
            "bicyclist"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0",
        skinTones: true
    },
    {
        emoji: "🚴‍♂️",
        description: "man biking",
        category: "People & Body",
        aliases: [
            "biking_man"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1",
        skinTones: true
    },
    {
        emoji: "🚴‍♀️",
        description: "woman biking",
        category: "People & Body",
        aliases: [
            "biking_woman"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "10.0",
        skinTones: true
    },
    {
        emoji: "🚵",
        description: "person mountain biking",
        category: "People & Body",
        aliases: [
            "mountain_bicyclist"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0",
        skinTones: true
    },
    {
        emoji: "🚵‍♂️",
        description: "man mountain biking",
        category: "People & Body",
        aliases: [
            "mountain_biking_man"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1",
        skinTones: true
    },
    {
        emoji: "🚵‍♀️",
        description: "woman mountain biking",
        category: "People & Body",
        aliases: [
            "mountain_biking_woman"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "10.0",
        skinTones: true
    },
    {
        emoji: "🤸",
        description: "person cartwheeling",
        category: "People & Body",
        aliases: [
            "cartwheeling"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1",
        skinTones: true
    },
    {
        emoji: "🤸‍♂️",
        description: "man cartwheeling",
        category: "People & Body",
        aliases: [
            "man_cartwheeling"
        ],
        tags: [],
        unicodeVersion: "",
        iosVersion: "10.2",
        skinTones: true
    },
    {
        emoji: "🤸‍♀️",
        description: "woman cartwheeling",
        category: "People & Body",
        aliases: [
            "woman_cartwheeling"
        ],
        tags: [],
        unicodeVersion: "",
        iosVersion: "10.2",
        skinTones: true
    },
    {
        emoji: "🤼",
        description: "people wrestling",
        category: "People & Body",
        aliases: [
            "wrestling"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🤼‍♂️",
        description: "men wrestling",
        category: "People & Body",
        aliases: [
            "men_wrestling"
        ],
        tags: [],
        unicodeVersion: "9.0",
        iosVersion: "10.2"
    },
    {
        emoji: "🤼‍♀️",
        description: "women wrestling",
        category: "People & Body",
        aliases: [
            "women_wrestling"
        ],
        tags: [],
        unicodeVersion: "9.0",
        iosVersion: "10.2"
    },
    {
        emoji: "🤽",
        description: "person playing water polo",
        category: "People & Body",
        aliases: [
            "water_polo"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1",
        skinTones: true
    },
    {
        emoji: "🤽‍♂️",
        description: "man playing water polo",
        category: "People & Body",
        aliases: [
            "man_playing_water_polo"
        ],
        tags: [],
        unicodeVersion: "9.0",
        iosVersion: "10.2",
        skinTones: true
    },
    {
        emoji: "🤽‍♀️",
        description: "woman playing water polo",
        category: "People & Body",
        aliases: [
            "woman_playing_water_polo"
        ],
        tags: [],
        unicodeVersion: "9.0",
        iosVersion: "10.2",
        skinTones: true
    },
    {
        emoji: "🤾",
        description: "person playing handball",
        category: "People & Body",
        aliases: [
            "handball_person"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1",
        skinTones: true
    },
    {
        emoji: "🤾‍♂️",
        description: "man playing handball",
        category: "People & Body",
        aliases: [
            "man_playing_handball"
        ],
        tags: [],
        unicodeVersion: "9.0",
        iosVersion: "10.2",
        skinTones: true
    },
    {
        emoji: "🤾‍♀️",
        description: "woman playing handball",
        category: "People & Body",
        aliases: [
            "woman_playing_handball"
        ],
        tags: [],
        unicodeVersion: "9.0",
        iosVersion: "10.2",
        skinTones: true
    },
    {
        emoji: "🤹",
        description: "person juggling",
        category: "People & Body",
        aliases: [
            "juggling_person"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1",
        skinTones: true
    },
    {
        emoji: "🤹‍♂️",
        description: "man juggling",
        category: "People & Body",
        aliases: [
            "man_juggling"
        ],
        tags: [],
        unicodeVersion: "9.0",
        iosVersion: "10.2",
        skinTones: true
    },
    {
        emoji: "🤹‍♀️",
        description: "woman juggling",
        category: "People & Body",
        aliases: [
            "woman_juggling"
        ],
        tags: [],
        unicodeVersion: "9.0",
        iosVersion: "10.2",
        skinTones: true
    },
    {
        emoji: "🧘",
        description: "person in lotus position",
        category: "People & Body",
        aliases: [
            "lotus_position"
        ],
        tags: [
            "meditation"
        ],
        unicodeVersion: "11.0",
        iosVersion: "12.1",
        skinTones: true
    },
    {
        emoji: "🧘‍♂️",
        description: "man in lotus position",
        category: "People & Body",
        aliases: [
            "lotus_position_man"
        ],
        tags: [
            "meditation"
        ],
        unicodeVersion: "11.0",
        iosVersion: "12.1",
        skinTones: true
    },
    {
        emoji: "🧘‍♀️",
        description: "woman in lotus position",
        category: "People & Body",
        aliases: [
            "lotus_position_woman"
        ],
        tags: [
            "meditation"
        ],
        unicodeVersion: "11.0",
        iosVersion: "12.1",
        skinTones: true
    },
    {
        emoji: "🛀",
        description: "person taking bath",
        category: "People & Body",
        aliases: [
            "bath"
        ],
        tags: [
            "shower"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0",
        skinTones: true
    },
    {
        emoji: "🛌",
        description: "person in bed",
        category: "People & Body",
        aliases: [
            "sleeping_bed"
        ],
        tags: [],
        unicodeVersion: "7.0",
        iosVersion: "9.1",
        skinTones: true
    },
    {
        emoji: "🧑‍🤝‍🧑",
        description: "people holding hands",
        category: "People & Body",
        aliases: [
            "people_holding_hands"
        ],
        tags: [
            "couple",
            "date"
        ],
        unicodeVersion: "12.0",
        iosVersion: "13.0",
        skinTones: true
    },
    {
        emoji: "👭",
        description: "women holding hands",
        category: "People & Body",
        aliases: [
            "two_women_holding_hands"
        ],
        tags: [
            "couple",
            "date"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0",
        skinTones: true
    },
    {
        emoji: "👫",
        description: "woman and man holding hands",
        category: "People & Body",
        aliases: [
            "couple"
        ],
        tags: [
            "date"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0",
        skinTones: true
    },
    {
        emoji: "👬",
        description: "men holding hands",
        category: "People & Body",
        aliases: [
            "two_men_holding_hands"
        ],
        tags: [
            "couple",
            "date"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0",
        skinTones: true
    },
    {
        emoji: "💏",
        description: "kiss",
        category: "People & Body",
        aliases: [
            "couplekiss"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "👩‍❤️‍💋‍👨",
        description: "kiss: woman, man",
        category: "People & Body",
        aliases: [
            "couplekiss_man_woman"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "👨‍❤️‍💋‍👨",
        description: "kiss: man, man",
        category: "People & Body",
        aliases: [
            "couplekiss_man_man"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "👩‍❤️‍💋‍👩",
        description: "kiss: woman, woman",
        category: "People & Body",
        aliases: [
            "couplekiss_woman_woman"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "💑",
        description: "couple with heart",
        category: "People & Body",
        aliases: [
            "couple_with_heart"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "👩‍❤️‍👨",
        description: "couple with heart: woman, man",
        category: "People & Body",
        aliases: [
            "couple_with_heart_woman_man"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "👨‍❤️‍👨",
        description: "couple with heart: man, man",
        category: "People & Body",
        aliases: [
            "couple_with_heart_man_man"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "👩‍❤️‍👩",
        description: "couple with heart: woman, woman",
        category: "People & Body",
        aliases: [
            "couple_with_heart_woman_woman"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "👪",
        description: "family",
        category: "People & Body",
        aliases: [
            "family"
        ],
        tags: [
            "home",
            "parents",
            "child"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "👨‍👩‍👦",
        description: "family: man, woman, boy",
        category: "People & Body",
        aliases: [
            "family_man_woman_boy"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "👨‍👩‍👧",
        description: "family: man, woman, girl",
        category: "People & Body",
        aliases: [
            "family_man_woman_girl"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "👨‍👩‍👧‍👦",
        description: "family: man, woman, girl, boy",
        category: "People & Body",
        aliases: [
            "family_man_woman_girl_boy"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "👨‍👩‍👦‍👦",
        description: "family: man, woman, boy, boy",
        category: "People & Body",
        aliases: [
            "family_man_woman_boy_boy"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "👨‍👩‍👧‍👧",
        description: "family: man, woman, girl, girl",
        category: "People & Body",
        aliases: [
            "family_man_woman_girl_girl"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "👨‍👨‍👦",
        description: "family: man, man, boy",
        category: "People & Body",
        aliases: [
            "family_man_man_boy"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "👨‍👨‍👧",
        description: "family: man, man, girl",
        category: "People & Body",
        aliases: [
            "family_man_man_girl"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "👨‍👨‍👧‍👦",
        description: "family: man, man, girl, boy",
        category: "People & Body",
        aliases: [
            "family_man_man_girl_boy"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "👨‍👨‍👦‍👦",
        description: "family: man, man, boy, boy",
        category: "People & Body",
        aliases: [
            "family_man_man_boy_boy"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "👨‍👨‍👧‍👧",
        description: "family: man, man, girl, girl",
        category: "People & Body",
        aliases: [
            "family_man_man_girl_girl"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "👩‍👩‍👦",
        description: "family: woman, woman, boy",
        category: "People & Body",
        aliases: [
            "family_woman_woman_boy"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "👩‍👩‍👧",
        description: "family: woman, woman, girl",
        category: "People & Body",
        aliases: [
            "family_woman_woman_girl"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "👩‍👩‍👧‍👦",
        description: "family: woman, woman, girl, boy",
        category: "People & Body",
        aliases: [
            "family_woman_woman_girl_boy"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "👩‍👩‍👦‍👦",
        description: "family: woman, woman, boy, boy",
        category: "People & Body",
        aliases: [
            "family_woman_woman_boy_boy"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "👩‍👩‍👧‍👧",
        description: "family: woman, woman, girl, girl",
        category: "People & Body",
        aliases: [
            "family_woman_woman_girl_girl"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "👨‍👦",
        description: "family: man, boy",
        category: "People & Body",
        aliases: [
            "family_man_boy"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "10.0"
    },
    {
        emoji: "👨‍👦‍👦",
        description: "family: man, boy, boy",
        category: "People & Body",
        aliases: [
            "family_man_boy_boy"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "10.0"
    },
    {
        emoji: "👨‍👧",
        description: "family: man, girl",
        category: "People & Body",
        aliases: [
            "family_man_girl"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "10.0"
    },
    {
        emoji: "👨‍👧‍👦",
        description: "family: man, girl, boy",
        category: "People & Body",
        aliases: [
            "family_man_girl_boy"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "10.0"
    },
    {
        emoji: "👨‍👧‍👧",
        description: "family: man, girl, girl",
        category: "People & Body",
        aliases: [
            "family_man_girl_girl"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "10.0"
    },
    {
        emoji: "👩‍👦",
        description: "family: woman, boy",
        category: "People & Body",
        aliases: [
            "family_woman_boy"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "10.0"
    },
    {
        emoji: "👩‍👦‍👦",
        description: "family: woman, boy, boy",
        category: "People & Body",
        aliases: [
            "family_woman_boy_boy"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "10.0"
    },
    {
        emoji: "👩‍👧",
        description: "family: woman, girl",
        category: "People & Body",
        aliases: [
            "family_woman_girl"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "10.0"
    },
    {
        emoji: "👩‍👧‍👦",
        description: "family: woman, girl, boy",
        category: "People & Body",
        aliases: [
            "family_woman_girl_boy"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "10.0"
    },
    {
        emoji: "👩‍👧‍👧",
        description: "family: woman, girl, girl",
        category: "People & Body",
        aliases: [
            "family_woman_girl_girl"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "10.0"
    },
    {
        emoji: "🗣️",
        description: "speaking head",
        category: "People & Body",
        aliases: [
            "speaking_head"
        ],
        tags: [],
        unicodeVersion: "7.0",
        iosVersion: "9.1"
    },
    {
        emoji: "👤",
        description: "bust in silhouette",
        category: "People & Body",
        aliases: [
            "bust_in_silhouette"
        ],
        tags: [
            "user"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "👥",
        description: "busts in silhouette",
        category: "People & Body",
        aliases: [
            "busts_in_silhouette"
        ],
        tags: [
            "users",
            "group",
            "team"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🫂",
        description: "people hugging",
        category: "People & Body",
        aliases: [
            "people_hugging"
        ],
        tags: [],
        unicodeVersion: "13.0",
        iosVersion: "14.0"
    },
    {
        emoji: "👣",
        description: "footprints",
        category: "People & Body",
        aliases: [
            "footprints"
        ],
        tags: [
            "feet",
            "tracks"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🐵",
        description: "monkey face",
        category: "Animals & Nature",
        aliases: [
            "monkey_face"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🐒",
        description: "monkey",
        category: "Animals & Nature",
        aliases: [
            "monkey"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🦍",
        description: "gorilla",
        category: "Animals & Nature",
        aliases: [
            "gorilla"
        ],
        tags: [],
        unicodeVersion: "9.0",
        iosVersion: "10.2"
    },
    {
        emoji: "🦧",
        description: "orangutan",
        category: "Animals & Nature",
        aliases: [
            "orangutan"
        ],
        tags: [],
        unicodeVersion: "12.0",
        iosVersion: "13.0"
    },
    {
        emoji: "🐶",
        description: "dog face",
        category: "Animals & Nature",
        aliases: [
            "dog"
        ],
        tags: [
            "pet"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🐕",
        description: "dog",
        category: "Animals & Nature",
        aliases: [
            "dog2"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🦮",
        description: "guide dog",
        category: "Animals & Nature",
        aliases: [
            "guide_dog"
        ],
        tags: [],
        unicodeVersion: "12.0",
        iosVersion: "13.0"
    },
    {
        emoji: "🐕‍🦺",
        description: "service dog",
        category: "Animals & Nature",
        aliases: [
            "service_dog"
        ],
        tags: [],
        unicodeVersion: "12.0",
        iosVersion: "13.0"
    },
    {
        emoji: "🐩",
        description: "poodle",
        category: "Animals & Nature",
        aliases: [
            "poodle"
        ],
        tags: [
            "dog"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🐺",
        description: "wolf",
        category: "Animals & Nature",
        aliases: [
            "wolf"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🦊",
        description: "fox",
        category: "Animals & Nature",
        aliases: [
            "fox_face"
        ],
        tags: [],
        unicodeVersion: "9.0",
        iosVersion: "10.2"
    },
    {
        emoji: "🦝",
        description: "raccoon",
        category: "Animals & Nature",
        aliases: [
            "raccoon"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🐱",
        description: "cat face",
        category: "Animals & Nature",
        aliases: [
            "cat"
        ],
        tags: [
            "pet"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🐈",
        description: "cat",
        category: "Animals & Nature",
        aliases: [
            "cat2"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🐈‍⬛",
        description: "black cat",
        category: "Animals & Nature",
        aliases: [
            "black_cat"
        ],
        tags: [],
        unicodeVersion: "13.0",
        iosVersion: "14.0"
    },
    {
        emoji: "🦁",
        description: "lion",
        category: "Animals & Nature",
        aliases: [
            "lion"
        ],
        tags: [],
        unicodeVersion: "8.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🐯",
        description: "tiger face",
        category: "Animals & Nature",
        aliases: [
            "tiger"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🐅",
        description: "tiger",
        category: "Animals & Nature",
        aliases: [
            "tiger2"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🐆",
        description: "leopard",
        category: "Animals & Nature",
        aliases: [
            "leopard"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🐴",
        description: "horse face",
        category: "Animals & Nature",
        aliases: [
            "horse"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🐎",
        description: "horse",
        category: "Animals & Nature",
        aliases: [
            "racehorse"
        ],
        tags: [
            "speed"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🦄",
        description: "unicorn",
        category: "Animals & Nature",
        aliases: [
            "unicorn"
        ],
        tags: [],
        unicodeVersion: "8.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🦓",
        description: "zebra",
        category: "Animals & Nature",
        aliases: [
            "zebra"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🦌",
        description: "deer",
        category: "Animals & Nature",
        aliases: [
            "deer"
        ],
        tags: [],
        unicodeVersion: "9.0",
        iosVersion: "10.2"
    },
    {
        emoji: "🦬",
        description: "bison",
        category: "Animals & Nature",
        aliases: [
            "bison"
        ],
        tags: [],
        unicodeVersion: "13.0",
        iosVersion: "14.0"
    },
    {
        emoji: "🐮",
        description: "cow face",
        category: "Animals & Nature",
        aliases: [
            "cow"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🐂",
        description: "ox",
        category: "Animals & Nature",
        aliases: [
            "ox"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🐃",
        description: "water buffalo",
        category: "Animals & Nature",
        aliases: [
            "water_buffalo"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🐄",
        description: "cow",
        category: "Animals & Nature",
        aliases: [
            "cow2"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🐷",
        description: "pig face",
        category: "Animals & Nature",
        aliases: [
            "pig"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🐖",
        description: "pig",
        category: "Animals & Nature",
        aliases: [
            "pig2"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🐗",
        description: "boar",
        category: "Animals & Nature",
        aliases: [
            "boar"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🐽",
        description: "pig nose",
        category: "Animals & Nature",
        aliases: [
            "pig_nose"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🐏",
        description: "ram",
        category: "Animals & Nature",
        aliases: [
            "ram"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🐑",
        description: "ewe",
        category: "Animals & Nature",
        aliases: [
            "sheep"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🐐",
        description: "goat",
        category: "Animals & Nature",
        aliases: [
            "goat"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🐪",
        description: "camel",
        category: "Animals & Nature",
        aliases: [
            "dromedary_camel"
        ],
        tags: [
            "desert"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🐫",
        description: "two-hump camel",
        category: "Animals & Nature",
        aliases: [
            "camel"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🦙",
        description: "llama",
        category: "Animals & Nature",
        aliases: [
            "llama"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🦒",
        description: "giraffe",
        category: "Animals & Nature",
        aliases: [
            "giraffe"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🐘",
        description: "elephant",
        category: "Animals & Nature",
        aliases: [
            "elephant"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🦣",
        description: "mammoth",
        category: "Animals & Nature",
        aliases: [
            "mammoth"
        ],
        tags: [],
        unicodeVersion: "13.0",
        iosVersion: "14.0"
    },
    {
        emoji: "🦏",
        description: "rhinoceros",
        category: "Animals & Nature",
        aliases: [
            "rhinoceros"
        ],
        tags: [],
        unicodeVersion: "9.0",
        iosVersion: "10.2"
    },
    {
        emoji: "🦛",
        description: "hippopotamus",
        category: "Animals & Nature",
        aliases: [
            "hippopotamus"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🐭",
        description: "mouse face",
        category: "Animals & Nature",
        aliases: [
            "mouse"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🐁",
        description: "mouse",
        category: "Animals & Nature",
        aliases: [
            "mouse2"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🐀",
        description: "rat",
        category: "Animals & Nature",
        aliases: [
            "rat"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🐹",
        description: "hamster",
        category: "Animals & Nature",
        aliases: [
            "hamster"
        ],
        tags: [
            "pet"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🐰",
        description: "rabbit face",
        category: "Animals & Nature",
        aliases: [
            "rabbit"
        ],
        tags: [
            "bunny"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🐇",
        description: "rabbit",
        category: "Animals & Nature",
        aliases: [
            "rabbit2"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🐿️",
        description: "chipmunk",
        category: "Animals & Nature",
        aliases: [
            "chipmunk"
        ],
        tags: [],
        unicodeVersion: "7.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🦫",
        description: "beaver",
        category: "Animals & Nature",
        aliases: [
            "beaver"
        ],
        tags: [],
        unicodeVersion: "13.0",
        iosVersion: "14.0"
    },
    {
        emoji: "🦔",
        description: "hedgehog",
        category: "Animals & Nature",
        aliases: [
            "hedgehog"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🦇",
        description: "bat",
        category: "Animals & Nature",
        aliases: [
            "bat"
        ],
        tags: [],
        unicodeVersion: "9.0",
        iosVersion: "10.2"
    },
    {
        emoji: "🐻",
        description: "bear",
        category: "Animals & Nature",
        aliases: [
            "bear"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🐻‍❄️",
        description: "polar bear",
        category: "Animals & Nature",
        aliases: [
            "polar_bear"
        ],
        tags: [],
        unicodeVersion: "13.0",
        iosVersion: "14.0"
    },
    {
        emoji: "🐨",
        description: "koala",
        category: "Animals & Nature",
        aliases: [
            "koala"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🐼",
        description: "panda",
        category: "Animals & Nature",
        aliases: [
            "panda_face"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🦥",
        description: "sloth",
        category: "Animals & Nature",
        aliases: [
            "sloth"
        ],
        tags: [],
        unicodeVersion: "12.0",
        iosVersion: "13.0"
    },
    {
        emoji: "🦦",
        description: "otter",
        category: "Animals & Nature",
        aliases: [
            "otter"
        ],
        tags: [],
        unicodeVersion: "12.0",
        iosVersion: "13.0"
    },
    {
        emoji: "🦨",
        description: "skunk",
        category: "Animals & Nature",
        aliases: [
            "skunk"
        ],
        tags: [],
        unicodeVersion: "12.0",
        iosVersion: "13.0"
    },
    {
        emoji: "🦘",
        description: "kangaroo",
        category: "Animals & Nature",
        aliases: [
            "kangaroo"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🦡",
        description: "badger",
        category: "Animals & Nature",
        aliases: [
            "badger"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🐾",
        description: "paw prints",
        category: "Animals & Nature",
        aliases: [
            "feet",
            "paw_prints"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🦃",
        description: "turkey",
        category: "Animals & Nature",
        aliases: [
            "turkey"
        ],
        tags: [
            "thanksgiving"
        ],
        unicodeVersion: "8.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🐔",
        description: "chicken",
        category: "Animals & Nature",
        aliases: [
            "chicken"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🐓",
        description: "rooster",
        category: "Animals & Nature",
        aliases: [
            "rooster"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🐣",
        description: "hatching chick",
        category: "Animals & Nature",
        aliases: [
            "hatching_chick"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🐤",
        description: "baby chick",
        category: "Animals & Nature",
        aliases: [
            "baby_chick"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🐥",
        description: "front-facing baby chick",
        category: "Animals & Nature",
        aliases: [
            "hatched_chick"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🐦",
        description: "bird",
        category: "Animals & Nature",
        aliases: [
            "bird"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🐧",
        description: "penguin",
        category: "Animals & Nature",
        aliases: [
            "penguin"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🕊️",
        description: "dove",
        category: "Animals & Nature",
        aliases: [
            "dove"
        ],
        tags: [
            "peace"
        ],
        unicodeVersion: "7.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🦅",
        description: "eagle",
        category: "Animals & Nature",
        aliases: [
            "eagle"
        ],
        tags: [],
        unicodeVersion: "9.0",
        iosVersion: "10.2"
    },
    {
        emoji: "🦆",
        description: "duck",
        category: "Animals & Nature",
        aliases: [
            "duck"
        ],
        tags: [],
        unicodeVersion: "9.0",
        iosVersion: "10.2"
    },
    {
        emoji: "🦢",
        description: "swan",
        category: "Animals & Nature",
        aliases: [
            "swan"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🦉",
        description: "owl",
        category: "Animals & Nature",
        aliases: [
            "owl"
        ],
        tags: [],
        unicodeVersion: "9.0",
        iosVersion: "10.2"
    },
    {
        emoji: "🦤",
        description: "dodo",
        category: "Animals & Nature",
        aliases: [
            "dodo"
        ],
        tags: [],
        unicodeVersion: "13.0",
        iosVersion: "14.0"
    },
    {
        emoji: "🪶",
        description: "feather",
        category: "Animals & Nature",
        aliases: [
            "feather"
        ],
        tags: [],
        unicodeVersion: "13.0",
        iosVersion: "14.0"
    },
    {
        emoji: "🦩",
        description: "flamingo",
        category: "Animals & Nature",
        aliases: [
            "flamingo"
        ],
        tags: [],
        unicodeVersion: "12.0",
        iosVersion: "13.0"
    },
    {
        emoji: "🦚",
        description: "peacock",
        category: "Animals & Nature",
        aliases: [
            "peacock"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🦜",
        description: "parrot",
        category: "Animals & Nature",
        aliases: [
            "parrot"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🐸",
        description: "frog",
        category: "Animals & Nature",
        aliases: [
            "frog"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🐊",
        description: "crocodile",
        category: "Animals & Nature",
        aliases: [
            "crocodile"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🐢",
        description: "turtle",
        category: "Animals & Nature",
        aliases: [
            "turtle"
        ],
        tags: [
            "slow"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🦎",
        description: "lizard",
        category: "Animals & Nature",
        aliases: [
            "lizard"
        ],
        tags: [],
        unicodeVersion: "9.0",
        iosVersion: "10.2"
    },
    {
        emoji: "🐍",
        description: "snake",
        category: "Animals & Nature",
        aliases: [
            "snake"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🐲",
        description: "dragon face",
        category: "Animals & Nature",
        aliases: [
            "dragon_face"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🐉",
        description: "dragon",
        category: "Animals & Nature",
        aliases: [
            "dragon"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🦕",
        description: "sauropod",
        category: "Animals & Nature",
        aliases: [
            "sauropod"
        ],
        tags: [
            "dinosaur"
        ],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🦖",
        description: "T-Rex",
        category: "Animals & Nature",
        aliases: [
            "t-rex"
        ],
        tags: [
            "dinosaur"
        ],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🐳",
        description: "spouting whale",
        category: "Animals & Nature",
        aliases: [
            "whale"
        ],
        tags: [
            "sea"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🐋",
        description: "whale",
        category: "Animals & Nature",
        aliases: [
            "whale2"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🐬",
        description: "dolphin",
        category: "Animals & Nature",
        aliases: [
            "dolphin",
            "flipper"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🦭",
        description: "seal",
        category: "Animals & Nature",
        aliases: [
            "seal"
        ],
        tags: [],
        unicodeVersion: "13.0",
        iosVersion: "14.0"
    },
    {
        emoji: "🐟",
        description: "fish",
        category: "Animals & Nature",
        aliases: [
            "fish"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🐠",
        description: "tropical fish",
        category: "Animals & Nature",
        aliases: [
            "tropical_fish"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🐡",
        description: "blowfish",
        category: "Animals & Nature",
        aliases: [
            "blowfish"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🦈",
        description: "shark",
        category: "Animals & Nature",
        aliases: [
            "shark"
        ],
        tags: [],
        unicodeVersion: "9.0",
        iosVersion: "10.2"
    },
    {
        emoji: "🐙",
        description: "octopus",
        category: "Animals & Nature",
        aliases: [
            "octopus"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🐚",
        description: "spiral shell",
        category: "Animals & Nature",
        aliases: [
            "shell"
        ],
        tags: [
            "sea",
            "beach"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🐌",
        description: "snail",
        category: "Animals & Nature",
        aliases: [
            "snail"
        ],
        tags: [
            "slow"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🦋",
        description: "butterfly",
        category: "Animals & Nature",
        aliases: [
            "butterfly"
        ],
        tags: [],
        unicodeVersion: "9.0",
        iosVersion: "10.2"
    },
    {
        emoji: "🐛",
        description: "bug",
        category: "Animals & Nature",
        aliases: [
            "bug"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🐜",
        description: "ant",
        category: "Animals & Nature",
        aliases: [
            "ant"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🐝",
        description: "honeybee",
        category: "Animals & Nature",
        aliases: [
            "bee",
            "honeybee"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🪲",
        description: "beetle",
        category: "Animals & Nature",
        aliases: [
            "beetle"
        ],
        tags: [],
        unicodeVersion: "13.0",
        iosVersion: "14.0"
    },
    {
        emoji: "🐞",
        description: "lady beetle",
        category: "Animals & Nature",
        aliases: [
            "lady_beetle"
        ],
        tags: [
            "bug"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🦗",
        description: "cricket",
        category: "Animals & Nature",
        aliases: [
            "cricket"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🪳",
        description: "cockroach",
        category: "Animals & Nature",
        aliases: [
            "cockroach"
        ],
        tags: [],
        unicodeVersion: "13.0",
        iosVersion: "14.0"
    },
    {
        emoji: "🕷️",
        description: "spider",
        category: "Animals & Nature",
        aliases: [
            "spider"
        ],
        tags: [],
        unicodeVersion: "7.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🕸️",
        description: "spider web",
        category: "Animals & Nature",
        aliases: [
            "spider_web"
        ],
        tags: [],
        unicodeVersion: "7.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🦂",
        description: "scorpion",
        category: "Animals & Nature",
        aliases: [
            "scorpion"
        ],
        tags: [],
        unicodeVersion: "8.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🦟",
        description: "mosquito",
        category: "Animals & Nature",
        aliases: [
            "mosquito"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🪰",
        description: "fly",
        category: "Animals & Nature",
        aliases: [
            "fly"
        ],
        tags: [],
        unicodeVersion: "13.0",
        iosVersion: "14.0"
    },
    {
        emoji: "🪱",
        description: "worm",
        category: "Animals & Nature",
        aliases: [
            "worm"
        ],
        tags: [],
        unicodeVersion: "13.0",
        iosVersion: "14.0"
    },
    {
        emoji: "🦠",
        description: "microbe",
        category: "Animals & Nature",
        aliases: [
            "microbe"
        ],
        tags: [
            "germ"
        ],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "💐",
        description: "bouquet",
        category: "Animals & Nature",
        aliases: [
            "bouquet"
        ],
        tags: [
            "flowers"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🌸",
        description: "cherry blossom",
        category: "Animals & Nature",
        aliases: [
            "cherry_blossom"
        ],
        tags: [
            "flower",
            "spring"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "💮",
        description: "white flower",
        category: "Animals & Nature",
        aliases: [
            "white_flower"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🏵️",
        description: "rosette",
        category: "Animals & Nature",
        aliases: [
            "rosette"
        ],
        tags: [],
        unicodeVersion: "7.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🌹",
        description: "rose",
        category: "Animals & Nature",
        aliases: [
            "rose"
        ],
        tags: [
            "flower"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🥀",
        description: "wilted flower",
        category: "Animals & Nature",
        aliases: [
            "wilted_flower"
        ],
        tags: [],
        unicodeVersion: "9.0",
        iosVersion: "10.2"
    },
    {
        emoji: "🌺",
        description: "hibiscus",
        category: "Animals & Nature",
        aliases: [
            "hibiscus"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🌻",
        description: "sunflower",
        category: "Animals & Nature",
        aliases: [
            "sunflower"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🌼",
        description: "blossom",
        category: "Animals & Nature",
        aliases: [
            "blossom"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🌷",
        description: "tulip",
        category: "Animals & Nature",
        aliases: [
            "tulip"
        ],
        tags: [
            "flower"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🌱",
        description: "seedling",
        category: "Animals & Nature",
        aliases: [
            "seedling"
        ],
        tags: [
            "plant"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🪴",
        description: "potted plant",
        category: "Animals & Nature",
        aliases: [
            "potted_plant"
        ],
        tags: [],
        unicodeVersion: "13.0",
        iosVersion: "14.0"
    },
    {
        emoji: "🌲",
        description: "evergreen tree",
        category: "Animals & Nature",
        aliases: [
            "evergreen_tree"
        ],
        tags: [
            "wood"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🌳",
        description: "deciduous tree",
        category: "Animals & Nature",
        aliases: [
            "deciduous_tree"
        ],
        tags: [
            "wood"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🌴",
        description: "palm tree",
        category: "Animals & Nature",
        aliases: [
            "palm_tree"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🌵",
        description: "cactus",
        category: "Animals & Nature",
        aliases: [
            "cactus"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🌾",
        description: "sheaf of rice",
        category: "Animals & Nature",
        aliases: [
            "ear_of_rice"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🌿",
        description: "herb",
        category: "Animals & Nature",
        aliases: [
            "herb"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "☘️",
        description: "shamrock",
        category: "Animals & Nature",
        aliases: [
            "shamrock"
        ],
        tags: [],
        unicodeVersion: "4.1",
        iosVersion: "9.1"
    },
    {
        emoji: "🍀",
        description: "four leaf clover",
        category: "Animals & Nature",
        aliases: [
            "four_leaf_clover"
        ],
        tags: [
            "luck"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🍁",
        description: "maple leaf",
        category: "Animals & Nature",
        aliases: [
            "maple_leaf"
        ],
        tags: [
            "canada"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🍂",
        description: "fallen leaf",
        category: "Animals & Nature",
        aliases: [
            "fallen_leaf"
        ],
        tags: [
            "autumn"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🍃",
        description: "leaf fluttering in wind",
        category: "Animals & Nature",
        aliases: [
            "leaves"
        ],
        tags: [
            "leaf"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🍇",
        description: "grapes",
        category: "Food & Drink",
        aliases: [
            "grapes"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🍈",
        description: "melon",
        category: "Food & Drink",
        aliases: [
            "melon"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🍉",
        description: "watermelon",
        category: "Food & Drink",
        aliases: [
            "watermelon"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🍊",
        description: "tangerine",
        category: "Food & Drink",
        aliases: [
            "tangerine",
            "orange",
            "mandarin"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🍋",
        description: "lemon",
        category: "Food & Drink",
        aliases: [
            "lemon"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🍌",
        description: "banana",
        category: "Food & Drink",
        aliases: [
            "banana"
        ],
        tags: [
            "fruit"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🍍",
        description: "pineapple",
        category: "Food & Drink",
        aliases: [
            "pineapple"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🥭",
        description: "mango",
        category: "Food & Drink",
        aliases: [
            "mango"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🍎",
        description: "red apple",
        category: "Food & Drink",
        aliases: [
            "apple"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🍏",
        description: "green apple",
        category: "Food & Drink",
        aliases: [
            "green_apple"
        ],
        tags: [
            "fruit"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🍐",
        description: "pear",
        category: "Food & Drink",
        aliases: [
            "pear"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🍑",
        description: "peach",
        category: "Food & Drink",
        aliases: [
            "peach"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🍒",
        description: "cherries",
        category: "Food & Drink",
        aliases: [
            "cherries"
        ],
        tags: [
            "fruit"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🍓",
        description: "strawberry",
        category: "Food & Drink",
        aliases: [
            "strawberry"
        ],
        tags: [
            "fruit"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🫐",
        description: "blueberries",
        category: "Food & Drink",
        aliases: [
            "blueberries"
        ],
        tags: [],
        unicodeVersion: "13.0",
        iosVersion: "14.0"
    },
    {
        emoji: "🥝",
        description: "kiwi fruit",
        category: "Food & Drink",
        aliases: [
            "kiwi_fruit"
        ],
        tags: [],
        unicodeVersion: "9.0",
        iosVersion: "10.2"
    },
    {
        emoji: "🍅",
        description: "tomato",
        category: "Food & Drink",
        aliases: [
            "tomato"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🫒",
        description: "olive",
        category: "Food & Drink",
        aliases: [
            "olive"
        ],
        tags: [],
        unicodeVersion: "13.0",
        iosVersion: "14.0"
    },
    {
        emoji: "🥥",
        description: "coconut",
        category: "Food & Drink",
        aliases: [
            "coconut"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🥑",
        description: "avocado",
        category: "Food & Drink",
        aliases: [
            "avocado"
        ],
        tags: [],
        unicodeVersion: "9.0",
        iosVersion: "10.2"
    },
    {
        emoji: "🍆",
        description: "eggplant",
        category: "Food & Drink",
        aliases: [
            "eggplant"
        ],
        tags: [
            "aubergine"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🥔",
        description: "potato",
        category: "Food & Drink",
        aliases: [
            "potato"
        ],
        tags: [],
        unicodeVersion: "9.0",
        iosVersion: "10.2"
    },
    {
        emoji: "🥕",
        description: "carrot",
        category: "Food & Drink",
        aliases: [
            "carrot"
        ],
        tags: [],
        unicodeVersion: "9.0",
        iosVersion: "10.2"
    },
    {
        emoji: "🌽",
        description: "ear of corn",
        category: "Food & Drink",
        aliases: [
            "corn"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🌶️",
        description: "hot pepper",
        category: "Food & Drink",
        aliases: [
            "hot_pepper"
        ],
        tags: [
            "spicy"
        ],
        unicodeVersion: "7.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🫑",
        description: "bell pepper",
        category: "Food & Drink",
        aliases: [
            "bell_pepper"
        ],
        tags: [],
        unicodeVersion: "13.0",
        iosVersion: "14.0"
    },
    {
        emoji: "🥒",
        description: "cucumber",
        category: "Food & Drink",
        aliases: [
            "cucumber"
        ],
        tags: [],
        unicodeVersion: "9.0",
        iosVersion: "10.2"
    },
    {
        emoji: "🥬",
        description: "leafy green",
        category: "Food & Drink",
        aliases: [
            "leafy_green"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🥦",
        description: "broccoli",
        category: "Food & Drink",
        aliases: [
            "broccoli"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🧄",
        description: "garlic",
        category: "Food & Drink",
        aliases: [
            "garlic"
        ],
        tags: [],
        unicodeVersion: "12.0",
        iosVersion: "13.0"
    },
    {
        emoji: "🧅",
        description: "onion",
        category: "Food & Drink",
        aliases: [
            "onion"
        ],
        tags: [],
        unicodeVersion: "12.0",
        iosVersion: "13.0"
    },
    {
        emoji: "🍄",
        description: "mushroom",
        category: "Food & Drink",
        aliases: [
            "mushroom"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🥜",
        description: "peanuts",
        category: "Food & Drink",
        aliases: [
            "peanuts"
        ],
        tags: [],
        unicodeVersion: "9.0",
        iosVersion: "10.2"
    },
    {
        emoji: "🌰",
        description: "chestnut",
        category: "Food & Drink",
        aliases: [
            "chestnut"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🍞",
        description: "bread",
        category: "Food & Drink",
        aliases: [
            "bread"
        ],
        tags: [
            "toast"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🥐",
        description: "croissant",
        category: "Food & Drink",
        aliases: [
            "croissant"
        ],
        tags: [],
        unicodeVersion: "9.0",
        iosVersion: "10.2"
    },
    {
        emoji: "🥖",
        description: "baguette bread",
        category: "Food & Drink",
        aliases: [
            "baguette_bread"
        ],
        tags: [],
        unicodeVersion: "9.0",
        iosVersion: "10.2"
    },
    {
        emoji: "🫓",
        description: "flatbread",
        category: "Food & Drink",
        aliases: [
            "flatbread"
        ],
        tags: [],
        unicodeVersion: "13.0",
        iosVersion: "14.0"
    },
    {
        emoji: "🥨",
        description: "pretzel",
        category: "Food & Drink",
        aliases: [
            "pretzel"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🥯",
        description: "bagel",
        category: "Food & Drink",
        aliases: [
            "bagel"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🥞",
        description: "pancakes",
        category: "Food & Drink",
        aliases: [
            "pancakes"
        ],
        tags: [],
        unicodeVersion: "9.0",
        iosVersion: "10.2"
    },
    {
        emoji: "🧇",
        description: "waffle",
        category: "Food & Drink",
        aliases: [
            "waffle"
        ],
        tags: [],
        unicodeVersion: "12.0",
        iosVersion: "13.0"
    },
    {
        emoji: "🧀",
        description: "cheese wedge",
        category: "Food & Drink",
        aliases: [
            "cheese"
        ],
        tags: [],
        unicodeVersion: "8.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🍖",
        description: "meat on bone",
        category: "Food & Drink",
        aliases: [
            "meat_on_bone"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🍗",
        description: "poultry leg",
        category: "Food & Drink",
        aliases: [
            "poultry_leg"
        ],
        tags: [
            "meat",
            "chicken"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🥩",
        description: "cut of meat",
        category: "Food & Drink",
        aliases: [
            "cut_of_meat"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🥓",
        description: "bacon",
        category: "Food & Drink",
        aliases: [
            "bacon"
        ],
        tags: [],
        unicodeVersion: "9.0",
        iosVersion: "10.2"
    },
    {
        emoji: "🍔",
        description: "hamburger",
        category: "Food & Drink",
        aliases: [
            "hamburger"
        ],
        tags: [
            "burger"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🍟",
        description: "french fries",
        category: "Food & Drink",
        aliases: [
            "fries"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🍕",
        description: "pizza",
        category: "Food & Drink",
        aliases: [
            "pizza"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🌭",
        description: "hot dog",
        category: "Food & Drink",
        aliases: [
            "hotdog"
        ],
        tags: [],
        unicodeVersion: "8.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🥪",
        description: "sandwich",
        category: "Food & Drink",
        aliases: [
            "sandwich"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🌮",
        description: "taco",
        category: "Food & Drink",
        aliases: [
            "taco"
        ],
        tags: [],
        unicodeVersion: "8.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🌯",
        description: "burrito",
        category: "Food & Drink",
        aliases: [
            "burrito"
        ],
        tags: [],
        unicodeVersion: "8.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🫔",
        description: "tamale",
        category: "Food & Drink",
        aliases: [
            "tamale"
        ],
        tags: [],
        unicodeVersion: "13.0",
        iosVersion: "14.0"
    },
    {
        emoji: "🥙",
        description: "stuffed flatbread",
        category: "Food & Drink",
        aliases: [
            "stuffed_flatbread"
        ],
        tags: [],
        unicodeVersion: "9.0",
        iosVersion: "10.2"
    },
    {
        emoji: "🧆",
        description: "falafel",
        category: "Food & Drink",
        aliases: [
            "falafel"
        ],
        tags: [],
        unicodeVersion: "12.0",
        iosVersion: "13.0"
    },
    {
        emoji: "🥚",
        description: "egg",
        category: "Food & Drink",
        aliases: [
            "egg"
        ],
        tags: [],
        unicodeVersion: "9.0",
        iosVersion: "10.2"
    },
    {
        emoji: "🍳",
        description: "cooking",
        category: "Food & Drink",
        aliases: [
            "fried_egg"
        ],
        tags: [
            "breakfast"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🥘",
        description: "shallow pan of food",
        category: "Food & Drink",
        aliases: [
            "shallow_pan_of_food"
        ],
        tags: [
            "paella",
            "curry"
        ],
        unicodeVersion: "",
        iosVersion: "10.2"
    },
    {
        emoji: "🍲",
        description: "pot of food",
        category: "Food & Drink",
        aliases: [
            "stew"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🫕",
        description: "fondue",
        category: "Food & Drink",
        aliases: [
            "fondue"
        ],
        tags: [],
        unicodeVersion: "13.0",
        iosVersion: "14.0"
    },
    {
        emoji: "🥣",
        description: "bowl with spoon",
        category: "Food & Drink",
        aliases: [
            "bowl_with_spoon"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🥗",
        description: "green salad",
        category: "Food & Drink",
        aliases: [
            "green_salad"
        ],
        tags: [],
        unicodeVersion: "9.0",
        iosVersion: "10.2"
    },
    {
        emoji: "🍿",
        description: "popcorn",
        category: "Food & Drink",
        aliases: [
            "popcorn"
        ],
        tags: [],
        unicodeVersion: "8.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🧈",
        description: "butter",
        category: "Food & Drink",
        aliases: [
            "butter"
        ],
        tags: [],
        unicodeVersion: "12.0",
        iosVersion: "13.0"
    },
    {
        emoji: "🧂",
        description: "salt",
        category: "Food & Drink",
        aliases: [
            "salt"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🥫",
        description: "canned food",
        category: "Food & Drink",
        aliases: [
            "canned_food"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🍱",
        description: "bento box",
        category: "Food & Drink",
        aliases: [
            "bento"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🍘",
        description: "rice cracker",
        category: "Food & Drink",
        aliases: [
            "rice_cracker"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🍙",
        description: "rice ball",
        category: "Food & Drink",
        aliases: [
            "rice_ball"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🍚",
        description: "cooked rice",
        category: "Food & Drink",
        aliases: [
            "rice"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🍛",
        description: "curry rice",
        category: "Food & Drink",
        aliases: [
            "curry"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🍜",
        description: "steaming bowl",
        category: "Food & Drink",
        aliases: [
            "ramen"
        ],
        tags: [
            "noodle"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🍝",
        description: "spaghetti",
        category: "Food & Drink",
        aliases: [
            "spaghetti"
        ],
        tags: [
            "pasta"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🍠",
        description: "roasted sweet potato",
        category: "Food & Drink",
        aliases: [
            "sweet_potato"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🍢",
        description: "oden",
        category: "Food & Drink",
        aliases: [
            "oden"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🍣",
        description: "sushi",
        category: "Food & Drink",
        aliases: [
            "sushi"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🍤",
        description: "fried shrimp",
        category: "Food & Drink",
        aliases: [
            "fried_shrimp"
        ],
        tags: [
            "tempura"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🍥",
        description: "fish cake with swirl",
        category: "Food & Drink",
        aliases: [
            "fish_cake"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🥮",
        description: "moon cake",
        category: "Food & Drink",
        aliases: [
            "moon_cake"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🍡",
        description: "dango",
        category: "Food & Drink",
        aliases: [
            "dango"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🥟",
        description: "dumpling",
        category: "Food & Drink",
        aliases: [
            "dumpling"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🥠",
        description: "fortune cookie",
        category: "Food & Drink",
        aliases: [
            "fortune_cookie"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🥡",
        description: "takeout box",
        category: "Food & Drink",
        aliases: [
            "takeout_box"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🦀",
        description: "crab",
        category: "Food & Drink",
        aliases: [
            "crab"
        ],
        tags: [],
        unicodeVersion: "8.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🦞",
        description: "lobster",
        category: "Food & Drink",
        aliases: [
            "lobster"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🦐",
        description: "shrimp",
        category: "Food & Drink",
        aliases: [
            "shrimp"
        ],
        tags: [],
        unicodeVersion: "9.0",
        iosVersion: "10.2"
    },
    {
        emoji: "🦑",
        description: "squid",
        category: "Food & Drink",
        aliases: [
            "squid"
        ],
        tags: [],
        unicodeVersion: "9.0",
        iosVersion: "10.2"
    },
    {
        emoji: "🦪",
        description: "oyster",
        category: "Food & Drink",
        aliases: [
            "oyster"
        ],
        tags: [],
        unicodeVersion: "12.0",
        iosVersion: "13.0"
    },
    {
        emoji: "🍦",
        description: "soft ice cream",
        category: "Food & Drink",
        aliases: [
            "icecream"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🍧",
        description: "shaved ice",
        category: "Food & Drink",
        aliases: [
            "shaved_ice"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🍨",
        description: "ice cream",
        category: "Food & Drink",
        aliases: [
            "ice_cream"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🍩",
        description: "doughnut",
        category: "Food & Drink",
        aliases: [
            "doughnut"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🍪",
        description: "cookie",
        category: "Food & Drink",
        aliases: [
            "cookie"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🎂",
        description: "birthday cake",
        category: "Food & Drink",
        aliases: [
            "birthday"
        ],
        tags: [
            "party"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🍰",
        description: "shortcake",
        category: "Food & Drink",
        aliases: [
            "cake"
        ],
        tags: [
            "dessert"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🧁",
        description: "cupcake",
        category: "Food & Drink",
        aliases: [
            "cupcake"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🥧",
        description: "pie",
        category: "Food & Drink",
        aliases: [
            "pie"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🍫",
        description: "chocolate bar",
        category: "Food & Drink",
        aliases: [
            "chocolate_bar"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🍬",
        description: "candy",
        category: "Food & Drink",
        aliases: [
            "candy"
        ],
        tags: [
            "sweet"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🍭",
        description: "lollipop",
        category: "Food & Drink",
        aliases: [
            "lollipop"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🍮",
        description: "custard",
        category: "Food & Drink",
        aliases: [
            "custard"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🍯",
        description: "honey pot",
        category: "Food & Drink",
        aliases: [
            "honey_pot"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🍼",
        description: "baby bottle",
        category: "Food & Drink",
        aliases: [
            "baby_bottle"
        ],
        tags: [
            "milk"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🥛",
        description: "glass of milk",
        category: "Food & Drink",
        aliases: [
            "milk_glass"
        ],
        tags: [],
        unicodeVersion: "9.0",
        iosVersion: "10.2"
    },
    {
        emoji: "☕",
        description: "hot beverage",
        category: "Food & Drink",
        aliases: [
            "coffee"
        ],
        tags: [
            "cafe",
            "espresso"
        ],
        unicodeVersion: "4.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🫖",
        description: "teapot",
        category: "Food & Drink",
        aliases: [
            "teapot"
        ],
        tags: [],
        unicodeVersion: "13.0",
        iosVersion: "14.0"
    },
    {
        emoji: "🍵",
        description: "teacup without handle",
        category: "Food & Drink",
        aliases: [
            "tea"
        ],
        tags: [
            "green",
            "breakfast"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🍶",
        description: "sake",
        category: "Food & Drink",
        aliases: [
            "sake"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🍾",
        description: "bottle with popping cork",
        category: "Food & Drink",
        aliases: [
            "champagne"
        ],
        tags: [
            "bottle",
            "bubbly",
            "celebration"
        ],
        unicodeVersion: "8.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🍷",
        description: "wine glass",
        category: "Food & Drink",
        aliases: [
            "wine_glass"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🍸",
        description: "cocktail glass",
        category: "Food & Drink",
        aliases: [
            "cocktail"
        ],
        tags: [
            "drink"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🍹",
        description: "tropical drink",
        category: "Food & Drink",
        aliases: [
            "tropical_drink"
        ],
        tags: [
            "summer",
            "vacation"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🍺",
        description: "beer mug",
        category: "Food & Drink",
        aliases: [
            "beer"
        ],
        tags: [
            "drink"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🍻",
        description: "clinking beer mugs",
        category: "Food & Drink",
        aliases: [
            "beers"
        ],
        tags: [
            "drinks"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🥂",
        description: "clinking glasses",
        category: "Food & Drink",
        aliases: [
            "clinking_glasses"
        ],
        tags: [
            "cheers",
            "toast"
        ],
        unicodeVersion: "9.0",
        iosVersion: "10.2"
    },
    {
        emoji: "🥃",
        description: "tumbler glass",
        category: "Food & Drink",
        aliases: [
            "tumbler_glass"
        ],
        tags: [
            "whisky"
        ],
        unicodeVersion: "9.0",
        iosVersion: "10.2"
    },
    {
        emoji: "🥤",
        description: "cup with straw",
        category: "Food & Drink",
        aliases: [
            "cup_with_straw"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🧋",
        description: "bubble tea",
        category: "Food & Drink",
        aliases: [
            "bubble_tea"
        ],
        tags: [],
        unicodeVersion: "13.0",
        iosVersion: "14.0"
    },
    {
        emoji: "🧃",
        description: "beverage box",
        category: "Food & Drink",
        aliases: [
            "beverage_box"
        ],
        tags: [],
        unicodeVersion: "12.0",
        iosVersion: "13.0"
    },
    {
        emoji: "🧉",
        description: "mate",
        category: "Food & Drink",
        aliases: [
            "mate"
        ],
        tags: [],
        unicodeVersion: "12.0",
        iosVersion: "13.0"
    },
    {
        emoji: "🧊",
        description: "ice",
        category: "Food & Drink",
        aliases: [
            "ice_cube"
        ],
        tags: [],
        unicodeVersion: "12.0",
        iosVersion: "13.0"
    },
    {
        emoji: "🥢",
        description: "chopsticks",
        category: "Food & Drink",
        aliases: [
            "chopsticks"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🍽️",
        description: "fork and knife with plate",
        category: "Food & Drink",
        aliases: [
            "plate_with_cutlery"
        ],
        tags: [
            "dining",
            "dinner"
        ],
        unicodeVersion: "7.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🍴",
        description: "fork and knife",
        category: "Food & Drink",
        aliases: [
            "fork_and_knife"
        ],
        tags: [
            "cutlery"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🥄",
        description: "spoon",
        category: "Food & Drink",
        aliases: [
            "spoon"
        ],
        tags: [],
        unicodeVersion: "9.0",
        iosVersion: "10.2"
    },
    {
        emoji: "🔪",
        description: "kitchen knife",
        category: "Food & Drink",
        aliases: [
            "hocho",
            "knife"
        ],
        tags: [
            "cut",
            "chop"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🏺",
        description: "amphora",
        category: "Food & Drink",
        aliases: [
            "amphora"
        ],
        tags: [],
        unicodeVersion: "8.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🌍",
        description: "globe showing Europe-Africa",
        category: "Travel & Places",
        aliases: [
            "earth_africa"
        ],
        tags: [
            "globe",
            "world",
            "international"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🌎",
        description: "globe showing Americas",
        category: "Travel & Places",
        aliases: [
            "earth_americas"
        ],
        tags: [
            "globe",
            "world",
            "international"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🌏",
        description: "globe showing Asia-Australia",
        category: "Travel & Places",
        aliases: [
            "earth_asia"
        ],
        tags: [
            "globe",
            "world",
            "international"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🌐",
        description: "globe with meridians",
        category: "Travel & Places",
        aliases: [
            "globe_with_meridians"
        ],
        tags: [
            "world",
            "global",
            "international"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🗺️",
        description: "world map",
        category: "Travel & Places",
        aliases: [
            "world_map"
        ],
        tags: [
            "travel"
        ],
        unicodeVersion: "7.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🗾",
        description: "map of Japan",
        category: "Travel & Places",
        aliases: [
            "japan"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🧭",
        description: "compass",
        category: "Travel & Places",
        aliases: [
            "compass"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🏔️",
        description: "snow-capped mountain",
        category: "Travel & Places",
        aliases: [
            "mountain_snow"
        ],
        tags: [],
        unicodeVersion: "7.0",
        iosVersion: "9.1"
    },
    {
        emoji: "⛰️",
        description: "mountain",
        category: "Travel & Places",
        aliases: [
            "mountain"
        ],
        tags: [],
        unicodeVersion: "5.2",
        iosVersion: "9.1"
    },
    {
        emoji: "🌋",
        description: "volcano",
        category: "Travel & Places",
        aliases: [
            "volcano"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🗻",
        description: "mount fuji",
        category: "Travel & Places",
        aliases: [
            "mount_fuji"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🏕️",
        description: "camping",
        category: "Travel & Places",
        aliases: [
            "camping"
        ],
        tags: [],
        unicodeVersion: "7.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🏖️",
        description: "beach with umbrella",
        category: "Travel & Places",
        aliases: [
            "beach_umbrella"
        ],
        tags: [],
        unicodeVersion: "7.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🏜️",
        description: "desert",
        category: "Travel & Places",
        aliases: [
            "desert"
        ],
        tags: [],
        unicodeVersion: "7.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🏝️",
        description: "desert island",
        category: "Travel & Places",
        aliases: [
            "desert_island"
        ],
        tags: [],
        unicodeVersion: "7.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🏞️",
        description: "national park",
        category: "Travel & Places",
        aliases: [
            "national_park"
        ],
        tags: [],
        unicodeVersion: "7.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🏟️",
        description: "stadium",
        category: "Travel & Places",
        aliases: [
            "stadium"
        ],
        tags: [],
        unicodeVersion: "7.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🏛️",
        description: "classical building",
        category: "Travel & Places",
        aliases: [
            "classical_building"
        ],
        tags: [],
        unicodeVersion: "7.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🏗️",
        description: "building construction",
        category: "Travel & Places",
        aliases: [
            "building_construction"
        ],
        tags: [],
        unicodeVersion: "7.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🧱",
        description: "brick",
        category: "Travel & Places",
        aliases: [
            "bricks"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🪨",
        description: "rock",
        category: "Travel & Places",
        aliases: [
            "rock"
        ],
        tags: [],
        unicodeVersion: "13.0",
        iosVersion: "14.0"
    },
    {
        emoji: "🪵",
        description: "wood",
        category: "Travel & Places",
        aliases: [
            "wood"
        ],
        tags: [],
        unicodeVersion: "13.0",
        iosVersion: "14.0"
    },
    {
        emoji: "🛖",
        description: "hut",
        category: "Travel & Places",
        aliases: [
            "hut"
        ],
        tags: [],
        unicodeVersion: "13.0",
        iosVersion: "14.0"
    },
    {
        emoji: "🏘️",
        description: "houses",
        category: "Travel & Places",
        aliases: [
            "houses"
        ],
        tags: [],
        unicodeVersion: "7.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🏚️",
        description: "derelict house",
        category: "Travel & Places",
        aliases: [
            "derelict_house"
        ],
        tags: [],
        unicodeVersion: "7.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🏠",
        description: "house",
        category: "Travel & Places",
        aliases: [
            "house"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🏡",
        description: "house with garden",
        category: "Travel & Places",
        aliases: [
            "house_with_garden"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🏢",
        description: "office building",
        category: "Travel & Places",
        aliases: [
            "office"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🏣",
        description: "Japanese post office",
        category: "Travel & Places",
        aliases: [
            "post_office"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🏤",
        description: "post office",
        category: "Travel & Places",
        aliases: [
            "european_post_office"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🏥",
        description: "hospital",
        category: "Travel & Places",
        aliases: [
            "hospital"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🏦",
        description: "bank",
        category: "Travel & Places",
        aliases: [
            "bank"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🏨",
        description: "hotel",
        category: "Travel & Places",
        aliases: [
            "hotel"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🏩",
        description: "love hotel",
        category: "Travel & Places",
        aliases: [
            "love_hotel"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🏪",
        description: "convenience store",
        category: "Travel & Places",
        aliases: [
            "convenience_store"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🏫",
        description: "school",
        category: "Travel & Places",
        aliases: [
            "school"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🏬",
        description: "department store",
        category: "Travel & Places",
        aliases: [
            "department_store"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🏭",
        description: "factory",
        category: "Travel & Places",
        aliases: [
            "factory"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🏯",
        description: "Japanese castle",
        category: "Travel & Places",
        aliases: [
            "japanese_castle"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🏰",
        description: "castle",
        category: "Travel & Places",
        aliases: [
            "european_castle"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "💒",
        description: "wedding",
        category: "Travel & Places",
        aliases: [
            "wedding"
        ],
        tags: [
            "marriage"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🗼",
        description: "Tokyo tower",
        category: "Travel & Places",
        aliases: [
            "tokyo_tower"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🗽",
        description: "Statue of Liberty",
        category: "Travel & Places",
        aliases: [
            "statue_of_liberty"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "⛪",
        description: "church",
        category: "Travel & Places",
        aliases: [
            "church"
        ],
        tags: [],
        unicodeVersion: "5.2",
        iosVersion: "6.0"
    },
    {
        emoji: "🕌",
        description: "mosque",
        category: "Travel & Places",
        aliases: [
            "mosque"
        ],
        tags: [],
        unicodeVersion: "8.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🛕",
        description: "hindu temple",
        category: "Travel & Places",
        aliases: [
            "hindu_temple"
        ],
        tags: [],
        unicodeVersion: "12.0",
        iosVersion: "13.0"
    },
    {
        emoji: "🕍",
        description: "synagogue",
        category: "Travel & Places",
        aliases: [
            "synagogue"
        ],
        tags: [],
        unicodeVersion: "8.0",
        iosVersion: "9.1"
    },
    {
        emoji: "⛩️",
        description: "shinto shrine",
        category: "Travel & Places",
        aliases: [
            "shinto_shrine"
        ],
        tags: [],
        unicodeVersion: "5.2",
        iosVersion: "9.1"
    },
    {
        emoji: "🕋",
        description: "kaaba",
        category: "Travel & Places",
        aliases: [
            "kaaba"
        ],
        tags: [],
        unicodeVersion: "8.0",
        iosVersion: "9.1"
    },
    {
        emoji: "⛲",
        description: "fountain",
        category: "Travel & Places",
        aliases: [
            "fountain"
        ],
        tags: [],
        unicodeVersion: "5.2",
        iosVersion: "6.0"
    },
    {
        emoji: "⛺",
        description: "tent",
        category: "Travel & Places",
        aliases: [
            "tent"
        ],
        tags: [
            "camping"
        ],
        unicodeVersion: "5.2",
        iosVersion: "6.0"
    },
    {
        emoji: "🌁",
        description: "foggy",
        category: "Travel & Places",
        aliases: [
            "foggy"
        ],
        tags: [
            "karl"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🌃",
        description: "night with stars",
        category: "Travel & Places",
        aliases: [
            "night_with_stars"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🏙️",
        description: "cityscape",
        category: "Travel & Places",
        aliases: [
            "cityscape"
        ],
        tags: [
            "skyline"
        ],
        unicodeVersion: "7.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🌄",
        description: "sunrise over mountains",
        category: "Travel & Places",
        aliases: [
            "sunrise_over_mountains"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🌅",
        description: "sunrise",
        category: "Travel & Places",
        aliases: [
            "sunrise"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🌆",
        description: "cityscape at dusk",
        category: "Travel & Places",
        aliases: [
            "city_sunset"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🌇",
        description: "sunset",
        category: "Travel & Places",
        aliases: [
            "city_sunrise"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🌉",
        description: "bridge at night",
        category: "Travel & Places",
        aliases: [
            "bridge_at_night"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "♨️",
        description: "hot springs",
        category: "Travel & Places",
        aliases: [
            "hotsprings"
        ],
        tags: [],
        unicodeVersion: "",
        iosVersion: "6.0"
    },
    {
        emoji: "🎠",
        description: "carousel horse",
        category: "Travel & Places",
        aliases: [
            "carousel_horse"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🎡",
        description: "ferris wheel",
        category: "Travel & Places",
        aliases: [
            "ferris_wheel"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🎢",
        description: "roller coaster",
        category: "Travel & Places",
        aliases: [
            "roller_coaster"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "💈",
        description: "barber pole",
        category: "Travel & Places",
        aliases: [
            "barber"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🎪",
        description: "circus tent",
        category: "Travel & Places",
        aliases: [
            "circus_tent"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🚂",
        description: "locomotive",
        category: "Travel & Places",
        aliases: [
            "steam_locomotive"
        ],
        tags: [
            "train"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🚃",
        description: "railway car",
        category: "Travel & Places",
        aliases: [
            "railway_car"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🚄",
        description: "high-speed train",
        category: "Travel & Places",
        aliases: [
            "bullettrain_side"
        ],
        tags: [
            "train"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🚅",
        description: "bullet train",
        category: "Travel & Places",
        aliases: [
            "bullettrain_front"
        ],
        tags: [
            "train"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🚆",
        description: "train",
        category: "Travel & Places",
        aliases: [
            "train2"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🚇",
        description: "metro",
        category: "Travel & Places",
        aliases: [
            "metro"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🚈",
        description: "light rail",
        category: "Travel & Places",
        aliases: [
            "light_rail"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🚉",
        description: "station",
        category: "Travel & Places",
        aliases: [
            "station"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🚊",
        description: "tram",
        category: "Travel & Places",
        aliases: [
            "tram"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🚝",
        description: "monorail",
        category: "Travel & Places",
        aliases: [
            "monorail"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🚞",
        description: "mountain railway",
        category: "Travel & Places",
        aliases: [
            "mountain_railway"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🚋",
        description: "tram car",
        category: "Travel & Places",
        aliases: [
            "train"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🚌",
        description: "bus",
        category: "Travel & Places",
        aliases: [
            "bus"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🚍",
        description: "oncoming bus",
        category: "Travel & Places",
        aliases: [
            "oncoming_bus"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🚎",
        description: "trolleybus",
        category: "Travel & Places",
        aliases: [
            "trolleybus"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🚐",
        description: "minibus",
        category: "Travel & Places",
        aliases: [
            "minibus"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🚑",
        description: "ambulance",
        category: "Travel & Places",
        aliases: [
            "ambulance"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🚒",
        description: "fire engine",
        category: "Travel & Places",
        aliases: [
            "fire_engine"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🚓",
        description: "police car",
        category: "Travel & Places",
        aliases: [
            "police_car"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🚔",
        description: "oncoming police car",
        category: "Travel & Places",
        aliases: [
            "oncoming_police_car"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🚕",
        description: "taxi",
        category: "Travel & Places",
        aliases: [
            "taxi"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🚖",
        description: "oncoming taxi",
        category: "Travel & Places",
        aliases: [
            "oncoming_taxi"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🚗",
        description: "automobile",
        category: "Travel & Places",
        aliases: [
            "car",
            "red_car"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🚘",
        description: "oncoming automobile",
        category: "Travel & Places",
        aliases: [
            "oncoming_automobile"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🚙",
        description: "sport utility vehicle",
        category: "Travel & Places",
        aliases: [
            "blue_car"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🛻",
        description: "pickup truck",
        category: "Travel & Places",
        aliases: [
            "pickup_truck"
        ],
        tags: [],
        unicodeVersion: "13.0",
        iosVersion: "14.0"
    },
    {
        emoji: "🚚",
        description: "delivery truck",
        category: "Travel & Places",
        aliases: [
            "truck"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🚛",
        description: "articulated lorry",
        category: "Travel & Places",
        aliases: [
            "articulated_lorry"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🚜",
        description: "tractor",
        category: "Travel & Places",
        aliases: [
            "tractor"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🏎️",
        description: "racing car",
        category: "Travel & Places",
        aliases: [
            "racing_car"
        ],
        tags: [],
        unicodeVersion: "7.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🏍️",
        description: "motorcycle",
        category: "Travel & Places",
        aliases: [
            "motorcycle"
        ],
        tags: [],
        unicodeVersion: "7.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🛵",
        description: "motor scooter",
        category: "Travel & Places",
        aliases: [
            "motor_scooter"
        ],
        tags: [],
        unicodeVersion: "9.0",
        iosVersion: "10.2"
    },
    {
        emoji: "🦽",
        description: "manual wheelchair",
        category: "Travel & Places",
        aliases: [
            "manual_wheelchair"
        ],
        tags: [],
        unicodeVersion: "12.0",
        iosVersion: "13.0"
    },
    {
        emoji: "🦼",
        description: "motorized wheelchair",
        category: "Travel & Places",
        aliases: [
            "motorized_wheelchair"
        ],
        tags: [],
        unicodeVersion: "12.0",
        iosVersion: "13.0"
    },
    {
        emoji: "🛺",
        description: "auto rickshaw",
        category: "Travel & Places",
        aliases: [
            "auto_rickshaw"
        ],
        tags: [],
        unicodeVersion: "12.0",
        iosVersion: "13.0"
    },
    {
        emoji: "🚲",
        description: "bicycle",
        category: "Travel & Places",
        aliases: [
            "bike"
        ],
        tags: [
            "bicycle"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🛴",
        description: "kick scooter",
        category: "Travel & Places",
        aliases: [
            "kick_scooter"
        ],
        tags: [],
        unicodeVersion: "9.0",
        iosVersion: "10.2"
    },
    {
        emoji: "🛹",
        description: "skateboard",
        category: "Travel & Places",
        aliases: [
            "skateboard"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🛼",
        description: "roller skate",
        category: "Travel & Places",
        aliases: [
            "roller_skate"
        ],
        tags: [],
        unicodeVersion: "13.0",
        iosVersion: "14.0"
    },
    {
        emoji: "🚏",
        description: "bus stop",
        category: "Travel & Places",
        aliases: [
            "busstop"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🛣️",
        description: "motorway",
        category: "Travel & Places",
        aliases: [
            "motorway"
        ],
        tags: [],
        unicodeVersion: "7.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🛤️",
        description: "railway track",
        category: "Travel & Places",
        aliases: [
            "railway_track"
        ],
        tags: [],
        unicodeVersion: "7.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🛢️",
        description: "oil drum",
        category: "Travel & Places",
        aliases: [
            "oil_drum"
        ],
        tags: [],
        unicodeVersion: "7.0",
        iosVersion: "9.1"
    },
    {
        emoji: "⛽",
        description: "fuel pump",
        category: "Travel & Places",
        aliases: [
            "fuelpump"
        ],
        tags: [],
        unicodeVersion: "5.2",
        iosVersion: "6.0"
    },
    {
        emoji: "🚨",
        description: "police car light",
        category: "Travel & Places",
        aliases: [
            "rotating_light"
        ],
        tags: [
            "911",
            "emergency"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🚥",
        description: "horizontal traffic light",
        category: "Travel & Places",
        aliases: [
            "traffic_light"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🚦",
        description: "vertical traffic light",
        category: "Travel & Places",
        aliases: [
            "vertical_traffic_light"
        ],
        tags: [
            "semaphore"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🛑",
        description: "stop sign",
        category: "Travel & Places",
        aliases: [
            "stop_sign"
        ],
        tags: [],
        unicodeVersion: "9.0",
        iosVersion: "10.2"
    },
    {
        emoji: "🚧",
        description: "construction",
        category: "Travel & Places",
        aliases: [
            "construction"
        ],
        tags: [
            "wip"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "⚓",
        description: "anchor",
        category: "Travel & Places",
        aliases: [
            "anchor"
        ],
        tags: [
            "ship"
        ],
        unicodeVersion: "4.1",
        iosVersion: "6.0"
    },
    {
        emoji: "⛵",
        description: "sailboat",
        category: "Travel & Places",
        aliases: [
            "boat",
            "sailboat"
        ],
        tags: [],
        unicodeVersion: "5.2",
        iosVersion: "6.0"
    },
    {
        emoji: "🛶",
        description: "canoe",
        category: "Travel & Places",
        aliases: [
            "canoe"
        ],
        tags: [],
        unicodeVersion: "9.0",
        iosVersion: "10.2"
    },
    {
        emoji: "🚤",
        description: "speedboat",
        category: "Travel & Places",
        aliases: [
            "speedboat"
        ],
        tags: [
            "ship"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🛳️",
        description: "passenger ship",
        category: "Travel & Places",
        aliases: [
            "passenger_ship"
        ],
        tags: [
            "cruise"
        ],
        unicodeVersion: "7.0",
        iosVersion: "9.1"
    },
    {
        emoji: "⛴️",
        description: "ferry",
        category: "Travel & Places",
        aliases: [
            "ferry"
        ],
        tags: [],
        unicodeVersion: "5.2",
        iosVersion: "9.1"
    },
    {
        emoji: "🛥️",
        description: "motor boat",
        category: "Travel & Places",
        aliases: [
            "motor_boat"
        ],
        tags: [],
        unicodeVersion: "7.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🚢",
        description: "ship",
        category: "Travel & Places",
        aliases: [
            "ship"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "✈️",
        description: "airplane",
        category: "Travel & Places",
        aliases: [
            "airplane"
        ],
        tags: [
            "flight"
        ],
        unicodeVersion: "",
        iosVersion: "6.0"
    },
    {
        emoji: "🛩️",
        description: "small airplane",
        category: "Travel & Places",
        aliases: [
            "small_airplane"
        ],
        tags: [
            "flight"
        ],
        unicodeVersion: "7.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🛫",
        description: "airplane departure",
        category: "Travel & Places",
        aliases: [
            "flight_departure"
        ],
        tags: [],
        unicodeVersion: "7.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🛬",
        description: "airplane arrival",
        category: "Travel & Places",
        aliases: [
            "flight_arrival"
        ],
        tags: [],
        unicodeVersion: "7.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🪂",
        description: "parachute",
        category: "Travel & Places",
        aliases: [
            "parachute"
        ],
        tags: [],
        unicodeVersion: "12.0",
        iosVersion: "13.0"
    },
    {
        emoji: "💺",
        description: "seat",
        category: "Travel & Places",
        aliases: [
            "seat"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🚁",
        description: "helicopter",
        category: "Travel & Places",
        aliases: [
            "helicopter"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🚟",
        description: "suspension railway",
        category: "Travel & Places",
        aliases: [
            "suspension_railway"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🚠",
        description: "mountain cableway",
        category: "Travel & Places",
        aliases: [
            "mountain_cableway"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🚡",
        description: "aerial tramway",
        category: "Travel & Places",
        aliases: [
            "aerial_tramway"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🛰️",
        description: "satellite",
        category: "Travel & Places",
        aliases: [
            "artificial_satellite"
        ],
        tags: [
            "orbit",
            "space"
        ],
        unicodeVersion: "7.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🚀",
        description: "rocket",
        category: "Travel & Places",
        aliases: [
            "rocket"
        ],
        tags: [
            "ship",
            "launch"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🛸",
        description: "flying saucer",
        category: "Travel & Places",
        aliases: [
            "flying_saucer"
        ],
        tags: [
            "ufo"
        ],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🛎️",
        description: "bellhop bell",
        category: "Travel & Places",
        aliases: [
            "bellhop_bell"
        ],
        tags: [],
        unicodeVersion: "7.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🧳",
        description: "luggage",
        category: "Travel & Places",
        aliases: [
            "luggage"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "⌛",
        description: "hourglass done",
        category: "Travel & Places",
        aliases: [
            "hourglass"
        ],
        tags: [
            "time"
        ],
        unicodeVersion: "",
        iosVersion: "6.0"
    },
    {
        emoji: "⏳",
        description: "hourglass not done",
        category: "Travel & Places",
        aliases: [
            "hourglass_flowing_sand"
        ],
        tags: [
            "time"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "⌚",
        description: "watch",
        category: "Travel & Places",
        aliases: [
            "watch"
        ],
        tags: [
            "time"
        ],
        unicodeVersion: "",
        iosVersion: "6.0"
    },
    {
        emoji: "⏰",
        description: "alarm clock",
        category: "Travel & Places",
        aliases: [
            "alarm_clock"
        ],
        tags: [
            "morning"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "⏱️",
        description: "stopwatch",
        category: "Travel & Places",
        aliases: [
            "stopwatch"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "9.1"
    },
    {
        emoji: "⏲️",
        description: "timer clock",
        category: "Travel & Places",
        aliases: [
            "timer_clock"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🕰️",
        description: "mantelpiece clock",
        category: "Travel & Places",
        aliases: [
            "mantelpiece_clock"
        ],
        tags: [],
        unicodeVersion: "7.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🕛",
        description: "twelve o’clock",
        category: "Travel & Places",
        aliases: [
            "clock12"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🕧",
        description: "twelve-thirty",
        category: "Travel & Places",
        aliases: [
            "clock1230"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🕐",
        description: "one o’clock",
        category: "Travel & Places",
        aliases: [
            "clock1"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🕜",
        description: "one-thirty",
        category: "Travel & Places",
        aliases: [
            "clock130"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🕑",
        description: "two o’clock",
        category: "Travel & Places",
        aliases: [
            "clock2"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🕝",
        description: "two-thirty",
        category: "Travel & Places",
        aliases: [
            "clock230"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🕒",
        description: "three o’clock",
        category: "Travel & Places",
        aliases: [
            "clock3"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🕞",
        description: "three-thirty",
        category: "Travel & Places",
        aliases: [
            "clock330"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🕓",
        description: "four o’clock",
        category: "Travel & Places",
        aliases: [
            "clock4"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🕟",
        description: "four-thirty",
        category: "Travel & Places",
        aliases: [
            "clock430"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🕔",
        description: "five o’clock",
        category: "Travel & Places",
        aliases: [
            "clock5"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🕠",
        description: "five-thirty",
        category: "Travel & Places",
        aliases: [
            "clock530"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🕕",
        description: "six o’clock",
        category: "Travel & Places",
        aliases: [
            "clock6"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🕡",
        description: "six-thirty",
        category: "Travel & Places",
        aliases: [
            "clock630"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🕖",
        description: "seven o’clock",
        category: "Travel & Places",
        aliases: [
            "clock7"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🕢",
        description: "seven-thirty",
        category: "Travel & Places",
        aliases: [
            "clock730"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🕗",
        description: "eight o’clock",
        category: "Travel & Places",
        aliases: [
            "clock8"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🕣",
        description: "eight-thirty",
        category: "Travel & Places",
        aliases: [
            "clock830"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🕘",
        description: "nine o’clock",
        category: "Travel & Places",
        aliases: [
            "clock9"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🕤",
        description: "nine-thirty",
        category: "Travel & Places",
        aliases: [
            "clock930"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🕙",
        description: "ten o’clock",
        category: "Travel & Places",
        aliases: [
            "clock10"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🕥",
        description: "ten-thirty",
        category: "Travel & Places",
        aliases: [
            "clock1030"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🕚",
        description: "eleven o’clock",
        category: "Travel & Places",
        aliases: [
            "clock11"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🕦",
        description: "eleven-thirty",
        category: "Travel & Places",
        aliases: [
            "clock1130"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🌑",
        description: "new moon",
        category: "Travel & Places",
        aliases: [
            "new_moon"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🌒",
        description: "waxing crescent moon",
        category: "Travel & Places",
        aliases: [
            "waxing_crescent_moon"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🌓",
        description: "first quarter moon",
        category: "Travel & Places",
        aliases: [
            "first_quarter_moon"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🌔",
        description: "waxing gibbous moon",
        category: "Travel & Places",
        aliases: [
            "moon",
            "waxing_gibbous_moon"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🌕",
        description: "full moon",
        category: "Travel & Places",
        aliases: [
            "full_moon"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🌖",
        description: "waning gibbous moon",
        category: "Travel & Places",
        aliases: [
            "waning_gibbous_moon"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🌗",
        description: "last quarter moon",
        category: "Travel & Places",
        aliases: [
            "last_quarter_moon"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🌘",
        description: "waning crescent moon",
        category: "Travel & Places",
        aliases: [
            "waning_crescent_moon"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🌙",
        description: "crescent moon",
        category: "Travel & Places",
        aliases: [
            "crescent_moon"
        ],
        tags: [
            "night"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🌚",
        description: "new moon face",
        category: "Travel & Places",
        aliases: [
            "new_moon_with_face"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🌛",
        description: "first quarter moon face",
        category: "Travel & Places",
        aliases: [
            "first_quarter_moon_with_face"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🌜",
        description: "last quarter moon face",
        category: "Travel & Places",
        aliases: [
            "last_quarter_moon_with_face"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🌡️",
        description: "thermometer",
        category: "Travel & Places",
        aliases: [
            "thermometer"
        ],
        tags: [],
        unicodeVersion: "7.0",
        iosVersion: "9.1"
    },
    {
        emoji: "☀️",
        description: "sun",
        category: "Travel & Places",
        aliases: [
            "sunny"
        ],
        tags: [
            "weather"
        ],
        unicodeVersion: "",
        iosVersion: "6.0"
    },
    {
        emoji: "🌝",
        description: "full moon face",
        category: "Travel & Places",
        aliases: [
            "full_moon_with_face"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🌞",
        description: "sun with face",
        category: "Travel & Places",
        aliases: [
            "sun_with_face"
        ],
        tags: [
            "summer"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🪐",
        description: "ringed planet",
        category: "Travel & Places",
        aliases: [
            "ringed_planet"
        ],
        tags: [],
        unicodeVersion: "12.0",
        iosVersion: "13.0"
    },
    {
        emoji: "⭐",
        description: "star",
        category: "Travel & Places",
        aliases: [
            "star"
        ],
        tags: [],
        unicodeVersion: "5.1",
        iosVersion: "6.0"
    },
    {
        emoji: "🌟",
        description: "glowing star",
        category: "Travel & Places",
        aliases: [
            "star2"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🌠",
        description: "shooting star",
        category: "Travel & Places",
        aliases: [
            "stars"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🌌",
        description: "milky way",
        category: "Travel & Places",
        aliases: [
            "milky_way"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "☁️",
        description: "cloud",
        category: "Travel & Places",
        aliases: [
            "cloud"
        ],
        tags: [],
        unicodeVersion: "",
        iosVersion: "6.0"
    },
    {
        emoji: "⛅",
        description: "sun behind cloud",
        category: "Travel & Places",
        aliases: [
            "partly_sunny"
        ],
        tags: [
            "weather",
            "cloud"
        ],
        unicodeVersion: "5.2",
        iosVersion: "6.0"
    },
    {
        emoji: "⛈️",
        description: "cloud with lightning and rain",
        category: "Travel & Places",
        aliases: [
            "cloud_with_lightning_and_rain"
        ],
        tags: [],
        unicodeVersion: "5.2",
        iosVersion: "9.1"
    },
    {
        emoji: "🌤️",
        description: "sun behind small cloud",
        category: "Travel & Places",
        aliases: [
            "sun_behind_small_cloud"
        ],
        tags: [],
        unicodeVersion: "7.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🌥️",
        description: "sun behind large cloud",
        category: "Travel & Places",
        aliases: [
            "sun_behind_large_cloud"
        ],
        tags: [],
        unicodeVersion: "7.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🌦️",
        description: "sun behind rain cloud",
        category: "Travel & Places",
        aliases: [
            "sun_behind_rain_cloud"
        ],
        tags: [],
        unicodeVersion: "7.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🌧️",
        description: "cloud with rain",
        category: "Travel & Places",
        aliases: [
            "cloud_with_rain"
        ],
        tags: [],
        unicodeVersion: "7.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🌨️",
        description: "cloud with snow",
        category: "Travel & Places",
        aliases: [
            "cloud_with_snow"
        ],
        tags: [],
        unicodeVersion: "7.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🌩️",
        description: "cloud with lightning",
        category: "Travel & Places",
        aliases: [
            "cloud_with_lightning"
        ],
        tags: [],
        unicodeVersion: "7.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🌪️",
        description: "tornado",
        category: "Travel & Places",
        aliases: [
            "tornado"
        ],
        tags: [],
        unicodeVersion: "7.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🌫️",
        description: "fog",
        category: "Travel & Places",
        aliases: [
            "fog"
        ],
        tags: [],
        unicodeVersion: "7.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🌬️",
        description: "wind face",
        category: "Travel & Places",
        aliases: [
            "wind_face"
        ],
        tags: [],
        unicodeVersion: "7.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🌀",
        description: "cyclone",
        category: "Travel & Places",
        aliases: [
            "cyclone"
        ],
        tags: [
            "swirl"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🌈",
        description: "rainbow",
        category: "Travel & Places",
        aliases: [
            "rainbow"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🌂",
        description: "closed umbrella",
        category: "Travel & Places",
        aliases: [
            "closed_umbrella"
        ],
        tags: [
            "weather",
            "rain"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "☂️",
        description: "umbrella",
        category: "Travel & Places",
        aliases: [
            "open_umbrella"
        ],
        tags: [],
        unicodeVersion: "",
        iosVersion: "9.1"
    },
    {
        emoji: "☔",
        description: "umbrella with rain drops",
        category: "Travel & Places",
        aliases: [
            "umbrella"
        ],
        tags: [
            "rain",
            "weather"
        ],
        unicodeVersion: "4.0",
        iosVersion: "6.0"
    },
    {
        emoji: "⛱️",
        description: "umbrella on ground",
        category: "Travel & Places",
        aliases: [
            "parasol_on_ground"
        ],
        tags: [
            "beach_umbrella"
        ],
        unicodeVersion: "5.2",
        iosVersion: "9.1"
    },
    {
        emoji: "⚡",
        description: "high voltage",
        category: "Travel & Places",
        aliases: [
            "zap"
        ],
        tags: [
            "lightning",
            "thunder"
        ],
        unicodeVersion: "4.0",
        iosVersion: "6.0"
    },
    {
        emoji: "❄️",
        description: "snowflake",
        category: "Travel & Places",
        aliases: [
            "snowflake"
        ],
        tags: [
            "winter",
            "cold",
            "weather"
        ],
        unicodeVersion: "",
        iosVersion: "6.0"
    },
    {
        emoji: "☃️",
        description: "snowman",
        category: "Travel & Places",
        aliases: [
            "snowman_with_snow"
        ],
        tags: [
            "winter",
            "christmas"
        ],
        unicodeVersion: "",
        iosVersion: "9.1"
    },
    {
        emoji: "⛄",
        description: "snowman without snow",
        category: "Travel & Places",
        aliases: [
            "snowman"
        ],
        tags: [
            "winter"
        ],
        unicodeVersion: "5.2",
        iosVersion: "6.0"
    },
    {
        emoji: "☄️",
        description: "comet",
        category: "Travel & Places",
        aliases: [
            "comet"
        ],
        tags: [],
        unicodeVersion: "",
        iosVersion: "9.1"
    },
    {
        emoji: "🔥",
        description: "fire",
        category: "Travel & Places",
        aliases: [
            "fire"
        ],
        tags: [
            "burn"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "💧",
        description: "droplet",
        category: "Travel & Places",
        aliases: [
            "droplet"
        ],
        tags: [
            "water"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🌊",
        description: "water wave",
        category: "Travel & Places",
        aliases: [
            "ocean"
        ],
        tags: [
            "sea"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🎃",
        description: "jack-o-lantern",
        category: "Activities",
        aliases: [
            "jack_o_lantern"
        ],
        tags: [
            "halloween"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🎄",
        description: "Christmas tree",
        category: "Activities",
        aliases: [
            "christmas_tree"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🎆",
        description: "fireworks",
        category: "Activities",
        aliases: [
            "fireworks"
        ],
        tags: [
            "festival",
            "celebration"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🎇",
        description: "sparkler",
        category: "Activities",
        aliases: [
            "sparkler"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🧨",
        description: "firecracker",
        category: "Activities",
        aliases: [
            "firecracker"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "✨",
        description: "sparkles",
        category: "Activities",
        aliases: [
            "sparkles"
        ],
        tags: [
            "shiny"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🎈",
        description: "balloon",
        category: "Activities",
        aliases: [
            "balloon"
        ],
        tags: [
            "party",
            "birthday"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🎉",
        description: "party popper",
        category: "Activities",
        aliases: [
            "tada"
        ],
        tags: [
            "hooray",
            "party"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🎊",
        description: "confetti ball",
        category: "Activities",
        aliases: [
            "confetti_ball"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🎋",
        description: "tanabata tree",
        category: "Activities",
        aliases: [
            "tanabata_tree"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🎍",
        description: "pine decoration",
        category: "Activities",
        aliases: [
            "bamboo"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🎎",
        description: "Japanese dolls",
        category: "Activities",
        aliases: [
            "dolls"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🎏",
        description: "carp streamer",
        category: "Activities",
        aliases: [
            "flags"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🎐",
        description: "wind chime",
        category: "Activities",
        aliases: [
            "wind_chime"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🎑",
        description: "moon viewing ceremony",
        category: "Activities",
        aliases: [
            "rice_scene"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🧧",
        description: "red envelope",
        category: "Activities",
        aliases: [
            "red_envelope"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🎀",
        description: "ribbon",
        category: "Activities",
        aliases: [
            "ribbon"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🎁",
        description: "wrapped gift",
        category: "Activities",
        aliases: [
            "gift"
        ],
        tags: [
            "present",
            "birthday",
            "christmas"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🎗️",
        description: "reminder ribbon",
        category: "Activities",
        aliases: [
            "reminder_ribbon"
        ],
        tags: [],
        unicodeVersion: "7.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🎟️",
        description: "admission tickets",
        category: "Activities",
        aliases: [
            "tickets"
        ],
        tags: [],
        unicodeVersion: "7.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🎫",
        description: "ticket",
        category: "Activities",
        aliases: [
            "ticket"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🎖️",
        description: "military medal",
        category: "Activities",
        aliases: [
            "medal_military"
        ],
        tags: [],
        unicodeVersion: "7.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🏆",
        description: "trophy",
        category: "Activities",
        aliases: [
            "trophy"
        ],
        tags: [
            "award",
            "contest",
            "winner"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🏅",
        description: "sports medal",
        category: "Activities",
        aliases: [
            "medal_sports"
        ],
        tags: [
            "gold",
            "winner"
        ],
        unicodeVersion: "7.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🥇",
        description: "1st place medal",
        category: "Activities",
        aliases: [
            "1st_place_medal"
        ],
        tags: [
            "gold"
        ],
        unicodeVersion: "9.0",
        iosVersion: "10.2"
    },
    {
        emoji: "🥈",
        description: "2nd place medal",
        category: "Activities",
        aliases: [
            "2nd_place_medal"
        ],
        tags: [
            "silver"
        ],
        unicodeVersion: "9.0",
        iosVersion: "10.2"
    },
    {
        emoji: "🥉",
        description: "3rd place medal",
        category: "Activities",
        aliases: [
            "3rd_place_medal"
        ],
        tags: [
            "bronze"
        ],
        unicodeVersion: "9.0",
        iosVersion: "10.2"
    },
    {
        emoji: "⚽",
        description: "soccer ball",
        category: "Activities",
        aliases: [
            "soccer"
        ],
        tags: [
            "sports"
        ],
        unicodeVersion: "5.2",
        iosVersion: "6.0"
    },
    {
        emoji: "⚾",
        description: "baseball",
        category: "Activities",
        aliases: [
            "baseball"
        ],
        tags: [
            "sports"
        ],
        unicodeVersion: "5.2",
        iosVersion: "6.0"
    },
    {
        emoji: "🥎",
        description: "softball",
        category: "Activities",
        aliases: [
            "softball"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🏀",
        description: "basketball",
        category: "Activities",
        aliases: [
            "basketball"
        ],
        tags: [
            "sports"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🏐",
        description: "volleyball",
        category: "Activities",
        aliases: [
            "volleyball"
        ],
        tags: [],
        unicodeVersion: "8.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🏈",
        description: "american football",
        category: "Activities",
        aliases: [
            "football"
        ],
        tags: [
            "sports"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🏉",
        description: "rugby football",
        category: "Activities",
        aliases: [
            "rugby_football"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🎾",
        description: "tennis",
        category: "Activities",
        aliases: [
            "tennis"
        ],
        tags: [
            "sports"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🥏",
        description: "flying disc",
        category: "Activities",
        aliases: [
            "flying_disc"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🎳",
        description: "bowling",
        category: "Activities",
        aliases: [
            "bowling"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🏏",
        description: "cricket game",
        category: "Activities",
        aliases: [
            "cricket_game"
        ],
        tags: [],
        unicodeVersion: "8.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🏑",
        description: "field hockey",
        category: "Activities",
        aliases: [
            "field_hockey"
        ],
        tags: [],
        unicodeVersion: "8.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🏒",
        description: "ice hockey",
        category: "Activities",
        aliases: [
            "ice_hockey"
        ],
        tags: [],
        unicodeVersion: "8.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🥍",
        description: "lacrosse",
        category: "Activities",
        aliases: [
            "lacrosse"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🏓",
        description: "ping pong",
        category: "Activities",
        aliases: [
            "ping_pong"
        ],
        tags: [],
        unicodeVersion: "8.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🏸",
        description: "badminton",
        category: "Activities",
        aliases: [
            "badminton"
        ],
        tags: [],
        unicodeVersion: "8.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🥊",
        description: "boxing glove",
        category: "Activities",
        aliases: [
            "boxing_glove"
        ],
        tags: [],
        unicodeVersion: "9.0",
        iosVersion: "10.2"
    },
    {
        emoji: "🥋",
        description: "martial arts uniform",
        category: "Activities",
        aliases: [
            "martial_arts_uniform"
        ],
        tags: [],
        unicodeVersion: "9.0",
        iosVersion: "10.2"
    },
    {
        emoji: "🥅",
        description: "goal net",
        category: "Activities",
        aliases: [
            "goal_net"
        ],
        tags: [],
        unicodeVersion: "9.0",
        iosVersion: "10.2"
    },
    {
        emoji: "⛳",
        description: "flag in hole",
        category: "Activities",
        aliases: [
            "golf"
        ],
        tags: [],
        unicodeVersion: "5.2",
        iosVersion: "6.0"
    },
    {
        emoji: "⛸️",
        description: "ice skate",
        category: "Activities",
        aliases: [
            "ice_skate"
        ],
        tags: [
            "skating"
        ],
        unicodeVersion: "5.2",
        iosVersion: "9.1"
    },
    {
        emoji: "🎣",
        description: "fishing pole",
        category: "Activities",
        aliases: [
            "fishing_pole_and_fish"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🤿",
        description: "diving mask",
        category: "Activities",
        aliases: [
            "diving_mask"
        ],
        tags: [],
        unicodeVersion: "12.0",
        iosVersion: "13.0"
    },
    {
        emoji: "🎽",
        description: "running shirt",
        category: "Activities",
        aliases: [
            "running_shirt_with_sash"
        ],
        tags: [
            "marathon"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🎿",
        description: "skis",
        category: "Activities",
        aliases: [
            "ski"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🛷",
        description: "sled",
        category: "Activities",
        aliases: [
            "sled"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🥌",
        description: "curling stone",
        category: "Activities",
        aliases: [
            "curling_stone"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🎯",
        description: "direct hit",
        category: "Activities",
        aliases: [
            "dart"
        ],
        tags: [
            "target"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🪀",
        description: "yo-yo",
        category: "Activities",
        aliases: [
            "yo_yo"
        ],
        tags: [],
        unicodeVersion: "12.0",
        iosVersion: "13.0"
    },
    {
        emoji: "🪁",
        description: "kite",
        category: "Activities",
        aliases: [
            "kite"
        ],
        tags: [],
        unicodeVersion: "12.0",
        iosVersion: "13.0"
    },
    {
        emoji: "🎱",
        description: "pool 8 ball",
        category: "Activities",
        aliases: [
            "8ball"
        ],
        tags: [
            "pool",
            "billiards"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🔮",
        description: "crystal ball",
        category: "Activities",
        aliases: [
            "crystal_ball"
        ],
        tags: [
            "fortune"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🪄",
        description: "magic wand",
        category: "Activities",
        aliases: [
            "magic_wand"
        ],
        tags: [],
        unicodeVersion: "13.0",
        iosVersion: "14.0"
    },
    {
        emoji: "🧿",
        description: "nazar amulet",
        category: "Activities",
        aliases: [
            "nazar_amulet"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🎮",
        description: "video game",
        category: "Activities",
        aliases: [
            "video_game"
        ],
        tags: [
            "play",
            "controller",
            "console"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🕹️",
        description: "joystick",
        category: "Activities",
        aliases: [
            "joystick"
        ],
        tags: [],
        unicodeVersion: "7.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🎰",
        description: "slot machine",
        category: "Activities",
        aliases: [
            "slot_machine"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🎲",
        description: "game die",
        category: "Activities",
        aliases: [
            "game_die"
        ],
        tags: [
            "dice",
            "gambling"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🧩",
        description: "puzzle piece",
        category: "Activities",
        aliases: [
            "jigsaw"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🧸",
        description: "teddy bear",
        category: "Activities",
        aliases: [
            "teddy_bear"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🪅",
        description: "piñata",
        category: "Activities",
        aliases: [
            "pinata"
        ],
        tags: [],
        unicodeVersion: "13.0",
        iosVersion: "14.0"
    },
    {
        emoji: "🪆",
        description: "nesting dolls",
        category: "Activities",
        aliases: [
            "nesting_dolls"
        ],
        tags: [],
        unicodeVersion: "13.0",
        iosVersion: "14.0"
    },
    {
        emoji: "♠️",
        description: "spade suit",
        category: "Activities",
        aliases: [
            "spades"
        ],
        tags: [],
        unicodeVersion: "",
        iosVersion: "6.0"
    },
    {
        emoji: "♥️",
        description: "heart suit",
        category: "Activities",
        aliases: [
            "hearts"
        ],
        tags: [],
        unicodeVersion: "",
        iosVersion: "6.0"
    },
    {
        emoji: "♦️",
        description: "diamond suit",
        category: "Activities",
        aliases: [
            "diamonds"
        ],
        tags: [],
        unicodeVersion: "",
        iosVersion: "6.0"
    },
    {
        emoji: "♣️",
        description: "club suit",
        category: "Activities",
        aliases: [
            "clubs"
        ],
        tags: [],
        unicodeVersion: "",
        iosVersion: "6.0"
    },
    {
        emoji: "♟️",
        description: "chess pawn",
        category: "Activities",
        aliases: [
            "chess_pawn"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🃏",
        description: "joker",
        category: "Activities",
        aliases: [
            "black_joker"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🀄",
        description: "mahjong red dragon",
        category: "Activities",
        aliases: [
            "mahjong"
        ],
        tags: [],
        unicodeVersion: "",
        iosVersion: "6.0"
    },
    {
        emoji: "🎴",
        description: "flower playing cards",
        category: "Activities",
        aliases: [
            "flower_playing_cards"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🎭",
        description: "performing arts",
        category: "Activities",
        aliases: [
            "performing_arts"
        ],
        tags: [
            "theater",
            "drama"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🖼️",
        description: "framed picture",
        category: "Activities",
        aliases: [
            "framed_picture"
        ],
        tags: [],
        unicodeVersion: "7.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🎨",
        description: "artist palette",
        category: "Activities",
        aliases: [
            "art"
        ],
        tags: [
            "design",
            "paint"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🧵",
        description: "thread",
        category: "Activities",
        aliases: [
            "thread"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🪡",
        description: "sewing needle",
        category: "Activities",
        aliases: [
            "sewing_needle"
        ],
        tags: [],
        unicodeVersion: "13.0",
        iosVersion: "14.0"
    },
    {
        emoji: "🧶",
        description: "yarn",
        category: "Activities",
        aliases: [
            "yarn"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🪢",
        description: "knot",
        category: "Activities",
        aliases: [
            "knot"
        ],
        tags: [],
        unicodeVersion: "13.0",
        iosVersion: "14.0"
    },
    {
        emoji: "👓",
        description: "glasses",
        category: "Objects",
        aliases: [
            "eyeglasses"
        ],
        tags: [
            "glasses"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🕶️",
        description: "sunglasses",
        category: "Objects",
        aliases: [
            "dark_sunglasses"
        ],
        tags: [],
        unicodeVersion: "7.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🥽",
        description: "goggles",
        category: "Objects",
        aliases: [
            "goggles"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🥼",
        description: "lab coat",
        category: "Objects",
        aliases: [
            "lab_coat"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🦺",
        description: "safety vest",
        category: "Objects",
        aliases: [
            "safety_vest"
        ],
        tags: [],
        unicodeVersion: "12.0",
        iosVersion: "13.0"
    },
    {
        emoji: "👔",
        description: "necktie",
        category: "Objects",
        aliases: [
            "necktie"
        ],
        tags: [
            "shirt",
            "formal"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "👕",
        description: "t-shirt",
        category: "Objects",
        aliases: [
            "shirt",
            "tshirt"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "👖",
        description: "jeans",
        category: "Objects",
        aliases: [
            "jeans"
        ],
        tags: [
            "pants"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🧣",
        description: "scarf",
        category: "Objects",
        aliases: [
            "scarf"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🧤",
        description: "gloves",
        category: "Objects",
        aliases: [
            "gloves"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🧥",
        description: "coat",
        category: "Objects",
        aliases: [
            "coat"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🧦",
        description: "socks",
        category: "Objects",
        aliases: [
            "socks"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "👗",
        description: "dress",
        category: "Objects",
        aliases: [
            "dress"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "👘",
        description: "kimono",
        category: "Objects",
        aliases: [
            "kimono"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🥻",
        description: "sari",
        category: "Objects",
        aliases: [
            "sari"
        ],
        tags: [],
        unicodeVersion: "12.0",
        iosVersion: "13.0"
    },
    {
        emoji: "🩱",
        description: "one-piece swimsuit",
        category: "Objects",
        aliases: [
            "one_piece_swimsuit"
        ],
        tags: [],
        unicodeVersion: "12.0",
        iosVersion: "13.0"
    },
    {
        emoji: "🩲",
        description: "briefs",
        category: "Objects",
        aliases: [
            "swim_brief"
        ],
        tags: [],
        unicodeVersion: "12.0",
        iosVersion: "13.0"
    },
    {
        emoji: "🩳",
        description: "shorts",
        category: "Objects",
        aliases: [
            "shorts"
        ],
        tags: [],
        unicodeVersion: "12.0",
        iosVersion: "13.0"
    },
    {
        emoji: "👙",
        description: "bikini",
        category: "Objects",
        aliases: [
            "bikini"
        ],
        tags: [
            "beach"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "👚",
        description: "woman’s clothes",
        category: "Objects",
        aliases: [
            "womans_clothes"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "👛",
        description: "purse",
        category: "Objects",
        aliases: [
            "purse"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "👜",
        description: "handbag",
        category: "Objects",
        aliases: [
            "handbag"
        ],
        tags: [
            "bag"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "👝",
        description: "clutch bag",
        category: "Objects",
        aliases: [
            "pouch"
        ],
        tags: [
            "bag"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🛍️",
        description: "shopping bags",
        category: "Objects",
        aliases: [
            "shopping"
        ],
        tags: [
            "bags"
        ],
        unicodeVersion: "7.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🎒",
        description: "backpack",
        category: "Objects",
        aliases: [
            "school_satchel"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🩴",
        description: "thong sandal",
        category: "Objects",
        aliases: [
            "thong_sandal"
        ],
        tags: [],
        unicodeVersion: "13.0",
        iosVersion: "14.0"
    },
    {
        emoji: "👞",
        description: "man’s shoe",
        category: "Objects",
        aliases: [
            "mans_shoe",
            "shoe"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "👟",
        description: "running shoe",
        category: "Objects",
        aliases: [
            "athletic_shoe"
        ],
        tags: [
            "sneaker",
            "sport",
            "running"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🥾",
        description: "hiking boot",
        category: "Objects",
        aliases: [
            "hiking_boot"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🥿",
        description: "flat shoe",
        category: "Objects",
        aliases: [
            "flat_shoe"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "👠",
        description: "high-heeled shoe",
        category: "Objects",
        aliases: [
            "high_heel"
        ],
        tags: [
            "shoe"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "👡",
        description: "woman’s sandal",
        category: "Objects",
        aliases: [
            "sandal"
        ],
        tags: [
            "shoe"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🩰",
        description: "ballet shoes",
        category: "Objects",
        aliases: [
            "ballet_shoes"
        ],
        tags: [],
        unicodeVersion: "12.0",
        iosVersion: "13.0"
    },
    {
        emoji: "👢",
        description: "woman’s boot",
        category: "Objects",
        aliases: [
            "boot"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "👑",
        description: "crown",
        category: "Objects",
        aliases: [
            "crown"
        ],
        tags: [
            "king",
            "queen",
            "royal"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "👒",
        description: "woman’s hat",
        category: "Objects",
        aliases: [
            "womans_hat"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🎩",
        description: "top hat",
        category: "Objects",
        aliases: [
            "tophat"
        ],
        tags: [
            "hat",
            "classy"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🎓",
        description: "graduation cap",
        category: "Objects",
        aliases: [
            "mortar_board"
        ],
        tags: [
            "education",
            "college",
            "university",
            "graduation"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🧢",
        description: "billed cap",
        category: "Objects",
        aliases: [
            "billed_cap"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🪖",
        description: "military helmet",
        category: "Objects",
        aliases: [
            "military_helmet"
        ],
        tags: [],
        unicodeVersion: "13.0",
        iosVersion: "14.0"
    },
    {
        emoji: "⛑️",
        description: "rescue worker’s helmet",
        category: "Objects",
        aliases: [
            "rescue_worker_helmet"
        ],
        tags: [],
        unicodeVersion: "5.2",
        iosVersion: "9.1"
    },
    {
        emoji: "📿",
        description: "prayer beads",
        category: "Objects",
        aliases: [
            "prayer_beads"
        ],
        tags: [],
        unicodeVersion: "8.0",
        iosVersion: "9.1"
    },
    {
        emoji: "💄",
        description: "lipstick",
        category: "Objects",
        aliases: [
            "lipstick"
        ],
        tags: [
            "makeup"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "💍",
        description: "ring",
        category: "Objects",
        aliases: [
            "ring"
        ],
        tags: [
            "wedding",
            "marriage",
            "engaged"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "💎",
        description: "gem stone",
        category: "Objects",
        aliases: [
            "gem"
        ],
        tags: [
            "diamond"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🔇",
        description: "muted speaker",
        category: "Objects",
        aliases: [
            "mute"
        ],
        tags: [
            "sound",
            "volume"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🔈",
        description: "speaker low volume",
        category: "Objects",
        aliases: [
            "speaker"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🔉",
        description: "speaker medium volume",
        category: "Objects",
        aliases: [
            "sound"
        ],
        tags: [
            "volume"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🔊",
        description: "speaker high volume",
        category: "Objects",
        aliases: [
            "loud_sound"
        ],
        tags: [
            "volume"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "📢",
        description: "loudspeaker",
        category: "Objects",
        aliases: [
            "loudspeaker"
        ],
        tags: [
            "announcement"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "📣",
        description: "megaphone",
        category: "Objects",
        aliases: [
            "mega"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "📯",
        description: "postal horn",
        category: "Objects",
        aliases: [
            "postal_horn"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🔔",
        description: "bell",
        category: "Objects",
        aliases: [
            "bell"
        ],
        tags: [
            "sound",
            "notification"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🔕",
        description: "bell with slash",
        category: "Objects",
        aliases: [
            "no_bell"
        ],
        tags: [
            "volume",
            "off"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🎼",
        description: "musical score",
        category: "Objects",
        aliases: [
            "musical_score"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🎵",
        description: "musical note",
        category: "Objects",
        aliases: [
            "musical_note"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🎶",
        description: "musical notes",
        category: "Objects",
        aliases: [
            "notes"
        ],
        tags: [
            "music"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🎙️",
        description: "studio microphone",
        category: "Objects",
        aliases: [
            "studio_microphone"
        ],
        tags: [
            "podcast"
        ],
        unicodeVersion: "7.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🎚️",
        description: "level slider",
        category: "Objects",
        aliases: [
            "level_slider"
        ],
        tags: [],
        unicodeVersion: "7.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🎛️",
        description: "control knobs",
        category: "Objects",
        aliases: [
            "control_knobs"
        ],
        tags: [],
        unicodeVersion: "7.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🎤",
        description: "microphone",
        category: "Objects",
        aliases: [
            "microphone"
        ],
        tags: [
            "sing"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🎧",
        description: "headphone",
        category: "Objects",
        aliases: [
            "headphones"
        ],
        tags: [
            "music",
            "earphones"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "📻",
        description: "radio",
        category: "Objects",
        aliases: [
            "radio"
        ],
        tags: [
            "podcast"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🎷",
        description: "saxophone",
        category: "Objects",
        aliases: [
            "saxophone"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🪗",
        description: "accordion",
        category: "Objects",
        aliases: [
            "accordion"
        ],
        tags: [],
        unicodeVersion: "13.0",
        iosVersion: "14.0"
    },
    {
        emoji: "🎸",
        description: "guitar",
        category: "Objects",
        aliases: [
            "guitar"
        ],
        tags: [
            "rock"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🎹",
        description: "musical keyboard",
        category: "Objects",
        aliases: [
            "musical_keyboard"
        ],
        tags: [
            "piano"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🎺",
        description: "trumpet",
        category: "Objects",
        aliases: [
            "trumpet"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🎻",
        description: "violin",
        category: "Objects",
        aliases: [
            "violin"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🪕",
        description: "banjo",
        category: "Objects",
        aliases: [
            "banjo"
        ],
        tags: [],
        unicodeVersion: "12.0",
        iosVersion: "13.0"
    },
    {
        emoji: "🥁",
        description: "drum",
        category: "Objects",
        aliases: [
            "drum"
        ],
        tags: [],
        unicodeVersion: "",
        iosVersion: "10.2"
    },
    {
        emoji: "🪘",
        description: "long drum",
        category: "Objects",
        aliases: [
            "long_drum"
        ],
        tags: [],
        unicodeVersion: "13.0",
        iosVersion: "14.0"
    },
    {
        emoji: "📱",
        description: "mobile phone",
        category: "Objects",
        aliases: [
            "iphone"
        ],
        tags: [
            "smartphone",
            "mobile"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "📲",
        description: "mobile phone with arrow",
        category: "Objects",
        aliases: [
            "calling"
        ],
        tags: [
            "call",
            "incoming"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "☎️",
        description: "telephone",
        category: "Objects",
        aliases: [
            "phone",
            "telephone"
        ],
        tags: [],
        unicodeVersion: "",
        iosVersion: "6.0"
    },
    {
        emoji: "📞",
        description: "telephone receiver",
        category: "Objects",
        aliases: [
            "telephone_receiver"
        ],
        tags: [
            "phone",
            "call"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "📟",
        description: "pager",
        category: "Objects",
        aliases: [
            "pager"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "📠",
        description: "fax machine",
        category: "Objects",
        aliases: [
            "fax"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🔋",
        description: "battery",
        category: "Objects",
        aliases: [
            "battery"
        ],
        tags: [
            "power"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🔌",
        description: "electric plug",
        category: "Objects",
        aliases: [
            "electric_plug"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "💻",
        description: "laptop",
        category: "Objects",
        aliases: [
            "computer"
        ],
        tags: [
            "desktop",
            "screen"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🖥️",
        description: "desktop computer",
        category: "Objects",
        aliases: [
            "desktop_computer"
        ],
        tags: [],
        unicodeVersion: "7.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🖨️",
        description: "printer",
        category: "Objects",
        aliases: [
            "printer"
        ],
        tags: [],
        unicodeVersion: "7.0",
        iosVersion: "9.1"
    },
    {
        emoji: "⌨️",
        description: "keyboard",
        category: "Objects",
        aliases: [
            "keyboard"
        ],
        tags: [],
        unicodeVersion: "",
        iosVersion: "9.1"
    },
    {
        emoji: "🖱️",
        description: "computer mouse",
        category: "Objects",
        aliases: [
            "computer_mouse"
        ],
        tags: [],
        unicodeVersion: "7.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🖲️",
        description: "trackball",
        category: "Objects",
        aliases: [
            "trackball"
        ],
        tags: [],
        unicodeVersion: "7.0",
        iosVersion: "9.1"
    },
    {
        emoji: "💽",
        description: "computer disk",
        category: "Objects",
        aliases: [
            "minidisc"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "💾",
        description: "floppy disk",
        category: "Objects",
        aliases: [
            "floppy_disk"
        ],
        tags: [
            "save"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "💿",
        description: "optical disk",
        category: "Objects",
        aliases: [
            "cd"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "📀",
        description: "dvd",
        category: "Objects",
        aliases: [
            "dvd"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🧮",
        description: "abacus",
        category: "Objects",
        aliases: [
            "abacus"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🎥",
        description: "movie camera",
        category: "Objects",
        aliases: [
            "movie_camera"
        ],
        tags: [
            "film",
            "video"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🎞️",
        description: "film frames",
        category: "Objects",
        aliases: [
            "film_strip"
        ],
        tags: [],
        unicodeVersion: "7.0",
        iosVersion: "9.1"
    },
    {
        emoji: "📽️",
        description: "film projector",
        category: "Objects",
        aliases: [
            "film_projector"
        ],
        tags: [],
        unicodeVersion: "7.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🎬",
        description: "clapper board",
        category: "Objects",
        aliases: [
            "clapper"
        ],
        tags: [
            "film"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "📺",
        description: "television",
        category: "Objects",
        aliases: [
            "tv"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "📷",
        description: "camera",
        category: "Objects",
        aliases: [
            "camera"
        ],
        tags: [
            "photo"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "📸",
        description: "camera with flash",
        category: "Objects",
        aliases: [
            "camera_flash"
        ],
        tags: [
            "photo"
        ],
        unicodeVersion: "7.0",
        iosVersion: "9.1"
    },
    {
        emoji: "📹",
        description: "video camera",
        category: "Objects",
        aliases: [
            "video_camera"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "📼",
        description: "videocassette",
        category: "Objects",
        aliases: [
            "vhs"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🔍",
        description: "magnifying glass tilted left",
        category: "Objects",
        aliases: [
            "mag"
        ],
        tags: [
            "search",
            "zoom"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🔎",
        description: "magnifying glass tilted right",
        category: "Objects",
        aliases: [
            "mag_right"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🕯️",
        description: "candle",
        category: "Objects",
        aliases: [
            "candle"
        ],
        tags: [],
        unicodeVersion: "7.0",
        iosVersion: "9.1"
    },
    {
        emoji: "💡",
        description: "light bulb",
        category: "Objects",
        aliases: [
            "bulb"
        ],
        tags: [
            "idea",
            "light"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🔦",
        description: "flashlight",
        category: "Objects",
        aliases: [
            "flashlight"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🏮",
        description: "red paper lantern",
        category: "Objects",
        aliases: [
            "izakaya_lantern",
            "lantern"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🪔",
        description: "diya lamp",
        category: "Objects",
        aliases: [
            "diya_lamp"
        ],
        tags: [],
        unicodeVersion: "12.0",
        iosVersion: "13.0"
    },
    {
        emoji: "📔",
        description: "notebook with decorative cover",
        category: "Objects",
        aliases: [
            "notebook_with_decorative_cover"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "📕",
        description: "closed book",
        category: "Objects",
        aliases: [
            "closed_book"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "📖",
        description: "open book",
        category: "Objects",
        aliases: [
            "book",
            "open_book"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "📗",
        description: "green book",
        category: "Objects",
        aliases: [
            "green_book"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "📘",
        description: "blue book",
        category: "Objects",
        aliases: [
            "blue_book"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "📙",
        description: "orange book",
        category: "Objects",
        aliases: [
            "orange_book"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "📚",
        description: "books",
        category: "Objects",
        aliases: [
            "books"
        ],
        tags: [
            "library"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "📓",
        description: "notebook",
        category: "Objects",
        aliases: [
            "notebook"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "📒",
        description: "ledger",
        category: "Objects",
        aliases: [
            "ledger"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "📃",
        description: "page with curl",
        category: "Objects",
        aliases: [
            "page_with_curl"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "📜",
        description: "scroll",
        category: "Objects",
        aliases: [
            "scroll"
        ],
        tags: [
            "document"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "📄",
        description: "page facing up",
        category: "Objects",
        aliases: [
            "page_facing_up"
        ],
        tags: [
            "document"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "📰",
        description: "newspaper",
        category: "Objects",
        aliases: [
            "newspaper"
        ],
        tags: [
            "press"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🗞️",
        description: "rolled-up newspaper",
        category: "Objects",
        aliases: [
            "newspaper_roll"
        ],
        tags: [
            "press"
        ],
        unicodeVersion: "7.0",
        iosVersion: "9.1"
    },
    {
        emoji: "📑",
        description: "bookmark tabs",
        category: "Objects",
        aliases: [
            "bookmark_tabs"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🔖",
        description: "bookmark",
        category: "Objects",
        aliases: [
            "bookmark"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🏷️",
        description: "label",
        category: "Objects",
        aliases: [
            "label"
        ],
        tags: [
            "tag"
        ],
        unicodeVersion: "7.0",
        iosVersion: "9.1"
    },
    {
        emoji: "💰",
        description: "money bag",
        category: "Objects",
        aliases: [
            "moneybag"
        ],
        tags: [
            "dollar",
            "cream"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🪙",
        description: "coin",
        category: "Objects",
        aliases: [
            "coin"
        ],
        tags: [],
        unicodeVersion: "13.0",
        iosVersion: "14.0"
    },
    {
        emoji: "💴",
        description: "yen banknote",
        category: "Objects",
        aliases: [
            "yen"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "💵",
        description: "dollar banknote",
        category: "Objects",
        aliases: [
            "dollar"
        ],
        tags: [
            "money"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "💶",
        description: "euro banknote",
        category: "Objects",
        aliases: [
            "euro"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "💷",
        description: "pound banknote",
        category: "Objects",
        aliases: [
            "pound"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "💸",
        description: "money with wings",
        category: "Objects",
        aliases: [
            "money_with_wings"
        ],
        tags: [
            "dollar"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "💳",
        description: "credit card",
        category: "Objects",
        aliases: [
            "credit_card"
        ],
        tags: [
            "subscription"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🧾",
        description: "receipt",
        category: "Objects",
        aliases: [
            "receipt"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "💹",
        description: "chart increasing with yen",
        category: "Objects",
        aliases: [
            "chart"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "✉️",
        description: "envelope",
        category: "Objects",
        aliases: [
            "email",
            "envelope"
        ],
        tags: [
            "letter"
        ],
        unicodeVersion: "",
        iosVersion: "6.0"
    },
    {
        emoji: "📧",
        description: "e-mail",
        category: "Objects",
        aliases: [
            "e-mail"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "📨",
        description: "incoming envelope",
        category: "Objects",
        aliases: [
            "incoming_envelope"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "📩",
        description: "envelope with arrow",
        category: "Objects",
        aliases: [
            "envelope_with_arrow"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "📤",
        description: "outbox tray",
        category: "Objects",
        aliases: [
            "outbox_tray"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "📥",
        description: "inbox tray",
        category: "Objects",
        aliases: [
            "inbox_tray"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "📦",
        description: "package",
        category: "Objects",
        aliases: [
            "package"
        ],
        tags: [
            "shipping"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "📫",
        description: "closed mailbox with raised flag",
        category: "Objects",
        aliases: [
            "mailbox"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "📪",
        description: "closed mailbox with lowered flag",
        category: "Objects",
        aliases: [
            "mailbox_closed"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "📬",
        description: "open mailbox with raised flag",
        category: "Objects",
        aliases: [
            "mailbox_with_mail"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "📭",
        description: "open mailbox with lowered flag",
        category: "Objects",
        aliases: [
            "mailbox_with_no_mail"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "📮",
        description: "postbox",
        category: "Objects",
        aliases: [
            "postbox"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🗳️",
        description: "ballot box with ballot",
        category: "Objects",
        aliases: [
            "ballot_box"
        ],
        tags: [],
        unicodeVersion: "7.0",
        iosVersion: "9.1"
    },
    {
        emoji: "✏️",
        description: "pencil",
        category: "Objects",
        aliases: [
            "pencil2"
        ],
        tags: [],
        unicodeVersion: "",
        iosVersion: "6.0"
    },
    {
        emoji: "✒️",
        description: "black nib",
        category: "Objects",
        aliases: [
            "black_nib"
        ],
        tags: [],
        unicodeVersion: "",
        iosVersion: "6.0"
    },
    {
        emoji: "🖋️",
        description: "fountain pen",
        category: "Objects",
        aliases: [
            "fountain_pen"
        ],
        tags: [],
        unicodeVersion: "7.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🖊️",
        description: "pen",
        category: "Objects",
        aliases: [
            "pen"
        ],
        tags: [],
        unicodeVersion: "7.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🖌️",
        description: "paintbrush",
        category: "Objects",
        aliases: [
            "paintbrush"
        ],
        tags: [],
        unicodeVersion: "7.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🖍️",
        description: "crayon",
        category: "Objects",
        aliases: [
            "crayon"
        ],
        tags: [],
        unicodeVersion: "7.0",
        iosVersion: "9.1"
    },
    {
        emoji: "📝",
        description: "memo",
        category: "Objects",
        aliases: [
            "memo",
            "pencil"
        ],
        tags: [
            "document",
            "note"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "💼",
        description: "briefcase",
        category: "Objects",
        aliases: [
            "briefcase"
        ],
        tags: [
            "business"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "📁",
        description: "file folder",
        category: "Objects",
        aliases: [
            "file_folder"
        ],
        tags: [
            "directory"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "📂",
        description: "open file folder",
        category: "Objects",
        aliases: [
            "open_file_folder"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🗂️",
        description: "card index dividers",
        category: "Objects",
        aliases: [
            "card_index_dividers"
        ],
        tags: [],
        unicodeVersion: "7.0",
        iosVersion: "9.1"
    },
    {
        emoji: "📅",
        description: "calendar",
        category: "Objects",
        aliases: [
            "date"
        ],
        tags: [
            "calendar",
            "schedule"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "📆",
        description: "tear-off calendar",
        category: "Objects",
        aliases: [
            "calendar"
        ],
        tags: [
            "schedule"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🗒️",
        description: "spiral notepad",
        category: "Objects",
        aliases: [
            "spiral_notepad"
        ],
        tags: [],
        unicodeVersion: "7.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🗓️",
        description: "spiral calendar",
        category: "Objects",
        aliases: [
            "spiral_calendar"
        ],
        tags: [],
        unicodeVersion: "7.0",
        iosVersion: "9.1"
    },
    {
        emoji: "📇",
        description: "card index",
        category: "Objects",
        aliases: [
            "card_index"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "📈",
        description: "chart increasing",
        category: "Objects",
        aliases: [
            "chart_with_upwards_trend"
        ],
        tags: [
            "graph",
            "metrics"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "📉",
        description: "chart decreasing",
        category: "Objects",
        aliases: [
            "chart_with_downwards_trend"
        ],
        tags: [
            "graph",
            "metrics"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "📊",
        description: "bar chart",
        category: "Objects",
        aliases: [
            "bar_chart"
        ],
        tags: [
            "stats",
            "metrics"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "📋",
        description: "clipboard",
        category: "Objects",
        aliases: [
            "clipboard"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "📌",
        description: "pushpin",
        category: "Objects",
        aliases: [
            "pushpin"
        ],
        tags: [
            "location"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "📍",
        description: "round pushpin",
        category: "Objects",
        aliases: [
            "round_pushpin"
        ],
        tags: [
            "location"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "📎",
        description: "paperclip",
        category: "Objects",
        aliases: [
            "paperclip"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🖇️",
        description: "linked paperclips",
        category: "Objects",
        aliases: [
            "paperclips"
        ],
        tags: [],
        unicodeVersion: "7.0",
        iosVersion: "9.1"
    },
    {
        emoji: "📏",
        description: "straight ruler",
        category: "Objects",
        aliases: [
            "straight_ruler"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "📐",
        description: "triangular ruler",
        category: "Objects",
        aliases: [
            "triangular_ruler"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "✂️",
        description: "scissors",
        category: "Objects",
        aliases: [
            "scissors"
        ],
        tags: [
            "cut"
        ],
        unicodeVersion: "",
        iosVersion: "6.0"
    },
    {
        emoji: "🗃️",
        description: "card file box",
        category: "Objects",
        aliases: [
            "card_file_box"
        ],
        tags: [],
        unicodeVersion: "7.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🗄️",
        description: "file cabinet",
        category: "Objects",
        aliases: [
            "file_cabinet"
        ],
        tags: [],
        unicodeVersion: "7.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🗑️",
        description: "wastebasket",
        category: "Objects",
        aliases: [
            "wastebasket"
        ],
        tags: [
            "trash"
        ],
        unicodeVersion: "7.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🔒",
        description: "locked",
        category: "Objects",
        aliases: [
            "lock"
        ],
        tags: [
            "security",
            "private"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🔓",
        description: "unlocked",
        category: "Objects",
        aliases: [
            "unlock"
        ],
        tags: [
            "security"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🔏",
        description: "locked with pen",
        category: "Objects",
        aliases: [
            "lock_with_ink_pen"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🔐",
        description: "locked with key",
        category: "Objects",
        aliases: [
            "closed_lock_with_key"
        ],
        tags: [
            "security"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🔑",
        description: "key",
        category: "Objects",
        aliases: [
            "key"
        ],
        tags: [
            "lock",
            "password"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🗝️",
        description: "old key",
        category: "Objects",
        aliases: [
            "old_key"
        ],
        tags: [],
        unicodeVersion: "7.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🔨",
        description: "hammer",
        category: "Objects",
        aliases: [
            "hammer"
        ],
        tags: [
            "tool"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🪓",
        description: "axe",
        category: "Objects",
        aliases: [
            "axe"
        ],
        tags: [],
        unicodeVersion: "12.0",
        iosVersion: "13.0"
    },
    {
        emoji: "⛏️",
        description: "pick",
        category: "Objects",
        aliases: [
            "pick"
        ],
        tags: [],
        unicodeVersion: "5.2",
        iosVersion: "9.1"
    },
    {
        emoji: "⚒️",
        description: "hammer and pick",
        category: "Objects",
        aliases: [
            "hammer_and_pick"
        ],
        tags: [],
        unicodeVersion: "4.1",
        iosVersion: "9.1"
    },
    {
        emoji: "🛠️",
        description: "hammer and wrench",
        category: "Objects",
        aliases: [
            "hammer_and_wrench"
        ],
        tags: [],
        unicodeVersion: "7.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🗡️",
        description: "dagger",
        category: "Objects",
        aliases: [
            "dagger"
        ],
        tags: [],
        unicodeVersion: "7.0",
        iosVersion: "9.1"
    },
    {
        emoji: "⚔️",
        description: "crossed swords",
        category: "Objects",
        aliases: [
            "crossed_swords"
        ],
        tags: [],
        unicodeVersion: "4.1",
        iosVersion: "9.1"
    },
    {
        emoji: "🔫",
        description: "pistol",
        category: "Objects",
        aliases: [
            "gun"
        ],
        tags: [
            "shoot",
            "weapon"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🪃",
        description: "boomerang",
        category: "Objects",
        aliases: [
            "boomerang"
        ],
        tags: [],
        unicodeVersion: "13.0",
        iosVersion: "14.0"
    },
    {
        emoji: "🏹",
        description: "bow and arrow",
        category: "Objects",
        aliases: [
            "bow_and_arrow"
        ],
        tags: [
            "archery"
        ],
        unicodeVersion: "8.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🛡️",
        description: "shield",
        category: "Objects",
        aliases: [
            "shield"
        ],
        tags: [],
        unicodeVersion: "7.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🪚",
        description: "carpentry saw",
        category: "Objects",
        aliases: [
            "carpentry_saw"
        ],
        tags: [],
        unicodeVersion: "13.0",
        iosVersion: "14.0"
    },
    {
        emoji: "🔧",
        description: "wrench",
        category: "Objects",
        aliases: [
            "wrench"
        ],
        tags: [
            "tool"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🪛",
        description: "screwdriver",
        category: "Objects",
        aliases: [
            "screwdriver"
        ],
        tags: [],
        unicodeVersion: "13.0",
        iosVersion: "14.0"
    },
    {
        emoji: "🔩",
        description: "nut and bolt",
        category: "Objects",
        aliases: [
            "nut_and_bolt"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "⚙️",
        description: "gear",
        category: "Objects",
        aliases: [
            "gear"
        ],
        tags: [],
        unicodeVersion: "4.1",
        iosVersion: "9.1"
    },
    {
        emoji: "🗜️",
        description: "clamp",
        category: "Objects",
        aliases: [
            "clamp"
        ],
        tags: [],
        unicodeVersion: "7.0",
        iosVersion: "9.1"
    },
    {
        emoji: "⚖️",
        description: "balance scale",
        category: "Objects",
        aliases: [
            "balance_scale"
        ],
        tags: [],
        unicodeVersion: "4.1",
        iosVersion: "9.1"
    },
    {
        emoji: "🦯",
        description: "white cane",
        category: "Objects",
        aliases: [
            "probing_cane"
        ],
        tags: [],
        unicodeVersion: "12.0",
        iosVersion: "13.0"
    },
    {
        emoji: "🔗",
        description: "link",
        category: "Objects",
        aliases: [
            "link"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "⛓️",
        description: "chains",
        category: "Objects",
        aliases: [
            "chains"
        ],
        tags: [],
        unicodeVersion: "5.2",
        iosVersion: "9.1"
    },
    {
        emoji: "🪝",
        description: "hook",
        category: "Objects",
        aliases: [
            "hook"
        ],
        tags: [],
        unicodeVersion: "13.0",
        iosVersion: "14.0"
    },
    {
        emoji: "🧰",
        description: "toolbox",
        category: "Objects",
        aliases: [
            "toolbox"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🧲",
        description: "magnet",
        category: "Objects",
        aliases: [
            "magnet"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🪜",
        description: "ladder",
        category: "Objects",
        aliases: [
            "ladder"
        ],
        tags: [],
        unicodeVersion: "13.0",
        iosVersion: "14.0"
    },
    {
        emoji: "⚗️",
        description: "alembic",
        category: "Objects",
        aliases: [
            "alembic"
        ],
        tags: [],
        unicodeVersion: "4.1",
        iosVersion: "9.1"
    },
    {
        emoji: "🧪",
        description: "test tube",
        category: "Objects",
        aliases: [
            "test_tube"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🧫",
        description: "petri dish",
        category: "Objects",
        aliases: [
            "petri_dish"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🧬",
        description: "dna",
        category: "Objects",
        aliases: [
            "dna"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🔬",
        description: "microscope",
        category: "Objects",
        aliases: [
            "microscope"
        ],
        tags: [
            "science",
            "laboratory",
            "investigate"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🔭",
        description: "telescope",
        category: "Objects",
        aliases: [
            "telescope"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "📡",
        description: "satellite antenna",
        category: "Objects",
        aliases: [
            "satellite"
        ],
        tags: [
            "signal"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "💉",
        description: "syringe",
        category: "Objects",
        aliases: [
            "syringe"
        ],
        tags: [
            "health",
            "hospital",
            "needle"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🩸",
        description: "drop of blood",
        category: "Objects",
        aliases: [
            "drop_of_blood"
        ],
        tags: [],
        unicodeVersion: "12.0",
        iosVersion: "13.0"
    },
    {
        emoji: "💊",
        description: "pill",
        category: "Objects",
        aliases: [
            "pill"
        ],
        tags: [
            "health",
            "medicine"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🩹",
        description: "adhesive bandage",
        category: "Objects",
        aliases: [
            "adhesive_bandage"
        ],
        tags: [],
        unicodeVersion: "12.0",
        iosVersion: "13.0"
    },
    {
        emoji: "🩺",
        description: "stethoscope",
        category: "Objects",
        aliases: [
            "stethoscope"
        ],
        tags: [],
        unicodeVersion: "12.0",
        iosVersion: "13.0"
    },
    {
        emoji: "🚪",
        description: "door",
        category: "Objects",
        aliases: [
            "door"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🛗",
        description: "elevator",
        category: "Objects",
        aliases: [
            "elevator"
        ],
        tags: [],
        unicodeVersion: "13.0",
        iosVersion: "14.0"
    },
    {
        emoji: "🪞",
        description: "mirror",
        category: "Objects",
        aliases: [
            "mirror"
        ],
        tags: [],
        unicodeVersion: "13.0",
        iosVersion: "14.0"
    },
    {
        emoji: "🪟",
        description: "window",
        category: "Objects",
        aliases: [
            "window"
        ],
        tags: [],
        unicodeVersion: "13.0",
        iosVersion: "14.0"
    },
    {
        emoji: "🛏️",
        description: "bed",
        category: "Objects",
        aliases: [
            "bed"
        ],
        tags: [],
        unicodeVersion: "7.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🛋️",
        description: "couch and lamp",
        category: "Objects",
        aliases: [
            "couch_and_lamp"
        ],
        tags: [],
        unicodeVersion: "7.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🪑",
        description: "chair",
        category: "Objects",
        aliases: [
            "chair"
        ],
        tags: [],
        unicodeVersion: "12.0",
        iosVersion: "13.0"
    },
    {
        emoji: "🚽",
        description: "toilet",
        category: "Objects",
        aliases: [
            "toilet"
        ],
        tags: [
            "wc"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🪠",
        description: "plunger",
        category: "Objects",
        aliases: [
            "plunger"
        ],
        tags: [],
        unicodeVersion: "13.0",
        iosVersion: "14.0"
    },
    {
        emoji: "🚿",
        description: "shower",
        category: "Objects",
        aliases: [
            "shower"
        ],
        tags: [
            "bath"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🛁",
        description: "bathtub",
        category: "Objects",
        aliases: [
            "bathtub"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🪤",
        description: "mouse trap",
        category: "Objects",
        aliases: [
            "mouse_trap"
        ],
        tags: [],
        unicodeVersion: "13.0",
        iosVersion: "14.0"
    },
    {
        emoji: "🪒",
        description: "razor",
        category: "Objects",
        aliases: [
            "razor"
        ],
        tags: [],
        unicodeVersion: "12.0",
        iosVersion: "13.0"
    },
    {
        emoji: "🧴",
        description: "lotion bottle",
        category: "Objects",
        aliases: [
            "lotion_bottle"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🧷",
        description: "safety pin",
        category: "Objects",
        aliases: [
            "safety_pin"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🧹",
        description: "broom",
        category: "Objects",
        aliases: [
            "broom"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🧺",
        description: "basket",
        category: "Objects",
        aliases: [
            "basket"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🧻",
        description: "roll of paper",
        category: "Objects",
        aliases: [
            "roll_of_paper"
        ],
        tags: [
            "toilet"
        ],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🪣",
        description: "bucket",
        category: "Objects",
        aliases: [
            "bucket"
        ],
        tags: [],
        unicodeVersion: "13.0",
        iosVersion: "14.0"
    },
    {
        emoji: "🧼",
        description: "soap",
        category: "Objects",
        aliases: [
            "soap"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🪥",
        description: "toothbrush",
        category: "Objects",
        aliases: [
            "toothbrush"
        ],
        tags: [],
        unicodeVersion: "13.0",
        iosVersion: "14.0"
    },
    {
        emoji: "🧽",
        description: "sponge",
        category: "Objects",
        aliases: [
            "sponge"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🧯",
        description: "fire extinguisher",
        category: "Objects",
        aliases: [
            "fire_extinguisher"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🛒",
        description: "shopping cart",
        category: "Objects",
        aliases: [
            "shopping_cart"
        ],
        tags: [],
        unicodeVersion: "9.0",
        iosVersion: "10.2"
    },
    {
        emoji: "🚬",
        description: "cigarette",
        category: "Objects",
        aliases: [
            "smoking"
        ],
        tags: [
            "cigarette"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "⚰️",
        description: "coffin",
        category: "Objects",
        aliases: [
            "coffin"
        ],
        tags: [
            "funeral"
        ],
        unicodeVersion: "4.1",
        iosVersion: "9.1"
    },
    {
        emoji: "🪦",
        description: "headstone",
        category: "Objects",
        aliases: [
            "headstone"
        ],
        tags: [],
        unicodeVersion: "13.0",
        iosVersion: "14.0"
    },
    {
        emoji: "⚱️",
        description: "funeral urn",
        category: "Objects",
        aliases: [
            "funeral_urn"
        ],
        tags: [],
        unicodeVersion: "4.1",
        iosVersion: "9.1"
    },
    {
        emoji: "🗿",
        description: "moai",
        category: "Objects",
        aliases: [
            "moyai"
        ],
        tags: [
            "stone"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🪧",
        description: "placard",
        category: "Objects",
        aliases: [
            "placard"
        ],
        tags: [],
        unicodeVersion: "13.0",
        iosVersion: "14.0"
    },
    {
        emoji: "🏧",
        description: "ATM sign",
        category: "Symbols",
        aliases: [
            "atm"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🚮",
        description: "litter in bin sign",
        category: "Symbols",
        aliases: [
            "put_litter_in_its_place"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🚰",
        description: "potable water",
        category: "Symbols",
        aliases: [
            "potable_water"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "♿",
        description: "wheelchair symbol",
        category: "Symbols",
        aliases: [
            "wheelchair"
        ],
        tags: [
            "accessibility"
        ],
        unicodeVersion: "4.1",
        iosVersion: "6.0"
    },
    {
        emoji: "🚹",
        description: "men’s room",
        category: "Symbols",
        aliases: [
            "mens"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🚺",
        description: "women’s room",
        category: "Symbols",
        aliases: [
            "womens"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🚻",
        description: "restroom",
        category: "Symbols",
        aliases: [
            "restroom"
        ],
        tags: [
            "toilet"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🚼",
        description: "baby symbol",
        category: "Symbols",
        aliases: [
            "baby_symbol"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🚾",
        description: "water closet",
        category: "Symbols",
        aliases: [
            "wc"
        ],
        tags: [
            "toilet",
            "restroom"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🛂",
        description: "passport control",
        category: "Symbols",
        aliases: [
            "passport_control"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🛃",
        description: "customs",
        category: "Symbols",
        aliases: [
            "customs"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🛄",
        description: "baggage claim",
        category: "Symbols",
        aliases: [
            "baggage_claim"
        ],
        tags: [
            "airport"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🛅",
        description: "left luggage",
        category: "Symbols",
        aliases: [
            "left_luggage"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "⚠️",
        description: "warning",
        category: "Symbols",
        aliases: [
            "warning"
        ],
        tags: [
            "wip"
        ],
        unicodeVersion: "4.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🚸",
        description: "children crossing",
        category: "Symbols",
        aliases: [
            "children_crossing"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "⛔",
        description: "no entry",
        category: "Symbols",
        aliases: [
            "no_entry"
        ],
        tags: [
            "limit"
        ],
        unicodeVersion: "5.2",
        iosVersion: "6.0"
    },
    {
        emoji: "🚫",
        description: "prohibited",
        category: "Symbols",
        aliases: [
            "no_entry_sign"
        ],
        tags: [
            "block",
            "forbidden"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🚳",
        description: "no bicycles",
        category: "Symbols",
        aliases: [
            "no_bicycles"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🚭",
        description: "no smoking",
        category: "Symbols",
        aliases: [
            "no_smoking"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🚯",
        description: "no littering",
        category: "Symbols",
        aliases: [
            "do_not_litter"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🚱",
        description: "non-potable water",
        category: "Symbols",
        aliases: [
            "non-potable_water"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🚷",
        description: "no pedestrians",
        category: "Symbols",
        aliases: [
            "no_pedestrians"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "📵",
        description: "no mobile phones",
        category: "Symbols",
        aliases: [
            "no_mobile_phones"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🔞",
        description: "no one under eighteen",
        category: "Symbols",
        aliases: [
            "underage"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "☢️",
        description: "radioactive",
        category: "Symbols",
        aliases: [
            "radioactive"
        ],
        tags: [],
        unicodeVersion: "",
        iosVersion: "9.1"
    },
    {
        emoji: "☣️",
        description: "biohazard",
        category: "Symbols",
        aliases: [
            "biohazard"
        ],
        tags: [],
        unicodeVersion: "",
        iosVersion: "9.1"
    },
    {
        emoji: "⬆️",
        description: "up arrow",
        category: "Symbols",
        aliases: [
            "arrow_up"
        ],
        tags: [],
        unicodeVersion: "4.0",
        iosVersion: "6.0"
    },
    {
        emoji: "↗️",
        description: "up-right arrow",
        category: "Symbols",
        aliases: [
            "arrow_upper_right"
        ],
        tags: [],
        unicodeVersion: "",
        iosVersion: "6.0"
    },
    {
        emoji: "➡️",
        description: "right arrow",
        category: "Symbols",
        aliases: [
            "arrow_right"
        ],
        tags: [],
        unicodeVersion: "",
        iosVersion: "6.0"
    },
    {
        emoji: "↘️",
        description: "down-right arrow",
        category: "Symbols",
        aliases: [
            "arrow_lower_right"
        ],
        tags: [],
        unicodeVersion: "",
        iosVersion: "6.0"
    },
    {
        emoji: "⬇️",
        description: "down arrow",
        category: "Symbols",
        aliases: [
            "arrow_down"
        ],
        tags: [],
        unicodeVersion: "4.0",
        iosVersion: "6.0"
    },
    {
        emoji: "↙️",
        description: "down-left arrow",
        category: "Symbols",
        aliases: [
            "arrow_lower_left"
        ],
        tags: [],
        unicodeVersion: "",
        iosVersion: "6.0"
    },
    {
        emoji: "⬅️",
        description: "left arrow",
        category: "Symbols",
        aliases: [
            "arrow_left"
        ],
        tags: [],
        unicodeVersion: "4.0",
        iosVersion: "6.0"
    },
    {
        emoji: "↖️",
        description: "up-left arrow",
        category: "Symbols",
        aliases: [
            "arrow_upper_left"
        ],
        tags: [],
        unicodeVersion: "",
        iosVersion: "6.0"
    },
    {
        emoji: "↕️",
        description: "up-down arrow",
        category: "Symbols",
        aliases: [
            "arrow_up_down"
        ],
        tags: [],
        unicodeVersion: "",
        iosVersion: "6.0"
    },
    {
        emoji: "↔️",
        description: "left-right arrow",
        category: "Symbols",
        aliases: [
            "left_right_arrow"
        ],
        tags: [],
        unicodeVersion: "",
        iosVersion: "6.0"
    },
    {
        emoji: "↩️",
        description: "right arrow curving left",
        category: "Symbols",
        aliases: [
            "leftwards_arrow_with_hook"
        ],
        tags: [
            "return"
        ],
        unicodeVersion: "",
        iosVersion: "6.0"
    },
    {
        emoji: "↪️",
        description: "left arrow curving right",
        category: "Symbols",
        aliases: [
            "arrow_right_hook"
        ],
        tags: [],
        unicodeVersion: "",
        iosVersion: "6.0"
    },
    {
        emoji: "⤴️",
        description: "right arrow curving up",
        category: "Symbols",
        aliases: [
            "arrow_heading_up"
        ],
        tags: [],
        unicodeVersion: "",
        iosVersion: "6.0"
    },
    {
        emoji: "⤵️",
        description: "right arrow curving down",
        category: "Symbols",
        aliases: [
            "arrow_heading_down"
        ],
        tags: [],
        unicodeVersion: "",
        iosVersion: "6.0"
    },
    {
        emoji: "🔃",
        description: "clockwise vertical arrows",
        category: "Symbols",
        aliases: [
            "arrows_clockwise"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🔄",
        description: "counterclockwise arrows button",
        category: "Symbols",
        aliases: [
            "arrows_counterclockwise"
        ],
        tags: [
            "sync"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🔙",
        description: "BACK arrow",
        category: "Symbols",
        aliases: [
            "back"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🔚",
        description: "END arrow",
        category: "Symbols",
        aliases: [
            "end"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🔛",
        description: "ON! arrow",
        category: "Symbols",
        aliases: [
            "on"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🔜",
        description: "SOON arrow",
        category: "Symbols",
        aliases: [
            "soon"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🔝",
        description: "TOP arrow",
        category: "Symbols",
        aliases: [
            "top"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🛐",
        description: "place of worship",
        category: "Symbols",
        aliases: [
            "place_of_worship"
        ],
        tags: [],
        unicodeVersion: "8.0",
        iosVersion: "9.1"
    },
    {
        emoji: "⚛️",
        description: "atom symbol",
        category: "Symbols",
        aliases: [
            "atom_symbol"
        ],
        tags: [],
        unicodeVersion: "4.1",
        iosVersion: "9.1"
    },
    {
        emoji: "🕉️",
        description: "om",
        category: "Symbols",
        aliases: [
            "om"
        ],
        tags: [],
        unicodeVersion: "7.0",
        iosVersion: "9.1"
    },
    {
        emoji: "✡️",
        description: "star of David",
        category: "Symbols",
        aliases: [
            "star_of_david"
        ],
        tags: [],
        unicodeVersion: "",
        iosVersion: "9.1"
    },
    {
        emoji: "☸️",
        description: "wheel of dharma",
        category: "Symbols",
        aliases: [
            "wheel_of_dharma"
        ],
        tags: [],
        unicodeVersion: "",
        iosVersion: "9.1"
    },
    {
        emoji: "☯️",
        description: "yin yang",
        category: "Symbols",
        aliases: [
            "yin_yang"
        ],
        tags: [],
        unicodeVersion: "",
        iosVersion: "9.1"
    },
    {
        emoji: "✝️",
        description: "latin cross",
        category: "Symbols",
        aliases: [
            "latin_cross"
        ],
        tags: [],
        unicodeVersion: "",
        iosVersion: "9.1"
    },
    {
        emoji: "☦️",
        description: "orthodox cross",
        category: "Symbols",
        aliases: [
            "orthodox_cross"
        ],
        tags: [],
        unicodeVersion: "",
        iosVersion: "9.1"
    },
    {
        emoji: "☪️",
        description: "star and crescent",
        category: "Symbols",
        aliases: [
            "star_and_crescent"
        ],
        tags: [],
        unicodeVersion: "",
        iosVersion: "9.1"
    },
    {
        emoji: "☮️",
        description: "peace symbol",
        category: "Symbols",
        aliases: [
            "peace_symbol"
        ],
        tags: [],
        unicodeVersion: "",
        iosVersion: "9.1"
    },
    {
        emoji: "🕎",
        description: "menorah",
        category: "Symbols",
        aliases: [
            "menorah"
        ],
        tags: [],
        unicodeVersion: "8.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🔯",
        description: "dotted six-pointed star",
        category: "Symbols",
        aliases: [
            "six_pointed_star"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "♈",
        description: "Aries",
        category: "Symbols",
        aliases: [
            "aries"
        ],
        tags: [],
        unicodeVersion: "",
        iosVersion: "6.0"
    },
    {
        emoji: "♉",
        description: "Taurus",
        category: "Symbols",
        aliases: [
            "taurus"
        ],
        tags: [],
        unicodeVersion: "",
        iosVersion: "6.0"
    },
    {
        emoji: "♊",
        description: "Gemini",
        category: "Symbols",
        aliases: [
            "gemini"
        ],
        tags: [],
        unicodeVersion: "",
        iosVersion: "6.0"
    },
    {
        emoji: "♋",
        description: "Cancer",
        category: "Symbols",
        aliases: [
            "cancer"
        ],
        tags: [],
        unicodeVersion: "",
        iosVersion: "6.0"
    },
    {
        emoji: "♌",
        description: "Leo",
        category: "Symbols",
        aliases: [
            "leo"
        ],
        tags: [],
        unicodeVersion: "",
        iosVersion: "6.0"
    },
    {
        emoji: "♍",
        description: "Virgo",
        category: "Symbols",
        aliases: [
            "virgo"
        ],
        tags: [],
        unicodeVersion: "",
        iosVersion: "6.0"
    },
    {
        emoji: "♎",
        description: "Libra",
        category: "Symbols",
        aliases: [
            "libra"
        ],
        tags: [],
        unicodeVersion: "",
        iosVersion: "6.0"
    },
    {
        emoji: "♏",
        description: "Scorpio",
        category: "Symbols",
        aliases: [
            "scorpius"
        ],
        tags: [],
        unicodeVersion: "",
        iosVersion: "6.0"
    },
    {
        emoji: "♐",
        description: "Sagittarius",
        category: "Symbols",
        aliases: [
            "sagittarius"
        ],
        tags: [],
        unicodeVersion: "",
        iosVersion: "6.0"
    },
    {
        emoji: "♑",
        description: "Capricorn",
        category: "Symbols",
        aliases: [
            "capricorn"
        ],
        tags: [],
        unicodeVersion: "",
        iosVersion: "6.0"
    },
    {
        emoji: "♒",
        description: "Aquarius",
        category: "Symbols",
        aliases: [
            "aquarius"
        ],
        tags: [],
        unicodeVersion: "",
        iosVersion: "6.0"
    },
    {
        emoji: "♓",
        description: "Pisces",
        category: "Symbols",
        aliases: [
            "pisces"
        ],
        tags: [],
        unicodeVersion: "",
        iosVersion: "6.0"
    },
    {
        emoji: "⛎",
        description: "Ophiuchus",
        category: "Symbols",
        aliases: [
            "ophiuchus"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🔀",
        description: "shuffle tracks button",
        category: "Symbols",
        aliases: [
            "twisted_rightwards_arrows"
        ],
        tags: [
            "shuffle"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🔁",
        description: "repeat button",
        category: "Symbols",
        aliases: [
            "repeat"
        ],
        tags: [
            "loop"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🔂",
        description: "repeat single button",
        category: "Symbols",
        aliases: [
            "repeat_one"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "▶️",
        description: "play button",
        category: "Symbols",
        aliases: [
            "arrow_forward"
        ],
        tags: [],
        unicodeVersion: "",
        iosVersion: "6.0"
    },
    {
        emoji: "⏩",
        description: "fast-forward button",
        category: "Symbols",
        aliases: [
            "fast_forward"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "⏭️",
        description: "next track button",
        category: "Symbols",
        aliases: [
            "next_track_button"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "9.1"
    },
    {
        emoji: "⏯️",
        description: "play or pause button",
        category: "Symbols",
        aliases: [
            "play_or_pause_button"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "9.1"
    },
    {
        emoji: "◀️",
        description: "reverse button",
        category: "Symbols",
        aliases: [
            "arrow_backward"
        ],
        tags: [],
        unicodeVersion: "",
        iosVersion: "6.0"
    },
    {
        emoji: "⏪",
        description: "fast reverse button",
        category: "Symbols",
        aliases: [
            "rewind"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "⏮️",
        description: "last track button",
        category: "Symbols",
        aliases: [
            "previous_track_button"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🔼",
        description: "upwards button",
        category: "Symbols",
        aliases: [
            "arrow_up_small"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "⏫",
        description: "fast up button",
        category: "Symbols",
        aliases: [
            "arrow_double_up"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🔽",
        description: "downwards button",
        category: "Symbols",
        aliases: [
            "arrow_down_small"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "⏬",
        description: "fast down button",
        category: "Symbols",
        aliases: [
            "arrow_double_down"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "⏸️",
        description: "pause button",
        category: "Symbols",
        aliases: [
            "pause_button"
        ],
        tags: [],
        unicodeVersion: "7.0",
        iosVersion: "9.1"
    },
    {
        emoji: "⏹️",
        description: "stop button",
        category: "Symbols",
        aliases: [
            "stop_button"
        ],
        tags: [],
        unicodeVersion: "7.0",
        iosVersion: "9.1"
    },
    {
        emoji: "⏺️",
        description: "record button",
        category: "Symbols",
        aliases: [
            "record_button"
        ],
        tags: [],
        unicodeVersion: "7.0",
        iosVersion: "9.1"
    },
    {
        emoji: "⏏️",
        description: "eject button",
        category: "Symbols",
        aliases: [
            "eject_button"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🎦",
        description: "cinema",
        category: "Symbols",
        aliases: [
            "cinema"
        ],
        tags: [
            "film",
            "movie"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🔅",
        description: "dim button",
        category: "Symbols",
        aliases: [
            "low_brightness"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🔆",
        description: "bright button",
        category: "Symbols",
        aliases: [
            "high_brightness"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "📶",
        description: "antenna bars",
        category: "Symbols",
        aliases: [
            "signal_strength"
        ],
        tags: [
            "wifi"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "📳",
        description: "vibration mode",
        category: "Symbols",
        aliases: [
            "vibration_mode"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "📴",
        description: "mobile phone off",
        category: "Symbols",
        aliases: [
            "mobile_phone_off"
        ],
        tags: [
            "mute",
            "off"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "♀️",
        description: "female sign",
        category: "Symbols",
        aliases: [
            "female_sign"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "♂️",
        description: "male sign",
        category: "Symbols",
        aliases: [
            "male_sign"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "⚧️",
        description: "transgender symbol",
        category: "Symbols",
        aliases: [
            "transgender_symbol"
        ],
        tags: [],
        unicodeVersion: "13.0",
        iosVersion: "14.0"
    },
    {
        emoji: "✖️",
        description: "multiply",
        category: "Symbols",
        aliases: [
            "heavy_multiplication_x"
        ],
        tags: [],
        unicodeVersion: "",
        iosVersion: "6.0"
    },
    {
        emoji: "➕",
        description: "plus",
        category: "Symbols",
        aliases: [
            "heavy_plus_sign"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "➖",
        description: "minus",
        category: "Symbols",
        aliases: [
            "heavy_minus_sign"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "➗",
        description: "divide",
        category: "Symbols",
        aliases: [
            "heavy_division_sign"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "♾️",
        description: "infinity",
        category: "Symbols",
        aliases: [
            "infinity"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "‼️",
        description: "double exclamation mark",
        category: "Symbols",
        aliases: [
            "bangbang"
        ],
        tags: [],
        unicodeVersion: "",
        iosVersion: "6.0"
    },
    {
        emoji: "⁉️",
        description: "exclamation question mark",
        category: "Symbols",
        aliases: [
            "interrobang"
        ],
        tags: [],
        unicodeVersion: "3.0",
        iosVersion: "6.0"
    },
    {
        emoji: "❓",
        description: "question mark",
        category: "Symbols",
        aliases: [
            "question"
        ],
        tags: [
            "confused"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "❔",
        description: "white question mark",
        category: "Symbols",
        aliases: [
            "grey_question"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "❕",
        description: "white exclamation mark",
        category: "Symbols",
        aliases: [
            "grey_exclamation"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "❗",
        description: "exclamation mark",
        category: "Symbols",
        aliases: [
            "exclamation",
            "heavy_exclamation_mark"
        ],
        tags: [
            "bang"
        ],
        unicodeVersion: "5.2",
        iosVersion: "6.0"
    },
    {
        emoji: "〰️",
        description: "wavy dash",
        category: "Symbols",
        aliases: [
            "wavy_dash"
        ],
        tags: [],
        unicodeVersion: "",
        iosVersion: "6.0"
    },
    {
        emoji: "💱",
        description: "currency exchange",
        category: "Symbols",
        aliases: [
            "currency_exchange"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "💲",
        description: "heavy dollar sign",
        category: "Symbols",
        aliases: [
            "heavy_dollar_sign"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "⚕️",
        description: "medical symbol",
        category: "Symbols",
        aliases: [
            "medical_symbol"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "♻️",
        description: "recycling symbol",
        category: "Symbols",
        aliases: [
            "recycle"
        ],
        tags: [
            "environment",
            "green"
        ],
        unicodeVersion: "3.2",
        iosVersion: "6.0"
    },
    {
        emoji: "⚜️",
        description: "fleur-de-lis",
        category: "Symbols",
        aliases: [
            "fleur_de_lis"
        ],
        tags: [],
        unicodeVersion: "4.1",
        iosVersion: "9.1"
    },
    {
        emoji: "🔱",
        description: "trident emblem",
        category: "Symbols",
        aliases: [
            "trident"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "📛",
        description: "name badge",
        category: "Symbols",
        aliases: [
            "name_badge"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🔰",
        description: "Japanese symbol for beginner",
        category: "Symbols",
        aliases: [
            "beginner"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "⭕",
        description: "hollow red circle",
        category: "Symbols",
        aliases: [
            "o"
        ],
        tags: [],
        unicodeVersion: "5.2",
        iosVersion: "6.0"
    },
    {
        emoji: "✅",
        description: "check mark button",
        category: "Symbols",
        aliases: [
            "white_check_mark"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "☑️",
        description: "check box with check",
        category: "Symbols",
        aliases: [
            "ballot_box_with_check"
        ],
        tags: [],
        unicodeVersion: "",
        iosVersion: "6.0"
    },
    {
        emoji: "✔️",
        description: "check mark",
        category: "Symbols",
        aliases: [
            "heavy_check_mark"
        ],
        tags: [],
        unicodeVersion: "",
        iosVersion: "6.0"
    },
    {
        emoji: "❌",
        description: "cross mark",
        category: "Symbols",
        aliases: [
            "x"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "❎",
        description: "cross mark button",
        category: "Symbols",
        aliases: [
            "negative_squared_cross_mark"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "➰",
        description: "curly loop",
        category: "Symbols",
        aliases: [
            "curly_loop"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "➿",
        description: "double curly loop",
        category: "Symbols",
        aliases: [
            "loop"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "〽️",
        description: "part alternation mark",
        category: "Symbols",
        aliases: [
            "part_alternation_mark"
        ],
        tags: [],
        unicodeVersion: "3.2",
        iosVersion: "6.0"
    },
    {
        emoji: "✳️",
        description: "eight-spoked asterisk",
        category: "Symbols",
        aliases: [
            "eight_spoked_asterisk"
        ],
        tags: [],
        unicodeVersion: "",
        iosVersion: "6.0"
    },
    {
        emoji: "✴️",
        description: "eight-pointed star",
        category: "Symbols",
        aliases: [
            "eight_pointed_black_star"
        ],
        tags: [],
        unicodeVersion: "",
        iosVersion: "6.0"
    },
    {
        emoji: "❇️",
        description: "sparkle",
        category: "Symbols",
        aliases: [
            "sparkle"
        ],
        tags: [],
        unicodeVersion: "",
        iosVersion: "6.0"
    },
    {
        emoji: "©️",
        description: "copyright",
        category: "Symbols",
        aliases: [
            "copyright"
        ],
        tags: [],
        unicodeVersion: "",
        iosVersion: "6.0"
    },
    {
        emoji: "®️",
        description: "registered",
        category: "Symbols",
        aliases: [
            "registered"
        ],
        tags: [],
        unicodeVersion: "",
        iosVersion: "6.0"
    },
    {
        emoji: "™️",
        description: "trade mark",
        category: "Symbols",
        aliases: [
            "tm"
        ],
        tags: [
            "trademark"
        ],
        unicodeVersion: "",
        iosVersion: "6.0"
    },
    {
        emoji: "#️⃣",
        description: "keycap: #",
        category: "Symbols",
        aliases: [
            "hash"
        ],
        tags: [
            "number"
        ],
        unicodeVersion: "",
        iosVersion: "6.0"
    },
    {
        emoji: "*️⃣",
        description: "keycap: *",
        category: "Symbols",
        aliases: [
            "asterisk"
        ],
        tags: [],
        unicodeVersion: "",
        iosVersion: "9.1"
    },
    {
        emoji: "0️⃣",
        description: "keycap: 0",
        category: "Symbols",
        aliases: [
            "zero"
        ],
        tags: [],
        unicodeVersion: "",
        iosVersion: "6.0"
    },
    {
        emoji: "1️⃣",
        description: "keycap: 1",
        category: "Symbols",
        aliases: [
            "one"
        ],
        tags: [],
        unicodeVersion: "",
        iosVersion: "6.0"
    },
    {
        emoji: "2️⃣",
        description: "keycap: 2",
        category: "Symbols",
        aliases: [
            "two"
        ],
        tags: [],
        unicodeVersion: "",
        iosVersion: "6.0"
    },
    {
        emoji: "3️⃣",
        description: "keycap: 3",
        category: "Symbols",
        aliases: [
            "three"
        ],
        tags: [],
        unicodeVersion: "",
        iosVersion: "6.0"
    },
    {
        emoji: "4️⃣",
        description: "keycap: 4",
        category: "Symbols",
        aliases: [
            "four"
        ],
        tags: [],
        unicodeVersion: "",
        iosVersion: "6.0"
    },
    {
        emoji: "5️⃣",
        description: "keycap: 5",
        category: "Symbols",
        aliases: [
            "five"
        ],
        tags: [],
        unicodeVersion: "",
        iosVersion: "6.0"
    },
    {
        emoji: "6️⃣",
        description: "keycap: 6",
        category: "Symbols",
        aliases: [
            "six"
        ],
        tags: [],
        unicodeVersion: "",
        iosVersion: "6.0"
    },
    {
        emoji: "7️⃣",
        description: "keycap: 7",
        category: "Symbols",
        aliases: [
            "seven"
        ],
        tags: [],
        unicodeVersion: "",
        iosVersion: "6.0"
    },
    {
        emoji: "8️⃣",
        description: "keycap: 8",
        category: "Symbols",
        aliases: [
            "eight"
        ],
        tags: [],
        unicodeVersion: "",
        iosVersion: "6.0"
    },
    {
        emoji: "9️⃣",
        description: "keycap: 9",
        category: "Symbols",
        aliases: [
            "nine"
        ],
        tags: [],
        unicodeVersion: "",
        iosVersion: "6.0"
    },
    {
        emoji: "🔟",
        description: "keycap: 10",
        category: "Symbols",
        aliases: [
            "keycap_ten"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🔠",
        description: "input latin uppercase",
        category: "Symbols",
        aliases: [
            "capital_abcd"
        ],
        tags: [
            "letters"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🔡",
        description: "input latin lowercase",
        category: "Symbols",
        aliases: [
            "abcd"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🔢",
        description: "input numbers",
        category: "Symbols",
        aliases: [
            "1234"
        ],
        tags: [
            "numbers"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🔣",
        description: "input symbols",
        category: "Symbols",
        aliases: [
            "symbols"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🔤",
        description: "input latin letters",
        category: "Symbols",
        aliases: [
            "abc"
        ],
        tags: [
            "alphabet"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🅰️",
        description: "A button (blood type)",
        category: "Symbols",
        aliases: [
            "a"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🆎",
        description: "AB button (blood type)",
        category: "Symbols",
        aliases: [
            "ab"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🅱️",
        description: "B button (blood type)",
        category: "Symbols",
        aliases: [
            "b"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🆑",
        description: "CL button",
        category: "Symbols",
        aliases: [
            "cl"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🆒",
        description: "COOL button",
        category: "Symbols",
        aliases: [
            "cool"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🆓",
        description: "FREE button",
        category: "Symbols",
        aliases: [
            "free"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "ℹ️",
        description: "information",
        category: "Symbols",
        aliases: [
            "information_source"
        ],
        tags: [],
        unicodeVersion: "3.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🆔",
        description: "ID button",
        category: "Symbols",
        aliases: [
            "id"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "Ⓜ️",
        description: "circled M",
        category: "Symbols",
        aliases: [
            "m"
        ],
        tags: [],
        unicodeVersion: "",
        iosVersion: "6.0"
    },
    {
        emoji: "🆕",
        description: "NEW button",
        category: "Symbols",
        aliases: [
            "new"
        ],
        tags: [
            "fresh"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🆖",
        description: "NG button",
        category: "Symbols",
        aliases: [
            "ng"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🅾️",
        description: "O button (blood type)",
        category: "Symbols",
        aliases: [
            "o2"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🆗",
        description: "OK button",
        category: "Symbols",
        aliases: [
            "ok"
        ],
        tags: [
            "yes"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🅿️",
        description: "P button",
        category: "Symbols",
        aliases: [
            "parking"
        ],
        tags: [],
        unicodeVersion: "5.2",
        iosVersion: "6.0"
    },
    {
        emoji: "🆘",
        description: "SOS button",
        category: "Symbols",
        aliases: [
            "sos"
        ],
        tags: [
            "help",
            "emergency"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🆙",
        description: "UP! button",
        category: "Symbols",
        aliases: [
            "up"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🆚",
        description: "VS button",
        category: "Symbols",
        aliases: [
            "vs"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🈁",
        description: "Japanese “here” button",
        category: "Symbols",
        aliases: [
            "koko"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🈂️",
        description: "Japanese “service charge” button",
        category: "Symbols",
        aliases: [
            "sa"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🈷️",
        description: "Japanese “monthly amount” button",
        category: "Symbols",
        aliases: [
            "u6708"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🈶",
        description: "Japanese “not free of charge” button",
        category: "Symbols",
        aliases: [
            "u6709"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🈯",
        description: "Japanese “reserved” button",
        category: "Symbols",
        aliases: [
            "u6307"
        ],
        tags: [],
        unicodeVersion: "",
        iosVersion: "6.0"
    },
    {
        emoji: "🉐",
        description: "Japanese “bargain” button",
        category: "Symbols",
        aliases: [
            "ideograph_advantage"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🈹",
        description: "Japanese “discount” button",
        category: "Symbols",
        aliases: [
            "u5272"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🈚",
        description: "Japanese “free of charge” button",
        category: "Symbols",
        aliases: [
            "u7121"
        ],
        tags: [],
        unicodeVersion: "",
        iosVersion: "6.0"
    },
    {
        emoji: "🈲",
        description: "Japanese “prohibited” button",
        category: "Symbols",
        aliases: [
            "u7981"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🉑",
        description: "Japanese “acceptable” button",
        category: "Symbols",
        aliases: [
            "accept"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🈸",
        description: "Japanese “application” button",
        category: "Symbols",
        aliases: [
            "u7533"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🈴",
        description: "Japanese “passing grade” button",
        category: "Symbols",
        aliases: [
            "u5408"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🈳",
        description: "Japanese “vacancy” button",
        category: "Symbols",
        aliases: [
            "u7a7a"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "㊗️",
        description: "Japanese “congratulations” button",
        category: "Symbols",
        aliases: [
            "congratulations"
        ],
        tags: [],
        unicodeVersion: "",
        iosVersion: "6.0"
    },
    {
        emoji: "㊙️",
        description: "Japanese “secret” button",
        category: "Symbols",
        aliases: [
            "secret"
        ],
        tags: [],
        unicodeVersion: "",
        iosVersion: "6.0"
    },
    {
        emoji: "🈺",
        description: "Japanese “open for business” button",
        category: "Symbols",
        aliases: [
            "u55b6"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🈵",
        description: "Japanese “no vacancy” button",
        category: "Symbols",
        aliases: [
            "u6e80"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🔴",
        description: "red circle",
        category: "Symbols",
        aliases: [
            "red_circle"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🟠",
        description: "orange circle",
        category: "Symbols",
        aliases: [
            "orange_circle"
        ],
        tags: [],
        unicodeVersion: "12.0",
        iosVersion: "13.0"
    },
    {
        emoji: "🟡",
        description: "yellow circle",
        category: "Symbols",
        aliases: [
            "yellow_circle"
        ],
        tags: [],
        unicodeVersion: "12.0",
        iosVersion: "13.0"
    },
    {
        emoji: "🟢",
        description: "green circle",
        category: "Symbols",
        aliases: [
            "green_circle"
        ],
        tags: [],
        unicodeVersion: "12.0",
        iosVersion: "13.0"
    },
    {
        emoji: "🔵",
        description: "blue circle",
        category: "Symbols",
        aliases: [
            "large_blue_circle"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🟣",
        description: "purple circle",
        category: "Symbols",
        aliases: [
            "purple_circle"
        ],
        tags: [],
        unicodeVersion: "12.0",
        iosVersion: "13.0"
    },
    {
        emoji: "🟤",
        description: "brown circle",
        category: "Symbols",
        aliases: [
            "brown_circle"
        ],
        tags: [],
        unicodeVersion: "12.0",
        iosVersion: "13.0"
    },
    {
        emoji: "⚫",
        description: "black circle",
        category: "Symbols",
        aliases: [
            "black_circle"
        ],
        tags: [],
        unicodeVersion: "4.1",
        iosVersion: "6.0"
    },
    {
        emoji: "⚪",
        description: "white circle",
        category: "Symbols",
        aliases: [
            "white_circle"
        ],
        tags: [],
        unicodeVersion: "4.1",
        iosVersion: "6.0"
    },
    {
        emoji: "🟥",
        description: "red square",
        category: "Symbols",
        aliases: [
            "red_square"
        ],
        tags: [],
        unicodeVersion: "12.0",
        iosVersion: "13.0"
    },
    {
        emoji: "🟧",
        description: "orange square",
        category: "Symbols",
        aliases: [
            "orange_square"
        ],
        tags: [],
        unicodeVersion: "12.0",
        iosVersion: "13.0"
    },
    {
        emoji: "🟨",
        description: "yellow square",
        category: "Symbols",
        aliases: [
            "yellow_square"
        ],
        tags: [],
        unicodeVersion: "12.0",
        iosVersion: "13.0"
    },
    {
        emoji: "🟩",
        description: "green square",
        category: "Symbols",
        aliases: [
            "green_square"
        ],
        tags: [],
        unicodeVersion: "12.0",
        iosVersion: "13.0"
    },
    {
        emoji: "🟦",
        description: "blue square",
        category: "Symbols",
        aliases: [
            "blue_square"
        ],
        tags: [],
        unicodeVersion: "12.0",
        iosVersion: "13.0"
    },
    {
        emoji: "🟪",
        description: "purple square",
        category: "Symbols",
        aliases: [
            "purple_square"
        ],
        tags: [],
        unicodeVersion: "12.0",
        iosVersion: "13.0"
    },
    {
        emoji: "🟫",
        description: "brown square",
        category: "Symbols",
        aliases: [
            "brown_square"
        ],
        tags: [],
        unicodeVersion: "12.0",
        iosVersion: "13.0"
    },
    {
        emoji: "⬛",
        description: "black large square",
        category: "Symbols",
        aliases: [
            "black_large_square"
        ],
        tags: [],
        unicodeVersion: "5.1",
        iosVersion: "6.0"
    },
    {
        emoji: "⬜",
        description: "white large square",
        category: "Symbols",
        aliases: [
            "white_large_square"
        ],
        tags: [],
        unicodeVersion: "5.1",
        iosVersion: "6.0"
    },
    {
        emoji: "◼️",
        description: "black medium square",
        category: "Symbols",
        aliases: [
            "black_medium_square"
        ],
        tags: [],
        unicodeVersion: "3.2",
        iosVersion: "6.0"
    },
    {
        emoji: "◻️",
        description: "white medium square",
        category: "Symbols",
        aliases: [
            "white_medium_square"
        ],
        tags: [],
        unicodeVersion: "3.2",
        iosVersion: "6.0"
    },
    {
        emoji: "◾",
        description: "black medium-small square",
        category: "Symbols",
        aliases: [
            "black_medium_small_square"
        ],
        tags: [],
        unicodeVersion: "3.2",
        iosVersion: "6.0"
    },
    {
        emoji: "◽",
        description: "white medium-small square",
        category: "Symbols",
        aliases: [
            "white_medium_small_square"
        ],
        tags: [],
        unicodeVersion: "3.2",
        iosVersion: "6.0"
    },
    {
        emoji: "▪️",
        description: "black small square",
        category: "Symbols",
        aliases: [
            "black_small_square"
        ],
        tags: [],
        unicodeVersion: "",
        iosVersion: "6.0"
    },
    {
        emoji: "▫️",
        description: "white small square",
        category: "Symbols",
        aliases: [
            "white_small_square"
        ],
        tags: [],
        unicodeVersion: "",
        iosVersion: "6.0"
    },
    {
        emoji: "🔶",
        description: "large orange diamond",
        category: "Symbols",
        aliases: [
            "large_orange_diamond"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🔷",
        description: "large blue diamond",
        category: "Symbols",
        aliases: [
            "large_blue_diamond"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🔸",
        description: "small orange diamond",
        category: "Symbols",
        aliases: [
            "small_orange_diamond"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🔹",
        description: "small blue diamond",
        category: "Symbols",
        aliases: [
            "small_blue_diamond"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🔺",
        description: "red triangle pointed up",
        category: "Symbols",
        aliases: [
            "small_red_triangle"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🔻",
        description: "red triangle pointed down",
        category: "Symbols",
        aliases: [
            "small_red_triangle_down"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "💠",
        description: "diamond with a dot",
        category: "Symbols",
        aliases: [
            "diamond_shape_with_a_dot_inside"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🔘",
        description: "radio button",
        category: "Symbols",
        aliases: [
            "radio_button"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🔳",
        description: "white square button",
        category: "Symbols",
        aliases: [
            "white_square_button"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🔲",
        description: "black square button",
        category: "Symbols",
        aliases: [
            "black_square_button"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🏁",
        description: "chequered flag",
        category: "Flags",
        aliases: [
            "checkered_flag"
        ],
        tags: [
            "milestone",
            "finish"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🚩",
        description: "triangular flag",
        category: "Flags",
        aliases: [
            "triangular_flag_on_post"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🎌",
        description: "crossed flags",
        category: "Flags",
        aliases: [
            "crossed_flags"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🏴",
        description: "black flag",
        category: "Flags",
        aliases: [
            "black_flag"
        ],
        tags: [],
        unicodeVersion: "7.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🏳️",
        description: "white flag",
        category: "Flags",
        aliases: [
            "white_flag"
        ],
        tags: [],
        unicodeVersion: "7.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🏳️‍🌈",
        description: "rainbow flag",
        category: "Flags",
        aliases: [
            "rainbow_flag"
        ],
        tags: [
            "pride"
        ],
        unicodeVersion: "6.0",
        iosVersion: "10.0"
    },
    {
        emoji: "🏳️‍⚧️",
        description: "transgender flag",
        category: "Flags",
        aliases: [
            "transgender_flag"
        ],
        tags: [],
        unicodeVersion: "13.0",
        iosVersion: "14.0"
    },
    {
        emoji: "🏴‍☠️",
        description: "pirate flag",
        category: "Flags",
        aliases: [
            "pirate_flag"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🇦🇨",
        description: "flag: Ascension Island",
        category: "Flags",
        aliases: [
            "ascension_island"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🇦🇩",
        description: "flag: Andorra",
        category: "Flags",
        aliases: [
            "andorra"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇦🇪",
        description: "flag: United Arab Emirates",
        category: "Flags",
        aliases: [
            "united_arab_emirates"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇦🇫",
        description: "flag: Afghanistan",
        category: "Flags",
        aliases: [
            "afghanistan"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇦🇬",
        description: "flag: Antigua & Barbuda",
        category: "Flags",
        aliases: [
            "antigua_barbuda"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇦🇮",
        description: "flag: Anguilla",
        category: "Flags",
        aliases: [
            "anguilla"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇦🇱",
        description: "flag: Albania",
        category: "Flags",
        aliases: [
            "albania"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇦🇲",
        description: "flag: Armenia",
        category: "Flags",
        aliases: [
            "armenia"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇦🇴",
        description: "flag: Angola",
        category: "Flags",
        aliases: [
            "angola"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇦🇶",
        description: "flag: Antarctica",
        category: "Flags",
        aliases: [
            "antarctica"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "9.0"
    },
    {
        emoji: "🇦🇷",
        description: "flag: Argentina",
        category: "Flags",
        aliases: [
            "argentina"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇦🇸",
        description: "flag: American Samoa",
        category: "Flags",
        aliases: [
            "american_samoa"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇦🇹",
        description: "flag: Austria",
        category: "Flags",
        aliases: [
            "austria"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇦🇺",
        description: "flag: Australia",
        category: "Flags",
        aliases: [
            "australia"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇦🇼",
        description: "flag: Aruba",
        category: "Flags",
        aliases: [
            "aruba"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇦🇽",
        description: "flag: Åland Islands",
        category: "Flags",
        aliases: [
            "aland_islands"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "9.0"
    },
    {
        emoji: "🇦🇿",
        description: "flag: Azerbaijan",
        category: "Flags",
        aliases: [
            "azerbaijan"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇧🇦",
        description: "flag: Bosnia & Herzegovina",
        category: "Flags",
        aliases: [
            "bosnia_herzegovina"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇧🇧",
        description: "flag: Barbados",
        category: "Flags",
        aliases: [
            "barbados"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇧🇩",
        description: "flag: Bangladesh",
        category: "Flags",
        aliases: [
            "bangladesh"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇧🇪",
        description: "flag: Belgium",
        category: "Flags",
        aliases: [
            "belgium"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇧🇫",
        description: "flag: Burkina Faso",
        category: "Flags",
        aliases: [
            "burkina_faso"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇧🇬",
        description: "flag: Bulgaria",
        category: "Flags",
        aliases: [
            "bulgaria"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇧🇭",
        description: "flag: Bahrain",
        category: "Flags",
        aliases: [
            "bahrain"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇧🇮",
        description: "flag: Burundi",
        category: "Flags",
        aliases: [
            "burundi"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇧🇯",
        description: "flag: Benin",
        category: "Flags",
        aliases: [
            "benin"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇧🇱",
        description: "flag: St. Barthélemy",
        category: "Flags",
        aliases: [
            "st_barthelemy"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "9.0"
    },
    {
        emoji: "🇧🇲",
        description: "flag: Bermuda",
        category: "Flags",
        aliases: [
            "bermuda"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇧🇳",
        description: "flag: Brunei",
        category: "Flags",
        aliases: [
            "brunei"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇧🇴",
        description: "flag: Bolivia",
        category: "Flags",
        aliases: [
            "bolivia"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇧🇶",
        description: "flag: Caribbean Netherlands",
        category: "Flags",
        aliases: [
            "caribbean_netherlands"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "9.0"
    },
    {
        emoji: "🇧🇷",
        description: "flag: Brazil",
        category: "Flags",
        aliases: [
            "brazil"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇧🇸",
        description: "flag: Bahamas",
        category: "Flags",
        aliases: [
            "bahamas"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇧🇹",
        description: "flag: Bhutan",
        category: "Flags",
        aliases: [
            "bhutan"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇧🇻",
        description: "flag: Bouvet Island",
        category: "Flags",
        aliases: [
            "bouvet_island"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🇧🇼",
        description: "flag: Botswana",
        category: "Flags",
        aliases: [
            "botswana"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇧🇾",
        description: "flag: Belarus",
        category: "Flags",
        aliases: [
            "belarus"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇧🇿",
        description: "flag: Belize",
        category: "Flags",
        aliases: [
            "belize"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇨🇦",
        description: "flag: Canada",
        category: "Flags",
        aliases: [
            "canada"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇨🇨",
        description: "flag: Cocos (Keeling) Islands",
        category: "Flags",
        aliases: [
            "cocos_islands"
        ],
        tags: [
            "keeling"
        ],
        unicodeVersion: "6.0",
        iosVersion: "9.0"
    },
    {
        emoji: "🇨🇩",
        description: "flag: Congo - Kinshasa",
        category: "Flags",
        aliases: [
            "congo_kinshasa"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇨🇫",
        description: "flag: Central African Republic",
        category: "Flags",
        aliases: [
            "central_african_republic"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇨🇬",
        description: "flag: Congo - Brazzaville",
        category: "Flags",
        aliases: [
            "congo_brazzaville"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇨🇭",
        description: "flag: Switzerland",
        category: "Flags",
        aliases: [
            "switzerland"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇨🇮",
        description: "flag: Côte d’Ivoire",
        category: "Flags",
        aliases: [
            "cote_divoire"
        ],
        tags: [
            "ivory"
        ],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇨🇰",
        description: "flag: Cook Islands",
        category: "Flags",
        aliases: [
            "cook_islands"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇨🇱",
        description: "flag: Chile",
        category: "Flags",
        aliases: [
            "chile"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇨🇲",
        description: "flag: Cameroon",
        category: "Flags",
        aliases: [
            "cameroon"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇨🇳",
        description: "flag: China",
        category: "Flags",
        aliases: [
            "cn"
        ],
        tags: [
            "china"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🇨🇴",
        description: "flag: Colombia",
        category: "Flags",
        aliases: [
            "colombia"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇨🇵",
        description: "flag: Clipperton Island",
        category: "Flags",
        aliases: [
            "clipperton_island"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🇨🇷",
        description: "flag: Costa Rica",
        category: "Flags",
        aliases: [
            "costa_rica"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇨🇺",
        description: "flag: Cuba",
        category: "Flags",
        aliases: [
            "cuba"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇨🇻",
        description: "flag: Cape Verde",
        category: "Flags",
        aliases: [
            "cape_verde"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇨🇼",
        description: "flag: Curaçao",
        category: "Flags",
        aliases: [
            "curacao"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇨🇽",
        description: "flag: Christmas Island",
        category: "Flags",
        aliases: [
            "christmas_island"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "9.0"
    },
    {
        emoji: "🇨🇾",
        description: "flag: Cyprus",
        category: "Flags",
        aliases: [
            "cyprus"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇨🇿",
        description: "flag: Czechia",
        category: "Flags",
        aliases: [
            "czech_republic"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇩🇪",
        description: "flag: Germany",
        category: "Flags",
        aliases: [
            "de"
        ],
        tags: [
            "flag",
            "germany"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🇩🇬",
        description: "flag: Diego Garcia",
        category: "Flags",
        aliases: [
            "diego_garcia"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🇩🇯",
        description: "flag: Djibouti",
        category: "Flags",
        aliases: [
            "djibouti"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇩🇰",
        description: "flag: Denmark",
        category: "Flags",
        aliases: [
            "denmark"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇩🇲",
        description: "flag: Dominica",
        category: "Flags",
        aliases: [
            "dominica"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇩🇴",
        description: "flag: Dominican Republic",
        category: "Flags",
        aliases: [
            "dominican_republic"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇩🇿",
        description: "flag: Algeria",
        category: "Flags",
        aliases: [
            "algeria"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇪🇦",
        description: "flag: Ceuta & Melilla",
        category: "Flags",
        aliases: [
            "ceuta_melilla"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🇪🇨",
        description: "flag: Ecuador",
        category: "Flags",
        aliases: [
            "ecuador"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇪🇪",
        description: "flag: Estonia",
        category: "Flags",
        aliases: [
            "estonia"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇪🇬",
        description: "flag: Egypt",
        category: "Flags",
        aliases: [
            "egypt"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇪🇭",
        description: "flag: Western Sahara",
        category: "Flags",
        aliases: [
            "western_sahara"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "9.0"
    },
    {
        emoji: "🇪🇷",
        description: "flag: Eritrea",
        category: "Flags",
        aliases: [
            "eritrea"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇪🇸",
        description: "flag: Spain",
        category: "Flags",
        aliases: [
            "es"
        ],
        tags: [
            "spain"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🇪🇹",
        description: "flag: Ethiopia",
        category: "Flags",
        aliases: [
            "ethiopia"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇪🇺",
        description: "flag: European Union",
        category: "Flags",
        aliases: [
            "eu",
            "european_union"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "9.0"
    },
    {
        emoji: "🇫🇮",
        description: "flag: Finland",
        category: "Flags",
        aliases: [
            "finland"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇫🇯",
        description: "flag: Fiji",
        category: "Flags",
        aliases: [
            "fiji"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇫🇰",
        description: "flag: Falkland Islands",
        category: "Flags",
        aliases: [
            "falkland_islands"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "9.0"
    },
    {
        emoji: "🇫🇲",
        description: "flag: Micronesia",
        category: "Flags",
        aliases: [
            "micronesia"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "9.0"
    },
    {
        emoji: "🇫🇴",
        description: "flag: Faroe Islands",
        category: "Flags",
        aliases: [
            "faroe_islands"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇫🇷",
        description: "flag: France",
        category: "Flags",
        aliases: [
            "fr"
        ],
        tags: [
            "france",
            "french"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🇬🇦",
        description: "flag: Gabon",
        category: "Flags",
        aliases: [
            "gabon"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇬🇧",
        description: "flag: United Kingdom",
        category: "Flags",
        aliases: [
            "gb",
            "uk"
        ],
        tags: [
            "flag",
            "british"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🇬🇩",
        description: "flag: Grenada",
        category: "Flags",
        aliases: [
            "grenada"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇬🇪",
        description: "flag: Georgia",
        category: "Flags",
        aliases: [
            "georgia"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇬🇫",
        description: "flag: French Guiana",
        category: "Flags",
        aliases: [
            "french_guiana"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇬🇬",
        description: "flag: Guernsey",
        category: "Flags",
        aliases: [
            "guernsey"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "9.0"
    },
    {
        emoji: "🇬🇭",
        description: "flag: Ghana",
        category: "Flags",
        aliases: [
            "ghana"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇬🇮",
        description: "flag: Gibraltar",
        category: "Flags",
        aliases: [
            "gibraltar"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇬🇱",
        description: "flag: Greenland",
        category: "Flags",
        aliases: [
            "greenland"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "9.0"
    },
    {
        emoji: "🇬🇲",
        description: "flag: Gambia",
        category: "Flags",
        aliases: [
            "gambia"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇬🇳",
        description: "flag: Guinea",
        category: "Flags",
        aliases: [
            "guinea"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇬🇵",
        description: "flag: Guadeloupe",
        category: "Flags",
        aliases: [
            "guadeloupe"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "9.0"
    },
    {
        emoji: "🇬🇶",
        description: "flag: Equatorial Guinea",
        category: "Flags",
        aliases: [
            "equatorial_guinea"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇬🇷",
        description: "flag: Greece",
        category: "Flags",
        aliases: [
            "greece"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇬🇸",
        description: "flag: South Georgia & South Sandwich Islands",
        category: "Flags",
        aliases: [
            "south_georgia_south_sandwich_islands"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "9.0"
    },
    {
        emoji: "🇬🇹",
        description: "flag: Guatemala",
        category: "Flags",
        aliases: [
            "guatemala"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇬🇺",
        description: "flag: Guam",
        category: "Flags",
        aliases: [
            "guam"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇬🇼",
        description: "flag: Guinea-Bissau",
        category: "Flags",
        aliases: [
            "guinea_bissau"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇬🇾",
        description: "flag: Guyana",
        category: "Flags",
        aliases: [
            "guyana"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇭🇰",
        description: "flag: Hong Kong SAR China",
        category: "Flags",
        aliases: [
            "hong_kong"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇭🇲",
        description: "flag: Heard & McDonald Islands",
        category: "Flags",
        aliases: [
            "heard_mcdonald_islands"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🇭🇳",
        description: "flag: Honduras",
        category: "Flags",
        aliases: [
            "honduras"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇭🇷",
        description: "flag: Croatia",
        category: "Flags",
        aliases: [
            "croatia"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇭🇹",
        description: "flag: Haiti",
        category: "Flags",
        aliases: [
            "haiti"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇭🇺",
        description: "flag: Hungary",
        category: "Flags",
        aliases: [
            "hungary"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇮🇨",
        description: "flag: Canary Islands",
        category: "Flags",
        aliases: [
            "canary_islands"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "9.0"
    },
    {
        emoji: "🇮🇩",
        description: "flag: Indonesia",
        category: "Flags",
        aliases: [
            "indonesia"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇮🇪",
        description: "flag: Ireland",
        category: "Flags",
        aliases: [
            "ireland"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇮🇱",
        description: "flag: Israel",
        category: "Flags",
        aliases: [
            "israel"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇮🇲",
        description: "flag: Isle of Man",
        category: "Flags",
        aliases: [
            "isle_of_man"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "9.0"
    },
    {
        emoji: "🇮🇳",
        description: "flag: India",
        category: "Flags",
        aliases: [
            "india"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇮🇴",
        description: "flag: British Indian Ocean Territory",
        category: "Flags",
        aliases: [
            "british_indian_ocean_territory"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "9.0"
    },
    {
        emoji: "🇮🇶",
        description: "flag: Iraq",
        category: "Flags",
        aliases: [
            "iraq"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇮🇷",
        description: "flag: Iran",
        category: "Flags",
        aliases: [
            "iran"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇮🇸",
        description: "flag: Iceland",
        category: "Flags",
        aliases: [
            "iceland"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇮🇹",
        description: "flag: Italy",
        category: "Flags",
        aliases: [
            "it"
        ],
        tags: [
            "italy"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🇯🇪",
        description: "flag: Jersey",
        category: "Flags",
        aliases: [
            "jersey"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "9.0"
    },
    {
        emoji: "🇯🇲",
        description: "flag: Jamaica",
        category: "Flags",
        aliases: [
            "jamaica"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇯🇴",
        description: "flag: Jordan",
        category: "Flags",
        aliases: [
            "jordan"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇯🇵",
        description: "flag: Japan",
        category: "Flags",
        aliases: [
            "jp"
        ],
        tags: [
            "japan"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🇰🇪",
        description: "flag: Kenya",
        category: "Flags",
        aliases: [
            "kenya"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇰🇬",
        description: "flag: Kyrgyzstan",
        category: "Flags",
        aliases: [
            "kyrgyzstan"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇰🇭",
        description: "flag: Cambodia",
        category: "Flags",
        aliases: [
            "cambodia"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇰🇮",
        description: "flag: Kiribati",
        category: "Flags",
        aliases: [
            "kiribati"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇰🇲",
        description: "flag: Comoros",
        category: "Flags",
        aliases: [
            "comoros"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇰🇳",
        description: "flag: St. Kitts & Nevis",
        category: "Flags",
        aliases: [
            "st_kitts_nevis"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇰🇵",
        description: "flag: North Korea",
        category: "Flags",
        aliases: [
            "north_korea"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇰🇷",
        description: "flag: South Korea",
        category: "Flags",
        aliases: [
            "kr"
        ],
        tags: [
            "korea"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🇰🇼",
        description: "flag: Kuwait",
        category: "Flags",
        aliases: [
            "kuwait"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇰🇾",
        description: "flag: Cayman Islands",
        category: "Flags",
        aliases: [
            "cayman_islands"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇰🇿",
        description: "flag: Kazakhstan",
        category: "Flags",
        aliases: [
            "kazakhstan"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇱🇦",
        description: "flag: Laos",
        category: "Flags",
        aliases: [
            "laos"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇱🇧",
        description: "flag: Lebanon",
        category: "Flags",
        aliases: [
            "lebanon"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇱🇨",
        description: "flag: St. Lucia",
        category: "Flags",
        aliases: [
            "st_lucia"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇱🇮",
        description: "flag: Liechtenstein",
        category: "Flags",
        aliases: [
            "liechtenstein"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇱🇰",
        description: "flag: Sri Lanka",
        category: "Flags",
        aliases: [
            "sri_lanka"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇱🇷",
        description: "flag: Liberia",
        category: "Flags",
        aliases: [
            "liberia"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇱🇸",
        description: "flag: Lesotho",
        category: "Flags",
        aliases: [
            "lesotho"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇱🇹",
        description: "flag: Lithuania",
        category: "Flags",
        aliases: [
            "lithuania"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇱🇺",
        description: "flag: Luxembourg",
        category: "Flags",
        aliases: [
            "luxembourg"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇱🇻",
        description: "flag: Latvia",
        category: "Flags",
        aliases: [
            "latvia"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇱🇾",
        description: "flag: Libya",
        category: "Flags",
        aliases: [
            "libya"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇲🇦",
        description: "flag: Morocco",
        category: "Flags",
        aliases: [
            "morocco"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇲🇨",
        description: "flag: Monaco",
        category: "Flags",
        aliases: [
            "monaco"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "9.0"
    },
    {
        emoji: "🇲🇩",
        description: "flag: Moldova",
        category: "Flags",
        aliases: [
            "moldova"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇲🇪",
        description: "flag: Montenegro",
        category: "Flags",
        aliases: [
            "montenegro"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇲🇫",
        description: "flag: St. Martin",
        category: "Flags",
        aliases: [
            "st_martin"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🇲🇬",
        description: "flag: Madagascar",
        category: "Flags",
        aliases: [
            "madagascar"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇲🇭",
        description: "flag: Marshall Islands",
        category: "Flags",
        aliases: [
            "marshall_islands"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "9.0"
    },
    {
        emoji: "🇲🇰",
        description: "flag: North Macedonia",
        category: "Flags",
        aliases: [
            "macedonia"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇲🇱",
        description: "flag: Mali",
        category: "Flags",
        aliases: [
            "mali"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇲🇲",
        description: "flag: Myanmar (Burma)",
        category: "Flags",
        aliases: [
            "myanmar"
        ],
        tags: [
            "burma"
        ],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇲🇳",
        description: "flag: Mongolia",
        category: "Flags",
        aliases: [
            "mongolia"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇲🇴",
        description: "flag: Macao SAR China",
        category: "Flags",
        aliases: [
            "macau"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇲🇵",
        description: "flag: Northern Mariana Islands",
        category: "Flags",
        aliases: [
            "northern_mariana_islands"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇲🇶",
        description: "flag: Martinique",
        category: "Flags",
        aliases: [
            "martinique"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "9.0"
    },
    {
        emoji: "🇲🇷",
        description: "flag: Mauritania",
        category: "Flags",
        aliases: [
            "mauritania"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇲🇸",
        description: "flag: Montserrat",
        category: "Flags",
        aliases: [
            "montserrat"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇲🇹",
        description: "flag: Malta",
        category: "Flags",
        aliases: [
            "malta"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇲🇺",
        description: "flag: Mauritius",
        category: "Flags",
        aliases: [
            "mauritius"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "9.0"
    },
    {
        emoji: "🇲🇻",
        description: "flag: Maldives",
        category: "Flags",
        aliases: [
            "maldives"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇲🇼",
        description: "flag: Malawi",
        category: "Flags",
        aliases: [
            "malawi"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇲🇽",
        description: "flag: Mexico",
        category: "Flags",
        aliases: [
            "mexico"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇲🇾",
        description: "flag: Malaysia",
        category: "Flags",
        aliases: [
            "malaysia"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇲🇿",
        description: "flag: Mozambique",
        category: "Flags",
        aliases: [
            "mozambique"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇳🇦",
        description: "flag: Namibia",
        category: "Flags",
        aliases: [
            "namibia"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇳🇨",
        description: "flag: New Caledonia",
        category: "Flags",
        aliases: [
            "new_caledonia"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇳🇪",
        description: "flag: Niger",
        category: "Flags",
        aliases: [
            "niger"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇳🇫",
        description: "flag: Norfolk Island",
        category: "Flags",
        aliases: [
            "norfolk_island"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "9.0"
    },
    {
        emoji: "🇳🇬",
        description: "flag: Nigeria",
        category: "Flags",
        aliases: [
            "nigeria"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇳🇮",
        description: "flag: Nicaragua",
        category: "Flags",
        aliases: [
            "nicaragua"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇳🇱",
        description: "flag: Netherlands",
        category: "Flags",
        aliases: [
            "netherlands"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇳🇴",
        description: "flag: Norway",
        category: "Flags",
        aliases: [
            "norway"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇳🇵",
        description: "flag: Nepal",
        category: "Flags",
        aliases: [
            "nepal"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇳🇷",
        description: "flag: Nauru",
        category: "Flags",
        aliases: [
            "nauru"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "9.0"
    },
    {
        emoji: "🇳🇺",
        description: "flag: Niue",
        category: "Flags",
        aliases: [
            "niue"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇳🇿",
        description: "flag: New Zealand",
        category: "Flags",
        aliases: [
            "new_zealand"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇴🇲",
        description: "flag: Oman",
        category: "Flags",
        aliases: [
            "oman"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇵🇦",
        description: "flag: Panama",
        category: "Flags",
        aliases: [
            "panama"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇵🇪",
        description: "flag: Peru",
        category: "Flags",
        aliases: [
            "peru"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇵🇫",
        description: "flag: French Polynesia",
        category: "Flags",
        aliases: [
            "french_polynesia"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "9.0"
    },
    {
        emoji: "🇵🇬",
        description: "flag: Papua New Guinea",
        category: "Flags",
        aliases: [
            "papua_new_guinea"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇵🇭",
        description: "flag: Philippines",
        category: "Flags",
        aliases: [
            "philippines"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇵🇰",
        description: "flag: Pakistan",
        category: "Flags",
        aliases: [
            "pakistan"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇵🇱",
        description: "flag: Poland",
        category: "Flags",
        aliases: [
            "poland"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇵🇲",
        description: "flag: St. Pierre & Miquelon",
        category: "Flags",
        aliases: [
            "st_pierre_miquelon"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "9.0"
    },
    {
        emoji: "🇵🇳",
        description: "flag: Pitcairn Islands",
        category: "Flags",
        aliases: [
            "pitcairn_islands"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "9.0"
    },
    {
        emoji: "🇵🇷",
        description: "flag: Puerto Rico",
        category: "Flags",
        aliases: [
            "puerto_rico"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇵🇸",
        description: "flag: Palestinian Territories",
        category: "Flags",
        aliases: [
            "palestinian_territories"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇵🇹",
        description: "flag: Portugal",
        category: "Flags",
        aliases: [
            "portugal"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇵🇼",
        description: "flag: Palau",
        category: "Flags",
        aliases: [
            "palau"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇵🇾",
        description: "flag: Paraguay",
        category: "Flags",
        aliases: [
            "paraguay"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇶🇦",
        description: "flag: Qatar",
        category: "Flags",
        aliases: [
            "qatar"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇷🇪",
        description: "flag: Réunion",
        category: "Flags",
        aliases: [
            "reunion"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "9.0"
    },
    {
        emoji: "🇷🇴",
        description: "flag: Romania",
        category: "Flags",
        aliases: [
            "romania"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇷🇸",
        description: "flag: Serbia",
        category: "Flags",
        aliases: [
            "serbia"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇷🇺",
        description: "flag: Russia",
        category: "Flags",
        aliases: [
            "ru"
        ],
        tags: [
            "russia"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🇷🇼",
        description: "flag: Rwanda",
        category: "Flags",
        aliases: [
            "rwanda"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇸🇦",
        description: "flag: Saudi Arabia",
        category: "Flags",
        aliases: [
            "saudi_arabia"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇸🇧",
        description: "flag: Solomon Islands",
        category: "Flags",
        aliases: [
            "solomon_islands"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇸🇨",
        description: "flag: Seychelles",
        category: "Flags",
        aliases: [
            "seychelles"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇸🇩",
        description: "flag: Sudan",
        category: "Flags",
        aliases: [
            "sudan"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇸🇪",
        description: "flag: Sweden",
        category: "Flags",
        aliases: [
            "sweden"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇸🇬",
        description: "flag: Singapore",
        category: "Flags",
        aliases: [
            "singapore"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇸🇭",
        description: "flag: St. Helena",
        category: "Flags",
        aliases: [
            "st_helena"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "9.0"
    },
    {
        emoji: "🇸🇮",
        description: "flag: Slovenia",
        category: "Flags",
        aliases: [
            "slovenia"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇸🇯",
        description: "flag: Svalbard & Jan Mayen",
        category: "Flags",
        aliases: [
            "svalbard_jan_mayen"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🇸🇰",
        description: "flag: Slovakia",
        category: "Flags",
        aliases: [
            "slovakia"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇸🇱",
        description: "flag: Sierra Leone",
        category: "Flags",
        aliases: [
            "sierra_leone"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇸🇲",
        description: "flag: San Marino",
        category: "Flags",
        aliases: [
            "san_marino"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇸🇳",
        description: "flag: Senegal",
        category: "Flags",
        aliases: [
            "senegal"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇸🇴",
        description: "flag: Somalia",
        category: "Flags",
        aliases: [
            "somalia"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇸🇷",
        description: "flag: Suriname",
        category: "Flags",
        aliases: [
            "suriname"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇸🇸",
        description: "flag: South Sudan",
        category: "Flags",
        aliases: [
            "south_sudan"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇸🇹",
        description: "flag: São Tomé & Príncipe",
        category: "Flags",
        aliases: [
            "sao_tome_principe"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇸🇻",
        description: "flag: El Salvador",
        category: "Flags",
        aliases: [
            "el_salvador"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇸🇽",
        description: "flag: Sint Maarten",
        category: "Flags",
        aliases: [
            "sint_maarten"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇸🇾",
        description: "flag: Syria",
        category: "Flags",
        aliases: [
            "syria"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇸🇿",
        description: "flag: Eswatini",
        category: "Flags",
        aliases: [
            "swaziland"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇹🇦",
        description: "flag: Tristan da Cunha",
        category: "Flags",
        aliases: [
            "tristan_da_cunha"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🇹🇨",
        description: "flag: Turks & Caicos Islands",
        category: "Flags",
        aliases: [
            "turks_caicos_islands"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇹🇩",
        description: "flag: Chad",
        category: "Flags",
        aliases: [
            "chad"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "9.0"
    },
    {
        emoji: "🇹🇫",
        description: "flag: French Southern Territories",
        category: "Flags",
        aliases: [
            "french_southern_territories"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇹🇬",
        description: "flag: Togo",
        category: "Flags",
        aliases: [
            "togo"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇹🇭",
        description: "flag: Thailand",
        category: "Flags",
        aliases: [
            "thailand"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇹🇯",
        description: "flag: Tajikistan",
        category: "Flags",
        aliases: [
            "tajikistan"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇹🇰",
        description: "flag: Tokelau",
        category: "Flags",
        aliases: [
            "tokelau"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "9.0"
    },
    {
        emoji: "🇹🇱",
        description: "flag: Timor-Leste",
        category: "Flags",
        aliases: [
            "timor_leste"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇹🇲",
        description: "flag: Turkmenistan",
        category: "Flags",
        aliases: [
            "turkmenistan"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇹🇳",
        description: "flag: Tunisia",
        category: "Flags",
        aliases: [
            "tunisia"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇹🇴",
        description: "flag: Tonga",
        category: "Flags",
        aliases: [
            "tonga"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇹🇷",
        description: "flag: Turkey",
        category: "Flags",
        aliases: [
            "tr"
        ],
        tags: [
            "turkey"
        ],
        unicodeVersion: "8.0",
        iosVersion: "9.1"
    },
    {
        emoji: "🇹🇹",
        description: "flag: Trinidad & Tobago",
        category: "Flags",
        aliases: [
            "trinidad_tobago"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇹🇻",
        description: "flag: Tuvalu",
        category: "Flags",
        aliases: [
            "tuvalu"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇹🇼",
        description: "flag: Taiwan",
        category: "Flags",
        aliases: [
            "taiwan"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "9.0"
    },
    {
        emoji: "🇹🇿",
        description: "flag: Tanzania",
        category: "Flags",
        aliases: [
            "tanzania"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇺🇦",
        description: "flag: Ukraine",
        category: "Flags",
        aliases: [
            "ukraine"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇺🇬",
        description: "flag: Uganda",
        category: "Flags",
        aliases: [
            "uganda"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇺🇲",
        description: "flag: U.S. Outlying Islands",
        category: "Flags",
        aliases: [
            "us_outlying_islands"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🇺🇳",
        description: "flag: United Nations",
        category: "Flags",
        aliases: [
            "united_nations"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🇺🇸",
        description: "flag: United States",
        category: "Flags",
        aliases: [
            "us"
        ],
        tags: [
            "flag",
            "united",
            "america"
        ],
        unicodeVersion: "6.0",
        iosVersion: "6.0"
    },
    {
        emoji: "🇺🇾",
        description: "flag: Uruguay",
        category: "Flags",
        aliases: [
            "uruguay"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇺🇿",
        description: "flag: Uzbekistan",
        category: "Flags",
        aliases: [
            "uzbekistan"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇻🇦",
        description: "flag: Vatican City",
        category: "Flags",
        aliases: [
            "vatican_city"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "9.0"
    },
    {
        emoji: "🇻🇨",
        description: "flag: St. Vincent & Grenadines",
        category: "Flags",
        aliases: [
            "st_vincent_grenadines"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇻🇪",
        description: "flag: Venezuela",
        category: "Flags",
        aliases: [
            "venezuela"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇻🇬",
        description: "flag: British Virgin Islands",
        category: "Flags",
        aliases: [
            "british_virgin_islands"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇻🇮",
        description: "flag: U.S. Virgin Islands",
        category: "Flags",
        aliases: [
            "us_virgin_islands"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇻🇳",
        description: "flag: Vietnam",
        category: "Flags",
        aliases: [
            "vietnam"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇻🇺",
        description: "flag: Vanuatu",
        category: "Flags",
        aliases: [
            "vanuatu"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇼🇫",
        description: "flag: Wallis & Futuna",
        category: "Flags",
        aliases: [
            "wallis_futuna"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "9.0"
    },
    {
        emoji: "🇼🇸",
        description: "flag: Samoa",
        category: "Flags",
        aliases: [
            "samoa"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇽🇰",
        description: "flag: Kosovo",
        category: "Flags",
        aliases: [
            "kosovo"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇾🇪",
        description: "flag: Yemen",
        category: "Flags",
        aliases: [
            "yemen"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇾🇹",
        description: "flag: Mayotte",
        category: "Flags",
        aliases: [
            "mayotte"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "9.0"
    },
    {
        emoji: "🇿🇦",
        description: "flag: South Africa",
        category: "Flags",
        aliases: [
            "south_africa"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇿🇲",
        description: "flag: Zambia",
        category: "Flags",
        aliases: [
            "zambia"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🇿🇼",
        description: "flag: Zimbabwe",
        category: "Flags",
        aliases: [
            "zimbabwe"
        ],
        tags: [],
        unicodeVersion: "6.0",
        iosVersion: "8.3"
    },
    {
        emoji: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
        description: "flag: England",
        category: "Flags",
        aliases: [
            "england"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
        description: "flag: Scotland",
        category: "Flags",
        aliases: [
            "scotland"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    },
    {
        emoji: "🏴󠁧󠁢󠁷󠁬󠁳󠁿",
        description: "flag: Wales",
        category: "Flags",
        aliases: [
            "wales"
        ],
        tags: [],
        unicodeVersion: "11.0",
        iosVersion: "12.1"
    }, 
];
const rsAstralRange = "\\ud800-\\udfff", rsComboMarksRange = "\\u0300-\\u036f", reComboHalfMarksRange = "\\ufe20-\\ufe2f", rsComboSymbolsRange = "\\u20d0-\\u20ff", rsComboRange = rsComboMarksRange + reComboHalfMarksRange + rsComboSymbolsRange, rsDingbatRange = "\\u2700-\\u27bf", rsLowerRange = "a-z\\xdf-\\xf6\\xf8-\\xff", rsMathOpRange = "\\xac\\xb1\\xd7\\xf7", rsNonCharRange = "\\x00-\\x2f\\x3a-\\x40\\x5b-\\x60\\x7b-\\xbf", rsPunctuationRange = "\\u2000-\\u206f", rsSpaceRange = " \\t\\x0b\\f\\xa0\\ufeff\\n\\r\\u2028\\u2029\\u1680\\u180e\\u2000\\u2001\\u2002\\u2003\\u2004\\u2005\\u2006\\u2007\\u2008\\u2009\\u200a\\u202f\\u205f\\u3000", rsUpperRange = "A-Z\\xc0-\\xd6\\xd8-\\xde", rsVarRange = "\\ufe0e\\ufe0f", rsBreakRange = rsMathOpRange + rsNonCharRange + rsPunctuationRange + rsSpaceRange;
const rsApos = "['\u2019]", rsAstral = "[" + rsAstralRange + "]", rsBreak = "[" + rsBreakRange + "]", rsCombo = "[" + rsComboRange + "]", rsDigits = "\\d+", rsDingbat = "[" + rsDingbatRange + "]", rsLower = "[" + rsLowerRange + "]", rsMisc = "[^" + rsAstralRange + rsBreakRange + rsDigits + rsDingbatRange + rsLowerRange + rsUpperRange + "]", rsFitz = "\\ud83c[\\udffb-\\udfff]", rsModifier = "(?:" + rsCombo + "|" + rsFitz + ")", rsNonAstral = "[^" + rsAstralRange + "]", rsRegional = "(?:\\ud83c[\\udde6-\\uddff]){2}", rsSurrPair = "[\\ud800-\\udbff][\\udc00-\\udfff]", rsUpper = "[" + rsUpperRange + "]", rsZWJ = "\\u200d";
const rsMiscLower = "(?:" + rsLower + "|" + rsMisc + ")", rsMiscUpper = "(?:" + rsUpper + "|" + rsMisc + ")", rsOptContrLower = "(?:" + rsApos + "(?:d|ll|m|re|s|t|ve))?", rsOptContrUpper = "(?:" + rsApos + "(?:D|LL|M|RE|S|T|VE))?", reOptMod = rsModifier + "?", rsOptconst = "[" + rsVarRange + "]?", rsOptJoin = "(?:" + rsZWJ + "(?:" + [
    rsNonAstral,
    rsRegional,
    rsSurrPair
].join("|") + ")" + rsOptconst + reOptMod + ")*", rsOrdLower = "\\d*(?:1st|2nd|3rd|(?![123])\\dth)(?=\\b|[A-Z_])", rsOrdUpper = "\\d*(?:1ST|2ND|3RD|(?![123])\\dTH)(?=\\b|[a-z_])", rsSeq = rsOptconst + reOptMod + rsOptJoin, rsEmoji = "(?:" + [
    rsDingbat,
    rsRegional,
    rsSurrPair
].join("|") + ")" + rsSeq, rsSymbol = "(?:" + [
    rsNonAstral + rsCombo + "?",
    rsCombo,
    rsRegional,
    rsSurrPair,
    rsAstral, 
].join("|") + ")";
new RegExp(rsApos, "g");
new RegExp(rsCombo, "g");
new RegExp(rsFitz + "(?=" + rsFitz + ")|" + rsSymbol + rsSeq, "g");
new RegExp(rsEmoji, "g");
new RegExp([
    rsUpper + "?" + rsLower + "+" + rsOptContrLower + "(?=" + [
        rsBreak,
        rsUpper,
        "$"
    ].join("|") + ")",
    rsMiscUpper + "+" + rsOptContrUpper + "(?=" + [
        rsBreak,
        rsUpper + rsMiscLower,
        "$"
    ].join("|") + ")",
    rsUpper + "?" + rsMiscLower + "+" + rsOptContrLower,
    rsUpper + "+" + rsOptContrUpper,
    rsOrdUpper,
    rsOrdLower,
    rsDigits,
    rsEmoji, 
].join("|"), "g");
new RegExp("[" + rsZWJ + rsAstralRange + rsComboRange + rsVarRange + "]");
const reEmojiName = /:([a-zA-Z0-9_\-\+]+):/g;
const NON_SPACING_MARK = String.fromCharCode(65039);
const reNonSpacing = new RegExp(NON_SPACING_MARK, "g");
function stripNSB(code) {
    return code.replace(reNonSpacing, "");
}
function stripColons(str) {
    var colonIndex = str.indexOf(":");
    if (colonIndex > -1) {
        if (colonIndex === str.length - 1) {
            str = str.substring(0, colonIndex);
            return stripColons(str);
        } else {
            str = str.substr(colonIndex + 1);
            return stripColons(str);
        }
    }
    return str;
}
function wrapColons(str) {
    return str.length > 0 ? ":" + str + ":" : str;
}
const byAlias = Object.fromEntries(emojis.map((emoji1)=>emoji1.aliases.map((alias1)=>[
            alias1,
            emoji1
        ]
    )
).flat());
Object.fromEntries(emojis.map((emoji2)=>{
    return [
        stripNSB(emoji2.emoji),
        emoji2
    ];
}));
function get(alias) {
    return byAlias[stripColons(alias)]?.emoji;
}
function emojify(str) {
    if (!str) return "";
    return str.split(reEmojiName).map((s2, i18)=>{
        if (i18 % 2 === 0) return s2;
        let emoji5 = get(s2);
        if (!emoji5) emoji5 = wrapColons(s2);
        return emoji5;
    }).join("");
}
function getDefaults() {
    return {
        baseUrl: null,
        breaks: false,
        extensions: null,
        gfm: true,
        headerIds: true,
        headerPrefix: "",
        highlight: null,
        langPrefix: "language-",
        mangle: true,
        pedantic: false,
        renderer: null,
        sanitize: false,
        sanitizer: null,
        silent: false,
        smartLists: false,
        smartypants: false,
        tokenizer: null,
        walkTokens: null,
        xhtml: false
    };
}
let e = getDefaults();
function changeDefaults(t1) {
    e = t1;
}
const t1 = /[&<>"']/;
const n1 = /[&<>"']/g;
const r1 = /[<>"']|&(?!#?\w+;)/;
const s1 = /[<>"']|&(?!#?\w+;)/g;
const i1 = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
};
const getEscapeReplacement = (e)=>i1[e]
;
function escape(e1, i19) {
    if (i19) {
        if (t1.test(e1)) return e1.replace(n1, getEscapeReplacement);
    } else if (r1.test(e1)) return e1.replace(s1, getEscapeReplacement);
    return e1;
}
const l1 = /&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/gi;
function unescape(e2) {
    return e2.replace(l1, (e, t2)=>{
        t2 = t2.toLowerCase();
        return "colon" === t2 ? ":" : "#" === t2.charAt(0) ? "x" === t2.charAt(1) ? String.fromCharCode(parseInt(t2.substring(2), 16)) : String.fromCharCode(+t2.substring(1)) : "";
    });
}
const a1 = /(^|[^\[])\^/g;
function edit(e3, t3) {
    e3 = e3.source || e3;
    t3 = t3 || "";
    const n11 = {
        replace: (t4, r11)=>{
            r11 = r11.source || r11;
            r11 = r11.replace(a1, "$1");
            e3 = e3.replace(t4, r11);
            return n11;
        },
        getRegex: ()=>new RegExp(e3, t3)
    };
    return n11;
}
const o1 = /[^\w:]/g;
const c1 = /^$|^[a-z][a-z0-9+.-]*:|^[?#]/i;
function cleanUrl(e4, t5, n2) {
    if (e4) {
        let e5;
        try {
            e5 = decodeURIComponent(unescape(n2)).replace(o1, "").toLowerCase();
        } catch (e) {
            return null;
        }
        if (0 === e5.indexOf("javascript:") || 0 === e5.indexOf("vbscript:") || 0 === e5.indexOf("data:")) return null;
    }
    t5 && !c1.test(n2) && (n2 = resolveUrl(t5, n2));
    try {
        n2 = encodeURI(n2).replace(/%25/g, "%");
    } catch (e) {
        return null;
    }
    return n2;
}
const h1 = {
};
const p1 = /^[^:]+:\/*[^/]*$/;
const u1 = /^([^:]+:)[\s\S]*$/;
const g1 = /^([^:]+:\/*[^/]*)[\s\S]*$/;
function resolveUrl(e6, t6) {
    h1[" " + e6] || (p1.test(e6) ? h1[" " + e6] = e6 + "/" : h1[" " + e6] = rtrim(e6, "/", true));
    e6 = h1[" " + e6];
    const n3 = -1 === e6.indexOf(":");
    return "//" === t6.substring(0, 2) ? n3 ? t6 : e6.replace(u1, "$1") + t6 : "/" === t6.charAt(0) ? n3 ? t6 : e6.replace(g1, "$1") + t6 : e6 + t6;
}
const d1 = {
    exec: function noopTest() {
    }
};
function merge(e7) {
    let t7, n4, r2 = 1;
    for(; r2 < arguments.length; r2++){
        t7 = arguments[r2];
        for(n4 in t7)Object.prototype.hasOwnProperty.call(t7, n4) && (e7[n4] = t7[n4]);
    }
    return e7;
}
function splitCells(e8, t8) {
    const n5 = e8.replace(/\|/g, (e, t9, n6)=>{
        let r4 = false, s2 = t9;
        while(--s2 >= 0 && "\\" === n6[s2])r4 = !r4;
        return r4 ? "|" : " |";
    }), r3 = n5.split(/ \|/);
    let s11 = 0;
    r3[0].trim() || r3.shift();
    r3[r3.length - 1].trim() || r3.pop();
    if (r3.length > t8) r3.splice(t8);
    else while(r3.length < t8)r3.push("");
    for(; s11 < r3.length; s11++)r3[s11] = r3[s11].trim().replace(/\\\|/g, "|");
    return r3;
}
function rtrim(e9, t10, n7) {
    const r5 = e9.length;
    if (0 === r5) return "";
    let s3 = 0;
    while(s3 < r5){
        const i2 = e9.charAt(r5 - s3 - 1);
        if (i2 !== t10 || n7) {
            if (i2 === t10 || !n7) break;
            s3++;
        } else s3++;
    }
    return e9.substr(0, r5 - s3);
}
function findClosingBracket(e10, t11) {
    if (-1 === e10.indexOf(t11[1])) return -1;
    const n8 = e10.length;
    let r6 = 0, s4 = 0;
    for(; s4 < n8; s4++)if ("\\" === e10[s4]) s4++;
    else if (e10[s4] === t11[0]) r6++;
    else if (e10[s4] === t11[1]) {
        r6--;
        if (r6 < 0) return s4;
    }
    return -1;
}
function checkSanitizeDeprecation(e11) {
    e11 && e11.sanitize && !e11.silent && console.warn("marked(): sanitize and sanitizer parameters are deprecated since version 0.7.0, should not be used and will be removed in the future. Read more here: https://marked.js.org/#/USING_ADVANCED.md#options");
}
function repeatString(e12, t12) {
    if (t12 < 1) return "";
    let n9 = "";
    while(t12 > 1){
        1 & t12 && (n9 += e12);
        t12 >>= 1;
        e12 += e12;
    }
    return n9 + e12;
}
function outputLink(e13, t13, n10, r7) {
    const s5 = t13.href;
    const i3 = t13.title ? escape(t13.title) : null;
    const l11 = e13[1].replace(/\\([\[\]])/g, "$1");
    if ("!" !== e13[0].charAt(0)) {
        r7.state.inLink = true;
        const e14 = {
            type: "link",
            raw: n10,
            href: s5,
            title: i3,
            text: l11,
            tokens: r7.inlineTokens(l11, [])
        };
        r7.state.inLink = false;
        return e14;
    }
    return {
        type: "image",
        raw: n10,
        href: s5,
        title: i3,
        text: escape(l11)
    };
}
function indentCodeCompensation(e15, t14) {
    const n11 = e15.match(/^(\s+)(?:```)/);
    if (null === n11) return t14;
    const r8 = n11[1];
    return t14.split("\n").map((e16)=>{
        const t15 = e16.match(/^\s+/);
        if (null === t15) return e16;
        const [n12] = t15;
        return n12.length >= r8.length ? e16.slice(r8.length) : e16;
    }).join("\n");
}
class Tokenizer {
    constructor(t16){
        this.options = t16 || e;
    }
    space(e17) {
        const t17 = this.rules.block.newline.exec(e17);
        if (t17 && t17[0].length > 0) return {
            type: "space",
            raw: t17[0]
        };
    }
    code(e18) {
        const t18 = this.rules.block.code.exec(e18);
        if (t18) {
            const e19 = t18[0].replace(/^ {1,4}/gm, "");
            return {
                type: "code",
                raw: t18[0],
                codeBlockStyle: "indented",
                text: this.options.pedantic ? e19 : rtrim(e19, "\n")
            };
        }
    }
    fences(e20) {
        const t19 = this.rules.block.fences.exec(e20);
        if (t19) {
            const e21 = t19[0];
            const n13 = indentCodeCompensation(e21, t19[3] || "");
            return {
                type: "code",
                raw: e21,
                lang: t19[2] ? t19[2].trim() : t19[2],
                text: n13
            };
        }
    }
    heading(e22) {
        const t20 = this.rules.block.heading.exec(e22);
        if (t20) {
            let e23 = t20[2].trim();
            if (/#$/.test(e23)) {
                const t21 = rtrim(e23, "#");
                this.options.pedantic ? e23 = t21.trim() : t21 && !/ $/.test(t21) || (e23 = t21.trim());
            }
            const n14 = {
                type: "heading",
                raw: t20[0],
                depth: t20[1].length,
                text: e23,
                tokens: []
            };
            this.lexer.inline(n14.text, n14.tokens);
            return n14;
        }
    }
    hr(e24) {
        const t22 = this.rules.block.hr.exec(e24);
        if (t22) return {
            type: "hr",
            raw: t22[0]
        };
    }
    blockquote(e25) {
        const t23 = this.rules.block.blockquote.exec(e25);
        if (t23) {
            const e26 = t23[0].replace(/^ *> ?/gm, "");
            return {
                type: "blockquote",
                raw: t23[0],
                tokens: this.lexer.blockTokens(e26, []),
                text: e26
            };
        }
    }
    list(e27) {
        let t24 = this.rules.block.list.exec(e27);
        if (t24) {
            let n15, r9, s6, i4, l2, a11, o11, c11, h11, p11, u11, g11;
            let d11 = t24[1].trim();
            const k1 = d11.length > 1;
            const f1 = {
                type: "list",
                raw: "",
                ordered: k1,
                start: k1 ? +d11.slice(0, -1) : "",
                loose: false,
                items: []
            };
            d11 = k1 ? `\\d{1,9}\\${d11.slice(-1)}` : `\\${d11}`;
            this.options.pedantic && (d11 = k1 ? d11 : "[*+-]");
            const m1 = new RegExp(`^( {0,3}${d11})((?: [^\\n]*)?(?:\\n|$))`);
            while(e27){
                g11 = false;
                if (!(t24 = m1.exec(e27))) break;
                if (this.rules.block.hr.test(e27)) break;
                n15 = t24[0];
                e27 = e27.substring(n15.length);
                c11 = t24[2].split("\n", 1)[0];
                h11 = e27.split("\n", 1)[0];
                if (this.options.pedantic) {
                    i4 = 2;
                    u11 = c11.trimLeft();
                } else {
                    i4 = t24[2].search(/[^ ]/);
                    i4 = i4 > 4 ? 1 : i4;
                    u11 = c11.slice(i4);
                    i4 += t24[1].length;
                }
                a11 = false;
                if (!c11 && /^ *$/.test(h11)) {
                    n15 += h11 + "\n";
                    e27 = e27.substring(h11.length + 1);
                    g11 = true;
                }
                if (!g11) {
                    const t25 = new RegExp(`^ {0,${Math.min(3, i4 - 1)}}(?:[*+-]|\\d{1,9}[.)])`);
                    while(e27){
                        p11 = e27.split("\n", 1)[0];
                        c11 = p11;
                        this.options.pedantic && (c11 = c11.replace(/^ {1,4}(?=( {4})*[^ ])/g, "  "));
                        if (t25.test(c11)) break;
                        if (c11.search(/[^ ]/) >= i4 || !c11.trim()) u11 += "\n" + c11.slice(i4);
                        else {
                            if (a11) break;
                            u11 += "\n" + c11;
                        }
                        a11 || c11.trim() || (a11 = true);
                        n15 += p11 + "\n";
                        e27 = e27.substring(p11.length + 1);
                    }
                }
                f1.loose || (o11 ? f1.loose = true : /\n *\n *$/.test(n15) && (o11 = true));
                if (this.options.gfm) {
                    r9 = /^\[[ xX]\] /.exec(u11);
                    if (r9) {
                        s6 = "[ ] " !== r9[0];
                        u11 = u11.replace(/^\[[ xX]\] +/, "");
                    }
                }
                f1.items.push({
                    type: "list_item",
                    raw: n15,
                    task: !!r9,
                    checked: s6,
                    loose: false,
                    text: u11
                });
                f1.raw += n15;
            }
            f1.items[f1.items.length - 1].raw = n15.trimRight();
            f1.items[f1.items.length - 1].text = u11.trimRight();
            f1.raw = f1.raw.trimRight();
            const x1 = f1.items.length;
            for(l2 = 0; l2 < x1; l2++){
                this.lexer.state.top = false;
                f1.items[l2].tokens = this.lexer.blockTokens(f1.items[l2].text, []);
                const e28 = f1.items[l2].tokens.filter((e29)=>"space" === e29.type
                );
                const t26 = e28.every((e31)=>{
                    const t27 = e31.raw.split("");
                    let n16 = 0;
                    for (const e30 of t27){
                        "\n" === e30 && (n16 += 1);
                        if (n16 > 1) return true;
                    }
                    return false;
                });
                if (!f1.loose && e28.length && t26) {
                    f1.loose = true;
                    f1.items[l2].loose = true;
                }
            }
            return f1;
        }
    }
    html(e32) {
        const t28 = this.rules.block.html.exec(e32);
        if (t28) {
            const e33 = {
                type: "html",
                raw: t28[0],
                pre: !this.options.sanitizer && ("pre" === t28[1] || "script" === t28[1] || "style" === t28[1]),
                text: t28[0]
            };
            if (this.options.sanitize) {
                e33.type = "paragraph";
                e33.text = this.options.sanitizer ? this.options.sanitizer(t28[0]) : escape(t28[0]);
                e33.tokens = [];
                this.lexer.inline(e33.text, e33.tokens);
            }
            return e33;
        }
    }
    def(e34) {
        const t29 = this.rules.block.def.exec(e34);
        if (t29) {
            t29[3] && (t29[3] = t29[3].substring(1, t29[3].length - 1));
            const e35 = t29[1].toLowerCase().replace(/\s+/g, " ");
            return {
                type: "def",
                tag: e35,
                raw: t29[0],
                href: t29[2],
                title: t29[3]
            };
        }
    }
    table(e36) {
        const t30 = this.rules.block.table.exec(e36);
        if (t30) {
            const e37 = {
                type: "table",
                header: splitCells(t30[1]).map((e38)=>({
                        text: e38
                    })
                ),
                align: t30[2].replace(/^ *|\| *$/g, "").split(/ *\| */),
                rows: t30[3] ? t30[3].replace(/\n[ \t]*$/, "").split("\n") : []
            };
            if (e37.header.length === e37.align.length) {
                e37.raw = t30[0];
                let n17 = e37.align.length;
                let r10, s7, i5, l3;
                for(r10 = 0; r10 < n17; r10++)/^ *-+: *$/.test(e37.align[r10]) ? e37.align[r10] = "right" : /^ *:-+: *$/.test(e37.align[r10]) ? e37.align[r10] = "center" : /^ *:-+ *$/.test(e37.align[r10]) ? e37.align[r10] = "left" : e37.align[r10] = null;
                n17 = e37.rows.length;
                for(r10 = 0; r10 < n17; r10++)e37.rows[r10] = splitCells(e37.rows[r10], e37.header.length).map((e39)=>({
                        text: e39
                    })
                );
                n17 = e37.header.length;
                for(s7 = 0; s7 < n17; s7++){
                    e37.header[s7].tokens = [];
                    this.lexer.inlineTokens(e37.header[s7].text, e37.header[s7].tokens);
                }
                n17 = e37.rows.length;
                for(s7 = 0; s7 < n17; s7++){
                    l3 = e37.rows[s7];
                    for(i5 = 0; i5 < l3.length; i5++){
                        l3[i5].tokens = [];
                        this.lexer.inlineTokens(l3[i5].text, l3[i5].tokens);
                    }
                }
                return e37;
            }
        }
    }
    lheading(e40) {
        const t31 = this.rules.block.lheading.exec(e40);
        if (t31) {
            const e41 = {
                type: "heading",
                raw: t31[0],
                depth: "=" === t31[2].charAt(0) ? 1 : 2,
                text: t31[1],
                tokens: []
            };
            this.lexer.inline(e41.text, e41.tokens);
            return e41;
        }
    }
    paragraph(e42) {
        const t32 = this.rules.block.paragraph.exec(e42);
        if (t32) {
            const e43 = {
                type: "paragraph",
                raw: t32[0],
                text: "\n" === t32[1].charAt(t32[1].length - 1) ? t32[1].slice(0, -1) : t32[1],
                tokens: []
            };
            this.lexer.inline(e43.text, e43.tokens);
            return e43;
        }
    }
    text(e44) {
        const t33 = this.rules.block.text.exec(e44);
        if (t33) {
            const e45 = {
                type: "text",
                raw: t33[0],
                text: t33[0],
                tokens: []
            };
            this.lexer.inline(e45.text, e45.tokens);
            return e45;
        }
    }
    escape(e46) {
        const t34 = this.rules.inline.escape.exec(e46);
        if (t34) return {
            type: "escape",
            raw: t34[0],
            text: escape(t34[1])
        };
    }
    tag(e47) {
        const t35 = this.rules.inline.tag.exec(e47);
        if (t35) {
            !this.lexer.state.inLink && /^<a /i.test(t35[0]) ? this.lexer.state.inLink = true : this.lexer.state.inLink && /^<\/a>/i.test(t35[0]) && (this.lexer.state.inLink = false);
            !this.lexer.state.inRawBlock && /^<(pre|code|kbd|script)(\s|>)/i.test(t35[0]) ? this.lexer.state.inRawBlock = true : this.lexer.state.inRawBlock && /^<\/(pre|code|kbd|script)(\s|>)/i.test(t35[0]) && (this.lexer.state.inRawBlock = false);
            return {
                type: this.options.sanitize ? "text" : "html",
                raw: t35[0],
                inLink: this.lexer.state.inLink,
                inRawBlock: this.lexer.state.inRawBlock,
                text: this.options.sanitize ? this.options.sanitizer ? this.options.sanitizer(t35[0]) : escape(t35[0]) : t35[0]
            };
        }
    }
    link(e48) {
        const t36 = this.rules.inline.link.exec(e48);
        if (t36) {
            const e49 = t36[2].trim();
            if (!this.options.pedantic && /^</.test(e49)) {
                if (!/>$/.test(e49)) return;
                const t37 = rtrim(e49.slice(0, -1), "\\");
                if ((e49.length - t37.length) % 2 === 0) return;
            } else {
                const e50 = findClosingBracket(t36[2], "()");
                if (e50 > -1) {
                    const n18 = 0 === t36[0].indexOf("!") ? 5 : 4;
                    const r11 = n18 + t36[1].length + e50;
                    t36[2] = t36[2].substring(0, e50);
                    t36[0] = t36[0].substring(0, r11).trim();
                    t36[3] = "";
                }
            }
            let n19 = t36[2];
            let r12 = "";
            if (this.options.pedantic) {
                const e51 = /^([^'"]*[^\s])\s+(['"])(.*)\2/.exec(n19);
                if (e51) {
                    n19 = e51[1];
                    r12 = e51[3];
                }
            } else r12 = t36[3] ? t36[3].slice(1, -1) : "";
            n19 = n19.trim();
            /^</.test(n19) && (n19 = this.options.pedantic && !/>$/.test(e49) ? n19.slice(1) : n19.slice(1, -1));
            return outputLink(t36, {
                href: n19 ? n19.replace(this.rules.inline._escapes, "$1") : n19,
                title: r12 ? r12.replace(this.rules.inline._escapes, "$1") : r12
            }, t36[0], this.lexer);
        }
    }
    reflink(e52, t38) {
        let n20;
        if ((n20 = this.rules.inline.reflink.exec(e52)) || (n20 = this.rules.inline.nolink.exec(e52))) {
            let e53 = (n20[2] || n20[1]).replace(/\s+/g, " ");
            e53 = t38[e53.toLowerCase()];
            if (!e53 || !e53.href) {
                const e54 = n20[0].charAt(0);
                return {
                    type: "text",
                    raw: e54,
                    text: e54
                };
            }
            return outputLink(n20, e53, n20[0], this.lexer);
        }
    }
    emStrong(e55, t39, n21 = "") {
        let r13 = this.rules.inline.emStrong.lDelim.exec(e55);
        if (!r13) return;
        if (r13[3] && n21.match(/[\p{L}\p{N}]/u)) return;
        const s8 = r13[1] || r13[2] || "";
        if (!s8 || s8 && ("" === n21 || this.rules.inline.punctuation.exec(n21))) {
            const n22 = r13[0].length - 1;
            let s9, i6, l4 = n22, a2 = 0;
            const o2 = "*" === r13[0][0] ? this.rules.inline.emStrong.rDelimAst : this.rules.inline.emStrong.rDelimUnd;
            o2.lastIndex = 0;
            t39 = t39.slice(-1 * e55.length + n22);
            while(null != (r13 = o2.exec(t39))){
                s9 = r13[1] || r13[2] || r13[3] || r13[4] || r13[5] || r13[6];
                if (!s9) continue;
                i6 = s9.length;
                if (r13[3] || r13[4]) {
                    l4 += i6;
                    continue;
                }
                if ((r13[5] || r13[6]) && n22 % 3 && !((n22 + i6) % 3)) {
                    a2 += i6;
                    continue;
                }
                l4 -= i6;
                if (l4 > 0) continue;
                i6 = Math.min(i6, i6 + l4 + a2);
                if (Math.min(n22, i6) % 2) {
                    const t40 = e55.slice(1, n22 + r13.index + i6);
                    return {
                        type: "em",
                        raw: e55.slice(0, n22 + r13.index + i6 + 1),
                        text: t40,
                        tokens: this.lexer.inlineTokens(t40, [])
                    };
                }
                const t41 = e55.slice(2, n22 + r13.index + i6 - 1);
                return {
                    type: "strong",
                    raw: e55.slice(0, n22 + r13.index + i6 + 1),
                    text: t41,
                    tokens: this.lexer.inlineTokens(t41, [])
                };
            }
        }
    }
    codespan(e56) {
        const t42 = this.rules.inline.code.exec(e56);
        if (t42) {
            let e57 = t42[2].replace(/\n/g, " ");
            const n23 = /[^ ]/.test(e57);
            const r14 = /^ /.test(e57) && / $/.test(e57);
            n23 && r14 && (e57 = e57.substring(1, e57.length - 1));
            e57 = escape(e57, true);
            return {
                type: "codespan",
                raw: t42[0],
                text: e57
            };
        }
    }
    br(e58) {
        const t43 = this.rules.inline.br.exec(e58);
        if (t43) return {
            type: "br",
            raw: t43[0]
        };
    }
    del(e59) {
        const t44 = this.rules.inline.del.exec(e59);
        if (t44) return {
            type: "del",
            raw: t44[0],
            text: t44[2],
            tokens: this.lexer.inlineTokens(t44[2], [])
        };
    }
    autolink(e60, t45) {
        const n24 = this.rules.inline.autolink.exec(e60);
        if (n24) {
            let e61, r15;
            if ("@" === n24[2]) {
                e61 = escape(this.options.mangle ? t45(n24[1]) : n24[1]);
                r15 = "mailto:" + e61;
            } else {
                e61 = escape(n24[1]);
                r15 = e61;
            }
            return {
                type: "link",
                raw: n24[0],
                text: e61,
                href: r15,
                tokens: [
                    {
                        type: "text",
                        raw: e61,
                        text: e61
                    }
                ]
            };
        }
    }
    url(e62, t46) {
        let n25;
        if (n25 = this.rules.inline.url.exec(e62)) {
            let e63, r16;
            if ("@" === n25[2]) {
                e63 = escape(this.options.mangle ? t46(n25[0]) : n25[0]);
                r16 = "mailto:" + e63;
            } else {
                let t47;
                do {
                    t47 = n25[0];
                    n25[0] = this.rules.inline._backpedal.exec(n25[0])[0];
                }while (t47 !== n25[0])
                e63 = escape(n25[0]);
                r16 = "www." === n25[1] ? "http://" + e63 : e63;
            }
            return {
                type: "link",
                raw: n25[0],
                text: e63,
                href: r16,
                tokens: [
                    {
                        type: "text",
                        raw: e63,
                        text: e63
                    }
                ]
            };
        }
    }
    inlineText(e64, t48) {
        const n26 = this.rules.inline.text.exec(e64);
        if (n26) {
            let e65;
            e65 = this.lexer.state.inRawBlock ? this.options.sanitize ? this.options.sanitizer ? this.options.sanitizer(n26[0]) : escape(n26[0]) : n26[0] : escape(this.options.smartypants ? t48(n26[0]) : n26[0]);
            return {
                type: "text",
                raw: n26[0],
                text: e65
            };
        }
    }
}
const k1 = {
    newline: /^(?: *(?:\n|$))+/,
    code: /^( {4}[^\n]+(?:\n(?: *(?:\n|$))*)?)+/,
    fences: /^ {0,3}(`{3,}(?=[^`\n]*\n)|~{3,})([^\n]*)\n(?:|([\s\S]*?)\n)(?: {0,3}\1[~`]* *(?=\n|$)|$)/,
    hr: /^ {0,3}((?:- *){3,}|(?:_ *){3,}|(?:\* *){3,})(?:\n+|$)/,
    heading: /^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/,
    blockquote: /^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/,
    list: /^( {0,3}bull)( [^\n]+?)?(?:\n|$)/,
    html: "^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>\\n*|$)|<![A-Z][\\s\\S]*?(?:>\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n *)+\\n|$)|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n *)+\\n|$)|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n *)+\\n|$))",
    def: /^ {0,3}\[(label)\]: *(?:\n *)?<?([^\s>]+)>?(?:(?: +(?:\n *)?| *\n *)(title))? *(?:\n+|$)/,
    table: d1,
    lheading: /^([^\n]+)\n {0,3}(=+|-+) *(?:\n+|$)/,
    _paragraph: /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table| +\n)[^\n]+)*)/,
    text: /^[^\n]+/
};
k1._label = /(?!\s*\])(?:\\.|[^\[\]\\])+/;
k1._title = /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/;
k1.def = edit(k1.def).replace("label", k1._label).replace("title", k1._title).getRegex();
k1.bullet = /(?:[*+-]|\d{1,9}[.)])/;
k1.listItemStart = edit(/^( *)(bull) */).replace("bull", k1.bullet).getRegex();
k1.list = edit(k1.list).replace(/bull/g, k1.bullet).replace("hr", "\\n+(?=\\1?(?:(?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$))").replace("def", "\\n+(?=" + k1.def.source + ")").getRegex();
k1._tag = "address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|section|source|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul";
k1._comment = /<!--(?!-?>)[\s\S]*?(?:-->|$)/;
k1.html = edit(k1.html, "i").replace("comment", k1._comment).replace("tag", k1._tag).replace("attribute", / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex();
k1.paragraph = edit(k1._paragraph).replace("hr", k1.hr).replace("heading", " {0,3}#{1,6} ").replace("|lheading", "").replace("|table", "").replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", k1._tag).getRegex();
k1.blockquote = edit(k1.blockquote).replace("paragraph", k1.paragraph).getRegex();
k1.normal = merge({
}, k1);
k1.gfm = merge({
}, k1.normal, {
    table: "^ *([^\\n ].*\\|.*)\\n {0,3}(?:\\| *)?(:?-+:? *(?:\\| *:?-+:? *)*)(?:\\| *)?(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)"
});
k1.gfm.table = edit(k1.gfm.table).replace("hr", k1.hr).replace("heading", " {0,3}#{1,6} ").replace("blockquote", " {0,3}>").replace("code", " {4}[^\\n]").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", k1._tag).getRegex();
k1.gfm.paragraph = edit(k1._paragraph).replace("hr", k1.hr).replace("heading", " {0,3}#{1,6} ").replace("|lheading", "").replace("table", k1.gfm.table).replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", k1._tag).getRegex();
k1.pedantic = merge({
}, k1.normal, {
    html: edit("^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:\"[^\"]*\"|'[^']*'|\\s[^'\"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))").replace("comment", k1._comment).replace(/tag/g, "(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b").getRegex(),
    def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/,
    heading: /^(#{1,6})(.*)(?:\n+|$)/,
    fences: d1,
    paragraph: edit(k1.normal._paragraph).replace("hr", k1.hr).replace("heading", " *#{1,6} *[^\n]").replace("lheading", k1.lheading).replace("blockquote", " {0,3}>").replace("|fences", "").replace("|list", "").replace("|html", "").getRegex()
});
const f1 = {
    escape: /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/,
    autolink: /^<(scheme:[^\s\x00-\x1f<>]*|email)>/,
    url: d1,
    tag: "^comment|^</[a-zA-Z][\\w:-]*\\s*>|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>",
    link: /^!?\[(label)\]\(\s*(href)(?:\s+(title))?\s*\)/,
    reflink: /^!?\[(label)\]\[(ref)\]/,
    nolink: /^!?\[(ref)\](?:\[\])?/,
    reflinkSearch: "reflink|nolink(?!\\()",
    emStrong: {
        lDelim: /^(?:\*+(?:([punct_])|[^\s*]))|^_+(?:([punct*])|([^\s_]))/,
        rDelimAst: /^[^_*]*?\_\_[^_*]*?\*[^_*]*?(?=\_\_)|[punct_](\*+)(?=[\s]|$)|[^punct*_\s](\*+)(?=[punct_\s]|$)|[punct_\s](\*+)(?=[^punct*_\s])|[\s](\*+)(?=[punct_])|[punct_](\*+)(?=[punct_])|[^punct*_\s](\*+)(?=[^punct*_\s])/,
        rDelimUnd: /^[^_*]*?\*\*[^_*]*?\_[^_*]*?(?=\*\*)|[punct*](\_+)(?=[\s]|$)|[^punct*_\s](\_+)(?=[punct*\s]|$)|[punct*\s](\_+)(?=[^punct*_\s])|[\s](\_+)(?=[punct*])|[punct*](\_+)(?=[punct*])/
    },
    code: /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/,
    br: /^( {2,}|\\)\n(?!\s*$)/,
    del: d1,
    text: /^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/,
    punctuation: /^([\spunctuation])/
};
f1._punctuation = "!\"#$%&'()+\\-.,/:;<=>?@\\[\\]`^{|}~";
f1.punctuation = edit(f1.punctuation).replace(/punctuation/g, f1._punctuation).getRegex();
f1.blockSkip = /\[[^\]]*?\]\([^\)]*?\)|`[^`]*?`|<[^>]*?>/g;
f1.escapedEmSt = /\\\*|\\_/g;
f1._comment = edit(k1._comment).replace("(?:--\x3e|$)", "--\x3e").getRegex();
f1.emStrong.lDelim = edit(f1.emStrong.lDelim).replace(/punct/g, f1._punctuation).getRegex();
f1.emStrong.rDelimAst = edit(f1.emStrong.rDelimAst, "g").replace(/punct/g, f1._punctuation).getRegex();
f1.emStrong.rDelimUnd = edit(f1.emStrong.rDelimUnd, "g").replace(/punct/g, f1._punctuation).getRegex();
f1._escapes = /\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/g;
f1._scheme = /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/;
f1._email = /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/;
f1.autolink = edit(f1.autolink).replace("scheme", f1._scheme).replace("email", f1._email).getRegex();
f1._attribute = /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/;
f1.tag = edit(f1.tag).replace("comment", f1._comment).replace("attribute", f1._attribute).getRegex();
f1._label = /(?:\[(?:\\.|[^\[\]\\])*\]|\\.|`[^`]*`|[^\[\]\\`])*?/;
f1._href = /<(?:\\.|[^\n<>\\])+>|[^\s\x00-\x1f]*/;
f1._title = /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/;
f1.link = edit(f1.link).replace("label", f1._label).replace("href", f1._href).replace("title", f1._title).getRegex();
f1.reflink = edit(f1.reflink).replace("label", f1._label).replace("ref", k1._label).getRegex();
f1.nolink = edit(f1.nolink).replace("ref", k1._label).getRegex();
f1.reflinkSearch = edit(f1.reflinkSearch, "g").replace("reflink", f1.reflink).replace("nolink", f1.nolink).getRegex();
f1.normal = merge({
}, f1);
f1.pedantic = merge({
}, f1.normal, {
    strong: {
        start: /^__|\*\*/,
        middle: /^__(?=\S)([\s\S]*?\S)__(?!_)|^\*\*(?=\S)([\s\S]*?\S)\*\*(?!\*)/,
        endAst: /\*\*(?!\*)/g,
        endUnd: /__(?!_)/g
    },
    em: {
        start: /^_|\*/,
        middle: /^()\*(?=\S)([\s\S]*?\S)\*(?!\*)|^_(?=\S)([\s\S]*?\S)_(?!_)/,
        endAst: /\*(?!\*)/g,
        endUnd: /_(?!_)/g
    },
    link: edit(/^!?\[(label)\]\((.*?)\)/).replace("label", f1._label).getRegex(),
    reflink: edit(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace("label", f1._label).getRegex()
});
f1.gfm = merge({
}, f1.normal, {
    escape: edit(f1.escape).replace("])", "~|])").getRegex(),
    _extended_email: /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/,
    url: /^((?:ftp|https?):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/,
    _backpedal: /(?:[^?!.,:;*_~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_~)]+(?!$))+/,
    del: /^(~~?)(?=[^\s~])([\s\S]*?[^\s~])\1(?=[^~]|$)/,
    text: /^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|https?:\/\/|ftp:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/
});
f1.gfm.url = edit(f1.gfm.url, "i").replace("email", f1.gfm._extended_email).getRegex();
f1.breaks = merge({
}, f1.gfm, {
    br: edit(f1.br).replace("{2,}", "*").getRegex(),
    text: edit(f1.gfm.text).replace("\\b_", "\\b_| {2,}\\n").replace(/\{2,\}/g, "*").getRegex()
});
function smartypants(e66) {
    return e66.replace(/---/g, "—").replace(/--/g, "–").replace(/(^|[-\u2014/(\[{"\s])'/g, "$1‘").replace(/'/g, "’").replace(/(^|[-\u2014/(\[{\u2018\s])"/g, "$1“").replace(/"/g, "”").replace(/\.{3}/g, "…");
}
function mangle(e67) {
    let t49, n27, r17 = "";
    const s10 = e67.length;
    for(t49 = 0; t49 < s10; t49++){
        n27 = e67.charCodeAt(t49);
        Math.random() > 0.5 && (n27 = "x" + n27.toString(16));
        r17 += "&#" + n27 + ";";
    }
    return r17;
}
class Lexer {
    constructor(t50){
        this.tokens = [];
        this.tokens.links = Object.create(null);
        this.options = t50 || e;
        this.options.tokenizer = this.options.tokenizer || new Tokenizer;
        this.tokenizer = this.options.tokenizer;
        this.tokenizer.options = this.options;
        this.tokenizer.lexer = this;
        this.inlineQueue = [];
        this.state = {
            inLink: false,
            inRawBlock: false,
            top: true
        };
        const n28 = {
            block: k1.normal,
            inline: f1.normal
        };
        if (this.options.pedantic) {
            n28.block = k1.pedantic;
            n28.inline = f1.pedantic;
        } else if (this.options.gfm) {
            n28.block = k1.gfm;
            this.options.breaks ? n28.inline = f1.breaks : n28.inline = f1.gfm;
        }
        this.tokenizer.rules = n28;
    }
    static get rules() {
        return {
            block: k1,
            inline: f1
        };
    }
    static lex(e68, t51) {
        const n29 = new Lexer(t51);
        return n29.lex(e68);
    }
    static lexInline(e69, t52) {
        const n30 = new Lexer(t52);
        return n30.inlineTokens(e69);
    }
    lex(e70) {
        e70 = e70.replace(/\r\n|\r/g, "\n").replace(/\t/g, "    ");
        this.blockTokens(e70, this.tokens);
        let t53;
        while(t53 = this.inlineQueue.shift())this.inlineTokens(t53.src, t53.tokens);
        return this.tokens;
    }
    blockTokens(e71, t54 = []) {
        this.options.pedantic && (e71 = e71.replace(/^ +$/gm, ""));
        let n31, r18, s11, i7;
        while(e71)if (!(this.options.extensions && this.options.extensions.block && this.options.extensions.block.some((r19)=>{
            if (n31 = r19.call({
                lexer: this
            }, e71, t54)) {
                e71 = e71.substring(n31.raw.length);
                t54.push(n31);
                return true;
            }
            return false;
        }))) if (n31 = this.tokenizer.space(e71)) {
            e71 = e71.substring(n31.raw.length);
            1 === n31.raw.length && t54.length > 0 ? t54[t54.length - 1].raw += "\n" : t54.push(n31);
        } else if (n31 = this.tokenizer.code(e71)) {
            e71 = e71.substring(n31.raw.length);
            r18 = t54[t54.length - 1];
            if (!r18 || "paragraph" !== r18.type && "text" !== r18.type) t54.push(n31);
            else {
                r18.raw += "\n" + n31.raw;
                r18.text += "\n" + n31.text;
                this.inlineQueue[this.inlineQueue.length - 1].src = r18.text;
            }
        } else if (n31 = this.tokenizer.fences(e71)) {
            e71 = e71.substring(n31.raw.length);
            t54.push(n31);
        } else if (n31 = this.tokenizer.heading(e71)) {
            e71 = e71.substring(n31.raw.length);
            t54.push(n31);
        } else if (n31 = this.tokenizer.hr(e71)) {
            e71 = e71.substring(n31.raw.length);
            t54.push(n31);
        } else if (n31 = this.tokenizer.blockquote(e71)) {
            e71 = e71.substring(n31.raw.length);
            t54.push(n31);
        } else if (n31 = this.tokenizer.list(e71)) {
            e71 = e71.substring(n31.raw.length);
            t54.push(n31);
        } else if (n31 = this.tokenizer.html(e71)) {
            e71 = e71.substring(n31.raw.length);
            t54.push(n31);
        } else if (n31 = this.tokenizer.def(e71)) {
            e71 = e71.substring(n31.raw.length);
            r18 = t54[t54.length - 1];
            if (!r18 || "paragraph" !== r18.type && "text" !== r18.type) this.tokens.links[n31.tag] || (this.tokens.links[n31.tag] = {
                href: n31.href,
                title: n31.title
            });
            else {
                r18.raw += "\n" + n31.raw;
                r18.text += "\n" + n31.raw;
                this.inlineQueue[this.inlineQueue.length - 1].src = r18.text;
            }
        } else if (n31 = this.tokenizer.table(e71)) {
            e71 = e71.substring(n31.raw.length);
            t54.push(n31);
        } else if (n31 = this.tokenizer.lheading(e71)) {
            e71 = e71.substring(n31.raw.length);
            t54.push(n31);
        } else {
            s11 = e71;
            if (this.options.extensions && this.options.extensions.startBlock) {
                let t55 = Infinity;
                const n32 = e71.slice(1);
                let r20;
                this.options.extensions.startBlock.forEach(function(e72) {
                    r20 = e72.call({
                        lexer: this
                    }, n32);
                    "number" === typeof r20 && r20 >= 0 && (t55 = Math.min(t55, r20));
                });
                t55 < Infinity && t55 >= 0 && (s11 = e71.substring(0, t55 + 1));
            }
            if (this.state.top && (n31 = this.tokenizer.paragraph(s11))) {
                r18 = t54[t54.length - 1];
                if (i7 && "paragraph" === r18.type) {
                    r18.raw += "\n" + n31.raw;
                    r18.text += "\n" + n31.text;
                    this.inlineQueue.pop();
                    this.inlineQueue[this.inlineQueue.length - 1].src = r18.text;
                } else t54.push(n31);
                i7 = s11.length !== e71.length;
                e71 = e71.substring(n31.raw.length);
            } else if (n31 = this.tokenizer.text(e71)) {
                e71 = e71.substring(n31.raw.length);
                r18 = t54[t54.length - 1];
                if (r18 && "text" === r18.type) {
                    r18.raw += "\n" + n31.raw;
                    r18.text += "\n" + n31.text;
                    this.inlineQueue.pop();
                    this.inlineQueue[this.inlineQueue.length - 1].src = r18.text;
                } else t54.push(n31);
            } else if (e71) {
                const t56 = "Infinite loop on byte: " + e71.charCodeAt(0);
                if (this.options.silent) {
                    console.error(t56);
                    break;
                }
                throw new Error(t56);
            }
        }
        this.state.top = true;
        return t54;
    }
    inline(e73, t57) {
        this.inlineQueue.push({
            src: e73,
            tokens: t57
        });
    }
    inlineTokens(e74, t58 = []) {
        let n33, r21, s12;
        let i8 = e74;
        let l5;
        let a3, o3;
        if (this.tokens.links) {
            const e75 = Object.keys(this.tokens.links);
            if (e75.length > 0) while(null != (l5 = this.tokenizer.rules.inline.reflinkSearch.exec(i8)))e75.includes(l5[0].slice(l5[0].lastIndexOf("[") + 1, -1)) && (i8 = i8.slice(0, l5.index) + "[" + repeatString("a", l5[0].length - 2) + "]" + i8.slice(this.tokenizer.rules.inline.reflinkSearch.lastIndex));
        }
        while(null != (l5 = this.tokenizer.rules.inline.blockSkip.exec(i8)))i8 = i8.slice(0, l5.index) + "[" + repeatString("a", l5[0].length - 2) + "]" + i8.slice(this.tokenizer.rules.inline.blockSkip.lastIndex);
        while(null != (l5 = this.tokenizer.rules.inline.escapedEmSt.exec(i8)))i8 = i8.slice(0, l5.index) + "++" + i8.slice(this.tokenizer.rules.inline.escapedEmSt.lastIndex);
        while(e74){
            a3 || (o3 = "");
            a3 = false;
            if (!(this.options.extensions && this.options.extensions.inline && this.options.extensions.inline.some((r22)=>{
                if (n33 = r22.call({
                    lexer: this
                }, e74, t58)) {
                    e74 = e74.substring(n33.raw.length);
                    t58.push(n33);
                    return true;
                }
                return false;
            }))) if (n33 = this.tokenizer.escape(e74)) {
                e74 = e74.substring(n33.raw.length);
                t58.push(n33);
            } else if (n33 = this.tokenizer.tag(e74)) {
                e74 = e74.substring(n33.raw.length);
                r21 = t58[t58.length - 1];
                if (r21 && "text" === n33.type && "text" === r21.type) {
                    r21.raw += n33.raw;
                    r21.text += n33.text;
                } else t58.push(n33);
            } else if (n33 = this.tokenizer.link(e74)) {
                e74 = e74.substring(n33.raw.length);
                t58.push(n33);
            } else if (n33 = this.tokenizer.reflink(e74, this.tokens.links)) {
                e74 = e74.substring(n33.raw.length);
                r21 = t58[t58.length - 1];
                if (r21 && "text" === n33.type && "text" === r21.type) {
                    r21.raw += n33.raw;
                    r21.text += n33.text;
                } else t58.push(n33);
            } else if (n33 = this.tokenizer.emStrong(e74, i8, o3)) {
                e74 = e74.substring(n33.raw.length);
                t58.push(n33);
            } else if (n33 = this.tokenizer.codespan(e74)) {
                e74 = e74.substring(n33.raw.length);
                t58.push(n33);
            } else if (n33 = this.tokenizer.br(e74)) {
                e74 = e74.substring(n33.raw.length);
                t58.push(n33);
            } else if (n33 = this.tokenizer.del(e74)) {
                e74 = e74.substring(n33.raw.length);
                t58.push(n33);
            } else if (n33 = this.tokenizer.autolink(e74, mangle)) {
                e74 = e74.substring(n33.raw.length);
                t58.push(n33);
            } else if (this.state.inLink || !(n33 = this.tokenizer.url(e74, mangle))) {
                s12 = e74;
                if (this.options.extensions && this.options.extensions.startInline) {
                    let t59 = Infinity;
                    const n34 = e74.slice(1);
                    let r23;
                    this.options.extensions.startInline.forEach(function(e76) {
                        r23 = e76.call({
                            lexer: this
                        }, n34);
                        "number" === typeof r23 && r23 >= 0 && (t59 = Math.min(t59, r23));
                    });
                    t59 < Infinity && t59 >= 0 && (s12 = e74.substring(0, t59 + 1));
                }
                if (n33 = this.tokenizer.inlineText(s12, smartypants)) {
                    e74 = e74.substring(n33.raw.length);
                    "_" !== n33.raw.slice(-1) && (o3 = n33.raw.slice(-1));
                    a3 = true;
                    r21 = t58[t58.length - 1];
                    if (r21 && "text" === r21.type) {
                        r21.raw += n33.raw;
                        r21.text += n33.text;
                    } else t58.push(n33);
                } else if (e74) {
                    const t60 = "Infinite loop on byte: " + e74.charCodeAt(0);
                    if (this.options.silent) {
                        console.error(t60);
                        break;
                    }
                    throw new Error(t60);
                }
            } else {
                e74 = e74.substring(n33.raw.length);
                t58.push(n33);
            }
        }
        return t58;
    }
}
class Renderer {
    constructor(t61){
        this.options = t61 || e;
    }
    code(e77, t62, n35) {
        const r24 = (t62 || "").match(/\S*/)[0];
        if (this.options.highlight) {
            const t63 = this.options.highlight(e77, r24);
            if (null != t63 && t63 !== e77) {
                n35 = true;
                e77 = t63;
            }
        }
        e77 = e77.replace(/\n$/, "") + "\n";
        return r24 ? '<pre><code class="' + this.options.langPrefix + escape(r24, true) + '">' + (n35 ? e77 : escape(e77, true)) + "</code></pre>\n" : "<pre><code>" + (n35 ? e77 : escape(e77, true)) + "</code></pre>\n";
    }
    blockquote(e78) {
        return "<blockquote>\n" + e78 + "</blockquote>\n";
    }
    html(e79) {
        return e79;
    }
    heading(e80, t64, n36, r25) {
        return this.options.headerIds ? "<h" + t64 + ' id="' + this.options.headerPrefix + r25.slug(n36) + '">' + e80 + "</h" + t64 + ">\n" : "<h" + t64 + ">" + e80 + "</h" + t64 + ">\n";
    }
    hr() {
        return this.options.xhtml ? "<hr/>\n" : "<hr>\n";
    }
    list(e81, t65, n37) {
        const r26 = t65 ? "ol" : "ul", s13 = t65 && 1 !== n37 ? ' start="' + n37 + '"' : "";
        return "<" + r26 + s13 + ">\n" + e81 + "</" + r26 + ">\n";
    }
    listitem(e82) {
        return "<li>" + e82 + "</li>\n";
    }
    checkbox(e83) {
        return "<input " + (e83 ? 'checked="" ' : "") + 'disabled="" type="checkbox"' + (this.options.xhtml ? " /" : "") + "> ";
    }
    paragraph(e84) {
        return "<p>" + e84 + "</p>\n";
    }
    table(e85, t66) {
        t66 && (t66 = "<tbody>" + t66 + "</tbody>");
        return "<table>\n<thead>\n" + e85 + "</thead>\n" + t66 + "</table>\n";
    }
    tablerow(e86) {
        return "<tr>\n" + e86 + "</tr>\n";
    }
    tablecell(e87, t67) {
        const n38 = t67.header ? "th" : "td";
        const r27 = t67.align ? "<" + n38 + ' align="' + t67.align + '">' : "<" + n38 + ">";
        return r27 + e87 + "</" + n38 + ">\n";
    }
    strong(e88) {
        return "<strong>" + e88 + "</strong>";
    }
    em(e89) {
        return "<em>" + e89 + "</em>";
    }
    codespan(e90) {
        return "<code>" + e90 + "</code>";
    }
    br() {
        return this.options.xhtml ? "<br/>" : "<br>";
    }
    del(e91) {
        return "<del>" + e91 + "</del>";
    }
    link(e92, t68, n39) {
        e92 = cleanUrl(this.options.sanitize, this.options.baseUrl, e92);
        if (null === e92) return n39;
        let r28 = '<a href="' + escape(e92) + '"';
        t68 && (r28 += ' title="' + t68 + '"');
        r28 += ">" + n39 + "</a>";
        return r28;
    }
    image(e93, t69, n40) {
        e93 = cleanUrl(this.options.sanitize, this.options.baseUrl, e93);
        if (null === e93) return n40;
        let r29 = '<img src="' + e93 + '" alt="' + n40 + '"';
        t69 && (r29 += ' title="' + t69 + '"');
        r29 += this.options.xhtml ? "/>" : ">";
        return r29;
    }
    text(e94) {
        return e94;
    }
}
class TextRenderer {
    strong(e95) {
        return e95;
    }
    em(e96) {
        return e96;
    }
    codespan(e97) {
        return e97;
    }
    del(e98) {
        return e98;
    }
    html(e99) {
        return e99;
    }
    text(e100) {
        return e100;
    }
    link(e, t, n41) {
        return "" + n41;
    }
    image(e, t, n42) {
        return "" + n42;
    }
    br() {
        return "";
    }
}
class Slugger {
    constructor(){
        this.seen = {
        };
    }
    serialize(e101) {
        return e101.toLowerCase().trim().replace(/<[!\/a-z].*?>/gi, "").replace(/[\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,./:;<=>?@[\]^`{|}~]/g, "").replace(/\s/g, "-");
    }
    getNextSafeSlug(e102, t70) {
        let n43 = e102;
        let r30 = 0;
        if (this.seen.hasOwnProperty(n43)) {
            r30 = this.seen[e102];
            do {
                r30++;
                n43 = e102 + "-" + r30;
            }while (this.seen.hasOwnProperty(n43))
        }
        if (!t70) {
            this.seen[e102] = r30;
            this.seen[n43] = 0;
        }
        return n43;
    }
    slug(e103, t71 = {
    }) {
        const n44 = this.serialize(e103);
        return this.getNextSafeSlug(n44, t71.dryrun);
    }
}
class Parser {
    constructor(t72){
        this.options = t72 || e;
        this.options.renderer = this.options.renderer || new Renderer;
        this.renderer = this.options.renderer;
        this.renderer.options = this.options;
        this.textRenderer = new TextRenderer;
        this.slugger = new Slugger;
    }
    static parse(e104, t73) {
        const n45 = new Parser(t73);
        return n45.parse(e104);
    }
    static parseInline(e105, t74) {
        const n46 = new Parser(t74);
        return n46.parseInline(e105);
    }
    parse(e106, t75 = true) {
        let n47, r31, s14, i9, l6, a4, o4, c2, h2, p2, u2, g2, d2, k2, f2, m2, x2, b1, w1, _1 = "";
        const y1 = e106.length;
        for(n47 = 0; n47 < y1; n47++){
            p2 = e106[n47];
            if (this.options.extensions && this.options.extensions.renderers && this.options.extensions.renderers[p2.type]) {
                w1 = this.options.extensions.renderers[p2.type].call({
                    parser: this
                }, p2);
                if (false !== w1 || ![
                    "space",
                    "hr",
                    "heading",
                    "code",
                    "table",
                    "blockquote",
                    "list",
                    "html",
                    "paragraph",
                    "text"
                ].includes(p2.type)) {
                    _1 += w1 || "";
                    continue;
                }
            }
            switch(p2.type){
                case "space":
                    continue;
                case "hr":
                    _1 += this.renderer.hr();
                    continue;
                case "heading":
                    _1 += this.renderer.heading(this.parseInline(p2.tokens), p2.depth, unescape(this.parseInline(p2.tokens, this.textRenderer)), this.slugger);
                    continue;
                case "code":
                    _1 += this.renderer.code(p2.text, p2.lang, p2.escaped);
                    continue;
                case "table":
                    c2 = "";
                    o4 = "";
                    i9 = p2.header.length;
                    for(r31 = 0; r31 < i9; r31++)o4 += this.renderer.tablecell(this.parseInline(p2.header[r31].tokens), {
                        header: true,
                        align: p2.align[r31]
                    });
                    c2 += this.renderer.tablerow(o4);
                    h2 = "";
                    i9 = p2.rows.length;
                    for(r31 = 0; r31 < i9; r31++){
                        a4 = p2.rows[r31];
                        o4 = "";
                        l6 = a4.length;
                        for(s14 = 0; s14 < l6; s14++)o4 += this.renderer.tablecell(this.parseInline(a4[s14].tokens), {
                            header: false,
                            align: p2.align[s14]
                        });
                        h2 += this.renderer.tablerow(o4);
                    }
                    _1 += this.renderer.table(c2, h2);
                    continue;
                case "blockquote":
                    h2 = this.parse(p2.tokens);
                    _1 += this.renderer.blockquote(h2);
                    continue;
                case "list":
                    u2 = p2.ordered;
                    g2 = p2.start;
                    d2 = p2.loose;
                    i9 = p2.items.length;
                    h2 = "";
                    for(r31 = 0; r31 < i9; r31++){
                        f2 = p2.items[r31];
                        m2 = f2.checked;
                        x2 = f2.task;
                        k2 = "";
                        if (f2.task) {
                            b1 = this.renderer.checkbox(m2);
                            if (d2) if (f2.tokens.length > 0 && "paragraph" === f2.tokens[0].type) {
                                f2.tokens[0].text = b1 + " " + f2.tokens[0].text;
                                f2.tokens[0].tokens && f2.tokens[0].tokens.length > 0 && "text" === f2.tokens[0].tokens[0].type && (f2.tokens[0].tokens[0].text = b1 + " " + f2.tokens[0].tokens[0].text);
                            } else f2.tokens.unshift({
                                type: "text",
                                text: b1
                            });
                            else k2 += b1;
                        }
                        k2 += this.parse(f2.tokens, d2);
                        h2 += this.renderer.listitem(k2, x2, m2);
                    }
                    _1 += this.renderer.list(h2, u2, g2);
                    continue;
                case "html":
                    _1 += this.renderer.html(p2.text);
                    continue;
                case "paragraph":
                    _1 += this.renderer.paragraph(this.parseInline(p2.tokens));
                    continue;
                case "text":
                    h2 = p2.tokens ? this.parseInline(p2.tokens) : p2.text;
                    while(n47 + 1 < y1 && "text" === e106[n47 + 1].type){
                        p2 = e106[++n47];
                        h2 += "\n" + (p2.tokens ? this.parseInline(p2.tokens) : p2.text);
                    }
                    _1 += t75 ? this.renderer.paragraph(h2) : h2;
                    continue;
                default:
                    {
                        const e107 = 'Token with "' + p2.type + '" type was not found.';
                        if (this.options.silent) {
                            console.error(e107);
                            return;
                        }
                        throw new Error(e107);
                    }
            }
        }
        return _1;
    }
    parseInline(e108, t76) {
        t76 = t76 || this.renderer;
        let n48, r32, s15, i10 = "";
        const l7 = e108.length;
        for(n48 = 0; n48 < l7; n48++){
            r32 = e108[n48];
            if (this.options.extensions && this.options.extensions.renderers && this.options.extensions.renderers[r32.type]) {
                s15 = this.options.extensions.renderers[r32.type].call({
                    parser: this
                }, r32);
                if (false !== s15 || ![
                    "escape",
                    "html",
                    "link",
                    "image",
                    "strong",
                    "em",
                    "codespan",
                    "br",
                    "del",
                    "text"
                ].includes(r32.type)) {
                    i10 += s15 || "";
                    continue;
                }
            }
            switch(r32.type){
                case "escape":
                    i10 += t76.text(r32.text);
                    break;
                case "html":
                    i10 += t76.html(r32.text);
                    break;
                case "link":
                    i10 += t76.link(r32.href, r32.title, this.parseInline(r32.tokens, t76));
                    break;
                case "image":
                    i10 += t76.image(r32.href, r32.title, r32.text);
                    break;
                case "strong":
                    i10 += t76.strong(this.parseInline(r32.tokens, t76));
                    break;
                case "em":
                    i10 += t76.em(this.parseInline(r32.tokens, t76));
                    break;
                case "codespan":
                    i10 += t76.codespan(r32.text);
                    break;
                case "br":
                    i10 += t76.br();
                    break;
                case "del":
                    i10 += t76.del(this.parseInline(r32.tokens, t76));
                    break;
                case "text":
                    i10 += t76.text(r32.text);
                    break;
                default:
                    {
                        const e109 = 'Token with "' + r32.type + '" type was not found.';
                        if (this.options.silent) {
                            console.error(e109);
                            return;
                        }
                        throw new Error(e109);
                    }
            }
        }
        return i10;
    }
}
function marked(e110, t77, n49) {
    if ("undefined" === typeof e110 || null === e110) throw new Error("marked(): input parameter is undefined or null");
    if ("string" !== typeof e110) throw new Error("marked(): input parameter is of type " + Object.prototype.toString.call(e110) + ", string expected");
    if ("function" === typeof t77) {
        n49 = t77;
        t77 = null;
    }
    t77 = merge({
    }, marked.defaults, t77 || {
    });
    checkSanitizeDeprecation(t77);
    if (n49) {
        const r33 = t77.highlight;
        let s16;
        try {
            s16 = Lexer.lex(e110, t77);
        } catch (e111) {
            return n49(e111);
        }
        const done = function(e112) {
            let i12;
            if (!e112) try {
                t77.walkTokens && marked.walkTokens(s16, t77.walkTokens);
                i12 = Parser.parse(s16, t77);
            } catch (t78) {
                e112 = t78;
            }
            t77.highlight = r33;
            return e112 ? n49(e112) : n49(null, i12);
        };
        if (!r33 || r33.length < 3) return done();
        delete t77.highlight;
        if (!s16.length) return done();
        let i11 = 0;
        marked.walkTokens(s16, function(e113) {
            if ("code" === e113.type) {
                i11++;
                setTimeout(()=>{
                    r33(e113.text, e113.lang, function(t79, n50) {
                        if (t79) return done(t79);
                        if (null != n50 && n50 !== e113.text) {
                            e113.text = n50;
                            e113.escaped = true;
                        }
                        i11--;
                        0 === i11 && done();
                    });
                }, 0);
            }
        });
        0 === i11 && done();
    } else try {
        const n51 = Lexer.lex(e110, t77);
        t77.walkTokens && marked.walkTokens(n51, t77.walkTokens);
        return Parser.parse(n51, t77);
    } catch (e114) {
        e114.message += "\nPlease report this to https://github.com/markedjs/marked.";
        if (t77.silent) return "<p>An error occurred:</p><pre>" + escape(e114.message + "", true) + "</pre>";
        throw e114;
    }
}
marked.options = marked.setOptions = function(e115) {
    merge(marked.defaults, e115);
    changeDefaults(marked.defaults);
    return marked;
};
marked.getDefaults = getDefaults;
marked.defaults = e;
marked.use = function(...e116) {
    const t80 = merge({
    }, ...e116);
    const n52 = marked.defaults.extensions || {
        renderers: {
        },
        childTokens: {
        }
    };
    let r34;
    e116.forEach((e117)=>{
        if (e117.extensions) {
            r34 = true;
            e117.extensions.forEach((e118)=>{
                if (!e118.name) throw new Error("extension name required");
                if (e118.renderer) {
                    const t81 = n52.renderers ? n52.renderers[e118.name] : null;
                    n52.renderers[e118.name] = t81 ? function(...n53) {
                        let r35 = e118.renderer.apply(this, n53);
                        false === r35 && (r35 = t81.apply(this, n53));
                        return r35;
                    } : e118.renderer;
                }
                if (e118.tokenizer) {
                    if (!e118.level || "block" !== e118.level && "inline" !== e118.level) throw new Error("extension level must be 'block' or 'inline'");
                    n52[e118.level] ? n52[e118.level].unshift(e118.tokenizer) : n52[e118.level] = [
                        e118.tokenizer
                    ];
                    e118.start && ("block" === e118.level ? n52.startBlock ? n52.startBlock.push(e118.start) : n52.startBlock = [
                        e118.start
                    ] : "inline" === e118.level && (n52.startInline ? n52.startInline.push(e118.start) : n52.startInline = [
                        e118.start
                    ]));
                }
                e118.childTokens && (n52.childTokens[e118.name] = e118.childTokens);
            });
        }
        if (e117.renderer) {
            const n54 = marked.defaults.renderer || new Renderer;
            for(const t in e117.renderer){
                const r36 = n54[t];
                n54[t] = (...s17)=>{
                    let i13 = e117.renderer[t].apply(n54, s17);
                    false === i13 && (i13 = r36.apply(n54, s17));
                    return i13;
                };
            }
            t80.renderer = n54;
        }
        if (e117.tokenizer) {
            const n55 = marked.defaults.tokenizer || new Tokenizer;
            for(const t in e117.tokenizer){
                const r37 = n55[t];
                n55[t] = (...s18)=>{
                    let i14 = e117.tokenizer[t].apply(n55, s18);
                    false === i14 && (i14 = r37.apply(n55, s18));
                    return i14;
                };
            }
            t80.tokenizer = n55;
        }
        if (e117.walkTokens) {
            const n56 = marked.defaults.walkTokens;
            t80.walkTokens = function(t82) {
                e117.walkTokens.call(this, t82);
                n56 && n56.call(this, t82);
            };
        }
        r34 && (t80.extensions = n52);
        marked.setOptions(t80);
    });
};
marked.walkTokens = function(e119, t83) {
    for (const n58 of e119){
        t83.call(marked, n58);
        switch(n58.type){
            case "table":
                for (const e121 of n58.header)marked.walkTokens(e121.tokens, t83);
                for (const e120 of n58.rows)for (const n57 of e120)marked.walkTokens(n57.tokens, t83);
                break;
            case "list":
                marked.walkTokens(n58.items, t83);
                break;
            default:
                marked.defaults.extensions && marked.defaults.extensions.childTokens && marked.defaults.extensions.childTokens[n58.type] ? marked.defaults.extensions.childTokens[n58.type].forEach(function(e) {
                    marked.walkTokens(n58[e], t83);
                }) : n58.tokens && marked.walkTokens(n58.tokens, t83);
        }
    }
};
marked.parseInline = function(e122, t84) {
    if ("undefined" === typeof e122 || null === e122) throw new Error("marked.parseInline(): input parameter is undefined or null");
    if ("string" !== typeof e122) throw new Error("marked.parseInline(): input parameter is of type " + Object.prototype.toString.call(e122) + ", string expected");
    t84 = merge({
    }, marked.defaults, t84 || {
    });
    checkSanitizeDeprecation(t84);
    try {
        const n59 = Lexer.lexInline(e122, t84);
        t84.walkTokens && marked.walkTokens(n59, t84.walkTokens);
        return Parser.parseInline(n59, t84);
    } catch (e123) {
        e123.message += "\nPlease report this to https://github.com/markedjs/marked.";
        if (t84.silent) return "<p>An error occurred:</p><pre>" + escape(e123.message + "", true) + "</pre>";
        throw e123;
    }
};
marked.Parser = Parser;
marked.parser = Parser.parse;
marked.Renderer = Renderer;
marked.TextRenderer = TextRenderer;
marked.Lexer = Lexer;
marked.lexer = Lexer.lex;
marked.Tokenizer = Tokenizer;
marked.Slugger = Slugger;
marked.parse = marked;
marked.options;
marked.setOptions;
marked.use;
marked.walkTokens;
marked.parseInline;
Parser.parse;
Lexer.lex;
var r2 = "undefined" !== typeof globalThis ? globalThis : "undefined" !== typeof self ? self : global;
var e1 = {
};
var a2 = {
    exports: e1
};
(function(t11) {
    var o12 = e1;
    var s12 = true && a2.exports == o12 && a2;
    var u12 = "object" == typeof r2 && r2;
    u12.global !== u12 && u12.window !== u12 || (t11 = u12);
    var c12 = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g;
    var l12 = /[\x01-\x7F]/g;
    var i110 = /[\x01-\t\x0B\f\x0E-\x1F\x7F\x81\x8D\x8F\x90\x9D\xA0-\uFFFF]/g;
    var n3 = /<\u20D2|=\u20E5|>\u20D2|\u205F\u200A|\u219D\u0338|\u2202\u0338|\u2220\u20D2|\u2229\uFE00|\u222A\uFE00|\u223C\u20D2|\u223D\u0331|\u223E\u0333|\u2242\u0338|\u224B\u0338|\u224D\u20D2|\u224E\u0338|\u224F\u0338|\u2250\u0338|\u2261\u20E5|\u2264\u20D2|\u2265\u20D2|\u2266\u0338|\u2267\u0338|\u2268\uFE00|\u2269\uFE00|\u226A\u0338|\u226A\u20D2|\u226B\u0338|\u226B\u20D2|\u227F\u0338|\u2282\u20D2|\u2283\u20D2|\u228A\uFE00|\u228B\uFE00|\u228F\u0338|\u2290\u0338|\u2293\uFE00|\u2294\uFE00|\u22B4\u20D2|\u22B5\u20D2|\u22D8\u0338|\u22D9\u0338|\u22DA\uFE00|\u22DB\uFE00|\u22F5\u0338|\u22F9\u0338|\u2933\u0338|\u29CF\u0338|\u29D0\u0338|\u2A6D\u0338|\u2A70\u0338|\u2A7D\u0338|\u2A7E\u0338|\u2AA1\u0338|\u2AA2\u0338|\u2AAC\uFE00|\u2AAD\uFE00|\u2AAF\u0338|\u2AB0\u0338|\u2AC5\u0338|\u2AC6\u0338|\u2ACB\uFE00|\u2ACC\uFE00|\u2AFD\u20E5|[\xA0-\u0113\u0116-\u0122\u0124-\u012B\u012E-\u014D\u0150-\u017E\u0192\u01B5\u01F5\u0237\u02C6\u02C7\u02D8-\u02DD\u0311\u0391-\u03A1\u03A3-\u03A9\u03B1-\u03C9\u03D1\u03D2\u03D5\u03D6\u03DC\u03DD\u03F0\u03F1\u03F5\u03F6\u0401-\u040C\u040E-\u044F\u0451-\u045C\u045E\u045F\u2002-\u2005\u2007-\u2010\u2013-\u2016\u2018-\u201A\u201C-\u201E\u2020-\u2022\u2025\u2026\u2030-\u2035\u2039\u203A\u203E\u2041\u2043\u2044\u204F\u2057\u205F-\u2063\u20AC\u20DB\u20DC\u2102\u2105\u210A-\u2113\u2115-\u211E\u2122\u2124\u2127-\u2129\u212C\u212D\u212F-\u2131\u2133-\u2138\u2145-\u2148\u2153-\u215E\u2190-\u219B\u219D-\u21A7\u21A9-\u21AE\u21B0-\u21B3\u21B5-\u21B7\u21BA-\u21DB\u21DD\u21E4\u21E5\u21F5\u21FD-\u2205\u2207-\u2209\u220B\u220C\u220F-\u2214\u2216-\u2218\u221A\u221D-\u2238\u223A-\u2257\u2259\u225A\u225C\u225F-\u2262\u2264-\u228B\u228D-\u229B\u229D-\u22A5\u22A7-\u22B0\u22B2-\u22BB\u22BD-\u22DB\u22DE-\u22E3\u22E6-\u22F7\u22F9-\u22FE\u2305\u2306\u2308-\u2310\u2312\u2313\u2315\u2316\u231C-\u231F\u2322\u2323\u232D\u232E\u2336\u233D\u233F\u237C\u23B0\u23B1\u23B4-\u23B6\u23DC-\u23DF\u23E2\u23E7\u2423\u24C8\u2500\u2502\u250C\u2510\u2514\u2518\u251C\u2524\u252C\u2534\u253C\u2550-\u256C\u2580\u2584\u2588\u2591-\u2593\u25A1\u25AA\u25AB\u25AD\u25AE\u25B1\u25B3-\u25B5\u25B8\u25B9\u25BD-\u25BF\u25C2\u25C3\u25CA\u25CB\u25EC\u25EF\u25F8-\u25FC\u2605\u2606\u260E\u2640\u2642\u2660\u2663\u2665\u2666\u266A\u266D-\u266F\u2713\u2717\u2720\u2736\u2758\u2772\u2773\u27C8\u27C9\u27E6-\u27ED\u27F5-\u27FA\u27FC\u27FF\u2902-\u2905\u290C-\u2913\u2916\u2919-\u2920\u2923-\u292A\u2933\u2935-\u2939\u293C\u293D\u2945\u2948-\u294B\u294E-\u2976\u2978\u2979\u297B-\u297F\u2985\u2986\u298B-\u2996\u299A\u299C\u299D\u29A4-\u29B7\u29B9\u29BB\u29BC\u29BE-\u29C5\u29C9\u29CD-\u29D0\u29DC-\u29DE\u29E3-\u29E5\u29EB\u29F4\u29F6\u2A00-\u2A02\u2A04\u2A06\u2A0C\u2A0D\u2A10-\u2A17\u2A22-\u2A27\u2A29\u2A2A\u2A2D-\u2A31\u2A33-\u2A3C\u2A3F\u2A40\u2A42-\u2A4D\u2A50\u2A53-\u2A58\u2A5A-\u2A5D\u2A5F\u2A66\u2A6A\u2A6D-\u2A75\u2A77-\u2A9A\u2A9D-\u2AA2\u2AA4-\u2AB0\u2AB3-\u2AC8\u2ACB\u2ACC\u2ACF-\u2ADB\u2AE4\u2AE6-\u2AE9\u2AEB-\u2AF3\u2AFD\uFB00-\uFB04]|\uD835[\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDCCF\uDD04\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDD6B]/g;
    var p12 = {
        "­": "shy",
        "‌": "zwnj",
        "‍": "zwj",
        "‎": "lrm",
        "⁣": "ic",
        "⁢": "it",
        "⁡": "af",
        "‏": "rlm",
        "​": "ZeroWidthSpace",
        "⁠": "NoBreak",
        "̑": "DownBreve",
        "⃛": "tdot",
        "⃜": "DotDot",
        "\t": "Tab",
        "\n": "NewLine",
        " ": "puncsp",
        " ": "MediumSpace",
        " ": "thinsp",
        " ": "hairsp",
        " ": "emsp13",
        " ": "ensp",
        " ": "emsp14",
        " ": "emsp",
        " ": "numsp",
        " ": "nbsp",
        "  ": "ThickSpace",
        "‾": "oline",
        _: "lowbar",
        "‐": "dash",
        "–": "ndash",
        "—": "mdash",
        "―": "horbar",
        ",": "comma",
        ";": "semi",
        "⁏": "bsemi",
        ":": "colon",
        "⩴": "Colone",
        "!": "excl",
        "¡": "iexcl",
        "?": "quest",
        "¿": "iquest",
        ".": "period",
        "‥": "nldr",
        "…": "mldr",
        "·": "middot",
        "'": "apos",
        "‘": "lsquo",
        "’": "rsquo",
        "‚": "sbquo",
        "‹": "lsaquo",
        "›": "rsaquo",
        '"': "quot",
        "“": "ldquo",
        "”": "rdquo",
        "„": "bdquo",
        "«": "laquo",
        "»": "raquo",
        "(": "lpar",
        ")": "rpar",
        "[": "lsqb",
        "]": "rsqb",
        "{": "lcub",
        "}": "rcub",
        "⌈": "lceil",
        "⌉": "rceil",
        "⌊": "lfloor",
        "⌋": "rfloor",
        "⦅": "lopar",
        "⦆": "ropar",
        "⦋": "lbrke",
        "⦌": "rbrke",
        "⦍": "lbrkslu",
        "⦎": "rbrksld",
        "⦏": "lbrksld",
        "⦐": "rbrkslu",
        "⦑": "langd",
        "⦒": "rangd",
        "⦓": "lparlt",
        "⦔": "rpargt",
        "⦕": "gtlPar",
        "⦖": "ltrPar",
        "⟦": "lobrk",
        "⟧": "robrk",
        "⟨": "lang",
        "⟩": "rang",
        "⟪": "Lang",
        "⟫": "Rang",
        "⟬": "loang",
        "⟭": "roang",
        "❲": "lbbrk",
        "❳": "rbbrk",
        "‖": "Vert",
        "§": "sect",
        "¶": "para",
        "@": "commat",
        "*": "ast",
        "/": "sol",
        undefined: null,
        "&": "amp",
        "#": "num",
        "%": "percnt",
        "‰": "permil",
        "‱": "pertenk",
        "†": "dagger",
        "‡": "Dagger",
        "•": "bull",
        "⁃": "hybull",
        "′": "prime",
        "″": "Prime",
        "‴": "tprime",
        "⁗": "qprime",
        "‵": "bprime",
        "⁁": "caret",
        "`": "grave",
        "´": "acute",
        "˜": "tilde",
        "^": "Hat",
        "¯": "macr",
        "˘": "breve",
        "˙": "dot",
        "¨": "die",
        "˚": "ring",
        "˝": "dblac",
        "¸": "cedil",
        "˛": "ogon",
        "ˆ": "circ",
        "ˇ": "caron",
        "°": "deg",
        "©": "copy",
        "®": "reg",
        "℗": "copysr",
        "℘": "wp",
        "℞": "rx",
        "℧": "mho",
        "℩": "iiota",
        "←": "larr",
        "↚": "nlarr",
        "→": "rarr",
        "↛": "nrarr",
        "↑": "uarr",
        "↓": "darr",
        "↔": "harr",
        "↮": "nharr",
        "↕": "varr",
        "↖": "nwarr",
        "↗": "nearr",
        "↘": "searr",
        "↙": "swarr",
        "↝": "rarrw",
        "↝̸": "nrarrw",
        "↞": "Larr",
        "↟": "Uarr",
        "↠": "Rarr",
        "↡": "Darr",
        "↢": "larrtl",
        "↣": "rarrtl",
        "↤": "mapstoleft",
        "↥": "mapstoup",
        "↦": "map",
        "↧": "mapstodown",
        "↩": "larrhk",
        "↪": "rarrhk",
        "↫": "larrlp",
        "↬": "rarrlp",
        "↭": "harrw",
        "↰": "lsh",
        "↱": "rsh",
        "↲": "ldsh",
        "↳": "rdsh",
        "↵": "crarr",
        "↶": "cularr",
        "↷": "curarr",
        "↺": "olarr",
        "↻": "orarr",
        "↼": "lharu",
        "↽": "lhard",
        "↾": "uharr",
        "↿": "uharl",
        "⇀": "rharu",
        "⇁": "rhard",
        "⇂": "dharr",
        "⇃": "dharl",
        "⇄": "rlarr",
        "⇅": "udarr",
        "⇆": "lrarr",
        "⇇": "llarr",
        "⇈": "uuarr",
        "⇉": "rrarr",
        "⇊": "ddarr",
        "⇋": "lrhar",
        "⇌": "rlhar",
        "⇐": "lArr",
        "⇍": "nlArr",
        "⇑": "uArr",
        "⇒": "rArr",
        "⇏": "nrArr",
        "⇓": "dArr",
        "⇔": "iff",
        "⇎": "nhArr",
        "⇕": "vArr",
        "⇖": "nwArr",
        "⇗": "neArr",
        "⇘": "seArr",
        "⇙": "swArr",
        "⇚": "lAarr",
        "⇛": "rAarr",
        "⇝": "zigrarr",
        "⇤": "larrb",
        "⇥": "rarrb",
        "⇵": "duarr",
        "⇽": "loarr",
        "⇾": "roarr",
        "⇿": "hoarr",
        "∀": "forall",
        "∁": "comp",
        "∂": "part",
        "∂̸": "npart",
        "∃": "exist",
        "∄": "nexist",
        "∅": "empty",
        "∇": "Del",
        "∈": "in",
        "∉": "notin",
        "∋": "ni",
        "∌": "notni",
        "϶": "bepsi",
        "∏": "prod",
        "∐": "coprod",
        "∑": "sum",
        "+": "plus",
        "±": "pm",
        "÷": "div",
        "×": "times",
        "<": "lt",
        "≮": "nlt",
        "<⃒": "nvlt",
        "=": "equals",
        "≠": "ne",
        "=⃥": "bne",
        "⩵": "Equal",
        ">": "gt",
        "≯": "ngt",
        ">⃒": "nvgt",
        "¬": "not",
        "|": "vert",
        "¦": "brvbar",
        "−": "minus",
        "∓": "mp",
        "∔": "plusdo",
        "⁄": "frasl",
        "∖": "setmn",
        "∗": "lowast",
        "∘": "compfn",
        "√": "Sqrt",
        "∝": "prop",
        "∞": "infin",
        "∟": "angrt",
        "∠": "ang",
        "∠⃒": "nang",
        "∡": "angmsd",
        "∢": "angsph",
        "∣": "mid",
        "∤": "nmid",
        "∥": "par",
        "∦": "npar",
        "∧": "and",
        "∨": "or",
        "∩": "cap",
        "∩︀": "caps",
        "∪": "cup",
        "∪︀": "cups",
        "∫": "int",
        "∬": "Int",
        "∭": "tint",
        "⨌": "qint",
        "∮": "oint",
        "∯": "Conint",
        "∰": "Cconint",
        "∱": "cwint",
        "∲": "cwconint",
        "∳": "awconint",
        "∴": "there4",
        "∵": "becaus",
        "∶": "ratio",
        "∷": "Colon",
        "∸": "minusd",
        "∺": "mDDot",
        "∻": "homtht",
        "∼": "sim",
        "≁": "nsim",
        "∼⃒": "nvsim",
        "∽": "bsim",
        "∽̱": "race",
        "∾": "ac",
        "∾̳": "acE",
        "∿": "acd",
        "≀": "wr",
        "≂": "esim",
        "≂̸": "nesim",
        "≃": "sime",
        "≄": "nsime",
        "≅": "cong",
        "≇": "ncong",
        "≆": "simne",
        "≈": "ap",
        "≉": "nap",
        "≊": "ape",
        "≋": "apid",
        "≋̸": "napid",
        "≌": "bcong",
        "≍": "CupCap",
        "≭": "NotCupCap",
        "≍⃒": "nvap",
        "≎": "bump",
        "≎̸": "nbump",
        "≏": "bumpe",
        "≏̸": "nbumpe",
        "≐": "doteq",
        "≐̸": "nedot",
        "≑": "eDot",
        "≒": "efDot",
        "≓": "erDot",
        "≔": "colone",
        "≕": "ecolon",
        "≖": "ecir",
        "≗": "cire",
        "≙": "wedgeq",
        "≚": "veeeq",
        "≜": "trie",
        "≟": "equest",
        "≡": "equiv",
        "≢": "nequiv",
        "≡⃥": "bnequiv",
        "≤": "le",
        "≰": "nle",
        "≤⃒": "nvle",
        "≥": "ge",
        "≱": "nge",
        "≥⃒": "nvge",
        "≦": "lE",
        "≦̸": "nlE",
        "≧": "gE",
        "≧̸": "ngE",
        "≨︀": "lvnE",
        "≨": "lnE",
        "≩": "gnE",
        "≩︀": "gvnE",
        "≪": "ll",
        "≪̸": "nLtv",
        "≪⃒": "nLt",
        "≫": "gg",
        "≫̸": "nGtv",
        "≫⃒": "nGt",
        "≬": "twixt",
        "≲": "lsim",
        "≴": "nlsim",
        "≳": "gsim",
        "≵": "ngsim",
        "≶": "lg",
        "≸": "ntlg",
        "≷": "gl",
        "≹": "ntgl",
        "≺": "pr",
        "⊀": "npr",
        "≻": "sc",
        "⊁": "nsc",
        "≼": "prcue",
        "⋠": "nprcue",
        "≽": "sccue",
        "⋡": "nsccue",
        "≾": "prsim",
        "≿": "scsim",
        "≿̸": "NotSucceedsTilde",
        "⊂": "sub",
        "⊄": "nsub",
        "⊂⃒": "vnsub",
        "⊃": "sup",
        "⊅": "nsup",
        "⊃⃒": "vnsup",
        "⊆": "sube",
        "⊈": "nsube",
        "⊇": "supe",
        "⊉": "nsupe",
        "⊊︀": "vsubne",
        "⊊": "subne",
        "⊋︀": "vsupne",
        "⊋": "supne",
        "⊍": "cupdot",
        "⊎": "uplus",
        "⊏": "sqsub",
        "⊏̸": "NotSquareSubset",
        "⊐": "sqsup",
        "⊐̸": "NotSquareSuperset",
        "⊑": "sqsube",
        "⋢": "nsqsube",
        "⊒": "sqsupe",
        "⋣": "nsqsupe",
        "⊓": "sqcap",
        "⊓︀": "sqcaps",
        "⊔": "sqcup",
        "⊔︀": "sqcups",
        "⊕": "oplus",
        "⊖": "ominus",
        "⊗": "otimes",
        "⊘": "osol",
        "⊙": "odot",
        "⊚": "ocir",
        "⊛": "oast",
        "⊝": "odash",
        "⊞": "plusb",
        "⊟": "minusb",
        "⊠": "timesb",
        "⊡": "sdotb",
        "⊢": "vdash",
        "⊬": "nvdash",
        "⊣": "dashv",
        "⊤": "top",
        "⊥": "bot",
        "⊧": "models",
        "⊨": "vDash",
        "⊭": "nvDash",
        "⊩": "Vdash",
        "⊮": "nVdash",
        "⊪": "Vvdash",
        "⊫": "VDash",
        "⊯": "nVDash",
        "⊰": "prurel",
        "⊲": "vltri",
        "⋪": "nltri",
        "⊳": "vrtri",
        "⋫": "nrtri",
        "⊴": "ltrie",
        "⋬": "nltrie",
        "⊴⃒": "nvltrie",
        "⊵": "rtrie",
        "⋭": "nrtrie",
        "⊵⃒": "nvrtrie",
        "⊶": "origof",
        "⊷": "imof",
        "⊸": "mumap",
        "⊹": "hercon",
        "⊺": "intcal",
        "⊻": "veebar",
        "⊽": "barvee",
        "⊾": "angrtvb",
        "⊿": "lrtri",
        "⋀": "Wedge",
        "⋁": "Vee",
        "⋂": "xcap",
        "⋃": "xcup",
        "⋄": "diam",
        "⋅": "sdot",
        "⋆": "Star",
        "⋇": "divonx",
        "⋈": "bowtie",
        "⋉": "ltimes",
        "⋊": "rtimes",
        "⋋": "lthree",
        "⋌": "rthree",
        "⋍": "bsime",
        "⋎": "cuvee",
        "⋏": "cuwed",
        "⋐": "Sub",
        "⋑": "Sup",
        "⋒": "Cap",
        "⋓": "Cup",
        "⋔": "fork",
        "⋕": "epar",
        "⋖": "ltdot",
        "⋗": "gtdot",
        "⋘": "Ll",
        "⋘̸": "nLl",
        "⋙": "Gg",
        "⋙̸": "nGg",
        "⋚︀": "lesg",
        "⋚": "leg",
        "⋛": "gel",
        "⋛︀": "gesl",
        "⋞": "cuepr",
        "⋟": "cuesc",
        "⋦": "lnsim",
        "⋧": "gnsim",
        "⋨": "prnsim",
        "⋩": "scnsim",
        "⋮": "vellip",
        "⋯": "ctdot",
        "⋰": "utdot",
        "⋱": "dtdot",
        "⋲": "disin",
        "⋳": "isinsv",
        "⋴": "isins",
        "⋵": "isindot",
        "⋵̸": "notindot",
        "⋶": "notinvc",
        "⋷": "notinvb",
        "⋹": "isinE",
        "⋹̸": "notinE",
        "⋺": "nisd",
        "⋻": "xnis",
        "⋼": "nis",
        "⋽": "notnivc",
        "⋾": "notnivb",
        "⌅": "barwed",
        "⌆": "Barwed",
        "⌌": "drcrop",
        "⌍": "dlcrop",
        "⌎": "urcrop",
        "⌏": "ulcrop",
        "⌐": "bnot",
        "⌒": "profline",
        "⌓": "profsurf",
        "⌕": "telrec",
        "⌖": "target",
        "⌜": "ulcorn",
        "⌝": "urcorn",
        "⌞": "dlcorn",
        "⌟": "drcorn",
        "⌢": "frown",
        "⌣": "smile",
        "⌭": "cylcty",
        "⌮": "profalar",
        "⌶": "topbot",
        "⌽": "ovbar",
        "⌿": "solbar",
        "⍼": "angzarr",
        "⎰": "lmoust",
        "⎱": "rmoust",
        "⎴": "tbrk",
        "⎵": "bbrk",
        "⎶": "bbrktbrk",
        "⏜": "OverParenthesis",
        "⏝": "UnderParenthesis",
        "⏞": "OverBrace",
        "⏟": "UnderBrace",
        "⏢": "trpezium",
        "⏧": "elinters",
        "␣": "blank",
        "─": "boxh",
        "│": "boxv",
        "┌": "boxdr",
        "┐": "boxdl",
        "└": "boxur",
        "┘": "boxul",
        "├": "boxvr",
        "┤": "boxvl",
        "┬": "boxhd",
        "┴": "boxhu",
        "┼": "boxvh",
        "═": "boxH",
        "║": "boxV",
        "╒": "boxdR",
        "╓": "boxDr",
        "╔": "boxDR",
        "╕": "boxdL",
        "╖": "boxDl",
        "╗": "boxDL",
        "╘": "boxuR",
        "╙": "boxUr",
        "╚": "boxUR",
        "╛": "boxuL",
        "╜": "boxUl",
        "╝": "boxUL",
        "╞": "boxvR",
        "╟": "boxVr",
        "╠": "boxVR",
        "╡": "boxvL",
        "╢": "boxVl",
        "╣": "boxVL",
        "╤": "boxHd",
        "╥": "boxhD",
        "╦": "boxHD",
        "╧": "boxHu",
        "╨": "boxhU",
        "╩": "boxHU",
        "╪": "boxvH",
        "╫": "boxVh",
        "╬": "boxVH",
        "▀": "uhblk",
        "▄": "lhblk",
        "█": "block",
        "░": "blk14",
        "▒": "blk12",
        "▓": "blk34",
        "□": "squ",
        "▪": "squf",
        "▫": "EmptyVerySmallSquare",
        "▭": "rect",
        "▮": "marker",
        "▱": "fltns",
        "△": "xutri",
        "▴": "utrif",
        "▵": "utri",
        "▸": "rtrif",
        "▹": "rtri",
        "▽": "xdtri",
        "▾": "dtrif",
        "▿": "dtri",
        "◂": "ltrif",
        "◃": "ltri",
        "◊": "loz",
        "○": "cir",
        "◬": "tridot",
        "◯": "xcirc",
        "◸": "ultri",
        "◹": "urtri",
        "◺": "lltri",
        "◻": "EmptySmallSquare",
        "◼": "FilledSmallSquare",
        "★": "starf",
        "☆": "star",
        "☎": "phone",
        "♀": "female",
        "♂": "male",
        "♠": "spades",
        "♣": "clubs",
        "♥": "hearts",
        "♦": "diams",
        "♪": "sung",
        "✓": "check",
        "✗": "cross",
        "✠": "malt",
        "✶": "sext",
        "❘": "VerticalSeparator",
        "⟈": "bsolhsub",
        "⟉": "suphsol",
        "⟵": "xlarr",
        "⟶": "xrarr",
        "⟷": "xharr",
        "⟸": "xlArr",
        "⟹": "xrArr",
        "⟺": "xhArr",
        "⟼": "xmap",
        "⟿": "dzigrarr",
        "⤂": "nvlArr",
        "⤃": "nvrArr",
        "⤄": "nvHarr",
        "⤅": "Map",
        "⤌": "lbarr",
        "⤍": "rbarr",
        "⤎": "lBarr",
        "⤏": "rBarr",
        "⤐": "RBarr",
        "⤑": "DDotrahd",
        "⤒": "UpArrowBar",
        "⤓": "DownArrowBar",
        "⤖": "Rarrtl",
        "⤙": "latail",
        "⤚": "ratail",
        "⤛": "lAtail",
        "⤜": "rAtail",
        "⤝": "larrfs",
        "⤞": "rarrfs",
        "⤟": "larrbfs",
        "⤠": "rarrbfs",
        "⤣": "nwarhk",
        "⤤": "nearhk",
        "⤥": "searhk",
        "⤦": "swarhk",
        "⤧": "nwnear",
        "⤨": "toea",
        "⤩": "tosa",
        "⤪": "swnwar",
        "⤳": "rarrc",
        "⤳̸": "nrarrc",
        "⤵": "cudarrr",
        "⤶": "ldca",
        "⤷": "rdca",
        "⤸": "cudarrl",
        "⤹": "larrpl",
        "⤼": "curarrm",
        "⤽": "cularrp",
        "⥅": "rarrpl",
        "⥈": "harrcir",
        "⥉": "Uarrocir",
        "⥊": "lurdshar",
        "⥋": "ldrushar",
        "⥎": "LeftRightVector",
        "⥏": "RightUpDownVector",
        "⥐": "DownLeftRightVector",
        "⥑": "LeftUpDownVector",
        "⥒": "LeftVectorBar",
        "⥓": "RightVectorBar",
        "⥔": "RightUpVectorBar",
        "⥕": "RightDownVectorBar",
        "⥖": "DownLeftVectorBar",
        "⥗": "DownRightVectorBar",
        "⥘": "LeftUpVectorBar",
        "⥙": "LeftDownVectorBar",
        "⥚": "LeftTeeVector",
        "⥛": "RightTeeVector",
        "⥜": "RightUpTeeVector",
        "⥝": "RightDownTeeVector",
        "⥞": "DownLeftTeeVector",
        "⥟": "DownRightTeeVector",
        "⥠": "LeftUpTeeVector",
        "⥡": "LeftDownTeeVector",
        "⥢": "lHar",
        "⥣": "uHar",
        "⥤": "rHar",
        "⥥": "dHar",
        "⥦": "luruhar",
        "⥧": "ldrdhar",
        "⥨": "ruluhar",
        "⥩": "rdldhar",
        "⥪": "lharul",
        "⥫": "llhard",
        "⥬": "rharul",
        "⥭": "lrhard",
        "⥮": "udhar",
        "⥯": "duhar",
        "⥰": "RoundImplies",
        "⥱": "erarr",
        "⥲": "simrarr",
        "⥳": "larrsim",
        "⥴": "rarrsim",
        "⥵": "rarrap",
        "⥶": "ltlarr",
        "⥸": "gtrarr",
        "⥹": "subrarr",
        "⥻": "suplarr",
        "⥼": "lfisht",
        "⥽": "rfisht",
        "⥾": "ufisht",
        "⥿": "dfisht",
        "⦚": "vzigzag",
        "⦜": "vangrt",
        "⦝": "angrtvbd",
        "⦤": "ange",
        "⦥": "range",
        "⦦": "dwangle",
        "⦧": "uwangle",
        "⦨": "angmsdaa",
        "⦩": "angmsdab",
        "⦪": "angmsdac",
        "⦫": "angmsdad",
        "⦬": "angmsdae",
        "⦭": "angmsdaf",
        "⦮": "angmsdag",
        "⦯": "angmsdah",
        "⦰": "bemptyv",
        "⦱": "demptyv",
        "⦲": "cemptyv",
        "⦳": "raemptyv",
        "⦴": "laemptyv",
        "⦵": "ohbar",
        "⦶": "omid",
        "⦷": "opar",
        "⦹": "operp",
        "⦻": "olcross",
        "⦼": "odsold",
        "⦾": "olcir",
        "⦿": "ofcir",
        "⧀": "olt",
        "⧁": "ogt",
        "⧂": "cirscir",
        "⧃": "cirE",
        "⧄": "solb",
        "⧅": "bsolb",
        "⧉": "boxbox",
        "⧍": "trisb",
        "⧎": "rtriltri",
        "⧏": "LeftTriangleBar",
        "⧏̸": "NotLeftTriangleBar",
        "⧐": "RightTriangleBar",
        "⧐̸": "NotRightTriangleBar",
        "⧜": "iinfin",
        "⧝": "infintie",
        "⧞": "nvinfin",
        "⧣": "eparsl",
        "⧤": "smeparsl",
        "⧥": "eqvparsl",
        "⧫": "lozf",
        "⧴": "RuleDelayed",
        "⧶": "dsol",
        "⨀": "xodot",
        "⨁": "xoplus",
        "⨂": "xotime",
        "⨄": "xuplus",
        "⨆": "xsqcup",
        "⨍": "fpartint",
        "⨐": "cirfnint",
        "⨑": "awint",
        "⨒": "rppolint",
        "⨓": "scpolint",
        "⨔": "npolint",
        "⨕": "pointint",
        "⨖": "quatint",
        "⨗": "intlarhk",
        "⨢": "pluscir",
        "⨣": "plusacir",
        "⨤": "simplus",
        "⨥": "plusdu",
        "⨦": "plussim",
        "⨧": "plustwo",
        "⨩": "mcomma",
        "⨪": "minusdu",
        "⨭": "loplus",
        "⨮": "roplus",
        "⨯": "Cross",
        "⨰": "timesd",
        "⨱": "timesbar",
        "⨳": "smashp",
        "⨴": "lotimes",
        "⨵": "rotimes",
        "⨶": "otimesas",
        "⨷": "Otimes",
        "⨸": "odiv",
        "⨹": "triplus",
        "⨺": "triminus",
        "⨻": "tritime",
        "⨼": "iprod",
        "⨿": "amalg",
        "⩀": "capdot",
        "⩂": "ncup",
        "⩃": "ncap",
        "⩄": "capand",
        "⩅": "cupor",
        "⩆": "cupcap",
        "⩇": "capcup",
        "⩈": "cupbrcap",
        "⩉": "capbrcup",
        "⩊": "cupcup",
        "⩋": "capcap",
        "⩌": "ccups",
        "⩍": "ccaps",
        "⩐": "ccupssm",
        "⩓": "And",
        "⩔": "Or",
        "⩕": "andand",
        "⩖": "oror",
        "⩗": "orslope",
        "⩘": "andslope",
        "⩚": "andv",
        "⩛": "orv",
        "⩜": "andd",
        "⩝": "ord",
        "⩟": "wedbar",
        "⩦": "sdote",
        "⩪": "simdot",
        "⩭": "congdot",
        "⩭̸": "ncongdot",
        "⩮": "easter",
        "⩯": "apacir",
        "⩰": "apE",
        "⩰̸": "napE",
        "⩱": "eplus",
        "⩲": "pluse",
        "⩳": "Esim",
        "⩷": "eDDot",
        "⩸": "equivDD",
        "⩹": "ltcir",
        "⩺": "gtcir",
        "⩻": "ltquest",
        "⩼": "gtquest",
        "⩽": "les",
        "⩽̸": "nles",
        "⩾": "ges",
        "⩾̸": "nges",
        "⩿": "lesdot",
        "⪀": "gesdot",
        "⪁": "lesdoto",
        "⪂": "gesdoto",
        "⪃": "lesdotor",
        "⪄": "gesdotol",
        "⪅": "lap",
        "⪆": "gap",
        "⪇": "lne",
        "⪈": "gne",
        "⪉": "lnap",
        "⪊": "gnap",
        "⪋": "lEg",
        "⪌": "gEl",
        "⪍": "lsime",
        "⪎": "gsime",
        "⪏": "lsimg",
        "⪐": "gsiml",
        "⪑": "lgE",
        "⪒": "glE",
        "⪓": "lesges",
        "⪔": "gesles",
        "⪕": "els",
        "⪖": "egs",
        "⪗": "elsdot",
        "⪘": "egsdot",
        "⪙": "el",
        "⪚": "eg",
        "⪝": "siml",
        "⪞": "simg",
        "⪟": "simlE",
        "⪠": "simgE",
        "⪡": "LessLess",
        "⪡̸": "NotNestedLessLess",
        "⪢": "GreaterGreater",
        "⪢̸": "NotNestedGreaterGreater",
        "⪤": "glj",
        "⪥": "gla",
        "⪦": "ltcc",
        "⪧": "gtcc",
        "⪨": "lescc",
        "⪩": "gescc",
        "⪪": "smt",
        "⪫": "lat",
        "⪬": "smte",
        "⪬︀": "smtes",
        "⪭": "late",
        "⪭︀": "lates",
        "⪮": "bumpE",
        "⪯": "pre",
        "⪯̸": "npre",
        "⪰": "sce",
        "⪰̸": "nsce",
        "⪳": "prE",
        "⪴": "scE",
        "⪵": "prnE",
        "⪶": "scnE",
        "⪷": "prap",
        "⪸": "scap",
        "⪹": "prnap",
        "⪺": "scnap",
        "⪻": "Pr",
        "⪼": "Sc",
        "⪽": "subdot",
        "⪾": "supdot",
        "⪿": "subplus",
        "⫀": "supplus",
        "⫁": "submult",
        "⫂": "supmult",
        "⫃": "subedot",
        "⫄": "supedot",
        "⫅": "subE",
        "⫅̸": "nsubE",
        "⫆": "supE",
        "⫆̸": "nsupE",
        "⫇": "subsim",
        "⫈": "supsim",
        "⫋︀": "vsubnE",
        "⫋": "subnE",
        "⫌︀": "vsupnE",
        "⫌": "supnE",
        "⫏": "csub",
        "⫐": "csup",
        "⫑": "csube",
        "⫒": "csupe",
        "⫓": "subsup",
        "⫔": "supsub",
        "⫕": "subsub",
        "⫖": "supsup",
        "⫗": "suphsub",
        "⫘": "supdsub",
        "⫙": "forkv",
        "⫚": "topfork",
        "⫛": "mlcp",
        "⫤": "Dashv",
        "⫦": "Vdashl",
        "⫧": "Barv",
        "⫨": "vBar",
        "⫩": "vBarv",
        "⫫": "Vbar",
        "⫬": "Not",
        "⫭": "bNot",
        "⫮": "rnmid",
        "⫯": "cirmid",
        "⫰": "midcir",
        "⫱": "topcir",
        "⫲": "nhpar",
        "⫳": "parsim",
        "⫽": "parsl",
        "⫽⃥": "nparsl",
        "♭": "flat",
        "♮": "natur",
        "♯": "sharp",
        "¤": "curren",
        "¢": "cent",
        $: "dollar",
        "£": "pound",
        "¥": "yen",
        "€": "euro",
        "¹": "sup1",
        "½": "half",
        "⅓": "frac13",
        "¼": "frac14",
        "⅕": "frac15",
        "⅙": "frac16",
        "⅛": "frac18",
        "²": "sup2",
        "⅔": "frac23",
        "⅖": "frac25",
        "³": "sup3",
        "¾": "frac34",
        "⅗": "frac35",
        "⅜": "frac38",
        "⅘": "frac45",
        "⅚": "frac56",
        "⅝": "frac58",
        "⅞": "frac78",
        "𝒶": "ascr",
        "𝕒": "aopf",
        "𝔞": "afr",
        "𝔸": "Aopf",
        "𝔄": "Afr",
        "𝒜": "Ascr",
        "ª": "ordf",
        "á": "aacute",
        "Á": "Aacute",
        "à": "agrave",
        "À": "Agrave",
        "ă": "abreve",
        "Ă": "Abreve",
        "â": "acirc",
        "Â": "Acirc",
        "å": "aring",
        "Å": "angst",
        "ä": "auml",
        "Ä": "Auml",
        "ã": "atilde",
        "Ã": "Atilde",
        "ą": "aogon",
        "Ą": "Aogon",
        "ā": "amacr",
        "Ā": "Amacr",
        "æ": "aelig",
        "Æ": "AElig",
        "𝒷": "bscr",
        "𝕓": "bopf",
        "𝔟": "bfr",
        "𝔹": "Bopf",
        "ℬ": "Bscr",
        "𝔅": "Bfr",
        "𝔠": "cfr",
        "𝒸": "cscr",
        "𝕔": "copf",
        "ℭ": "Cfr",
        "𝒞": "Cscr",
        "ℂ": "Copf",
        "ć": "cacute",
        "Ć": "Cacute",
        "ĉ": "ccirc",
        "Ĉ": "Ccirc",
        "č": "ccaron",
        "Č": "Ccaron",
        "ċ": "cdot",
        "Ċ": "Cdot",
        "ç": "ccedil",
        "Ç": "Ccedil",
        "℅": "incare",
        "𝔡": "dfr",
        "ⅆ": "dd",
        "𝕕": "dopf",
        "𝒹": "dscr",
        "𝒟": "Dscr",
        "𝔇": "Dfr",
        "ⅅ": "DD",
        "𝔻": "Dopf",
        "ď": "dcaron",
        "Ď": "Dcaron",
        "đ": "dstrok",
        "Đ": "Dstrok",
        "ð": "eth",
        "Ð": "ETH",
        "ⅇ": "ee",
        "ℯ": "escr",
        "𝔢": "efr",
        "𝕖": "eopf",
        "ℰ": "Escr",
        "𝔈": "Efr",
        "𝔼": "Eopf",
        "é": "eacute",
        "É": "Eacute",
        "è": "egrave",
        "È": "Egrave",
        "ê": "ecirc",
        "Ê": "Ecirc",
        "ě": "ecaron",
        "Ě": "Ecaron",
        "ë": "euml",
        "Ë": "Euml",
        "ė": "edot",
        "Ė": "Edot",
        "ę": "eogon",
        "Ę": "Eogon",
        "ē": "emacr",
        "Ē": "Emacr",
        "𝔣": "ffr",
        "𝕗": "fopf",
        "𝒻": "fscr",
        "𝔉": "Ffr",
        "𝔽": "Fopf",
        "ℱ": "Fscr",
        "ﬀ": "fflig",
        "ﬃ": "ffilig",
        "ﬄ": "ffllig",
        "ﬁ": "filig",
        fj: "fjlig",
        "ﬂ": "fllig",
        "ƒ": "fnof",
        "ℊ": "gscr",
        "𝕘": "gopf",
        "𝔤": "gfr",
        "𝒢": "Gscr",
        "𝔾": "Gopf",
        "𝔊": "Gfr",
        "ǵ": "gacute",
        "ğ": "gbreve",
        "Ğ": "Gbreve",
        "ĝ": "gcirc",
        "Ĝ": "Gcirc",
        "ġ": "gdot",
        "Ġ": "Gdot",
        "Ģ": "Gcedil",
        "𝔥": "hfr",
        "ℎ": "planckh",
        "𝒽": "hscr",
        "𝕙": "hopf",
        "ℋ": "Hscr",
        "ℌ": "Hfr",
        "ℍ": "Hopf",
        "ĥ": "hcirc",
        "Ĥ": "Hcirc",
        "ℏ": "hbar",
        "ħ": "hstrok",
        "Ħ": "Hstrok",
        "𝕚": "iopf",
        "𝔦": "ifr",
        "𝒾": "iscr",
        "ⅈ": "ii",
        "𝕀": "Iopf",
        "ℐ": "Iscr",
        "ℑ": "Im",
        "í": "iacute",
        "Í": "Iacute",
        "ì": "igrave",
        "Ì": "Igrave",
        "î": "icirc",
        "Î": "Icirc",
        "ï": "iuml",
        "Ï": "Iuml",
        "ĩ": "itilde",
        "Ĩ": "Itilde",
        "İ": "Idot",
        "į": "iogon",
        "Į": "Iogon",
        "ī": "imacr",
        "Ī": "Imacr",
        "ĳ": "ijlig",
        "Ĳ": "IJlig",
        "ı": "imath",
        "𝒿": "jscr",
        "𝕛": "jopf",
        "𝔧": "jfr",
        "𝒥": "Jscr",
        "𝔍": "Jfr",
        "𝕁": "Jopf",
        "ĵ": "jcirc",
        "Ĵ": "Jcirc",
        "ȷ": "jmath",
        "𝕜": "kopf",
        "𝓀": "kscr",
        "𝔨": "kfr",
        "𝒦": "Kscr",
        "𝕂": "Kopf",
        "𝔎": "Kfr",
        "ķ": "kcedil",
        "Ķ": "Kcedil",
        "𝔩": "lfr",
        "𝓁": "lscr",
        "ℓ": "ell",
        "𝕝": "lopf",
        "ℒ": "Lscr",
        "𝔏": "Lfr",
        "𝕃": "Lopf",
        "ĺ": "lacute",
        "Ĺ": "Lacute",
        "ľ": "lcaron",
        "Ľ": "Lcaron",
        "ļ": "lcedil",
        "Ļ": "Lcedil",
        "ł": "lstrok",
        "Ł": "Lstrok",
        "ŀ": "lmidot",
        "Ŀ": "Lmidot",
        "𝔪": "mfr",
        "𝕞": "mopf",
        "𝓂": "mscr",
        "𝔐": "Mfr",
        "𝕄": "Mopf",
        "ℳ": "Mscr",
        "𝔫": "nfr",
        "𝕟": "nopf",
        "𝓃": "nscr",
        "ℕ": "Nopf",
        "𝒩": "Nscr",
        "𝔑": "Nfr",
        "ń": "nacute",
        "Ń": "Nacute",
        "ň": "ncaron",
        "Ň": "Ncaron",
        "ñ": "ntilde",
        "Ñ": "Ntilde",
        "ņ": "ncedil",
        "Ņ": "Ncedil",
        "№": "numero",
        "ŋ": "eng",
        "Ŋ": "ENG",
        "𝕠": "oopf",
        "𝔬": "ofr",
        "ℴ": "oscr",
        "𝒪": "Oscr",
        "𝔒": "Ofr",
        "𝕆": "Oopf",
        "º": "ordm",
        "ó": "oacute",
        "Ó": "Oacute",
        "ò": "ograve",
        "Ò": "Ograve",
        "ô": "ocirc",
        "Ô": "Ocirc",
        "ö": "ouml",
        "Ö": "Ouml",
        "ő": "odblac",
        "Ő": "Odblac",
        "õ": "otilde",
        "Õ": "Otilde",
        "ø": "oslash",
        "Ø": "Oslash",
        "ō": "omacr",
        "Ō": "Omacr",
        "œ": "oelig",
        "Œ": "OElig",
        "𝔭": "pfr",
        "𝓅": "pscr",
        "𝕡": "popf",
        "ℙ": "Popf",
        "𝔓": "Pfr",
        "𝒫": "Pscr",
        "𝕢": "qopf",
        "𝔮": "qfr",
        "𝓆": "qscr",
        "𝒬": "Qscr",
        "𝔔": "Qfr",
        "ℚ": "Qopf",
        "ĸ": "kgreen",
        "𝔯": "rfr",
        "𝕣": "ropf",
        "𝓇": "rscr",
        "ℛ": "Rscr",
        "ℜ": "Re",
        "ℝ": "Ropf",
        "ŕ": "racute",
        "Ŕ": "Racute",
        "ř": "rcaron",
        "Ř": "Rcaron",
        "ŗ": "rcedil",
        "Ŗ": "Rcedil",
        "𝕤": "sopf",
        "𝓈": "sscr",
        "𝔰": "sfr",
        "𝕊": "Sopf",
        "𝔖": "Sfr",
        "𝒮": "Sscr",
        "Ⓢ": "oS",
        "ś": "sacute",
        "Ś": "Sacute",
        "ŝ": "scirc",
        "Ŝ": "Scirc",
        "š": "scaron",
        "Š": "Scaron",
        "ş": "scedil",
        "Ş": "Scedil",
        "ß": "szlig",
        "𝔱": "tfr",
        "𝓉": "tscr",
        "𝕥": "topf",
        "𝒯": "Tscr",
        "𝔗": "Tfr",
        "𝕋": "Topf",
        "ť": "tcaron",
        "Ť": "Tcaron",
        "ţ": "tcedil",
        "Ţ": "Tcedil",
        "™": "trade",
        "ŧ": "tstrok",
        "Ŧ": "Tstrok",
        "𝓊": "uscr",
        "𝕦": "uopf",
        "𝔲": "ufr",
        "𝕌": "Uopf",
        "𝔘": "Ufr",
        "𝒰": "Uscr",
        "ú": "uacute",
        "Ú": "Uacute",
        "ù": "ugrave",
        "Ù": "Ugrave",
        "ŭ": "ubreve",
        "Ŭ": "Ubreve",
        "û": "ucirc",
        "Û": "Ucirc",
        "ů": "uring",
        "Ů": "Uring",
        "ü": "uuml",
        "Ü": "Uuml",
        "ű": "udblac",
        "Ű": "Udblac",
        "ũ": "utilde",
        "Ũ": "Utilde",
        "ų": "uogon",
        "Ų": "Uogon",
        "ū": "umacr",
        "Ū": "Umacr",
        "𝔳": "vfr",
        "𝕧": "vopf",
        "𝓋": "vscr",
        "𝔙": "Vfr",
        "𝕍": "Vopf",
        "𝒱": "Vscr",
        "𝕨": "wopf",
        "𝓌": "wscr",
        "𝔴": "wfr",
        "𝒲": "Wscr",
        "𝕎": "Wopf",
        "𝔚": "Wfr",
        "ŵ": "wcirc",
        "Ŵ": "Wcirc",
        "𝔵": "xfr",
        "𝓍": "xscr",
        "𝕩": "xopf",
        "𝕏": "Xopf",
        "𝔛": "Xfr",
        "𝒳": "Xscr",
        "𝔶": "yfr",
        "𝓎": "yscr",
        "𝕪": "yopf",
        "𝒴": "Yscr",
        "𝔜": "Yfr",
        "𝕐": "Yopf",
        "ý": "yacute",
        "Ý": "Yacute",
        "ŷ": "ycirc",
        "Ŷ": "Ycirc",
        "ÿ": "yuml",
        "Ÿ": "Yuml",
        "𝓏": "zscr",
        "𝔷": "zfr",
        "𝕫": "zopf",
        "ℨ": "Zfr",
        "ℤ": "Zopf",
        "𝒵": "Zscr",
        "ź": "zacute",
        "Ź": "Zacute",
        "ž": "zcaron",
        "Ž": "Zcaron",
        "ż": "zdot",
        "Ż": "Zdot",
        "Ƶ": "imped",
        "þ": "thorn",
        "Þ": "THORN",
        "ŉ": "napos",
        "α": "alpha",
        "Α": "Alpha",
        "β": "beta",
        "Β": "Beta",
        "γ": "gamma",
        "Γ": "Gamma",
        "δ": "delta",
        "Δ": "Delta",
        "ε": "epsi",
        "ϵ": "epsiv",
        "Ε": "Epsilon",
        "ϝ": "gammad",
        "Ϝ": "Gammad",
        "ζ": "zeta",
        "Ζ": "Zeta",
        "η": "eta",
        "Η": "Eta",
        "θ": "theta",
        "ϑ": "thetav",
        "Θ": "Theta",
        "ι": "iota",
        "Ι": "Iota",
        "κ": "kappa",
        "ϰ": "kappav",
        "Κ": "Kappa",
        "λ": "lambda",
        "Λ": "Lambda",
        "μ": "mu",
        "µ": "micro",
        "Μ": "Mu",
        "ν": "nu",
        "Ν": "Nu",
        "ξ": "xi",
        "Ξ": "Xi",
        "ο": "omicron",
        "Ο": "Omicron",
        "π": "pi",
        "ϖ": "piv",
        "Π": "Pi",
        "ρ": "rho",
        "ϱ": "rhov",
        "Ρ": "Rho",
        "σ": "sigma",
        "Σ": "Sigma",
        "ς": "sigmaf",
        "τ": "tau",
        "Τ": "Tau",
        "υ": "upsi",
        "Υ": "Upsilon",
        "ϒ": "Upsi",
        "φ": "phi",
        "ϕ": "phiv",
        "Φ": "Phi",
        "χ": "chi",
        "Χ": "Chi",
        "ψ": "psi",
        "Ψ": "Psi",
        "ω": "omega",
        "Ω": "ohm",
        "а": "acy",
        "А": "Acy",
        "б": "bcy",
        "Б": "Bcy",
        "в": "vcy",
        "В": "Vcy",
        "г": "gcy",
        "Г": "Gcy",
        "ѓ": "gjcy",
        "Ѓ": "GJcy",
        "д": "dcy",
        "Д": "Dcy",
        "ђ": "djcy",
        "Ђ": "DJcy",
        "е": "iecy",
        "Е": "IEcy",
        "ё": "iocy",
        "Ё": "IOcy",
        "є": "jukcy",
        "Є": "Jukcy",
        "ж": "zhcy",
        "Ж": "ZHcy",
        "з": "zcy",
        "З": "Zcy",
        "ѕ": "dscy",
        "Ѕ": "DScy",
        "и": "icy",
        "И": "Icy",
        "і": "iukcy",
        "І": "Iukcy",
        "ї": "yicy",
        "Ї": "YIcy",
        "й": "jcy",
        "Й": "Jcy",
        "ј": "jsercy",
        "Ј": "Jsercy",
        "к": "kcy",
        "К": "Kcy",
        "ќ": "kjcy",
        "Ќ": "KJcy",
        "л": "lcy",
        "Л": "Lcy",
        "љ": "ljcy",
        "Љ": "LJcy",
        "м": "mcy",
        "М": "Mcy",
        "н": "ncy",
        "Н": "Ncy",
        "њ": "njcy",
        "Њ": "NJcy",
        "о": "ocy",
        "О": "Ocy",
        "п": "pcy",
        "П": "Pcy",
        "р": "rcy",
        "Р": "Rcy",
        "с": "scy",
        "С": "Scy",
        "т": "tcy",
        "Т": "Tcy",
        "ћ": "tshcy",
        "Ћ": "TSHcy",
        "у": "ucy",
        "У": "Ucy",
        "ў": "ubrcy",
        "Ў": "Ubrcy",
        "ф": "fcy",
        "Ф": "Fcy",
        "х": "khcy",
        "Х": "KHcy",
        "ц": "tscy",
        "Ц": "TScy",
        "ч": "chcy",
        "Ч": "CHcy",
        "џ": "dzcy",
        "Џ": "DZcy",
        "ш": "shcy",
        "Ш": "SHcy",
        "щ": "shchcy",
        "Щ": "SHCHcy",
        "ъ": "hardcy",
        "Ъ": "HARDcy",
        "ы": "ycy",
        "Ы": "Ycy",
        "ь": "softcy",
        "Ь": "SOFTcy",
        "э": "ecy",
        "Э": "Ecy",
        "ю": "yucy",
        "Ю": "YUcy",
        "я": "yacy",
        "Я": "YAcy",
        "ℵ": "aleph",
        "ℶ": "beth",
        "ℷ": "gimel",
        "ℸ": "daleth"
    };
    var d12 = /["&'<>`]/g;
    var g12 = {
        '"': "&quot;",
        "&": "&amp;",
        "'": "&#x27;",
        "<": "&lt;",
        ">": "&gt;",
        "`": "&#x60;"
    };
    var m1 = /&#(?:[xX][^a-fA-F0-9]|[^0-9xX])/;
    var f11 = /[\0-\x08\x0B\x0E-\x1F\x7F-\x9F\uFDD0-\uFDEF\uFFFE\uFFFF]|[\uD83F\uD87F\uD8BF\uD8FF\uD93F\uD97F\uD9BF\uD9FF\uDA3F\uDA7F\uDABF\uDAFF\uDB3F\uDB7F\uDBBF\uDBFF][\uDFFE\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/;
    var b1 = /&(CounterClockwiseContourIntegral|DoubleLongLeftRightArrow|ClockwiseContourIntegral|NotNestedGreaterGreater|NotSquareSupersetEqual|DiacriticalDoubleAcute|NotRightTriangleEqual|NotSucceedsSlantEqual|NotPrecedesSlantEqual|CloseCurlyDoubleQuote|NegativeVeryThinSpace|DoubleContourIntegral|FilledVerySmallSquare|CapitalDifferentialD|OpenCurlyDoubleQuote|EmptyVerySmallSquare|NestedGreaterGreater|DoubleLongRightArrow|NotLeftTriangleEqual|NotGreaterSlantEqual|ReverseUpEquilibrium|DoubleLeftRightArrow|NotSquareSubsetEqual|NotDoubleVerticalBar|RightArrowLeftArrow|NotGreaterFullEqual|NotRightTriangleBar|SquareSupersetEqual|DownLeftRightVector|DoubleLongLeftArrow|leftrightsquigarrow|LeftArrowRightArrow|NegativeMediumSpace|blacktriangleright|RightDownVectorBar|PrecedesSlantEqual|RightDoubleBracket|SucceedsSlantEqual|NotLeftTriangleBar|RightTriangleEqual|SquareIntersection|RightDownTeeVector|ReverseEquilibrium|NegativeThickSpace|longleftrightarrow|Longleftrightarrow|LongLeftRightArrow|DownRightTeeVector|DownRightVectorBar|GreaterSlantEqual|SquareSubsetEqual|LeftDownVectorBar|LeftDoubleBracket|VerticalSeparator|rightleftharpoons|NotGreaterGreater|NotSquareSuperset|blacktriangleleft|blacktriangledown|NegativeThinSpace|LeftDownTeeVector|NotLessSlantEqual|leftrightharpoons|DoubleUpDownArrow|DoubleVerticalBar|LeftTriangleEqual|FilledSmallSquare|twoheadrightarrow|NotNestedLessLess|DownLeftTeeVector|DownLeftVectorBar|RightAngleBracket|NotTildeFullEqual|NotReverseElement|RightUpDownVector|DiacriticalTilde|NotSucceedsTilde|circlearrowright|NotPrecedesEqual|rightharpoondown|DoubleRightArrow|NotSucceedsEqual|NonBreakingSpace|NotRightTriangle|LessEqualGreater|RightUpTeeVector|LeftAngleBracket|GreaterFullEqual|DownArrowUpArrow|RightUpVectorBar|twoheadleftarrow|GreaterEqualLess|downharpoonright|RightTriangleBar|ntrianglerighteq|NotSupersetEqual|LeftUpDownVector|DiacriticalAcute|rightrightarrows|vartriangleright|UpArrowDownArrow|DiacriticalGrave|UnderParenthesis|EmptySmallSquare|LeftUpVectorBar|leftrightarrows|DownRightVector|downharpoonleft|trianglerighteq|ShortRightArrow|OverParenthesis|DoubleLeftArrow|DoubleDownArrow|NotSquareSubset|bigtriangledown|ntrianglelefteq|UpperRightArrow|curvearrowright|vartriangleleft|NotLeftTriangle|nleftrightarrow|LowerRightArrow|NotHumpDownHump|NotGreaterTilde|rightthreetimes|LeftUpTeeVector|NotGreaterEqual|straightepsilon|LeftTriangleBar|rightsquigarrow|ContourIntegral|rightleftarrows|CloseCurlyQuote|RightDownVector|LeftRightVector|nLeftrightarrow|leftharpoondown|circlearrowleft|SquareSuperset|OpenCurlyQuote|hookrightarrow|HorizontalLine|DiacriticalDot|NotLessGreater|ntriangleright|DoubleRightTee|InvisibleComma|InvisibleTimes|LowerLeftArrow|DownLeftVector|NotSubsetEqual|curvearrowleft|trianglelefteq|NotVerticalBar|TildeFullEqual|downdownarrows|NotGreaterLess|RightTeeVector|ZeroWidthSpace|looparrowright|LongRightArrow|doublebarwedge|ShortLeftArrow|ShortDownArrow|RightVectorBar|GreaterGreater|ReverseElement|rightharpoonup|LessSlantEqual|leftthreetimes|upharpoonright|rightarrowtail|LeftDownVector|Longrightarrow|NestedLessLess|UpperLeftArrow|nshortparallel|leftleftarrows|leftrightarrow|Leftrightarrow|LeftRightArrow|longrightarrow|upharpoonleft|RightArrowBar|ApplyFunction|LeftTeeVector|leftarrowtail|NotEqualTilde|varsubsetneqq|varsupsetneqq|RightTeeArrow|SucceedsEqual|SucceedsTilde|LeftVectorBar|SupersetEqual|hookleftarrow|DifferentialD|VerticalTilde|VeryThinSpace|blacktriangle|bigtriangleup|LessFullEqual|divideontimes|leftharpoonup|UpEquilibrium|ntriangleleft|RightTriangle|measuredangle|shortparallel|longleftarrow|Longleftarrow|LongLeftArrow|DoubleLeftTee|Poincareplane|PrecedesEqual|triangleright|DoubleUpArrow|RightUpVector|fallingdotseq|looparrowleft|PrecedesTilde|NotTildeEqual|NotTildeTilde|smallsetminus|Proportional|triangleleft|triangledown|UnderBracket|NotHumpEqual|exponentiale|ExponentialE|NotLessTilde|HilbertSpace|RightCeiling|blacklozenge|varsupsetneq|HumpDownHump|GreaterEqual|VerticalLine|LeftTeeArrow|NotLessEqual|DownTeeArrow|LeftTriangle|varsubsetneq|Intersection|NotCongruent|DownArrowBar|LeftUpVector|LeftArrowBar|risingdotseq|GreaterTilde|RoundImplies|SquareSubset|ShortUpArrow|NotSuperset|quaternions|precnapprox|backepsilon|preccurlyeq|OverBracket|blacksquare|MediumSpace|VerticalBar|circledcirc|circleddash|CircleMinus|CircleTimes|LessGreater|curlyeqprec|curlyeqsucc|diamondsuit|UpDownArrow|Updownarrow|RuleDelayed|Rrightarrow|updownarrow|RightVector|nRightarrow|nrightarrow|eqslantless|LeftCeiling|Equilibrium|SmallCircle|expectation|NotSucceeds|thickapprox|GreaterLess|SquareUnion|NotPrecedes|NotLessLess|straightphi|succnapprox|succcurlyeq|SubsetEqual|sqsupseteq|Proportion|Laplacetrf|ImaginaryI|supsetneqq|NotGreater|gtreqqless|NotElement|ThickSpace|TildeEqual|TildeTilde|Fouriertrf|rmoustache|EqualTilde|eqslantgtr|UnderBrace|LeftVector|UpArrowBar|nLeftarrow|nsubseteqq|subsetneqq|nsupseteqq|nleftarrow|succapprox|lessapprox|UpTeeArrow|upuparrows|curlywedge|lesseqqgtr|varepsilon|varnothing|RightFloor|complement|CirclePlus|sqsubseteq|Lleftarrow|circledast|RightArrow|Rightarrow|rightarrow|lmoustache|Bernoullis|precapprox|mapstoleft|mapstodown|longmapsto|dotsquare|downarrow|DoubleDot|nsubseteq|supsetneq|leftarrow|nsupseteq|subsetneq|ThinSpace|ngeqslant|subseteqq|HumpEqual|NotSubset|triangleq|NotCupCap|lesseqgtr|heartsuit|TripleDot|Leftarrow|Coproduct|Congruent|varpropto|complexes|gvertneqq|LeftArrow|LessTilde|supseteqq|MinusPlus|CircleDot|nleqslant|NotExists|gtreqless|nparallel|UnionPlus|LeftFloor|checkmark|CenterDot|centerdot|Mellintrf|gtrapprox|bigotimes|OverBrace|spadesuit|therefore|pitchfork|rationals|PlusMinus|Backslash|Therefore|DownBreve|backsimeq|backprime|DownArrow|nshortmid|Downarrow|lvertneqq|eqvparsl|imagline|imagpart|infintie|integers|Integral|intercal|LessLess|Uarrocir|intlarhk|sqsupset|angmsdaf|sqsubset|llcorner|vartheta|cupbrcap|lnapprox|Superset|SuchThat|succnsim|succneqq|angmsdag|biguplus|curlyvee|trpezium|Succeeds|NotTilde|bigwedge|angmsdah|angrtvbd|triminus|cwconint|fpartint|lrcorner|smeparsl|subseteq|urcorner|lurdshar|laemptyv|DDotrahd|approxeq|ldrushar|awconint|mapstoup|backcong|shortmid|triangle|geqslant|gesdotol|timesbar|circledR|circledS|setminus|multimap|naturals|scpolint|ncongdot|RightTee|boxminus|gnapprox|boxtimes|andslope|thicksim|angmsdaa|varsigma|cirfnint|rtriltri|angmsdab|rppolint|angmsdac|barwedge|drbkarow|clubsuit|thetasym|bsolhsub|capbrcup|dzigrarr|doteqdot|DotEqual|dotminus|UnderBar|NotEqual|realpart|otimesas|ulcorner|hksearow|hkswarow|parallel|PartialD|elinters|emptyset|plusacir|bbrktbrk|angmsdad|pointint|bigoplus|angmsdae|Precedes|bigsqcup|varkappa|notindot|supseteq|precneqq|precnsim|profalar|profline|profsurf|leqslant|lesdotor|raemptyv|subplus|notnivb|notnivc|subrarr|zigrarr|vzigzag|submult|subedot|Element|between|cirscir|larrbfs|larrsim|lotimes|lbrksld|lbrkslu|lozenge|ldrdhar|dbkarow|bigcirc|epsilon|simrarr|simplus|ltquest|Epsilon|luruhar|gtquest|maltese|npolint|eqcolon|npreceq|bigodot|ddagger|gtrless|bnequiv|harrcir|ddotseq|equivDD|backsim|demptyv|nsqsube|nsqsupe|Upsilon|nsubset|upsilon|minusdu|nsucceq|swarrow|nsupset|coloneq|searrow|boxplus|napprox|natural|asympeq|alefsym|congdot|nearrow|bigstar|diamond|supplus|tritime|LeftTee|nvinfin|triplus|NewLine|nvltrie|nvrtrie|nwarrow|nexists|Diamond|ruluhar|Implies|supmult|angzarr|suplarr|suphsub|questeq|because|digamma|Because|olcross|bemptyv|omicron|Omicron|rotimes|NoBreak|intprod|angrtvb|orderof|uwangle|suphsol|lesdoto|orslope|DownTee|realine|cudarrl|rdldhar|OverBar|supedot|lessdot|supdsub|topfork|succsim|rbrkslu|rbrksld|pertenk|cudarrr|isindot|planckh|lessgtr|pluscir|gesdoto|plussim|plustwo|lesssim|cularrp|rarrsim|Cayleys|notinva|notinvb|notinvc|UpArrow|Uparrow|uparrow|NotLess|dwangle|precsim|Product|curarrm|Cconint|dotplus|rarrbfs|ccupssm|Cedilla|cemptyv|notniva|quatint|frac35|frac38|frac45|frac56|frac58|frac78|tridot|xoplus|gacute|gammad|Gammad|lfisht|lfloor|bigcup|sqsupe|gbreve|Gbreve|lharul|sqsube|sqcups|Gcedil|apacir|llhard|lmidot|Lmidot|lmoust|andand|sqcaps|approx|Abreve|spades|circeq|tprime|divide|topcir|Assign|topbot|gesdot|divonx|xuplus|timesd|gesles|atilde|solbar|SOFTcy|loplus|timesb|lowast|lowbar|dlcorn|dlcrop|softcy|dollar|lparlt|thksim|lrhard|Atilde|lsaquo|smashp|bigvee|thinsp|wreath|bkarow|lsquor|lstrok|Lstrok|lthree|ltimes|ltlarr|DotDot|simdot|ltrPar|weierp|xsqcup|angmsd|sigmav|sigmaf|zeetrf|Zcaron|zcaron|mapsto|vsupne|thetav|cirmid|marker|mcomma|Zacute|vsubnE|there4|gtlPar|vsubne|bottom|gtrarr|SHCHcy|shchcy|midast|midcir|middot|minusb|minusd|gtrdot|bowtie|sfrown|mnplus|models|colone|seswar|Colone|mstpos|searhk|gtrsim|nacute|Nacute|boxbox|telrec|hairsp|Tcedil|nbumpe|scnsim|ncaron|Ncaron|ncedil|Ncedil|hamilt|Scedil|nearhk|hardcy|HARDcy|tcedil|Tcaron|commat|nequiv|nesear|tcaron|target|hearts|nexist|varrho|scedil|Scaron|scaron|hellip|Sacute|sacute|hercon|swnwar|compfn|rtimes|rthree|rsquor|rsaquo|zacute|wedgeq|homtht|barvee|barwed|Barwed|rpargt|horbar|conint|swarhk|roplus|nltrie|hslash|hstrok|Hstrok|rmoust|Conint|bprime|hybull|hyphen|iacute|Iacute|supsup|supsub|supsim|varphi|coprod|brvbar|agrave|Supset|supset|igrave|Igrave|notinE|Agrave|iiiint|iinfin|copysr|wedbar|Verbar|vangrt|becaus|incare|verbar|inodot|bullet|drcorn|intcal|drcrop|cularr|vellip|Utilde|bumpeq|cupcap|dstrok|Dstrok|CupCap|cupcup|cupdot|eacute|Eacute|supdot|iquest|easter|ecaron|Ecaron|ecolon|isinsv|utilde|itilde|Itilde|curarr|succeq|Bumpeq|cacute|ulcrop|nparsl|Cacute|nprcue|egrave|Egrave|nrarrc|nrarrw|subsup|subsub|nrtrie|jsercy|nsccue|Jsercy|kappav|kcedil|Kcedil|subsim|ulcorn|nsimeq|egsdot|veebar|kgreen|capand|elsdot|Subset|subset|curren|aacute|lacute|Lacute|emptyv|ntilde|Ntilde|lagran|lambda|Lambda|capcap|Ugrave|langle|subdot|emsp13|numero|emsp14|nvdash|nvDash|nVdash|nVDash|ugrave|ufisht|nvHarr|larrfs|nvlArr|larrhk|larrlp|larrpl|nvrArr|Udblac|nwarhk|larrtl|nwnear|oacute|Oacute|latail|lAtail|sstarf|lbrace|odblac|Odblac|lbrack|udblac|odsold|eparsl|lcaron|Lcaron|ograve|Ograve|lcedil|Lcedil|Aacute|ssmile|ssetmn|squarf|ldquor|capcup|ominus|cylcty|rharul|eqcirc|dagger|rfloor|rfisht|Dagger|daleth|equals|origof|capdot|equest|dcaron|Dcaron|rdquor|oslash|Oslash|otilde|Otilde|otimes|Otimes|urcrop|Ubreve|ubreve|Yacute|Uacute|uacute|Rcedil|rcedil|urcorn|parsim|Rcaron|Vdashl|rcaron|Tstrok|percnt|period|permil|Exists|yacute|rbrack|rbrace|phmmat|ccaron|Ccaron|planck|ccedil|plankv|tstrok|female|plusdo|plusdu|ffilig|plusmn|ffllig|Ccedil|rAtail|dfisht|bernou|ratail|Rarrtl|rarrtl|angsph|rarrpl|rarrlp|rarrhk|xwedge|xotime|forall|ForAll|Vvdash|vsupnE|preceq|bigcap|frac12|frac13|frac14|primes|rarrfs|prnsim|frac15|Square|frac16|square|lesdot|frac18|frac23|propto|prurel|rarrap|rangle|puncsp|frac25|Racute|qprime|racute|lesges|frac34|abreve|AElig|eqsim|utdot|setmn|urtri|Equal|Uring|seArr|uring|searr|dashv|Dashv|mumap|nabla|iogon|Iogon|sdote|sdotb|scsim|napid|napos|equiv|natur|Acirc|dblac|erarr|nbump|iprod|erDot|ucirc|awint|esdot|angrt|ncong|isinE|scnap|Scirc|scirc|ndash|isins|Ubrcy|nearr|neArr|isinv|nedot|ubrcy|acute|Ycirc|iukcy|Iukcy|xutri|nesim|caret|jcirc|Jcirc|caron|twixt|ddarr|sccue|exist|jmath|sbquo|ngeqq|angst|ccaps|lceil|ngsim|UpTee|delta|Delta|rtrif|nharr|nhArr|nhpar|rtrie|jukcy|Jukcy|kappa|rsquo|Kappa|nlarr|nlArr|TSHcy|rrarr|aogon|Aogon|fflig|xrarr|tshcy|ccirc|nleqq|filig|upsih|nless|dharl|nlsim|fjlig|ropar|nltri|dharr|robrk|roarr|fllig|fltns|roang|rnmid|subnE|subne|lAarr|trisb|Ccirc|acirc|ccups|blank|VDash|forkv|Vdash|langd|cedil|blk12|blk14|laquo|strns|diams|notin|vDash|larrb|blk34|block|disin|uplus|vdash|vBarv|aelig|starf|Wedge|check|xrArr|lates|lbarr|lBarr|notni|lbbrk|bcong|frasl|lbrke|frown|vrtri|vprop|vnsup|gamma|Gamma|wedge|xodot|bdquo|srarr|doteq|ldquo|boxdl|boxdL|gcirc|Gcirc|boxDl|boxDL|boxdr|boxdR|boxDr|TRADE|trade|rlhar|boxDR|vnsub|npart|vltri|rlarr|boxhd|boxhD|nprec|gescc|nrarr|nrArr|boxHd|boxHD|boxhu|boxhU|nrtri|boxHu|clubs|boxHU|times|colon|Colon|gimel|xlArr|Tilde|nsime|tilde|nsmid|nspar|THORN|thorn|xlarr|nsube|nsubE|thkap|xhArr|comma|nsucc|boxul|boxuL|nsupe|nsupE|gneqq|gnsim|boxUl|boxUL|grave|boxur|boxuR|boxUr|boxUR|lescc|angle|bepsi|boxvh|varpi|boxvH|numsp|Theta|gsime|gsiml|theta|boxVh|boxVH|boxvl|gtcir|gtdot|boxvL|boxVl|boxVL|crarr|cross|Cross|nvsim|boxvr|nwarr|nwArr|sqsup|dtdot|Uogon|lhard|lharu|dtrif|ocirc|Ocirc|lhblk|duarr|odash|sqsub|Hacek|sqcup|llarr|duhar|oelig|OElig|ofcir|boxvR|uogon|lltri|boxVr|csube|uuarr|ohbar|csupe|ctdot|olarr|olcir|harrw|oline|sqcap|omacr|Omacr|omega|Omega|boxVR|aleph|lneqq|lnsim|loang|loarr|rharu|lobrk|hcirc|operp|oplus|rhard|Hcirc|orarr|Union|order|ecirc|Ecirc|cuepr|szlig|cuesc|breve|reals|eDDot|Breve|hoarr|lopar|utrif|rdquo|Umacr|umacr|efDot|swArr|ultri|alpha|rceil|ovbar|swarr|Wcirc|wcirc|smtes|smile|bsemi|lrarr|aring|parsl|lrhar|bsime|uhblk|lrtri|cupor|Aring|uharr|uharl|slarr|rbrke|bsolb|lsime|rbbrk|RBarr|lsimg|phone|rBarr|rbarr|icirc|lsquo|Icirc|emacr|Emacr|ratio|simne|plusb|simlE|simgE|simeq|pluse|ltcir|ltdot|empty|xharr|xdtri|iexcl|Alpha|ltrie|rarrw|pound|ltrif|xcirc|bumpe|prcue|bumpE|asymp|amacr|cuvee|Sigma|sigma|iiint|udhar|iiota|ijlig|IJlig|supnE|imacr|Imacr|prime|Prime|image|prnap|eogon|Eogon|rarrc|mdash|mDDot|cuwed|imath|supne|imped|Amacr|udarr|prsim|micro|rarrb|cwint|raquo|infin|eplus|range|rangd|Ucirc|radic|minus|amalg|veeeq|rAarr|epsiv|ycirc|quest|sharp|quot|zwnj|Qscr|race|qscr|Qopf|qopf|qint|rang|Rang|Zscr|zscr|Zopf|zopf|rarr|rArr|Rarr|Pscr|pscr|prop|prod|prnE|prec|ZHcy|zhcy|prap|Zeta|zeta|Popf|popf|Zdot|plus|zdot|Yuml|yuml|phiv|YUcy|yucy|Yscr|yscr|perp|Yopf|yopf|part|para|YIcy|Ouml|rcub|yicy|YAcy|rdca|ouml|osol|Oscr|rdsh|yacy|real|oscr|xvee|andd|rect|andv|Xscr|oror|ordm|ordf|xscr|ange|aopf|Aopf|rHar|Xopf|opar|Oopf|xopf|xnis|rhov|oopf|omid|xmap|oint|apid|apos|ogon|ascr|Ascr|odot|odiv|xcup|xcap|ocir|oast|nvlt|nvle|nvgt|nvge|nvap|Wscr|wscr|auml|ntlg|ntgl|nsup|nsub|nsim|Nscr|nscr|nsce|Wopf|ring|npre|wopf|npar|Auml|Barv|bbrk|Nopf|nopf|nmid|nLtv|beta|ropf|Ropf|Beta|beth|nles|rpar|nleq|bnot|bNot|nldr|NJcy|rscr|Rscr|Vscr|vscr|rsqb|njcy|bopf|nisd|Bopf|rtri|Vopf|nGtv|ngtr|vopf|boxh|boxH|boxv|nges|ngeq|boxV|bscr|scap|Bscr|bsim|Vert|vert|bsol|bull|bump|caps|cdot|ncup|scnE|ncap|nbsp|napE|Cdot|cent|sdot|Vbar|nang|vBar|chcy|Mscr|mscr|sect|semi|CHcy|Mopf|mopf|sext|circ|cire|mldr|mlcp|cirE|comp|shcy|SHcy|vArr|varr|cong|copf|Copf|copy|COPY|malt|male|macr|lvnE|cscr|ltri|sime|ltcc|simg|Cscr|siml|csub|Uuml|lsqb|lsim|uuml|csup|Lscr|lscr|utri|smid|lpar|cups|smte|lozf|darr|Lopf|Uscr|solb|lopf|sopf|Sopf|lneq|uscr|spar|dArr|lnap|Darr|dash|Sqrt|LJcy|ljcy|lHar|dHar|Upsi|upsi|diam|lesg|djcy|DJcy|leqq|dopf|Dopf|dscr|Dscr|dscy|ldsh|ldca|squf|DScy|sscr|Sscr|dsol|lcub|late|star|Star|Uopf|Larr|lArr|larr|uopf|dtri|dzcy|sube|subE|Lang|lang|Kscr|kscr|Kopf|kopf|KJcy|kjcy|KHcy|khcy|DZcy|ecir|edot|eDot|Jscr|jscr|succ|Jopf|jopf|Edot|uHar|emsp|ensp|Iuml|iuml|eopf|isin|Iscr|iscr|Eopf|epar|sung|epsi|escr|sup1|sup2|sup3|Iota|iota|supe|supE|Iopf|iopf|IOcy|iocy|Escr|esim|Esim|imof|Uarr|QUOT|uArr|uarr|euml|IEcy|iecy|Idot|Euml|euro|excl|Hscr|hscr|Hopf|hopf|TScy|tscy|Tscr|hbar|tscr|flat|tbrk|fnof|hArr|harr|half|fopf|Fopf|tdot|gvnE|fork|trie|gtcc|fscr|Fscr|gdot|gsim|Gscr|gscr|Gopf|gopf|gneq|Gdot|tosa|gnap|Topf|topf|geqq|toea|GJcy|gjcy|tint|gesl|mid|Sfr|ggg|top|ges|gla|glE|glj|geq|gne|gEl|gel|gnE|Gcy|gcy|gap|Tfr|tfr|Tcy|tcy|Hat|Tau|Ffr|tau|Tab|hfr|Hfr|ffr|Fcy|fcy|icy|Icy|iff|ETH|eth|ifr|Ifr|Eta|eta|int|Int|Sup|sup|ucy|Ucy|Sum|sum|jcy|ENG|ufr|Ufr|eng|Jcy|jfr|els|ell|egs|Efr|efr|Jfr|uml|kcy|Kcy|Ecy|ecy|kfr|Kfr|lap|Sub|sub|lat|lcy|Lcy|leg|Dot|dot|lEg|leq|les|squ|div|die|lfr|Lfr|lgE|Dfr|dfr|Del|deg|Dcy|dcy|lne|lnE|sol|loz|smt|Cup|lrm|cup|lsh|Lsh|sim|shy|map|Map|mcy|Mcy|mfr|Mfr|mho|gfr|Gfr|sfr|cir|Chi|chi|nap|Cfr|vcy|Vcy|cfr|Scy|scy|ncy|Ncy|vee|Vee|Cap|cap|nfr|scE|sce|Nfr|nge|ngE|nGg|vfr|Vfr|ngt|bot|nGt|nis|niv|Rsh|rsh|nle|nlE|bne|Bfr|bfr|nLl|nlt|nLt|Bcy|bcy|not|Not|rlm|wfr|Wfr|npr|nsc|num|ocy|ast|Ocy|ofr|xfr|Xfr|Ofr|ogt|ohm|apE|olt|Rho|ape|rho|Rfr|rfr|ord|REG|ang|reg|orv|And|and|AMP|Rcy|amp|Afr|ycy|Ycy|yen|yfr|Yfr|rcy|par|pcy|Pcy|pfr|Pfr|phi|Phi|afr|Acy|acy|zcy|Zcy|piv|acE|acd|zfr|Zfr|pre|prE|psi|Psi|qfr|Qfr|zwj|Or|ge|Gg|gt|gg|el|oS|lt|Lt|LT|Re|lg|gl|eg|ne|Im|it|le|DD|wp|wr|nu|Nu|dd|lE|Sc|sc|pi|Pi|ee|af|ll|Ll|rx|gE|xi|pm|Xi|ic|pr|Pr|in|ni|mp|mu|ac|Mu|or|ap|Gt|GT|ii);|&(Aacute|Agrave|Atilde|Ccedil|Eacute|Egrave|Iacute|Igrave|Ntilde|Oacute|Ograve|Oslash|Otilde|Uacute|Ugrave|Yacute|aacute|agrave|atilde|brvbar|ccedil|curren|divide|eacute|egrave|frac12|frac14|frac34|iacute|igrave|iquest|middot|ntilde|oacute|ograve|oslash|otilde|plusmn|uacute|ugrave|yacute|AElig|Acirc|Aring|Ecirc|Icirc|Ocirc|THORN|Ucirc|acirc|acute|aelig|aring|cedil|ecirc|icirc|iexcl|laquo|micro|ocirc|pound|raquo|szlig|thorn|times|ucirc|Auml|COPY|Euml|Iuml|Ouml|QUOT|Uuml|auml|cent|copy|euml|iuml|macr|nbsp|ordf|ordm|ouml|para|quot|sect|sup1|sup2|sup3|uuml|yuml|AMP|ETH|REG|amp|deg|eth|not|reg|shy|uml|yen|GT|LT|gt|lt)(?!;)([=a-zA-Z0-9]?)|&#([0-9]+)(;?)|&#[xX]([a-fA-F0-9]+)(;?)|&([0-9a-zA-Z]+)/g;
    var h2 = {
        aacute: "á",
        Aacute: "Á",
        abreve: "ă",
        Abreve: "Ă",
        ac: "∾",
        acd: "∿",
        acE: "∾̳",
        acirc: "â",
        Acirc: "Â",
        acute: "´",
        acy: "а",
        Acy: "А",
        aelig: "æ",
        AElig: "Æ",
        af: "⁡",
        afr: "𝔞",
        Afr: "𝔄",
        agrave: "à",
        Agrave: "À",
        alefsym: "ℵ",
        aleph: "ℵ",
        alpha: "α",
        Alpha: "Α",
        amacr: "ā",
        Amacr: "Ā",
        amalg: "⨿",
        amp: "&",
        AMP: "&",
        and: "∧",
        And: "⩓",
        andand: "⩕",
        andd: "⩜",
        andslope: "⩘",
        andv: "⩚",
        ang: "∠",
        ange: "⦤",
        angle: "∠",
        angmsd: "∡",
        angmsdaa: "⦨",
        angmsdab: "⦩",
        angmsdac: "⦪",
        angmsdad: "⦫",
        angmsdae: "⦬",
        angmsdaf: "⦭",
        angmsdag: "⦮",
        angmsdah: "⦯",
        angrt: "∟",
        angrtvb: "⊾",
        angrtvbd: "⦝",
        angsph: "∢",
        angst: "Å",
        angzarr: "⍼",
        aogon: "ą",
        Aogon: "Ą",
        aopf: "𝕒",
        Aopf: "𝔸",
        ap: "≈",
        apacir: "⩯",
        ape: "≊",
        apE: "⩰",
        apid: "≋",
        apos: "'",
        ApplyFunction: "⁡",
        approx: "≈",
        approxeq: "≊",
        aring: "å",
        Aring: "Å",
        ascr: "𝒶",
        Ascr: "𝒜",
        Assign: "≔",
        ast: "*",
        asymp: "≈",
        asympeq: "≍",
        atilde: "ã",
        Atilde: "Ã",
        auml: "ä",
        Auml: "Ä",
        awconint: "∳",
        awint: "⨑",
        backcong: "≌",
        backepsilon: "϶",
        backprime: "‵",
        backsim: "∽",
        backsimeq: "⋍",
        Backslash: "∖",
        Barv: "⫧",
        barvee: "⊽",
        barwed: "⌅",
        Barwed: "⌆",
        barwedge: "⌅",
        bbrk: "⎵",
        bbrktbrk: "⎶",
        bcong: "≌",
        bcy: "б",
        Bcy: "Б",
        bdquo: "„",
        becaus: "∵",
        because: "∵",
        Because: "∵",
        bemptyv: "⦰",
        bepsi: "϶",
        bernou: "ℬ",
        Bernoullis: "ℬ",
        beta: "β",
        Beta: "Β",
        beth: "ℶ",
        between: "≬",
        bfr: "𝔟",
        Bfr: "𝔅",
        bigcap: "⋂",
        bigcirc: "◯",
        bigcup: "⋃",
        bigodot: "⨀",
        bigoplus: "⨁",
        bigotimes: "⨂",
        bigsqcup: "⨆",
        bigstar: "★",
        bigtriangledown: "▽",
        bigtriangleup: "△",
        biguplus: "⨄",
        bigvee: "⋁",
        bigwedge: "⋀",
        bkarow: "⤍",
        blacklozenge: "⧫",
        blacksquare: "▪",
        blacktriangle: "▴",
        blacktriangledown: "▾",
        blacktriangleleft: "◂",
        blacktriangleright: "▸",
        blank: "␣",
        blk12: "▒",
        blk14: "░",
        blk34: "▓",
        block: "█",
        bne: "=⃥",
        bnequiv: "≡⃥",
        bnot: "⌐",
        bNot: "⫭",
        bopf: "𝕓",
        Bopf: "𝔹",
        bot: "⊥",
        bottom: "⊥",
        bowtie: "⋈",
        boxbox: "⧉",
        boxdl: "┐",
        boxdL: "╕",
        boxDl: "╖",
        boxDL: "╗",
        boxdr: "┌",
        boxdR: "╒",
        boxDr: "╓",
        boxDR: "╔",
        boxh: "─",
        boxH: "═",
        boxhd: "┬",
        boxhD: "╥",
        boxHd: "╤",
        boxHD: "╦",
        boxhu: "┴",
        boxhU: "╨",
        boxHu: "╧",
        boxHU: "╩",
        boxminus: "⊟",
        boxplus: "⊞",
        boxtimes: "⊠",
        boxul: "┘",
        boxuL: "╛",
        boxUl: "╜",
        boxUL: "╝",
        boxur: "└",
        boxuR: "╘",
        boxUr: "╙",
        boxUR: "╚",
        boxv: "│",
        boxV: "║",
        boxvh: "┼",
        boxvH: "╪",
        boxVh: "╫",
        boxVH: "╬",
        boxvl: "┤",
        boxvL: "╡",
        boxVl: "╢",
        boxVL: "╣",
        boxvr: "├",
        boxvR: "╞",
        boxVr: "╟",
        boxVR: "╠",
        bprime: "‵",
        breve: "˘",
        Breve: "˘",
        brvbar: "¦",
        bscr: "𝒷",
        Bscr: "ℬ",
        bsemi: "⁏",
        bsim: "∽",
        bsime: "⋍",
        bsol: "\\",
        bsolb: "⧅",
        bsolhsub: "⟈",
        bull: "•",
        bullet: "•",
        bump: "≎",
        bumpe: "≏",
        bumpE: "⪮",
        bumpeq: "≏",
        Bumpeq: "≎",
        cacute: "ć",
        Cacute: "Ć",
        cap: "∩",
        Cap: "⋒",
        capand: "⩄",
        capbrcup: "⩉",
        capcap: "⩋",
        capcup: "⩇",
        capdot: "⩀",
        CapitalDifferentialD: "ⅅ",
        caps: "∩︀",
        caret: "⁁",
        caron: "ˇ",
        Cayleys: "ℭ",
        ccaps: "⩍",
        ccaron: "č",
        Ccaron: "Č",
        ccedil: "ç",
        Ccedil: "Ç",
        ccirc: "ĉ",
        Ccirc: "Ĉ",
        Cconint: "∰",
        ccups: "⩌",
        ccupssm: "⩐",
        cdot: "ċ",
        Cdot: "Ċ",
        cedil: "¸",
        Cedilla: "¸",
        cemptyv: "⦲",
        cent: "¢",
        centerdot: "·",
        CenterDot: "·",
        cfr: "𝔠",
        Cfr: "ℭ",
        chcy: "ч",
        CHcy: "Ч",
        check: "✓",
        checkmark: "✓",
        chi: "χ",
        Chi: "Χ",
        cir: "○",
        circ: "ˆ",
        circeq: "≗",
        circlearrowleft: "↺",
        circlearrowright: "↻",
        circledast: "⊛",
        circledcirc: "⊚",
        circleddash: "⊝",
        CircleDot: "⊙",
        circledR: "®",
        circledS: "Ⓢ",
        CircleMinus: "⊖",
        CirclePlus: "⊕",
        CircleTimes: "⊗",
        cire: "≗",
        cirE: "⧃",
        cirfnint: "⨐",
        cirmid: "⫯",
        cirscir: "⧂",
        ClockwiseContourIntegral: "∲",
        CloseCurlyDoubleQuote: "”",
        CloseCurlyQuote: "’",
        clubs: "♣",
        clubsuit: "♣",
        colon: ":",
        Colon: "∷",
        colone: "≔",
        Colone: "⩴",
        coloneq: "≔",
        comma: ",",
        commat: "@",
        comp: "∁",
        compfn: "∘",
        complement: "∁",
        complexes: "ℂ",
        cong: "≅",
        congdot: "⩭",
        Congruent: "≡",
        conint: "∮",
        Conint: "∯",
        ContourIntegral: "∮",
        copf: "𝕔",
        Copf: "ℂ",
        coprod: "∐",
        Coproduct: "∐",
        copy: "©",
        COPY: "©",
        copysr: "℗",
        CounterClockwiseContourIntegral: "∳",
        crarr: "↵",
        cross: "✗",
        Cross: "⨯",
        cscr: "𝒸",
        Cscr: "𝒞",
        csub: "⫏",
        csube: "⫑",
        csup: "⫐",
        csupe: "⫒",
        ctdot: "⋯",
        cudarrl: "⤸",
        cudarrr: "⤵",
        cuepr: "⋞",
        cuesc: "⋟",
        cularr: "↶",
        cularrp: "⤽",
        cup: "∪",
        Cup: "⋓",
        cupbrcap: "⩈",
        cupcap: "⩆",
        CupCap: "≍",
        cupcup: "⩊",
        cupdot: "⊍",
        cupor: "⩅",
        cups: "∪︀",
        curarr: "↷",
        curarrm: "⤼",
        curlyeqprec: "⋞",
        curlyeqsucc: "⋟",
        curlyvee: "⋎",
        curlywedge: "⋏",
        curren: "¤",
        curvearrowleft: "↶",
        curvearrowright: "↷",
        cuvee: "⋎",
        cuwed: "⋏",
        cwconint: "∲",
        cwint: "∱",
        cylcty: "⌭",
        dagger: "†",
        Dagger: "‡",
        daleth: "ℸ",
        darr: "↓",
        dArr: "⇓",
        Darr: "↡",
        dash: "‐",
        dashv: "⊣",
        Dashv: "⫤",
        dbkarow: "⤏",
        dblac: "˝",
        dcaron: "ď",
        Dcaron: "Ď",
        dcy: "д",
        Dcy: "Д",
        dd: "ⅆ",
        DD: "ⅅ",
        ddagger: "‡",
        ddarr: "⇊",
        DDotrahd: "⤑",
        ddotseq: "⩷",
        deg: "°",
        Del: "∇",
        delta: "δ",
        Delta: "Δ",
        demptyv: "⦱",
        dfisht: "⥿",
        dfr: "𝔡",
        Dfr: "𝔇",
        dHar: "⥥",
        dharl: "⇃",
        dharr: "⇂",
        DiacriticalAcute: "´",
        DiacriticalDot: "˙",
        DiacriticalDoubleAcute: "˝",
        DiacriticalGrave: "`",
        DiacriticalTilde: "˜",
        diam: "⋄",
        diamond: "⋄",
        Diamond: "⋄",
        diamondsuit: "♦",
        diams: "♦",
        die: "¨",
        DifferentialD: "ⅆ",
        digamma: "ϝ",
        disin: "⋲",
        div: "÷",
        divide: "÷",
        divideontimes: "⋇",
        divonx: "⋇",
        djcy: "ђ",
        DJcy: "Ђ",
        dlcorn: "⌞",
        dlcrop: "⌍",
        dollar: "$",
        dopf: "𝕕",
        Dopf: "𝔻",
        dot: "˙",
        Dot: "¨",
        DotDot: "⃜",
        doteq: "≐",
        doteqdot: "≑",
        DotEqual: "≐",
        dotminus: "∸",
        dotplus: "∔",
        dotsquare: "⊡",
        doublebarwedge: "⌆",
        DoubleContourIntegral: "∯",
        DoubleDot: "¨",
        DoubleDownArrow: "⇓",
        DoubleLeftArrow: "⇐",
        DoubleLeftRightArrow: "⇔",
        DoubleLeftTee: "⫤",
        DoubleLongLeftArrow: "⟸",
        DoubleLongLeftRightArrow: "⟺",
        DoubleLongRightArrow: "⟹",
        DoubleRightArrow: "⇒",
        DoubleRightTee: "⊨",
        DoubleUpArrow: "⇑",
        DoubleUpDownArrow: "⇕",
        DoubleVerticalBar: "∥",
        downarrow: "↓",
        Downarrow: "⇓",
        DownArrow: "↓",
        DownArrowBar: "⤓",
        DownArrowUpArrow: "⇵",
        DownBreve: "̑",
        downdownarrows: "⇊",
        downharpoonleft: "⇃",
        downharpoonright: "⇂",
        DownLeftRightVector: "⥐",
        DownLeftTeeVector: "⥞",
        DownLeftVector: "↽",
        DownLeftVectorBar: "⥖",
        DownRightTeeVector: "⥟",
        DownRightVector: "⇁",
        DownRightVectorBar: "⥗",
        DownTee: "⊤",
        DownTeeArrow: "↧",
        drbkarow: "⤐",
        drcorn: "⌟",
        drcrop: "⌌",
        dscr: "𝒹",
        Dscr: "𝒟",
        dscy: "ѕ",
        DScy: "Ѕ",
        dsol: "⧶",
        dstrok: "đ",
        Dstrok: "Đ",
        dtdot: "⋱",
        dtri: "▿",
        dtrif: "▾",
        duarr: "⇵",
        duhar: "⥯",
        dwangle: "⦦",
        dzcy: "џ",
        DZcy: "Џ",
        dzigrarr: "⟿",
        eacute: "é",
        Eacute: "É",
        easter: "⩮",
        ecaron: "ě",
        Ecaron: "Ě",
        ecir: "≖",
        ecirc: "ê",
        Ecirc: "Ê",
        ecolon: "≕",
        ecy: "э",
        Ecy: "Э",
        eDDot: "⩷",
        edot: "ė",
        eDot: "≑",
        Edot: "Ė",
        ee: "ⅇ",
        efDot: "≒",
        efr: "𝔢",
        Efr: "𝔈",
        eg: "⪚",
        egrave: "è",
        Egrave: "È",
        egs: "⪖",
        egsdot: "⪘",
        el: "⪙",
        Element: "∈",
        elinters: "⏧",
        ell: "ℓ",
        els: "⪕",
        elsdot: "⪗",
        emacr: "ē",
        Emacr: "Ē",
        empty: "∅",
        emptyset: "∅",
        EmptySmallSquare: "◻",
        emptyv: "∅",
        EmptyVerySmallSquare: "▫",
        emsp: " ",
        emsp13: " ",
        emsp14: " ",
        eng: "ŋ",
        ENG: "Ŋ",
        ensp: " ",
        eogon: "ę",
        Eogon: "Ę",
        eopf: "𝕖",
        Eopf: "𝔼",
        epar: "⋕",
        eparsl: "⧣",
        eplus: "⩱",
        epsi: "ε",
        epsilon: "ε",
        Epsilon: "Ε",
        epsiv: "ϵ",
        eqcirc: "≖",
        eqcolon: "≕",
        eqsim: "≂",
        eqslantgtr: "⪖",
        eqslantless: "⪕",
        Equal: "⩵",
        equals: "=",
        EqualTilde: "≂",
        equest: "≟",
        Equilibrium: "⇌",
        equiv: "≡",
        equivDD: "⩸",
        eqvparsl: "⧥",
        erarr: "⥱",
        erDot: "≓",
        escr: "ℯ",
        Escr: "ℰ",
        esdot: "≐",
        esim: "≂",
        Esim: "⩳",
        eta: "η",
        Eta: "Η",
        eth: "ð",
        ETH: "Ð",
        euml: "ë",
        Euml: "Ë",
        euro: "€",
        excl: "!",
        exist: "∃",
        Exists: "∃",
        expectation: "ℰ",
        exponentiale: "ⅇ",
        ExponentialE: "ⅇ",
        fallingdotseq: "≒",
        fcy: "ф",
        Fcy: "Ф",
        female: "♀",
        ffilig: "ﬃ",
        fflig: "ﬀ",
        ffllig: "ﬄ",
        ffr: "𝔣",
        Ffr: "𝔉",
        filig: "ﬁ",
        FilledSmallSquare: "◼",
        FilledVerySmallSquare: "▪",
        fjlig: "fj",
        flat: "♭",
        fllig: "ﬂ",
        fltns: "▱",
        fnof: "ƒ",
        fopf: "𝕗",
        Fopf: "𝔽",
        forall: "∀",
        ForAll: "∀",
        fork: "⋔",
        forkv: "⫙",
        Fouriertrf: "ℱ",
        fpartint: "⨍",
        frac12: "½",
        frac13: "⅓",
        frac14: "¼",
        frac15: "⅕",
        frac16: "⅙",
        frac18: "⅛",
        frac23: "⅔",
        frac25: "⅖",
        frac34: "¾",
        frac35: "⅗",
        frac38: "⅜",
        frac45: "⅘",
        frac56: "⅚",
        frac58: "⅝",
        frac78: "⅞",
        frasl: "⁄",
        frown: "⌢",
        fscr: "𝒻",
        Fscr: "ℱ",
        gacute: "ǵ",
        gamma: "γ",
        Gamma: "Γ",
        gammad: "ϝ",
        Gammad: "Ϝ",
        gap: "⪆",
        gbreve: "ğ",
        Gbreve: "Ğ",
        Gcedil: "Ģ",
        gcirc: "ĝ",
        Gcirc: "Ĝ",
        gcy: "г",
        Gcy: "Г",
        gdot: "ġ",
        Gdot: "Ġ",
        ge: "≥",
        gE: "≧",
        gel: "⋛",
        gEl: "⪌",
        geq: "≥",
        geqq: "≧",
        geqslant: "⩾",
        ges: "⩾",
        gescc: "⪩",
        gesdot: "⪀",
        gesdoto: "⪂",
        gesdotol: "⪄",
        gesl: "⋛︀",
        gesles: "⪔",
        gfr: "𝔤",
        Gfr: "𝔊",
        gg: "≫",
        Gg: "⋙",
        ggg: "⋙",
        gimel: "ℷ",
        gjcy: "ѓ",
        GJcy: "Ѓ",
        gl: "≷",
        gla: "⪥",
        glE: "⪒",
        glj: "⪤",
        gnap: "⪊",
        gnapprox: "⪊",
        gne: "⪈",
        gnE: "≩",
        gneq: "⪈",
        gneqq: "≩",
        gnsim: "⋧",
        gopf: "𝕘",
        Gopf: "𝔾",
        grave: "`",
        GreaterEqual: "≥",
        GreaterEqualLess: "⋛",
        GreaterFullEqual: "≧",
        GreaterGreater: "⪢",
        GreaterLess: "≷",
        GreaterSlantEqual: "⩾",
        GreaterTilde: "≳",
        gscr: "ℊ",
        Gscr: "𝒢",
        gsim: "≳",
        gsime: "⪎",
        gsiml: "⪐",
        gt: ">",
        Gt: "≫",
        GT: ">",
        gtcc: "⪧",
        gtcir: "⩺",
        gtdot: "⋗",
        gtlPar: "⦕",
        gtquest: "⩼",
        gtrapprox: "⪆",
        gtrarr: "⥸",
        gtrdot: "⋗",
        gtreqless: "⋛",
        gtreqqless: "⪌",
        gtrless: "≷",
        gtrsim: "≳",
        gvertneqq: "≩︀",
        gvnE: "≩︀",
        Hacek: "ˇ",
        hairsp: " ",
        half: "½",
        hamilt: "ℋ",
        hardcy: "ъ",
        HARDcy: "Ъ",
        harr: "↔",
        hArr: "⇔",
        harrcir: "⥈",
        harrw: "↭",
        Hat: "^",
        hbar: "ℏ",
        hcirc: "ĥ",
        Hcirc: "Ĥ",
        hearts: "♥",
        heartsuit: "♥",
        hellip: "…",
        hercon: "⊹",
        hfr: "𝔥",
        Hfr: "ℌ",
        HilbertSpace: "ℋ",
        hksearow: "⤥",
        hkswarow: "⤦",
        hoarr: "⇿",
        homtht: "∻",
        hookleftarrow: "↩",
        hookrightarrow: "↪",
        hopf: "𝕙",
        Hopf: "ℍ",
        horbar: "―",
        HorizontalLine: "─",
        hscr: "𝒽",
        Hscr: "ℋ",
        hslash: "ℏ",
        hstrok: "ħ",
        Hstrok: "Ħ",
        HumpDownHump: "≎",
        HumpEqual: "≏",
        hybull: "⁃",
        hyphen: "‐",
        iacute: "í",
        Iacute: "Í",
        ic: "⁣",
        icirc: "î",
        Icirc: "Î",
        icy: "и",
        Icy: "И",
        Idot: "İ",
        iecy: "е",
        IEcy: "Е",
        iexcl: "¡",
        iff: "⇔",
        ifr: "𝔦",
        Ifr: "ℑ",
        igrave: "ì",
        Igrave: "Ì",
        ii: "ⅈ",
        iiiint: "⨌",
        iiint: "∭",
        iinfin: "⧜",
        iiota: "℩",
        ijlig: "ĳ",
        IJlig: "Ĳ",
        Im: "ℑ",
        imacr: "ī",
        Imacr: "Ī",
        image: "ℑ",
        ImaginaryI: "ⅈ",
        imagline: "ℐ",
        imagpart: "ℑ",
        imath: "ı",
        imof: "⊷",
        imped: "Ƶ",
        Implies: "⇒",
        in: "∈",
        incare: "℅",
        infin: "∞",
        infintie: "⧝",
        inodot: "ı",
        int: "∫",
        Int: "∬",
        intcal: "⊺",
        integers: "ℤ",
        Integral: "∫",
        intercal: "⊺",
        Intersection: "⋂",
        intlarhk: "⨗",
        intprod: "⨼",
        InvisibleComma: "⁣",
        InvisibleTimes: "⁢",
        iocy: "ё",
        IOcy: "Ё",
        iogon: "į",
        Iogon: "Į",
        iopf: "𝕚",
        Iopf: "𝕀",
        iota: "ι",
        Iota: "Ι",
        iprod: "⨼",
        iquest: "¿",
        iscr: "𝒾",
        Iscr: "ℐ",
        isin: "∈",
        isindot: "⋵",
        isinE: "⋹",
        isins: "⋴",
        isinsv: "⋳",
        isinv: "∈",
        it: "⁢",
        itilde: "ĩ",
        Itilde: "Ĩ",
        iukcy: "і",
        Iukcy: "І",
        iuml: "ï",
        Iuml: "Ï",
        jcirc: "ĵ",
        Jcirc: "Ĵ",
        jcy: "й",
        Jcy: "Й",
        jfr: "𝔧",
        Jfr: "𝔍",
        jmath: "ȷ",
        jopf: "𝕛",
        Jopf: "𝕁",
        jscr: "𝒿",
        Jscr: "𝒥",
        jsercy: "ј",
        Jsercy: "Ј",
        jukcy: "є",
        Jukcy: "Є",
        kappa: "κ",
        Kappa: "Κ",
        kappav: "ϰ",
        kcedil: "ķ",
        Kcedil: "Ķ",
        kcy: "к",
        Kcy: "К",
        kfr: "𝔨",
        Kfr: "𝔎",
        kgreen: "ĸ",
        khcy: "х",
        KHcy: "Х",
        kjcy: "ќ",
        KJcy: "Ќ",
        kopf: "𝕜",
        Kopf: "𝕂",
        kscr: "𝓀",
        Kscr: "𝒦",
        lAarr: "⇚",
        lacute: "ĺ",
        Lacute: "Ĺ",
        laemptyv: "⦴",
        lagran: "ℒ",
        lambda: "λ",
        Lambda: "Λ",
        lang: "⟨",
        Lang: "⟪",
        langd: "⦑",
        langle: "⟨",
        lap: "⪅",
        Laplacetrf: "ℒ",
        laquo: "«",
        larr: "←",
        lArr: "⇐",
        Larr: "↞",
        larrb: "⇤",
        larrbfs: "⤟",
        larrfs: "⤝",
        larrhk: "↩",
        larrlp: "↫",
        larrpl: "⤹",
        larrsim: "⥳",
        larrtl: "↢",
        lat: "⪫",
        latail: "⤙",
        lAtail: "⤛",
        late: "⪭",
        lates: "⪭︀",
        lbarr: "⤌",
        lBarr: "⤎",
        lbbrk: "❲",
        lbrace: "{",
        lbrack: "[",
        lbrke: "⦋",
        lbrksld: "⦏",
        lbrkslu: "⦍",
        lcaron: "ľ",
        Lcaron: "Ľ",
        lcedil: "ļ",
        Lcedil: "Ļ",
        lceil: "⌈",
        lcub: "{",
        lcy: "л",
        Lcy: "Л",
        ldca: "⤶",
        ldquo: "“",
        ldquor: "„",
        ldrdhar: "⥧",
        ldrushar: "⥋",
        ldsh: "↲",
        le: "≤",
        lE: "≦",
        LeftAngleBracket: "⟨",
        leftarrow: "←",
        Leftarrow: "⇐",
        LeftArrow: "←",
        LeftArrowBar: "⇤",
        LeftArrowRightArrow: "⇆",
        leftarrowtail: "↢",
        LeftCeiling: "⌈",
        LeftDoubleBracket: "⟦",
        LeftDownTeeVector: "⥡",
        LeftDownVector: "⇃",
        LeftDownVectorBar: "⥙",
        LeftFloor: "⌊",
        leftharpoondown: "↽",
        leftharpoonup: "↼",
        leftleftarrows: "⇇",
        leftrightarrow: "↔",
        Leftrightarrow: "⇔",
        LeftRightArrow: "↔",
        leftrightarrows: "⇆",
        leftrightharpoons: "⇋",
        leftrightsquigarrow: "↭",
        LeftRightVector: "⥎",
        LeftTee: "⊣",
        LeftTeeArrow: "↤",
        LeftTeeVector: "⥚",
        leftthreetimes: "⋋",
        LeftTriangle: "⊲",
        LeftTriangleBar: "⧏",
        LeftTriangleEqual: "⊴",
        LeftUpDownVector: "⥑",
        LeftUpTeeVector: "⥠",
        LeftUpVector: "↿",
        LeftUpVectorBar: "⥘",
        LeftVector: "↼",
        LeftVectorBar: "⥒",
        leg: "⋚",
        lEg: "⪋",
        leq: "≤",
        leqq: "≦",
        leqslant: "⩽",
        les: "⩽",
        lescc: "⪨",
        lesdot: "⩿",
        lesdoto: "⪁",
        lesdotor: "⪃",
        lesg: "⋚︀",
        lesges: "⪓",
        lessapprox: "⪅",
        lessdot: "⋖",
        lesseqgtr: "⋚",
        lesseqqgtr: "⪋",
        LessEqualGreater: "⋚",
        LessFullEqual: "≦",
        LessGreater: "≶",
        lessgtr: "≶",
        LessLess: "⪡",
        lesssim: "≲",
        LessSlantEqual: "⩽",
        LessTilde: "≲",
        lfisht: "⥼",
        lfloor: "⌊",
        lfr: "𝔩",
        Lfr: "𝔏",
        lg: "≶",
        lgE: "⪑",
        lHar: "⥢",
        lhard: "↽",
        lharu: "↼",
        lharul: "⥪",
        lhblk: "▄",
        ljcy: "љ",
        LJcy: "Љ",
        ll: "≪",
        Ll: "⋘",
        llarr: "⇇",
        llcorner: "⌞",
        Lleftarrow: "⇚",
        llhard: "⥫",
        lltri: "◺",
        lmidot: "ŀ",
        Lmidot: "Ŀ",
        lmoust: "⎰",
        lmoustache: "⎰",
        lnap: "⪉",
        lnapprox: "⪉",
        lne: "⪇",
        lnE: "≨",
        lneq: "⪇",
        lneqq: "≨",
        lnsim: "⋦",
        loang: "⟬",
        loarr: "⇽",
        lobrk: "⟦",
        longleftarrow: "⟵",
        Longleftarrow: "⟸",
        LongLeftArrow: "⟵",
        longleftrightarrow: "⟷",
        Longleftrightarrow: "⟺",
        LongLeftRightArrow: "⟷",
        longmapsto: "⟼",
        longrightarrow: "⟶",
        Longrightarrow: "⟹",
        LongRightArrow: "⟶",
        looparrowleft: "↫",
        looparrowright: "↬",
        lopar: "⦅",
        lopf: "𝕝",
        Lopf: "𝕃",
        loplus: "⨭",
        lotimes: "⨴",
        lowast: "∗",
        lowbar: "_",
        LowerLeftArrow: "↙",
        LowerRightArrow: "↘",
        loz: "◊",
        lozenge: "◊",
        lozf: "⧫",
        lpar: "(",
        lparlt: "⦓",
        lrarr: "⇆",
        lrcorner: "⌟",
        lrhar: "⇋",
        lrhard: "⥭",
        lrm: "‎",
        lrtri: "⊿",
        lsaquo: "‹",
        lscr: "𝓁",
        Lscr: "ℒ",
        lsh: "↰",
        Lsh: "↰",
        lsim: "≲",
        lsime: "⪍",
        lsimg: "⪏",
        lsqb: "[",
        lsquo: "‘",
        lsquor: "‚",
        lstrok: "ł",
        Lstrok: "Ł",
        lt: "<",
        Lt: "≪",
        LT: "<",
        ltcc: "⪦",
        ltcir: "⩹",
        ltdot: "⋖",
        lthree: "⋋",
        ltimes: "⋉",
        ltlarr: "⥶",
        ltquest: "⩻",
        ltri: "◃",
        ltrie: "⊴",
        ltrif: "◂",
        ltrPar: "⦖",
        lurdshar: "⥊",
        luruhar: "⥦",
        lvertneqq: "≨︀",
        lvnE: "≨︀",
        macr: "¯",
        male: "♂",
        malt: "✠",
        maltese: "✠",
        map: "↦",
        Map: "⤅",
        mapsto: "↦",
        mapstodown: "↧",
        mapstoleft: "↤",
        mapstoup: "↥",
        marker: "▮",
        mcomma: "⨩",
        mcy: "м",
        Mcy: "М",
        mdash: "—",
        mDDot: "∺",
        measuredangle: "∡",
        MediumSpace: " ",
        Mellintrf: "ℳ",
        mfr: "𝔪",
        Mfr: "𝔐",
        mho: "℧",
        micro: "µ",
        mid: "∣",
        midast: "*",
        midcir: "⫰",
        middot: "·",
        minus: "−",
        minusb: "⊟",
        minusd: "∸",
        minusdu: "⨪",
        MinusPlus: "∓",
        mlcp: "⫛",
        mldr: "…",
        mnplus: "∓",
        models: "⊧",
        mopf: "𝕞",
        Mopf: "𝕄",
        mp: "∓",
        mscr: "𝓂",
        Mscr: "ℳ",
        mstpos: "∾",
        mu: "μ",
        Mu: "Μ",
        multimap: "⊸",
        mumap: "⊸",
        nabla: "∇",
        nacute: "ń",
        Nacute: "Ń",
        nang: "∠⃒",
        nap: "≉",
        napE: "⩰̸",
        napid: "≋̸",
        napos: "ŉ",
        napprox: "≉",
        natur: "♮",
        natural: "♮",
        naturals: "ℕ",
        nbsp: " ",
        nbump: "≎̸",
        nbumpe: "≏̸",
        ncap: "⩃",
        ncaron: "ň",
        Ncaron: "Ň",
        ncedil: "ņ",
        Ncedil: "Ņ",
        ncong: "≇",
        ncongdot: "⩭̸",
        ncup: "⩂",
        ncy: "н",
        Ncy: "Н",
        ndash: "–",
        ne: "≠",
        nearhk: "⤤",
        nearr: "↗",
        neArr: "⇗",
        nearrow: "↗",
        nedot: "≐̸",
        NegativeMediumSpace: "​",
        NegativeThickSpace: "​",
        NegativeThinSpace: "​",
        NegativeVeryThinSpace: "​",
        nequiv: "≢",
        nesear: "⤨",
        nesim: "≂̸",
        NestedGreaterGreater: "≫",
        NestedLessLess: "≪",
        NewLine: "\n",
        nexist: "∄",
        nexists: "∄",
        nfr: "𝔫",
        Nfr: "𝔑",
        nge: "≱",
        ngE: "≧̸",
        ngeq: "≱",
        ngeqq: "≧̸",
        ngeqslant: "⩾̸",
        nges: "⩾̸",
        nGg: "⋙̸",
        ngsim: "≵",
        ngt: "≯",
        nGt: "≫⃒",
        ngtr: "≯",
        nGtv: "≫̸",
        nharr: "↮",
        nhArr: "⇎",
        nhpar: "⫲",
        ni: "∋",
        nis: "⋼",
        nisd: "⋺",
        niv: "∋",
        njcy: "њ",
        NJcy: "Њ",
        nlarr: "↚",
        nlArr: "⇍",
        nldr: "‥",
        nle: "≰",
        nlE: "≦̸",
        nleftarrow: "↚",
        nLeftarrow: "⇍",
        nleftrightarrow: "↮",
        nLeftrightarrow: "⇎",
        nleq: "≰",
        nleqq: "≦̸",
        nleqslant: "⩽̸",
        nles: "⩽̸",
        nless: "≮",
        nLl: "⋘̸",
        nlsim: "≴",
        nlt: "≮",
        nLt: "≪⃒",
        nltri: "⋪",
        nltrie: "⋬",
        nLtv: "≪̸",
        nmid: "∤",
        NoBreak: "⁠",
        NonBreakingSpace: " ",
        nopf: "𝕟",
        Nopf: "ℕ",
        not: "¬",
        Not: "⫬",
        NotCongruent: "≢",
        NotCupCap: "≭",
        NotDoubleVerticalBar: "∦",
        NotElement: "∉",
        NotEqual: "≠",
        NotEqualTilde: "≂̸",
        NotExists: "∄",
        NotGreater: "≯",
        NotGreaterEqual: "≱",
        NotGreaterFullEqual: "≧̸",
        NotGreaterGreater: "≫̸",
        NotGreaterLess: "≹",
        NotGreaterSlantEqual: "⩾̸",
        NotGreaterTilde: "≵",
        NotHumpDownHump: "≎̸",
        NotHumpEqual: "≏̸",
        notin: "∉",
        notindot: "⋵̸",
        notinE: "⋹̸",
        notinva: "∉",
        notinvb: "⋷",
        notinvc: "⋶",
        NotLeftTriangle: "⋪",
        NotLeftTriangleBar: "⧏̸",
        NotLeftTriangleEqual: "⋬",
        NotLess: "≮",
        NotLessEqual: "≰",
        NotLessGreater: "≸",
        NotLessLess: "≪̸",
        NotLessSlantEqual: "⩽̸",
        NotLessTilde: "≴",
        NotNestedGreaterGreater: "⪢̸",
        NotNestedLessLess: "⪡̸",
        notni: "∌",
        notniva: "∌",
        notnivb: "⋾",
        notnivc: "⋽",
        NotPrecedes: "⊀",
        NotPrecedesEqual: "⪯̸",
        NotPrecedesSlantEqual: "⋠",
        NotReverseElement: "∌",
        NotRightTriangle: "⋫",
        NotRightTriangleBar: "⧐̸",
        NotRightTriangleEqual: "⋭",
        NotSquareSubset: "⊏̸",
        NotSquareSubsetEqual: "⋢",
        NotSquareSuperset: "⊐̸",
        NotSquareSupersetEqual: "⋣",
        NotSubset: "⊂⃒",
        NotSubsetEqual: "⊈",
        NotSucceeds: "⊁",
        NotSucceedsEqual: "⪰̸",
        NotSucceedsSlantEqual: "⋡",
        NotSucceedsTilde: "≿̸",
        NotSuperset: "⊃⃒",
        NotSupersetEqual: "⊉",
        NotTilde: "≁",
        NotTildeEqual: "≄",
        NotTildeFullEqual: "≇",
        NotTildeTilde: "≉",
        NotVerticalBar: "∤",
        npar: "∦",
        nparallel: "∦",
        nparsl: "⫽⃥",
        npart: "∂̸",
        npolint: "⨔",
        npr: "⊀",
        nprcue: "⋠",
        npre: "⪯̸",
        nprec: "⊀",
        npreceq: "⪯̸",
        nrarr: "↛",
        nrArr: "⇏",
        nrarrc: "⤳̸",
        nrarrw: "↝̸",
        nrightarrow: "↛",
        nRightarrow: "⇏",
        nrtri: "⋫",
        nrtrie: "⋭",
        nsc: "⊁",
        nsccue: "⋡",
        nsce: "⪰̸",
        nscr: "𝓃",
        Nscr: "𝒩",
        nshortmid: "∤",
        nshortparallel: "∦",
        nsim: "≁",
        nsime: "≄",
        nsimeq: "≄",
        nsmid: "∤",
        nspar: "∦",
        nsqsube: "⋢",
        nsqsupe: "⋣",
        nsub: "⊄",
        nsube: "⊈",
        nsubE: "⫅̸",
        nsubset: "⊂⃒",
        nsubseteq: "⊈",
        nsubseteqq: "⫅̸",
        nsucc: "⊁",
        nsucceq: "⪰̸",
        nsup: "⊅",
        nsupe: "⊉",
        nsupE: "⫆̸",
        nsupset: "⊃⃒",
        nsupseteq: "⊉",
        nsupseteqq: "⫆̸",
        ntgl: "≹",
        ntilde: "ñ",
        Ntilde: "Ñ",
        ntlg: "≸",
        ntriangleleft: "⋪",
        ntrianglelefteq: "⋬",
        ntriangleright: "⋫",
        ntrianglerighteq: "⋭",
        nu: "ν",
        Nu: "Ν",
        num: "#",
        numero: "№",
        numsp: " ",
        nvap: "≍⃒",
        nvdash: "⊬",
        nvDash: "⊭",
        nVdash: "⊮",
        nVDash: "⊯",
        nvge: "≥⃒",
        nvgt: ">⃒",
        nvHarr: "⤄",
        nvinfin: "⧞",
        nvlArr: "⤂",
        nvle: "≤⃒",
        nvlt: "<⃒",
        nvltrie: "⊴⃒",
        nvrArr: "⤃",
        nvrtrie: "⊵⃒",
        nvsim: "∼⃒",
        nwarhk: "⤣",
        nwarr: "↖",
        nwArr: "⇖",
        nwarrow: "↖",
        nwnear: "⤧",
        oacute: "ó",
        Oacute: "Ó",
        oast: "⊛",
        ocir: "⊚",
        ocirc: "ô",
        Ocirc: "Ô",
        ocy: "о",
        Ocy: "О",
        odash: "⊝",
        odblac: "ő",
        Odblac: "Ő",
        odiv: "⨸",
        odot: "⊙",
        odsold: "⦼",
        oelig: "œ",
        OElig: "Œ",
        ofcir: "⦿",
        ofr: "𝔬",
        Ofr: "𝔒",
        ogon: "˛",
        ograve: "ò",
        Ograve: "Ò",
        ogt: "⧁",
        ohbar: "⦵",
        ohm: "Ω",
        oint: "∮",
        olarr: "↺",
        olcir: "⦾",
        olcross: "⦻",
        oline: "‾",
        olt: "⧀",
        omacr: "ō",
        Omacr: "Ō",
        omega: "ω",
        Omega: "Ω",
        omicron: "ο",
        Omicron: "Ο",
        omid: "⦶",
        ominus: "⊖",
        oopf: "𝕠",
        Oopf: "𝕆",
        opar: "⦷",
        OpenCurlyDoubleQuote: "“",
        OpenCurlyQuote: "‘",
        operp: "⦹",
        oplus: "⊕",
        or: "∨",
        Or: "⩔",
        orarr: "↻",
        ord: "⩝",
        order: "ℴ",
        orderof: "ℴ",
        ordf: "ª",
        ordm: "º",
        origof: "⊶",
        oror: "⩖",
        orslope: "⩗",
        orv: "⩛",
        oS: "Ⓢ",
        oscr: "ℴ",
        Oscr: "𝒪",
        oslash: "ø",
        Oslash: "Ø",
        osol: "⊘",
        otilde: "õ",
        Otilde: "Õ",
        otimes: "⊗",
        Otimes: "⨷",
        otimesas: "⨶",
        ouml: "ö",
        Ouml: "Ö",
        ovbar: "⌽",
        OverBar: "‾",
        OverBrace: "⏞",
        OverBracket: "⎴",
        OverParenthesis: "⏜",
        par: "∥",
        para: "¶",
        parallel: "∥",
        parsim: "⫳",
        parsl: "⫽",
        part: "∂",
        PartialD: "∂",
        pcy: "п",
        Pcy: "П",
        percnt: "%",
        period: ".",
        permil: "‰",
        perp: "⊥",
        pertenk: "‱",
        pfr: "𝔭",
        Pfr: "𝔓",
        phi: "φ",
        Phi: "Φ",
        phiv: "ϕ",
        phmmat: "ℳ",
        phone: "☎",
        pi: "π",
        Pi: "Π",
        pitchfork: "⋔",
        piv: "ϖ",
        planck: "ℏ",
        planckh: "ℎ",
        plankv: "ℏ",
        plus: "+",
        plusacir: "⨣",
        plusb: "⊞",
        pluscir: "⨢",
        plusdo: "∔",
        plusdu: "⨥",
        pluse: "⩲",
        PlusMinus: "±",
        plusmn: "±",
        plussim: "⨦",
        plustwo: "⨧",
        pm: "±",
        Poincareplane: "ℌ",
        pointint: "⨕",
        popf: "𝕡",
        Popf: "ℙ",
        pound: "£",
        pr: "≺",
        Pr: "⪻",
        prap: "⪷",
        prcue: "≼",
        pre: "⪯",
        prE: "⪳",
        prec: "≺",
        precapprox: "⪷",
        preccurlyeq: "≼",
        Precedes: "≺",
        PrecedesEqual: "⪯",
        PrecedesSlantEqual: "≼",
        PrecedesTilde: "≾",
        preceq: "⪯",
        precnapprox: "⪹",
        precneqq: "⪵",
        precnsim: "⋨",
        precsim: "≾",
        prime: "′",
        Prime: "″",
        primes: "ℙ",
        prnap: "⪹",
        prnE: "⪵",
        prnsim: "⋨",
        prod: "∏",
        Product: "∏",
        profalar: "⌮",
        profline: "⌒",
        profsurf: "⌓",
        prop: "∝",
        Proportion: "∷",
        Proportional: "∝",
        propto: "∝",
        prsim: "≾",
        prurel: "⊰",
        pscr: "𝓅",
        Pscr: "𝒫",
        psi: "ψ",
        Psi: "Ψ",
        puncsp: " ",
        qfr: "𝔮",
        Qfr: "𝔔",
        qint: "⨌",
        qopf: "𝕢",
        Qopf: "ℚ",
        qprime: "⁗",
        qscr: "𝓆",
        Qscr: "𝒬",
        quaternions: "ℍ",
        quatint: "⨖",
        quest: "?",
        questeq: "≟",
        quot: '"',
        QUOT: '"',
        rAarr: "⇛",
        race: "∽̱",
        racute: "ŕ",
        Racute: "Ŕ",
        radic: "√",
        raemptyv: "⦳",
        rang: "⟩",
        Rang: "⟫",
        rangd: "⦒",
        range: "⦥",
        rangle: "⟩",
        raquo: "»",
        rarr: "→",
        rArr: "⇒",
        Rarr: "↠",
        rarrap: "⥵",
        rarrb: "⇥",
        rarrbfs: "⤠",
        rarrc: "⤳",
        rarrfs: "⤞",
        rarrhk: "↪",
        rarrlp: "↬",
        rarrpl: "⥅",
        rarrsim: "⥴",
        rarrtl: "↣",
        Rarrtl: "⤖",
        rarrw: "↝",
        ratail: "⤚",
        rAtail: "⤜",
        ratio: "∶",
        rationals: "ℚ",
        rbarr: "⤍",
        rBarr: "⤏",
        RBarr: "⤐",
        rbbrk: "❳",
        rbrace: "}",
        rbrack: "]",
        rbrke: "⦌",
        rbrksld: "⦎",
        rbrkslu: "⦐",
        rcaron: "ř",
        Rcaron: "Ř",
        rcedil: "ŗ",
        Rcedil: "Ŗ",
        rceil: "⌉",
        rcub: "}",
        rcy: "р",
        Rcy: "Р",
        rdca: "⤷",
        rdldhar: "⥩",
        rdquo: "”",
        rdquor: "”",
        rdsh: "↳",
        Re: "ℜ",
        real: "ℜ",
        realine: "ℛ",
        realpart: "ℜ",
        reals: "ℝ",
        rect: "▭",
        reg: "®",
        REG: "®",
        ReverseElement: "∋",
        ReverseEquilibrium: "⇋",
        ReverseUpEquilibrium: "⥯",
        rfisht: "⥽",
        rfloor: "⌋",
        rfr: "𝔯",
        Rfr: "ℜ",
        rHar: "⥤",
        rhard: "⇁",
        rharu: "⇀",
        rharul: "⥬",
        rho: "ρ",
        Rho: "Ρ",
        rhov: "ϱ",
        RightAngleBracket: "⟩",
        rightarrow: "→",
        Rightarrow: "⇒",
        RightArrow: "→",
        RightArrowBar: "⇥",
        RightArrowLeftArrow: "⇄",
        rightarrowtail: "↣",
        RightCeiling: "⌉",
        RightDoubleBracket: "⟧",
        RightDownTeeVector: "⥝",
        RightDownVector: "⇂",
        RightDownVectorBar: "⥕",
        RightFloor: "⌋",
        rightharpoondown: "⇁",
        rightharpoonup: "⇀",
        rightleftarrows: "⇄",
        rightleftharpoons: "⇌",
        rightrightarrows: "⇉",
        rightsquigarrow: "↝",
        RightTee: "⊢",
        RightTeeArrow: "↦",
        RightTeeVector: "⥛",
        rightthreetimes: "⋌",
        RightTriangle: "⊳",
        RightTriangleBar: "⧐",
        RightTriangleEqual: "⊵",
        RightUpDownVector: "⥏",
        RightUpTeeVector: "⥜",
        RightUpVector: "↾",
        RightUpVectorBar: "⥔",
        RightVector: "⇀",
        RightVectorBar: "⥓",
        ring: "˚",
        risingdotseq: "≓",
        rlarr: "⇄",
        rlhar: "⇌",
        rlm: "‏",
        rmoust: "⎱",
        rmoustache: "⎱",
        rnmid: "⫮",
        roang: "⟭",
        roarr: "⇾",
        robrk: "⟧",
        ropar: "⦆",
        ropf: "𝕣",
        Ropf: "ℝ",
        roplus: "⨮",
        rotimes: "⨵",
        RoundImplies: "⥰",
        rpar: ")",
        rpargt: "⦔",
        rppolint: "⨒",
        rrarr: "⇉",
        Rrightarrow: "⇛",
        rsaquo: "›",
        rscr: "𝓇",
        Rscr: "ℛ",
        rsh: "↱",
        Rsh: "↱",
        rsqb: "]",
        rsquo: "’",
        rsquor: "’",
        rthree: "⋌",
        rtimes: "⋊",
        rtri: "▹",
        rtrie: "⊵",
        rtrif: "▸",
        rtriltri: "⧎",
        RuleDelayed: "⧴",
        ruluhar: "⥨",
        rx: "℞",
        sacute: "ś",
        Sacute: "Ś",
        sbquo: "‚",
        sc: "≻",
        Sc: "⪼",
        scap: "⪸",
        scaron: "š",
        Scaron: "Š",
        sccue: "≽",
        sce: "⪰",
        scE: "⪴",
        scedil: "ş",
        Scedil: "Ş",
        scirc: "ŝ",
        Scirc: "Ŝ",
        scnap: "⪺",
        scnE: "⪶",
        scnsim: "⋩",
        scpolint: "⨓",
        scsim: "≿",
        scy: "с",
        Scy: "С",
        sdot: "⋅",
        sdotb: "⊡",
        sdote: "⩦",
        searhk: "⤥",
        searr: "↘",
        seArr: "⇘",
        searrow: "↘",
        sect: "§",
        semi: ";",
        seswar: "⤩",
        setminus: "∖",
        setmn: "∖",
        sext: "✶",
        sfr: "𝔰",
        Sfr: "𝔖",
        sfrown: "⌢",
        sharp: "♯",
        shchcy: "щ",
        SHCHcy: "Щ",
        shcy: "ш",
        SHcy: "Ш",
        ShortDownArrow: "↓",
        ShortLeftArrow: "←",
        shortmid: "∣",
        shortparallel: "∥",
        ShortRightArrow: "→",
        ShortUpArrow: "↑",
        shy: "­",
        sigma: "σ",
        Sigma: "Σ",
        sigmaf: "ς",
        sigmav: "ς",
        sim: "∼",
        simdot: "⩪",
        sime: "≃",
        simeq: "≃",
        simg: "⪞",
        simgE: "⪠",
        siml: "⪝",
        simlE: "⪟",
        simne: "≆",
        simplus: "⨤",
        simrarr: "⥲",
        slarr: "←",
        SmallCircle: "∘",
        smallsetminus: "∖",
        smashp: "⨳",
        smeparsl: "⧤",
        smid: "∣",
        smile: "⌣",
        smt: "⪪",
        smte: "⪬",
        smtes: "⪬︀",
        softcy: "ь",
        SOFTcy: "Ь",
        sol: "/",
        solb: "⧄",
        solbar: "⌿",
        sopf: "𝕤",
        Sopf: "𝕊",
        spades: "♠",
        spadesuit: "♠",
        spar: "∥",
        sqcap: "⊓",
        sqcaps: "⊓︀",
        sqcup: "⊔",
        sqcups: "⊔︀",
        Sqrt: "√",
        sqsub: "⊏",
        sqsube: "⊑",
        sqsubset: "⊏",
        sqsubseteq: "⊑",
        sqsup: "⊐",
        sqsupe: "⊒",
        sqsupset: "⊐",
        sqsupseteq: "⊒",
        squ: "□",
        square: "□",
        Square: "□",
        SquareIntersection: "⊓",
        SquareSubset: "⊏",
        SquareSubsetEqual: "⊑",
        SquareSuperset: "⊐",
        SquareSupersetEqual: "⊒",
        SquareUnion: "⊔",
        squarf: "▪",
        squf: "▪",
        srarr: "→",
        sscr: "𝓈",
        Sscr: "𝒮",
        ssetmn: "∖",
        ssmile: "⌣",
        sstarf: "⋆",
        star: "☆",
        Star: "⋆",
        starf: "★",
        straightepsilon: "ϵ",
        straightphi: "ϕ",
        strns: "¯",
        sub: "⊂",
        Sub: "⋐",
        subdot: "⪽",
        sube: "⊆",
        subE: "⫅",
        subedot: "⫃",
        submult: "⫁",
        subne: "⊊",
        subnE: "⫋",
        subplus: "⪿",
        subrarr: "⥹",
        subset: "⊂",
        Subset: "⋐",
        subseteq: "⊆",
        subseteqq: "⫅",
        SubsetEqual: "⊆",
        subsetneq: "⊊",
        subsetneqq: "⫋",
        subsim: "⫇",
        subsub: "⫕",
        subsup: "⫓",
        succ: "≻",
        succapprox: "⪸",
        succcurlyeq: "≽",
        Succeeds: "≻",
        SucceedsEqual: "⪰",
        SucceedsSlantEqual: "≽",
        SucceedsTilde: "≿",
        succeq: "⪰",
        succnapprox: "⪺",
        succneqq: "⪶",
        succnsim: "⋩",
        succsim: "≿",
        SuchThat: "∋",
        sum: "∑",
        Sum: "∑",
        sung: "♪",
        sup: "⊃",
        Sup: "⋑",
        sup1: "¹",
        sup2: "²",
        sup3: "³",
        supdot: "⪾",
        supdsub: "⫘",
        supe: "⊇",
        supE: "⫆",
        supedot: "⫄",
        Superset: "⊃",
        SupersetEqual: "⊇",
        suphsol: "⟉",
        suphsub: "⫗",
        suplarr: "⥻",
        supmult: "⫂",
        supne: "⊋",
        supnE: "⫌",
        supplus: "⫀",
        supset: "⊃",
        Supset: "⋑",
        supseteq: "⊇",
        supseteqq: "⫆",
        supsetneq: "⊋",
        supsetneqq: "⫌",
        supsim: "⫈",
        supsub: "⫔",
        supsup: "⫖",
        swarhk: "⤦",
        swarr: "↙",
        swArr: "⇙",
        swarrow: "↙",
        swnwar: "⤪",
        szlig: "ß",
        Tab: "\t",
        target: "⌖",
        tau: "τ",
        Tau: "Τ",
        tbrk: "⎴",
        tcaron: "ť",
        Tcaron: "Ť",
        tcedil: "ţ",
        Tcedil: "Ţ",
        tcy: "т",
        Tcy: "Т",
        tdot: "⃛",
        telrec: "⌕",
        tfr: "𝔱",
        Tfr: "𝔗",
        there4: "∴",
        therefore: "∴",
        Therefore: "∴",
        theta: "θ",
        Theta: "Θ",
        thetasym: "ϑ",
        thetav: "ϑ",
        thickapprox: "≈",
        thicksim: "∼",
        ThickSpace: "  ",
        thinsp: " ",
        ThinSpace: " ",
        thkap: "≈",
        thksim: "∼",
        thorn: "þ",
        THORN: "Þ",
        tilde: "˜",
        Tilde: "∼",
        TildeEqual: "≃",
        TildeFullEqual: "≅",
        TildeTilde: "≈",
        times: "×",
        timesb: "⊠",
        timesbar: "⨱",
        timesd: "⨰",
        tint: "∭",
        toea: "⤨",
        top: "⊤",
        topbot: "⌶",
        topcir: "⫱",
        topf: "𝕥",
        Topf: "𝕋",
        topfork: "⫚",
        tosa: "⤩",
        tprime: "‴",
        trade: "™",
        TRADE: "™",
        triangle: "▵",
        triangledown: "▿",
        triangleleft: "◃",
        trianglelefteq: "⊴",
        triangleq: "≜",
        triangleright: "▹",
        trianglerighteq: "⊵",
        tridot: "◬",
        trie: "≜",
        triminus: "⨺",
        TripleDot: "⃛",
        triplus: "⨹",
        trisb: "⧍",
        tritime: "⨻",
        trpezium: "⏢",
        tscr: "𝓉",
        Tscr: "𝒯",
        tscy: "ц",
        TScy: "Ц",
        tshcy: "ћ",
        TSHcy: "Ћ",
        tstrok: "ŧ",
        Tstrok: "Ŧ",
        twixt: "≬",
        twoheadleftarrow: "↞",
        twoheadrightarrow: "↠",
        uacute: "ú",
        Uacute: "Ú",
        uarr: "↑",
        uArr: "⇑",
        Uarr: "↟",
        Uarrocir: "⥉",
        ubrcy: "ў",
        Ubrcy: "Ў",
        ubreve: "ŭ",
        Ubreve: "Ŭ",
        ucirc: "û",
        Ucirc: "Û",
        ucy: "у",
        Ucy: "У",
        udarr: "⇅",
        udblac: "ű",
        Udblac: "Ű",
        udhar: "⥮",
        ufisht: "⥾",
        ufr: "𝔲",
        Ufr: "𝔘",
        ugrave: "ù",
        Ugrave: "Ù",
        uHar: "⥣",
        uharl: "↿",
        uharr: "↾",
        uhblk: "▀",
        ulcorn: "⌜",
        ulcorner: "⌜",
        ulcrop: "⌏",
        ultri: "◸",
        umacr: "ū",
        Umacr: "Ū",
        uml: "¨",
        UnderBar: "_",
        UnderBrace: "⏟",
        UnderBracket: "⎵",
        UnderParenthesis: "⏝",
        Union: "⋃",
        UnionPlus: "⊎",
        uogon: "ų",
        Uogon: "Ų",
        uopf: "𝕦",
        Uopf: "𝕌",
        uparrow: "↑",
        Uparrow: "⇑",
        UpArrow: "↑",
        UpArrowBar: "⤒",
        UpArrowDownArrow: "⇅",
        updownarrow: "↕",
        Updownarrow: "⇕",
        UpDownArrow: "↕",
        UpEquilibrium: "⥮",
        upharpoonleft: "↿",
        upharpoonright: "↾",
        uplus: "⊎",
        UpperLeftArrow: "↖",
        UpperRightArrow: "↗",
        upsi: "υ",
        Upsi: "ϒ",
        upsih: "ϒ",
        upsilon: "υ",
        Upsilon: "Υ",
        UpTee: "⊥",
        UpTeeArrow: "↥",
        upuparrows: "⇈",
        urcorn: "⌝",
        urcorner: "⌝",
        urcrop: "⌎",
        uring: "ů",
        Uring: "Ů",
        urtri: "◹",
        uscr: "𝓊",
        Uscr: "𝒰",
        utdot: "⋰",
        utilde: "ũ",
        Utilde: "Ũ",
        utri: "▵",
        utrif: "▴",
        uuarr: "⇈",
        uuml: "ü",
        Uuml: "Ü",
        uwangle: "⦧",
        vangrt: "⦜",
        varepsilon: "ϵ",
        varkappa: "ϰ",
        varnothing: "∅",
        varphi: "ϕ",
        varpi: "ϖ",
        varpropto: "∝",
        varr: "↕",
        vArr: "⇕",
        varrho: "ϱ",
        varsigma: "ς",
        varsubsetneq: "⊊︀",
        varsubsetneqq: "⫋︀",
        varsupsetneq: "⊋︀",
        varsupsetneqq: "⫌︀",
        vartheta: "ϑ",
        vartriangleleft: "⊲",
        vartriangleright: "⊳",
        vBar: "⫨",
        Vbar: "⫫",
        vBarv: "⫩",
        vcy: "в",
        Vcy: "В",
        vdash: "⊢",
        vDash: "⊨",
        Vdash: "⊩",
        VDash: "⊫",
        Vdashl: "⫦",
        vee: "∨",
        Vee: "⋁",
        veebar: "⊻",
        veeeq: "≚",
        vellip: "⋮",
        verbar: "|",
        Verbar: "‖",
        vert: "|",
        Vert: "‖",
        VerticalBar: "∣",
        VerticalLine: "|",
        VerticalSeparator: "❘",
        VerticalTilde: "≀",
        VeryThinSpace: " ",
        vfr: "𝔳",
        Vfr: "𝔙",
        vltri: "⊲",
        vnsub: "⊂⃒",
        vnsup: "⊃⃒",
        vopf: "𝕧",
        Vopf: "𝕍",
        vprop: "∝",
        vrtri: "⊳",
        vscr: "𝓋",
        Vscr: "𝒱",
        vsubne: "⊊︀",
        vsubnE: "⫋︀",
        vsupne: "⊋︀",
        vsupnE: "⫌︀",
        Vvdash: "⊪",
        vzigzag: "⦚",
        wcirc: "ŵ",
        Wcirc: "Ŵ",
        wedbar: "⩟",
        wedge: "∧",
        Wedge: "⋀",
        wedgeq: "≙",
        weierp: "℘",
        wfr: "𝔴",
        Wfr: "𝔚",
        wopf: "𝕨",
        Wopf: "𝕎",
        wp: "℘",
        wr: "≀",
        wreath: "≀",
        wscr: "𝓌",
        Wscr: "𝒲",
        xcap: "⋂",
        xcirc: "◯",
        xcup: "⋃",
        xdtri: "▽",
        xfr: "𝔵",
        Xfr: "𝔛",
        xharr: "⟷",
        xhArr: "⟺",
        xi: "ξ",
        Xi: "Ξ",
        xlarr: "⟵",
        xlArr: "⟸",
        xmap: "⟼",
        xnis: "⋻",
        xodot: "⨀",
        xopf: "𝕩",
        Xopf: "𝕏",
        xoplus: "⨁",
        xotime: "⨂",
        xrarr: "⟶",
        xrArr: "⟹",
        xscr: "𝓍",
        Xscr: "𝒳",
        xsqcup: "⨆",
        xuplus: "⨄",
        xutri: "△",
        xvee: "⋁",
        xwedge: "⋀",
        yacute: "ý",
        Yacute: "Ý",
        yacy: "я",
        YAcy: "Я",
        ycirc: "ŷ",
        Ycirc: "Ŷ",
        ycy: "ы",
        Ycy: "Ы",
        yen: "¥",
        yfr: "𝔶",
        Yfr: "𝔜",
        yicy: "ї",
        YIcy: "Ї",
        yopf: "𝕪",
        Yopf: "𝕐",
        yscr: "𝓎",
        Yscr: "𝒴",
        yucy: "ю",
        YUcy: "Ю",
        yuml: "ÿ",
        Yuml: "Ÿ",
        zacute: "ź",
        Zacute: "Ź",
        zcaron: "ž",
        Zcaron: "Ž",
        zcy: "з",
        Zcy: "З",
        zdot: "ż",
        Zdot: "Ż",
        zeetrf: "ℨ",
        ZeroWidthSpace: "​",
        zeta: "ζ",
        Zeta: "Ζ",
        zfr: "𝔷",
        Zfr: "ℨ",
        zhcy: "ж",
        ZHcy: "Ж",
        zigrarr: "⇝",
        zopf: "𝕫",
        Zopf: "ℤ",
        zscr: "𝓏",
        Zscr: "𝒵",
        zwj: "‍",
        zwnj: "‌"
    };
    var v1 = {
        aacute: "á",
        Aacute: "Á",
        acirc: "â",
        Acirc: "Â",
        acute: "´",
        aelig: "æ",
        AElig: "Æ",
        agrave: "à",
        Agrave: "À",
        amp: "&",
        AMP: "&",
        aring: "å",
        Aring: "Å",
        atilde: "ã",
        Atilde: "Ã",
        auml: "ä",
        Auml: "Ä",
        brvbar: "¦",
        ccedil: "ç",
        Ccedil: "Ç",
        cedil: "¸",
        cent: "¢",
        copy: "©",
        COPY: "©",
        curren: "¤",
        deg: "°",
        divide: "÷",
        eacute: "é",
        Eacute: "É",
        ecirc: "ê",
        Ecirc: "Ê",
        egrave: "è",
        Egrave: "È",
        eth: "ð",
        ETH: "Ð",
        euml: "ë",
        Euml: "Ë",
        frac12: "½",
        frac14: "¼",
        frac34: "¾",
        gt: ">",
        GT: ">",
        iacute: "í",
        Iacute: "Í",
        icirc: "î",
        Icirc: "Î",
        iexcl: "¡",
        igrave: "ì",
        Igrave: "Ì",
        iquest: "¿",
        iuml: "ï",
        Iuml: "Ï",
        laquo: "«",
        lt: "<",
        LT: "<",
        macr: "¯",
        micro: "µ",
        middot: "·",
        nbsp: " ",
        not: "¬",
        ntilde: "ñ",
        Ntilde: "Ñ",
        oacute: "ó",
        Oacute: "Ó",
        ocirc: "ô",
        Ocirc: "Ô",
        ograve: "ò",
        Ograve: "Ò",
        ordf: "ª",
        ordm: "º",
        oslash: "ø",
        Oslash: "Ø",
        otilde: "õ",
        Otilde: "Õ",
        ouml: "ö",
        Ouml: "Ö",
        para: "¶",
        plusmn: "±",
        pound: "£",
        quot: '"',
        QUOT: '"',
        raquo: "»",
        reg: "®",
        REG: "®",
        sect: "§",
        shy: "­",
        sup1: "¹",
        sup2: "²",
        sup3: "³",
        szlig: "ß",
        thorn: "þ",
        THORN: "Þ",
        times: "×",
        uacute: "ú",
        Uacute: "Ú",
        ucirc: "û",
        Ucirc: "Û",
        ugrave: "ù",
        Ugrave: "Ù",
        uml: "¨",
        uuml: "ü",
        Uuml: "Ü",
        yacute: "ý",
        Yacute: "Ý",
        yen: "¥",
        yuml: "ÿ"
    };
    var q1 = {
        0: "�",
        128: "€",
        130: "‚",
        131: "ƒ",
        132: "„",
        133: "…",
        134: "†",
        135: "‡",
        136: "ˆ",
        137: "‰",
        138: "Š",
        139: "‹",
        140: "Œ",
        142: "Ž",
        145: "‘",
        146: "’",
        147: "“",
        148: "”",
        149: "•",
        150: "–",
        151: "—",
        152: "˜",
        153: "™",
        154: "š",
        155: "›",
        156: "œ",
        158: "ž",
        159: "Ÿ"
    };
    var w1 = [
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        11,
        13,
        14,
        15,
        16,
        17,
        18,
        19,
        20,
        21,
        22,
        23,
        24,
        25,
        26,
        27,
        28,
        29,
        30,
        31,
        127,
        128,
        129,
        130,
        131,
        132,
        133,
        134,
        135,
        136,
        137,
        138,
        139,
        140,
        141,
        142,
        143,
        144,
        145,
        146,
        147,
        148,
        149,
        150,
        151,
        152,
        153,
        154,
        155,
        156,
        157,
        158,
        159,
        64976,
        64977,
        64978,
        64979,
        64980,
        64981,
        64982,
        64983,
        64984,
        64985,
        64986,
        64987,
        64988,
        64989,
        64990,
        64991,
        64992,
        64993,
        64994,
        64995,
        64996,
        64997,
        64998,
        64999,
        65000,
        65001,
        65002,
        65003,
        65004,
        65005,
        65006,
        65007,
        65534,
        65535,
        131070,
        131071,
        196606,
        196607,
        262142,
        262143,
        327678,
        327679,
        393214,
        393215,
        458750,
        458751,
        524286,
        524287,
        589822,
        589823,
        655358,
        655359,
        720894,
        720895,
        786430,
        786431,
        851966,
        851967,
        917502,
        917503,
        983038,
        983039,
        1048574,
        1048575,
        1114110,
        1114111
    ];
    var D1 = String.fromCharCode;
    var y1 = {
    };
    var A1 = y1.hasOwnProperty;
    var has = function(r12, e11) {
        return A1.call(r12, e11);
    };
    var contains = function(r21, e2) {
        var a12 = -1;
        var t2 = r21.length;
        while(++a12 < t2)if (r21[a12] == e2) return true;
        return false;
    };
    var merge1 = function(r3, e3) {
        if (!r3) return e3;
        var a21 = {
        };
        var t3;
        for(t3 in e3)a21[t3] = has(r3, t3) ? r3[t3] : e3[t3];
        return a21;
    };
    var codePointToSymbol = function(r4, e4) {
        var a3 = "";
        if (r4 >= 55296 && r4 <= 57343 || r4 > 1114111) {
            e4 && parseError("character reference outside the permissible Unicode range");
            return "�";
        }
        if (has(q1, r4)) {
            e4 && parseError("disallowed character reference");
            return q1[r4];
        }
        e4 && contains(w1, r4) && parseError("disallowed character reference");
        if (r4 > 65535) {
            r4 -= 65536;
            a3 += D1(r4 >>> 10 & 1023 | 55296);
            r4 = 56320 | 1023 & r4;
        }
        a3 += D1(r4);
        return a3;
    };
    var hexEscape = function(r5) {
        return "&#x" + r5.toString(16).toUpperCase() + ";";
    };
    var decEscape = function(r6) {
        return "&#" + r6 + ";";
    };
    var parseError = function(r7) {
        throw Error("Parse error: " + r7);
    };
    var encode = function(r8, e5) {
        e5 = merge1(e5, encode.options);
        var a4 = e5.strict;
        a4 && f11.test(r8) && parseError("forbidden code point");
        var t4 = e5.encodeEverything;
        var o2 = e5.useNamedReferences;
        var s3 = e5.allowUnsafeSymbols;
        var u2 = e5.decimal ? decEscape : hexEscape;
        var escapeBmpSymbol = function(r9) {
            return u2(r9.charCodeAt(0));
        };
        if (t4) {
            r8 = r8.replace(l12, function(r10) {
                return o2 && has(p12, r10) ? "&" + p12[r10] + ";" : escapeBmpSymbol(r10);
            });
            o2 && (r8 = r8.replace(/&gt;\u20D2/g, "&nvgt;").replace(/&lt;\u20D2/g, "&nvlt;").replace(/&#x66;&#x6A;/g, "&fjlig;"));
            o2 && (r8 = r8.replace(n3, function(r) {
                return "&" + p12[r] + ";";
            }));
        } else if (o2) {
            s3 || (r8 = r8.replace(d12, function(r) {
                return "&" + p12[r] + ";";
            }));
            r8 = r8.replace(/&gt;\u20D2/g, "&nvgt;").replace(/&lt;\u20D2/g, "&nvlt;");
            r8 = r8.replace(n3, function(r) {
                return "&" + p12[r] + ";";
            });
        } else s3 || (r8 = r8.replace(d12, escapeBmpSymbol));
        return r8.replace(c12, function(r11) {
            var e6 = r11.charCodeAt(0);
            var a5 = r11.charCodeAt(1);
            var t5 = 1024 * (e6 - 55296) + a5 - 56320 + 65536;
            return u2(t5);
        }).replace(i110, escapeBmpSymbol);
    };
    encode.options = {
        allowUnsafeSymbols: false,
        encodeEverything: false,
        strict: false,
        useNamedReferences: false,
        decimal: false
    };
    var decode = function(r12, e7) {
        e7 = merge1(e7, decode.options);
        var a6 = e7.strict;
        a6 && m1.test(r12) && parseError("malformed character reference");
        return r12.replace(b1, function(r13, t6, o3, s4, u3, c3, l2, i20, n) {
            var p2;
            var d2;
            var g2;
            var m2;
            var f2;
            var b2;
            if (t6) {
                f2 = t6;
                return h2[f2];
            }
            if (o3) {
                f2 = o3;
                b2 = s4;
                if (b2 && e7.isAttributeValue) {
                    a6 && "=" == b2 && parseError("`&` did not start a character reference");
                    return r13;
                }
                a6 && parseError("named character reference was not terminated by a semicolon");
                return v1[f2] + (b2 || "");
            }
            if (u3) {
                g2 = u3;
                d2 = c3;
                a6 && !d2 && parseError("character reference was not terminated by a semicolon");
                p2 = parseInt(g2, 10);
                return codePointToSymbol(p2, a6);
            }
            if (l2) {
                m2 = l2;
                d2 = i20;
                a6 && !d2 && parseError("character reference was not terminated by a semicolon");
                p2 = parseInt(m2, 16);
                return codePointToSymbol(p2, a6);
            }
            a6 && parseError("named character reference was not terminated by a semicolon");
            return r13;
        });
    };
    decode.options = {
        isAttributeValue: false,
        strict: false
    };
    var escape1 = function(r14) {
        return r14.replace(d12, function(r) {
            return g12[r];
        });
    };
    var E1 = {
        version: "1.2.0",
        encode: encode,
        decode: decode,
        escape: escape1,
        unescape: decode
    };
    if (o12 && !o12.nodeType) if (s12) s12.exports = E1;
    else for(var x1 in E1)has(E1, x1) && (o12[x1] = E1[x1]);
    else t11.he = E1;
})(e1);
var t2 = a2.exports;
var e2 = "undefined" !== typeof globalThis ? globalThis : "undefined" !== typeof self ? self : global;
var t3 = {
};
var a3 = "undefined" !== typeof window ? window : "undefined" !== typeof WorkerGlobalScope && self instanceof WorkerGlobalScope ? self : {
};
var n2 = function(t12) {
    var a13 = /(?:^|\s)lang(?:uage)?-([\w-]+)(?=\s|$)/i;
    var n12 = 0;
    var r13 = {
    };
    var i111 = {
        manual: t12.Prism && t12.Prism.manual,
        disableWorkerMessageHandler: t12.Prism && t12.Prism.disableWorkerMessageHandler,
        util: {
            encode: function encode(e12) {
                return e12 instanceof Token ? new Token(e12.type, encode(e12.content), e12.alias) : Array.isArray(e12) ? e12.map(encode) : e12.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/\u00a0/g, " ");
            },
            type: function(e21) {
                return Object.prototype.toString.call(e21).slice(8, -1);
            },
            objId: function(e3) {
                e3.__id || Object.defineProperty(e3, "__id", {
                    value: ++n12
                });
                return e3.__id;
            },
            clone: function deepClone(e4, t21) {
                t21 = t21 || {
                };
                var a22;
                var n21;
                switch(i111.util.type(e4)){
                    case "Object":
                        n21 = i111.util.objId(e4);
                        if (t21[n21]) return t21[n21];
                        a22 = {
                        };
                        t21[n21] = a22;
                        for(var r22 in e4)e4.hasOwnProperty(r22) && (a22[r22] = deepClone(e4[r22], t21));
                        return a22;
                    case "Array":
                        n21 = i111.util.objId(e4);
                        if (t21[n21]) return t21[n21];
                        a22 = [];
                        t21[n21] = a22;
                        e4.forEach(function(e5, n) {
                            a22[n] = deepClone(e5, t21);
                        });
                        return a22;
                    default:
                        return e4;
                }
            },
            getLanguage: function(e6) {
                while(e6){
                    var t31 = a13.exec(e6.className);
                    if (t31) return t31[1].toLowerCase();
                    e6 = e6.parentElement;
                }
                return "none";
            },
            setLanguage: function(e7, t4) {
                e7.className = e7.className.replace(RegExp(a13, "gi"), "");
                e7.classList.add("language-" + t4);
            },
            currentScript: function() {
                if ("undefined" === typeof document) return null;
                if ("currentScript" in document && 1 < 2) return document.currentScript;
                try {
                    throw new Error;
                } catch (n3) {
                    var e8 = (/at [^(\r\n]*\((.*):[^:]+:[^:]+\)$/i.exec(n3.stack) || [])[1];
                    if (e8) {
                        var t5 = document.getElementsByTagName("script");
                        for(var a in t5)if (t5[a].src == e8) return t5[a];
                    }
                    return null;
                }
            },
            isActive: function(e9, t6, a31) {
                var n4 = "no-" + t6;
                while(e9){
                    var r3 = e9.classList;
                    if (r3.contains(t6)) return true;
                    if (r3.contains(n4)) return false;
                    e9 = e9.parentElement;
                }
                return !!a31;
            }
        },
        languages: {
            plain: r13,
            plaintext: r13,
            text: r13,
            txt: r13,
            extend: function(e, t7) {
                var a4 = i111.util.clone(i111.languages[e]);
                for(var n in t7)a4[n] = t7[n];
                return a4;
            },
            insertBefore: function(t8, a5, n5, r4) {
                r4 = r4 || i111.languages;
                var s5 = r4[t8];
                var l3 = {
                };
                for(var o4 in s5)if (s5.hasOwnProperty(o4)) {
                    if (o4 == a5) for(var u4 in n5)n5.hasOwnProperty(u4) && (l3[u4] = n5[u4]);
                    n5.hasOwnProperty(o4) || (l3[o4] = s5[o4]);
                }
                var g3 = r4[t8];
                r4[t8] = l3;
                i111.languages.DFS(i111.languages, function(a6, n6) {
                    n6 === g3 && a6 != t8 && ((this || e2)[a6] = l3);
                });
                return l3;
            },
            DFS: function DFS(e10, t9, a7, n7) {
                n7 = n7 || {
                };
                var r = i111.util.objId;
                for(var s6 in e10)if (e10.hasOwnProperty(s6)) {
                    t9.call(e10, s6, e10[s6], a7 || s6);
                    var l4 = e10[s6];
                    var o5 = i111.util.type(l4);
                    if ("Object" !== o5 || n7[r(l4)]) {
                        if ("Array" === o5 && !n7[r(l4)]) {
                            n7[r(l4)] = true;
                            DFS(l4, t9, s6, n7);
                        }
                    } else {
                        n7[r(l4)] = true;
                        DFS(l4, t9, null, n7);
                    }
                }
            }
        },
        plugins: {
        },
        highlightAll: function(e11, t10) {
            i111.highlightAllUnder(document, e11, t10);
        },
        highlightAllUnder: function(e12, t11, a8) {
            var n8 = {
                callback: a8,
                container: e12,
                selector: 'code[class*="language-"], [class*="language-"] code, code[class*="lang-"], [class*="lang-"] code'
            };
            i111.hooks.run("before-highlightall", n8);
            n8.elements = Array.prototype.slice.apply(n8.container.querySelectorAll(n8.selector));
            i111.hooks.run("before-all-elements-highlight", n8);
            for(var r5, s = 0; r5 = n8.elements[s++];)i111.highlightElement(r5, true === t11, n8.callback);
        },
        highlightElement: function(e13, a9, n9) {
            var r6 = i111.util.getLanguage(e13);
            var s7 = i111.languages[r6];
            i111.util.setLanguage(e13, r6);
            var l5 = e13.parentElement;
            l5 && "pre" === l5.nodeName.toLowerCase() && i111.util.setLanguage(l5, r6);
            var o6 = e13.textContent;
            var u5 = {
                element: e13,
                language: r6,
                grammar: s7,
                code: o6
            };
            function insertHighlightedCode(e14) {
                u5.highlightedCode = e14;
                i111.hooks.run("before-insert", u5);
                u5.element.innerHTML = u5.highlightedCode;
                i111.hooks.run("after-highlight", u5);
                i111.hooks.run("complete", u5);
                n9 && n9.call(u5.element);
            }
            i111.hooks.run("before-sanity-check", u5);
            l5 = u5.element.parentElement;
            l5 && "pre" === l5.nodeName.toLowerCase() && !l5.hasAttribute("tabindex") && l5.setAttribute("tabindex", "0");
            if (u5.code) {
                i111.hooks.run("before-highlight", u5);
                if (u5.grammar) if (a9 && t12.Worker) {
                    var g4 = new Worker(i111.filename);
                    g4.onmessage = function(e15) {
                        insertHighlightedCode(e15.data);
                    };
                    g4.postMessage(JSON.stringify({
                        language: u5.language,
                        code: u5.code,
                        immediateClose: true
                    }));
                } else insertHighlightedCode(i111.highlight(u5.code, u5.grammar, u5.language));
                else insertHighlightedCode(i111.util.encode(u5.code));
            } else {
                i111.hooks.run("complete", u5);
                n9 && n9.call(u5.element);
            }
        },
        highlight: function(e16, t12, a10) {
            var n10 = {
                code: e16,
                grammar: t12,
                language: a10
            };
            i111.hooks.run("before-tokenize", n10);
            n10.tokens = i111.tokenize(n10.code, n10.grammar);
            i111.hooks.run("after-tokenize", n10);
            return Token.stringify(i111.util.encode(n10.tokens), n10.language);
        },
        tokenize: function(e17, t13) {
            var a11 = t13.rest;
            if (a11) {
                for(var n in a11)t13[n] = a11[n];
                delete t13.rest;
            }
            var r7 = new LinkedList;
            addAfter(r7, r7.head, e17);
            matchGrammar(e17, r7, t13, r7.head, 0);
            return toArray(r7);
        },
        hooks: {
            all: {
            },
            add: function(e, t14) {
                var a12 = i111.hooks.all;
                a12[e] = a12[e] || [];
                a12[e].push(t14);
            },
            run: function(e, t15) {
                var a13 = i111.hooks.all[e];
                if (a13 && a13.length) for(var n11, r = 0; n11 = a13[r++];)n11(t15);
            }
        },
        Token: Token
    };
    t12.Prism = i111;
    function Token(t16, a14, n12, r8) {
        (this || e2).type = t16;
        (this || e2).content = a14;
        (this || e2).alias = n12;
        (this || e2).length = 0 | (r8 || "").length;
    }
    Token.stringify = function stringify(e18, t17) {
        if ("string" == typeof e18) return e18;
        if (Array.isArray(e18)) {
            var a15 = "";
            e18.forEach(function(e19) {
                a15 += stringify(e19, t17);
            });
            return a15;
        }
        var n13 = {
            type: e18.type,
            content: stringify(e18.content, t17),
            tag: "span",
            classes: [
                "token",
                e18.type
            ],
            attributes: {
            },
            language: t17
        };
        var r9 = e18.alias;
        r9 && (Array.isArray(r9) ? Array.prototype.push.apply(n13.classes, r9) : n13.classes.push(r9));
        i111.hooks.run("wrap", n13);
        var s8 = "";
        for(var l6 in n13.attributes)s8 += " " + l6 + '="' + (n13.attributes[l6] || "").replace(/"/g, "&quot;") + '"';
        return "<" + n13.tag + ' class="' + n13.classes.join(" ") + '"' + s8 + ">" + n13.content + "</" + n13.tag + ">";
    };
    function matchPattern(e20, t18, a16, n14) {
        e20.lastIndex = t18;
        var r10 = e20.exec(a16);
        if (r10 && n14 && r10[1]) {
            var i21 = r10[1].length;
            r10.index += i21;
            r10[0] = r10[0].slice(i21);
        }
        return r10;
    }
    function matchGrammar(e21, t19, a17, n15, r11, s9) {
        for(var l7 in a17)if (a17.hasOwnProperty(l7) && a17[l7]) {
            var o7 = a17[l7];
            o7 = Array.isArray(o7) ? o7 : [
                o7
            ];
            for(var u6 = 0; u6 < o7.length; ++u6){
                if (s9 && s9.cause == l7 + "," + u6) return;
                var g5 = o7[u6];
                var c4 = g5.inside;
                var d3 = !!g5.lookbehind;
                var p3 = !!g5.greedy;
                var h3 = g5.alias;
                if (p3 && !g5.pattern.global) {
                    var f3 = g5.pattern.toString().match(/[imsuy]*$/)[0];
                    g5.pattern = RegExp(g5.pattern.source, f3 + "g");
                }
                var m3 = g5.pattern || g5;
                for(var v2 = n15.next, b1 = r11; v2 !== t19.tail; b1 += v2.value.length, v2 = v2.next){
                    if (s9 && b1 >= s9.reach) break;
                    var y2 = v2.value;
                    if (t19.length > e21.length) return;
                    if (!(y2 instanceof Token)) {
                        var k2 = 1;
                        var F1;
                        if (p3) {
                            F1 = matchPattern(m3, b1, e21, d3);
                            if (!F1 || F1.index >= e21.length) break;
                            var x2 = F1.index;
                            var A2 = F1.index + F1[0].length;
                            var w2 = b1;
                            w2 += v2.value.length;
                            while(x2 >= w2){
                                v2 = v2.next;
                                w2 += v2.value.length;
                            }
                            w2 -= v2.value.length;
                            b1 = w2;
                            if (v2.value instanceof Token) continue;
                            for(var $1 = v2; $1 !== t19.tail && (w2 < A2 || "string" === typeof $1.value); $1 = $1.next){
                                k2++;
                                w2 += $1.value.length;
                            }
                            k2--;
                            y2 = e21.slice(b1, w2);
                            F1.index -= b1;
                        } else {
                            F1 = matchPattern(m3, 0, y2, d3);
                            if (!F1) continue;
                        }
                        x2 = F1.index;
                        var S1 = F1[0];
                        var E2 = y2.slice(0, x2);
                        var C1 = y2.slice(x2 + S1.length);
                        var _1 = b1 + y2.length;
                        s9 && _1 > s9.reach && (s9.reach = _1);
                        var j5 = v2.prev;
                        if (E2) {
                            j5 = addAfter(t19, j5, E2);
                            b1 += E2.length;
                        }
                        removeRange(t19, j5, k2);
                        var T1 = new Token(l7, c4 ? i111.tokenize(S1, c4) : S1, h3, S1);
                        v2 = addAfter(t19, j5, T1);
                        C1 && addAfter(t19, v2, C1);
                        if (k2 > 1) {
                            var L1 = {
                                cause: l7 + "," + u6,
                                reach: _1
                            };
                            matchGrammar(e21, t19, a17, v2.prev, b1, L1);
                            s9 && L1.reach > s9.reach && (s9.reach = L1.reach);
                        }
                    }
                }
            }
        }
    }
    function LinkedList() {
        var t20 = {
            value: null,
            prev: null,
            next: null
        };
        var a18 = {
            value: null,
            prev: t20,
            next: null
        };
        t20.next = a18;
        (this || e2).head = t20;
        (this || e2).tail = a18;
        (this || e2).length = 0;
    }
    function addAfter(e22, t21, a19) {
        var n16 = t21.next;
        var r12 = {
            value: a19,
            prev: t21,
            next: n16
        };
        t21.next = r12;
        n16.prev = r12;
        e22.length++;
        return r12;
    }
    function removeRange(e23, t22, a20) {
        var n17 = t22.next;
        for(var r13 = 0; r13 < a20 && n17 !== e23.tail; r13++)n17 = n17.next;
        t22.next = n17;
        n17.prev = t22;
        e23.length -= r13;
    }
    function toArray(e24) {
        var t23 = [];
        var a21 = e24.head.next;
        while(a21 !== e24.tail){
            t23.push(a21.value);
            a21 = a21.next;
        }
        return t23;
    }
    if (!t12.document) {
        if (!t12.addEventListener) return i111;
        i111.disableWorkerMessageHandler || t12.addEventListener("message", function(e25) {
            var a22 = JSON.parse(e25.data);
            var n18 = a22.language;
            var r14 = a22.code;
            var s10 = a22.immediateClose;
            t12.postMessage(i111.highlight(r14, i111.languages[n18], n18));
            s10 && t12.close();
        }, false);
        return i111;
    }
    var s13 = i111.util.currentScript();
    if (s13) {
        i111.filename = s13.src;
        s13.hasAttribute("data-manual") && (i111.manual = true);
    }
    function highlightAutomaticallyCallback() {
        i111.manual || i111.highlightAll();
    }
    if (!i111.manual) {
        var l13 = document.readyState;
        "loading" === l13 || "interactive" === l13 && s13 && s13.defer ? document.addEventListener("DOMContentLoaded", highlightAutomaticallyCallback) : window.requestAnimationFrame ? window.requestAnimationFrame(highlightAutomaticallyCallback) : window.setTimeout(highlightAutomaticallyCallback, 16);
    }
    return i111;
}(a3);
t3 && (t3 = n2);
"undefined" !== typeof e2 && (e2.Prism = n2);
n2.languages.markup = {
    comment: {
        pattern: /<!--(?:(?!<!--)[\s\S])*?-->/,
        greedy: true
    },
    prolog: {
        pattern: /<\?[\s\S]+?\?>/,
        greedy: true
    },
    doctype: {
        pattern: /<!DOCTYPE(?:[^>"'[\]]|"[^"]*"|'[^']*')+(?:\[(?:[^<"'\]]|"[^"]*"|'[^']*'|<(?!!--)|<!--(?:[^-]|-(?!->))*-->)*\]\s*)?>/i,
        greedy: true,
        inside: {
            "internal-subset": {
                pattern: /(^[^\[]*\[)[\s\S]+(?=\]>$)/,
                lookbehind: true,
                greedy: true,
                inside: null
            },
            string: {
                pattern: /"[^"]*"|'[^']*'/,
                greedy: true
            },
            punctuation: /^<!|>$|[[\]]/,
            "doctype-tag": /^DOCTYPE/i,
            name: /[^\s<>'"]+/
        }
    },
    cdata: {
        pattern: /<!\[CDATA\[[\s\S]*?\]\]>/i,
        greedy: true
    },
    tag: {
        pattern: /<\/?(?!\d)[^\s>\/=$<%]+(?:\s(?:\s*[^\s>\/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+(?=[\s>]))|(?=[\s/>])))+)?\s*\/?>/,
        greedy: true,
        inside: {
            tag: {
                pattern: /^<\/?[^\s>\/]+/,
                inside: {
                    punctuation: /^<\/?/,
                    namespace: /^[^\s>\/:]+:/
                }
            },
            "special-attr": [],
            "attr-value": {
                pattern: /=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+)/,
                inside: {
                    punctuation: [
                        {
                            pattern: /^=/,
                            alias: "attr-equals"
                        },
                        /"|'/
                    ]
                }
            },
            punctuation: /\/?>/,
            "attr-name": {
                pattern: /[^\s>\/]+/,
                inside: {
                    namespace: /^[^\s>\/:]+:/
                }
            }
        }
    },
    entity: [
        {
            pattern: /&[\da-z]{1,8};/i,
            alias: "named-entity"
        },
        /&#x?[\da-f]{1,8};/i
    ]
};
n2.languages.markup.tag.inside["attr-value"].inside.entity = n2.languages.markup.entity;
n2.languages.markup.doctype.inside["internal-subset"].inside = n2.languages.markup;
n2.hooks.add("wrap", function(e26) {
    "entity" === e26.type && (e26.attributes.title = e26.content.replace(/&amp;/, "&"));
});
Object.defineProperty(n2.languages.markup.tag, "addInlined", {
    value: function addInlined(e27, t) {
        var a23 = {
        };
        a23["language-" + t] = {
            pattern: /(^<!\[CDATA\[)[\s\S]+?(?=\]\]>$)/i,
            lookbehind: true,
            inside: n2.languages[t]
        };
        a23.cdata = /^<!\[CDATA\[|\]\]>$/i;
        var r15 = {
            "included-cdata": {
                pattern: /<!\[CDATA\[[\s\S]*?\]\]>/i,
                inside: a23
            }
        };
        r15["language-" + t] = {
            pattern: /[\s\S]+/,
            inside: n2.languages[t]
        };
        var i22 = {
        };
        i22[e27] = {
            pattern: RegExp(/(<__[^>]*>)(?:<!\[CDATA\[(?:[^\]]|\](?!\]>))*\]\]>|(?!<!\[CDATA\[)[\s\S])*?(?=<\/__>)/.source.replace(/__/g, function() {
                return e27;
            }), "i"),
            lookbehind: true,
            greedy: true,
            inside: r15
        };
        n2.languages.insertBefore("markup", "cdata", i22);
    }
});
Object.defineProperty(n2.languages.markup.tag, "addAttribute", {
    value: function(e28, t24) {
        n2.languages.markup.tag.inside["special-attr"].push({
            pattern: RegExp(/(^|["'\s])/.source + "(?:" + e28 + ")" + /\s*=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+(?=[\s>]))/.source, "i"),
            lookbehind: true,
            inside: {
                "attr-name": /^[^\s=]+/,
                "attr-value": {
                    pattern: /=[\s\S]+/,
                    inside: {
                        value: {
                            pattern: /(^=\s*(["']|(?!["'])))\S[\s\S]*(?=\2$)/,
                            lookbehind: true,
                            alias: [
                                t24,
                                "language-" + t24
                            ],
                            inside: n2.languages[t24]
                        },
                        punctuation: [
                            {
                                pattern: /^=/,
                                alias: "attr-equals"
                            },
                            /"|'/
                        ]
                    }
                }
            }
        });
    }
});
n2.languages.html = n2.languages.markup;
n2.languages.mathml = n2.languages.markup;
n2.languages.svg = n2.languages.markup;
n2.languages.xml = n2.languages.extend("markup", {
});
n2.languages.ssml = n2.languages.xml;
n2.languages.atom = n2.languages.xml;
n2.languages.rss = n2.languages.xml;
(function(e29) {
    var t25 = /(?:"(?:\\(?:\r\n|[\s\S])|[^"\\\r\n])*"|'(?:\\(?:\r\n|[\s\S])|[^'\\\r\n])*')/;
    e29.languages.css = {
        comment: /\/\*[\s\S]*?\*\//,
        atrule: {
            pattern: /@[\w-](?:[^;{\s]|\s+(?![\s{]))*(?:;|(?=\s*\{))/,
            inside: {
                rule: /^@[\w-]+/,
                "selector-function-argument": {
                    pattern: /(\bselector\s*\(\s*(?![\s)]))(?:[^()\s]|\s+(?![\s)])|\((?:[^()]|\([^()]*\))*\))+(?=\s*\))/,
                    lookbehind: true,
                    alias: "selector"
                },
                keyword: {
                    pattern: /(^|[^\w-])(?:and|not|only|or)(?![\w-])/,
                    lookbehind: true
                }
            }
        },
        url: {
            pattern: RegExp("\\burl\\((?:" + t25.source + "|" + /(?:[^\\\r\n()"']|\\[\s\S])*/.source + ")\\)", "i"),
            greedy: true,
            inside: {
                function: /^url/i,
                punctuation: /^\(|\)$/,
                string: {
                    pattern: RegExp("^" + t25.source + "$"),
                    alias: "url"
                }
            }
        },
        selector: {
            pattern: RegExp("(^|[{}\\s])[^{}\\s](?:[^{};\"'\\s]|\\s+(?![\\s{])|" + t25.source + ")*(?=\\s*\\{)"),
            lookbehind: true
        },
        string: {
            pattern: t25,
            greedy: true
        },
        property: {
            pattern: /(^|[^-\w\xA0-\uFFFF])(?!\s)[-_a-z\xA0-\uFFFF](?:(?!\s)[-\w\xA0-\uFFFF])*(?=\s*:)/i,
            lookbehind: true
        },
        important: /!important\b/i,
        function: {
            pattern: /(^|[^-a-z0-9])[-a-z0-9]+(?=\()/i,
            lookbehind: true
        },
        punctuation: /[(){};:,]/
    };
    e29.languages.css.atrule.inside.rest = e29.languages.css;
    var a24 = e29.languages.markup;
    if (a24) {
        a24.tag.addInlined("style", "css");
        a24.tag.addAttribute("style", "css");
    }
})(n2);
n2.languages.clike = {
    comment: [
        {
            pattern: /(^|[^\\])\/\*[\s\S]*?(?:\*\/|$)/,
            lookbehind: true,
            greedy: true
        },
        {
            pattern: /(^|[^\\:])\/\/.*/,
            lookbehind: true,
            greedy: true
        }
    ],
    string: {
        pattern: /(["'])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,
        greedy: true
    },
    "class-name": {
        pattern: /(\b(?:class|extends|implements|instanceof|interface|new|trait)\s+|\bcatch\s+\()[\w.\\]+/i,
        lookbehind: true,
        inside: {
            punctuation: /[.\\]/
        }
    },
    keyword: /\b(?:break|catch|continue|do|else|finally|for|function|if|in|instanceof|new|null|return|throw|try|while)\b/,
    boolean: /\b(?:false|true)\b/,
    function: /\b\w+(?=\()/,
    number: /\b0x[\da-f]+\b|(?:\b\d+(?:\.\d*)?|\B\.\d+)(?:e[+-]?\d+)?/i,
    operator: /[<>]=?|[!=]=?=?|--?|\+\+?|&&?|\|\|?|[?*/~^%]/,
    punctuation: /[{}[\];(),.:]/
};
n2.languages.javascript = n2.languages.extend("clike", {
    "class-name": [
        n2.languages.clike["class-name"],
        {
            pattern: /(^|[^$\w\xA0-\uFFFF])(?!\s)[_$A-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\.(?:constructor|prototype))/,
            lookbehind: true
        }
    ],
    keyword: [
        {
            pattern: /((?:^|\})\s*)catch\b/,
            lookbehind: true
        },
        {
            pattern: /(^|[^.]|\.\.\.\s*)\b(?:as|assert(?=\s*\{)|async(?=\s*(?:function\b|\(|[$\w\xA0-\uFFFF]|$))|await|break|case|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally(?=\s*(?:\{|$))|for|from(?=\s*(?:['"]|$))|function|(?:get|set)(?=\s*(?:[#\[$\w\xA0-\uFFFF]|$))|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)\b/,
            lookbehind: true
        }
    ],
    function: /#?(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*(?:\.\s*(?:apply|bind|call)\s*)?\()/,
    number: {
        pattern: RegExp(/(^|[^\w$])/.source + "(?:" + /NaN|Infinity/.source + "|" + /0[bB][01]+(?:_[01]+)*n?/.source + "|" + /0[oO][0-7]+(?:_[0-7]+)*n?/.source + "|" + /0[xX][\dA-Fa-f]+(?:_[\dA-Fa-f]+)*n?/.source + "|" + /\d+(?:_\d+)*n/.source + "|" + /(?:\d+(?:_\d+)*(?:\.(?:\d+(?:_\d+)*)?)?|\.\d+(?:_\d+)*)(?:[Ee][+-]?\d+(?:_\d+)*)?/.source + ")" + /(?![\w$])/.source),
        lookbehind: true
    },
    operator: /--|\+\+|\*\*=?|=>|&&=?|\|\|=?|[!=]==|<<=?|>>>?=?|[-+*/%&|^!=<>]=?|\.{3}|\?\?=?|\?\.?|[~:]/
});
n2.languages.javascript["class-name"][0].pattern = /(\b(?:class|extends|implements|instanceof|interface|new)\s+)[\w.\\]+/;
n2.languages.insertBefore("javascript", "keyword", {
    regex: {
        pattern: /((?:^|[^$\w\xA0-\uFFFF."'\])\s]|\b(?:return|yield))\s*)\/(?:\[(?:[^\]\\\r\n]|\\.)*\]|\\.|[^/\\\[\r\n])+\/[dgimyus]{0,7}(?=(?:\s|\/\*(?:[^*]|\*(?!\/))*\*\/)*(?:$|[\r\n,.;:})\]]|\/\/))/,
        lookbehind: true,
        greedy: true,
        inside: {
            "regex-source": {
                pattern: /^(\/)[\s\S]+(?=\/[a-z]*$)/,
                lookbehind: true,
                alias: "language-regex",
                inside: n2.languages.regex
            },
            "regex-delimiter": /^\/|\/$/,
            "regex-flags": /^[a-z]+$/
        }
    },
    "function-variable": {
        pattern: /#?(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*[=:]\s*(?:async\s*)?(?:\bfunction\b|(?:\((?:[^()]|\([^()]*\))*\)|(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*)\s*=>))/,
        alias: "function"
    },
    parameter: [
        {
            pattern: /(function(?:\s+(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*)?\s*\(\s*)(?!\s)(?:[^()\s]|\s+(?![\s)])|\([^()]*\))+(?=\s*\))/,
            lookbehind: true,
            inside: n2.languages.javascript
        },
        {
            pattern: /(^|[^$\w\xA0-\uFFFF])(?!\s)[_$a-z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*=>)/i,
            lookbehind: true,
            inside: n2.languages.javascript
        },
        {
            pattern: /(\(\s*)(?!\s)(?:[^()\s]|\s+(?![\s)])|\([^()]*\))+(?=\s*\)\s*=>)/,
            lookbehind: true,
            inside: n2.languages.javascript
        },
        {
            pattern: /((?:\b|\s|^)(?!(?:as|async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|set|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)(?![$\w\xA0-\uFFFF]))(?:(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*\s*)\(\s*|\]\s*\(\s*)(?!\s)(?:[^()\s]|\s+(?![\s)])|\([^()]*\))+(?=\s*\)\s*\{)/,
            lookbehind: true,
            inside: n2.languages.javascript
        }
    ],
    constant: /\b[A-Z](?:[A-Z_]|\dx?)*\b/
});
n2.languages.insertBefore("javascript", "string", {
    hashbang: {
        pattern: /^#!.*/,
        greedy: true,
        alias: "comment"
    },
    "template-string": {
        pattern: /`(?:\\[\s\S]|\$\{(?:[^{}]|\{(?:[^{}]|\{[^}]*\})*\})+\}|(?!\$\{)[^\\`])*`/,
        greedy: true,
        inside: {
            "template-punctuation": {
                pattern: /^`|`$/,
                alias: "string"
            },
            interpolation: {
                pattern: /((?:^|[^\\])(?:\\{2})*)\$\{(?:[^{}]|\{(?:[^{}]|\{[^}]*\})*\})+\}/,
                lookbehind: true,
                inside: {
                    "interpolation-punctuation": {
                        pattern: /^\$\{|\}$/,
                        alias: "punctuation"
                    },
                    rest: n2.languages.javascript
                }
            },
            string: /[\s\S]+/
        }
    },
    "string-property": {
        pattern: /((?:^|[,{])[ \t]*)(["'])(?:\\(?:\r\n|[\s\S])|(?!\2)[^\\\r\n])*\2(?=\s*:)/m,
        lookbehind: true,
        greedy: true,
        alias: "property"
    }
});
n2.languages.insertBefore("javascript", "operator", {
    "literal-property": {
        pattern: /((?:^|[,{])[ \t]*)(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*:)/m,
        lookbehind: true,
        alias: "property"
    }
});
if (n2.languages.markup) {
    n2.languages.markup.tag.addInlined("script", "javascript");
    n2.languages.markup.tag.addAttribute(/on(?:abort|blur|change|click|composition(?:end|start|update)|dblclick|error|focus(?:in|out)?|key(?:down|up)|load|mouse(?:down|enter|leave|move|out|over|up)|reset|resize|scroll|select|slotchange|submit|unload|wheel)/.source, "javascript");
}
n2.languages.js = n2.languages.javascript;
(function() {
    if ("undefined" !== typeof n2 && "undefined" !== typeof document) {
        Element.prototype.matches || (Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector);
        var t26 = "Loading…";
        var FAILURE_MESSAGE = function(e30, t27) {
            return "✖ Error " + e30 + " while fetching file: " + t27;
        };
        var a25 = "✖ Error: File does not exist or is empty";
        var r16 = {
            js: "javascript",
            py: "python",
            rb: "ruby",
            ps1: "powershell",
            psm1: "powershell",
            sh: "bash",
            bat: "batch",
            h: "c",
            tex: "latex"
        };
        var i23 = "data-src-status";
        var s2 = "loading";
        var l8 = "loaded";
        var o13 = "failed";
        var u7 = "pre[data-src]:not([" + i23 + '="' + l8 + '"]):not([' + i23 + '="' + s2 + '"])';
        n2.hooks.add("before-highlightall", function(e31) {
            e31.selector += ", " + u7;
        });
        n2.hooks.add("before-sanity-check", function(e32) {
            var a26 = e32.element;
            if (a26.matches(u7)) {
                e32.code = "";
                a26.setAttribute(i23, s2);
                var g6 = a26.appendChild(document.createElement("CODE"));
                g6.textContent = t26;
                var c5 = a26.getAttribute("data-src");
                var d4 = e32.language;
                if ("none" === d4) {
                    var p4 = (/\.(\w+)$/.exec(c5) || [
                        ,
                        "none"
                    ])[1];
                    d4 = r16[p4] || p4;
                }
                n2.util.setLanguage(g6, d4);
                n2.util.setLanguage(a26, d4);
                var h4 = n2.plugins.autoloader;
                h4 && h4.loadLanguages(d4);
                loadFile(c5, function(e33) {
                    a26.setAttribute(i23, l8);
                    var t28 = parseRange(a26.getAttribute("data-range"));
                    if (t28) {
                        var r17 = e33.split(/\r\n?|\n/g);
                        var s14 = t28[0];
                        var o8 = null == t28[1] ? r17.length : t28[1];
                        s14 < 0 && (s14 += r17.length);
                        s14 = Math.max(0, Math.min(s14 - 1, r17.length));
                        o8 < 0 && (o8 += r17.length);
                        o8 = Math.max(0, Math.min(o8, r17.length));
                        e33 = r17.slice(s14, o8).join("\n");
                        a26.hasAttribute("data-start") || a26.setAttribute("data-start", String(s14 + 1));
                    }
                    g6.textContent = e33;
                    n2.highlightElement(g6);
                }, function(e34) {
                    a26.setAttribute(i23, o13);
                    g6.textContent = e34;
                });
            }
        });
        n2.plugins.fileHighlight = {
            highlight: function highlight(e35) {
                var t29 = (e35 || document).querySelectorAll(u7);
                for(var a27, r = 0; a27 = t29[r++];)n2.highlightElement(a27);
            }
        };
        var g13 = false;
        n2.fileHighlight = function() {
            if (!g13) {
                console.warn("Prism.fileHighlight is deprecated. Use `Prism.plugins.fileHighlight.highlight` instead.");
                g13 = true;
            }
            n2.plugins.fileHighlight.highlight.apply(this || e2, arguments);
        };
    }
    function loadFile(e36, t30, n19) {
        var r18 = new XMLHttpRequest;
        r18.open("GET", e36, true);
        r18.onreadystatechange = function() {
            4 == r18.readyState && (r18.status < 400 && r18.responseText ? t30(r18.responseText) : r18.status >= 400 ? n19(FAILURE_MESSAGE(r18.status, r18.statusText)) : n19(a25));
        };
        r18.send(null);
    }
    function parseRange(e37) {
        var t31 = /^\s*(\d+)\s*(?:(,)\s*(?:(\d+)\s*)?)?$/.exec(e37 || "");
        if (t31) {
            var a28 = Number(t31[1]);
            var n20 = t31[2];
            var r19 = t31[3];
            return n20 ? r19 ? [
                a28,
                Number(r19)
            ] : [
                a28,
                void 0
            ] : [
                a28,
                a28
            ];
        }
    }
})();
var r3 = t3;
class Renderer1 extends marked.Renderer {
    heading(text, level, raw, slugger) {
        const slug = slugger.slug(raw);
        return `<h${level} id="${slug}"><a class="anchor" aria-hidden="true" tabindex="-1" href="#${slug}"><svg class="octicon octicon-link" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M7.775 3.275a.75.75 0 001.06 1.06l1.25-1.25a2 2 0 112.83 2.83l-2.5 2.5a2 2 0 01-2.83 0 .75.75 0 00-1.06 1.06 3.5 3.5 0 004.95 0l2.5-2.5a3.5 3.5 0 00-4.95-4.95l-1.25 1.25zm-4.69 9.64a2 2 0 010-2.83l2.5-2.5a2 2 0 012.83 0 .75.75 0 001.06-1.06 3.5 3.5 0 00-4.95 0l-2.5 2.5a3.5 3.5 0 004.95 4.95l1.25-1.25a.75.75 0 00-1.06-1.06l-1.25 1.25a2 2 0 01-2.83 0z"></path></svg></a>${text}</h${level}>`;
    }
    code(code, language) {
        language = language.split(",")[0];
        const grammar = Object.hasOwnProperty.call(r3.languages, language) ? r3.languages[language] : undefined;
        if (grammar === undefined) {
            return `<pre><code>${t2.escape(code)}</code></pre>`;
        }
        const html = r3.highlight(code, grammar, language);
        return `<div class="highlight highlight-source-${language}"><pre>${html}</pre></div>`;
    }
    link(href, title, text) {
        if (href.startsWith("#")) {
            return `<a href="${href}" title="${title}">${text}</a>`;
        }
        return `<a href="${href}" title="${title}" rel="noopener noreferrer">${text}</a>`;
    }
}
function getRandomFloat(min, max) {
    return (Math.random() * (max - min) + min).toFixed(2);
}
async function getRecentPackages() {
    const maintenance = getRandomFloat(0, 1);
    const quality = getRandomFloat(0.5, 1);
    const popularity = getRandomFloat(0.3, 1);
    const url = `https://registry.npmjs.org/-/v1/search?text=not:insecure&maintenance=${maintenance}&quality=${quality}&popularity=${popularity}`;
    const result = await fetch(url);
    const recentPackages = await result.json();
    return recentPackages;
}
const pageServingHeaders = {
    "content-type": "text/html; charset=UTF-8",
    "Cache-Control": "s-maxage=1500, public, immutable, stale-while-revalidate=1501",
    Link: `<https://ga.jspm.io>; rel="preconnect",<https://fonts.googleapis.com>; rel="preconnect", <https://ga.jspm.io/npm:normalize.css@8.0.1/normalize.css>; rel="preload"; as="style", </style.css>; rel="preload"; as="style", <https://fonts.googleapis.com/css2?family=Abril+Fatface&family=Bebas+Neue&family=Major+Mono+Display&family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,700&family=Source+Code+Pro&family=Vollkorn&family=Inter:wght@200;400;800&display=swap>; rel="preload"; as="style"`
};
function renderMarkdownContent(markdown, opts = {
}) {
    markdown = emojify(markdown);
    return marked(markdown, {
        gfm: true,
        renderer: new Renderer1()
    });
}
const importMeta = {
    url: "file:///Users/shukla001/@jspm/jspm-packages/server.jsx",
    main: import.meta.main
};
const staticAssets = {
    "/style.css": "./style.css",
    "/dom-main.js": "./lib/dom-main.js"
};
async function requestHandler(request) {
    try {
        const { pathname  } = new URL(request.url);
        const staticFile = staticAssets[pathname];
        if (staticFile) {
            const response = await Deno.readFile(staticAsset);
            return new Response(response, {
                headers: {
                    "content-type": contentType(lookup(staticAsset))
                }
            });
        }
        if (pathname === "/") {
            const { objects =[]  } = await getRecentPackages() || {
            };
            const indexPage = gt(Ct(FeaturedPackages, {
                packages: objects
            }));
            const { body , head , footer  } = Lt.SSR(indexPage);
            const content = await Deno.readTextFile("./lib/shell.html");
            const [START, AFTER_HEADER_BEFORE_CONTENT, DOM_SCRIPT, END] = content.split(/<!-- __[A-Z]*__ -->/i);
            const html = [
                START,
                head.join("\n"),
                AFTER_HEADER_BEFORE_CONTENT,
                body,
                DOM_SCRIPT,
                footer.join("\n"),
                END, 
            ].join("\n");
            return new Response(html, {
                headers: pageServingHeaders
            });
        }
        const BASE_PATH = "/package/";
        const NPM_PROVIDER_URL = "https://ga.jspm.io/npm:";
        const maybeReadmeFiles = [
            "README.md",
            "readme.md"
        ];
        if (pathname.startsWith(BASE_PATH)) {
            const [, packageName] = pathname.split(BASE_PATH);
            if (packageName) {
                const baseURL = `${NPM_PROVIDER_URL}${packageName}`;
                const filesToFetch = [
                    "package.json",
                    ...maybeReadmeFiles
                ];
                const [jspmPackage, README, readme] = await Promise.all(filesToFetch.map((file)=>fetch(`${baseURL}/${file}`)
                ));
                const { name , description , keywords , version , homepage , license , files , exports ,  } = await jspmPackage.json();
                const readmeFileContent = await [
                    README,
                    readme
                ].find((readmeFile)=>readmeFile.status === 200 || readmeFile.status === 304
                ).text();
                try {
                    const readmeHTML = renderMarkdownContent(readmeFileContent);
                    const app = gt(Ct(Package, {
                        name: name,
                        description: description,
                        version: version,
                        homepage: homepage,
                        license: license,
                        files: files,
                        exports: exports,
                        readme: readmeHTML,
                        keywords: keywords
                    }));
                    const { body , head , footer  } = Lt.SSR(app);
                    const pieces = body.split("<package-readme-placeholder>");
                    const html = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <title>${name}@${version} - JSPM</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width,initial-scale=1.0">
          <meta name="description" content=${description}>
          <link rel="stylesheet" href="https://ga.jspm.io/npm:normalize.css@8.0.1/normalize.css" />
          <link rel="stylesheet" href="./style.css" />
          <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Abril+Fatface&family=Bebas+Neue&family=Major+Mono+Display&family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,700&family=Source+Code+Pro&family=Vollkorn&family=Inter:wght@200;400;800&display=swap" />
          <link rel="stylesheet" href="https://ga.jspm.io/npm:prismjs@1.25.0/themes/prism.css" />
          ${head.join("\n")}
        </head>
        <body>
          ${pieces[0]}
          ${readmeHTML}
          ${pieces[1]}
          ${footer.join("\n")}
        </body>
      </html>`;
                    return new Response(html, {
                        headers: pageServingHeaders
                    });
                } catch (e3) {
                    console.error(`Failed in generating package-page ${name}@${version}`);
                    console.error(e3);
                    return new Response("500", {
                        status: 500
                    });
                }
            }
        }
        return new Response("404", {
            status: 404
        });
    } catch (error) {
        return new Response(error.message || error.toString(), {
            status: 500
        });
    }
}
if (importMeta?.main) {
    const timestamp = Date.now();
    const humanReadableDateTime = new Intl.DateTimeFormat("default", {
        dateStyle: "full",
        timeStyle: "long"
    }).format(timestamp);
    console.log("Current Date: ", humanReadableDateTime);
    console.info(`Server Listening on http://localhost:8000`);
    await serve(requestHandler);
}
