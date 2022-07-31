function fromPkgStr(pkg: string) {
  const versionIndex = pkg.indexOf("@", 1);
  const name = pkg.slice(0, versionIndex);
  let subpathIndex = pkg.indexOf("/", versionIndex);
  if (subpathIndex === -1) {
    subpathIndex = pkg.length;
  }
  const version = pkg.slice(versionIndex + 1, subpathIndex);
  const subpath = "." + pkg.slice(name.length + version.length + 1);
  return { name, version, subpath };
}

function parsePackageNameVersion(pkg: string) {
  const isScopedPackage = pkg.startsWith('@');
  const packageNameVersion = isScopedPackage ? pkg.slice(1, pkg.length) : pkg;
  const [name, version] = packageNameVersion.split('@')
  return {name: isScopedPackage ? `@${name}` : name, version}
}

function getRandomFloat(min: number, max: number) {
  return (Math.random() * (max - min) + min).toFixed(2);
}

async function getRecentPackages() {
  const maintenance = getRandomFloat(0, 1.0);
  const quality = getRandomFloat(0.5, 1.0);
  const popularity = getRandomFloat(0.3, 1.0);
  const url =
    `https://registry.npmjs.org/-/v1/search?text=not:insecure&maintenance=${maintenance}&quality=${quality}&popularity=${popularity}`;

  const result = await fetch(url);
  const recentPackages = await result.json();

  return recentPackages;
}

const pageServingHeaders = {
  "content-type": "text/html; charset=UTF-8",
  "Cache-Control":
    "s-maxage=1500, public, immutable, stale-while-revalidate=1501",
  Link:
    `<https://ga.jspm.io>; rel="preconnect",<https://fonts.googleapis.com>; rel="preconnect", <https://ga.jspm.io/npm:normalize.css@8.0.1/normalize.css>; rel="preload"; as="style", <https://fonts.googleapis.com/css2?family=Abril+Fatface&family=Bebas+Neue&family=Major+Mono+Display&family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,700&family=Source+Code+Pro&family=Vollkorn&family=Inter:wght@200;400;800&display=swap>; rel="preload"; as="style"`,
};


/**
 * @param {string} path
 * @returns {string}
 */
 function removeLeadingSlash(path: string) {
  if (path.startsWith("/")) {
    return path.slice(1);
  }
  return path;
}

/**
 * @param {string} path
 * @returns {string}
 */
function removeTrailingSlash(path: string) {
  if (path.endsWith("/")) {
    return path.slice(0, -1);
  }
  return path;
}

/**
 * @param {string} path
 * @returns {string}
 */
function removeSlashes(path: string) {
  return removeTrailingSlash(removeLeadingSlash(path));
}

export { fromPkgStr, parsePackageNameVersion, getRandomFloat, getRecentPackages, pageServingHeaders, removeSlashes };
