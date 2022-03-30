/** @jsx h */
import nano, { h } from "nano-jsx";
import { Logo } from "./logo.js";
import { Search } from "./search.js";
import { Nav } from "./nav.js";

const { Helmet } = nano;

function Header(
  { generatorHash = "", dependencies = [], open, toggleImportmapDialog },
) {
  return (
    <jspm-header>
      <header class="header">
        <div class="header">
          <Logo />
          <Search />
        </div>
        <div class="header">
        <Nav
          generatorHash={generatorHash}
          dependencies={dependencies}
          open={open}
          toggleImportmapDialog={toggleImportmapDialog}
        />
        </div>
      </header>
      <Helmet>
        <style data-component-name="header">
          {`

            jspm-header {
              width: 100%;
            }

            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              flex-wrap: wrap;
              align-content: center;
              margin: auto;
            }

            @media(max-width: 768px) {
              .header {
                justify-content: center;
              }
            }
          `}
        </style>
      </Helmet>
    </jspm-header>
  );
}

export { Header };
