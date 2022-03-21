// deno-fmt-ignore-file
// deno-lint-ignore-file
// This code was bundled using `deno bundle` and it's not recommended to edit it manually

function delay(ms, options = {}) {
    const { signal  } = options;
    if (signal?.aborted) {
        return Promise.reject(new DOMException("Delay was aborted.", "AbortError"));
    }
    return new Promise((resolve, reject)=>{
        const abort = ()=>{
            clearTimeout(i2);
            reject(new DOMException("Delay was aborted.", "AbortError"));
        };
        const done = ()=>{
            signal?.removeEventListener("abort", abort);
            resolve();
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
            } catch  {}
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
            } catch  {}
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
        } catch  {}
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
async function serve(handler, options = {}) {
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
var t = {};
Object.defineProperty(t, "__esModule", {
    value: true
});
t.h = t._render = t.hydrate = t.render = t.appendChildren = t.strToHash = t.removeAllChildNodes = t.tick = t.isSSR = void 0;
const isSSR$1 = ()=>"undefined" !== typeof _nano && true === _nano.isSSR
;
t.isSSR = isSSR$1;
t.tick = Promise.prototype.then.bind(Promise.resolve());
const removeAllChildNodes = (e1)=>{
    while(e1.firstChild)e1.removeChild(e1.firstChild);
};
t.removeAllChildNodes = removeAllChildNodes;
const strToHash = (e2)=>{
    let t1 = 0;
    for(let n1 = 0; n1 < e2.length; n1++){
        const r1 = e2.charCodeAt(n1);
        t1 = (t1 << 5) - t1 + r1;
        t1 |= 0;
    }
    return Math.abs(t1).toString(32);
};
t.strToHash = strToHash;
const appendChildren = (e3, n2, r2 = true)=>{
    if (Array.isArray(n2)) {
        "object" === typeof n2 && (n2 = Array.prototype.slice.call(n2));
        n2.forEach((n3)=>{
            if (Array.isArray(n3)) (0, t.appendChildren)(e3, n3, r2);
            else {
                const s1 = (0, t._render)(n3);
                "undefined" !== typeof s1 && (Array.isArray(s1) ? (0, t.appendChildren)(e3, s1, r2) : (0, t.isSSR)() && !r2 ? e3.appendChild(null == s1.nodeType ? s1.toString() : s1) : e3.appendChild(null == s1.nodeType ? document.createTextNode(s1.toString()) : s1));
            }
        });
    } else (0, t.appendChildren)(e3, [
        n2
    ], r2);
};
t.appendChildren = appendChildren;
const SVG = (e5)=>{
    const n4 = e5.children[0];
    const r3 = n4.attributes;
    if ((0, t.isSSR)()) return n4;
    const s2 = hNS("svg");
    for(let e4 = r3.length - 1; e4 >= 0; e4--)s2.setAttribute(r3[e4].name, r3[e4].value);
    s2.innerHTML = n4.innerHTML;
    return s2;
};
const render$1 = (e6, n5 = null, r4 = true)=>{
    let s3 = (0, t._render)(e6);
    if (Array.isArray(s3)) {
        s3 = s3.map((e7)=>(0, t._render)(e7)
        );
        1 === s3.length && (s3 = s3[0]);
    }
    if (n5) {
        r4 && (0, t.removeAllChildNodes)(n5);
        s3 && n5.id && n5.id === s3.id && n5.parentElement ? n5.parentElement.replaceChild(s3, n5) : Array.isArray(s3) ? s3.forEach((e8)=>{
            (0, t.appendChildren)(n5, (0, t._render)(e8));
        }) : (0, t.appendChildren)(n5, (0, t._render)(s3));
        return n5;
    }
    return (0, t.isSSR)() && !Array.isArray(s3) ? [
        s3
    ] : s3;
};
t.render = render$1;
t.hydrate = t.render;
const _render = (e9)=>{
    if (null === e9 || false === e9 || "undefined" === typeof e9) return [];
    if ("string" === typeof e9 || "number" === typeof e9) return e9.toString();
    if (e9.tagName && "svg" === e9.tagName.toLowerCase()) return SVG({
        children: [
            e9
        ]
    });
    if (e9.tagName) return e9;
    if (e9 && e9.component && e9.component.isClass) return renderClassComponent(e9);
    if (e9.isClass) return renderClassComponent({
        component: e9,
        props: {}
    });
    if (e9.component && "function" === typeof e9.component) return renderFunctionalComponent(e9);
    if (Array.isArray(e9)) return e9.map((e10)=>(0, t._render)(e10)
    ).flat();
    if ("function" === typeof e9 && !e9.isClass) return (0, t._render)(e9());
    if (e9.component && e9.component.tagName && "string" === typeof e9.component.tagName) return (0, t._render)(e9.component);
    if (Array.isArray(e9.component)) return (0, t._render)(e9.component);
    if (e9.component) return (0, t._render)(e9.component);
    if ("object" === typeof e9) return [];
    console.warn("Something unexpected happened with:", e9);
};
t._render = _render;
const renderFunctionalComponent = (e11)=>{
    const { component: n6 , props: r5  } = e11;
    return (0, t._render)(n6(r5));
};
const renderClassComponent = (e12)=>{
    const { component: n7 , props: r6  } = e12;
    const s4 = (0, t.strToHash)(n7.toString());
    n7.prototype._getHash = ()=>s4
    ;
    const o1 = new n7(r6);
    (0, t.isSSR)() || o1.willMount();
    let i1 = o1.render();
    i1 = (0, t._render)(i1);
    o1.elements = i1;
    r6 && r6.ref && r6.ref(o1);
    (0, t.isSSR)() || (0, t.tick)(()=>{
        o1._didMount();
    });
    return i1;
};
const hNS = (e13)=>document.createElementNS("http://www.w3.org/2000/svg", e13)
;
const h$1 = (e15, n8 = {}, ...r7)=>{
    n8 && n8.children && (Array.isArray(r7) ? Array.isArray(n8.children) ? r7 = [
        ...n8.children,
        ...r7
    ] : r7.push(n8.children) : r7 = Array.isArray(n8.children) ? n8.children : [
        n8.children
    ]);
    if ((0, t.isSSR)() && _nano.ssrTricks.isWebComponent(e15)) {
        const s5 = _nano.ssrTricks.renderWebComponent(e15, n8, r7, t._render);
        return null === s5 ? `ERROR: "<${e15} />"` : s5;
    }
    if ("string" !== typeof e15) return {
        component: e15,
        props: Object.assign(Object.assign({}, n8), {
            children: r7
        })
    };
    let s6;
    const o2 = "svg" === e15 ? hNS("svg") : document.createElement(e15);
    const isEvent = (e16, t2)=>0 === t2.indexOf("on") && (!!e16._ssr || "object" === typeof e16[t2] || "function" === typeof e16[t2])
    ;
    for(const e14 in n8){
        if ("style" === e14 && "object" === typeof n8[e14]) {
            const t3 = Object.keys(n8[e14]).map((t6)=>`${t6}:${n8[e14][t6]}`
            ).join(";").replace(/[A-Z]/g, (e17)=>`-${e17.toLowerCase()}`
            );
            n8[e14] = `${t3};`;
        }
        if ("ref" === e14) s6 = n8[e14];
        else if (isEvent(o2, e14.toLowerCase())) o2.addEventListener(e14.toLowerCase().substring(2), (t7)=>n8[e14](t7)
        );
        else if ("dangerouslySetInnerHTML" === e14 && n8[e14].__html) if ((0, t.isSSR)()) o2.innerHTML = n8[e14].__html;
        else {
            const t8 = document.createElement("fragment");
            t8.innerHTML = n8[e14].__html;
            o2.appendChild(t8);
        }
        else if ("innerHTML" === e14 && n8[e14].__dangerousHtml) if ((0, t.isSSR)()) o2.innerHTML = n8[e14].__dangerousHtml;
        else {
            const t9 = document.createElement("fragment");
            t9.innerHTML = n8[e14].__dangerousHtml;
            o2.appendChild(t9);
        }
        else /className/i.test(e14) ? console.warn('You can use "class" instead of "className".') : "undefined" !== typeof n8[e14] && o2.setAttribute(e14, n8[e14]);
    }
    const i2 = ![
        "noscript",
        "script",
        "style"
    ].includes(e15);
    (0, t.appendChildren)(o2, r7, i2);
    s6 && s6(o2);
    return o2;
};
t.h = h$1;
var n = {};
Object.defineProperty(n, "__esModule", {
    value: true
});
n.VERSION = void 0;
n.VERSION = "0.0.30";
var r = {};
Object.defineProperty(r, "__esModule", {
    value: true
});
r.printVersion = r.escapeHtml = r.onNodeRemove = r.detectSSR = r.nodeToString = r.task = void 0;
const s = n;
const task$1 = (e18)=>setTimeout(e18, 0)
;
r.task = task$1;
const nodeToString$1 = (e19)=>{
    const t10 = document.createElement("div");
    t10.appendChild(e19.cloneNode(true));
    return t10.innerHTML;
};
r.nodeToString = nodeToString$1;
const detectSSR = ()=>{
    const e20 = "undefined" !== typeof Deno;
    const t11 = "undefined" !== typeof window;
    return "undefined" !== typeof _nano && _nano.isSSR || e20 || !t11;
};
r.detectSSR = detectSSR;
function isDescendant(e21, t12) {
    return !!e21 && (e21 === t12 || isDescendant(e21.parentNode, t12));
}
const onNodeRemove = (e22, t13)=>{
    let n9 = new MutationObserver((r8)=>{
        r8.forEach((r9)=>{
            r9.removedNodes.forEach((r10)=>{
                if (isDescendant(e22, r10)) {
                    t13();
                    if (n9) {
                        n9.disconnect();
                        n9 = void 0;
                    }
                }
            });
        });
    });
    n9.observe(document, {
        childList: true,
        subtree: true
    });
    return n9;
};
r.onNodeRemove = onNodeRemove;
const escapeHtml = (e23)=>e23 && "string" === typeof e23 ? e23.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;") : e23
;
r.escapeHtml = escapeHtml;
const printVersion$1 = ()=>{
    const e24 = `Powered by nano JSX v${s.VERSION}`;
    console.log(`%c %c %c %c %c ${e24} %c http://nanojsx.io`, "background: #ff0000", "background: #ffff00", "background: #00ff00", "background: #00ffff", "color: #fff; background: #000000;", "background: none");
};
r.printVersion = printVersion$1;
var o = {};
Object.defineProperty(o, "__esModule", {
    value: true
});
o._clearState = o._state = void 0;
o._state = new Map;
const _clearState = ()=>{
    o._state.clear();
};
o._clearState = _clearState;
var i = {};
Object.defineProperty(i, "__esModule", {
    value: true
});
i.Component = void 0;
const a = r;
const c = t;
const l = o;
class Component$1 {
    constructor(e25){
        this._elements = [];
        this._skipUnmount = false;
        this._hasUnmounted = false;
        this.props = e25 || {};
        this.id = this._getHash();
    }
    static get isClass() {
        return true;
    }
    get isClass() {
        return true;
    }
    setState(e26, t14 = false) {
        const n10 = "object" === typeof e26 && null !== e26;
        n10 && void 0 !== this.state ? this.state = Object.assign(Object.assign({}, this.state), e26) : this.state = e26;
        t14 && this.update();
    }
    set state(e27) {
        l._state.set(this.id, e27);
    }
    get state() {
        return l._state.get(this.id);
    }
    set initState(e28) {
        void 0 === this.state && (this.state = e28);
    }
    get elements() {
        return this._elements || [];
    }
    set elements(e29) {
        Array.isArray(e29) || (e29 = [
            e29
        ]);
        e29.forEach((e30)=>{
            this._elements.push(e30);
        });
    }
    _addNodeRemoveListener() {
        /^[^{]+{\s+}$/gm.test(this.didUnmount.toString()) || (0, a.onNodeRemove)(this.elements[0], ()=>{
            this._skipUnmount || this._didUnmount();
        });
    }
    _didMount() {
        this._addNodeRemoveListener();
        this.didMount();
    }
    _willUpdate() {
        this.willUpdate();
    }
    _didUpdate() {
        this.didUpdate();
    }
    _didUnmount() {
        if (!this._hasUnmounted) {
            this.didUnmount();
            this._hasUnmounted = true;
        }
    }
    willMount() {}
    didMount() {}
    willUpdate() {}
    didUpdate() {}
    didUnmount() {}
    render(e) {}
    update(e31) {
        this._skipUnmount = true;
        this._willUpdate();
        const t15 = [
            ...this.elements
        ];
        this._elements = [];
        let n11 = this.render(e31);
        n11 = (0, c._render)(n11);
        this.elements = n11;
        const r11 = t15[0].parentElement;
        r11 || console.warn("Component needs a parent element to get updated!");
        this.elements.forEach((e32)=>{
            r11 && r11.insertBefore(e32, t15[0]);
        });
        t15.forEach((e33)=>{
            e33.remove();
            e33 = null;
        });
        this._addNodeRemoveListener();
        (0, c.tick)(()=>{
            this._skipUnmount = false;
            this.elements[0].isConnected ? this._didUpdate() : this._didUnmount();
        });
    }
    _getHash() {}
}
i.Component = Component$1;
var d = {};
Object.defineProperty(d, "__esModule", {
    value: true
});
d.Helmet = void 0;
const u = i;
const h = t;
class Attributes extends Map {
    toString() {
        let e34 = "";
        for (const [t16, n12] of this)e34 += ` ${t16}="${n12}"`;
        return e34.trim();
    }
}
class Helmet extends u.Component {
    static SSR(e36) {
        var t18, n13;
        const r12 = /(<helmet\b[^>]*>)((.|\r|\n)*?)(<\/helmet>)/gm;
        const s7 = [];
        const o3 = [];
        const i3 = {
            html: new Attributes,
            body: new Attributes
        };
        if ("undefined" !== typeof document && document.head) {
            let e35 = [];
            e35 = [].slice.call(document.head.children);
            for(let t17 = 0; t17 < e35.length; t17++)-1 === s7.indexOf(e35[t17]) && s7.push(e35[t17]);
        }
        let a1;
        while(null !== (a1 = r12.exec(e36))){
            const r13 = a1[1];
            let c1 = a1[2];
            const l1 = /<html\s([^>]+)><\/html>/gm;
            const d1 = /<body\s([^>]+)><\/body>/gm;
            const u1 = /(\w+)="([^"]+)"/gm;
            let h1 = null;
            null === (t18 = e36.match(l1)) || void 0 === t18 ? void 0 : t18.forEach((e37)=>{
                c1 = c1.replace(e37, "");
                while(null !== (h1 = u1.exec(e37)))i3.html.set(h1[1], h1[2]);
            });
            null === (n13 = e36.match(d1)) || void 0 === n13 ? void 0 : n13.forEach((e38)=>{
                c1 = c1.replace(e38, "");
                while(null !== (h1 = u1.exec(e38)))i3.body.set(h1[1], h1[2]);
            });
            const p1 = r13.includes('data-placement="head"');
            p1 && !s7.includes(c1) ? s7.push(c1) : p1 || o3.includes(c1) || o3.push(c1);
        }
        const c2 = e36.replace(r12, "");
        return {
            body: c2,
            head: s7,
            footer: o3,
            attributes: i3
        };
    }
    didMount() {
        this.props.children.forEach((e40)=>{
            var t19, n14, r15, s8;
            if (!(e40 instanceof HTMLElement)) return;
            const o4 = this.props.footer ? document.body : document.head;
            const i4 = e40.tagName;
            let a2 = [];
            a2.push(e40.innerText);
            for(let r14 = 0; r14 < e40.attributes.length; r14++){
                a2.push(null === (t19 = e40.attributes.item(r14)) || void 0 === t19 ? void 0 : t19.name.toLowerCase());
                a2.push(null === (n14 = e40.attributes.item(r14)) || void 0 === n14 ? void 0 : n14.value.toLowerCase());
            }
            if ("HTML" === i4 || "BODY" === i4) {
                const e41 = document.getElementsByTagName(i4)[0];
                for(let t20 = 1; t20 < a2.length; t20 += 2)e41.setAttribute(a2[t20], a2[t20 + 1]);
                return;
            }
            if ("TITLE" === i4) {
                const t21 = document.getElementsByTagName("TITLE");
                if (t21.length > 0) {
                    const n15 = e40;
                    t21[0].text = n15.text;
                } else {
                    const t22 = (0, h.h)("title", null, e40.innerHTML);
                    (0, h.appendChildren)(o4, [
                        t22
                    ], false);
                }
                return;
            }
            let c3 = false;
            a2 = a2.sort();
            const l2 = document.getElementsByTagName(i4);
            for(let e39 = 0; e39 < l2.length; e39++){
                let t23 = [];
                t23.push(l2[e39].innerText);
                for(let n16 = 0; n16 < l2[e39].attributes.length; n16++){
                    t23.push(null === (r15 = l2[e39].attributes.item(n16)) || void 0 === r15 ? void 0 : r15.name.toLowerCase());
                    t23.push(null === (s8 = l2[e39].attributes.item(n16)) || void 0 === s8 ? void 0 : s8.value.toLowerCase());
                }
                t23 = t23.sort();
                a2.length > 0 && t23.length > 0 && JSON.stringify(a2) === JSON.stringify(t23) && (c3 = true);
            }
            c3 || (0, h.appendChildren)(o4, [
                e40
            ], false);
        });
    }
    render() {
        const e42 = this.props.footer ? "footer" : "head";
        return (0, h.isSSR)() ? (0, h.h)("helmet", {
            "data-ssr": true,
            "data-placement": e42
        }, this.props.children) : [];
    }
}
d.Helmet = Helmet;
var p = {};
var f = p && p.__rest || function(e43, t24) {
    var n17 = {};
    for(var r16 in e43)Object.prototype.hasOwnProperty.call(e43, r16) && t24.indexOf(r16) < 0 && (n17[r16] = e43[r16]);
    if (null != e43 && "function" === typeof Object.getOwnPropertySymbols) {
        var s9 = 0;
        for(r16 = Object.getOwnPropertySymbols(e43); s9 < r16.length; s9++)t24.indexOf(r16[s9]) < 0 && Object.prototype.propertyIsEnumerable.call(e43, r16[s9]) && (n17[r16[s9]] = e43[r16[s9]]);
    }
    return n17;
};
Object.defineProperty(p, "__esModule", {
    value: true
});
p.Img = void 0;
const m = i;
const g = t;
class Img extends m.Component {
    constructor(e44){
        super(e44);
        const { src: t25 , key: n18  } = e44;
        this.id = `${(0, g.strToHash)(t25)}-${(0, g.strToHash)(JSON.stringify(e44))}`;
        n18 && (this.id += `key-${n18}`);
        this.state || this.setState({
            isLoaded: false,
            image: void 0
        });
    }
    didMount() {
        const e45 = this.props, { lazy: t26 = true , placeholder: n , children: r , key: s , ref: o  } = e45, i5 = f(e45, [
            "lazy",
            "placeholder",
            "children",
            "key",
            "ref"
        ]);
        if ("boolean" === typeof t26 && false === t26) return;
        const a3 = new IntersectionObserver((e46, t27)=>{
            e46.forEach((e47)=>{
                if (e47.isIntersecting) {
                    t27.disconnect();
                    this.state.image = (0, g.h)("img", Object.assign({}, i5));
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
        a3.observe(this.elements[0]);
    }
    render() {
        const e48 = this.props, { src: t28 , placeholder: n19 , children: r , lazy: s10 = true , key: o , ref: i  } = e48, a4 = f(e48, [
            "src",
            "placeholder",
            "children",
            "lazy",
            "key",
            "ref"
        ]);
        if ("boolean" === typeof s10 && false === s10) {
            this.state.image = (0, g.h)("img", Object.assign({
                src: t28
            }, a4));
            return this.state.image;
        }
        if (this.state.isLoaded) return this.state.image;
        if (n19 && "string" === typeof n19) return (0, g.h)("img", Object.assign({
            src: n19
        }, a4));
        if (n19 && "function" === typeof n19) return n19();
        {
            const e49 = {};
            a4.width && (e49.width = `${a4.width}px`);
            a4.height && (e49.height = `${a4.height}px`);
            const { width: t , height: n  } = a4, r17 = f(a4, [
                "width",
                "height"
            ]);
            return (0, g.h)("div", Object.assign({
                style: e49
            }, r17));
        }
    }
}
p.Img = Img;
var b = {};
Object.defineProperty(b, "__esModule", {
    value: true
});
b.Fragment = void 0;
const Fragment$1 = (e50)=>e50.children
;
b.Fragment = Fragment$1;
var y = {};
var v = y && y.__rest || function(e51, t29) {
    var n20 = {};
    for(var r18 in e51)Object.prototype.hasOwnProperty.call(e51, r18) && t29.indexOf(r18) < 0 && (n20[r18] = e51[r18]);
    if (null != e51 && "function" === typeof Object.getOwnPropertySymbols) {
        var s11 = 0;
        for(r18 = Object.getOwnPropertySymbols(e51); s11 < r18.length; s11++)t29.indexOf(r18[s11]) < 0 && Object.prototype.propertyIsEnumerable.call(e51, r18[s11]) && (n20[r18[s11]] = e51[r18[s11]]);
    }
    return n20;
};
Object.defineProperty(y, "__esModule", {
    value: true
});
y.Link = void 0;
const _ = i;
const S = d;
const O = t;
const w = b;
class Link$1 extends _.Component {
    prefetchOnHover() {
        this.elements[0].addEventListener("mouseover", ()=>this.addPrefetch()
        , {
            once: true
        });
    }
    prefetchOnVisible() {
        const e52 = new IntersectionObserver((e53, t30)=>{
            e53.forEach((e54)=>{
                if (e54.isIntersecting) {
                    t30.disconnect();
                    this.addPrefetch();
                }
            });
        }, {
            threshold: [
                0,
                1
            ]
        });
        e52.observe(this.elements[0]);
    }
    addPrefetch() {
        let e55 = false;
        const t31 = document.getElementsByTagName("link");
        for(let n21 = 0; n21 < t31.length; n21++)"prefetch" === t31[n21].getAttribute("rel") && t31[n21].getAttribute("href") === this.props.href && (e55 = true);
        if (!e55) {
            const e56 = (0, O.h)("link", {
                rel: "prefetch",
                href: this.props.href,
                as: "document"
            });
            document.head.appendChild(e56);
        }
    }
    didMount() {
        const { href: e57 , prefetch: t32 , delay: n22 = 0 , back: r19 = false  } = this.props;
        r19 && this.elements[0].addEventListener("click", (e58)=>{
            e58.preventDefault();
            const t33 = e58.target;
            t33.href === document.referrer ? window.history.back() : window.location.href = t33.href;
        });
        n22 > 0 && this.elements[0].addEventListener("click", (t34)=>{
            t34.preventDefault();
            setTimeout(()=>window.location.href = e57
            , n22);
        });
        t32 && ("hover" === t32 ? this.prefetchOnHover() : "visible" === t32 ? this.prefetchOnVisible() : this.addPrefetch());
    }
    render() {
        const e59 = this.props, { children: t35 , prefetch: n23 , back: r , ref: s  } = e59, o5 = v(e59, [
            "children",
            "prefetch",
            "back",
            "ref"
        ]);
        this.props.href || console.warn('Please add "href" to <Link>');
        1 !== t35.length && console.warn("Please add ONE child to <Link> (<Link>child</Link>)");
        const i6 = (0, O.h)("a", Object.assign({}, o5), ...t35);
        if (true !== n23 || "undefined" !== typeof window && window.document) return i6;
        {
            const e60 = (0, O.h)("link", {
                rel: "prefetch",
                href: this.props.href,
                as: "document"
            });
            const t36 = (0, O.h)(S.Helmet, null, e60);
            return (0, O.h)(w.Fragment, null, [
                t36,
                i6
            ]);
        }
    }
}
y.Link = Link$1;
var j = {};
var C = j && j.__rest || function(e61, t37) {
    var n24 = {};
    for(var r20 in e61)Object.prototype.hasOwnProperty.call(e61, r20) && t37.indexOf(r20) < 0 && (n24[r20] = e61[r20]);
    if (null != e61 && "function" === typeof Object.getOwnPropertySymbols) {
        var s12 = 0;
        for(r20 = Object.getOwnPropertySymbols(e61); s12 < r20.length; s12++)t37.indexOf(r20[s12]) < 0 && Object.prototype.propertyIsEnumerable.call(e61, r20[s12]) && (n24[r20[s12]] = e61[r20[s12]]);
    }
    return n24;
};
Object.defineProperty(j, "__esModule", {
    value: true
});
j.parseParamsFromPath = j.Listener = j.Link = j.to = j.Route = j.Routes = j.Switch = j.matchPath = void 0;
const x = i;
const P = t;
const E = [];
const register = (e62)=>E.push(e62)
;
const unregister = (e63)=>E.splice(E.indexOf(e63), 1)
;
const historyPush = (e64)=>{
    window.history.pushState({}, "", e64);
    E.forEach((e65)=>e65.handleChanges()
    );
    window.dispatchEvent(new Event("pushstate"));
};
const historyReplace = (e66)=>{
    window.history.replaceState({}, "", e66);
    E.forEach((e67)=>e67.handleChanges()
    );
    window.dispatchEvent(new Event("replacestate"));
};
const matchPath = (e68, t38)=>{
    const { exact: n26 = false , regex: r21  } = t38;
    let { path: s13  } = t38;
    if (!s13) return {
        path: null,
        url: e68,
        isExact: true,
        params: {}
    };
    let o6;
    let i7 = {};
    if (s13.includes("/:")) {
        const t39 = s13.split("/");
        const n25 = e68.split("/");
        t39.forEach((e69, s14)=>{
            if (/^:/.test(e69)) {
                const o7 = e69.slice(1);
                const a6 = n25[s14];
                if (r21 && r21[o7]) {
                    const e70 = r21[o7].test(a6);
                    if (!e70) return null;
                }
                i7 = Object.assign(Object.assign({}, i7), {
                    [o7]: a6
                });
                t39[s14] = n25[s14];
            }
        });
        s13 = t39.join("/");
    }
    "*" === s13 && (o6 = [
        e68
    ]);
    o6 || (o6 = new RegExp(`^${s13}`).exec(e68));
    if (!o6) return null;
    const a5 = o6[0];
    const c4 = e68 === a5;
    return n26 && !c4 ? null : {
        path: s13,
        url: a5,
        isExact: c4,
        params: i7
    };
};
j.matchPath = matchPath;
class Switch extends x.Component {
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
        this.props.children = this.props.children.flat();
        for(let e71 = 0; e71 < this.props.children.length; e71++){
            const t40 = this.props.children[e71];
            const { path: n27 , exact: r22 , regex: s15  } = t40.props;
            const o8 = (0, j.matchPath)((0, P.isSSR)() ? _nano.location.pathname : window.location.pathname, {
                path: n27,
                exact: r22,
                regex: s15
            });
            if (o8) {
                this.match.index = e71;
                this.match.path = n27;
                return;
            }
        }
    }
    shouldUpdate() {
        return this.path !== this.match.path || this.index !== this.match.index;
    }
    render() {
        this.findChild();
        const e72 = this.props.children[this.match.index];
        if (-1 === this.match.index) {
            this.path = "";
            this.index = 0;
        }
        if (e72) {
            const { path: t41  } = e72.props;
            this.path = t41;
            this.index = this.match.index;
            const n28 = (0, P._render)(e72);
            return (0, P.h)("div", {}, (0, P._render)(n28));
        }
        return this.props.fallback ? (0, P.h)("div", {}, (0, P._render)(this.props.fallback)) : (0, P.h)("div", {}, "not found");
    }
}
j.Switch = Switch;
class Routes extends Switch {
}
j.Routes = Routes;
const Route = ({ path: e73 , regex: t42 , children: n29  })=>{
    n29.forEach((n30)=>{
        n30.props && (n30.props = Object.assign(Object.assign({}, n30.props), {
            route: {
                path: e73,
                regex: t42
            }
        }));
    });
    return n29;
};
j.Route = Route;
const to = (e74, t43 = false)=>{
    t43 ? historyReplace(e74) : historyPush(e74);
};
j.to = to;
const Link = (e75)=>{
    var { to: t44 , replace: n31 , children: r23  } = e75, s16 = C(e75, [
        "to",
        "replace",
        "children"
    ]);
    const handleClick = (e76)=>{
        e76.preventDefault();
        n31 ? historyReplace(t44) : historyPush(t44);
    };
    return (0, P.h)("a", Object.assign({
        href: t44,
        onClick: (e77)=>handleClick(e77)
    }, s16), r23);
};
j.Link = Link;
class CListener {
    constructor(){
        this._listeners = new Map;
        if ((0, P.isSSR)()) return;
        this._route = window.location.pathname;
        const event = ()=>{
            const e78 = window.location.pathname;
            this._listeners.forEach((t45)=>{
                t45(e78, this._route);
            });
            this._route = e78;
        };
        window.addEventListener("pushstate", event);
        window.addEventListener("replacestate", event);
    }
    use() {
        const e79 = Math.random().toString(36).substring(2);
        return {
            subscribe: (t46)=>{
                this._listeners.set(e79, t46);
            },
            cancel: ()=>{
                this._listeners.has(e79) && this._listeners.delete(e79);
            }
        };
    }
}
let M;
const Listener = ()=>{
    M || (M = new CListener);
    return M;
};
j.Listener = Listener;
const parseParamsFromPath = (e80)=>{
    let t47 = {};
    const n32 = (0, P.isSSR)() ? _nano.location.pathname.split("/") : window.location.pathname.split("/");
    e80.split("/").forEach((e81, r24)=>{
        e81.startsWith(":") && (t47 = Object.assign(Object.assign({}, t47), {
            [e81.slice(1)]: n32[r24]
        }));
    });
    return t47;
};
j.parseParamsFromPath = parseParamsFromPath;
var R = {};
var L = R && R.__awaiter || function(e82, t48, n33, r25) {
    function adopt(e83) {
        return e83 instanceof n33 ? e83 : new n33(function(t49) {
            t49(e83);
        });
    }
    return new (n33 || (n33 = Promise))(function(n34, s17) {
        function fulfilled(e84) {
            try {
                step(r25.next(e84));
            } catch (e85) {
                s17(e85);
            }
        }
        function rejected(e86) {
            try {
                step(r25.throw(e86));
            } catch (e87) {
                s17(e87);
            }
        }
        function step(e88) {
            e88.done ? n34(e88.value) : adopt(e88.value).then(fulfilled, rejected);
        }
        step((r25 = r25.apply(e82, t48 || [])).next());
    });
};
var k = R && R.__rest || function(e89, t50) {
    var n35 = {};
    for(var r26 in e89)Object.prototype.hasOwnProperty.call(e89, r26) && t50.indexOf(r26) < 0 && (n35[r26] = e89[r26]);
    if (null != e89 && "function" === typeof Object.getOwnPropertySymbols) {
        var s18 = 0;
        for(r26 = Object.getOwnPropertySymbols(e89); s18 < r26.length; s18++)t50.indexOf(r26[s18]) < 0 && Object.prototype.propertyIsEnumerable.call(e89, r26[s18]) && (n35[r26[s18]] = e89[r26[s18]]);
    }
    return n35;
};
Object.defineProperty(R, "__esModule", {
    value: true
});
R.Suspense = void 0;
const T = i;
const N = t;
class Suspense extends T.Component {
    constructor(e90){
        super(e90);
        this.ready = false;
        const t51 = this.props, { children: n , fallback: r , cache: s = false  } = t51, o9 = k(t51, [
            "children",
            "fallback",
            "cache"
        ]);
        const i8 = JSON.stringify(o9, function(e, t52) {
            return "function" === typeof t52 ? `${t52}` : t52;
        });
        this.id = (0, N.strToHash)(JSON.stringify(i8));
    }
    didMount() {
        return L(this, void 0, void 0, function*() {
            const e91 = this.props, { children: t , fallback: n , cache: r27 = false  } = e91, s19 = k(e91, [
                "children",
                "fallback",
                "cache"
            ]);
            r27 && (this.initState = {});
            if (this.loadFromCache(r27)) return;
            const o10 = Object.values(s19).map((e92)=>e92()
            );
            const i9 = yield Promise.all(o10);
            const a7 = this.prepareData(s19, i9, r27);
            this.addDataToChildren(a7);
            this.ready = true;
            this.update();
        });
    }
    ssr() {
        const e93 = this.props, { children: t , fallback: n , cache: r = false  } = e93, s20 = k(e93, [
            "children",
            "fallback",
            "cache"
        ]);
        const o11 = Object.values(s20).map((e94)=>e94()
        );
        const i10 = this.prepareData(s20, o11, false);
        this.addDataToChildren(i10);
    }
    loadFromCache(e95) {
        const t53 = this.state && e95 && Object.keys(this.state).length > 0;
        if (t53) {
            this.addDataToChildren(this.state);
            this.ready = true;
        }
        return t53;
    }
    prepareData(e96, t54, n36) {
        const r28 = Object.keys(e96).reduce((e97, r29, s21)=>{
            n36 && (this.state = Object.assign(Object.assign({}, this.state), {
                [r29]: t54[s21]
            }));
            return Object.assign(Object.assign({}, e97), {
                [r29]: t54[s21]
            });
        }, {});
        return r28;
    }
    addDataToChildren(e98) {
        this.props.children.forEach((t55)=>{
            t55.props && (t55.props = Object.assign(Object.assign({}, t55.props), e98));
        });
    }
    render() {
        if ((0, N.isSSR)()) {
            this.ssr();
            return this.props.children;
        }
        {
            const { cache: e99 = false  } = this.props;
            this.loadFromCache(e99);
            return this.ready ? this.props.children : this.props.fallback;
        }
    }
}
R.Suspense = Suspense;
var I = {};
Object.defineProperty(I, "__esModule", {
    value: true
});
I.Visible = void 0;
const A = t;
const H = i;
class Visible extends H.Component {
    constructor(){
        super(...arguments);
        this.isVisible = false;
    }
    didMount() {
        const e100 = new IntersectionObserver((e101, t56)=>{
            e101.forEach((e102)=>{
                if (e102.isIntersecting) {
                    t56.disconnect();
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
        e100.observe(this.elements[0]);
    }
    render() {
        if (this.isVisible) {
            this.props.onVisible && this.props.onVisible();
            return (0, A.render)(this.props.component || this.props.children[0]);
        }
        return (0, A.h)("div", {
            "data-visible": false,
            visibility: "hidden"
        });
    }
}
I.Visible = Visible;
var $ = {};
var V = $ && $.__createBinding || (Object.create ? function(e103, t57, n37, r30) {
    void 0 === r30 && (r30 = n37);
    Object.defineProperty(e103, r30, {
        enumerable: true,
        get: function() {
            return t57[n37];
        }
    });
} : function(e104, t58, n38, r31) {
    void 0 === r31 && (r31 = n38);
    e104[r31] = t58[n38];
});
var U = $ && $.__setModuleDefault || (Object.create ? function(e105, t59) {
    Object.defineProperty(e105, "default", {
        enumerable: true,
        value: t59
    });
} : function(e106, t60) {
    e106.default = t60;
});
var D = $ && $.__importStar || function(e107) {
    if (e107 && e107.__esModule) return e107;
    var t61 = {};
    if (null != e107) for(var n39 in e107)"default" !== n39 && Object.prototype.hasOwnProperty.call(e107, n39) && V(t61, e107, n39);
    U(t61, e107);
    return t61;
};
Object.defineProperty($, "__esModule", {
    value: true
});
$.Visible = $.Suspense = $.Router = $.Link = $.Img = $.Helmet = void 0;
var F = d;
Object.defineProperty($, "Helmet", {
    enumerable: true,
    get: function() {
        return F.Helmet;
    }
});
var z = p;
Object.defineProperty($, "Img", {
    enumerable: true,
    get: function() {
        return z.Img;
    }
});
var J = y;
Object.defineProperty($, "Link", {
    enumerable: true,
    get: function() {
        return J.Link;
    }
});
$.Router = D(j);
var B = R;
Object.defineProperty($, "Suspense", {
    enumerable: true,
    get: function() {
        return B.Suspense;
    }
});
var W = I;
Object.defineProperty($, "Visible", {
    enumerable: true,
    get: function() {
        return W.Visible;
    }
});
var Z = {};
Object.defineProperty(Z, "__esModule", {
    value: true
});
Z.documentSSR = Z.DocumentSSR = Z.HTMLElementSSR = void 0;
const q = r;
class HTMLElementSSR {
    constructor(e108){
        this.isSelfClosing = false;
        this.nodeType = null;
        this.tagName = e108;
        const t62 = [
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
        if (t62.indexOf(e108) >= 0) {
            this._ssr = `<${e108} />`;
            this.isSelfClosing = true;
        } else this._ssr = `<${e108}></${e108}>`;
    }
    get outerHTML() {
        return this.toString();
    }
    get innerHTML() {
        return this.innerText;
    }
    set innerHTML(e109) {
        this.innerText = e109;
    }
    get innerText() {
        var e110;
        const t63 = /(^<[^>]+>)(.+)?(<\/[a-z0-9]+>$|\/>$)/gm;
        return (null === (e110 = t63.exec(this._ssr)) || void 0 === e110 ? void 0 : e110[2]) || "";
    }
    set innerText(e111) {
        const t64 = /(^<[^>]+>)(.+)?(<\/[a-z0-9]+>$|\/>$)/gm;
        this._ssr = this._ssr.replace(t64, `$1${e111}$3`);
    }
    getAttribute(e) {
        return null;
    }
    get classList() {
        const e112 = this._ssr;
        const t65 = /^<\w+.+(\sclass=")([^"]+)"/gm;
        return {
            add: (e113)=>{
                this.setAttribute("class", e113);
            },
            entries: {
                get length () {
                    const n40 = t65.exec(e112);
                    return n40 && n40[2] ? n40[2].split(" ").length : 0;
                }
            }
        };
    }
    toString() {
        return this._ssr;
    }
    setAttributeNS(e, t66, n41) {
        this.setAttribute(t66, n41);
    }
    setAttribute(e114, t67) {
        this.isSelfClosing ? this._ssr = this._ssr.replace(/(^<[a-z0-9]+ )(.+)/gm, `$1${(0, q.escapeHtml)(e114)}="${(0, q.escapeHtml)(t67)}" $2`) : this._ssr = this._ssr.replace(/(^<[^>]+)(.+)/gm, `$1 ${(0, q.escapeHtml)(e114)}="${(0, q.escapeHtml)(t67)}"$2`);
    }
    append(e115) {
        this.appendChild(e115);
    }
    appendChild(e116) {
        const t68 = this._ssr.lastIndexOf("</");
        this._ssr = this._ssr.substring(0, t68) + e116 + this._ssr.substring(t68);
    }
    get children() {
        const e117 = /<([a-z0-9]+)((?!<\/\1).)*<\/\1>/gms;
        const t69 = [];
        let n42;
        while(null !== (n42 = e117.exec(this.innerHTML)))t69.push(n42[0].replace(/[\s]+/gm, " "));
        return t69;
    }
    addEventListener(e, t, n) {}
}
Z.HTMLElementSSR = HTMLElementSSR;
class DocumentSSR {
    constructor(){
        this.body = this.createElement("body");
        this.head = this.createElement("head");
    }
    createElement(e118) {
        return new HTMLElementSSR(e118);
    }
    createElementNS(e, t70) {
        return this.createElement(t70);
    }
    createTextNode(e119) {
        return (0, q.escapeHtml)(e119);
    }
    querySelector(e) {}
}
Z.DocumentSSR = DocumentSSR;
const documentSSR = ()=>new DocumentSSR
;
Z.documentSSR = documentSSR;
var Y = {};
Object.defineProperty(Y, "__esModule", {
    value: true
});
Y.clearState = Y.renderSSR = Y.initSSR = void 0;
const X = t;
const G = Z;
const K = o;
const Q = r;
const ee = {
    isWebComponent: (e120)=>"string" === typeof e120 && e120.includes("-") && _nano.customElements.has(e120)
    ,
    renderWebComponent: (e121, t71, n43, r32)=>{
        const s22 = _nano.customElements.get(e121);
        const o12 = r32({
            component: s22,
            props: Object.assign(Object.assign({}, t71), {
                children: n43
            })
        });
        const i11 = o12.toString().match(/^<(?<tag>[a-z]+)>(.*)<\/\k<tag>>$/);
        if (i11) {
            const e122 = document.createElement(i11[1]);
            e122.innerText = i11[2];
            function replacer(e123, t72, n, r) {
                return e123.replace(t72, "");
            }
            e122.innerText = e122.innerText.replace(/<\w+[^>]*(\s(on\w*)="[^"]*")/gm, replacer);
            return e122;
        }
        return null;
    }
};
const initGlobalVar = ()=>{
    const e124 = true === (0, Q.detectSSR)() || void 0;
    const t73 = {
        pathname: "/"
    };
    const n44 = e124 ? (0, G.documentSSR)() : window.document;
    globalThis._nano = {
        isSSR: e124,
        location: t73,
        document: n44,
        customElements: new Map,
        ssrTricks: ee
    };
};
initGlobalVar();
const initSSR = (e125 = "/")=>{
    _nano.location = {
        pathname: e125
    };
    globalThis.document = _nano.document = (0, X.isSSR)() ? (0, G.documentSSR)() : window.document;
};
Y.initSSR = initSSR;
const renderSSR$1 = (e126, t74 = {})=>{
    const { pathname: n45 , clearState: r33 = true  } = t74;
    (0, Y.initSSR)(n45);
    r33 && K._state.clear();
    return (0, X.render)(e126, null, true).join("");
};
Y.renderSSR = renderSSR$1;
const clearState = ()=>{
    K._state.clear();
};
Y.clearState = clearState;
var te = {};
Object.defineProperty(te, "__esModule", {
    value: true
});
te.MINI = void 0;
te.MINI = false;
var ne = {};
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
const de = 6;
const ue = 0;
const treeify = (e127, t75)=>{
    const _treeify = (e128)=>{
        let n47 = "";
        let r34 = null;
        const s23 = [];
        const o13 = [];
        for(let i12 = 1; i12 < e128.length; i12++){
            const a8 = e128[i12++];
            const c5 = e128[i12] ? t75[e128[i12++] - 1] : e128[++i12];
            if (a8 === 3) n47 = c5;
            else if (a8 === 4) {
                s23.push(c5);
                r34 = null;
            } else if (a8 === 5) {
                if (!r34) {
                    r34 = Object.create(null);
                    s23.push(r34);
                }
                r34[e128[++i12]] = [
                    c5
                ];
            } else a8 === 6 ? r34[e128[++i12]].push(c5) : a8 === 2 ? o13.push(_treeify(c5)) : a8 === 0 && o13.push(c5);
        }
        return {
            tag: n47,
            props: s23,
            children: o13
        };
    };
    const { children: n46  } = _treeify(e127);
    return n46.length > 1 ? n46 : n46[0];
};
ne.treeify = treeify;
const evaluate = (e129, t76, n48, r35)=>{
    let s24;
    t76[0] = 0;
    for(let o14 = 1; o14 < t76.length; o14++){
        const i13 = t76[o14++];
        const a9 = t76[o14] ? (t76[0] |= i13 ? 1 : 2, n48[t76[o14++]]) : t76[++o14];
        if (i13 === 3) r35[0] = a9;
        else if (i13 === 4) r35[1] = Object.assign(r35[1] || {}, a9);
        else if (i13 === 5) (r35[1] = r35[1] || {})[t76[++o14]] = a9;
        else if (i13 === 6) r35[1][t76[++o14]] += `${a9}`;
        else if (i13) {
            s24 = e129.apply(a9, (0, ne.evaluate)(e129, a9, n48, [
                "",
                null
            ]));
            r35.push(s24);
            if (a9[0]) t76[0] |= 2;
            else {
                t76[o14 - 2] = ue;
                t76[o14] = s24;
            }
        } else r35.push(a9);
    }
    return r35;
};
ne.evaluate = evaluate;
const build = function(e130, ...t78) {
    const n49 = [
        e130,
        ...t78
    ];
    const r36 = this;
    let s25 = 1;
    let o15 = "";
    let i14 = "";
    let a10 = [
        0
    ];
    let c6;
    let l3;
    const commit = (e131)=>{
        if (s25 === 1 && (e131 || (o15 = o15.replace(/^\s*\n\s*|\s*\n\s*$/g, "")))) re.MINI ? a10.push(e131 ? n49[e131] : o15) : a10.push(0, e131, o15);
        else if (s25 === 3 && (e131 || o15)) {
            re.MINI ? a10[1] = e131 ? n49[e131] : o15 : a10.push(3, e131, o15);
            s25 = ie;
        } else if (s25 === 2 && "..." === o15 && e131) re.MINI ? a10[2] = Object.assign(a10[2] || {}, n49[e131]) : a10.push(4, e131, 0);
        else if (s25 === 2 && o15 && !e131) re.MINI ? (a10[2] = a10[2] || {})[o15] = true : a10.push(5, 0, true, o15);
        else if (s25 >= 5) if (re.MINI) if (s25 === 5) {
            (a10[2] = a10[2] || {})[l3] = e131 ? o15 ? o15 + n49[e131] : n49[e131] : o15;
            s25 = de;
        } else (e131 || o15) && (a10[2][l3] += e131 ? o15 + n49[e131] : o15);
        else {
            if (o15 || !e131 && s25 === 5) {
                a10.push(s25, 0, o15, l3);
                s25 = de;
            }
            if (e131) {
                a10.push(s25, e131, 0, l3);
                s25 = de;
            }
        }
        o15 = "";
    };
    for(let t77 = 0; t77 < e130.length; t77++){
        if (t77) {
            s25 === 1 && commit();
            commit(t77);
        }
        for(let n50 = 0; n50 < e130[t77].length; n50++){
            c6 = e130[t77][n50];
            if (s25 === 1) if ("<" === c6) {
                commit();
                a10 = re.MINI ? [
                    a10,
                    "",
                    null
                ] : [
                    a10
                ];
                s25 = ae;
            } else o15 += c6;
            else if (s25 === 4) if ("--" === o15 && ">" === c6) {
                s25 = oe;
                o15 = "";
            } else o15 = c6 + o15[0];
            else if (i14) c6 === i14 ? i14 = "" : o15 += c6;
            else if ('"' === c6 || "'" === c6) i14 = c6;
            else if (">" === c6) {
                commit();
                s25 = oe;
            } else if (s25) if ("=" === c6) {
                s25 = le;
                l3 = o15;
                o15 = "";
            } else if ("/" === c6 && (s25 < 5 || ">" === e130[t77][n50 + 1])) {
                commit();
                s25 === 3 && (a10 = a10[0]);
                s25 = a10;
                re.MINI ? (a10 = a10[0]).push(r36(...s25.slice(1))) : (a10 = a10[0]).push(2, 0, s25);
                s25 = se;
            } else if (" " === c6 || "\t" === c6 || "\n" === c6 || "\r" === c6) {
                commit();
                s25 = ie;
            } else o15 += c6;
            else ;
            if (s25 === 3 && "!--" === o15) {
                s25 = ce;
                a10 = a10[0];
            }
        }
    }
    commit();
    return re.MINI ? a10.length > 2 ? a10.slice(1) : a10[1] : a10;
};
ne.build = build;
var be = {};
Object.defineProperty(be, "__esModule", {
    value: true
});
const ye = te;
const ve = ne;
const _e = new Map;
const regular = function(e132) {
    let t79 = _e.get(this);
    if (!t79) {
        t79 = new Map;
        _e.set(this, t79);
    }
    t79 = (0, ve.evaluate)(this, t79.get(e132) || (t79.set(e132, t79 = (0, ve.build)(e132)), t79), arguments, []);
    return t79.length > 1 ? t79 : t79[0];
};
be.default = ye.MINI ? ve.build : regular;
var Se = {};
var Oe = Se && Se.__importDefault || function(e133) {
    return e133 && e133.__esModule ? e133 : {
        default: e133
    };
};
Object.defineProperty(Se, "__esModule", {
    value: true
});
const we = Oe(be);
Se.default = we.default;
var je = {};
var Ce = je && je.__importDefault || function(e134) {
    return e134 && e134.__esModule ? e134 : {
        default: e134
    };
};
Object.defineProperty(je, "__esModule", {
    value: true
});
je.jsx = void 0;
const xe = t;
const Pe = Ce(Se);
const Ee = Pe.default.bind(xe.h);
je.jsx = Ee;
var Me = {};
Object.defineProperty(Me, "__esModule", {
    value: true
});
Me.hydrateLazy = void 0;
const Re = t;
const Le = I;
const hydrateLazy$1 = (e135, t80 = null, n51 = true)=>{
    const r37 = (0, Re.h)(Le.Visible, null, e135);
    return (0, Re.hydrate)(r37, t80, n51);
};
Me.hydrateLazy = hydrateLazy$1;
var ke = {};
Object.defineProperty(ke, "__esModule", {
    value: true
});
ke.Store = void 0;
const Te = t;
class Store$1 {
    constructor(e136, t81 = "", n52 = "memory"){
        this._listeners = new Map;
        (0, Te.isSSR)() && (n52 = "memory");
        this._id = t81;
        this._storage = n52;
        this._state = this._prevState = e136;
        if ("memory" === n52 || !n52) return;
        const r38 = "local" === n52 ? localStorage : sessionStorage;
        const s26 = r38.getItem(this._id);
        s26 ? this._state = this._prevState = JSON.parse(s26) : r38.setItem(this._id, JSON.stringify(e136));
    }
    persist(e137) {
        if ("memory" === this._storage) return;
        const t82 = "local" === this._storage ? localStorage : sessionStorage;
        t82.setItem(this._id, JSON.stringify(e137));
    }
    clear() {
        this._state = this._prevState = void 0;
        "local" === this._storage ? localStorage.removeItem(this._id) : "session" === this._storage && sessionStorage.removeItem(this._id);
    }
    setState(e138) {
        this.state = e138;
    }
    set state(e139) {
        this._prevState = this._state;
        this._state = e139;
        this.persist(e139);
        this._listeners.forEach((e140)=>{
            e140(this._state, this._prevState);
        });
    }
    get state() {
        return this._state;
    }
    use() {
        const e141 = Math.random().toString(36).substring(2, 9);
        const t83 = this;
        return {
            get state () {
                return t83.state;
            },
            setState: (e142)=>{
                this.state = e142;
            },
            subscribe: (t84)=>{
                this._listeners.set(e141, t84);
            },
            cancel: ()=>{
                this._listeners.has(e141) && this._listeners.delete(e141);
            }
        };
    }
}
ke.Store = Store$1;
var Ne = {};
Object.defineProperty(Ne, "__esModule", {
    value: true
});
Ne.useContext = Ne.createContext = void 0;
const createContext$1 = (e143)=>{
    let t85 = e143;
    return {
        Provider: (e144)=>{
            e144.value && (t85 = e144.value);
            return e144.children;
        },
        Consumer: (e145)=>({
                component: e145.children[0](t85),
                props: Object.assign(Object.assign({}, e145), {
                    context: t85
                })
            })
        ,
        get: ()=>t85
        ,
        set: (e146)=>t85 = e146
    };
};
Ne.createContext = createContext$1;
const useContext$1 = (e147)=>{
    const t86 = e147;
    if (t86 && "function" === typeof t86.get) return t86.get();
};
Ne.useContext = useContext$1;
var Ie = {};
var Ae = Ie && Ie.__rest || function(e148, t87) {
    var n53 = {};
    for(var r39 in e148)Object.prototype.hasOwnProperty.call(e148, r39) && t87.indexOf(r39) < 0 && (n53[r39] = e148[r39]);
    if (null != e148 && "function" === typeof Object.getOwnPropertySymbols) {
        var s27 = 0;
        for(r39 = Object.getOwnPropertySymbols(e148); s27 < r39.length; s27++)t87.indexOf(r39[s27]) < 0 && Object.prototype.propertyIsEnumerable.call(e148, r39[s27]) && (n53[r39[s27]] = e148[r39[s27]]);
    }
    return n53;
};
Object.defineProperty(Ie, "__esModule", {
    value: true
});
Ie.withStyles = void 0;
const He = t;
const $e = i;
const Ve = b;
const Ue = d;
const withStyles$1 = (...e149)=>(t88)=>{
        class _class extends $e.Component {
            render() {
                const n54 = this.props, { children: r40  } = n54, s28 = Ae(n54, [
                    "children"
                ]);
                const o16 = [];
                e149.forEach((e150)=>{
                    var t90;
                    if ("string" === typeof e150) o16.push((0, He.h)(Ue.Helmet, null, (0, He.h)("style", null, e150)));
                    else if ("function" === typeof e150) {
                        const t89 = e150();
                        "string" === typeof t89 && o16.push((0, He.h)(Ue.Helmet, null, (0, He.h)("style", null, t89)));
                    } else if ("object" === typeof e150) {
                        const n55 = null === (t90 = e150.toString) || void 0 === t90 ? void 0 : t90.call(e150);
                        "string" === typeof n55 && o16.push((0, He.h)(Ue.Helmet, null, (0, He.h)("style", null, n55)));
                    }
                });
                const i15 = r40 && r40.length > 0 ? (0, He.h)(t88, Object.assign({}, s28), r40) : (0, He.h)(t88, Object.assign({}, this.props));
                return (0, He.h)(Ve.Fragment, null, ...o16, i15);
            }
        }
        return _class;
    }
;
Ie.withStyles = withStyles$1;
var De = {};
Object.defineProperty(De, "__esModule", {
    value: true
});
De.defineAsCustomElements = void 0;
const Fe = t;
const defineAsCustomElementsSSR = (e151, t91, n = [], r = {})=>{
    /^[a-zA-Z0-9]+-[a-zA-Z0-9]+$/.test(t91) ? _nano.customElements.set(t91, e151) : console.log(`Error: WebComponent name "${t91}" is invalid.`);
};
const defineAsCustomElements$1 = function(e152, t92, n56, { mode: r41 = "closed" , delegatesFocus: s29 = false  } = {}) {
    (0, Fe.isSSR)() ? defineAsCustomElementsSSR(e152, t92, n56) : customElements.define(t92, class extends HTMLElement {
        constructor(){
            super();
            const t93 = this.attachShadow({
                mode: r41,
                delegatesFocus: s29
            });
            let n57;
            const o17 = Array.from(this.children).map((e153)=>(0, Fe.render)(e153)
            );
            const i16 = (0, Fe.h)("div", null, (0, Fe._render)({
                component: e152,
                props: {
                    children: o17,
                    ref: (e154)=>n57 = e154
                }
            }));
            this.component = n57;
            this.isFunctionalComponent = !e152.isClass;
            this.functionalComponentsProps = {};
            t93.append(i16);
            this.isFunctionalComponent || (this.component.updatePropsValue = (e155, t94)=>{
                this.component.props || (this.component.props = {});
                this.component.props[e155] = t94;
                this.component[e155] = t94;
            });
        }
        static get observedAttributes() {
            return n56;
        }
        removeChildren() {
            var e157;
            if (this.shadowRoot) {
                const t95 = Array.from(null === (e157 = this.shadowRoot) || void 0 === e157 ? void 0 : e157.children) || [];
                for (const e156 of t95)e156.remove();
            }
        }
        attributeChangedCallback(t96, n, r42) {
            if (this.isFunctionalComponent) {
                this.removeChildren();
                this.functionalComponentsProps[t96] = r42;
                const n58 = (0, Fe.h)("div", null, (0, Fe._render)({
                    component: e152,
                    props: Object.assign({
                        children: [],
                        ref: (e158)=>this.component = e158
                    }, this.functionalComponentsProps)
                }));
                this.shadowRoot.append(n58);
            } else {
                this.component.updatePropsValue(t96, r42);
                this.component.update();
            }
        }
    });
};
De.defineAsCustomElements = defineAsCustomElements$1;
var ze = {};
var Je = ze && ze.__createBinding || (Object.create ? function(e159, t97, n59, r43) {
    void 0 === r43 && (r43 = n59);
    Object.defineProperty(e159, r43, {
        enumerable: true,
        get: function() {
            return t97[n59];
        }
    });
} : function(e160, t98, n60, r44) {
    void 0 === r44 && (r44 = n60);
    e160[r44] = t98[n60];
});
var Be = ze && ze.__exportStar || function(e161, t99) {
    for(var n61 in e161)"default" === n61 || Object.prototype.hasOwnProperty.call(t99, n61) || Je(t99, e161, n61);
};
Object.defineProperty(ze, "__esModule", {
    value: true
});
ze.VERSION = ze.printVersion = ze.defineAsCustomElements = ze.withStyles = ze.useContext = ze.createContext = ze.Store = ze.Fragment = ze.renderSSR = ze.task = ze.nodeToString = ze.hydrateLazy = ze.jsx = ze.isSSR = ze.Component = ze.tick = ze.hydrate = ze.render = ze.h = void 0;
var We = t;
Object.defineProperty(ze, "h", {
    enumerable: true,
    get: function() {
        return We.h;
    }
});
Object.defineProperty(ze, "render", {
    enumerable: true,
    get: function() {
        return We.render;
    }
});
Object.defineProperty(ze, "hydrate", {
    enumerable: true,
    get: function() {
        return We.hydrate;
    }
});
Object.defineProperty(ze, "tick", {
    enumerable: true,
    get: function() {
        return We.tick;
    }
});
var Ze = i;
Object.defineProperty(ze, "Component", {
    enumerable: true,
    get: function() {
        return Ze.Component;
    }
});
Be($, ze);
const qe = t;
Object.defineProperty(ze, "isSSR", {
    enumerable: true,
    get: function() {
        return qe.isSSR;
    }
});
const Ye = Y;
ze.default = {
    h: qe.h,
    render: qe.render,
    hydrate: qe.hydrate,
    renderSSR: Ye.renderSSR,
    isSSR: qe.isSSR
};
var Xe = je;
Object.defineProperty(ze, "jsx", {
    enumerable: true,
    get: function() {
        return Xe.jsx;
    }
});
var Ge = Me;
Object.defineProperty(ze, "hydrateLazy", {
    enumerable: true,
    get: function() {
        return Ge.hydrateLazy;
    }
});
var Ke = r;
Object.defineProperty(ze, "nodeToString", {
    enumerable: true,
    get: function() {
        return Ke.nodeToString;
    }
});
Object.defineProperty(ze, "task", {
    enumerable: true,
    get: function() {
        return Ke.task;
    }
});
var Qe = Y;
Object.defineProperty(ze, "renderSSR", {
    enumerable: true,
    get: function() {
        return Qe.renderSSR;
    }
});
var et = b;
Object.defineProperty(ze, "Fragment", {
    enumerable: true,
    get: function() {
        return et.Fragment;
    }
});
var tt = ke;
Object.defineProperty(ze, "Store", {
    enumerable: true,
    get: function() {
        return tt.Store;
    }
});
var nt = Ne;
Object.defineProperty(ze, "createContext", {
    enumerable: true,
    get: function() {
        return nt.createContext;
    }
});
Object.defineProperty(ze, "useContext", {
    enumerable: true,
    get: function() {
        return nt.useContext;
    }
});
var rt = Ie;
Object.defineProperty(ze, "withStyles", {
    enumerable: true,
    get: function() {
        return rt.withStyles;
    }
});
var st = De;
Object.defineProperty(ze, "defineAsCustomElements", {
    enumerable: true,
    get: function() {
        return st.defineAsCustomElements;
    }
});
var ot = r;
Object.defineProperty(ze, "printVersion", {
    enumerable: true,
    get: function() {
        return ot.printVersion;
    }
});
var it = n;
Object.defineProperty(ze, "VERSION", {
    enumerable: true,
    get: function() {
        return it.VERSION;
    }
});
const at = ze.__esModule, ct = ze.VERSION, lt = ze.printVersion, dt = ze.defineAsCustomElements, ut = ze.withStyles, ht = ze.useContext, pt = ze.createContext, ft = ze.Store, mt = ze.Fragment, gt = ze.renderSSR, bt = ze.task, yt = ze.nodeToString, vt = ze.hydrateLazy, _t = ze.jsx, St = ze.isSSR, Ot = ze.Component, wt = ze.tick, jt = ze.hydrate, Ct = ze.render, xt = ze.h;
var e = "undefined" !== typeof globalThis ? globalThis : "undefined" !== typeof self ? self : global;
var n1 = {};
!function(e, r1) {
    n1 = r1();
}(0, function() {
    var n11 = 1000, r2 = 60000, i1 = 3600000, s1 = "millisecond", u1 = "second", a1 = "minute", o1 = "hour", f1 = "day", d1 = "week", v1 = "month", g1 = "quarter", D1 = "year", S1 = "date", O1 = "Invalid Date", _1 = /^(\d{4})[-/]?(\d{1,2})?[-/]?(\d{0,2})[Tt\s]*(\d{1,2})?:?(\d{1,2})?:?(\d{1,2})?[.:]?(\d+)?$/, b1 = /\[([^\]]+)]|Y{1,4}|M{1,4}|D{1,2}|d{1,4}|H{1,2}|h{1,2}|a|A|m{1,2}|s{1,2}|Z{1,2}|SSS/g, T1 = {
        name: "en",
        weekdays: "Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"),
        months: "January_February_March_April_May_June_July_August_September_October_November_December".split("_")
    }, m1 = function(e1, n2, r3) {
        var i3 = String(e1);
        return !i3 || i3.length >= n2 ? e1 : "" + Array(n2 + 1 - i3.length).join(r3) + e1;
    }, Y1 = {
        s: m1,
        z: function(e2) {
            var n3 = -e2.utcOffset(), r4 = Math.abs(n3), i4 = Math.floor(r4 / 60), s2 = r4 % 60;
            return (n3 <= 0 ? "+" : "-") + m1(i4, 2, "0") + ":" + m1(s2, 2, "0");
        },
        m: function t5(e3, n4) {
            if (e3.date() < n4.date()) return -t5(n4, e3);
            var r5 = 12 * (n4.year() - e3.year()) + (n4.month() - e3.month()), i5 = e3.clone().add(r5, v1), s3 = n4 - i5 < 0, u2 = e3.clone().add(r5 + (s3 ? -1 : 1), v1);
            return +(-(r5 + (n4 - i5) / (s3 ? i5 - u2 : u2 - i5)) || 0);
        },
        a: function(e4) {
            return e4 < 0 ? Math.ceil(e4) || 0 : Math.floor(e4);
        },
        p: function(e5) {
            return ({
                M: v1,
                y: D1,
                w: d1,
                d: f1,
                D: S1,
                h: o1,
                m: a1,
                s: u1,
                ms: s1,
                Q: g1
            })[e5] || String(e5 || "").toLowerCase().replace(/s$/, "");
        },
        u: function(e6) {
            return void 0 === e6;
        }
    }, H1 = "en", L1 = {};
    L1[H1] = T1;
    var p2 = function(e7) {
        return e7 instanceof C1;
    }, W1 = function t6(e8, n5, r6) {
        var i6;
        if (!e8) return H1;
        if ("string" == typeof e8) {
            var s4 = e8.toLowerCase();
            L1[s4] && (i6 = s4), n5 && (L1[s4] = n5, i6 = s4);
            var u3 = e8.split("-");
            if (!i6 && u3.length > 1) return t6(u3[0]);
        } else {
            var a4 = e8.name;
            L1[a4] = e8, i6 = a4;
        }
        return !r6 && i6 && (H1 = i6), i6 || !r6 && H1;
    }, w1 = function(e9, n6) {
        if (p2(e9)) return e9.clone();
        var r7 = "object" == typeof n6 ? n6 : {};
        return r7.date = e9, r7.args = arguments, new C1(r7);
    }, x1 = Y1;
    x1.l = W1, x1.i = p2, x1.w = function(e10, n7) {
        return w1(e10, {
            locale: n7.$L,
            utc: n7.$u,
            x: n7.$x,
            $offset: n7.$offset
        });
    };
    var C1 = function() {
        function M1(n8) {
            (this || e).$L = W1(n8.locale, null, !0), this.parse(n8);
        }
        var T2 = M1.prototype;
        return T2.parse = function(n9) {
            (this || e).$d = (function(e11) {
                var n10 = e11.date, r8 = e11.utc;
                if (null === n10) return new Date(NaN);
                if (x1.u(n10)) return new Date;
                if (n10 instanceof Date) return new Date(n10);
                if ("string" == typeof n10 && !/Z$/i.test(n10)) {
                    var i7 = n10.match(_1);
                    if (i7) {
                        var s5 = i7[2] - 1 || 0, u4 = (i7[7] || "0").substring(0, 3);
                        return r8 ? new Date(Date.UTC(i7[1], s5, i7[3] || 1, i7[4] || 0, i7[5] || 0, i7[6] || 0, u4)) : new Date(i7[1], s5, i7[3] || 1, i7[4] || 0, i7[5] || 0, i7[6] || 0, u4);
                    }
                }
                return new Date(n10);
            })(n9), (this || e).$x = n9.x || {}, this.init();
        }, T2.init = function() {
            var n11 = (this || e).$d;
            (this || e).$y = n11.getFullYear(), (this || e).$M = n11.getMonth(), (this || e).$D = n11.getDate(), (this || e).$W = n11.getDay(), (this || e).$H = n11.getHours(), (this || e).$m = n11.getMinutes(), (this || e).$s = n11.getSeconds(), (this || e).$ms = n11.getMilliseconds();
        }, T2.$utils = function() {
            return x1;
        }, T2.isValid = function() {
            return !((this || e).$d.toString() === O1);
        }, T2.isSame = function(e12, n12) {
            var r9 = w1(e12);
            return this.startOf(n12) <= r9 && r9 <= this.endOf(n12);
        }, T2.isAfter = function(e13, n13) {
            return w1(e13) < this.startOf(n13);
        }, T2.isBefore = function(e14, n14) {
            return this.endOf(n14) < w1(e14);
        }, T2.$g = function(n15, r10, i8) {
            return x1.u(n15) ? (this || e)[r10] : this.set(i8, n15);
        }, T2.unix = function() {
            return Math.floor(this.valueOf() / 1000);
        }, T2.valueOf = function() {
            return (this || e).$d.getTime();
        }, T2.startOf = function(n16, r11) {
            var i9 = this || e, s6 = !!x1.u(r11) || r11, g2 = x1.p(n16), $1 = function(e15, n17) {
                var r12 = x1.w(i9.$u ? Date.UTC(i9.$y, n17, e15) : new Date(i9.$y, n17, e15), i9);
                return s6 ? r12 : r12.endOf(f1);
            }, l2 = function(e16, n18) {
                return x1.w(i9.toDate()[e16].apply(i9.toDate("s"), (s6 ? [
                    0,
                    0,
                    0,
                    0
                ] : [
                    23,
                    59,
                    59,
                    999
                ]).slice(n18)), i9);
            }, O2 = (this || e).$W, _2 = (this || e).$M, b2 = (this || e).$D, T3 = "set" + ((this || e).$u ? "UTC" : "");
            switch(g2){
                case D1:
                    return s6 ? $1(1, 0) : $1(31, 11);
                case v1:
                    return s6 ? $1(1, _2) : $1(0, _2 + 1);
                case d1:
                    var Y2 = this.$locale().weekStart || 0, H2 = (O2 < Y2 ? O2 + 7 : O2) - Y2;
                    return $1(s6 ? b2 - H2 : b2 + (6 - H2), _2);
                case f1:
                case S1:
                    return l2(T3 + "Hours", 0);
                case o1:
                    return l2(T3 + "Minutes", 1);
                case a1:
                    return l2(T3 + "Seconds", 2);
                case u1:
                    return l2(T3 + "Milliseconds", 3);
                default:
                    return this.clone();
            }
        }, T2.endOf = function(e17) {
            return this.startOf(e17, !1);
        }, T2.$set = function(n19, r13) {
            var i10, d2 = x1.p(n19), g3 = "set" + ((this || e).$u ? "UTC" : ""), O3 = (i10 = {}, i10[f1] = g3 + "Date", i10[S1] = g3 + "Date", i10[v1] = g3 + "Month", i10[D1] = g3 + "FullYear", i10[o1] = g3 + "Hours", i10[a1] = g3 + "Minutes", i10[u1] = g3 + "Seconds", i10[s1] = g3 + "Milliseconds", i10)[d2], _3 = d2 === f1 ? (this || e).$D + (r13 - (this || e).$W) : r13;
            if (d2 === v1 || d2 === D1) {
                var b3 = this.clone().set(S1, 1);
                b3.$d[O3](_3), b3.init(), (this || e).$d = b3.set(S1, Math.min((this || e).$D, b3.daysInMonth())).$d;
            } else O3 && (this || e).$d[O3](_3);
            return this.init(), this || e;
        }, T2.set = function(e18, n20) {
            return this.clone().$set(e18, n20);
        }, T2.get = function(e19) {
            return this[x1.p(e19)]();
        }, T2.add = function(s7, g4) {
            var S2, O4 = this || e;
            s7 = Number(s7);
            var _4 = x1.p(g4), y1 = function(e20) {
                var n21 = w1(O4);
                return x1.w(n21.date(n21.date() + Math.round(e20 * s7)), O4);
            };
            if (_4 === v1) return this.set(v1, (this || e).$M + s7);
            if (_4 === D1) return this.set(D1, (this || e).$y + s7);
            if (_4 === f1) return y1(1);
            if (_4 === d1) return y1(7);
            var b4 = (S2 = {}, S2[a1] = r2, S2[o1] = i1, S2[u1] = n11, S2)[_4] || 1, T4 = (this || e).$d.getTime() + s7 * b4;
            return x1.w(T4, this || e);
        }, T2.subtract = function(e21, n22) {
            return this.add(-1 * e21, n22);
        }, T2.format = function(n23) {
            var r14 = this || e, i2 = this.$locale();
            if (!this.isValid()) return i2.invalidDate || O1;
            var s8 = n23 || "YYYY-MM-DDTHH:mm:ssZ", u2 = x1.z(this || e), a5 = (this || e).$H, o2 = (this || e).$m, f2 = (this || e).$M, d3 = i2.weekdays, v2 = i2.months, h2 = function(e22, n24, i11, u5) {
                return e22 && (e22[n24] || e22(r14, s8)) || i11[n24].substr(0, u5);
            }, c2 = function(e23) {
                return x1.s(a5 % 12 || 12, e23, "0");
            }, g5 = i2.meridiem || function(e24, n, r15) {
                var i12 = e24 < 12 ? "AM" : "PM";
                return r15 ? i12.toLowerCase() : i12;
            }, D2 = {
                YY: String((this || e).$y).slice(-2),
                YYYY: (this || e).$y,
                M: f2 + 1,
                MM: x1.s(f2 + 1, 2, "0"),
                MMM: h2(i2.monthsShort, f2, v2, 3),
                MMMM: h2(v2, f2),
                D: (this || e).$D,
                DD: x1.s((this || e).$D, 2, "0"),
                d: String((this || e).$W),
                dd: h2(i2.weekdaysMin, (this || e).$W, d3, 2),
                ddd: h2(i2.weekdaysShort, (this || e).$W, d3, 3),
                dddd: d3[(this || e).$W],
                H: String(a5),
                HH: x1.s(a5, 2, "0"),
                h: c2(1),
                hh: c2(2),
                a: g5(a5, o2, !0),
                A: g5(a5, o2, !1),
                m: String(o2),
                mm: x1.s(o2, 2, "0"),
                s: String((this || e).$s),
                ss: x1.s((this || e).$s, 2, "0"),
                SSS: x1.s((this || e).$ms, 3, "0"),
                Z: u2
            };
            return s8.replace(b1, function(e25, n25) {
                return n25 || D2[e25] || u2.replace(":", "");
            });
        }, T2.utcOffset = function() {
            return 15 * -Math.round((this || e).$d.getTimezoneOffset() / 15);
        }, T2.diff = function(s9, S3, O5) {
            var _5, b5 = x1.p(S3), T5 = w1(s9), Y3 = (T5.utcOffset() - this.utcOffset()) * r2, H3 = (this || e) - T5, L2 = x1.m(this || e, T5);
            return L2 = (_5 = {}, _5[D1] = L2 / 12, _5[v1] = L2, _5[g1] = L2 / 3, _5[d1] = (H3 - Y3) / 604800000, _5[f1] = (H3 - Y3) / 86400000, _5[o1] = H3 / i1, _5[a1] = H3 / r2, _5[u1] = H3 / n11, _5)[b5] || H3, O5 ? L2 : x1.a(L2);
        }, T2.daysInMonth = function() {
            return this.endOf(v1).$D;
        }, T2.$locale = function() {
            return L1[(this || e).$L];
        }, T2.locale = function(n26, r16) {
            if (!n26) return (this || e).$L;
            var i13 = this.clone(), s10 = W1(n26, r16, !0);
            return s10 && (i13.$L = s10), i13;
        }, T2.clone = function() {
            return x1.w((this || e).$d, this || e);
        }, T2.toDate = function() {
            return new Date(this.valueOf());
        }, T2.toJSON = function() {
            return this.isValid() ? this.toISOString() : null;
        }, T2.toISOString = function() {
            return (this || e).$d.toISOString();
        }, T2.toString = function() {
            return (this || e).$d.toUTCString();
        }, M1;
    }(), A1 = C1.prototype;
    return w1.prototype = A1, [
        [
            "$ms",
            s1
        ],
        [
            "$s",
            u1
        ],
        [
            "$m",
            a1
        ],
        [
            "$H",
            o1
        ],
        [
            "$W",
            f1
        ],
        [
            "$M",
            v1
        ],
        [
            "$y",
            D1
        ],
        [
            "$D",
            S1
        ]
    ].forEach(function(e26) {
        A1[e26[1]] = function(n27) {
            return this.$g(n27, e26[0], e26[1]);
        };
    }), w1.extend = function(e27, n28) {
        return e27.$i || (e27(n28, C1, w1), e27.$i = !0), w1;
    }, w1.locale = W1, w1.isDayjs = p2, w1.unix = function(e28) {
        return w1(1000 * e28);
    }, w1.en = L1[H1], w1.Ls = L1, w1.p = {}, w1;
});
var r1 = n1;
var r2 = "undefined" !== typeof globalThis ? globalThis : "undefined" !== typeof self ? self : global;
var t1 = {};
!function(r, n12) {
    t1 = n12();
}(0, function() {
    return function(t11, n2, e1) {
        t11 = t11 || {};
        var o1 = n2.prototype, a6 = {
            future: "in %s",
            past: "%s ago",
            s: "a few seconds",
            m: "a minute",
            mm: "%d minutes",
            h: "an hour",
            hh: "%d hours",
            d: "a day",
            dd: "%d days",
            M: "a month",
            MM: "%d months",
            y: "a year",
            yy: "%d years"
        };
        function i14(r11, t2, n3, e4) {
            return o1.fromToBase(r11, t2, n3, e4);
        }
        e1.en.relativeTime = a6, o1.fromToBase = function(r21, n4, o3, u6, f3) {
            for(var s11, l3, h3, m2 = o3.$locale().relativeTime || a6, c3 = t11.thresholds || [
                {
                    l: "s",
                    r: 44,
                    d: "second"
                },
                {
                    l: "m",
                    r: 89
                },
                {
                    l: "mm",
                    r: 44,
                    d: "minute"
                },
                {
                    l: "h",
                    r: 89
                },
                {
                    l: "hh",
                    r: 21,
                    d: "hour"
                },
                {
                    l: "d",
                    r: 35
                },
                {
                    l: "dd",
                    r: 25,
                    d: "day"
                },
                {
                    l: "M",
                    r: 45
                },
                {
                    l: "MM",
                    r: 10,
                    d: "month"
                },
                {
                    l: "y",
                    r: 17
                },
                {
                    l: "yy",
                    d: "year"
                }
            ], y2 = c3.length, v3 = 0; v3 < y2; v3 += 1){
                var p3 = c3[v3];
                p3.d && (s11 = u6 ? e1(r21).diff(o3, p3.d, !0) : o3.diff(r21, p3.d, !0));
                var M2 = (t11.rounding || Math.round)(Math.abs(s11));
                if (h3 = s11 > 0, M2 <= p3.r || !p3.r) {
                    M2 <= 1 && v3 > 0 && (p3 = c3[v3 - 1]);
                    var g6 = m2[p3.l];
                    f3 && (M2 = f3("" + M2)), l3 = "string" == typeof g6 ? g6.replace("%d", M2) : g6(M2, n4, p3.l, h3);
                    break;
                }
            }
            if (n4) return l3;
            var T6 = h3 ? m2.future : m2.past;
            return "function" == typeof T6 ? T6(l3) : T6.replace("%s", l3);
        }, o1.to = function(t3, n5) {
            return i14(t3, n5, this || r2, !0);
        }, o1.from = function(t4, n6) {
            return i14(t4, n6, this || r2);
        };
        var d4 = function(r3) {
            return r3.$u ? e1.utc() : e1();
        };
        o1.toNow = function(t5) {
            return this.to(d4(this || r2), t5);
        }, o1.fromNow = function(t6) {
            return this.from(d4(this || r2), t6);
        };
    };
});
var n2 = t1;
const { Helmet: Helmet1  } = ze;
function Readme({ __html  }) {
    return xt("jspm-readme", null, xt("div", {
        innerHTML: {
            __dangerousHtml: __html
        }
    }), xt(Helmet1, null, xt("style", {
        "data-component-name": "jspm-readme"
    }, `
            jspm-readme img {
              max-width: 100%;
            }
          `)));
}
const { Helmet: Helmet2  } = ze;
function Seperator() {
    return xt("div", null, xt("div", {
        class: "seperator-seperator"
    }, xt("div", {
        class: "seperator-container"
    }), xt("div", {
        class: "seperator-container1"
    }), xt("div", {
        class: "seperator-container2"
    }), xt("div", {
        class: "seperator-container3"
    })), xt(Helmet2, null, xt("style", {
        "data-component-name": "seperator"
    }, `
        .seperator-seperator {
            flex: 0 0 auto;
            width: 100%;
            height: auto;
            display: flex;
            margin-top: var(--dl-space-space-unit);
            align-items: center;
            margin-bottom: var(--dl-space-space-unit);
          }
          .seperator-container {
            flex: 0 0 auto;
            width: 50px;
            height: 8px;
            display: flex;
            align-items: flex-start;
            background-color: var(--dl-color-jspm-500);
            border-top-left-radius: var(--dl-radius-radius-radius8);
            border-bottom-left-radius: var(--dl-radius-radius-radius8);
          }
          .seperator-container1 {
            flex: 0 0 auto;
            width: 50px;
            height: 8px;
            display: flex;
            align-items: flex-start;
            background-color: var(--dl-color-jspm-400);
          }
          .seperator-container2 {
            flex: 0 0 auto;
            width: 50px;
            height: 8px;
            display: flex;
            align-items: flex-start;
            background-color: var(--dl-color-jspm-300);
          }
          .seperator-container3 {
            flex: 0 0 auto;
            width: 50px;
            height: 8px;
            display: flex;
            align-items: flex-start;
            background-color: var(--dl-color-jspm-200);
            border-top-right-radius: var(--dl-radius-radius-radius8);
            border-bottom-right-radius: var(--dl-radius-radius-radius8);
          }
        `)));
}
const { Helmet: Helmet3  } = ze;
function Aside({ license , name: name1 , version , exports , downloads , updated , type , types , features: features1 , created , links , maintainers ,  }) {
    return xt("jspm-aside", null, xt("aside", null, xt("jspm-created", null, xt("h3", null, "Created"), created), xt("jspm-weekly-updated", null, xt("h3", null, "Updated"), updated), xt("jspm-weekly-downloads", null, xt("h3", null, "Downloads (weekly)"), downloads), xt("jspm-features", null, xt("h3", null, "Features"), Object.entries(features1).map(([feature, supported])=>xt("ul", null, xt("li", {
            "data-feature-supported": supported
        }, feature))
    )), xt("div", null, xt("h3", null, "License"), xt("jspm-license", null, license), xt(Seperator, null)), xt("jspm-links", null, xt("h3", null, "Links"), Object.entries(links).map(([text, link])=>link && xt("jspm-link", null, xt("h5", null, text), xt("a", {
            href: link
        }, link))
    )), xt("jspm-maintainers", null, xt("h3", null, "Collaborators"), maintainers.map(({ name , email  })=>xt("jspm-maintainer", null, xt("figure", null, xt("img", {
            src: `https://unavatar.io/${email}`
        })), name)
    ))), xt(Helmet3, null, xt("style", {
        "data-component-name": "jspm-aside"
    }, `
          jspm-features li{
            padding-inline-start: 1ch;
          }
          jspm-features li[data-feature-supported="true"]{
            list-style-type: '✔';
          }
          jspm-features li[data-feature-supported="false"]{
            list-style-type: '✖';
          }
          jspm-maintainer {
            display: flex;
            justify-content: space-between;
            flex-wrap: nowrap;
            align-content: center;
            align-items: center;
          }
          jspm-maintainer figure{
            width: 80px;
            display: inline-block;
          }
          jspm-maintainer figure img{
            width: 100%;
            display: block;
          }
          `)));
}
const { Helmet: Helmet4  } = ze;
function Logo({ name , version  }) {
    return xt("jspm-logo", null, xt("h1", null, xt("a", {
        href: "/"
    }, "JSPM")), xt(Helmet4, null, xt("style", {
        "data-component-name": "header"
    }, `
            jspm-logo {
              margin-right: var(--dl-space-space-unit);
            }

            jspm-logo h1 a {
              background: url(https://jspm.org/jspm.png) no-repeat left center;
              color: var(--dl-color-gray-black);
              background-size: contain;
              padding-left: 2.5rem;
            }
          `)));
}
const { Helmet: Helmet5  } = ze;
function Search(params) {
    return xt("jspm-search", null, xt("form", null, xt("input", {
        type: "search",
        autofocus: "true",
        placeholder: "Package",
        autocomplete: "on",
        class: "header-textinput search_input",
        name: "q"
    }), xt("button", {
        class: "search_button"
    }, xt("span", null, "Import"))), xt(Helmet5, null, xt("style", {
        "data-component-name": "jspm-nav"
    }, `
          jspm-search, jspm-search form{
            display: flex;
          }
          .search_button {
            color: var(--dl-color-gray-black);
            display: inline-block;
            padding: 0.5rem 1rem;
            border-color: var(--dl-color-gray-black);
            border-width: 1px;
            height: 40px;
            display: flex;
            align-items: center;
            border-width: 0px;
            padding-left: var(--dl-space-space-oneandhalfunits);
            padding-right: var(--dl-space-space-oneandhalfunits);
            background-color: var(--dl-color-primary-js-primary);
            border-top-left-radius: none;
            border-top-right-radius: var(--dl-radius-radius-radius8);
            border-bottom-left-radius: none;
            border-bottom-right-radius: var(--dl-radius-radius-radius8);
        }
          
          .search_input {
            color: var(--dl-color-gray-black);
            cursor: auto;
            padding: 0.5rem 1rem;
            border-color: var(--dl-color-gray-black);
            border-width: 1px;
            background-color: var(--dl-color-gray-white);
            height: 40px;
            padding: var(--dl-space-space-halfunit);
            max-width: 500px;
            border-color: var(--dl-color-jspm-placeholder);
            background-color: var(--dl-color-jspm-placeholder);
            border-top-left-radius: var(--dl-radius-radius-radius8);
            border-bottom-left-radius: var(--dl-radius-radius-radius8);
          }
          jspm-nav nav ul {
              display: flex;
            list-style: none;
          }
          jspm-nav nav ul li{
              margin: 20px;
          }
          `)));
}
const { Helmet: Helmet6  } = ze;
function Nav({ generatorHash ="" , dependencies =[] , open , toggleImportmapDialog  }) {
    return xt("div", null, xt("nav", null, xt("ul", {
        class: "nav-list-style"
    }, xt("li", {
        class: "nav-list-item"
    }, xt("a", {
        target: "_blank",
        href: `https://generator.jspm.io/${generatorHash}`
    }, "Generator")), xt("li", {
        class: "nav-list-item"
    }, xt("a", {
        href: "https://jspm.org/docs/cdn"
    }, "Docs")), xt("li", {
        class: "nav-list-item"
    }, xt("a", {
        href: "https://jspm.org/sandbox"
    }, "Sandbox")), xt("li", {
        class: "nav-list-item"
    }, xt("a", {
        href: "https://github.com/jspm/generator"
    }, "Github")), xt("li", {
        class: "nav-list-item"
    }, xt("button", {
        class: "toggle-dialog",
        title: "Explore Importmap",
        onClick: toggleImportmapDialog
    }, "[", dependencies === null || dependencies === void 0 ? void 0 : dependencies.length, "]")))), xt(Helmet6, null, xt("style", {
        "data-component-name": "jspm-nav"
    }, `
          .nav-list-style {
              display: flex;
              list-style: none;
          }

          .nav-list-item {
              margin-right: var(--dl-space-space-twounits);
          }
          .nav-list-item .toggle-dialog{
            background: transparent url('/icon-distributed.png') left center no-repeat;
            background-size: contain;
            padding-left: 25px;
            border: 0;
            cursor: pointer;
            color: crimson;
          }
          `)));
}
const { Helmet: Helmet7  } = ze;
function Header({ generatorHash ="" , dependencies =[] , open , toggleImportmapDialog  }) {
    return xt("jspm-header", null, xt("header", {
        class: "header"
    }, xt("div", {
        class: "header"
    }, xt(Logo, null), xt(Search, null)), xt(Nav, {
        generatorHash: generatorHash,
        dependencies: dependencies,
        open: open,
        toggleImportmapDialog: toggleImportmapDialog
    })), xt(Helmet7, null, xt("style", {
        "data-component-name": "header"
    }, `
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              flex-wrap: wrap;
              align-content: center;
            }

            @media(max-width: 768px) {
              .header {
                justify-content: center;
              }
            }
          `)));
}
const { Helmet: Helmet8  } = ze;
function Footer() {
    return xt("div", null, xt("div", {
        class: "footer-container"
    }, xt("footer", {
        class: "footer-footer"
    }, xt("div", {
        class: "footer-container1"
    }, xt("img", {
        alt: "image",
        src: "https://jspm-registry.teleporthq.app/playground_assets/jspm.png",
        class: "footer-image"
    }), xt("div", {
        class: "footer-container2"
    }, xt("div", {
        class: "footer-product-container"
    }, xt("span", {
        class: "footer-text"
    }, "Docs"), xt("span", {
        class: "footer-text01"
    }, "Get Started"), xt("span", {
        class: "footer-text02"
    }, "Workspace"), xt("span", {
        class: "footer-text03"
    }, ".npmrc")), xt("div", {
        class: "footer-company-container"
    }, xt("span", {
        class: "footer-text04"
    }, "Community"), xt("span", {
        class: "footer-text05"
    }, "Getting Started"), xt("span", {
        class: "footer-text06"
    }, "Workspace"), xt("span", {
        class: "footer-text07"
    }, ".npmrc")), xt("div", {
        class: "footer-company-container1"
    }, xt("span", {
        class: "footer-text08"
    }, "Contributing"), xt("span", {
        class: "footer-text09"
    }, "Getting Started"), xt("span", {
        class: "footer-text10"
    }, "Workspace"), xt("span", {
        class: "footer-text11"
    }, ".npmrc")))), xt("div", {
        class: "footer-separator"
    }), xt("div", {
        class: "footer-copyright"
    }, xt("span", {
        class: "footer-text12"
    }, xt("span", null, "Copyright \xa9 2015-2021")), xt("div", {
        class: "footer-socials"
    }, xt("span", {
        class: "footer-text14"
    }, "Follow Us"), xt("div", {
        class: "footer-icon-group"
    }, xt("img", {
        alt: "image",
        src: "https://jspm-registry.teleporthq.app/playground_assets/github.svg",
        class: "footer-image1"
    }), xt("svg", {
        viewBox: "0 0 950.8571428571428 1024",
        class: "footer-icon"
    }, xt("path", {
        d: "M925.714 233.143c-25.143 36.571-56.571 69.143-92.571 95.429 0.571 8 0.571 16 0.571 24 0 244-185.714 525.143-525.143 525.143-104.571 0-201.714-30.286-283.429-82.857 14.857 1.714 29.143 2.286 44.571 2.286 86.286 0 165.714-29.143 229.143-78.857-81.143-1.714-149.143-54.857-172.571-128 11.429 1.714 22.857 2.857 34.857 2.857 16.571 0 33.143-2.286 48.571-6.286-84.571-17.143-148-91.429-148-181.143v-2.286c24.571 13.714 53.143 22.286 83.429 23.429-49.714-33.143-82.286-89.714-82.286-153.714 0-34.286 9.143-65.714 25.143-93.143 90.857 112 227.429 185.143 380.571 193.143-2.857-13.714-4.571-28-4.571-42.286 0-101.714 82.286-184.571 184.571-184.571 53.143 0 101.143 22.286 134.857 58.286 41.714-8 81.714-23.429 117.143-44.571-13.714 42.857-42.857 78.857-81.143 101.714 37.143-4 73.143-14.286 106.286-28.571z"
    }))))))), xt(Helmet8, null, xt("style", {
        "data-component-name": "footer"
    }, `
        .footer-container {
            width: 100%;
            display: flex;
            position: relative;
            align-items: flex-start;
            flex-direction: column;
            background-color: var(--dl-color-jspm-footer);
          }
          .footer-footer {
            width: 100%;
            display: flex;
            max-width: var(--dl-size-size-maxwidth);
            align-items: center;
            padding-top: var(--dl-space-space-twounits);
            padding-left: var(--dl-space-space-threeunits);
            padding-right: var(--dl-space-space-threeunits);
            flex-direction: column;
            padding-bottom: var(--dl-space-space-twounits);
            justify-content: space-between;
            background-color: var(--dl-color-gray-900);
            margin-top: var(--dl-space-space-unit);
          }
          .footer-container1 {
            width: 100%;
            display: flex;
            align-items: flex-start;
            flex-direction: row;
            justify-content: center;
          }
          .footer-image {
            width: 45px;
            object-fit: cover;
            margin-right: var(--dl-space-space-oneandhalfunits);
          }
          .footer-container2 {
            display: flex;
            align-items: flex-start;
            margin-right: 5rem;
            flex-direction: row;
            justify-content: space-between;
            flex-wrap: wrap;
          }
          .footer-product-container {
            flex: 0 0 auto;
            display: flex;
            align-items: flex-start;
            margin-right: 5rem;
            flex-direction: column;
            justify-content: flex-start;
          }
          .footer-text {
            font-weight: 700;
            margin-bottom: var(--dl-space-space-oneandhalfunits);
          }
          .footer-text01 {
            margin-bottom: var(--dl-space-space-unit);
          }
          .footer-text02 {
            margin-bottom: var(--dl-space-space-unit);
          }
          .footer-text03 {
            margin-bottom: var(--dl-space-space-unit);
          }
          .footer-company-container {
            flex: 0 0 auto;
            display: flex;
            align-items: flex-start;
            margin-right: 5rem;
            flex-direction: column;
            justify-content: flex-start;
          }
          .footer-text04 {
            font-weight: 700;
            margin-bottom: var(--dl-space-space-oneandhalfunits);
          }
          .footer-text05 {
            margin-bottom: var(--dl-space-space-unit);
          }
          .footer-text06 {
            margin-bottom: var(--dl-space-space-unit);
          }
          .footer-text07 {
            margin-bottom: var(--dl-space-space-unit);
          }
          .footer-company-container1 {
            flex: 0 0 auto;
            display: flex;
            align-items: flex-start;
            flex-direction: column;
            justify-content: flex-start;
          }
          .footer-text08 {
            font-weight: 700;
            margin-bottom: var(--dl-space-space-oneandhalfunits);
          }
          .footer-text09 {
            margin-bottom: var(--dl-space-space-unit);
          }
          .footer-text10 {
            margin-bottom: var(--dl-space-space-unit);
          }
          .footer-text11 {
            margin-bottom: var(--dl-space-space-unit);
          }
          .footer-separator {
            width: 100%;
            height: 1px;
            margin-top: var(--dl-space-space-twounits);
            margin-bottom: var(--dl-space-space-twounits);
            background-color: var(--dl-color-gray-900);
          }
          .footer-copyright {
            flex: 0 0 auto;
            width: 100%;
            height: auto;
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
          }
          .footer-text12 {
            align-self: center;
          }
          .footer-socials {
            display: flex;
            align-items: center;
            flex-direction: row;
            justify-content: flex-start;
          }
          .footer-text14 {
            font-style: normal;
            font-weight: 400;
            margin-right: var(--dl-space-space-unit);
            margin-bottom: 0px;
          }
          .footer-icon-group {
            display: flex;
            align-items: center;
            flex-direction: row;
            justify-content: space-between;
          }
          .footer-image1 {
            width: var(--dl-size-size-xsmall);
            height: var(--dl-size-size-xsmall);
            object-fit: cover;
            margin-right: var(--dl-space-space-unit);
          }
          .footer-icon {
            width: var(--dl-size-size-xsmall);
            height: var(--dl-size-size-xsmall);
            margin-left: 0px;
            margin-right: 0px;
          }
          
          @media(max-width: 991px) {
            .footer-footer {
              flex-direction: column;
            }
            .footer-container2 {
              margin-right: var(--dl-space-space-fourunits);
            }
            .footer-product-container {
              margin-right: var(--dl-space-space-fourunits);
            }
          }
          @media(max-width: 767px) {
            .footer-footer {
              padding-left: var(--dl-space-space-twounits);
              padding-right: var(--dl-space-space-twounits);
            }
            .footer-container1 {
              align-items: center;
              flex-direction: column;
              justify-content: space-between;
            }
            .footer-image {
              display: none;
            }
            .footer-container2 {
              margin-right: var(--dl-space-space-fourunits);
            }
            .footer-product-container {
              margin-right: var(--dl-space-space-fourunits);
            }
          }
          @media(max-width: 479px) {
            .footer-footer {
              padding: var(--dl-space-space-unit);
            }
            .footer-container1 {
              align-items: center;
              flex-direction: column;
            }
            .footer-container2 {
              margin-right: 0px;
            }
            .footer-text12 {
              text-align: center;
            }
          }          
        `)));
}
function _extends() {
    _extends = Object.assign || function(target) {
        for(var i15 = 1; i15 < arguments.length; i15++){
            var source = arguments[i15];
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
const { Helmet: Helmet9  } = ze;
function fromPkgStr(pkg) {
    const versionIndex = pkg.indexOf("@", 1);
    const name = pkg.slice(0, versionIndex);
    let subpathIndex = pkg.indexOf("/", versionIndex);
    if (subpathIndex === -1) {
        subpathIndex = pkg.length;
    }
    const version = pkg.slice(versionIndex + 1, subpathIndex);
    const subpath = "." + pkg.slice(name.length + version.length + 1);
    return {
        name,
        version,
        subpath
    };
}
function ImportMapDialog({ generatorHash ="" , dependencies =[] , open: dialogOpen , toggleImportmapDialog , toggleExportSelection ,  }) {
    const shouldOpen = dialogOpen && dependencies.length > 0;
    const open = shouldOpen ? {
        open: shouldOpen
    } : {};
    let map = {};
    dependencies.forEach((dependency)=>{
        const { name , version , subpath  } = fromPkgStr(dependency);
        if (typeof map[name] === "undefined") {
            map[name] = {
                [version]: []
            };
        }
        if (typeof map[name][version] === "undefined") {
            map[name][version] = [];
        }
        map[name][version] = [
            ...map[name][version],
            subpath
        ];
    });
    return xt("jspm-importmap-dialog", null, xt("dialog", _extends({}, open), xt("button", {
        class: "icon-close",
        onClick: toggleImportmapDialog
    }, "\u2715"), generatorHash && xt("h4", null, xt("a", {
        target: "_blank",
        href: `https://generator.jspm.io/${generatorHash}`
    }, "Customize importmap at JSPM Generator")), Object.entries(map).map(([name, versions])=>{
        const mapEntries = Object.entries(versions);
        if (mapEntries.length === 1) {
            const [version, subpaths] = mapEntries[0];
            return xt("details", null, xt("summary", null, xt("jspm-importmap-entry-summary", null, xt("jspm-importmap-entry-name", null, name), xt("jspm-importmap-entry-version", {
                class: "code"
            }, "v", version))), xt("ol", null, subpaths.map((subpath)=>xt("li", null, xt("jspm-importmap-entry", null, xt("jspm-importmap-entry-subpath", {
                    class: "code"
                }, subpath), xt("button", {
                    onClick: toggleExportSelection,
                    value: `${name}@${version}${subpath.slice(1)}`
                }, "\u2212 Remove")))
            )));
        }
        return xt("details", null, xt("summary", null, xt("jspm-importmap-entry-summary", null, name)), mapEntries.map(([version, subpaths])=>{
            return xt("details", null, xt("summary", null, xt("jspm-importmap-entry-version", {
                class: "code"
            }, "v", version)), xt("ol", null, subpaths.map((subpath)=>xt("li", null, xt("jspm-importmap-entry", null, subpath, xt("button", {
                    onClick: toggleExportSelection,
                    value: `${name}@${version}${subpath.slice(1)}`
                }, "\u2212 Remove")))
            )));
        }));
    })), xt(Helmet9, null, xt("style", {
        "data-component-name": "jspm-importmap-dialog"
    }, `
          jspm-importmap-dialog dialog  {
            min-height: 100vh;
            min-width: 350px;
            background: white;
            left: unset;
            border: 0 solid black;

            
            border-radius: 0;
            /*background: linear-gradient(225deg, #e6e6e6, #ffffff);*/
            /*box-shadow:  -5px 5px 10px #d9d9d9, 5px -5px 10px #ffffff;*/
            box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px;
          }
          jspm-importmap-dialog dialog details  {
            margin: 15px;
            padding: 10px;
            -webkit-border-radius: 50px;
            border-radius: 10px;
            background: #ffffff;
            -webkit-box-shadow: 12px 12px 24px #d9d9d9, -12px -12px 24px #ffffff;
            box-shadow: -12px 12px 24px #d9d9d9, -12px -12px 24px #ffffff;
          }
          jspm-importmap-dialog dialog details summary, jspm-importmap-entry-summary{
            padding: 10px;
            cursor: pointer;
            display: flex;
            align-content: center;
            justify-content: space-between;
            align-items: center;
          }
          jspm-importmap-dialog dialog details summary:after{
            content: '›';
            margin-right: 10px;
            font-weight: 700;
            font-size: 1.2rem;
          }
          jspm-importmap-dialog dialog details[open] summary:after{
            content: '⌄';
          }
          jspm-importmap-entry-name{
            font-weight: 700;
          }
          jspm-importmap-entry-version{
            margin-left: 10px;
          }
          jspm-importmap-dialog dialog .icon-close{
            background: white;
            border: 2px solid black;
            background: black;
            color: var(--dl-color-primary-js-primary);
            cursor: pointer;
          }
          jspm-importmap-entry{
            display: flex;
            align-content: center;
            justify-content: space-between;
            align-items: center;
          }
          jspm-importmap-entry button{
            background: white;
            border: none;
            cursor: pointer;
            color: crimson;
          }
          `)));
}
const { Helmet: Helmet10  } = ze;
function Package({ name , description , keywords , version , homepage , license , files , exports , readme , generatorHash , selectedDeps , downloads , created , updated , type , types , features: features2 , links , maintainers , toggleExportSelection , openImportmapDialog , toggleImportmapDialog ,  }) {
    return xt("jspm-package", null, xt(ImportMapDialog, {
        generatorHash: generatorHash,
        dependencies: selectedDeps,
        open: openImportmapDialog,
        toggleImportmapDialog: toggleImportmapDialog,
        toggleExportSelection: toggleExportSelection
    }), xt(Header, {
        generatorHash: generatorHash,
        dependencies: selectedDeps,
        open: openImportmapDialog,
        toggleImportmapDialog: toggleImportmapDialog
    }), xt("jspm-package-hero", {
        "data-exports": JSON.stringify(exports),
        "data-name": name,
        "data-version": version,
        "data-description": description,
        "data-updated": updated,
        "data-types": types
    }, xt("jspm-highlight", null, xt("h2", null, name), xt("div", null, xt("span", null, version), "\u2022", xt("span", null, "Published ", updated)), xt("div", null), xt("h3", null, description))), xt("jspm-content", null, xt("main", null, xt("jspm-package-exports", null, xt("h4", null, "Package exports"), xt("ul", {
        class: "code"
    }, exports.map((subpath)=>{
        const packageExport = `${name}@${version}${subpath.slice(1)}`;
        const addedToImportMap = selectedDeps === null || selectedDeps === void 0 ? void 0 : selectedDeps.includes(packageExport);
        return xt("li", null, `${name}${subpath.slice(1)}`, toggleExportSelection && xt("button", {
            type: "button",
            onClick: toggleExportSelection,
            value: packageExport
        }, addedToImportMap ? "− Remove from importmap" : "+ Add to importmap"));
    }))), xt(Readme, {
        __html: readme
    })), xt(Aside, {
        created: created,
        updated: updated,
        downloads: downloads,
        version: version,
        name: name,
        license: license,
        files: files,
        exports: exports,
        keywords: keywords,
        type: type,
        types: types,
        features: features2,
        links: links,
        maintainers: maintainers
    })), xt(Footer, null), xt(Helmet10, null, xt("link", {
        rel: "stylesheet",
        href: "https://ga.jspm.io/npm:prismjs@1.25.0/themes/prism.css"
    }), xt("style", {
        "data-page": "package-details"
    }, `
          jspm-package{
            display: block;
            max-width: 1140px;
            margin: 0 auto;
          }
          jspm-highlight{
            text-align: center;
          }
          jspm-highlight h2{
            font-family: 'Source Sans Pro', sans-serif;
          }
        jspm-content {
          display: grid;
          grid-template-columns: minmax(800px, 1fr) minmax(350px, 1fr);
          grid-gap: 1rem;
        }
        
        jspm-readme {
          min-width: 800px;
          display: block;
          padding: var(--dl-space-space-oneandhalfunits);
        }
        
        jspm-aside {
          padding: var(--dl-space-space-oneandhalfunits);
        }
        
        jspm-name,
        jspm-version,
        jspm-description,
        jspm-license {
          display: block;
        }
        
        jspm-name h1 {
          font-family: "Major Mono Display", monospace;
          font-size: var(--step-5);
        }
        
        jspm-name h1 a {
          color: black;
        }

        @media(max-width: 767px) {
          jspm-content {
            justify-content: space-between;
          }

          jspm-readme {
            width: 100%;
          }
        }
        jspm-package-exports ul{
          margin: 0;
          padding: 0;
        }
        jspm-package-exports ul li{
          display: flex;
          align-content: center;
          justify-content: space-between;
          align-items: center;
          padding: 5px;
          margin: 10px;
          border-bottom: 1px dotted #ccc;
        }
        jspm-package-exports ul li button{
          background: var(--dl-color-primary-js-primary);
          color: black;
          padding: 10px;
          display: inline-block;
          border: 3px solid black;
          min-width: 250px;
          font-family: "Bebas Neue", cursive;
        }
        `)));
}
function SsrRoot({ created , downloads , exports , features: features3 , license , links , maintainers , name , readme , updated , version ,  }) {
    return xt("jspm-package-root", {
        "data-name": name,
        "data-version": version,
        "data-exports": JSON.stringify(exports),
        "data-features": JSON.stringify(features3),
        "data-links": JSON.stringify(links),
        "data-maintainers": JSON.stringify(maintainers),
        "data-readme": readme
    }, xt(Package, {
        created: created,
        downloads: downloads,
        exports: exports,
        features: features3,
        license: license,
        links: links,
        name: name,
        readme: readme,
        maintainers: maintainers,
        updated: updated,
        version: version
    }));
}
const { Helmet: Helmet11  } = ze;
function FeaturedPackages({ packages =[]  }) {
    return xt("div", {
        id: "featured-packages"
    }, xt("ul", {
        class: "list-style"
    }, packages.map(({ name , description , version  })=>{
        return xt("li", {
            class: "package-item-wrapper"
        }, xt("a", {
            class: "package-name",
            href: `/package/${name}@${version}`
        }, name, " ", xt("span", {
            class: "package-version"
        }, version)), xt("span", {
            class: "description"
        }, description));
    })), xt(Helmet11, null, xt("style", {
        "data-component-name": "featured-packages"
    }, `
          .list-style {
            list-style: none;
            padding-left: 0px;
            margin: 0px;
            width: 100%;
          }
          
          .package-item-wrapper {
            font-weight: 200;
            margin: var(--dl-space-space-unit);
          }

          .package-version {
            font-weight: 200;
            font-size: var(--dl-space-space-unit);
          }

          .package-name {
            display: block;
            font-size: var(--dl-space-space-oneandhalfunits);
            font-family: 'Inter';
            font-weight: 400;
            margin-bottom: var(--dl-space-space-halfunit);
          }

          .description {
            overflow: hidden;
            white-space: normal;
            word-break: break-word;
            line-height: 1.5;
          }

        `)));
}
const { Helmet: Helmet12  } = ze;
function Home({ packages  }) {
    return xt("jspm-home", null, xt("jspm-home-header", null, xt(Header, null)), xt("jspm-home-main", null, xt("main", null, xt(FeaturedPackages, {
        packages: packages
    }))), xt("jspm-home-footer", null, xt(Footer, null)), xt(Helmet12, null, xt("style", {
        "data-component-name": "jspm-home"
    }, `
          
        `)));
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
function get(alias2) {
    return byAlias[stripColons(alias2)]?.emoji;
}
function emojify(str) {
    if (!str) return "";
    return str.split(reEmojiName).map((s12, i16)=>{
        if (i16 % 2 === 0) return s12;
        let emoji7 = get(s12);
        if (!emoji7) emoji7 = wrapColons(s12);
        return emoji7;
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
let e1 = getDefaults();
function changeDefaults(t12) {
    e1 = t12;
}
const t2 = /[&<>"']/;
const n3 = /[&<>"']/g;
const r3 = /[<>"']|&(?!#?\w+;)/;
const s1 = /[<>"']|&(?!#?\w+;)/g;
const i1 = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
};
const getEscapeReplacement = (e11)=>i1[e11]
;
function escape(e2, i17) {
    if (i17) {
        if (t2.test(e2)) return e2.replace(n3, getEscapeReplacement);
    } else if (r3.test(e2)) return e2.replace(s1, getEscapeReplacement);
    return e2;
}
const l1 = /&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/gi;
function unescape(e3) {
    return e3.replace(l1, (e, t21)=>{
        t21 = t21.toLowerCase();
        return "colon" === t21 ? ":" : "#" === t21.charAt(0) ? "x" === t21.charAt(1) ? String.fromCharCode(parseInt(t21.substring(2), 16)) : String.fromCharCode(+t21.substring(1)) : "";
    });
}
const a1 = /(^|[^\[])\^/g;
function edit(e4, t3) {
    e4 = e4.source || e4;
    t3 = t3 || "";
    const n13 = {
        replace: (t4, r12)=>{
            r12 = r12.source || r12;
            r12 = r12.replace(a1, "$1");
            e4 = e4.replace(t4, r12);
            return n13;
        },
        getRegex: ()=>new RegExp(e4, t3)
    };
    return n13;
}
const o1 = /[^\w:]/g;
const c1 = /^$|^[a-z][a-z0-9+.-]*:|^[?#]/i;
function cleanUrl(e5, t5, n21) {
    if (e5) {
        let e6;
        try {
            e6 = decodeURIComponent(unescape(n21)).replace(o1, "").toLowerCase();
        } catch (e) {
            return null;
        }
        if (0 === e6.indexOf("javascript:") || 0 === e6.indexOf("vbscript:") || 0 === e6.indexOf("data:")) return null;
    }
    t5 && !c1.test(n21) && (n21 = resolveUrl(t5, n21));
    try {
        n21 = encodeURI(n21).replace(/%25/g, "%");
    } catch (e) {
        return null;
    }
    return n21;
}
const h1 = {};
const p1 = /^[^:]+:\/*[^/]*$/;
const u1 = /^([^:]+:)[\s\S]*$/;
const g1 = /^([^:]+:\/*[^/]*)[\s\S]*$/;
function resolveUrl(e7, t6) {
    h1[" " + e7] || (p1.test(e7) ? h1[" " + e7] = e7 + "/" : h1[" " + e7] = rtrim(e7, "/", true));
    e7 = h1[" " + e7];
    const n31 = -1 === e7.indexOf(":");
    return "//" === t6.substring(0, 2) ? n31 ? t6 : e7.replace(u1, "$1") + t6 : "/" === t6.charAt(0) ? n31 ? t6 : e7.replace(g1, "$1") + t6 : e7 + t6;
}
const d1 = {
    exec: function noopTest() {}
};
function merge(e8) {
    let t7, n4, r22 = 1;
    for(; r22 < arguments.length; r22++){
        t7 = arguments[r22];
        for(n4 in t7)Object.prototype.hasOwnProperty.call(t7, n4) && (e8[n4] = t7[n4]);
    }
    return e8;
}
function splitCells(e9, t8) {
    const n5 = e9.replace(/\|/g, (e, t9, n6)=>{
        let r4 = false, s2 = t9;
        while(--s2 >= 0 && "\\" === n6[s2])r4 = !r4;
        return r4 ? "|" : " |";
    }), r31 = n5.split(/ \|/);
    let s13 = 0;
    r31[0].trim() || r31.shift();
    r31.length > 0 && !r31[r31.length - 1].trim() && r31.pop();
    if (r31.length > t8) r31.splice(t8);
    else while(r31.length < t8)r31.push("");
    for(; s13 < r31.length; s13++)r31[s13] = r31[s13].trim().replace(/\\\|/g, "|");
    return r31;
}
function rtrim(e10, t10, n7) {
    const r5 = e10.length;
    if (0 === r5) return "";
    let s3 = 0;
    while(s3 < r5){
        const i2 = e10.charAt(r5 - s3 - 1);
        if (i2 !== t10 || n7) {
            if (i2 === t10 || !n7) break;
            s3++;
        } else s3++;
    }
    return e10.substr(0, r5 - s3);
}
function findClosingBracket(e11, t11) {
    if (-1 === e11.indexOf(t11[1])) return -1;
    const n8 = e11.length;
    let r6 = 0, s4 = 0;
    for(; s4 < n8; s4++)if ("\\" === e11[s4]) s4++;
    else if (e11[s4] === t11[0]) r6++;
    else if (e11[s4] === t11[1]) {
        r6--;
        if (r6 < 0) return s4;
    }
    return -1;
}
function checkSanitizeDeprecation(e12) {
    e12 && e12.sanitize && !e12.silent && console.warn("marked(): sanitize and sanitizer parameters are deprecated since version 0.7.0, should not be used and will be removed in the future. Read more here: https://marked.js.org/#/USING_ADVANCED.md#options");
}
function repeatString(e13, t12) {
    if (t12 < 1) return "";
    let n9 = "";
    while(t12 > 1){
        1 & t12 && (n9 += e13);
        t12 >>= 1;
        e13 += e13;
    }
    return n9 + e13;
}
function outputLink(e14, t13, n10, r7) {
    const s5 = t13.href;
    const i3 = t13.title ? escape(t13.title) : null;
    const l11 = e14[1].replace(/\\([\[\]])/g, "$1");
    if ("!" !== e14[0].charAt(0)) {
        r7.state.inLink = true;
        const e15 = {
            type: "link",
            raw: n10,
            href: s5,
            title: i3,
            text: l11,
            tokens: r7.inlineTokens(l11, [])
        };
        r7.state.inLink = false;
        return e15;
    }
    return {
        type: "image",
        raw: n10,
        href: s5,
        title: i3,
        text: escape(l11)
    };
}
function indentCodeCompensation(e16, t14) {
    const n11 = e16.match(/^(\s+)(?:```)/);
    if (null === n11) return t14;
    const r8 = n11[1];
    return t14.split("\n").map((e17)=>{
        const t15 = e17.match(/^\s+/);
        if (null === t15) return e17;
        const [n12] = t15;
        return n12.length >= r8.length ? e17.slice(r8.length) : e17;
    }).join("\n");
}
class Tokenizer {
    constructor(t16){
        this.options = t16 || e1;
    }
    space(e18) {
        const t17 = this.rules.block.newline.exec(e18);
        if (t17 && t17[0].length > 0) return {
            type: "space",
            raw: t17[0]
        };
    }
    code(e19) {
        const t18 = this.rules.block.code.exec(e19);
        if (t18) {
            const e20 = t18[0].replace(/^ {1,4}/gm, "");
            return {
                type: "code",
                raw: t18[0],
                codeBlockStyle: "indented",
                text: this.options.pedantic ? e20 : rtrim(e20, "\n")
            };
        }
    }
    fences(e21) {
        const t19 = this.rules.block.fences.exec(e21);
        if (t19) {
            const e22 = t19[0];
            const n13 = indentCodeCompensation(e22, t19[3] || "");
            return {
                type: "code",
                raw: e22,
                lang: t19[2] ? t19[2].trim() : t19[2],
                text: n13
            };
        }
    }
    heading(e23) {
        const t20 = this.rules.block.heading.exec(e23);
        if (t20) {
            let e24 = t20[2].trim();
            if (/#$/.test(e24)) {
                const t21 = rtrim(e24, "#");
                this.options.pedantic ? e24 = t21.trim() : t21 && !/ $/.test(t21) || (e24 = t21.trim());
            }
            const n14 = {
                type: "heading",
                raw: t20[0],
                depth: t20[1].length,
                text: e24,
                tokens: []
            };
            this.lexer.inline(n14.text, n14.tokens);
            return n14;
        }
    }
    hr(e25) {
        const t22 = this.rules.block.hr.exec(e25);
        if (t22) return {
            type: "hr",
            raw: t22[0]
        };
    }
    blockquote(e26) {
        const t23 = this.rules.block.blockquote.exec(e26);
        if (t23) {
            const e27 = t23[0].replace(/^ *> ?/gm, "");
            return {
                type: "blockquote",
                raw: t23[0],
                tokens: this.lexer.blockTokens(e27, []),
                text: e27
            };
        }
    }
    list(e28) {
        let t24 = this.rules.block.list.exec(e28);
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
            while(e28){
                g11 = false;
                if (!(t24 = m1.exec(e28))) break;
                if (this.rules.block.hr.test(e28)) break;
                n15 = t24[0];
                e28 = e28.substring(n15.length);
                c11 = t24[2].split("\n", 1)[0];
                h11 = e28.split("\n", 1)[0];
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
                    e28 = e28.substring(h11.length + 1);
                    g11 = true;
                }
                if (!g11) {
                    const t25 = new RegExp(`^ {0,${Math.min(3, i4 - 1)}}(?:[*+-]|\\d{1,9}[.)])`);
                    while(e28){
                        p11 = e28.split("\n", 1)[0];
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
                        e28 = e28.substring(p11.length + 1);
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
                const e29 = f1.items[l2].tokens.filter((e32)=>"space" === e32.type
                );
                const t26 = e29.every((e34)=>{
                    const t29 = e34.raw.split("");
                    let n16 = 0;
                    for (const e33 of t29){
                        "\n" === e33 && (n16 += 1);
                        if (n16 > 1) return true;
                    }
                    return false;
                });
                if (!f1.loose && e29.length && t26) {
                    f1.loose = true;
                    f1.items[l2].loose = true;
                }
            }
            return f1;
        }
    }
    html(e35) {
        const t30 = this.rules.block.html.exec(e35);
        if (t30) {
            const e36 = {
                type: "html",
                raw: t30[0],
                pre: !this.options.sanitizer && ("pre" === t30[1] || "script" === t30[1] || "style" === t30[1]),
                text: t30[0]
            };
            if (this.options.sanitize) {
                e36.type = "paragraph";
                e36.text = this.options.sanitizer ? this.options.sanitizer(t30[0]) : escape(t30[0]);
                e36.tokens = [];
                this.lexer.inline(e36.text, e36.tokens);
            }
            return e36;
        }
    }
    def(e37) {
        const t31 = this.rules.block.def.exec(e37);
        if (t31) {
            t31[3] && (t31[3] = t31[3].substring(1, t31[3].length - 1));
            const e38 = t31[1].toLowerCase().replace(/\s+/g, " ");
            return {
                type: "def",
                tag: e38,
                raw: t31[0],
                href: t31[2],
                title: t31[3]
            };
        }
    }
    table(e39) {
        const t32 = this.rules.block.table.exec(e39);
        if (t32) {
            const e40 = {
                type: "table",
                header: splitCells(t32[1]).map((e42)=>({
                        text: e42
                    })
                ),
                align: t32[2].replace(/^ *|\| *$/g, "").split(/ *\| */),
                rows: t32[3] && t32[3].trim() ? t32[3].replace(/\n[ \t]*$/, "").split("\n") : []
            };
            if (e40.header.length === e40.align.length) {
                e40.raw = t32[0];
                let n17 = e40.align.length;
                let r10, s7, i5, l3;
                for(r10 = 0; r10 < n17; r10++)/^ *-+: *$/.test(e40.align[r10]) ? e40.align[r10] = "right" : /^ *:-+: *$/.test(e40.align[r10]) ? e40.align[r10] = "center" : /^ *:-+ *$/.test(e40.align[r10]) ? e40.align[r10] = "left" : e40.align[r10] = null;
                n17 = e40.rows.length;
                for(r10 = 0; r10 < n17; r10++)e40.rows[r10] = splitCells(e40.rows[r10], e40.header.length).map((e43)=>({
                        text: e43
                    })
                );
                n17 = e40.header.length;
                for(s7 = 0; s7 < n17; s7++){
                    e40.header[s7].tokens = [];
                    this.lexer.inlineTokens(e40.header[s7].text, e40.header[s7].tokens);
                }
                n17 = e40.rows.length;
                for(s7 = 0; s7 < n17; s7++){
                    l3 = e40.rows[s7];
                    for(i5 = 0; i5 < l3.length; i5++){
                        l3[i5].tokens = [];
                        this.lexer.inlineTokens(l3[i5].text, l3[i5].tokens);
                    }
                }
                return e40;
            }
        }
    }
    lheading(e44) {
        const t33 = this.rules.block.lheading.exec(e44);
        if (t33) {
            const e45 = {
                type: "heading",
                raw: t33[0],
                depth: "=" === t33[2].charAt(0) ? 1 : 2,
                text: t33[1],
                tokens: []
            };
            this.lexer.inline(e45.text, e45.tokens);
            return e45;
        }
    }
    paragraph(e46) {
        const t34 = this.rules.block.paragraph.exec(e46);
        if (t34) {
            const e47 = {
                type: "paragraph",
                raw: t34[0],
                text: "\n" === t34[1].charAt(t34[1].length - 1) ? t34[1].slice(0, -1) : t34[1],
                tokens: []
            };
            this.lexer.inline(e47.text, e47.tokens);
            return e47;
        }
    }
    text(e48) {
        const t35 = this.rules.block.text.exec(e48);
        if (t35) {
            const e49 = {
                type: "text",
                raw: t35[0],
                text: t35[0],
                tokens: []
            };
            this.lexer.inline(e49.text, e49.tokens);
            return e49;
        }
    }
    escape(e50) {
        const t36 = this.rules.inline.escape.exec(e50);
        if (t36) return {
            type: "escape",
            raw: t36[0],
            text: escape(t36[1])
        };
    }
    tag(e51) {
        const t37 = this.rules.inline.tag.exec(e51);
        if (t37) {
            !this.lexer.state.inLink && /^<a /i.test(t37[0]) ? this.lexer.state.inLink = true : this.lexer.state.inLink && /^<\/a>/i.test(t37[0]) && (this.lexer.state.inLink = false);
            !this.lexer.state.inRawBlock && /^<(pre|code|kbd|script)(\s|>)/i.test(t37[0]) ? this.lexer.state.inRawBlock = true : this.lexer.state.inRawBlock && /^<\/(pre|code|kbd|script)(\s|>)/i.test(t37[0]) && (this.lexer.state.inRawBlock = false);
            return {
                type: this.options.sanitize ? "text" : "html",
                raw: t37[0],
                inLink: this.lexer.state.inLink,
                inRawBlock: this.lexer.state.inRawBlock,
                text: this.options.sanitize ? this.options.sanitizer ? this.options.sanitizer(t37[0]) : escape(t37[0]) : t37[0]
            };
        }
    }
    link(e52) {
        const t38 = this.rules.inline.link.exec(e52);
        if (t38) {
            const e53 = t38[2].trim();
            if (!this.options.pedantic && /^</.test(e53)) {
                if (!/>$/.test(e53)) return;
                const t39 = rtrim(e53.slice(0, -1), "\\");
                if ((e53.length - t39.length) % 2 === 0) return;
            } else {
                const e54 = findClosingBracket(t38[2], "()");
                if (e54 > -1) {
                    const n18 = 0 === t38[0].indexOf("!") ? 5 : 4;
                    const r11 = n18 + t38[1].length + e54;
                    t38[2] = t38[2].substring(0, e54);
                    t38[0] = t38[0].substring(0, r11).trim();
                    t38[3] = "";
                }
            }
            let n19 = t38[2];
            let r12 = "";
            if (this.options.pedantic) {
                const e55 = /^([^'"]*[^\s])\s+(['"])(.*)\2/.exec(n19);
                if (e55) {
                    n19 = e55[1];
                    r12 = e55[3];
                }
            } else r12 = t38[3] ? t38[3].slice(1, -1) : "";
            n19 = n19.trim();
            /^</.test(n19) && (n19 = this.options.pedantic && !/>$/.test(e53) ? n19.slice(1) : n19.slice(1, -1));
            return outputLink(t38, {
                href: n19 ? n19.replace(this.rules.inline._escapes, "$1") : n19,
                title: r12 ? r12.replace(this.rules.inline._escapes, "$1") : r12
            }, t38[0], this.lexer);
        }
    }
    reflink(e56, t40) {
        let n20;
        if ((n20 = this.rules.inline.reflink.exec(e56)) || (n20 = this.rules.inline.nolink.exec(e56))) {
            let e57 = (n20[2] || n20[1]).replace(/\s+/g, " ");
            e57 = t40[e57.toLowerCase()];
            if (!e57 || !e57.href) {
                const e58 = n20[0].charAt(0);
                return {
                    type: "text",
                    raw: e58,
                    text: e58
                };
            }
            return outputLink(n20, e57, n20[0], this.lexer);
        }
    }
    emStrong(e59, t41, n21 = "") {
        let r13 = this.rules.inline.emStrong.lDelim.exec(e59);
        if (!r13) return;
        if (r13[3] && n21.match(/[\p{L}\p{N}]/u)) return;
        const s8 = r13[1] || r13[2] || "";
        if (!s8 || s8 && ("" === n21 || this.rules.inline.punctuation.exec(n21))) {
            const n22 = r13[0].length - 1;
            let s9, i6, l4 = n22, a2 = 0;
            const o2 = "*" === r13[0][0] ? this.rules.inline.emStrong.rDelimAst : this.rules.inline.emStrong.rDelimUnd;
            o2.lastIndex = 0;
            t41 = t41.slice(-1 * e59.length + n22);
            while(null != (r13 = o2.exec(t41))){
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
                    const t42 = e59.slice(1, n22 + r13.index + i6);
                    return {
                        type: "em",
                        raw: e59.slice(0, n22 + r13.index + i6 + 1),
                        text: t42,
                        tokens: this.lexer.inlineTokens(t42, [])
                    };
                }
                const t43 = e59.slice(2, n22 + r13.index + i6 - 1);
                return {
                    type: "strong",
                    raw: e59.slice(0, n22 + r13.index + i6 + 1),
                    text: t43,
                    tokens: this.lexer.inlineTokens(t43, [])
                };
            }
        }
    }
    codespan(e60) {
        const t44 = this.rules.inline.code.exec(e60);
        if (t44) {
            let e61 = t44[2].replace(/\n/g, " ");
            const n23 = /[^ ]/.test(e61);
            const r14 = /^ /.test(e61) && / $/.test(e61);
            n23 && r14 && (e61 = e61.substring(1, e61.length - 1));
            e61 = escape(e61, true);
            return {
                type: "codespan",
                raw: t44[0],
                text: e61
            };
        }
    }
    br(e62) {
        const t45 = this.rules.inline.br.exec(e62);
        if (t45) return {
            type: "br",
            raw: t45[0]
        };
    }
    del(e63) {
        const t46 = this.rules.inline.del.exec(e63);
        if (t46) return {
            type: "del",
            raw: t46[0],
            text: t46[2],
            tokens: this.lexer.inlineTokens(t46[2], [])
        };
    }
    autolink(e64, t47) {
        const n24 = this.rules.inline.autolink.exec(e64);
        if (n24) {
            let e65, r15;
            if ("@" === n24[2]) {
                e65 = escape(this.options.mangle ? t47(n24[1]) : n24[1]);
                r15 = "mailto:" + e65;
            } else {
                e65 = escape(n24[1]);
                r15 = e65;
            }
            return {
                type: "link",
                raw: n24[0],
                text: e65,
                href: r15,
                tokens: [
                    {
                        type: "text",
                        raw: e65,
                        text: e65
                    }
                ]
            };
        }
    }
    url(e66, t48) {
        let n25;
        if (n25 = this.rules.inline.url.exec(e66)) {
            let e67, r16;
            if ("@" === n25[2]) {
                e67 = escape(this.options.mangle ? t48(n25[0]) : n25[0]);
                r16 = "mailto:" + e67;
            } else {
                let t49;
                do {
                    t49 = n25[0];
                    n25[0] = this.rules.inline._backpedal.exec(n25[0])[0];
                }while (t49 !== n25[0])
                e67 = escape(n25[0]);
                r16 = "www." === n25[1] ? "http://" + e67 : e67;
            }
            return {
                type: "link",
                raw: n25[0],
                text: e67,
                href: r16,
                tokens: [
                    {
                        type: "text",
                        raw: e67,
                        text: e67
                    }
                ]
            };
        }
    }
    inlineText(e68, t50) {
        const n26 = this.rules.inline.text.exec(e68);
        if (n26) {
            let e69;
            e69 = this.lexer.state.inRawBlock ? this.options.sanitize ? this.options.sanitizer ? this.options.sanitizer(n26[0]) : escape(n26[0]) : n26[0] : escape(this.options.smartypants ? t50(n26[0]) : n26[0]);
            return {
                type: "text",
                raw: n26[0],
                text: e69
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
k1.normal = merge({}, k1);
k1.gfm = merge({}, k1.normal, {
    table: "^ *([^\\n ].*\\|.*)\\n {0,3}(?:\\| *)?(:?-+:? *(?:\\| *:?-+:? *)*)(?:\\| *)?(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)"
});
k1.gfm.table = edit(k1.gfm.table).replace("hr", k1.hr).replace("heading", " {0,3}#{1,6} ").replace("blockquote", " {0,3}>").replace("code", " {4}[^\\n]").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", k1._tag).getRegex();
k1.gfm.paragraph = edit(k1._paragraph).replace("hr", k1.hr).replace("heading", " {0,3}#{1,6} ").replace("|lheading", "").replace("table", k1.gfm.table).replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", k1._tag).getRegex();
k1.pedantic = merge({}, k1.normal, {
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
f1.normal = merge({}, f1);
f1.pedantic = merge({}, f1.normal, {
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
f1.gfm = merge({}, f1.normal, {
    escape: edit(f1.escape).replace("])", "~|])").getRegex(),
    _extended_email: /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/,
    url: /^((?:ftp|https?):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/,
    _backpedal: /(?:[^?!.,:;*_~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_~)]+(?!$))+/,
    del: /^(~~?)(?=[^\s~])([\s\S]*?[^\s~])\1(?=[^~]|$)/,
    text: /^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|https?:\/\/|ftp:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/
});
f1.gfm.url = edit(f1.gfm.url, "i").replace("email", f1.gfm._extended_email).getRegex();
f1.breaks = merge({}, f1.gfm, {
    br: edit(f1.br).replace("{2,}", "*").getRegex(),
    text: edit(f1.gfm.text).replace("\\b_", "\\b_| {2,}\\n").replace(/\{2,\}/g, "*").getRegex()
});
function smartypants(e70) {
    return e70.replace(/---/g, "—").replace(/--/g, "–").replace(/(^|[-\u2014/(\[{"\s])'/g, "$1‘").replace(/'/g, "’").replace(/(^|[-\u2014/(\[{\u2018\s])"/g, "$1“").replace(/"/g, "”").replace(/\.{3}/g, "…");
}
function mangle(e71) {
    let t51, n27, r17 = "";
    const s10 = e71.length;
    for(t51 = 0; t51 < s10; t51++){
        n27 = e71.charCodeAt(t51);
        Math.random() > 0.5 && (n27 = "x" + n27.toString(16));
        r17 += "&#" + n27 + ";";
    }
    return r17;
}
class Lexer {
    constructor(t52){
        this.tokens = [];
        this.tokens.links = Object.create(null);
        this.options = t52 || e1;
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
    static lex(e72, t53) {
        const n29 = new Lexer(t53);
        return n29.lex(e72);
    }
    static lexInline(e73, t54) {
        const n30 = new Lexer(t54);
        return n30.inlineTokens(e73);
    }
    lex(e74) {
        e74 = e74.replace(/\r\n|\r/g, "\n").replace(/\t/g, "    ");
        this.blockTokens(e74, this.tokens);
        let t55;
        while(t55 = this.inlineQueue.shift())this.inlineTokens(t55.src, t55.tokens);
        return this.tokens;
    }
    blockTokens(e75, t56 = []) {
        this.options.pedantic && (e75 = e75.replace(/^ +$/gm, ""));
        let n31, r18, s11, i7;
        while(e75)if (!(this.options.extensions && this.options.extensions.block && this.options.extensions.block.some((r19)=>{
            if (n31 = r19.call({
                lexer: this
            }, e75, t56)) {
                e75 = e75.substring(n31.raw.length);
                t56.push(n31);
                return true;
            }
            return false;
        }))) if (n31 = this.tokenizer.space(e75)) {
            e75 = e75.substring(n31.raw.length);
            1 === n31.raw.length && t56.length > 0 ? t56[t56.length - 1].raw += "\n" : t56.push(n31);
        } else if (n31 = this.tokenizer.code(e75)) {
            e75 = e75.substring(n31.raw.length);
            r18 = t56[t56.length - 1];
            if (!r18 || "paragraph" !== r18.type && "text" !== r18.type) t56.push(n31);
            else {
                r18.raw += "\n" + n31.raw;
                r18.text += "\n" + n31.text;
                this.inlineQueue[this.inlineQueue.length - 1].src = r18.text;
            }
        } else if (n31 = this.tokenizer.fences(e75)) {
            e75 = e75.substring(n31.raw.length);
            t56.push(n31);
        } else if (n31 = this.tokenizer.heading(e75)) {
            e75 = e75.substring(n31.raw.length);
            t56.push(n31);
        } else if (n31 = this.tokenizer.hr(e75)) {
            e75 = e75.substring(n31.raw.length);
            t56.push(n31);
        } else if (n31 = this.tokenizer.blockquote(e75)) {
            e75 = e75.substring(n31.raw.length);
            t56.push(n31);
        } else if (n31 = this.tokenizer.list(e75)) {
            e75 = e75.substring(n31.raw.length);
            t56.push(n31);
        } else if (n31 = this.tokenizer.html(e75)) {
            e75 = e75.substring(n31.raw.length);
            t56.push(n31);
        } else if (n31 = this.tokenizer.def(e75)) {
            e75 = e75.substring(n31.raw.length);
            r18 = t56[t56.length - 1];
            if (!r18 || "paragraph" !== r18.type && "text" !== r18.type) this.tokens.links[n31.tag] || (this.tokens.links[n31.tag] = {
                href: n31.href,
                title: n31.title
            });
            else {
                r18.raw += "\n" + n31.raw;
                r18.text += "\n" + n31.raw;
                this.inlineQueue[this.inlineQueue.length - 1].src = r18.text;
            }
        } else if (n31 = this.tokenizer.table(e75)) {
            e75 = e75.substring(n31.raw.length);
            t56.push(n31);
        } else if (n31 = this.tokenizer.lheading(e75)) {
            e75 = e75.substring(n31.raw.length);
            t56.push(n31);
        } else {
            s11 = e75;
            if (this.options.extensions && this.options.extensions.startBlock) {
                let t57 = Infinity;
                const n32 = e75.slice(1);
                let r20;
                this.options.extensions.startBlock.forEach(function(e76) {
                    r20 = e76.call({
                        lexer: this
                    }, n32);
                    "number" === typeof r20 && r20 >= 0 && (t57 = Math.min(t57, r20));
                });
                t57 < Infinity && t57 >= 0 && (s11 = e75.substring(0, t57 + 1));
            }
            if (this.state.top && (n31 = this.tokenizer.paragraph(s11))) {
                r18 = t56[t56.length - 1];
                if (i7 && "paragraph" === r18.type) {
                    r18.raw += "\n" + n31.raw;
                    r18.text += "\n" + n31.text;
                    this.inlineQueue.pop();
                    this.inlineQueue[this.inlineQueue.length - 1].src = r18.text;
                } else t56.push(n31);
                i7 = s11.length !== e75.length;
                e75 = e75.substring(n31.raw.length);
            } else if (n31 = this.tokenizer.text(e75)) {
                e75 = e75.substring(n31.raw.length);
                r18 = t56[t56.length - 1];
                if (r18 && "text" === r18.type) {
                    r18.raw += "\n" + n31.raw;
                    r18.text += "\n" + n31.text;
                    this.inlineQueue.pop();
                    this.inlineQueue[this.inlineQueue.length - 1].src = r18.text;
                } else t56.push(n31);
            } else if (e75) {
                const t58 = "Infinite loop on byte: " + e75.charCodeAt(0);
                if (this.options.silent) {
                    console.error(t58);
                    break;
                }
                throw new Error(t58);
            }
        }
        this.state.top = true;
        return t56;
    }
    inline(e77, t59) {
        this.inlineQueue.push({
            src: e77,
            tokens: t59
        });
    }
    inlineTokens(e78, t60 = []) {
        let n33, r21, s12;
        let i8 = e78;
        let l5;
        let a3, o3;
        if (this.tokens.links) {
            const e79 = Object.keys(this.tokens.links);
            if (e79.length > 0) while(null != (l5 = this.tokenizer.rules.inline.reflinkSearch.exec(i8)))e79.includes(l5[0].slice(l5[0].lastIndexOf("[") + 1, -1)) && (i8 = i8.slice(0, l5.index) + "[" + repeatString("a", l5[0].length - 2) + "]" + i8.slice(this.tokenizer.rules.inline.reflinkSearch.lastIndex));
        }
        while(null != (l5 = this.tokenizer.rules.inline.blockSkip.exec(i8)))i8 = i8.slice(0, l5.index) + "[" + repeatString("a", l5[0].length - 2) + "]" + i8.slice(this.tokenizer.rules.inline.blockSkip.lastIndex);
        while(null != (l5 = this.tokenizer.rules.inline.escapedEmSt.exec(i8)))i8 = i8.slice(0, l5.index) + "++" + i8.slice(this.tokenizer.rules.inline.escapedEmSt.lastIndex);
        while(e78){
            a3 || (o3 = "");
            a3 = false;
            if (!(this.options.extensions && this.options.extensions.inline && this.options.extensions.inline.some((r22)=>{
                if (n33 = r22.call({
                    lexer: this
                }, e78, t60)) {
                    e78 = e78.substring(n33.raw.length);
                    t60.push(n33);
                    return true;
                }
                return false;
            }))) if (n33 = this.tokenizer.escape(e78)) {
                e78 = e78.substring(n33.raw.length);
                t60.push(n33);
            } else if (n33 = this.tokenizer.tag(e78)) {
                e78 = e78.substring(n33.raw.length);
                r21 = t60[t60.length - 1];
                if (r21 && "text" === n33.type && "text" === r21.type) {
                    r21.raw += n33.raw;
                    r21.text += n33.text;
                } else t60.push(n33);
            } else if (n33 = this.tokenizer.link(e78)) {
                e78 = e78.substring(n33.raw.length);
                t60.push(n33);
            } else if (n33 = this.tokenizer.reflink(e78, this.tokens.links)) {
                e78 = e78.substring(n33.raw.length);
                r21 = t60[t60.length - 1];
                if (r21 && "text" === n33.type && "text" === r21.type) {
                    r21.raw += n33.raw;
                    r21.text += n33.text;
                } else t60.push(n33);
            } else if (n33 = this.tokenizer.emStrong(e78, i8, o3)) {
                e78 = e78.substring(n33.raw.length);
                t60.push(n33);
            } else if (n33 = this.tokenizer.codespan(e78)) {
                e78 = e78.substring(n33.raw.length);
                t60.push(n33);
            } else if (n33 = this.tokenizer.br(e78)) {
                e78 = e78.substring(n33.raw.length);
                t60.push(n33);
            } else if (n33 = this.tokenizer.del(e78)) {
                e78 = e78.substring(n33.raw.length);
                t60.push(n33);
            } else if (n33 = this.tokenizer.autolink(e78, mangle)) {
                e78 = e78.substring(n33.raw.length);
                t60.push(n33);
            } else if (this.state.inLink || !(n33 = this.tokenizer.url(e78, mangle))) {
                s12 = e78;
                if (this.options.extensions && this.options.extensions.startInline) {
                    let t61 = Infinity;
                    const n34 = e78.slice(1);
                    let r23;
                    this.options.extensions.startInline.forEach(function(e80) {
                        r23 = e80.call({
                            lexer: this
                        }, n34);
                        "number" === typeof r23 && r23 >= 0 && (t61 = Math.min(t61, r23));
                    });
                    t61 < Infinity && t61 >= 0 && (s12 = e78.substring(0, t61 + 1));
                }
                if (n33 = this.tokenizer.inlineText(s12, smartypants)) {
                    e78 = e78.substring(n33.raw.length);
                    "_" !== n33.raw.slice(-1) && (o3 = n33.raw.slice(-1));
                    a3 = true;
                    r21 = t60[t60.length - 1];
                    if (r21 && "text" === r21.type) {
                        r21.raw += n33.raw;
                        r21.text += n33.text;
                    } else t60.push(n33);
                } else if (e78) {
                    const t62 = "Infinite loop on byte: " + e78.charCodeAt(0);
                    if (this.options.silent) {
                        console.error(t62);
                        break;
                    }
                    throw new Error(t62);
                }
            } else {
                e78 = e78.substring(n33.raw.length);
                t60.push(n33);
            }
        }
        return t60;
    }
}
class Renderer {
    constructor(t63){
        this.options = t63 || e1;
    }
    code(e81, t64, n35) {
        const r24 = (t64 || "").match(/\S*/)[0];
        if (this.options.highlight) {
            const t65 = this.options.highlight(e81, r24);
            if (null != t65 && t65 !== e81) {
                n35 = true;
                e81 = t65;
            }
        }
        e81 = e81.replace(/\n$/, "") + "\n";
        return r24 ? '<pre><code class="' + this.options.langPrefix + escape(r24, true) + '">' + (n35 ? e81 : escape(e81, true)) + "</code></pre>\n" : "<pre><code>" + (n35 ? e81 : escape(e81, true)) + "</code></pre>\n";
    }
    blockquote(e82) {
        return "<blockquote>\n" + e82 + "</blockquote>\n";
    }
    html(e83) {
        return e83;
    }
    heading(e84, t66, n36, r25) {
        return this.options.headerIds ? "<h" + t66 + ' id="' + this.options.headerPrefix + r25.slug(n36) + '">' + e84 + "</h" + t66 + ">\n" : "<h" + t66 + ">" + e84 + "</h" + t66 + ">\n";
    }
    hr() {
        return this.options.xhtml ? "<hr/>\n" : "<hr>\n";
    }
    list(e85, t67, n37) {
        const r26 = t67 ? "ol" : "ul", s13 = t67 && 1 !== n37 ? ' start="' + n37 + '"' : "";
        return "<" + r26 + s13 + ">\n" + e85 + "</" + r26 + ">\n";
    }
    listitem(e86) {
        return "<li>" + e86 + "</li>\n";
    }
    checkbox(e87) {
        return "<input " + (e87 ? 'checked="" ' : "") + 'disabled="" type="checkbox"' + (this.options.xhtml ? " /" : "") + "> ";
    }
    paragraph(e88) {
        return "<p>" + e88 + "</p>\n";
    }
    table(e89, t68) {
        t68 && (t68 = "<tbody>" + t68 + "</tbody>");
        return "<table>\n<thead>\n" + e89 + "</thead>\n" + t68 + "</table>\n";
    }
    tablerow(e90) {
        return "<tr>\n" + e90 + "</tr>\n";
    }
    tablecell(e91, t69) {
        const n38 = t69.header ? "th" : "td";
        const r27 = t69.align ? "<" + n38 + ' align="' + t69.align + '">' : "<" + n38 + ">";
        return r27 + e91 + "</" + n38 + ">\n";
    }
    strong(e92) {
        return "<strong>" + e92 + "</strong>";
    }
    em(e93) {
        return "<em>" + e93 + "</em>";
    }
    codespan(e94) {
        return "<code>" + e94 + "</code>";
    }
    br() {
        return this.options.xhtml ? "<br/>" : "<br>";
    }
    del(e95) {
        return "<del>" + e95 + "</del>";
    }
    link(e96, t70, n39) {
        e96 = cleanUrl(this.options.sanitize, this.options.baseUrl, e96);
        if (null === e96) return n39;
        let r28 = '<a href="' + escape(e96) + '"';
        t70 && (r28 += ' title="' + t70 + '"');
        r28 += ">" + n39 + "</a>";
        return r28;
    }
    image(e97, t71, n40) {
        e97 = cleanUrl(this.options.sanitize, this.options.baseUrl, e97);
        if (null === e97) return n40;
        let r29 = '<img src="' + e97 + '" alt="' + n40 + '"';
        t71 && (r29 += ' title="' + t71 + '"');
        r29 += this.options.xhtml ? "/>" : ">";
        return r29;
    }
    text(e98) {
        return e98;
    }
}
class TextRenderer {
    strong(e99) {
        return e99;
    }
    em(e100) {
        return e100;
    }
    codespan(e101) {
        return e101;
    }
    del(e102) {
        return e102;
    }
    html(e103) {
        return e103;
    }
    text(e104) {
        return e104;
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
        this.seen = {};
    }
    serialize(e105) {
        return e105.toLowerCase().trim().replace(/<[!\/a-z].*?>/gi, "").replace(/[\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,./:;<=>?@[\]^`{|}~]/g, "").replace(/\s/g, "-");
    }
    getNextSafeSlug(e106, t72) {
        let n43 = e106;
        let r30 = 0;
        if (this.seen.hasOwnProperty(n43)) {
            r30 = this.seen[e106];
            do {
                r30++;
                n43 = e106 + "-" + r30;
            }while (this.seen.hasOwnProperty(n43))
        }
        if (!t72) {
            this.seen[e106] = r30;
            this.seen[n43] = 0;
        }
        return n43;
    }
    slug(e107, t73 = {}) {
        const n44 = this.serialize(e107);
        return this.getNextSafeSlug(n44, t73.dryrun);
    }
}
class Parser {
    constructor(t74){
        this.options = t74 || e1;
        this.options.renderer = this.options.renderer || new Renderer;
        this.renderer = this.options.renderer;
        this.renderer.options = this.options;
        this.textRenderer = new TextRenderer;
        this.slugger = new Slugger;
    }
    static parse(e108, t75) {
        const n45 = new Parser(t75);
        return n45.parse(e108);
    }
    static parseInline(e109, t76) {
        const n46 = new Parser(t76);
        return n46.parseInline(e109);
    }
    parse(e110, t77 = true) {
        let n47, r31, s14, i9, l6, a4, o4, c2, h2, p2, u2, g2, d2, k2, f2, m2, x2, b1, w1, _1 = "";
        const y1 = e110.length;
        for(n47 = 0; n47 < y1; n47++){
            p2 = e110[n47];
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
                    while(n47 + 1 < y1 && "text" === e110[n47 + 1].type){
                        p2 = e110[++n47];
                        h2 += "\n" + (p2.tokens ? this.parseInline(p2.tokens) : p2.text);
                    }
                    _1 += t77 ? this.renderer.paragraph(h2) : h2;
                    continue;
                default:
                    {
                        const e111 = 'Token with "' + p2.type + '" type was not found.';
                        if (this.options.silent) {
                            console.error(e111);
                            return;
                        }
                        throw new Error(e111);
                    }
            }
        }
        return _1;
    }
    parseInline(e112, t78) {
        t78 = t78 || this.renderer;
        let n48, r32, s15, i10 = "";
        const l7 = e112.length;
        for(n48 = 0; n48 < l7; n48++){
            r32 = e112[n48];
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
                    i10 += t78.text(r32.text);
                    break;
                case "html":
                    i10 += t78.html(r32.text);
                    break;
                case "link":
                    i10 += t78.link(r32.href, r32.title, this.parseInline(r32.tokens, t78));
                    break;
                case "image":
                    i10 += t78.image(r32.href, r32.title, r32.text);
                    break;
                case "strong":
                    i10 += t78.strong(this.parseInline(r32.tokens, t78));
                    break;
                case "em":
                    i10 += t78.em(this.parseInline(r32.tokens, t78));
                    break;
                case "codespan":
                    i10 += t78.codespan(r32.text);
                    break;
                case "br":
                    i10 += t78.br();
                    break;
                case "del":
                    i10 += t78.del(this.parseInline(r32.tokens, t78));
                    break;
                case "text":
                    i10 += t78.text(r32.text);
                    break;
                default:
                    {
                        const e113 = 'Token with "' + r32.type + '" type was not found.';
                        if (this.options.silent) {
                            console.error(e113);
                            return;
                        }
                        throw new Error(e113);
                    }
            }
        }
        return i10;
    }
}
function marked(e114, t79, n49) {
    if ("undefined" === typeof e114 || null === e114) throw new Error("marked(): input parameter is undefined or null");
    if ("string" !== typeof e114) throw new Error("marked(): input parameter is of type " + Object.prototype.toString.call(e114) + ", string expected");
    if ("function" === typeof t79) {
        n49 = t79;
        t79 = null;
    }
    t79 = merge({}, marked.defaults, t79 || {});
    checkSanitizeDeprecation(t79);
    if (n49) {
        const r33 = t79.highlight;
        let s16;
        try {
            s16 = Lexer.lex(e114, t79);
        } catch (e115) {
            return n49(e115);
        }
        const done = function(e116) {
            let i13;
            if (!e116) try {
                t79.walkTokens && marked.walkTokens(s16, t79.walkTokens);
                i13 = Parser.parse(s16, t79);
            } catch (t80) {
                e116 = t80;
            }
            t79.highlight = r33;
            return e116 ? n49(e116) : n49(null, i13);
        };
        if (!r33 || r33.length < 3) return done();
        delete t79.highlight;
        if (!s16.length) return done();
        let i11 = 0;
        marked.walkTokens(s16, function(e117) {
            if ("code" === e117.type) {
                i11++;
                setTimeout(()=>{
                    r33(e117.text, e117.lang, function(t81, n50) {
                        if (t81) return done(t81);
                        if (null != n50 && n50 !== e117.text) {
                            e117.text = n50;
                            e117.escaped = true;
                        }
                        i11--;
                        0 === i11 && done();
                    });
                }, 0);
            }
        });
        0 === i11 && done();
    } else try {
        const n51 = Lexer.lex(e114, t79);
        t79.walkTokens && marked.walkTokens(n51, t79.walkTokens);
        return Parser.parse(n51, t79);
    } catch (e118) {
        e118.message += "\nPlease report this to https://github.com/markedjs/marked.";
        if (t79.silent) return "<p>An error occurred:</p><pre>" + escape(e118.message + "", true) + "</pre>";
        throw e118;
    }
}
marked.options = marked.setOptions = function(e119) {
    merge(marked.defaults, e119);
    changeDefaults(marked.defaults);
    return marked;
};
marked.getDefaults = getDefaults;
marked.defaults = e1;
marked.use = function(...e120) {
    const t82 = merge({}, ...e120);
    const n52 = marked.defaults.extensions || {
        renderers: {},
        childTokens: {}
    };
    let r34;
    e120.forEach((e121)=>{
        if (e121.extensions) {
            r34 = true;
            e121.extensions.forEach((e122)=>{
                if (!e122.name) throw new Error("extension name required");
                if (e122.renderer) {
                    const t83 = n52.renderers ? n52.renderers[e122.name] : null;
                    n52.renderers[e122.name] = t83 ? function(...n53) {
                        let r35 = e122.renderer.apply(this, n53);
                        false === r35 && (r35 = t83.apply(this, n53));
                        return r35;
                    } : e122.renderer;
                }
                if (e122.tokenizer) {
                    if (!e122.level || "block" !== e122.level && "inline" !== e122.level) throw new Error("extension level must be 'block' or 'inline'");
                    n52[e122.level] ? n52[e122.level].unshift(e122.tokenizer) : n52[e122.level] = [
                        e122.tokenizer
                    ];
                    e122.start && ("block" === e122.level ? n52.startBlock ? n52.startBlock.push(e122.start) : n52.startBlock = [
                        e122.start
                    ] : "inline" === e122.level && (n52.startInline ? n52.startInline.push(e122.start) : n52.startInline = [
                        e122.start
                    ]));
                }
                e122.childTokens && (n52.childTokens[e122.name] = e122.childTokens);
            });
        }
        if (e121.renderer) {
            const n54 = marked.defaults.renderer || new Renderer;
            for(const t84 in e121.renderer){
                const r36 = n54[t84];
                n54[t84] = (...s17)=>{
                    let i14 = e121.renderer[t84].apply(n54, s17);
                    false === i14 && (i14 = r36.apply(n54, s17));
                    return i14;
                };
            }
            t82.renderer = n54;
        }
        if (e121.tokenizer) {
            const n55 = marked.defaults.tokenizer || new Tokenizer;
            for(const t85 in e121.tokenizer){
                const r37 = n55[t85];
                n55[t85] = (...s18)=>{
                    let i15 = e121.tokenizer[t85].apply(n55, s18);
                    false === i15 && (i15 = r37.apply(n55, s18));
                    return i15;
                };
            }
            t82.tokenizer = n55;
        }
        if (e121.walkTokens) {
            const n56 = marked.defaults.walkTokens;
            t82.walkTokens = function(t86) {
                e121.walkTokens.call(this, t86);
                n56 && n56.call(this, t86);
            };
        }
        r34 && (t82.extensions = n52);
        marked.setOptions(t82);
    });
};
marked.walkTokens = function(e123, t87) {
    for (const n58 of e123){
        t87.call(marked, n58);
        switch(n58.type){
            case "table":
                for (const e125 of n58.header)marked.walkTokens(e125.tokens, t87);
                for (const e124 of n58.rows)for (const n57 of e124)marked.walkTokens(n57.tokens, t87);
                break;
            case "list":
                marked.walkTokens(n58.items, t87);
                break;
            default:
                marked.defaults.extensions && marked.defaults.extensions.childTokens && marked.defaults.extensions.childTokens[n58.type] ? marked.defaults.extensions.childTokens[n58.type].forEach(function(e126) {
                    marked.walkTokens(n58[e126], t87);
                }) : n58.tokens && marked.walkTokens(n58.tokens, t87);
        }
    }
};
marked.parseInline = function(e127, t88) {
    if ("undefined" === typeof e127 || null === e127) throw new Error("marked.parseInline(): input parameter is undefined or null");
    if ("string" !== typeof e127) throw new Error("marked.parseInline(): input parameter is of type " + Object.prototype.toString.call(e127) + ", string expected");
    t88 = merge({}, marked.defaults, t88 || {});
    checkSanitizeDeprecation(t88);
    try {
        const n59 = Lexer.lexInline(e127, t88);
        t88.walkTokens && marked.walkTokens(n59, t88.walkTokens);
        return Parser.parseInline(n59, t88);
    } catch (e128) {
        e128.message += "\nPlease report this to https://github.com/markedjs/marked.";
        if (t88.silent) return "<p>An error occurred:</p><pre>" + escape(e128.message + "", true) + "</pre>";
        throw e128;
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
var r4 = "undefined" !== typeof globalThis ? globalThis : "undefined" !== typeof self ? self : global;
var e2 = {};
var a2 = {
    exports: e2
};
(function(t13) {
    var o12 = e2;
    var s16 = true && a2.exports == o12 && a2;
    var u12 = "object" == typeof r4 && r4;
    u12.global !== u12 && u12.window !== u12 || (t13 = u12);
    var c12 = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g;
    var l12 = /[\x01-\x7F]/g;
    var i18 = /[\x01-\t\x0B\f\x0E-\x1F\x7F\x81\x8D\x8F\x90\x9D\xA0-\uFFFF]/g;
    var n5 = /<\u20D2|=\u20E5|>\u20D2|\u205F\u200A|\u219D\u0338|\u2202\u0338|\u2220\u20D2|\u2229\uFE00|\u222A\uFE00|\u223C\u20D2|\u223D\u0331|\u223E\u0333|\u2242\u0338|\u224B\u0338|\u224D\u20D2|\u224E\u0338|\u224F\u0338|\u2250\u0338|\u2261\u20E5|\u2264\u20D2|\u2265\u20D2|\u2266\u0338|\u2267\u0338|\u2268\uFE00|\u2269\uFE00|\u226A\u0338|\u226A\u20D2|\u226B\u0338|\u226B\u20D2|\u227F\u0338|\u2282\u20D2|\u2283\u20D2|\u228A\uFE00|\u228B\uFE00|\u228F\u0338|\u2290\u0338|\u2293\uFE00|\u2294\uFE00|\u22B4\u20D2|\u22B5\u20D2|\u22D8\u0338|\u22D9\u0338|\u22DA\uFE00|\u22DB\uFE00|\u22F5\u0338|\u22F9\u0338|\u2933\u0338|\u29CF\u0338|\u29D0\u0338|\u2A6D\u0338|\u2A70\u0338|\u2A7D\u0338|\u2A7E\u0338|\u2AA1\u0338|\u2AA2\u0338|\u2AAC\uFE00|\u2AAD\uFE00|\u2AAF\u0338|\u2AB0\u0338|\u2AC5\u0338|\u2AC6\u0338|\u2ACB\uFE00|\u2ACC\uFE00|\u2AFD\u20E5|[\xA0-\u0113\u0116-\u0122\u0124-\u012B\u012E-\u014D\u0150-\u017E\u0192\u01B5\u01F5\u0237\u02C6\u02C7\u02D8-\u02DD\u0311\u0391-\u03A1\u03A3-\u03A9\u03B1-\u03C9\u03D1\u03D2\u03D5\u03D6\u03DC\u03DD\u03F0\u03F1\u03F5\u03F6\u0401-\u040C\u040E-\u044F\u0451-\u045C\u045E\u045F\u2002-\u2005\u2007-\u2010\u2013-\u2016\u2018-\u201A\u201C-\u201E\u2020-\u2022\u2025\u2026\u2030-\u2035\u2039\u203A\u203E\u2041\u2043\u2044\u204F\u2057\u205F-\u2063\u20AC\u20DB\u20DC\u2102\u2105\u210A-\u2113\u2115-\u211E\u2122\u2124\u2127-\u2129\u212C\u212D\u212F-\u2131\u2133-\u2138\u2145-\u2148\u2153-\u215E\u2190-\u219B\u219D-\u21A7\u21A9-\u21AE\u21B0-\u21B3\u21B5-\u21B7\u21BA-\u21DB\u21DD\u21E4\u21E5\u21F5\u21FD-\u2205\u2207-\u2209\u220B\u220C\u220F-\u2214\u2216-\u2218\u221A\u221D-\u2238\u223A-\u2257\u2259\u225A\u225C\u225F-\u2262\u2264-\u228B\u228D-\u229B\u229D-\u22A5\u22A7-\u22B0\u22B2-\u22BB\u22BD-\u22DB\u22DE-\u22E3\u22E6-\u22F7\u22F9-\u22FE\u2305\u2306\u2308-\u2310\u2312\u2313\u2315\u2316\u231C-\u231F\u2322\u2323\u232D\u232E\u2336\u233D\u233F\u237C\u23B0\u23B1\u23B4-\u23B6\u23DC-\u23DF\u23E2\u23E7\u2423\u24C8\u2500\u2502\u250C\u2510\u2514\u2518\u251C\u2524\u252C\u2534\u253C\u2550-\u256C\u2580\u2584\u2588\u2591-\u2593\u25A1\u25AA\u25AB\u25AD\u25AE\u25B1\u25B3-\u25B5\u25B8\u25B9\u25BD-\u25BF\u25C2\u25C3\u25CA\u25CB\u25EC\u25EF\u25F8-\u25FC\u2605\u2606\u260E\u2640\u2642\u2660\u2663\u2665\u2666\u266A\u266D-\u266F\u2713\u2717\u2720\u2736\u2758\u2772\u2773\u27C8\u27C9\u27E6-\u27ED\u27F5-\u27FA\u27FC\u27FF\u2902-\u2905\u290C-\u2913\u2916\u2919-\u2920\u2923-\u292A\u2933\u2935-\u2939\u293C\u293D\u2945\u2948-\u294B\u294E-\u2976\u2978\u2979\u297B-\u297F\u2985\u2986\u298B-\u2996\u299A\u299C\u299D\u29A4-\u29B7\u29B9\u29BB\u29BC\u29BE-\u29C5\u29C9\u29CD-\u29D0\u29DC-\u29DE\u29E3-\u29E5\u29EB\u29F4\u29F6\u2A00-\u2A02\u2A04\u2A06\u2A0C\u2A0D\u2A10-\u2A17\u2A22-\u2A27\u2A29\u2A2A\u2A2D-\u2A31\u2A33-\u2A3C\u2A3F\u2A40\u2A42-\u2A4D\u2A50\u2A53-\u2A58\u2A5A-\u2A5D\u2A5F\u2A66\u2A6A\u2A6D-\u2A75\u2A77-\u2A9A\u2A9D-\u2AA2\u2AA4-\u2AB0\u2AB3-\u2AC8\u2ACB\u2ACC\u2ACF-\u2ADB\u2AE4\u2AE6-\u2AE9\u2AEB-\u2AF3\u2AFD\uFB00-\uFB04]|\uD835[\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDCCF\uDD04\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDD6B]/g;
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
    var h4 = {
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
    var v4 = {
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
    var w2 = [
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
    var D3 = String.fromCharCode;
    var y3 = {};
    var A2 = y3.hasOwnProperty;
    var has = function(r13, e12) {
        return A2.call(r13, e12);
    };
    var contains = function(r23, e21) {
        var a12 = -1;
        var t22 = r23.length;
        while(++a12 < t22)if (r23[a12] == e21) return true;
        return false;
    };
    var merge1 = function(r32, e3) {
        if (!r32) return e3;
        var a21 = {};
        var t3;
        for(t3 in e3)a21[t3] = has(r32, t3) ? r32[t3] : e3[t3];
        return a21;
    };
    var codePointToSymbol = function(r41, e4) {
        var a3 = "";
        if (r41 >= 55296 && r41 <= 57343 || r41 > 1114111) {
            e4 && parseError("character reference outside the permissible Unicode range");
            return "�";
        }
        if (has(q1, r41)) {
            e4 && parseError("disallowed character reference");
            return q1[r41];
        }
        e4 && contains(w2, r41) && parseError("disallowed character reference");
        if (r41 > 65535) {
            r41 -= 65536;
            a3 += D3(r41 >>> 10 & 1023 | 55296);
            r41 = 56320 | 1023 & r41;
        }
        a3 += D3(r41);
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
        var o4 = e5.useNamedReferences;
        var s14 = e5.allowUnsafeSymbols;
        var u7 = e5.decimal ? decEscape : hexEscape;
        var escapeBmpSymbol = function(r9) {
            return u7(r9.charCodeAt(0));
        };
        if (t4) {
            r8 = r8.replace(l12, function(r10) {
                return o4 && has(p12, r10) ? "&" + p12[r10] + ";" : escapeBmpSymbol(r10);
            });
            o4 && (r8 = r8.replace(/&gt;\u20D2/g, "&nvgt;").replace(/&lt;\u20D2/g, "&nvlt;").replace(/&#x66;&#x6A;/g, "&fjlig;"));
            o4 && (r8 = r8.replace(n5, function(r11) {
                return "&" + p12[r11] + ";";
            }));
        } else if (o4) {
            s14 || (r8 = r8.replace(d12, function(r12) {
                return "&" + p12[r12] + ";";
            }));
            r8 = r8.replace(/&gt;\u20D2/g, "&nvgt;").replace(/&lt;\u20D2/g, "&nvlt;");
            r8 = r8.replace(n5, function(r13) {
                return "&" + p12[r13] + ";";
            });
        } else s14 || (r8 = r8.replace(d12, escapeBmpSymbol));
        return r8.replace(c12, function(r14) {
            var e6 = r14.charCodeAt(0);
            var a5 = r14.charCodeAt(1);
            var t5 = 1024 * (e6 - 55296) + a5 - 56320 + 65536;
            return u7(t5);
        }).replace(i18, escapeBmpSymbol);
    };
    encode.options = {
        allowUnsafeSymbols: false,
        encodeEverything: false,
        strict: false,
        useNamedReferences: false,
        decimal: false
    };
    var decode = function(r15, e7) {
        e7 = merge1(e7, decode.options);
        var a6 = e7.strict;
        a6 && m1.test(r15) && parseError("malformed character reference");
        return r15.replace(b1, function(r16, t6, o5, s15, u8, c4, l4, i19, n) {
            var p4;
            var d5;
            var g7;
            var m3;
            var f4;
            var b6;
            if (t6) {
                f4 = t6;
                return h4[f4];
            }
            if (o5) {
                f4 = o5;
                b6 = s15;
                if (b6 && e7.isAttributeValue) {
                    a6 && "=" == b6 && parseError("`&` did not start a character reference");
                    return r16;
                }
                a6 && parseError("named character reference was not terminated by a semicolon");
                return v4[f4] + (b6 || "");
            }
            if (u8) {
                g7 = u8;
                d5 = c4;
                a6 && !d5 && parseError("character reference was not terminated by a semicolon");
                p4 = parseInt(g7, 10);
                return codePointToSymbol(p4, a6);
            }
            if (l4) {
                m3 = l4;
                d5 = i19;
                a6 && !d5 && parseError("character reference was not terminated by a semicolon");
                p4 = parseInt(m3, 16);
                return codePointToSymbol(p4, a6);
            }
            a6 && parseError("named character reference was not terminated by a semicolon");
            return r16;
        });
    };
    decode.options = {
        isAttributeValue: false,
        strict: false
    };
    var escape1 = function(r17) {
        return r17.replace(d12, function(r18) {
            return g12[r18];
        });
    };
    var E1 = {
        version: "1.2.0",
        encode: encode,
        decode: decode,
        escape: escape1,
        unescape: decode
    };
    if (o12 && !o12.nodeType) if (s16) s16.exports = E1;
    else for(var x2 in E1)has(E1, x2) && (o12[x2] = E1[x2]);
    else t13.he = E1;
})(e2);
var t3 = a2.exports;
var e3 = "undefined" !== typeof globalThis ? globalThis : "undefined" !== typeof self ? self : global;
var t4 = {};
var a3 = "undefined" !== typeof window ? window : "undefined" !== typeof WorkerGlobalScope && self instanceof WorkerGlobalScope ? self : {};
var n4 = function(t14) {
    var a13 = /(?:^|\s)lang(?:uage)?-([\w-]+)(?=\s|$)/i;
    var n14 = 0;
    var r14 = {};
    var i110 = {
        manual: t14.Prism && t14.Prism.manual,
        disableWorkerMessageHandler: t14.Prism && t14.Prism.disableWorkerMessageHandler,
        util: {
            encode: function encode(e13) {
                return e13 instanceof Token ? new Token(e13.type, encode(e13.content), e13.alias) : Array.isArray(e13) ? e13.map(encode) : e13.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/\u00a0/g, " ");
            },
            type: function(e22) {
                return Object.prototype.toString.call(e22).slice(8, -1);
            },
            objId: function(e31) {
                e31.__id || Object.defineProperty(e31, "__id", {
                    value: ++n14
                });
                return e31.__id;
            },
            clone: function deepClone(e4, t23) {
                t23 = t23 || {};
                var a22;
                var n22;
                switch(i110.util.type(e4)){
                    case "Object":
                        n22 = i110.util.objId(e4);
                        if (t23[n22]) return t23[n22];
                        a22 = {};
                        t23[n22] = a22;
                        for(var r24 in e4)e4.hasOwnProperty(r24) && (a22[r24] = deepClone(e4[r24], t23));
                        return a22;
                    case "Array":
                        n22 = i110.util.objId(e4);
                        if (t23[n22]) return t23[n22];
                        a22 = [];
                        t23[n22] = a22;
                        e4.forEach(function(e5, n32) {
                            a22[n32] = deepClone(e5, t23);
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
            setLanguage: function(e7, t41) {
                e7.className = e7.className.replace(RegExp(a13, "gi"), "");
                e7.classList.add("language-" + t41);
            },
            currentScript: function() {
                if ("undefined" === typeof document) return null;
                if ("currentScript" in document && 1 < 2) return document.currentScript;
                try {
                    throw new Error;
                } catch (n41) {
                    var e8 = (/at [^(\r\n]*\((.*):[^:]+:[^:]+\)$/i.exec(n41.stack) || [])[1];
                    if (e8) {
                        var t5 = document.getElementsByTagName("script");
                        for(var a31 in t5)if (t5[a31].src == e8) return t5[a31];
                    }
                    return null;
                }
            },
            isActive: function(e9, t6, a4) {
                var n5 = "no-" + t6;
                while(e9){
                    var r33 = e9.classList;
                    if (r33.contains(t6)) return true;
                    if (r33.contains(n5)) return false;
                    e9 = e9.parentElement;
                }
                return !!a4;
            }
        },
        languages: {
            plain: r14,
            plaintext: r14,
            text: r14,
            txt: r14,
            extend: function(e10, t7) {
                var a5 = i110.util.clone(i110.languages[e10]);
                for(var n6 in t7)a5[n6] = t7[n6];
                return a5;
            },
            insertBefore: function(t8, a6, n7, r42) {
                r42 = r42 || i110.languages;
                var s17 = r42[t8];
                var l5 = {};
                for(var o6 in s17)if (s17.hasOwnProperty(o6)) {
                    if (o6 == a6) for(var u9 in n7)n7.hasOwnProperty(u9) && (l5[u9] = n7[u9]);
                    n7.hasOwnProperty(o6) || (l5[o6] = s17[o6]);
                }
                var g8 = r42[t8];
                r42[t8] = l5;
                i110.languages.DFS(i110.languages, function(a7, n8) {
                    n8 === g8 && a7 != t8 && ((this || e3)[a7] = l5);
                });
                return l5;
            },
            DFS: function DFS(e11, t9, a8, n9) {
                n9 = n9 || {};
                var r5 = i110.util.objId;
                for(var s18 in e11)if (e11.hasOwnProperty(s18)) {
                    t9.call(e11, s18, e11[s18], a8 || s18);
                    var l6 = e11[s18];
                    var o7 = i110.util.type(l6);
                    if ("Object" !== o7 || n9[r5(l6)]) {
                        if ("Array" === o7 && !n9[r5(l6)]) {
                            n9[r5(l6)] = true;
                            DFS(l6, t9, s18, n9);
                        }
                    } else {
                        n9[r5(l6)] = true;
                        DFS(l6, t9, null, n9);
                    }
                }
            }
        },
        plugins: {},
        highlightAll: function(e12, t10) {
            i110.highlightAllUnder(document, e12, t10);
        },
        highlightAllUnder: function(e13, t11, a9) {
            var n10 = {
                callback: a9,
                container: e13,
                selector: 'code[class*="language-"], [class*="language-"] code, code[class*="lang-"], [class*="lang-"] code'
            };
            i110.hooks.run("before-highlightall", n10);
            n10.elements = Array.prototype.slice.apply(n10.container.querySelectorAll(n10.selector));
            i110.hooks.run("before-all-elements-highlight", n10);
            for(var r6, s19 = 0; r6 = n10.elements[s19++];)i110.highlightElement(r6, true === t11, n10.callback);
        },
        highlightElement: function(e14, a10, n11) {
            var r7 = i110.util.getLanguage(e14);
            var s20 = i110.languages[r7];
            i110.util.setLanguage(e14, r7);
            var l7 = e14.parentElement;
            l7 && "pre" === l7.nodeName.toLowerCase() && i110.util.setLanguage(l7, r7);
            var o8 = e14.textContent;
            var u10 = {
                element: e14,
                language: r7,
                grammar: s20,
                code: o8
            };
            function insertHighlightedCode(e15) {
                u10.highlightedCode = e15;
                i110.hooks.run("before-insert", u10);
                u10.element.innerHTML = u10.highlightedCode;
                i110.hooks.run("after-highlight", u10);
                i110.hooks.run("complete", u10);
                n11 && n11.call(u10.element);
            }
            i110.hooks.run("before-sanity-check", u10);
            l7 = u10.element.parentElement;
            l7 && "pre" === l7.nodeName.toLowerCase() && !l7.hasAttribute("tabindex") && l7.setAttribute("tabindex", "0");
            if (u10.code) {
                i110.hooks.run("before-highlight", u10);
                if (u10.grammar) if (a10 && t14.Worker) {
                    var g9 = new Worker(i110.filename);
                    g9.onmessage = function(e16) {
                        insertHighlightedCode(e16.data);
                    };
                    g9.postMessage(JSON.stringify({
                        language: u10.language,
                        code: u10.code,
                        immediateClose: true
                    }));
                } else insertHighlightedCode(i110.highlight(u10.code, u10.grammar, u10.language));
                else insertHighlightedCode(i110.util.encode(u10.code));
            } else {
                i110.hooks.run("complete", u10);
                n11 && n11.call(u10.element);
            }
        },
        highlight: function(e17, t12, a11) {
            var n12 = {
                code: e17,
                grammar: t12,
                language: a11
            };
            i110.hooks.run("before-tokenize", n12);
            n12.tokens = i110.tokenize(n12.code, n12.grammar);
            i110.hooks.run("after-tokenize", n12);
            return Token.stringify(i110.util.encode(n12.tokens), n12.language);
        },
        tokenize: function(e18, t13) {
            var a12 = t13.rest;
            if (a12) {
                for(var n13 in a12)t13[n13] = a12[n13];
                delete t13.rest;
            }
            var r8 = new LinkedList;
            addAfter(r8, r8.head, e18);
            matchGrammar(e18, r8, t13, r8.head, 0);
            return toArray(r8);
        },
        hooks: {
            all: {},
            add: function(e19, t14) {
                var a13 = i110.hooks.all;
                a13[e19] = a13[e19] || [];
                a13[e19].push(t14);
            },
            run: function(e20, t15) {
                var a14 = i110.hooks.all[e20];
                if (a14 && a14.length) for(var n14, r9 = 0; n14 = a14[r9++];)n14(t15);
            }
        },
        Token: Token
    };
    t14.Prism = i110;
    function Token(t16, a15, n15, r10) {
        (this || e3).type = t16;
        (this || e3).content = a15;
        (this || e3).alias = n15;
        (this || e3).length = 0 | (r10 || "").length;
    }
    Token.stringify = function stringify(e21, t17) {
        if ("string" == typeof e21) return e21;
        if (Array.isArray(e21)) {
            var a16 = "";
            e21.forEach(function(e22) {
                a16 += stringify(e22, t17);
            });
            return a16;
        }
        var n16 = {
            type: e21.type,
            content: stringify(e21.content, t17),
            tag: "span",
            classes: [
                "token",
                e21.type
            ],
            attributes: {},
            language: t17
        };
        var r11 = e21.alias;
        r11 && (Array.isArray(r11) ? Array.prototype.push.apply(n16.classes, r11) : n16.classes.push(r11));
        i110.hooks.run("wrap", n16);
        var s21 = "";
        for(var l8 in n16.attributes)s21 += " " + l8 + '="' + (n16.attributes[l8] || "").replace(/"/g, "&quot;") + '"';
        return "<" + n16.tag + ' class="' + n16.classes.join(" ") + '"' + s21 + ">" + n16.content + "</" + n16.tag + ">";
    };
    function matchPattern(e23, t18, a17, n17) {
        e23.lastIndex = t18;
        var r12 = e23.exec(a17);
        if (r12 && n17 && r12[1]) {
            var i20 = r12[1].length;
            r12.index += i20;
            r12[0] = r12[0].slice(i20);
        }
        return r12;
    }
    function matchGrammar(e24, t19, a18, n18, r13, s22) {
        for(var l9 in a18)if (a18.hasOwnProperty(l9) && a18[l9]) {
            var o9 = a18[l9];
            o9 = Array.isArray(o9) ? o9 : [
                o9
            ];
            for(var u13 = 0; u13 < o9.length; ++u13){
                if (s22 && s22.cause == l9 + "," + u13) return;
                var g10 = o9[u13];
                var c5 = g10.inside;
                var d6 = !!g10.lookbehind;
                var p5 = !!g10.greedy;
                var h5 = g10.alias;
                if (p5 && !g10.pattern.global) {
                    var f5 = g10.pattern.toString().match(/[imsuy]*$/)[0];
                    g10.pattern = RegExp(g10.pattern.source, f5 + "g");
                }
                var m4 = g10.pattern || g10;
                for(var v5 = n18.next, b7 = r13; v5 !== t19.tail; b7 += v5.value.length, v5 = v5.next){
                    if (s22 && b7 >= s22.reach) break;
                    var y4 = v5.value;
                    if (t19.length > e24.length) return;
                    if (!(y4 instanceof Token)) {
                        var k2 = 1;
                        var F1;
                        if (p5) {
                            F1 = matchPattern(m4, b7, e24, d6);
                            if (!F1 || F1.index >= e24.length) break;
                            var x3 = F1.index;
                            var A3 = F1.index + F1[0].length;
                            var w3 = b7;
                            w3 += v5.value.length;
                            while(x3 >= w3){
                                v5 = v5.next;
                                w3 += v5.value.length;
                            }
                            w3 -= v5.value.length;
                            b7 = w3;
                            if (v5.value instanceof Token) continue;
                            for(var $2 = v5; $2 !== t19.tail && (w3 < A3 || "string" === typeof $2.value); $2 = $2.next){
                                k2++;
                                w3 += $2.value.length;
                            }
                            k2--;
                            y4 = e24.slice(b7, w3);
                            F1.index -= b7;
                        } else {
                            F1 = matchPattern(m4, 0, y4, d6);
                            if (!F1) continue;
                        }
                        x3 = F1.index;
                        var S4 = F1[0];
                        var E2 = y4.slice(0, x3);
                        var C2 = y4.slice(x3 + S4.length);
                        var _6 = b7 + y4.length;
                        s22 && _6 > s22.reach && (s22.reach = _6);
                        var j1 = v5.prev;
                        if (E2) {
                            j1 = addAfter(t19, j1, E2);
                            b7 += E2.length;
                        }
                        removeRange(t19, j1, k2);
                        var T7 = new Token(l9, c5 ? i110.tokenize(S4, c5) : S4, h5, S4);
                        v5 = addAfter(t19, j1, T7);
                        C2 && addAfter(t19, v5, C2);
                        if (k2 > 1) {
                            var L3 = {
                                cause: l9 + "," + u13,
                                reach: _6
                            };
                            matchGrammar(e24, t19, a18, v5.prev, b7, L3);
                            s22 && L3.reach > s22.reach && (s22.reach = L3.reach);
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
        var a19 = {
            value: null,
            prev: t20,
            next: null
        };
        t20.next = a19;
        (this || e3).head = t20;
        (this || e3).tail = a19;
        (this || e3).length = 0;
    }
    function addAfter(e25, t21, a20) {
        var n19 = t21.next;
        var r14 = {
            value: a20,
            prev: t21,
            next: n19
        };
        t21.next = r14;
        n19.prev = r14;
        e25.length++;
        return r14;
    }
    function removeRange(e26, t22, a21) {
        var n20 = t22.next;
        for(var r15 = 0; r15 < a21 && n20 !== e26.tail; r15++)n20 = n20.next;
        t22.next = n20;
        n20.prev = t22;
        e26.length -= r15;
    }
    function toArray(e27) {
        var t23 = [];
        var a22 = e27.head.next;
        while(a22 !== e27.tail){
            t23.push(a22.value);
            a22 = a22.next;
        }
        return t23;
    }
    if (!t14.document) {
        if (!t14.addEventListener) return i110;
        i110.disableWorkerMessageHandler || t14.addEventListener("message", function(e28) {
            var a23 = JSON.parse(e28.data);
            var n21 = a23.language;
            var r16 = a23.code;
            var s23 = a23.immediateClose;
            t14.postMessage(i110.highlight(r16, i110.languages[n21], n21));
            s23 && t14.close();
        }, false);
        return i110;
    }
    var s110 = i110.util.currentScript();
    if (s110) {
        i110.filename = s110.src;
        s110.hasAttribute("data-manual") && (i110.manual = true);
    }
    function highlightAutomaticallyCallback() {
        i110.manual || i110.highlightAll();
    }
    if (!i110.manual) {
        var l13 = document.readyState;
        "loading" === l13 || "interactive" === l13 && s110 && s110.defer ? document.addEventListener("DOMContentLoaded", highlightAutomaticallyCallback) : window.requestAnimationFrame ? window.requestAnimationFrame(highlightAutomaticallyCallback) : window.setTimeout(highlightAutomaticallyCallback, 16);
    }
    return i110;
}(a3);
t4 && (t4 = n4);
"undefined" !== typeof e3 && (e3.Prism = n4);
n4.languages.markup = {
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
n4.languages.markup.tag.inside["attr-value"].inside.entity = n4.languages.markup.entity;
n4.languages.markup.doctype.inside["internal-subset"].inside = n4.languages.markup;
n4.hooks.add("wrap", function(e29) {
    "entity" === e29.type && (e29.attributes.title = e29.content.replace(/&amp;/, "&"));
});
Object.defineProperty(n4.languages.markup.tag, "addInlined", {
    value: function addInlined(e30, t24) {
        var a24 = {};
        a24["language-" + t24] = {
            pattern: /(^<!\[CDATA\[)[\s\S]+?(?=\]\]>$)/i,
            lookbehind: true,
            inside: n4.languages[t24]
        };
        a24.cdata = /^<!\[CDATA\[|\]\]>$/i;
        var r17 = {
            "included-cdata": {
                pattern: /<!\[CDATA\[[\s\S]*?\]\]>/i,
                inside: a24
            }
        };
        r17["language-" + t24] = {
            pattern: /[\s\S]+/,
            inside: n4.languages[t24]
        };
        var i21 = {};
        i21[e30] = {
            pattern: RegExp(/(<__[^>]*>)(?:<!\[CDATA\[(?:[^\]]|\](?!\]>))*\]\]>|(?!<!\[CDATA\[)[\s\S])*?(?=<\/__>)/.source.replace(/__/g, function() {
                return e30;
            }), "i"),
            lookbehind: true,
            greedy: true,
            inside: r17
        };
        n4.languages.insertBefore("markup", "cdata", i21);
    }
});
Object.defineProperty(n4.languages.markup.tag, "addAttribute", {
    value: function(e31, t25) {
        n4.languages.markup.tag.inside["special-attr"].push({
            pattern: RegExp(/(^|["'\s])/.source + "(?:" + e31 + ")" + /\s*=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+(?=[\s>]))/.source, "i"),
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
                                t25,
                                "language-" + t25
                            ],
                            inside: n4.languages[t25]
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
n4.languages.html = n4.languages.markup;
n4.languages.mathml = n4.languages.markup;
n4.languages.svg = n4.languages.markup;
n4.languages.xml = n4.languages.extend("markup", {});
n4.languages.ssml = n4.languages.xml;
n4.languages.atom = n4.languages.xml;
n4.languages.rss = n4.languages.xml;
(function(e32) {
    var t26 = /(?:"(?:\\(?:\r\n|[\s\S])|[^"\\\r\n])*"|'(?:\\(?:\r\n|[\s\S])|[^'\\\r\n])*')/;
    e32.languages.css = {
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
            pattern: RegExp("\\burl\\((?:" + t26.source + "|" + /(?:[^\\\r\n()"']|\\[\s\S])*/.source + ")\\)", "i"),
            greedy: true,
            inside: {
                function: /^url/i,
                punctuation: /^\(|\)$/,
                string: {
                    pattern: RegExp("^" + t26.source + "$"),
                    alias: "url"
                }
            }
        },
        selector: {
            pattern: RegExp("(^|[{}\\s])[^{}\\s](?:[^{};\"'\\s]|\\s+(?![\\s{])|" + t26.source + ")*(?=\\s*\\{)"),
            lookbehind: true
        },
        string: {
            pattern: t26,
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
    e32.languages.css.atrule.inside.rest = e32.languages.css;
    var a25 = e32.languages.markup;
    if (a25) {
        a25.tag.addInlined("style", "css");
        a25.tag.addAttribute("style", "css");
    }
})(n4);
n4.languages.clike = {
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
n4.languages.javascript = n4.languages.extend("clike", {
    "class-name": [
        n4.languages.clike["class-name"],
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
n4.languages.javascript["class-name"][0].pattern = /(\b(?:class|extends|implements|instanceof|interface|new)\s+)[\w.\\]+/;
n4.languages.insertBefore("javascript", "keyword", {
    regex: {
        pattern: /((?:^|[^$\w\xA0-\uFFFF."'\])\s]|\b(?:return|yield))\s*)\/(?:\[(?:[^\]\\\r\n]|\\.)*\]|\\.|[^/\\\[\r\n])+\/[dgimyus]{0,7}(?=(?:\s|\/\*(?:[^*]|\*(?!\/))*\*\/)*(?:$|[\r\n,.;:})\]]|\/\/))/,
        lookbehind: true,
        greedy: true,
        inside: {
            "regex-source": {
                pattern: /^(\/)[\s\S]+(?=\/[a-z]*$)/,
                lookbehind: true,
                alias: "language-regex",
                inside: n4.languages.regex
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
            inside: n4.languages.javascript
        },
        {
            pattern: /(^|[^$\w\xA0-\uFFFF])(?!\s)[_$a-z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*=>)/i,
            lookbehind: true,
            inside: n4.languages.javascript
        },
        {
            pattern: /(\(\s*)(?!\s)(?:[^()\s]|\s+(?![\s)])|\([^()]*\))+(?=\s*\)\s*=>)/,
            lookbehind: true,
            inside: n4.languages.javascript
        },
        {
            pattern: /((?:\b|\s|^)(?!(?:as|async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|set|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)(?![$\w\xA0-\uFFFF]))(?:(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*\s*)\(\s*|\]\s*\(\s*)(?!\s)(?:[^()\s]|\s+(?![\s)])|\([^()]*\))+(?=\s*\)\s*\{)/,
            lookbehind: true,
            inside: n4.languages.javascript
        }
    ],
    constant: /\b[A-Z](?:[A-Z_]|\dx?)*\b/
});
n4.languages.insertBefore("javascript", "string", {
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
                    rest: n4.languages.javascript
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
n4.languages.insertBefore("javascript", "operator", {
    "literal-property": {
        pattern: /((?:^|[,{])[ \t]*)(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*:)/m,
        lookbehind: true,
        alias: "property"
    }
});
if (n4.languages.markup) {
    n4.languages.markup.tag.addInlined("script", "javascript");
    n4.languages.markup.tag.addAttribute(/on(?:abort|blur|change|click|composition(?:end|start|update)|dblclick|error|focus(?:in|out)?|key(?:down|up)|load|mouse(?:down|enter|leave|move|out|over|up)|reset|resize|scroll|select|slotchange|submit|unload|wheel)/.source, "javascript");
}
n4.languages.js = n4.languages.javascript;
(function() {
    if ("undefined" !== typeof n4 && "undefined" !== typeof document) {
        Element.prototype.matches || (Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector);
        var t27 = "Loading…";
        var FAILURE_MESSAGE = function(e33, t29) {
            return "✖ Error " + e33 + " while fetching file: " + t29;
        };
        var a26 = "✖ Error: File does not exist or is empty";
        var r18 = {
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
        var i22 = "data-src-status";
        var s2 = "loading";
        var l10 = "loaded";
        var o13 = "failed";
        var u14 = "pre[data-src]:not([" + i22 + '="' + l10 + '"]):not([' + i22 + '="' + s2 + '"])';
        n4.hooks.add("before-highlightall", function(e34) {
            e34.selector += ", " + u14;
        });
        n4.hooks.add("before-sanity-check", function(e35) {
            var a28 = e35.element;
            if (a28.matches(u14)) {
                e35.code = "";
                a28.setAttribute(i22, s2);
                var g13 = a28.appendChild(document.createElement("CODE"));
                g13.textContent = t27;
                var c6 = a28.getAttribute("data-src");
                var d7 = e35.language;
                if ("none" === d7) {
                    var p6 = (/\.(\w+)$/.exec(c6) || [
                        ,
                        "none"
                    ])[1];
                    d7 = r18[p6] || p6;
                }
                n4.util.setLanguage(g13, d7);
                n4.util.setLanguage(a28, d7);
                var h6 = n4.plugins.autoloader;
                h6 && h6.loadLanguages(d7);
                loadFile(c6, function(e36) {
                    a28.setAttribute(i22, l10);
                    var t30 = parseRange(a28.getAttribute("data-range"));
                    if (t30) {
                        var r19 = e36.split(/\r\n?|\n/g);
                        var s24 = t30[0];
                        var o10 = null == t30[1] ? r19.length : t30[1];
                        s24 < 0 && (s24 += r19.length);
                        s24 = Math.max(0, Math.min(s24 - 1, r19.length));
                        o10 < 0 && (o10 += r19.length);
                        o10 = Math.max(0, Math.min(o10, r19.length));
                        e36 = r19.slice(s24, o10).join("\n");
                        a28.hasAttribute("data-start") || a28.setAttribute("data-start", String(s24 + 1));
                    }
                    g13.textContent = e36;
                    n4.highlightElement(g13);
                }, function(e37) {
                    a28.setAttribute(i22, o13);
                    g13.textContent = e37;
                });
            }
        });
        n4.plugins.fileHighlight = {
            highlight: function highlight(e38) {
                var t31 = (e38 || document).querySelectorAll(u14);
                for(var a29, r20 = 0; a29 = t31[r20++];)n4.highlightElement(a29);
            }
        };
        var g14 = false;
        n4.fileHighlight = function() {
            if (!g14) {
                console.warn("Prism.fileHighlight is deprecated. Use `Prism.plugins.fileHighlight.highlight` instead.");
                g14 = true;
            }
            n4.plugins.fileHighlight.highlight.apply(this || e3, arguments);
        };
    }
    function loadFile(e39, t32, n22) {
        var r21 = new XMLHttpRequest;
        r21.open("GET", e39, true);
        r21.onreadystatechange = function() {
            4 == r21.readyState && (r21.status < 400 && r21.responseText ? t32(r21.responseText) : r21.status >= 400 ? n22(FAILURE_MESSAGE(r21.status, r21.statusText)) : n22(a26));
        };
        r21.send(null);
    }
    function parseRange(e40) {
        var t33 = /^\s*(\d+)\s*(?:(,)\s*(?:(\d+)\s*)?)?$/.exec(e40 || "");
        if (t33) {
            var a30 = Number(t33[1]);
            var n23 = t33[2];
            var r22 = t33[3];
            return n23 ? r22 ? [
                a30,
                Number(r22)
            ] : [
                a30,
                void 0
            ] : [
                a30,
                a30
            ];
        }
    }
})();
var r5 = t4;
class Renderer1 extends marked.Renderer {
    heading(text, level, raw, slugger) {
        const slug = slugger.slug(raw);
        return `<h${level} id="${slug}"><a class="anchor" aria-hidden="true" tabindex="-1" href="#${slug}"><svg class="octicon octicon-link" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M7.775 3.275a.75.75 0 001.06 1.06l1.25-1.25a2 2 0 112.83 2.83l-2.5 2.5a2 2 0 01-2.83 0 .75.75 0 00-1.06 1.06 3.5 3.5 0 004.95 0l2.5-2.5a3.5 3.5 0 00-4.95-4.95l-1.25 1.25zm-4.69 9.64a2 2 0 010-2.83l2.5-2.5a2 2 0 012.83 0 .75.75 0 001.06-1.06 3.5 3.5 0 00-4.95 0l-2.5 2.5a3.5 3.5 0 004.95 4.95l1.25-1.25a.75.75 0 00-1.06-1.06l-1.25 1.25a2 2 0 01-2.83 0z"></path></svg></a>${text}</h${level}>`;
    }
    code(code, language) {
        language = language.split(",")[0];
        const grammar = Object.hasOwnProperty.call(r5.languages, language) ? r5.languages[language] : undefined;
        if (grammar === undefined) {
            return `<pre><code>${t3.escape(code)}</code></pre>`;
        }
        const html = r5.highlight(code, grammar, language);
        return `<div class="highlight highlight-source-${language}"><pre>${html}</pre></div>`;
    }
    link(href, title, text) {
        if (href.startsWith("#")) {
            return `<a href="${href}" title="${title}">${text}</a>`;
        }
        return `<a href="${href}" title="${title}" rel="noopener noreferrer">${text}</a>`;
    }
}
const pageServingHeaders = {
    "content-type": "text/html; charset=UTF-8",
    "Cache-Control": "s-maxage=1500, public, immutable, stale-while-revalidate=1501",
    Link: `<https://ga.jspm.io>; rel="preconnect",<https://fonts.googleapis.com>; rel="preconnect", <https://ga.jspm.io/npm:normalize.css@8.0.1/normalize.css>; rel="preload"; as="style", <https://fonts.googleapis.com/css2?family=Abril+Fatface&family=Bebas+Neue&family=Major+Mono+Display&family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,700&family=Source+Code+Pro&family=Vollkorn&family=Inter:wght@200;400;800&display=swap>; rel="preload"; as="style"`
};
function renderMarkdownContent(markdown, opts = {}) {
    markdown = emojify(markdown);
    return marked(markdown, {
        gfm: true,
        renderer: new Renderer1()
    });
}
const FEATURED_PACKAGES = [
    {
        name: "svelte",
        version: "3.46.2",
        description: "Cybernetically enhanced web apps"
    },
    {
        name: "lit",
        version: "2.1.1",
        description: "A library for building fast, lightweight web components"
    },
    {
        name: "preact",
        version: "10.6.4",
        description: "Fast 3kb React-compatible Virtual DOM library."
    },
    {
        name: "vue",
        version: "2.6.14",
        description: "Reactive, component-oriented view layer for modern web interfaces."
    },
    {
        name: "react",
        version: "17.0.2",
        description: "React is a JavaScript library for building user interfaces."
    },
    {
        name: "lodash",
        version: "4.17.21",
        description: "Lodash modular utilities."
    },
    {
        name: "@babel/core",
        version: "7.16.7",
        description: "Babel compiler core."
    },
    {
        name: "rollup",
        version: "2.64.0",
        description: "Next-generation ES module bundler"
    },
    {
        name: "@jspm/generator",
        version: "1.0.0-beta.22",
        description: 'Package Import Map Generation Tool"'
    },
    {
        name: "@jspm/import-map",
        version: "0.3.3",
        description: "Package Import Map Utility"
    },
    {
        name: "xstate",
        version: "4.27.0",
        description: "Finite State Machines and Statecharts for the Modern Web."
    }
];
function repoURL(url) {
    return url.trim().replace(/^git\+/i, "").replace(/\.git$/i, "").replace(/git@/, "").replace(/(bitbucket|github|gitlab)\.([a-z]+):/, "$1.$2/").replace(/bitbucket:/, "$1.org/").replace(/(github|gitlab):/, "$1.com/").replace(/^(http\s*:\/\/|https\s*:\/\/|\/\/)?/, "https://");
}
function runCheck({ pass , title  }) {
    return {
        [title]: pass()
    };
}
function supportsESM(packageJson) {
    return runCheck({
        title: "ES Module Entrypoint",
        url: "https://docs.skypack.dev/package-authors/package-checks#esm",
        pass: ()=>{
            if (packageJson.type === "module") {
                return true;
            }
            if (packageJson.module) {
                return true;
            }
            if (typeof packageJson.main === "string" && packageJson.main.endsWith(".mjs")) {
                return true;
            }
            if (packageJson.exports && (packageJson.exports["import"] || !!Object.values(packageJson.exports).find((x4)=>typeof x4 === "object" && x4.import
            ))) {
                return true;
            }
            return false;
        }
    });
}
function supportsExportmap(packageJson) {
    return runCheck({
        title: "Export Map",
        url: "https://docs.skypack.dev/package-authors/package-checks#export-map",
        pass: ()=>{
            return !!packageJson.exports;
        }
    });
}
function supportsKeywords(packageJson) {
    return runCheck({
        title: "Keywords",
        url: "https://docs.skypack.dev/package-authors/package-checks#keywords",
        pass: ()=>{
            return !!packageJson.keywords && !!packageJson.keywords.length;
        }
    });
}
function supportsLicense(packageJson) {
    return runCheck({
        title: "License",
        url: "https://docs.skypack.dev/package-authors/package-checks#license",
        pass: ()=>{
            return !!packageJson.license;
        }
    });
}
function parseURL(meta) {
    if (!meta) {
        return false;
    }
    if (typeof meta === "string") {
        return meta;
    }
    if (meta.url) {
        return new URL(repoURL(meta.url)).toString();
    }
    return false;
}
function supportsRepositoryURL(packageJson) {
    return runCheck({
        title: "Repository URL",
        url: "https://docs.skypack.dev/package-authors/package-checks#repository",
        pass: ()=>!!parseURL(packageJson.repository)
    });
}
function supportsTypes(packageJson) {
    return runCheck({
        title: "TypeScript Types",
        url: "https://docs.skypack.dev/package-authors/package-checks#types",
        pass: ()=>{
            const isOk = !!packageJson.types || !!packageJson.typings || !!packageJson.typesVersions;
            if (isOk) {
                return true;
            }
            if (packageJson.files.includes("index.d.ts")) {
                console.warn('"./index.d.ts" file found, but package.json "types" entry is missing.');
                console.warn("Learn more about why this is still required: https://github.com/skypackjs/package-check/issues/6#issuecomment-714840634");
                return false;
            }
            return false;
        }
    });
}
function supportsReadme(packageJson) {
    return runCheck({
        title: "README",
        url: "https://docs.skypack.dev/package-authors/package-checks#readme",
        pass: ()=>{
            return !!packageJson.files.find((f6)=>/^readme\.?/i.test(f6)
            );
        }
    });
}
function features(packageJson) {
    return {
        "ESM via JSPM": true,
        ...supportsESM(packageJson),
        ...supportsExportmap(packageJson),
        ...supportsKeywords(packageJson),
        ...supportsLicense(packageJson),
        ...supportsRepositoryURL(packageJson),
        ...supportsTypes(packageJson),
        ...supportsReadme(packageJson)
    };
}
const importMeta = {
    url: "file:///Users/shukla001/@jspm/jspm-packages/server.jsx",
    main: import.meta.main
};
const { Helmet: Helmet13  } = ze;
const staticResources = {
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
    "/main.js": {
        path: "./lib/main.js",
        contentType: "application/javascript; charset=utf-8"
    },
    "/main.js.map": {
        path: "./lib/main.js.map",
        contentType: "application/javascript; charset=utf-8"
    },
    "/dom-root.js": {
        path: "./lib/dom-root.js",
        contentType: "application/javascript; charset=utf-8"
    },
    "/dom-root.js.map": {
        path: "./lib/dom-root.js.map",
        contentType: "application/javascript; charset=utf-8"
    },
    "/importmap-dialog.js": {
        path: "./lib/importmap-dialog.js",
        contentType: "application/javascript; charset=utf-8"
    },
    "/importmap-dialog.js.map": {
        path: "./lib/importmap-dialog.js.map",
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
    "/package.js": {
        path: "./lib/package.js",
        contentType: "application/javascript; charset=utf-8"
    },
    "/package.js.map": {
        path: "./lib/package.js.map",
        contentType: "application/javascript; charset=utf-8"
    },
    "/readme.js": {
        path: "./lib/readme.js",
        contentType: "application/javascript; charset=utf-8"
    },
    "/readme.js.map": {
        path: "./lib/readme.js.map",
        contentType: "application/javascript; charset=utf-8"
    },
    "/aside.js": {
        path: "./lib/aside.js",
        contentType: "application/javascript; charset=utf-8"
    },
    "/aside.js.map": {
        path: "./lib/aside.js.map",
        contentType: "application/javascript; charset=utf-8"
    },
    "/footer.js": {
        path: "./lib/footer.js",
        contentType: "application/javascript; charset=utf-8"
    },
    "/footer.js.map": {
        path: "./lib/footer.js.map",
        contentType: "application/javascript; charset=utf-8"
    },
    "/separator.js": {
        path: "./lib/separator.js",
        contentType: "application/javascript; charset=utf-8"
    },
    "/separator.js.map": {
        path: "./lib/separator.js.map",
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
    "/icon-distributed.png": {
        path: "./images/icon-distributed.png",
        contentType: "image/png"
    },
    "/favicon.ico": {
        path: "./favicon.ico",
        contentType: "image/vnd.microsoft.icon"
    }
};
async function generateHTML({ template , body , head , footer  } = {
    template: "./shell.html"
}) {
    const content = await Deno.readTextFile(template);
    const [START, AFTER_HEADER_BEFORE_CONTENT, DOM_SCRIPT, END] = content.split(/<!-- __[A-Z]*__ -->/i);
    return [
        START,
        head.join("\n"),
        AFTER_HEADER_BEFORE_CONTENT,
        body,
        DOM_SCRIPT,
        footer.join("\n"),
        END, 
    ].join("\n");
}
function removeLeadingSlash(path) {
    if (path.startsWith("/")) {
        return path.slice(1);
    }
    return path;
}
function removeTrailingSlash(path) {
    if (path.endsWith("/")) {
        return path.slice(0, -1);
    }
    return path;
}
function removeSlashes(path) {
    return removeTrailingSlash(removeLeadingSlash(path));
}
async function requestHandler(request) {
    try {
        const { pathname , searchParams  } = new URL(request.url);
        const NPM_PROVIDER_URL = "https://ga.jspm.io/npm:";
        const npmPackage = searchParams.get("q");
        if (npmPackage) {
            const npmPackageProbe = await fetch(`${NPM_PROVIDER_URL}${npmPackage}`);
            const npmPackageVersion = await npmPackageProbe.text();
            if (npmPackageVersion) {
                return new Response(npmPackage, {
                    status: 302,
                    headers: {
                        "Location": `/package/${npmPackage}@${npmPackageVersion}`
                    }
                });
            }
        }
        const pathSegments = removeSlashes(pathname).split("/");
        const staticResource = staticResources[`/${pathSegments[pathSegments.length - 1]}`];
        if (staticResource) {
            const response = await Deno.readFile(staticResource.path);
            return new Response(response, {
                headers: {
                    "content-type": staticResource.contentType
                }
            });
        }
        if (pathname === "/") {
            const indexPage = gt(xt(Home, {
                packages: FEATURED_PACKAGES
            }));
            const { body , head , footer  } = Helmet13.SSR(indexPage);
            const html = await generateHTML({
                template: "./shell.html",
                body,
                head,
                footer
            });
            return new Response(html, {
                headers: pageServingHeaders
            });
        }
        const BASE_PATH = "/package/";
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
                const [jspmPackage, READMEFile, readmeFile1] = await Promise.all(filesToFetch.map((file)=>fetch(`${baseURL}/${file}`)
                ));
                const packageJson = await jspmPackage.json();
                const { name , description , keywords , version , license , files , exports , types , type , homepage , repository , bugs  } = packageJson;
                const readmeFileContent = await [
                    READMEFile,
                    readmeFile1
                ].find((readmeFile)=>readmeFile.status === 200 || readmeFile.status === 304
                ).text();
                const weeklyDownloadsResponse = await fetch(`https://api.npmjs.org/downloads/point/last-week/${name}`);
                const { downloads  } = await weeklyDownloadsResponse.json();
                const packageMetaData = await fetch(`https://registry.npmjs.org/${name}`);
                const { maintainers , readme , time: { created: createdISO , modified  }  } = await packageMetaData.json();
                r1.extend(n2);
                const updated = r1(modified).fromNow();
                const created = r1(createdISO).fromNow();
                try {
                    const readmeHTML = renderMarkdownContent(readmeFileContent || readme);
                    const filteredExport = Object.keys(exports).filter((expt)=>!expt.endsWith("!cjs") && !expt.endsWith("/") && expt.indexOf("*") === -1
                    ).sort();
                    const links = {
                        homepage,
                        repository: parseURL(repository),
                        issues: parseURL(bugs)
                    };
                    const app = gt(xt(SsrRoot, {
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
                    const { body , head , footer  } = Helmet13.SSR(app);
                    const html = await generateHTML({
                        template: "./shell.html",
                        body,
                        head,
                        footer
                    });
                    return new Response(html, {
                        headers: pageServingHeaders
                    });
                } catch (e5) {
                    console.error(`Failed in generating package-page ${name}@${version}`);
                    console.error(e5);
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
    serve(requestHandler);
}
