/** @jsx h */
import {
  contentType,
  lookup,
} from "https://deno.land/x/media_types@v2.12.3/mod.ts";
import nano, { h, renderSSR } from "nano-jsx";
import dayjs from "dayjs";
import dayjsPluginRelativeTime from "dayjs/plugin/relativeTime";
import { Semver } from "sver";
import { SsrRoot } from "@jspm/packages/ssr-root";
import { Home } from "@jspm/packages/home";
import { pageServingHeaders } from "@jspm/packages/utils";
import { render } from "@jspm/packages/renderer";
import { FEATURED_PACKAGES } from "@jspm/packages/featured-packages-list";
import { features, parseURL } from "@jspm/packages/package-quality-check";

const { Helmet } = nano;

const staticResourcesFile = await Deno.readTextFile(
  "./lib/static-resources.json",
);
const staticResources = {
  "/style.css": "./style.css",
  "/favicon.ico": "./favicon.ico",
  ...JSON.parse(staticResourcesFile),
};

async function generateHTML(
  { template, body, head, footer } = { template: "./shell.html" },
) {
  const content = await Deno.readTextFile(template);
  const [START, AFTER_HEADER_BEFORE_CONTENT, DOM_SCRIPT, END] = content
    .split(/<!-- __[A-Z]*__ -->/i);
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

/**
 * @param {string} path
 * @returns {string}
 */
function removeLeadingSlash(path) {
  if (path.startsWith("/")) {
    return path.slice(1);
  }
  return path;
}

/**
 * @param {string} path
 * @returns {string}
 */
function removeTrailingSlash(path) {
  if (path.endsWith("/")) {
    return path.slice(0, -1);
  }
  return path;
}

/**
 * @param {string} path
 * @returns {string}
 */
function removeSlashes(path) {
  return removeTrailingSlash(removeLeadingSlash(path));
}

const NPM_PROVIDER_URL = "https://ga.jspm.io/npm:";

async function redirectToJSPMPackageVersion(packageName) {
  const npmPackageProbe = await fetch(`${NPM_PROVIDER_URL}${packageName}`);
  const npmPackageVersion = await npmPackageProbe.text();

  if (npmPackageVersion) {
    return new Response(packageName, {
      status: 302,
      headers: {
        "Location": `/package/${packageName}@${npmPackageVersion}`,
      },
    });
  }
  return new Response("404", { status: 404 });
}

async function requestHandler(request) {
  try {
    const { pathname, searchParams } = new URL(request.url);
    const packageName = searchParams.get("q");

    if (packageName) {
      return redirectToJSPMPackageVersion(packageName);
    }

    const pathSegments = removeSlashes(pathname).split("/");
    
    const staticResource =
      staticResources[`/${pathSegments[pathSegments.length - 1]}`];

    if (staticResource) {
      const response = await Deno.readFile(staticResource);

      return new Response(response, {
        headers: { "content-type": contentType(lookup(staticResource)) },
      });
    }

    if (pathname === "/") {
      const indexPage = renderSSR(
        <Home packages={FEATURED_PACKAGES} />,
      );
      const { body, head, footer } = Helmet.SSR(indexPage);
      const html = await generateHTML({
        template: "./shell.html",
        body,
        head,
        footer,
      });
      return new Response(html, {
        headers: pageServingHeaders,
      });
    }

    const BASE_PATH = "/package/";
    const maybeReadmeFiles = ["README.md", "readme.md"];

    if (pathname.startsWith(BASE_PATH)) {
      const [, packageName] = pathname.split(BASE_PATH);

      if (packageName) {
        const pathSegments = packageName.split("@");
        if (pathSegments.length === 1) {
          return redirectToJSPMPackageVersion(packageName);
        }
        const baseURL = `${NPM_PROVIDER_URL}${packageName}`;
        const filesToFetch = ["package.json", ...maybeReadmeFiles];

        const [jspmPackage, READMEFile, readmeFile] = await Promise.all(
          filesToFetch.map((file) => fetch(`${baseURL}/${file}`)),
        );
        const packageJson = await jspmPackage.json();
        const {
          name,
          description,
          keywords,
          version,
          license,
          files,
          exports,
          types,
          type,
          homepage,
          repository,
          bugs,
        } = packageJson;

        const readmeFileContent = await [READMEFile, readmeFile]
          .find(
            (readmeFile) =>
              readmeFile.status === 200 || readmeFile.status === 304,
          )
          .text();
        // https://github.com/npm/registry/blob/master/docs/download-counts.md
        const weeklyDownloadsResponse = await fetch(
          `https://api.npmjs.org/downloads/point/last-week/${name}`,
        );

        const { downloads } = await weeklyDownloadsResponse.json();
        // https://github.com/npm/registry
        const packageMetaData = await fetch(
          `https://registry.npmjs.org/${name}`,
        );
        const packageMetaDataJson = await packageMetaData.json();
        const { maintainers, readme, time, versions } = packageMetaDataJson;
        const { created: createdISO, modified } = time;
        dayjs.extend(dayjsPluginRelativeTime);
        const updated = dayjs(time[version]).fromNow();
        const created = dayjs(createdISO).fromNow();
        try {
          // `readme` is preferred here but this content always refers to the latest version
          // hence using it as fallback
          const readmeHTML = render(readmeFileContent || readme);
          // https://github.com/jspm/generator.jspm.io/blob/main/src/api.js#L137
          const filteredExport = Object.keys(exports).filter((expt) =>
            !expt.endsWith("!cjs") && !expt.endsWith("/") &&
            expt.indexOf("*") === -1
          ).sort();

          const links = {
            homepage,
            repository: parseURL(repository),
            issues: parseURL(bugs),
          };

          const sortedVersions = Object.keys(versions).sort(Semver.compare)
            .reverse();
          const app = renderSSR(
            <SsrRoot
              name={name}
              description={description}
              version={version}
              versions={sortedVersions}
              homepage={homepage}
              license={license}
              files={files}
              exports={filteredExport}
              readme={readmeHTML}
              keywords={keywords}
              downloads={downloads}
              created={created}
              updated={updated}
              type={type}
              types={types}
              features={features(packageJson)}
              links={links}
              maintainers={maintainers}
            />,
          );
          const { body, head, footer } = Helmet.SSR(app);
          /* Hack to SSR readme :! */
          const html = await generateHTML({
            template: "./shell.html",
            body,
            head,
            footer,
          });

          return new Response(html, {
            headers: pageServingHeaders,
          });
        } catch (e) {
          console.error(`Failed in generating package-page ${name}@${version}`);
          console.error(e);
          return new Response("500", { status: 500 });
        }
      }
    }

    return new Response("404", { status: 404 });
  } catch (error) {
    return new Response(error.message || error.toString(), { status: 500 });
  }
}

export { requestHandler };
