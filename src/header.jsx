/** @jsx h */
import { h } from "nano-jsx";
import { Logo } from "@jspm/packages/logo";
import { Search } from "@jspm/packages/search";
import { Nav } from "@jspm/packages/nav";

function Header(
  {
    generatorHash = "",
    dependencies = [],
    open,
    toggleImportmapDialog,
    search,
  },
) {
  return (
    <header>
      <jspm-packages-logo>
        <Logo />
      </jspm-packages-logo>

      {search && (
        <jspm-packages-search>
          <Search />
        </jspm-packages-search>
      )}
      <jspm-packages-nav>
        <Nav
          generatorHash={generatorHash}
          dependencies={dependencies}
          open={open}
          toggleImportmapDialog={toggleImportmapDialog}
        />
      </jspm-packages-nav>
    </header>
  );
}

export { Header };
