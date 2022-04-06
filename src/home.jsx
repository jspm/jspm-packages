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
          <jspm-home-hero>
            <h1>A CDN to serve NPM packages as standard ECMA Script &amp; Importmaps.</h1>
            <Search />
          </jspm-home-hero>
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
          jspm-home-hero h1{
            text-align: center;
            font-size: var(--step-5);
          }
          jspm-home jspm-search {
            display: flex;
            align-content: center;
            justify-content: center;
            align-items: center;
          }
          jspm-home jspm-search input[type="search"] {
            width: 80vw;
          }
          jspm-home-hero{
            margin-bottom: 50px;
          }
          jspm-home-hero .search_button{
            height: 70px;
          }
          jspm-home-hero .search_input{
            height: 70px;
            padding: var(--dl-space-space-halfunit) 70px;
            font-size: var(--step-0);
            background: url('/npm-n-block-32.jpeg') no-repeat 18px center;
          }
        `}
        </style>
      </Helmet>
    </jspm-home>
  );
}

export { Home };
