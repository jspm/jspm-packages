/** @jsx h */
import { h } from "nano-jsx";
import { Logo } from "@jspm/packages/logo";
import { Search } from "@jspm/packages/search";
import { Nav } from "@jspm/packages/nav";

type Prop = {
  search?: boolean;
};

function Header({ search }: Prop) {
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
        <Nav />
      </jspm-packages-nav>
    </header>
  );
}

export { Header };
