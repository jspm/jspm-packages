/** @jsx h */
import { h } from "nano-jsx";
import { Logo } from "#logo";
import { Search } from "#search";
import { Nav } from "#nav";

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
