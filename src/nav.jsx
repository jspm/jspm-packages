import { h, Helmet } from "nano-jsx";

function Nav() {
  return (
    <div>
      <nav>
        <ul class="nav-list-style">
          <li class="nav-list-item">
            <a href="https://generator.jspm.io">Generator</a>
          </li>
          <li class="nav-list-item">
            <a href="https://jspm.org/docs/cdn">Docs</a>
          </li>
          <li class="nav-list-item">
            <a href="https://jspm.org/sandbox">Sandbox</a>
          </li>
          <li class="nav-list-item">
            <a href="https://github.com/jspm/generator">Github</a>
          </li>
        </ul>
      </nav>
      <Helmet>
        <style data-page-name="jspm-package-nav">
          {`
          .nav-list-style {
              display: flex;
              list-style: none;
          }

          .nav-list-item {
              margin-right: var(--dl-space-space-twounits);
          }
          `}
        </style>
      </Helmet>
    </div> 
  );
}
export { Nav };
