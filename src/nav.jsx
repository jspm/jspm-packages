import { h, Helmet } from "nano-jsx";

function Nav() {
  return (
    <jspm-package-nav>
      <nav>
        <ul>
          <li>
            <a href="https://generator.jspm.io">Generator</a>
          </li>
          <li>
            <a href="https://jspm.org/docs/cdn">Docs</a>
          </li>
          <li>
            <a href="https://jspm.org/sandbox">Sandbox</a>
          </li>
          <li>
            <a href="https://github.com/jspm/generator">Github</a>
          </li>
        </ul>
      </nav>
      <Helmet>
        <style data-page-name="jspm-package-nav">
          {`
          jspm-package-nav nav ul {
              display: flex;
            list-style: none;
          }
          jspm-package-nav nav ul li{
              margin: 20px;
          }
          `}
        </style>
      </Helmet>
    </jspm-package-nav>
  );
}
export { Nav };
