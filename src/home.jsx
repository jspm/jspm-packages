/** @jsx h */
import nano, { h } from "nano-jsx";
import { Header } from "@jspm/packages/header";
import { FeaturedPackages } from "@jspm/packages/featured-packages";
import { Footer } from "@jspm/packages/footer";

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
          
        `}
        </style>
      </Helmet>
    </jspm-home>
  );
}

export { Home };
