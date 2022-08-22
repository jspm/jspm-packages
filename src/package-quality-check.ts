
import hostedGitInfo from "@jspm/packages/repository-url";

// 🙏🏻🙏🏻🙏🏻 Gratefully taken from
// - https://github.com/skypackjs/package-check/blob/ee925e7410bdd8252c0582b54f841231a4ae9bbf/src/index.ts
// - https://github.com/skypackjs/package-check/blob/ee925e7410bdd8252c0582b54f841231a4ae9bbf/src/get-repo-url.ts

/** Turn repo URL into normal URL */
function repoURL(url: string) {
  return url
    .trim()
    .replace(/^git\+/i, "")
    .replace(/\.git$/i, "")
    .replace(/git@/, "")
    .replace(/(bitbucket|github|gitlab)\.([a-z]+):/, "$1.$2/")
    .replace(/bitbucket:/, "$1.org/")
    .replace(/(github|gitlab):/, "$1.com/")
    .replace(/^(http\s*:\/\/|https\s*:\/\/|\/\/)?/, "https://");
}

function repositoryURL(repository: string | {type: string, url: string}) {
  if(!repository){
    return false;
  }
  const url = repository.url || repository;
  const repositoryInfo = hostedGitInfo.fromUrl(url);
  const repositoryURL = repositoryInfo.browse();
  return repositoryURL;
}

function runCheck({ pass, title }) {
  return { [title]: pass() };
}

function supportsESM(packageJson) {
  // Check: Has ESM
  return runCheck({
    title: "ES Module Entrypoint",
    url: "https://docs.skypack.dev/package-authors/package-checks#esm",
    pass: () => {
      if (packageJson.type === "module") {
        return true;
      }
      if (packageJson.module) {
        return true;
      }
      if (
        typeof packageJson.main === "string" &&
        packageJson.main.endsWith(".mjs")
      ) {
        return true;
      }
      if (
        packageJson.exports &&
        (packageJson.exports["import"] ||
          !!Object.values(packageJson.exports).find(
            (x) => typeof x === "object" && x.import,
          ))
      ) {
        return true;
      }
      return false;
    },
  });
}

function supportsExportmap(packageJson) {
  // Check: Export Map
  return runCheck({
    title: "Export Map",
    url: "https://docs.skypack.dev/package-authors/package-checks#export-map",
    pass: () => {
      return !!packageJson.exports;
    },
  });
}

function supportsFiles(packageJson) {
  // Check: Has "files"
  return runCheck({
    title: "No Unnecessary Files",
    url: "https://docs.skypack.dev/package-authors/package-checks#files",
    pass: () => {
      return !!packageJson.files;
    },
  });
}

function supportsKeywords(packageJson) {
  // Check: Has "keywords"
  return runCheck({
    title: "Keywords",
    url: "https://docs.skypack.dev/package-authors/package-checks#keywords",
    pass: () => {
      return !!packageJson.keywords && !!packageJson.keywords.length;
    },
  });
}

function supportsLicense(packageJson) {
  // Check: Has "license"
  return runCheck({
    title: "License",
    url: "https://docs.skypack.dev/package-authors/package-checks#license",

    pass: () => {
      return !!packageJson.license;
    },
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
  // Check: Has "repository url"
  return runCheck({
    title: "Repository URL",
    url: "https://docs.skypack.dev/package-authors/package-checks#repository",
    pass: () => !!repositoryURL(packageJson.repository)
  });
}

function supportsTypes(packageJson) {
  // Check: Has types
  return runCheck({
    title: "TypeScript Types",
    url: "https://docs.skypack.dev/package-authors/package-checks#types",
    pass: () => {
      const isOk = !!packageJson.types || !!packageJson.typings ||
        !!packageJson.typesVersions;
      if (isOk) {
        return true;
      }
      if (packageJson.files.includes("index.d.ts")) {
        console.warn(
          '"./index.d.ts" file found, but package.json "types" entry is missing.',
        );
        console.warn(
          "Learn more about why this is still required: https://github.com/skypackjs/package-check/issues/6#issuecomment-714840634",
        );
        return false;
      }
      return false;
    },
  });
}

function supportsReadme(packageJson) {
  // Check: Has "README"
  return runCheck({
    title: "README",
    url: "https://docs.skypack.dev/package-authors/package-checks#readme",
    pass: () => {
      return !!packageJson.files.find((f) => /^readme\.?/i.test(f));
    },
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
    ...supportsReadme(packageJson),
  };
}

export { features, parseURL, repositoryURL };
