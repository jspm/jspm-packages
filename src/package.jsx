import { h, Helmet } from "https://ga.jspm.io/npm:nano-jsx@0.0.27/lib/index.js";
import { PackageHeader } from "./package-header.js";
import { Readme } from "./readme.js";
import { Aside } from "./aside.js";
import { Header } from "./header.js";
import { Footer } from "./footer.js";

export function Package(props) {
  const {
    name,
    description,
    keywords,
    version,
    homepage,
    license,
    files,
    exports,
    readme,
  } = props;

  return (
    <div>
      <Header />
      <jspm-package>
        <PackageHeader homepage={homepage || ""} name={name} description={description} version={version} />
        <jspm-package-content>
          <Readme __html={readme}/>
          <Aside
            version={version}
            name={name}
            license={license}
            files={files}
            exports={exports}
            keywords={keywords}/>
        </jspm-package-content>
      </jspm-package>
      <Footer />

      <Helmet>
        <style data-page="package-details">{`
        jspm-package-content {
          display: flex;
          flex-direction: row;
          flex-wrap: wrap;
        }
        
        jspm-package-readme {
          display: block;
          width: 800px;
          padding: var(--dl-space-space-oneandhalfunits);
        }
        
        jspm-package-aside {
          width: 300px;
          padding-left: var(--dl-space-space-unit);
        }
        
        jspm-package-name,
        jspm-package-version,
        jspm-package-description,
        jspm-package-license {
          display: block;
        }
        
        jspm-package-name h1 {
          font-family: "Major Mono Display", monospace;
          font-size: var(--step-5);
        }
        
        jspm-package-name h1 a {
          color: black;
        }

        @media(max-width: 767px) {
          jspm-package-content {
            justify-content: space-between;
          }

          jspm-package-readme {
            width: 100%;
          }
        }
        `}</style>
      </Helmet>
    </div>
  );
}
