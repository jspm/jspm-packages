import type { PackageDescriptor } from "#types";

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

function toPkgStr({ name, version, subpath }: PackageDescriptor) {
  return name + "@" + version + subpath.slice(1);
}

function fromPkgStrToPin(pkg: string) {
  const { name, subpath } = fromPkgStr(pkg);
  return `${name}${subpath.slice(1)}`;
}

function sortArray(arr: string[]) {
  return arr.sort(([a], [b]) => (a > b ? 1 : -1));
}

function parsePackageNameVersion(pkg: string) {
  const isScopedPackage = pkg.startsWith("@");
  const packageNameVersion = isScopedPackage ? pkg.slice(1, pkg.length) : pkg;
  const [name, version] = packageNameVersion.split("@");
  return { name: isScopedPackage ? `@${name}` : name, version };
}

function getRandomFloat(min: number, max: number) {
  return (Math.random() * (max - min) + min).toFixed(2);
}

async function getRecentPackages() {
  const maintenance = getRandomFloat(0, 1.0);
  const quality = getRandomFloat(0.5, 1.0);
  const popularity = getRandomFloat(0.3, 1.0);
  const url = `https://registry.npmjs.org/-/v1/search?text=not:insecure&maintenance=${maintenance}&quality=${quality}&popularity=${popularity}`;

  const result = await fetch(url);
  return result.json();
}

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

function copyToClipboard(text: string) {
  if (typeof document !== 'undefined') {
    const el = document.createElement("textarea");
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
  }
}
export {
  fromPkgStr,
  fromPkgStrToPin,
  toPkgStr,
  parsePackageNameVersion,
  getRandomFloat,
  getRecentPackages,
  removeSlashes,
  sortArray,
  copyToClipboard,
};
