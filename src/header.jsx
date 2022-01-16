import { h, Helmet } from "nano-jsx";
import { Logo } from "./logo.js";
import { Search } from "./search.js";
import { Nav } from "./nav.js";

function Header() {
  return (
    <jspm-package-header>
      <header>
        <Logo />
        <Search />
        <Nav />
      </header>
      <Helmet>
        <style data-page-name="header">
          {`
          jspm-package-header header{
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            align-content: center;
          }
          `}
        </style>
      </Helmet>
    </jspm-package-header>
  );
}

export { Header };
