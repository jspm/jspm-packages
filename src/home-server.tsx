/** @jsx h */
import {
  contentType,
  lookup,
} from "https://deno.land/x/media_types@v2.12.3/mod.ts";
import nano, { h, renderSSR } from "nano-jsx";
import { pageServingHeaders } from "@jspm/packages/utils";
const { Helmet } = nano;




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
          <Home />
      );

      const { body, head, footer } = Helmet.SSR(indexPage);
      const html = await generateHTML({
        template: "./lib/composition-home.html",
        body,
        head,
        footer,
      });
      return new Response(html, {
        headers: pageServingHeaders,
      });
    }

    return new Response("404", { status: 404 });
  } catch (error) {
    return new Response(error.message || error.toString(), { status: 500 });
  }
}

export { requestHandler };
