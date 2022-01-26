import { h, Helmet } from "nano-jsx";
import { Readme } from "./readme.js";
import { Aside } from "./aside.js";
import { Header } from "./header.js";
import { Footer } from "./footer.js";

function Package({
  name,
  description,
  keywords,
  version,
  homepage,
  license,
  files,
  exports,
  readme,
  stateHash
}) {
  return (
    <div>
      <Header />
      <jspm-package>
        <jspm-package-content>
          <h2>{stateHash}</h2>
          <Readme __html={readme} />
          <Aside
            version={version}
            name={name}
            license={license}
            files={files}
            exports={exports}
            keywords={keywords}
          />
        </jspm-package-content>
      </jspm-package>
      <Footer />

      <Helmet>
        <link
          rel="stylesheet"
          href="https://ga.jspm.io/npm:prismjs@1.25.0/themes/prism.css"
        />
        <style data-page="package-details">
          {`
        jspm-package-content {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          grid-gap: 1rem;
        }
        
        jspm-package-readme {
          display: block;
          padding: var(--dl-space-space-oneandhalfunits);
        }
        
        jspm-package-aside {
          padding: var(--dl-space-space-oneandhalfunits);
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
        `}
        </style>
      </Helmet>
    </div>
  );
}

export { Package };
