/** @jsx h */
import nano, { h } from "nano-jsx";
import { Header } from "@jspm/packages/header";
import { Search } from "@jspm/packages/search";

const { Helmet } = nano;

function Home({ packages }) {
  return (
    <jspm-home>
      <jspm-home-header>
        <Header search={false} />
      </jspm-home-header>

      <jspm-home-main>
        <main>
          <Search />
        </main>
      </jspm-home-main>

      <Helmet>
        <style data-component-name="jspm-home">
          {`
          
          jspm-home{
            display: block;
            max-width: 1140px;
            margin: 0 auto;
          }
          jspm-home jspm-search {
            display: flex;
            align-content: center;
            justify-content: center;
            align-items: center;
            min-height: 60vh;
          }
          jspm-home jspm-search input[type="search"] {
            width: 80vw;
          }
        `}
        </style>
      </Helmet>
    </jspm-home>
  );
}

export { Home };
