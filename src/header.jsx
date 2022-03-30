/** @jsx h */
import nano, { h } from "nano-jsx";
import { Logo } from "@jspm/packages/logo";
import { Search } from "@jspm/packages/search";
import { Nav } from "@jspm/packages/nav";

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
        <Nav
          generatorHash={generatorHash}
          dependencies={dependencies}
          open={open}
          toggleImportmapDialog={toggleImportmapDialog}
        />
      </header>
      <Helmet>
        <style data-component-name="header">
          {`
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
          `}
        </style>
      </Helmet>
    </jspm-header>
  );
}

export { Header };
