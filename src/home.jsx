/** @jsx h */
import nano, { h } from "nano-jsx";
import { Header } from "./header.js";
import { FeaturedPackages } from "./featured-packages.js";
import { Footer } from "./footer.js";

const { Helmet } = nano;

function Home({ packages }) {
  return (
    <jspm-home>
      <jspm-home-header>
        <Header />
      </jspm-home-header>

      <jspm-home-main>
        <main>
          <FeaturedPackages packages={packages} />
        </main>
      </jspm-home-main>

      <jspm-home-footer>
        <Footer />
      </jspm-home-footer>

      <Helmet>
        <style data-component-name="jspm-home">
          {`
            jspm-home {
              display: block;
              max-width: 1140px;
              margin: 0 auto;
            }
        `}
        </style>
      </Helmet>
    </jspm-home>
  );
}

export { Home };
