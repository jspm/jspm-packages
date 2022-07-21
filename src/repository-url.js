var s = {};
const maybeJoin = (...t) => t.every((t) => t) ? t.join("") : "";
const maybeEncode = (t) => t ? encodeURIComponent(t) : "";
const i = {
  sshtemplate: ({ domain: t, user: e, project: s, committish: i }) =>
    `git@${t}:${e}/${s}.git${maybeJoin("#", i)}`,
  sshurltemplate: ({ domain: t, user: e, project: s, committish: i }) =>
    `git+ssh://git@${t}/${e}/${s}.git${maybeJoin("#", i)}`,
  browsetemplate: (
    { domain: t, user: e, project: s, committish: i, treepath: o },
  ) => `https://${t}/${e}/${s}${maybeJoin("/", o, "/", maybeEncode(i))}`,
  browsefiletemplate: (
    {
      domain: t,
      user: e,
      project: s,
      committish: i,
      treepath: o,
      path: r,
      fragment: h,
      hashformat: a,
    },
  ) =>
    `https://${t}/${e}/${s}/${o}/${maybeEncode(i || "master")}/${r}${
      maybeJoin("#", a(h || ""))
    }`,
  docstemplate: (
    { domain: t, user: e, project: s, treepath: i, committish: o },
  ) => `https://${t}/${e}/${s}${maybeJoin("/", i, "/", maybeEncode(o))}#readme`,
  httpstemplate: ({ auth: t, domain: e, user: s, project: i, committish: o }) =>
    `git+https://${maybeJoin(t, "@")}${e}/${s}/${i}.git${maybeJoin("#", o)}`,
  filetemplate: ({ domain: t, user: e, project: s, committish: i, path: o }) =>
    `https://${t}/${e}/${s}/raw/${maybeEncode(i) || "master"}/${o}`,
  shortcuttemplate: ({ type: t, user: e, project: s, committish: i }) =>
    `${t}:${e}/${s}${maybeJoin("#", i)}`,
  pathtemplate: ({ user: t, project: e, committish: s }) =>
    `${t}/${e}${maybeJoin("#", s)}`,
  bugstemplate: ({ domain: t, user: e, project: s }) =>
    `https://${t}/${e}/${s}/issues`,
  hashformat: formatHashFragment,
};
const o = {};
o.github = Object.assign({}, i, {
  protocols: ["git:", "http:", "git+ssh:", "git+https:", "ssh:", "https:"],
  domain: "github.com",
  treepath: "tree",
  filetemplate: ({ auth: t, user: e, project: s, committish: i, path: o }) =>
    `https://${maybeJoin(t, "@")}raw.githubusercontent.com/${e}/${s}/${
      maybeEncode(i) || "master"
    }/${o}`,
  gittemplate: ({ auth: t, domain: e, user: s, project: i, committish: o }) =>
    `git://${maybeJoin(t, "@")}${e}/${s}/${i}.git${maybeJoin("#", o)}`,
  tarballtemplate: ({ domain: t, user: e, project: s, committish: i }) =>
    `https://codeload.${t}/${e}/${s}/tar.gz/${maybeEncode(i) || "master"}`,
  extract: (t) => {
    let [, e, s, i, o] = t.pathname.split("/", 5);
    if (!i || "tree" === i) {
      i || (o = t.hash.slice(1));
      s && s.endsWith(".git") && (s = s.slice(0, -4));
      if (e && s) return { user: e, project: s, committish: o };
    }
  },
});
o.bitbucket = Object.assign({}, i, {
  protocols: ["git+ssh:", "git+https:", "ssh:", "https:"],
  domain: "bitbucket.org",
  treepath: "src",
  tarballtemplate: ({ domain: t, user: e, project: s, committish: i }) =>
    `https://${t}/${e}/${s}/get/${maybeEncode(i) || "master"}.tar.gz`,
  extract: (t) => {
    let [, e, s, i] = t.pathname.split("/", 4);
    if (!["get"].includes(i)) {
      s && s.endsWith(".git") && (s = s.slice(0, -4));
      if (e && s) return { user: e, project: s, committish: t.hash.slice(1) };
    }
  },
});
o.gitlab = Object.assign({}, i, {
  protocols: ["git+ssh:", "git+https:", "ssh:", "https:"],
  domain: "gitlab.com",
  treepath: "tree",
  httpstemplate: ({ auth: t, domain: e, user: s, project: i, committish: o }) =>
    `git+https://${maybeJoin(t, "@")}${e}/${s}/${i}.git${maybeJoin("#", o)}`,
  tarballtemplate: ({ domain: t, user: e, project: s, committish: i }) =>
    `https://${t}/${e}/${s}/repository/archive.tar.gz?ref=${
      maybeEncode(i) || "master"
    }`,
  extract: (t) => {
    const e = t.pathname.slice(1);
    if (e.includes("/-/") || e.includes("/archive.tar.gz")) return;
    const s = e.split("/");
    let i = s.pop();
    i.endsWith(".git") && (i = i.slice(0, -4));
    const o = s.join("/");
    return o && i
      ? { user: o, project: i, committish: t.hash.slice(1) }
      : void 0;
  },
});
o.gist = Object.assign({}, i, {
  protocols: ["git:", "git+ssh:", "git+https:", "ssh:", "https:"],
  domain: "gist.github.com",
  sshtemplate: ({ domain: t, project: e, committish: s }) =>
    `git@${t}:${e}.git${maybeJoin("#", s)}`,
  sshurltemplate: ({ domain: t, project: e, committish: s }) =>
    `git+ssh://git@${t}/${e}.git${maybeJoin("#", s)}`,
  browsetemplate: ({ domain: t, project: e, committish: s }) =>
    `https://${t}/${e}${maybeJoin("/", maybeEncode(s))}`,
  browsefiletemplate: (
    { domain: t, project: e, committish: s, path: i, hashformat: o },
  ) =>
    `https://${t}/${e}${maybeJoin("/", maybeEncode(s))}${maybeJoin("#", o(i))}`,
  docstemplate: ({ domain: t, project: e, committish: s }) =>
    `https://${t}/${e}${maybeJoin("/", maybeEncode(s))}`,
  httpstemplate: ({ domain: t, project: e, committish: s }) =>
    `git+https://${t}/${e}.git${maybeJoin("#", s)}`,
  filetemplate: ({ user: t, project: e, committish: s, path: i }) =>
    `https://gist.githubusercontent.com/${t}/${e}/raw${
      maybeJoin("/", maybeEncode(s))
    }/${i}`,
  shortcuttemplate: ({ type: t, project: e, committish: s }) =>
    `${t}:${e}${maybeJoin("#", s)}`,
  pathtemplate: ({ project: t, committish: e }) => `${t}${maybeJoin("#", e)}`,
  bugstemplate: ({ domain: t, project: e }) => `https://${t}/${e}`,
  gittemplate: ({ domain: t, project: e, committish: s }) =>
    `git://${t}/${e}.git${maybeJoin("#", s)}`,
  tarballtemplate: ({ project: t, committish: e }) =>
    `https://codeload.github.com/gist/${t}/tar.gz/${
      maybeEncode(e) || "master"
    }`,
  extract: (t) => {
    let [, e, s, i] = t.pathname.split("/", 4);
    if ("raw" !== i) {
      if (!s) {
        if (!e) return;
        s = e;
        e = null;
      }
      s.endsWith(".git") && (s = s.slice(0, -4));
      return { user: e, project: s, committish: t.hash.slice(1) };
    }
  },
  hashformat: function (t) {
    return t && "file-" + formatHashFragment(t);
  },
});
o.sourcehut = Object.assign({}, i, {
  protocols: ["git+ssh:", "https:"],
  domain: "git.sr.ht",
  treepath: "tree",
  browsefiletemplate: (
    {
      domain: t,
      user: e,
      project: s,
      committish: i,
      treepath: o,
      path: r,
      fragment: h,
      hashformat: a,
    },
  ) =>
    `https://${t}/${e}/${s}/${o}/${maybeEncode(i || "main")}/${r}${
      maybeJoin("#", a(h || ""))
    }`,
  filetemplate: ({ domain: t, user: e, project: s, committish: i, path: o }) =>
    `https://${t}/${e}/${s}/blob/${maybeEncode(i) || "main"}/${o}`,
  httpstemplate: ({ domain: t, user: e, project: s, committish: i }) =>
    `https://${t}/${e}/${s}.git${maybeJoin("#", i)}`,
  tarballtemplate: ({ domain: t, user: e, project: s, committish: i }) =>
    `https://${t}/${e}/${s}/archive/${maybeEncode(i) || "main"}.tar.gz`,
  bugstemplate: ({ domain: t, user: e, project: s }) =>
    `https://todo.sr.ht/${e}/${s}`,
  docstemplate: (
    { domain: t, user: e, project: s, treepath: i, committish: o },
  ) => `https://${t}/${e}/${s}${maybeJoin("/", i, "/", maybeEncode(o))}#readme`,
  extract: (t) => {
    let [, e, s, i] = t.pathname.split("/", 4);
    if (!["archive"].includes(i)) {
      s && s.endsWith(".git") && (s = s.slice(0, -4));
      if (e && s) return { user: e, project: s, committish: t.hash.slice(1) };
    }
  },
});
const r = Object.keys(o);
o.byShortcut = {};
o.byDomain = {};
for (const t of r) {
  o.byShortcut[`${t}:`] = t;
  o.byDomain[o[t].domain] = t;
}
function formatHashFragment(t) {
  return t.toLowerCase().replace(/^\W+|\/|\W+$/g, "").replace(/\W+/g, "-");
}
s = o;
var h = s;
var a = {};
const n = h;
class GitHost$1 {
  constructor(t, e, s, i, o, r, h = {}) {
    Object.assign(this, n[t]);
    this.type = t;
    this.user = e;
    this.auth = s;
    this.project = i;
    this.committish = o;
    this.default = r;
    this.opts = h;
  }
  hash() {
    return this.committish ? `#${this.committish}` : "";
  }
  ssh(t) {
    return this._fill(this.sshtemplate, t);
  }
  _fill(t, e) {
    if ("function" === typeof t) {
      const s = { ...this, ...this.opts, ...e };
      s.path || (s.path = "");
      s.path.startsWith("/") && (s.path = s.path.slice(1));
      s.noCommittish && (s.committish = null);
      const i = t(s);
      return s.noGitPlus && i.startsWith("git+") ? i.slice(4) : i;
    }
    return null;
  }
  sshurl(t) {
    return this._fill(this.sshurltemplate, t);
  }
  browse(t, e, s) {
    if ("string" !== typeof t) return this._fill(this.browsetemplate, t);
    if ("string" !== typeof e) {
      s = e;
      e = null;
    }
    return this._fill(this.browsefiletemplate, { ...s, fragment: e, path: t });
  }
  docs(t) {
    return this._fill(this.docstemplate, t);
  }
  bugs(t) {
    return this._fill(this.bugstemplate, t);
  }
  https(t) {
    return this._fill(this.httpstemplate, t);
  }
  git(t) {
    return this._fill(this.gittemplate, t);
  }
  shortcut(t) {
    return this._fill(this.shortcuttemplate, t);
  }
  path(t) {
    return this._fill(this.pathtemplate, t);
  }
  tarball(t) {
    return this._fill(this.tarballtemplate, { ...t, noCommittish: false });
  }
  file(t, e) {
    return this._fill(this.filetemplate, { ...e, path: t });
  }
  getDefaultRepresentation() {
    return this.default;
  }
  toString(t) {
    return this.default && "function" === typeof this[this.default]
      ? this[this.default](t)
      : this.sshurl(t);
  }
}
a = GitHost$1;
var c = a;
var p = {};
const $ = h;
const f = p = c;
const j = {
  "git+ssh:": "sshurl",
  "git+https:": "https",
  "ssh:": "sshurl",
  "git:": "git",
};
function protocolToRepresentation(t) {
  return j[t] || t.slice(0, -1);
}
const b = {
  "git:": true,
  "https:": true,
  "git+https:": true,
  "http:": true,
  "git+http:": true,
};
const x = Object.keys($.byShortcut).concat([
  "http:",
  "https:",
  "git:",
  "git+ssh:",
  "git+https:",
  "ssh:",
]);
p.fromUrl = function (t, e) {
  if ("string" !== typeof t) return;
  return fromUrl(t, e);
};
function fromUrl(t, e) {
  if (!t) return;
  const s = isGitHubShorthand(t) ? "github:" + t : correctProtocol(t);
  const i = parseGitUrl(s);
  if (!i) return i;
  const o = $.byShortcut[i.protocol];
  const r =
    $.byDomain[
      i.hostname.startsWith("www.")
        ? i.hostname.slice(4)
        : i.hostname
    ];
  const h = o || r;
  if (!h) return;
  const a = $[o || r];
  let n = null;
  b[i.protocol] && (i.username || i.password) &&
    (n = `${i.username}${i.password ? ":" + i.password : ""}`);
  let c = null;
  let m = null;
  let l = null;
  let p = null;
  try {
    if (o) {
      let t = i.pathname.startsWith("/") ? i.pathname.slice(1) : i.pathname;
      const e = t.indexOf("@");
      e > -1 && (t = t.slice(e + 1));
      const s = t.lastIndexOf("/");
      if (s > -1) {
        m = decodeURIComponent(t.slice(0, s));
        m || (m = null);
        l = decodeURIComponent(t.slice(s + 1));
      } else l = decodeURIComponent(t);
      l.endsWith(".git") && (l = l.slice(0, -4));
      i.hash && (c = decodeURIComponent(i.hash.slice(1)));
      p = "shortcut";
    } else {
      if (!a.protocols.includes(i.protocol)) return;
      const t = a.extract(i);
      if (!t) return;
      m = t.user && decodeURIComponent(t.user);
      l = decodeURIComponent(t.project);
      c = decodeURIComponent(t.committish);
      p = protocolToRepresentation(i.protocol);
    }
  } catch (t) {
    if (t instanceof URIError) return;
    throw t;
  }
  return new f(h, m, n, l, c, p, e);
}
const correctProtocol = (t) => {
  const e = t.indexOf(":");
  const s = t.slice(0, e + 1);
  if (x.includes(s)) return t;
  const i = t.indexOf("@");
  if (i > -1) return i > e ? `git+ssh://${t}` : t;
  const o = t.indexOf("//");
  return o === e + 1 ? t : t.slice(0, e + 1) + "//" + t.slice(e + 1);
};
const isGitHubShorthand = (t) => {
  const e = t.indexOf("#");
  const s = t.indexOf("/");
  const i = t.indexOf("/", s + 1);
  const o = t.indexOf(":");
  const r = /\s/.exec(t);
  const h = t.indexOf("@");
  const a = !r || e > -1 && r.index > e;
  const n = -1 === h || e > -1 && h > e;
  const c = -1 === o || e > -1 && o > e;
  const m = -1 === i || e > -1 && i > e;
  const l = s > 0;
  const p = e > -1 ? "/" !== t[e - 1] : !t.endsWith("/");
  const u = !t.startsWith(".");
  return a && l && p && u && n && c && m;
};
const correctUrl = (t) => {
  const e = t.indexOf("@");
  const s = t.lastIndexOf("#");
  let i = t.indexOf(":");
  let o = t.lastIndexOf(":", s > -1 ? s : Infinity);
  let r;
  if (o > e) {
    r = t.slice(0, o) + "/" + t.slice(o + 1);
    i = r.indexOf(":");
    o = r.lastIndexOf(":");
  }
  -1 === i && -1 === t.indexOf("//") && (r = `git+ssh://${r}`);
  return r;
};
const parseGitUrl = (t) => {
  let e;
  try {
    e = new URL(t);
  } catch (t) {}
  if (e) return e;
  const s = correctUrl(t);
  try {
    e = new URL(s);
  } catch (t) {}
  return e;
};
var O = p;
const w = p.fromUrl;
export { O as default, w as fromUrl };
