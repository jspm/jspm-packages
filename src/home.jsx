import { h, Helmet } from "nano-jsx";
import { Header } from "./header.js";
import { FeaturedPackages } from "./featured-packages.js";
import { Footer } from "./footer.js";

function Home({ packages }) {
  return (
    <jspm-package-home>
      <jspm-package-home-header>
        <Header />
      </jspm-package-home-header>

      <jspm-package-home-main>
        <main>
          <FeaturedPackages packages={packages} />
        </main>
      </jspm-package-home-main>

      <jspm-package-home-footer>
        <Footer />
      </jspm-package-home-footer>

      <Helmet>
        <style data-page-name="jspm-package-home">
          {`
          
        `}
        </style>
      </Helmet>
    </jspm-package-home>
  );
}

export { Home };
