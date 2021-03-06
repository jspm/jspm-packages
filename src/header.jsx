/** @jsx h */
import { h } from "nano-jsx";
import { Logo } from "@jspm/packages/logo";
import { Search } from "@jspm/packages/search";
import { Nav } from "@jspm/packages/nav";

function Header(
  { generatorHash = "", dependencies = [], open, toggleImportmapDialog, search=true },
) {
  return (
    <jspm-header>
      <header class="header">
        <div class="header">
          <Logo />
          {search && <Search />}
        </div>
        <Nav
          generatorHash={generatorHash}
          dependencies={dependencies}
          open={open}
          toggleImportmapDialog={toggleImportmapDialog}
        />
      </header>
    </jspm-header>
  );
}

export { Header };
