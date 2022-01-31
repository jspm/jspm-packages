/** @jsx h */
import { h, Helmet } from "nano-jsx";
import { Logo } from "./logo.js";
import { Search } from "./search.js";
import { Nav } from "./nav.js";

function Header() {
  return (
    <jspm-header>
      <header class="header">
        <div class="header">
          <Logo />
          <Search />
        </div>
        <Nav />
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
